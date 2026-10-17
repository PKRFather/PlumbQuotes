import React, { useState } from 'react';
import { CreditCard, X, Check, Smartphone, Landmark, Banknote } from 'lucide-react';
import { Payment, PaymentMode, QuotationBillDocument } from '../types';
import { calculateDocumentTotals } from '../utils/calculations';
import { formatINR } from '../utils/numberToWords';

interface PaymentModalProps {
  document: QuotationBillDocument;
  onClose: () => void;
  onSavePayment: (payment: Payment) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  document: doc,
  onClose,
  onSavePayment,
}) => {
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

  const [amountRupees, setAmountRupees] = useState<number>(calcs.balanceDuePaise / 100);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountRupees <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const amountPaise = Math.round(amountRupees * 100);
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      billId: doc.id,
      date: paymentDate,
      amountPaise,
      mode: paymentMode,
      transactionRef: transactionRef.trim() || undefined,
      note: paymentNote.trim() || undefined,
      recordedAt: Date.now(),
    };

    onSavePayment(newPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden text-slate-900">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Record Payment</h3>
              <p className="text-xs text-slate-500">
                Invoice {doc.number} · {doc.customerSnapshot.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Outstanding Balance Banner */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Current Balance Due
              </span>
              <span className="text-lg font-bold font-mono text-red-600">
                {formatINR(calcs.balanceDuePaise)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAmountRupees(calcs.balanceDuePaise / 100)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-200 hover:bg-slate-300 font-semibold text-slate-700"
            >
              Pay Full Balance
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Payment Amount Received (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="any"
              max={calcs.balanceDuePaise / 100 + 1000}
              value={amountRupees || ''}
              onChange={(e) => setAmountRupees(parseFloat(e.target.value) || 0)}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-base text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          {/* Payment Mode Segmented Control */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Payment Mode</label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMode('upi')}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 border transition-all ${
                  paymentMode === 'upi'
                    ? 'bg-sky-50 border-sky-600 text-sky-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-[10px]">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 border transition-all ${
                  paymentMode === 'cash'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span className="text-[10px]">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('bank')}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 border transition-all ${
                  paymentMode === 'bank'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span className="text-[10px]">Bank Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('cheque')}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 border transition-all ${
                  paymentMode === 'cheque'
                    ? 'bg-purple-50 border-purple-600 text-purple-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-[10px]">Cheque</span>
              </button>
            </div>
          </div>

          {/* Date & Ref */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl bg-slate-50 border border-slate-300 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Ref / UTR</label>
              <input
                type="text"
                placeholder="e.g. UPI/123456"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Receipt Note</label>
            <input
              type="text"
              placeholder="e.g. Paid in cash at site upon tank fitting"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
