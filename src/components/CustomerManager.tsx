import React, { useState } from 'react';
import {
  Search,
  Plus,
  Users,
  Phone,
  MapPin,
  FileText,
  Edit3,
  Trash2,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { Customer, QuotationBillDocument } from '../types';
import { calculateDocumentTotals } from '../utils/calculations';
import { formatINR } from '../utils/numberToWords';

interface CustomerManagerProps {
  customers: Customer[];
  documents: QuotationBillDocument[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onOpenDocument: (doc: QuotationBillDocument) => void;
  onNewDocumentForCustomer: (customerId: string, type: 'quotation' | 'bill') => void;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  customers,
  documents,
  onSaveCustomer,
  onDeleteCustomer,
  onOpenDocument,
  onNewDocumentForCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');

  const openNew = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setSiteAddress('');
    setGstin('');
    setNotes('');
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
    setSiteAddress(c.siteAddress || '');
    setGstin(c.gstin || '');
    setNotes(c.notes || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const saved: Customer = {
      id: editingCustomer?.id || `cust-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      siteAddress: siteAddress.trim() || undefined,
      gstin: gstin.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingCustomer?.createdAt || Date.now(),
    };

    onSaveCustomer(saved);
    setShowModal(false);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.siteAddress || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Customer Directory &amp; Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {customers.length} clients registered · Work site addresses and billing history
          </p>
        </div>

        <button
          onClick={openNew}
          className="h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name, mobile phone number, or work site address..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const custDocs = documents.filter((d) => d.customerId === cust.id);

          // Calculate customer ledger totals
          let totalBilledPaise = 0;
          let totalPendingPaise = 0;

          custDocs.forEach((d) => {
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
              totalPendingPaise += calcs.balanceDuePaise;
            }
          });

          const isExpanded = selectedCustomerId === cust.id;

          return (
            <div
              key={cust.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">{cust.name}</h3>
                    {cust.gstin && (
                      <span className="text-[10px] font-mono text-slate-400">
                        GSTIN: {cust.gstin}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(cust)}
                      className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {customers.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete customer "${cust.name}"?`)) {
                            onDeleteCustomer(cust.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  {cust.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a
                        href={`tel:${cust.phone}`}
                        className="hover:text-sky-600 hover:underline font-medium"
                      >
                        {cust.phone}
                      </a>
                    </div>
                  )}

                  {cust.siteAddress && (
                    <div className="flex items-start gap-2 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        <strong className="text-slate-900">Site:</strong> {cust.siteAddress}
                      </span>
                    </div>
                  )}

                  {cust.address && (
                    <p className="text-slate-500 text-[11px] truncate pl-5">
                      Billing: {cust.address}
                    </p>
                  )}
                </div>

                {/* Ledger Financials Strip */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Total Billed
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatINR(totalBilledPaise)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Pending Due
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        totalPendingPaise > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatINR(totalPendingPaise)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedCustomerId(isExpanded ? null : cust.id)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                >
                  {isExpanded ? 'Hide History' : `History (${custDocs.length})`}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onNewDocumentForCustomer(cust.id, 'quotation')}
                    className="h-8 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold"
                  >
                    + Quote
                  </button>
                  <button
                    onClick={() => onNewDocumentForCustomer(cust.id, 'bill')}
                    className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                  >
                    + Bill
                  </button>
                </div>
              </div>

              {/* Expanded Document History */}
              {isExpanded && (
                <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">Past Documents:</span>
                  {custDocs.length === 0 ? (
                    <p className="text-slate-400 text-[11px]">No documents generated yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {custDocs.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => onOpenDocument(d)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-sky-50 border border-slate-200/60 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-800">{d.number}</span>
                            <span className="text-[10px] text-slate-400 ml-2">({d.date})</span>
                          </div>
                          <span className="font-mono text-slate-700 font-medium">
                            {formatINR(
                              d.lines.reduce((acc, l) => acc + l.lineTotalPaise, 0)
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Customer Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer / Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sahoo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Plumbing Work Site Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Plot/Flat number, building name, landmark"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                <input
                  type="text"
                  placeholder="Customer permanent address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  GSTIN (If GST Tax Bill required)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 21ABCDE1234F1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Needs bathroom remodeling quotation"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-white shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
