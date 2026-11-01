import React from 'react';
import {
  FileText,
  Plus,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Share2,
  Wrench,
  Search,
  BookOpen,
  Layers,
  ChevronRight,
  Crown,
  Github,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { DocumentType, OwnerAccount, QuotationBillDocument } from '../types';
import { calculateDocumentTotals } from '../utils/calculations';
import { formatINR } from '../utils/numberToWords';

interface HomeDashboardProps {
  documents: QuotationBillDocument[];
  businessName: string;
  ownerAccount?: OwnerAccount;
  onOpenOwnerAccount?: () => void;
  onNewDocument: (type: DocumentType) => void;
  onOpenDocument: (doc: QuotationBillDocument) => void;
  onViewAllDocuments: () => void;
  onNavigateTab: (tab: 'documents' | 'glossary' | 'customers' | 'formats' | 'settings') => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  documents,
  businessName,
  ownerAccount,
  onOpenOwnerAccount,
  onNewDocument,
  onOpenDocument,
  onViewAllDocuments,
  onNavigateTab,
}) => {
  // Aggregate Metrics
  let totalBilledPaise = 0;
  let totalPendingPaise = 0;
  let pendingCount = 0;
  let activeQuotationsCount = 0;
  let acceptedQuotationsCount = 0;

  documents.forEach((d) => {
    const calcs = calculateDocumentTotals({
      lines: d.lines,
      discountType: d.discountType,
      discountValue: d.discountValue,
      isTaxEnabled: d.isTaxEnabled,
      isInterState: d.isInterState,
      isPriceTaxInclusive: d.isPriceTaxInclusive,
      advancePaidPaise: d.advancePaidPaise,
      payments: d.payments,
    });

    if (d.type === 'bill') {
      totalBilledPaise += calcs.grandTotalPaise;
      if (calcs.balanceDuePaise > 0) {
        totalPendingPaise += calcs.balanceDuePaise;
        pendingCount++;
      }
    } else {
      if (d.status === 'sent' || d.status === 'draft') {
        activeQuotationsCount++;
      }
      if (d.status === 'accepted') {
        acceptedQuotationsCount++;
      }
    }
  });

  const recentDocuments = [...documents]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
      {/* Welcome & Site Action Strip */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle decorative background water rings */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Wrench className="w-64 h-64 -rotate-12" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="text-xs uppercase font-bold tracking-wider text-sky-200">
            Field Plumbing Generator
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Fast, Error-Free Plumbing Quotes &amp; Bills On-Site
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 leading-relaxed max-w-xl">
            Produce accurate quotations and GST invoices in under 2 minutes. Works 100% offline with no network.
          </p>

          {/* Large Touch Target Primary Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onNewDocument('quotation')}
              className="h-12 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-sky-700" />
              <span>New Quotation</span>
            </button>

            <button
              onClick={() => onNewDocument('bill')}
              className="h-12 px-5 rounded-2xl bg-sky-500/30 hover:bg-sky-500/40 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-sky-400/40 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-sky-200" />
              <span>New Cash/GST Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Owner Account & Repository Status Strip */}
      <div className="bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-sm shrink-0 font-bold">
            <Crown className="w-5 h-5 text-amber-100" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base">
                Owner Account: {ownerAccount?.fullName || 'P.H.D Contractor'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Active
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="text-emerald-700 font-medium">Offline Storage Ready</span>
              <span>•</span>
              <span className="text-slate-500">Letterhead: P.H.D Contractor Official Style</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenOwnerAccount && (
            <button
              type="button"
              onClick={onOpenOwnerAccount}
              className="h-9 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Crown className="w-3.5 h-3.5" />
              Manage Account
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Billed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Billed
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 tabular-nums">
            {formatINR(totalBilledPaise)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">Invoices generated</div>
        </div>

        {/* Pending Dues */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Pending Dues
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-red-600 tabular-nums">
            {formatINR(totalPendingPaise)}
          </div>
          <div className="text-[11px] text-slate-500">{pendingCount} bills pending balance</div>
        </div>

        {/* Active Quotations */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Active Quotes
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-sky-700 tabular-nums">
            {activeQuotationsCount}
          </div>
          <div className="text-[11px] text-slate-500">Estimates sent to clients</div>
        </div>

        {/* Accepted Quotes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Approved Jobs
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 tabular-nums">
            {acceptedQuotationsCount}
          </div>
          <div className="text-[11px] text-slate-500">Ready for billing &amp; work</div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onNavigateTab('glossary')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-xs transition-all flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-semibold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-sky-700">
                Plumbing Glossary
              </h4>
              <p className="text-[11px] text-slate-500">50+ pipes, fittings &amp; rates</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-700 group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={() => onNavigateTab('formats')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-xs transition-all flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-semibold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-sky-700">
                Letterhead Formats
              </h4>
              <p className="text-[11px] text-slate-500">Option A upload &amp; Option B</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-700 group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={() => onNavigateTab('customers')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-xs transition-all flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-semibold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-sky-700">
                Customer Ledger
              </h4>
              <p className="text-[11px] text-slate-500">Site addresses &amp; dues</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-700 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* Recent Documents Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">Recent Quotations &amp; Bills</h3>
            <p className="text-xs text-slate-500">Tap any item to view, print or share on WhatsApp</p>
          </div>

          <button
            onClick={onViewAllDocuments}
            className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentDocuments.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-slate-400">
            No quotations or bills created yet. Tap &quot;New Quotation&quot; to begin!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentDocuments.map((doc) => {
              const calcs = calculateDocumentTotals({
                lines: doc.lines,
                discountType: doc.discountType,
                discountValue: doc.discountValue,
                isTaxEnabled: doc.isTaxEnabled,
                isInterState: doc.isInterState,
                isPriceTaxInclusive: doc.isPriceTaxInclusive,
                advancePaidPaise: doc.advancePaidPaise,
                payments: doc.payments,
              });

              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenDocument(doc)}
                  className="py-3 px-2 rounded-xl hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 group-hover:text-sky-700">
                        {doc.number}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({doc.type === 'quotation' ? 'Quote' : 'Bill'})
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {doc.status}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800">
                      {doc.customerSnapshot.name}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      {doc.date} · {doc.lines.length} items
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                      {formatINR(calcs.grandTotalPaise)}
                    </div>
                    {calcs.balanceDuePaise > 0 ? (
                      <div className="text-[11px] text-red-600 font-mono font-semibold">
                        Due: {formatINR(calcs.balanceDuePaise)}
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-600 font-medium">Paid</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
