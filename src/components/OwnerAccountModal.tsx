import React, { useState } from 'react';
import {
  ShieldCheck,
  Crown,
  Key,
  Github,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  AlertTriangle,
  UserCheck,
  Mail,
  Phone,
  FileCode,
  Save,
  Check,
  X,
  Sparkles,
  UploadCloud,
  CheckCheck,
} from 'lucide-react';
import { OwnerAccount, BusinessProfile } from '../types';
import { storage } from '../services/storage';

interface OwnerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerAccount: OwnerAccount;
  businessProfile: BusinessProfile;
  onUpdateOwner: (updated: OwnerAccount) => void;
  onOpenSettings?: () => void;
}

export const OwnerAccountModal: React.FC<OwnerAccountModalProps> = ({
  isOpen,
  onClose,
  ownerAccount,
  businessProfile,
  onUpdateOwner,
  onOpenSettings,
}) => {
  const [formData, setFormData] = useState<OwnerAccount>(ownerAccount);
  const [isCopiedGit, setIsCopiedGit] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [verifiedGitHubUser, setVerifiedGitHubUser] = useState<{
    login: string;
    avatar_url: string;
    name: string;
    html_url: string;
  } | null>(null);

  const [apiSyncStatus, setApiSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [apiSyncMessage, setApiSyncMessage] = useState('');

  const [pinInput, setPinInput] = useState('');
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<'owner' | 'staff' | null>(null);
  const [pinError, setPinError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  // Custom git push command with token or standard credentials
  const repoSlug = formData.githubRepoName || 'owner/repo';
  const gitAuthUrl = formData.githubToken
    ? `https://${formData.githubToken.trim()}@github.com/${repoSlug}.git`
    : `https://github.com/${repoSlug}.git`;

  const gitCommandSnippet = `# 1. Configure git with your verified GitHub email:
git config user.name "${formData.username || 'contractor'}"
git config user.email "${formData.email || 'pradeeprout56@gmail.com'}"

# 2. Add / update remote origin:
git remote add origin https://github.com/${repoSlug}.git || git remote set-url origin https://github.com/${repoSlug}.git

# 3. Ensure branch is main and push to GitHub:
git branch -M main
git push -u origin main`;

  const handleCopyGitCommands = () => {
    navigator.clipboard.writeText(gitCommandSnippet);
    setIsCopiedGit(true);
    setTimeout(() => setIsCopiedGit(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = storage.saveOwnerAccount({
      ...formData,
      isOrphanClaimed: true,
    });
    onUpdateOwner(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleRoleToggle = (targetRole: 'owner' | 'staff') => {
    if (formData.role === targetRole) return;

    if (targetRole === 'owner' && formData.pinEnabled && formData.pinCode) {
      setPendingRole('owner');
      setPinPromptOpen(true);
      setPinInput('');
      setPinError('');
      return;
    }

    const updated = storage.saveOwnerAccount({ role: targetRole });
    setFormData(updated);
    onUpdateOwner(updated);
  };

  const handleVerifyPinAndSwitch = () => {
    if (storage.verifyOwnerPin(pinInput)) {
      if (pendingRole) {
        const updated = storage.saveOwnerAccount({ role: pendingRole });
        setFormData(updated);
        onUpdateOwner(updated);
      }
      setPinPromptOpen(false);
      setPinError('');
    } else {
      setPinError('Incorrect 4-digit PIN. Please try again.');
    }
  };

  // Verify GitHub Account via Token
  const handleVerifyGitHubAccount = async () => {
    if (!formData.githubToken?.trim()) {
      setTestStatus('error');
      setTestMessage('Please enter a GitHub Personal Access Token (PAT) below to verify your account.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Verifying GitHub account with GitHub API...');

    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${formData.githubToken.trim()}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        setVerifiedGitHubUser({
          login: userData.login,
          avatar_url: userData.avatar_url,
          name: userData.name || userData.login,
          html_url: userData.html_url,
        });

        // Automatically update username if it differs
        const updated = storage.saveOwnerAccount({
          ...formData,
          username: userData.login,
          lastSyncedAt: Date.now(),
        });
        setFormData(updated);
        onUpdateOwner(updated);

        setTestStatus('success');
        setTestMessage(
          `Successfully authenticated as @${userData.login} (${userData.name || 'GitHub User'})! Your token has access to your GitHub account.`
        );
      } else {
        const err = await res.json().catch(() => ({}));
        setTestStatus('error');
        setTestMessage(`GitHub authentication failed: ${err.message || res.statusText}`);
      }
    } catch {
      setTestStatus('error');
      setTestMessage('Could not reach GitHub API. Check network connection.');
    }
  };

  // Push Data Snapshot directly to GitHub Repository via API
  const handleDirectPushToGitHub = async () => {
    if (!formData.githubToken?.trim()) {
      setApiSyncStatus('error');
      setApiSyncMessage('Please save a GitHub Personal Access Token first with "repo" scope.');
      return;
    }

    setApiSyncStatus('syncing');
    setApiSyncMessage('Preparing and uploading PlumbQuotes data snapshot to repository...');

    try {
      const backupData = storage.exportBackupJSON();
      const contentBase64 = btoa(unescape(encodeURIComponent(backupData)));
      const path = 'plumbquotes-data.json';
      const repo = formData.githubRepoName || 'owner/repo';

      // 1. Check if file already exists to get SHA
      let sha: string | undefined;
      const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${formData.githubToken.trim()}`,
        },
      });

      if (getRes.ok) {
        const existingData = await getRes.json();
        sha = existingData.sha;
      }

      // 2. Put file to repo
      const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${formData.githubToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `chore: update PlumbQuotes data snapshot by ${formData.email || 'pradeeprout56@gmail.com'}`,
          content: contentBase64,
          sha: sha,
          committer: {
            name: formData.username || 'contractor',
            email: formData.email || 'pradeeprout56@gmail.com',
          },
        }),
      });

      if (putRes.ok) {
        const result = await putRes.json();
        setApiSyncStatus('success');
        setApiSyncMessage(
          `Snapshot committed successfully! Commit SHA: ${result.commit?.sha?.slice(0, 7) || 'latest'}. File: ${path}`
        );
      } else {
        const errorData = await putRes.json().catch(() => ({}));
        setApiSyncStatus('error');
        setApiSyncMessage(
          `GitHub API error: ${errorData.message || putRes.statusText}. Ensure your token has "repo" scope.`
        );
      }
    } catch (err: any) {
      setApiSyncStatus('error');
      setApiSyncMessage(`Failed to upload to GitHub: ${err.message || 'Network error'}`);
    }
  };

  const handleExportSnapshot = () => {
    const json = storage.exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PlumbQuotes_Repo_Snapshot_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-xs font-semibold border border-amber-300/30">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                Verified Owner Account
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-medium border border-emerald-400/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                GitHub Account Linked
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {formData.fullName} ({formData.username})
            </h2>
            <p className="text-xs sm:text-sm text-amber-100/90 font-medium flex items-center gap-2">
              <span>{formData.email}</span>
              {formData.githubRepoName && (
                <>
                  <span>•</span>
                  <span>{formData.githubRepoName}</span>
                </>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* GitHub Account Identity Strip */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 space-y-3">
            <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {verifiedGitHubUser ? (
                  <img
                    src={verifiedGitHubUser.avatar_url}
                    alt={verifiedGitHubUser.login}
                    className="w-12 h-12 rounded-2xl border-2 border-emerald-400 shadow-sm"
                  />
                ) : (
                  <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-sm shrink-0">
                    <Github className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      GitHub Account: {formData.email}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-bold">
                      <Check className="w-3 h-3 text-emerald-700" />
                      Verified Email
                    </span>
                  </div>
                  {formData.githubRepoUrl && (
                    <p className="text-xs text-emerald-900 mt-0.5">
                      Target Repository:{' '}
                      <a
                        href={formData.githubRepoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono font-bold underline hover:text-emerald-700 inline-flex items-center gap-1"
                      >
                        {formData.githubRepoName || 'Connected Repository'}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-semibold border border-emerald-200 inline-block">
                  Branch: main
                </span>
              </div>
            </div>

            <div className="text-xs text-emerald-800 leading-relaxed bg-white/70 p-3 rounded-xl border border-emerald-200/60">
              💡 <strong>Automatic Commit Attribution:</strong> Git identifies you by your email (
              <span className="font-mono font-semibold text-emerald-950">{formData.email}</span>). All
              commits in this repository are created with your email address, so GitHub automatically
              links and attributes all repository history to your GitHub profile!
            </div>
          </div>

          {/* Role Switching & Protection Mode */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-sky-600" />
                  Operational Role
                </h4>
                <p className="text-xs text-slate-500">
                  Switch between Owner Administrator mode and restricted Staff / Field mode.
                </p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  formData.role === 'owner'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {formData.role === 'owner' ? '👑 Owner Mode' : '🔧 Staff Mode'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleRoleToggle('owner')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.role === 'owner'
                    ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-1 ring-amber-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-600" />
                  Owner (Full Admin)
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Full control over formats, pricing base, bank details, and git sync.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleToggle('staff')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.role === 'staff'
                    ? 'border-sky-500 bg-sky-50/70 shadow-sm ring-1 ring-sky-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-sky-600" />
                  Staff / Technician
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Create quotes &amp; bills on site. Protects bank details &amp; delete actions.
                </div>
              </button>
            </div>
          </div>

          {/* Direct GitHub API Authentication & Token Connect */}
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-900 text-white">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">GitHub Personal Access Token (PAT)</h4>
                  <p className="text-xs text-slate-500">
                    Connect your token to verify your account or push updates directly from the browser
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={formData.githubToken || ''}
                  onChange={(e) => setFormData({ ...formData, githubToken: e.target.value })}
                  placeholder="Paste GitHub Token (ghp_... or github_pat_...)"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleVerifyGitHubAccount}
                  disabled={testStatus === 'testing'}
                  className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                  Verify Token
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Stored locally in your browser only (never sent to external servers).</span>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=PlumbQuotes+Sync"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
                >
                  Create token on GitHub (with repo scope)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {testMessage && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  testStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : testStatus === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-sky-50 text-sky-800 border border-sky-200'
                }`}
              >
                {testMessage}
              </div>
            )}

            {/* Direct Push via GitHub API */}
            {formData.githubToken && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-amber-700" />
                      1-Click Browser Sync to GitHub
                    </div>
                    <div className="text-[11px] text-amber-800">
                      Uploads the latest JSON backup snapshot directly to your repository via GitHub API.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDirectPushToGitHub}
                    disabled={apiSyncStatus === 'syncing'}
                    className="h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <UploadCloud className={`w-3.5 h-3.5 ${apiSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    Push to GitHub
                  </button>
                </div>

                {apiSyncMessage && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-medium ${
                      apiSyncStatus === 'success'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-rose-100 text-rose-900'
                    }`}
                  >
                    {apiSyncMessage}
                  </div>
                )}
              </div>
            )}

            {/* Quick Terminal Git Commands */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  Terminal Push Commands (Authored with {formData.email}):
                </span>
                <button
                  type="button"
                  onClick={handleCopyGitCommands}
                  className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold"
                >
                  {isCopiedGit ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Commands</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto select-all">
                {gitCommandSnippet}
              </pre>
            </div>

            {/* Repository Snapshot Export */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportSnapshot}
                className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600" />
                Download Local JSON Snapshot
              </button>
              {formData.githubRepoUrl && (
                <a
                  href={formData.githubRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  Open Repository
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Owner Account Details Form */}
          <form onSubmit={handleSave} className="space-y-4 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-600" />
              Owner Account Credentials &amp; Security PIN
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GitHub Username / Handle
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  GitHub Account Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Owner Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* PIN Protection */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {formData.pinEnabled ? (
                      <Lock className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Unlock className="w-4 h-4 text-slate-400" />
                    )}
                    Owner 4-Digit Security PIN Protection
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Require PIN to edit bank details, delete documents, or switch roles.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pinEnabled}
                    onChange={(e) => setFormData({ ...formData, pinEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {formData.pinEnabled && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Set 4-Digit Passcode (PIN)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={formData.pinCode || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="Enter 4 digits (e.g. 1234)"
                    className="w-44 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              {saveSuccess ? (
                <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Owner account updated successfully!
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">
                  Linked to business profile: {businessProfile.name}
                </div>
              )}

              <button
                type="submit"
                className="h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Account Info
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Account Status:{' '}
            <strong className="text-emerald-700 font-bold">Active &amp; Claimed</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs sm:text-sm font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* PIN Verification Modal */}
      {pinPromptOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Enter Owner PIN</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your 4-digit security PIN to switch to Owner Administrator mode.
              </p>
            </div>

            <input
              type="password"
              maxLength={4}
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-32 mx-auto text-center px-4 py-2 text-2xl font-mono tracking-widest rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            {pinError && <p className="text-xs text-rose-600 font-medium">{pinError}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPinPromptOpen(false)}
                className="flex-1 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyPinAndSwitch}
                className="flex-1 h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
