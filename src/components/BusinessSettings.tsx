import React, { useRef, useState } from 'react';
import {
  Building,
  CreditCard,
  QrCode,
  FileText,
  Sliders,
  Download,
  Upload,
  Check,
  RotateCcw,
  Languages,
  PenTool,
  Save,
} from 'lucide-react';
import { BusinessProfile, LanguageCode } from '../types';
import { storage } from '../services/storage';

interface BusinessSettingsProps {
  profile: BusinessProfile;
  onSaveProfile: (profile: BusinessProfile) => void;
  onDataRestored: () => void;
}

export const BusinessSettings: React.FC<BusinessSettingsProps> = ({
  profile,
  onSaveProfile,
  onDataRestored,
}) => {
  const [formData, setFormData] = useState<BusinessProfile>(profile);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleChange = (field: keyof BusinessProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleAddTerm = () => {
    if (!newTerm.trim()) return;
    setFormData((prev) => ({
      ...prev,
      defaultTerms: [...prev.defaultTerms, newTerm.trim()],
    }));
    setNewTerm('');
  };

  const handleRemoveTerm = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      defaultTerms: prev.defaultTerms.filter((_, i) => i !== index),
    }));
  };

  // Export Backup File
  const handleExportBackup = () => {
    const json = storage.exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `plumbquote_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Restore Backup File
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const success = storage.restoreBackupJSON(text);
      if (success) {
        alert('All data restored successfully!');
        onDataRestored();
      } else {
        alert('Failed to restore backup file. Invalid format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-28">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Business Profile &amp; Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Customize company details, UPI QR code, document numbering, and offline backup
          </p>
        </div>

        {showSavedToast && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Business Identity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <Building className="w-5 h-5 text-purple-700" />
              <h3 className="font-bold text-sm text-slate-900">1. Plumbing Contractor Information</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  name: 'PARESWAR ROUT',
                  tagline: 'P.H.D Contractor',
                  address: 'At - Kalarahanga, Patia',
                  cityStatePincode: 'Bhubaneswar, Odisha - 751024',
                  phone: '+91 94370 12345',
                  logoUrl: '/shiva-logo.svg',
                }));
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-semibold hover:bg-purple-100 transition-colors flex items-center gap-1.5"
            >
              <img src="/shiva-logo.svg" alt="Shiva Logo" className="w-4 h-4 object-contain inline" />
              <span>Load Pareswar Rout Defaults</span>
            </button>
          </div>

          {/* Logo Preview Bar */}
          <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
            <img
              src={formData.logoUrl || '/shiva-logo.svg'}
              alt="Official Logo"
              className="w-12 h-12 object-contain rounded-full border border-purple-200 bg-white p-0.5"
            />
            <div className="text-xs">
              <p className="font-bold text-slate-900">Official Letterhead Logo (Lord Shiva Emblem)</p>
              <p className="text-slate-500">Appears on top left of official quotations and bills</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Business / Plumber Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-semibold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Address / Shop No</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                City, State &amp; Pincode
              </label>
              <input
                type="text"
                value={formData.cityStatePincode}
                onChange={(e) => handleChange('cityStatePincode', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Primary Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alternate Phone</label>
              <input
                type="text"
                value={formData.alternatePhone || ''}
                onChange={(e) => handleChange('alternatePhone', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                GSTIN (Optional for small plumbers)
              </label>
              <input
                type="text"
                value={formData.gstin || ''}
                onChange={(e) => handleChange('gstin', e.target.value)}
                placeholder="e.g. 21ABCDE1234F1Z5"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">PAN Number</label>
              <input
                type="text"
                value={formData.pan || ''}
                onChange={(e) => handleChange('pan', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Bank & UPI Payment Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <CreditCard className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-sm text-slate-900">
              2. Bank Account &amp; UPI Payment Setup
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="e.g. State Bank of India"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                placeholder="Account No."
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => handleChange('ifscCode', e.target.value)}
                placeholder="e.g. SBIN0001234"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                UPI ID (For Google Pay / PhonePe / Paytm payments)
              </label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => handleChange('upiId', e.target.value)}
                placeholder="e.g. plumber@upi"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-medium text-sky-800"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Number Series & Formatting */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-sm text-slate-900">
              3. Automatic Numbering &amp; Defaults
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quotation Prefix</label>
              <input
                type="text"
                value={formData.quotationPrefix}
                onChange={(e) => handleChange('quotationPrefix', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bill / Invoice Prefix</label>
              <input
                type="text"
                value={formData.billPrefix}
                onChange={(e) => handleChange('billPrefix', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Financial Year</label>
              <input
                type="text"
                value={formData.financialYear}
                onChange={(e) => handleChange('financialYear', e.target.value)}
                placeholder="2026-27"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Document Language</label>
              <select
                value={formData.defaultLanguage}
                onChange={(e) =>
                  handleChange('defaultLanguage', e.target.value as LanguageCode)
                }
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-medium"
              >
                <option value="en">English (Standard)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="or">Odia (ଓଡ଼ିଆ)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 pt-6">
              <input
                type="checkbox"
                id="defaultGst"
                checked={formData.enableGstByDefault}
                onChange={(e) => handleChange('enableGstByDefault', e.target.checked)}
                className="w-4 h-4 rounded text-sky-600"
              />
              <label htmlFor="defaultGst" className="text-xs font-semibold text-slate-800">
                Enable GST calculation by default for new documents
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Terms and Conditions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-sm text-slate-900">4. Default Terms &amp; Conditions</h3>
          </div>

          <div className="space-y-2 text-xs">
            {formData.defaultTerms.map((term, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 gap-2"
              >
                <span className="text-slate-700 leading-snug">
                  {idx + 1}. {term}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveTerm(idx)}
                  className="text-red-500 hover:text-red-700 p-1 shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Add custom warranty, payment terms, or civil work policy..."
                className="flex-1 h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs"
              />
              <button
                type="button"
                onClick={handleAddTerm}
                className="px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shrink-0"
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Section 5: Offline Backup & Restore */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Download className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                5. 100% Offline Backup &amp; Device Transfer
              </h3>
              <p className="text-xs text-slate-500">
                Export all customers, rates, and bills to a single file. Restore on any new Android phone in one tap.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Export Backup</h4>
              <p className="text-slate-500">
                Download all data to phone storage or share over WhatsApp / Drive.
              </p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center justify-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Export Full Backup (.json)</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Restore from Backup</h4>
              <p className="text-slate-500">
                Select a previously saved backup file to restore all documents.
              </p>
              <label className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs">
                <Upload className="w-4 h-4" />
                <span>Choose Backup File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="h-11 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
