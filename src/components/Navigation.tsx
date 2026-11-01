import React, { useEffect } from 'react';
import {
  FileText,
  BookOpen,
  Users,
  Settings,
  LayoutDashboard,
  Plus,
  Sliders,
  Receipt,
} from 'lucide-react';
import { DocumentType, OwnerAccount } from '../types';

export type TabType = 'home' | 'documents' | 'glossary' | 'customers' | 'formats' | 'settings';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onNewDocument: (type: DocumentType) => void;
  businessName: string;
  ownerAccount?: OwnerAccount;
  onOpenOwnerAccount?: () => void;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: LayoutDashboard,
    tooltip: 'Dashboard Overview',
  },
  {
    id: 'documents',
    label: 'Quotes & Bills',
    icon: FileText,
    tooltip: 'Quotations and Tax Invoices',
  },
  {
    id: 'glossary',
    label: 'Pipe Catalog',
    icon: BookOpen,
    tooltip: 'Pipe Fittings, Valves & Joints Glossary',
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    tooltip: 'Customer & Project Sites Directory',
  },
  {
    id: 'formats',
    label: 'Letterhead',
    icon: Sliders,
    tooltip: 'P.H.D Contractor Letterhead Style',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    tooltip: 'Business Profile & Bank Details',
  },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onNewDocument,
  businessName,
}) => {
  // Clicking an active menu item toggles back to 'home'
  const handleItemClick = (tab: TabType) => {
    if (currentTab === tab && tab !== 'home') {
      onSelectTab('home');
    } else {
      onSelectTab(tab);
    }
  };

  // Keyboard shortcut listener (Alt+1 through Alt+6, Alt+Q, Alt+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          handleItemClick('home');
        } else if (e.key === '2') {
          e.preventDefault();
          handleItemClick('documents');
        } else if (e.key === '3') {
          e.preventDefault();
          handleItemClick('glossary');
        } else if (e.key === '4') {
          e.preventDefault();
          handleItemClick('customers');
        } else if (e.key === '5') {
          e.preventDefault();
          handleItemClick('formats');
        } else if (e.key === '6') {
          e.preventDefault();
          handleItemClick('settings');
        } else if (e.key.toLowerCase() === 'q') {
          e.preventDefault();
          onNewDocument('quotation');
        } else if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          onNewDocument('bill');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, onSelectTab, onNewDocument]);

  return (
    <>
      {/* Simple, Clean Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* Left: Brand Icon & Title */}
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 text-left group shrink-0"
            title="Return to Home Dashboard"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
              PQ
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors block leading-tight">
                PlumbQuotes
              </span>
              <span className="text-[11px] text-slate-500 block leading-none">
                {businessName || 'P.H.D Contractor'}
              </span>
            </div>
          </button>

          {/* Center: Clean Icon Navigation Buttons */}
          <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  title={
                    isActive && item.id !== 'home'
                      ? `${item.tooltip} (Click again to return Home)`
                      : item.tooltip
                  }
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-9 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-xs border border-sky-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5] text-sky-700' : 'stroke-[1.8]'}`} />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Quick Action CTAs */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onNewDocument('quotation')}
              className="h-8 sm:h-9 px-2.5 sm:px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs active:scale-95 transition-all"
              title="Create New Quotation"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">New Quote</span>
              <span className="sm:hidden text-[11px]">Quote</span>
            </button>

            <button
              onClick={() => onNewDocument('bill')}
              className="h-8 sm:h-9 px-2.5 sm:px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs active:scale-95 transition-all"
              title="Create New Bill"
            >
              <Receipt className="w-3.5 h-3.5 stroke-[2]" />
              <span className="hidden sm:inline">New Bill</span>
              <span className="sm:hidden text-[11px]">Bill</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around h-15"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] px-1 py-1 rounded-lg transition-all ${
                isActive
                  ? 'text-sky-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'stroke-[2.5] text-sky-700 scale-110' : 'stroke-[1.8]'
                }`}
              />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
