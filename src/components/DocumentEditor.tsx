import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Package,
  Layers,
  Calculator,
  UserPlus,
  FileCheck,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  Customer,
  DocumentLine,
  DocumentType,
  FormatTemplate,
  GlossaryItem,
  ItemBundle,
  QuotationBillDocument,
  UnitType,
} from '../types';
import { calculateDocumentTotals } from '../utils/calculations';
import { formatINR } from '../utils/numberToWords';
import { storage } from '../services/storage';
import {
  getVariantPricePaise,
  STANDARD_MATERIALS,
  STANDARD_SIZES,
} from '../utils/variantPricing';

interface DocumentEditorProps {
  initialDocument?: QuotationBillDocument | null;
  documentType: DocumentType;
  onSave: (doc: QuotationBillDocument) => void;
  onCancel: () => void;
  onOpenPreview: (doc: QuotationBillDocument) => void;
  onDeletedLine: (line: DocumentLine) => void;
}

const COMMON_UNITS: UnitType[] = [
  'Nos',
  'Mtr',
  'Rft',
  'Pkt',
  'Set',
  'Point',
  'Job',
  'Ft',
  'Ltr',
  'Kg',
];

const TAX_RATES = [0, 5, 12, 18, 28];

const PickerItemCard: React.FC<{
  item: GlossaryItem;
  onAdd: (item: GlossaryItem, material?: string, size?: string) => void;
}> = ({ item, onAdd }) => {
  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    item.availableMaterials?.[0] || 'CPVC'
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    item.availableSizes?.[1] || item.availableSizes?.[0] || '3/4 inch'
  );

  const currentPricePaise = item.hasVariants
    ? getVariantPricePaise(item, selectedMaterial, selectedSize)
    : item.defaultRatePaise;

  return (
    <div className="p-3 rounded-xl hover:bg-sky-50/70 border border-transparent hover:border-sky-200 transition-all space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-xs sm:text-sm text-slate-900">
            {item.name}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
            {item.category && <span>{item.category}</span>}
            {item.hasVariants && (
              <span className="text-emerald-700 font-semibold">· Size &amp; Type Dropdowns</span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="font-bold text-xs sm:text-sm font-mono text-slate-900">
            {formatINR(currentPricePaise)}
          </div>
          <div className="text-[10px] text-slate-400">per {item.unit}</div>
        </div>
      </div>

      {item.hasVariants ? (
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-300">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Type:</span>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="text-xs font-bold text-sky-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {(item.availableMaterials || STANDARD_MATERIALS).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-300">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Size:</span>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="text-xs font-bold text-sky-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {(item.availableSizes || STANDARD_SIZES).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => onAdd(item, selectedMaterial, selectedSize)}
            className="h-8 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shrink-0 shadow-2xs active:scale-95 transition-all"
          >
            + Add
          </button>
        </div>
      ) : (
        <div className="flex justify-end pt-1">
          <button
            onClick={() => onAdd(item)}
            className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shrink-0 shadow-2xs active:scale-95 transition-all"
          >
            + Add to Bill
          </button>
        </div>
      )}
    </div>
  );
};

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  initialDocument,
  documentType,
  onSave,
  onCancel,
  onOpenPreview,
  onDeletedLine,
}) => {
  const profile = storage.getProfile();
  const customers = storage.getCustomers();
  const formats = storage.getFormats();
  const glossary = storage.getGlossary();
  const bundles = storage.getBundles();

  // Document State
  const [docId] = useState(initialDocument?.id || `doc-${Date.now()}`);
  const [docNumber, setDocNumber] = useState(
    initialDocument?.number || storage.getNextNumber(documentType)
  );
  const [docDate, setDocDate] = useState(
    initialDocument?.date || new Date().toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState(
    initialDocument?.validUntil ||
      (documentType === 'quotation'
        ? new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
        : '')
  );

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialDocument?.customerId || (customers[0]?.id ?? '')
  );
  const [selectedFormatId, setSelectedFormatId] = useState<string>(
    initialDocument?.formatId || storage.getDefaultFormat(documentType).id
  );
  const [status, setStatus] = useState<QuotationBillDocument['status']>(
    initialDocument?.status || 'draft'
  );

  const [lines, setLines] = useState<DocumentLine[]>(initialDocument?.lines || []);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    initialDocument?.discountType || 'percentage'
  );
  const [discountValue, setDiscountValue] = useState<number>(initialDocument?.discountValue || 0);
  const [isTaxEnabled, setIsTaxEnabled] = useState<boolean>(
    initialDocument ? initialDocument.isTaxEnabled : profile.enableGstByDefault
  );
  const [isInterState, setIsInterState] = useState<boolean>(initialDocument?.isInterState || false);
  const [isPriceTaxInclusive, setIsPriceTaxInclusive] = useState<boolean>(
    initialDocument?.isPriceTaxInclusive || false
  );
  const [notes, setNotes] = useState<string>(
    initialDocument?.notes || 'Material & workmanship as per site requirements. Payment as per terms.'
  );
  const [advancePaidRupees, setAdvancePaidRupees] = useState<number>(
    initialDocument ? initialDocument.advancePaidPaise / 100 : 0
  );

  // Modals / Dropdowns State
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showBundlePicker, setShowBundlePicker] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState('All');

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustSite, setNewCustSite] = useState('');
  const [newCustGstin, setNewCustGstin] = useState('');

  // Custom Item Form State
  const [customName, setCustomName] = useState('');
  const [customSize, setCustomSize] = useState('');
  const [customUnit, setCustomUnit] = useState<UnitType>('Nos');
  const [customRateRupees, setCustomRateRupees] = useState<number>(0);
  const [customQty, setCustomQty] = useState<number>(1);
  const [customTaxRate, setCustomTaxRate] = useState<number>(18);
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);

  // Current Customer
  const currentCustomer =
    customers.find((c) => c.id === selectedCustomerId) ||
    initialDocument?.customerSnapshot ||
    customers[0];

  // Live Calculations
  const calcs = calculateDocumentTotals({
    lines,
    discountType,
    discountValue,
    isTaxEnabled,
    isInterState,
    isPriceTaxInclusive,
    advancePaidPaise: Math.round(advancePaidRupees * 100),
    payments: initialDocument?.payments || [],
  });

  // Assemble full document object
  const buildCurrentDocument = (): QuotationBillDocument => {
    return {
      id: docId,
      type: documentType,
      number: docNumber,
      date: docDate,
      validUntil: documentType === 'quotation' ? validUntil : undefined,
      customerId: selectedCustomerId,
      customerSnapshot: currentCustomer,
      formatId: selectedFormatId,
      status,
      lines,
      discountType,
      discountValue,
      isTaxEnabled,
      isInterState,
      isPriceTaxInclusive,
      notes,
      advancePaidPaise: Math.round(advancePaidRupees * 100),
      payments: initialDocument?.payments || [],
      sourceQuotationId: initialDocument?.sourceQuotationId,
      createdAt: initialDocument?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  };

  // Add Item From Glossary
  const handleAddGlossaryItem = (
    item: GlossaryItem,
    chosenMaterial?: string,
    chosenSize?: string
  ) => {
    const material = chosenMaterial || item.availableMaterials?.[0] || 'CPVC';
    const size = chosenSize || item.availableSizes?.[1] || '3/4 inch';
    const ratePaise = item.hasVariants
      ? getVariantPricePaise(item, material, size)
      : item.defaultRatePaise;
    const qty = 1;

    const newLine: DocumentLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      itemId: item.id,
      name: item.name,
      material: item.hasVariants ? material : undefined,
      size: item.hasVariants ? size : undefined,
      sizeSpec: item.hasVariants ? `${size} (${material})` : item.sizeSpec,
      unit: item.unit,
      quantity: qty,
      ratePaise,
      taxRate: item.taxRate,
      lineTotalPaise: Math.round(qty * ratePaise),
    };

    setLines((prev) => [...prev, newLine]);
    setShowItemPicker(false);
  };

  // Change Material or Size on any line -> triggers instant price recalculation
  const handleMaterialOrSizeChange = (
    lineId: string,
    newMaterial: string,
    newSize: string
  ) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id === lineId) {
          const matchingItem = glossary.find(
            (g) => g.id === line.itemId || g.name.toLowerCase() === line.name.toLowerCase()
          );

          const newRatePaise = matchingItem
            ? getVariantPricePaise(matchingItem, newMaterial, newSize)
            : getVariantPricePaise(
                {
                  id: 'temp',
                  category: 'Fittings',
                  name: line.name,
                  sizeSpec: '',
                  unit: line.unit,
                  defaultRatePaise: line.ratePaise,
                  taxRate: line.taxRate,
                  active: true,
                },
                newMaterial,
                newSize
              );

          const qty = Number(line.quantity) || 1;
          const updatedLine: DocumentLine = {
            ...line,
            material: newMaterial,
            size: newSize,
            sizeSpec: `${newSize} (${newMaterial})`,
            ratePaise: newRatePaise,
            lineTotalPaise: Math.round(qty * newRatePaise),
          };
          // Remember in storage
          storage.rememberLineUsage(updatedLine.name, newRatePaise, qty);
          return updatedLine;
        }
        return line;
      })
    );
  };

  // Add Complete Bundle
  const handleAddBundle = (bundle: ItemBundle) => {
    const newLines: DocumentLine[] = bundle.items.map((it, idx) => ({
      id: `line-${Date.now()}-${idx}`,
      name: it.name,
      sizeSpec: it.sizeSpec || '',
      unit: it.unit,
      quantity: it.quantity,
      ratePaise: it.ratePaise,
      taxRate: it.taxRate,
      lineTotalPaise: Math.round(it.quantity * it.ratePaise),
    }));

    setLines((prev) => [...prev, ...newLines]);
    setShowBundlePicker(false);
  };

  // Add Custom Line Item
  const handleAddCustomLine = () => {
    if (!customName.trim()) return;
    const ratePaise = Math.round(customRateRupees * 100);
    const newLine: DocumentLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: customName.trim(),
      sizeSpec: customSize.trim(),
      unit: customUnit,
      quantity: Number(customQty) || 1,
      ratePaise,
      taxRate: customTaxRate,
      lineTotalPaise: Math.round((Number(customQty) || 1) * ratePaise),
    };

    // Remember in storage for future quick typing
    storage.rememberLineUsage(newLine.name, ratePaise, newLine.quantity);

    setLines((prev) => [...prev, newLine]);
    setCustomName('');
    setCustomSize('');
    setCustomRateRupees(0);
    setCustomQty(1);
    setShowCustomItemForm(false);
    setShowItemPicker(false);
  };

  // Update Line Details
  const handleUpdateLine = (id: string, updates: Partial<DocumentLine>) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id === id) {
          const updated = { ...line, ...updates };
          const qty = Number(updated.quantity) || 0;
          const rate = Number(updated.ratePaise) || 0;
          updated.lineTotalPaise = Math.round(qty * rate);
          // Store usage memory
          storage.rememberLineUsage(updated.name, rate, qty);
          return updated;
        }
        return line;
      })
    );
  };

  // Delete Line
  const handleDeleteLine = (line: DocumentLine) => {
    setLines((prev) => prev.filter((l) => l.id !== line.id));
    onDeletedLine(line);
  };

  // Save Document
  const handleSave = () => {
    if (!selectedCustomerId) {
      alert('Please select or add a customer.');
      return;
    }
    if (lines.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    const currentDoc = buildCurrentDocument();
    onSave(currentDoc);
  };

  // Quick Customer Creation
  const handleCreateCustomer = () => {
    if (!newCustName.trim()) return;
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      siteAddress: newCustSite.trim(),
      gstin: newCustGstin.trim(),
      createdAt: Date.now(),
    };
    storage.saveCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setShowNewCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustSite('');
    setNewCustGstin('');
  };

  // Filter Glossary Items
  const filteredGlossary = glossary.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      item.sizeSpec.toLowerCase().includes(pickerSearch.toLowerCase());
    const matchesCategory = pickerCategory === 'All' || item.category === pickerCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-5xl mx-auto pb-32">
      {/* Editor Top Bar */}
      <div className="sticky top-15 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            aria-label="Back"
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {initialDocument ? 'Edit' : 'New'}{' '}
              {documentType === 'quotation' ? 'Quotation' : 'Bill'}
            </h2>
            <p className="text-xs text-slate-500 font-mono">{docNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenPreview(buildCurrentDocument())}
            className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Preview &amp; Share</span>
          </button>

          <button
            onClick={handleSave}
            className="h-9 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <FileCheck className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Step 1: Customer & Document Meta Header */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-bold text-sm text-slate-900">1. Customer &amp; Basic Info</span>
            <button
              onClick={() => setShowNewCustomerModal(true)}
              className="text-xs text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1 p-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add New Customer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Customer Picker */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>

            {/* Document Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Number
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Document Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Customer Site Preview Card */}
          {currentCustomer && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex flex-col sm:flex-row justify-between gap-2">
              <div>
                <span className="font-semibold text-slate-800">{currentCustomer.name}</span>
                <span className="mx-2 text-slate-300">|</span>
                <span>{currentCustomer.phone}</span>
                {currentCustomer.gstin && (
                  <>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="font-mono">GSTIN: {currentCustomer.gstin}</span>
                  </>
                )}
              </div>
              {currentCustomer.siteAddress && (
                <div className="text-slate-500 truncate max-w-md">
                  <span className="font-medium text-slate-700">Site:</span>{' '}
                  {currentCustomer.siteAddress}
                </div>
              )}
            </div>
          )}

          {/* Format Picker & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Print Format / Letterhead
              </label>
              <select
                value={selectedFormatId}
                onChange={(e) => setSelectedFormatId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900"
              >
                {formats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.mode === 'custom_background' ? '(Uploaded Letterhead)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuotationBillDocument['status'])}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent to Customer</option>
                <option value="accepted">Accepted / Approved</option>
                <option value="rejected">Rejected</option>
                <option value="partial">Partially Paid</option>
                <option value="paid">Fully Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Line Items */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="font-bold text-sm text-slate-900">2. Materials &amp; Labour</span>
              <span className="text-xs text-slate-500 ml-2">({lines.length} items added)</span>
            </div>

            {/* Quick Add Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBundlePicker(true)}
                className="h-9 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1.5 border border-amber-200 transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Add Item Bundle</span>
              </button>

              <button
                onClick={() => setShowItemPicker(true)}
                className="h-9 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Plumbing Item</span>
              </button>
            </div>
          </div>

          {/* Lines Table / Cards */}
          {lines.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 mx-auto flex items-center justify-center mb-3">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No items added yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Add materials, fittings, taps, tanks, or labour from your pre-loaded plumbing glossary or tap &quot;Add Item Bundle&quot;.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => setShowItemPicker(true)}
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500"
                >
                  Browse Glossary
                </button>
                <button
                  onClick={() => setShowBundlePicker(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                >
                  Pick Pre-made Bundle
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((line, index) => (
                <div
                  key={line.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-2.5"
                >
                  {/* Row Top: Name & Remove */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-mono font-bold text-slate-500 shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={line.name}
                          onChange={(e) => handleUpdateLine(line.id, { name: e.target.value })}
                          className="font-semibold text-xs sm:text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none w-full"
                          placeholder="Item Description"
                        />

                        {/* Interactive Type & Size Dropdowns */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {/* Type / Material Dropdown */}
                          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-300 shadow-2xs">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Type:</span>
                            <select
                              value={line.material || (line.sizeSpec?.includes('UPVC') ? 'UPVC' : line.sizeSpec?.includes('Brass') ? 'Brass' : line.sizeSpec?.includes('GI') ? 'GI' : 'CPVC')}
                              onChange={(e) =>
                                handleMaterialOrSizeChange(
                                  line.id,
                                  e.target.value,
                                  line.size || (line.sizeSpec?.includes('1/2') ? '1/2 inch' : line.sizeSpec?.includes('1 inch') ? '1 inch' : '3/4 inch')
                                )
                              }
                              className="text-xs font-bold text-sky-800 bg-transparent focus:outline-none cursor-pointer py-0.5"
                            >
                              {STANDARD_MATERIALS.map((mat) => (
                                <option key={mat} value={mat}>
                                  {mat}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Size Dropdown */}
                          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-300 shadow-2xs">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Size:</span>
                            <select
                              value={line.size || (line.sizeSpec?.includes('1/2') ? '1/2 inch' : line.sizeSpec?.includes('1 inch') ? '1 inch' : line.sizeSpec?.includes('1.25') ? '1.25 inch' : line.sizeSpec?.includes('1.5') ? '1.5 inch' : line.sizeSpec?.includes('2 inch') ? '2 inch' : '3/4 inch')}
                              onChange={(e) =>
                                handleMaterialOrSizeChange(
                                  line.id,
                                  line.material || (line.sizeSpec?.includes('UPVC') ? 'UPVC' : line.sizeSpec?.includes('Brass') ? 'Brass' : line.sizeSpec?.includes('GI') ? 'GI' : 'CPVC'),
                                  e.target.value
                                )
                              }
                              className="text-xs font-bold text-sky-800 bg-transparent focus:outline-none cursor-pointer py-0.5"
                            >
                              {STANDARD_SIZES.map((sz) => (
                                <option key={sz} value={sz}>
                                  {sz}
                                </option>
                              ))}
                            </select>
                          </div>

                          <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-medium border border-emerald-200">
                            Auto-updates price
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteLine(line)}
                      aria-label="Remove item"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Row Bottom: Quantity, Unit, Rate, Tax, Line Total */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-slate-200/60 items-center">
                    {/* Quantity */}
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                        Qty
                      </label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateLine(line.id, {
                              quantity: Math.max(1, line.quantity - 1),
                            })
                          }
                          className="w-7 h-8 bg-slate-200 hover:bg-slate-300 rounded-l-lg text-slate-700 font-bold text-xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={line.quantity}
                          onChange={(e) =>
                            handleUpdateLine(line.id, {
                              quantity: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-14 h-8 text-center text-xs font-semibold bg-white border-y border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateLine(line.id, {
                              quantity: line.quantity + 1,
                            })
                          }
                          className="w-7 h-8 bg-slate-200 hover:bg-slate-300 rounded-r-lg text-slate-700 font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                        Unit
                      </label>
                      <select
                        value={line.unit}
                        onChange={(e) =>
                          handleUpdateLine(line.id, {
                            unit: e.target.value as UnitType,
                          })
                        }
                        className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rate (INR) */}
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                        Rate (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={line.ratePaise / 100}
                        onChange={(e) =>
                          handleUpdateLine(line.id, {
                            ratePaise: Math.round((parseFloat(e.target.value) || 0) * 100),
                          })
                        }
                        className="w-full h-8 px-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>

                    {/* Tax Rate % */}
                    {isTaxEnabled && (
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                          GST %
                        </label>
                        <select
                          value={line.taxRate}
                          onChange={(e) =>
                            handleUpdateLine(line.id, {
                              taxRate: Number(e.target.value),
                            })
                          }
                          className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                        >
                          {TAX_RATES.map((rate) => (
                            <option key={rate} value={rate}>
                              {rate}%
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Line Total */}
                    <div className="text-right sm:text-right col-span-2 sm:col-span-1">
                      <span className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                        Total
                      </span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 tabular-nums">
                        {formatINR(line.lineTotalPaise)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Tax, Discount, Notes, Advance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Preferences & Notes */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <span className="font-bold text-sm text-slate-900 block border-b border-slate-100 pb-2">
              3. Tax &amp; Discount Configuration
            </span>

            {/* GST Controls */}
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800">Enable GST Taxes</span>
                  <p className="text-[11px] text-slate-500">Calculate CGST, SGST, or IGST</p>
                </div>
                <input
                  type="checkbox"
                  checked={isTaxEnabled}
                  onChange={(e) => setIsTaxEnabled(e.target.checked)}
                  className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </div>

              {isTaxEnabled && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Tax Breakdown Type:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsInterState(false)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          !isInterState ? 'bg-sky-600 text-white' : 'bg-white border text-slate-700'
                        }`}
                      >
                        Same State (CGST+SGST)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInterState(true)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          isInterState ? 'bg-sky-600 text-white' : 'bg-white border text-slate-700'
                        }`}
                      >
                        Inter-State (IGST)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-700">Rates are Tax-Inclusive:</span>
                    <input
                      type="checkbox"
                      checked={isPriceTaxInclusive}
                      onChange={(e) => setIsPriceTaxInclusive(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Discount Section */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Overall Discount
              </label>
              <div className="flex gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder={discountType === 'percentage' ? 'e.g. 5' : 'e.g. 500'}
                  className="h-10 flex-1 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900"
                />
              </div>
            </div>

            {/* Advance Payment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Advance Paid / Booking Deposit (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={advancePaidRupees || ''}
                onChange={(e) => setAdvancePaidRupees(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 5000"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Notes &amp; Scope
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Concealed piping warranty, extra civil work charge, etc."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          {/* Right Column: Live Calculation Card */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="font-bold text-sm tracking-wide text-sky-400">
                  Live Calculation Summary
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Paise-Accurate</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono tabular-nums text-white">
                    {formatINR(calcs.subtotalPaise)}
                  </span>
                </div>

                {calcs.discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>
                      Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'}):
                    </span>
                    <span className="font-mono tabular-nums">
                      -{formatINR(calcs.discountPaise)}
                    </span>
                  </div>
                )}

                {isTaxEnabled && (
                  <>
                    <div className="flex justify-between">
                      <span>Taxable Value:</span>
                      <span className="font-mono tabular-nums text-white">
                        {formatINR(calcs.taxableValuePaise)}
                      </span>
                    </div>

                    {isInterState ? (
                      <div className="flex justify-between text-slate-400">
                        <span>IGST:</span>
                        <span className="font-mono tabular-nums">
                          {formatINR(calcs.igstPaise)}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-slate-400">
                          <span>CGST:</span>
                          <span className="font-mono tabular-nums">
                            {formatINR(calcs.cgstPaise)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>SGST:</span>
                          <span className="font-mono tabular-nums">
                            {formatINR(calcs.sgstPaise)}
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}

                {calcs.roundOffPaise !== 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Round-off:</span>
                    <span className="font-mono tabular-nums">
                      {formatINR(calcs.roundOffPaise)}
                    </span>
                  </div>
                )}

                {/* Grand Total Bar */}
                <div className="border-t border-slate-700 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    Grand Total:
                  </span>
                  <span className="text-2xl font-bold font-mono text-sky-400 tabular-nums">
                    {formatINR(calcs.grandTotalPaise)}
                  </span>
                </div>

                {/* Balance Due */}
                {calcs.totalPaidPaise > 0 && (
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-1.5 mt-2">
                    <div className="flex justify-between text-emerald-400">
                      <span>Advance / Total Paid:</span>
                      <span className="font-mono font-semibold">
                        {formatINR(calcs.totalPaidPaise)}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-400 font-bold text-sm">
                      <span>Balance Due:</span>
                      <span className="font-mono">{formatINR(calcs.balanceDuePaise)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Words */}
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 italic">
              &quot;{calcs.amountInWords}&quot;
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sticky Bottom Action Bar for Site Plumbers */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-xl">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Grand Total</span>
          <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
            {formatINR(calcs.grandTotalPaise)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenPreview(buildCurrentDocument())}
            className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold active:scale-95 transition-all"
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            className="h-11 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <FileCheck className="w-4 h-4" />
            <span>Save Document</span>
          </button>
        </div>
      </div>

      {/* Glossary Item Picker Modal */}
      {showItemPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4">
          <div className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Add Plumbing Item</h3>
                <p className="text-xs text-slate-500">Pick from catalogue or enter custom line</p>
              </div>
              <button
                onClick={() => setShowItemPicker(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Search & Custom Form Toggle */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search pipe, elbow, valve, tap, tank, labour..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {[
                  'All',
                  'Pipes',
                  'Fittings',
                  'Valves and Cocks',
                  'Taps and Mixers',
                  'Sanitaryware',
                  'Water Tanks and Pumps',
                  'Drainage',
                  'Consumables',
                  'Labour and Service',
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPickerCategory(cat)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-medium transition-colors ${
                      pickerCategory === cat
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Quick Add Custom Toggle */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setShowCustomItemForm(!showCustomItemForm)}
                  className="text-xs text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {showCustomItemForm ? 'Hide Custom Line' : '+ Add Custom / Ad-hoc Item'}
                  </span>
                </button>
              </div>

              {/* Custom Item Form */}
              {showCustomItemForm && (
                <div className="p-3 bg-white rounded-xl border border-sky-200 space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Item name (e.g. Wall Mixer Repair)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Size / Brand (e.g. Jaquar)"
                      value={customSize}
                      onChange={(e) => setCustomSize(e.target.value)}
                      className="h-9 px-2.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={customQty}
                      onChange={(e) => setCustomQty(parseFloat(e.target.value) || 1)}
                      className="h-9 px-2 rounded-lg border border-slate-300 text-xs text-center font-medium"
                    />
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value as UnitType)}
                      className="h-9 px-1 rounded-lg border border-slate-300 text-xs"
                    >
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Rate (₹)"
                      value={customRateRupees || ''}
                      onChange={(e) => setCustomRateRupees(parseFloat(e.target.value) || 0)}
                      className="h-9 px-2 rounded-lg border border-slate-300 text-xs font-semibold"
                    />
                    <button
                      onClick={handleAddCustomLine}
                      disabled={!customName.trim()}
                      className="h-9 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Glossary Items List */}
            <div className="overflow-y-auto p-3 space-y-2 divide-y divide-slate-100 flex-1">
              {filteredGlossary.map((item) => (
                <PickerItemCard
                  key={item.id}
                  item={item}
                  onAdd={(it, mat, sz) => handleAddGlossaryItem(it, mat, sz)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Item Bundle Picker Modal */}
      {showBundlePicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Pre-built Item Bundles</h3>
                <p className="text-xs text-slate-500">
                  Add entire packages of pipes, fittings, and labour in 1 tap
                </p>
              </div>
              <button
                onClick={() => setShowBundlePicker(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-4 flex-1">
              {bundles.map((bundle) => (
                <div
                  key={bundle.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:border-sky-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{bundle.title}</h4>
                      <p className="text-xs text-slate-500">{bundle.description}</p>
                    </div>
                    <button
                      onClick={() => handleAddBundle(bundle)}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shrink-0 active:scale-95 transition-all"
                    >
                      + Add All Items
                    </button>
                  </div>

                  {/* Included Items Mini Preview */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Contains {bundle.items.length} items:
                    </span>
                    {bundle.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600 text-[11px]">
                        <span>
                          • {it.name} ({it.quantity} {it.unit})
                        </span>
                        <span className="font-mono">{formatINR(it.ratePaise * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add New Customer</h3>
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer / Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sahoo"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Work / Site Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Site location where plumbing work is executed"
                  value={newCustSite}
                  onChange={(e) => setNewCustSite(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                <input
                  type="text"
                  placeholder="Customer residence or registered office"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  GSTIN (If registered business)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 21ABCDE1234F1Z5"
                  value={newCustGstin}
                  onChange={(e) => setNewCustGstin(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewCustomerModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomer}
                disabled={!newCustName.trim()}
                className="w-1/2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-xs font-semibold text-white shadow-sm"
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
