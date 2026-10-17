import React from 'react';
import {
  FileText,
  BookOpen,
  Users,
  Settings,
  LayoutDashboard,
  Plus,
  WifiOff,
  Sliders,
} from 'lucide-react';
import { DocumentType } from '../types';

export type TabType = 'home' | 'documents' | 'glossary' | 'customers' | 'formats' | 'settings';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onNewDocument: (type: DocumentType) => void;
  businessName: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onNewDocument,
  businessName,
}) => {
  return (
    <>
      {/* Mobile & Desktop Header Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          {/* Brand Wordmark & Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-500 flex items-center justify-center text-white shadow-sm font-bold text-base">
                PQ
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-tight">
                  PlumbQuote
                </h1>
                <p className="text-[11px] text-slate-500 truncate max-w-[150px] sm:max-w-xs font-medium">
                  {businessName || 'Plumbing Quotation & Bill'}
                </p>
              </div>
            </button>

            {/* Offline Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>100% Offline Ready</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => onSelectTab('home')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentTab === 'home'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onSelectTab('documents')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentTab === 'documents'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Quotes &amp; Bills
            </button>
            <button
              onClick={() => onSelectTab('glossary')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentTab === 'glossary'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Plumbing Items
            </button>
            <button
              onClick={() => onSelectTab('customers')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentTab === 'customers'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => onSelectTab('formats')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentTab === 'formats'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Letterhead Formats
            </button>
            <button
              onClick={() => onSelectTab('settings')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentTab === 'settings'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Settings
            </button>
          </nav>

          {/* Quick Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNewDocument('quotation')}
              className="h-9 px-3 sm:px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Quotation</span>
            </button>
            <button
              onClick={() => onNewDocument('bill')}
              className="hidden sm:flex h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Bill</span>
            </button>
          </div>
        </div>
      </header>

      {/* Android Mobile Bottom Tab Bar (Thumbs-optimized, 60px height, safe padding) */}
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around h-16">
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all ${
            currentTab === 'home'
              ? 'text-sky-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
        </button>

        <button
          onClick={() => onSelectTab('documents')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all ${
            currentTab === 'documents'
              ? 'text-sky-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className={`w-5 h-5 ${currentTab === 'documents' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Documents</span>
        </button>

        <button
          onClick={() => onSelectTab('glossary')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all ${
            currentTab === 'glossary'
              ? 'text-sky-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${currentTab === 'glossary' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Items</span>
        </button>

        <button
          onClick={() => onSelectTab('customers')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all ${
            currentTab === 'customers'
              ? 'text-sky-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className={`w-5 h-5 ${currentTab === 'customers' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Customers</span>
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all ${
            currentTab === 'settings'
              ? 'text-sky-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className={`w-5 h-5 ${currentTab === 'settings' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Settings</span>
        </button>
      </nav>
    </>
  );
};
