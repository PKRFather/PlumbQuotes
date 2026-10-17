import React, { useState } from 'react';
import {
  Search,
  Plus,
  FileText,
  CreditCard,
  Copy,
  Trash2,
  Edit3,
  Eye,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { DocumentType, QuotationBillDocument } from '../types';
import { calculateDocumentTotals } from '../utils/calculations';
import { formatINR } from '../utils/numberToWords';

interface DocumentListProps {
  documents: QuotationBillDocument[];
  onOpenDocument: (doc: QuotationBillDocument) => void;
  onEditDocument: (doc: QuotationBillDocument) => void;
  onDuplicateDocument: (doc: QuotationBillDocument) => void;
  onConvertToBill: (quotation: QuotationBillDocument) => void;
  onRecordPayment: (bill: QuotationBillDocument) => void;
  onDeleteDocument: (id: string) => void;
  onNewDocument: (type: DocumentType) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onOpenDocument,
  onEditDocument,
  onDuplicateDocument,
  onConvertToBill,
  onRecordPayment,
  onDeleteDocument,
  onNewDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'quotation' | 'bill'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.customerSnapshot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.customerSnapshot.siteAddress || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.lines.some((l) => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: QuotationBillDocument['status'], type: DocumentType) => {
    switch (status) {
      case 'draft':
        return <span className="text-slate-500 font-medium text-xs">Draft</span>;
      case 'sent':
        return <span className="text-sky-700 font-semibold text-xs">Sent</span>;
      case 'accepted':
        return <span className="text-emerald-700 font-bold text-xs">Accepted</span>;
      case 'rejected':
        return <span className="text-red-600 font-medium text-xs">Rejected</span>;
      case 'partial':
        return <span className="text-amber-700 font-bold text-xs">Partially Paid</span>;
      case 'paid':
        return <span className="text-emerald-700 font-bold text-xs">Fully Paid</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5 pb-24">
      {/* Title & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Quotations &amp; Bills History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {filteredDocs.length} documents found · 100% saved offline
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNewDocument('quotation')}
            className="h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
          <button
            onClick={() => onNewDocument('bill')}
            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Bill</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, invoice number, site, or plumbing item..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Type Segmented Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('quotation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === 'quotation'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quotations
            </button>
            <button
              onClick={() => setTypeFilter('bill')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === 'bill'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bills
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar border-t border-slate-100 pt-2.5">
          {[
            { id: 'all', label: 'All Status' },
            { id: 'draft', label: 'Draft' },
            { id: 'sent', label: 'Sent' },
            { id: 'accepted', label: 'Accepted' },
            { id: 'partial', label: 'Partially Paid' },
            { id: 'paid', label: 'Paid' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-medium transition-colors ${
                statusFilter === st.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Cards List */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No documents match</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your search filters or create a new quotation or bill.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => {
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

            const isQuotation = doc.type === 'quotation';

            return (
              <div
                key={doc.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-xs transition-all space-y-3"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm sm:text-base text-slate-900">
                        {doc.number}
                      </span>
                      <span className="text-slate-300 font-light">·</span>
                      <span
                        className={`text-xs font-semibold ${
                          isQuotation ? 'text-sky-700' : 'text-slate-700'
                        }`}
                      >
                        {isQuotation ? 'Quotation' : 'Bill / Invoice'}
                      </span>
                      <span className="text-slate-300 font-light">·</span>
                      {getStatusBadge(doc.status, doc.type)}
                    </div>

                    <div className="text-sm font-semibold text-slate-800 pt-0.5">
                      {doc.customerSnapshot.name}
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>Date: {doc.date}</span>
                      {doc.customerSnapshot.siteAddress && (
                        <span>Site: {doc.customerSnapshot.siteAddress.slice(0, 35)}</span>
                      )}
                      <span>({doc.lines.length} items)</span>
                    </div>
                  </div>

                  {/* Financials & Balance */}
                  <div className="text-right shrink-0">
                    <div className="text-base sm:text-lg font-bold font-mono text-slate-900 tabular-nums">
                      {formatINR(calcs.grandTotalPaise)}
                    </div>
                    {calcs.balanceDuePaise > 0 ? (
                      <div className="text-xs font-semibold text-red-600 font-mono">
                        Due: {formatINR(calcs.balanceDuePaise)}
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-emerald-600">Paid</div>
                    )}
                  </div>
                </div>

                {/* Items Summary Preview (First 2 items) */}
                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-wrap gap-2">
                  {doc.lines.slice(0, 3).map((l, idx) => (
                    <span key={idx} className="after:content-['·'] last:after:content-none pr-1">
                      {l.name} ({l.quantity} {l.unit})
                    </span>
                  ))}
                  {doc.lines.length > 3 && (
                    <span className="text-slate-400 font-medium">
                      +{doc.lines.length - 3} more items
                    </span>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Convert Quotation to Bill in 1 Tap */}
                    {isQuotation && (
                      <button
                        onClick={() => onConvertToBill(doc)}
                        className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 border border-emerald-200 transition-colors"
                        title="Convert approved quotation into an official bill"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Convert to Bill</span>
                      </button>
                    )}

                    {/* Record Payment on Bills */}
                    {!isQuotation && calcs.balanceDuePaise > 0 && (
                      <button
                        onClick={() => onRecordPayment(doc)}
                        className="h-8 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold flex items-center gap-1 border border-sky-200 transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDuplicateDocument(doc)}
                      className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Make a copy"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Duplicate</span>
                    </button>

                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="h-8 px-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditDocument(doc)}
                      className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => onOpenDocument(doc)}
                      className="h-8 px-3.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View &amp; Share</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
