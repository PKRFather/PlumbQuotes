import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Package,
  Layers,
  FileCheck,
  UserPlus,
  ArrowUp,
  ArrowDown,
  FileText,
  Percent,
  Check,
  DollarSign,
  Edit3,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  Customer,
  DocumentLine,
  DocumentType,
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
  'Job',
  'Point',
  'Ft',
  'Ltr',
  'Kg',
];

const TAX_RATES = [0, 5, 12, 18, 28];

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
    initialDocument?.discountType || 'fixed'
  );
  const [discountValue, setDiscountValue] = useState<number>(initialDocument?.discountValue || 0);
  const [isTaxEnabled, setIsTaxEnabled] = useState<boolean>(
    initialDocument ? initialDocument.isTaxEnabled : false
  );
  const [taxRatePercent, setTaxRatePercent] = useState<number>(18);
  const [isInterState, setIsInterState] = useState<boolean>(initialDocument?.isInterState || false);
  const [isPriceTaxInclusive, setIsPriceTaxInclusive] = useState<boolean>(
    initialDocument?.isPriceTaxInclusive || false
  );
  const [notes, setNotes] = useState<string>(
    initialDocument?.notes ||
      '1. Materials and fittings as per approved brands.\n2. Civil breaking, tiling and masonry work by client unless specified.\n3. 50% advance before starting, balance on work completion.\n4. 1-year warranty on pipeline joint leakages.'
  );
  const [advancePaidRupees, setAdvancePaidRupees] = useState<number>(
    initialDocument ? initialDocument.advancePaidPaise / 100 : 0
  );

  // Customer Direct Entry Toggle & States
  const [isDirectCustomerMode, setIsDirectCustomerMode] = useState<boolean>(
    customers.length === 0 || !initialDocument?.customerId
  );
  const [directCustName, setDirectCustName] = useState(
    initialDocument?.customerSnapshot?.name || ''
  );
  const [directCustPhone, setDirectCustPhone] = useState(
    initialDocument?.customerSnapshot?.phone || ''
  );
  const [directCustSite, setDirectCustSite] = useState(
    initialDocument?.customerSnapshot?.siteAddress || ''
  );
  const [directCustAddress, setDirectCustAddress] = useState(
    initialDocument?.customerSnapshot?.address || ''
  );
  const [directCustGstin, setDirectCustGstin] = useState(
    initialDocument?.customerSnapshot?.gstin || ''
  );

  // Modals & Pickers
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showBundlePicker, setShowBundlePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState('All');

  // Quick Ad-hoc Item Drawer / Form
  const [showQuickCustomDrawer, setShowQuickCustomDrawer] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customSizeSpec, setCustomSizeSpec] = useState('');
  const [customUnit, setCustomUnit] = useState<UnitType>('Nos');
  const [customRateRupees, setCustomRateRupees] = useState<number>(0);
  const [customQty, setCustomQty] = useState<number>(1);

  // Get current active customer object
  const getActiveCustomerSnapshot = (): Customer => {
    if (isDirectCustomerMode) {
      return {
        id: selectedCustomerId || `cust-direct-${Date.now()}`,
        name: directCustName.trim() || 'Valued Customer',
        phone: directCustPhone.trim() || '',
        address: directCustAddress.trim() || '',
        siteAddress: directCustSite.trim() || '',
        gstin: directCustGstin.trim() || '',
        createdAt: Date.now(),
      };
    }
    const found = customers.find((c) => c.id === selectedCustomerId);
    if (found) return found;
    return (
      initialDocument?.customerSnapshot || {
        id: 'cust-default',
        name: directCustName.trim() || 'Valued Customer',
        phone: directCustPhone.trim() || '',
        address: '',
        siteAddress: '',
        createdAt: Date.now(),
      }
    );
  };

  const currentCustomer = getActiveCustomerSnapshot();

  // Calculations
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

  // Assemble document
  const buildCurrentDocument = (): QuotationBillDocument => {
    const custSnapshot = getActiveCustomerSnapshot();
    // If it's a new direct customer, automatically persist to customers database
    if (isDirectCustomerMode && directCustName.trim()) {
      const existing = customers.find(
        (c) =>
          c.name.toLowerCase() === directCustName.trim().toLowerCase() &&
          c.phone === directCustPhone.trim()
      );
      if (!existing) {
        storage.saveCustomer(custSnapshot);
      }
    }

    return {
      id: docId,
      type: documentType,
      number: docNumber,
      date: docDate,
      validUntil: documentType === 'quotation' ? validUntil : undefined,
      customerId: custSnapshot.id,
      customerSnapshot: custSnapshot,
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

  // Add Item from Catalogue
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
      taxRate: isTaxEnabled ? taxRatePercent : 0,
      lineTotalPaise: Math.round(qty * ratePaise),
      isCustomScopeBlock: false,
    };

    setLines((prev) => [...prev, newLine]);
    setShowItemPicker(false);
  };

  // Add Custom Scope Paragraph Block (Primary Feature for Contractors)
  const handleAddScopeParagraphBlock = () => {
    const newLine: DocumentLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: 'Bathroom Plumbing & Concealed Piping Work',
      sizeSpec: 'Full Work Scope & Narrative',
      unit: 'Job',
      quantity: 1,
      ratePaise: 1200000, // Rs. 12,000 default lump sum
      taxRate: isTaxEnabled ? taxRatePercent : 0,
      lineTotalPaise: 1200000,
      isCustomScopeBlock: true,
      descriptionParagraph:
        'Concealed CPVC hot & cold water piping installation for master bathroom. Includes rough-in for 1 wall mixer, 1 overhead shower, 1 washbasin pillar tap, 1 health faucet point, and connection to main terrace overhead tank with testing under 5 bar pressure.',
    };

    setLines((prev) => [...prev, newLine]);
  };

  // Add Quick Custom Item
  const handleAddQuickCustomItem = () => {
    if (!customName.trim()) return;
    const ratePaise = Math.round(customRateRupees * 100);
    const qty = Number(customQty) || 1;
    const newLine: DocumentLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: customName.trim(),
      sizeSpec: customSizeSpec.trim(),
      unit: customUnit,
      quantity: qty,
      ratePaise,
      taxRate: isTaxEnabled ? taxRatePercent : 0,
      lineTotalPaise: Math.round(qty * ratePaise),
      isCustomScopeBlock: false,
    };

    setLines((prev) => [...prev, newLine]);
    setCustomName('');
    setCustomSizeSpec('');
    setCustomRateRupees(0);
    setCustomQty(1);
    setShowQuickCustomDrawer(false);
  };

  // Add Bundle (Optional)
  const handleAddBundle = (bundle: ItemBundle) => {
    const newLines: DocumentLine[] = bundle.items.map((it, idx) => ({
      id: `line-${Date.now()}-${idx}`,
      name: it.name,
      sizeSpec: it.sizeSpec || '',
      material: it.material,
      size: it.size,
      unit: it.unit,
      quantity: it.quantity,
      ratePaise: it.ratePaise,
      taxRate: isTaxEnabled ? taxRatePercent : 0,
      lineTotalPaise: Math.round(it.quantity * it.ratePaise),
      isCustomScopeBlock: false,
    }));

    setLines((prev) => [...prev, ...newLines]);
    setShowBundlePicker(false);
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
          return updated;
        }
        return line;
      })
    );
  };

  // Material or Size change for standard items
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
          return {
            ...line,
            material: newMaterial,
            size: newSize,
            sizeSpec: `${newSize} (${newMaterial})`,
            ratePaise: newRatePaise,
            lineTotalPaise: Math.round(qty * newRatePaise),
          };
        }
        return line;
      })
    );
  };

  // Move line up or down
  const handleMoveLine = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === lines.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newLines = [...lines];
    const [moved] = newLines.splice(index, 1);
    newLines.splice(targetIndex, 0, moved);
    setLines(newLines);
  };

  // Delete line
  const handleDeleteLine = (line: DocumentLine) => {
    setLines((prev) => prev.filter((l) => l.id !== line.id));
    onDeletedLine(line);
  };

  // Save handler
  const handleSave = () => {
    const cust = getActiveCustomerSnapshot();
    if (!cust.name || cust.name === 'Valued Customer') {
      alert('Please enter or select a customer name.');
      return;
    }
    if (lines.length === 0) {
      alert('Please add at least one line item or work scope paragraph.');
      return;
    }

    const currentDoc = buildCurrentDocument();
    onSave(currentDoc);
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
    <div className="max-w-5xl mx-auto pb-36 px-3 sm:px-6 pt-3">
      {/* Top Header Sticky Bar */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            aria-label="Back"
            className="p-2 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                {initialDocument ? 'Edit' : 'New'}{' '}
                {documentType === 'quotation' ? 'Quotation' : 'Tax Bill'}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-sky-100 text-sky-800 font-bold">
                {docNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Create official contractor quote or customer bill with custom scope paragraphs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenPreview(buildCurrentDocument())}
            className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <span>👁️ Preview Letterhead</span>
          </button>

          <button
            onClick={handleSave}
            className="h-10 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <FileCheck className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ============================================================
            SECTION 1: CUSTOMER & SITE LOCATION
            ============================================================ */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                Customer &amp; Work Location (ग्राहक विवरण)
              </span>
              <p className="text-xs text-slate-500 ml-8">
                Enter customer name, phone number, and where plumbing work is being done.
              </p>
            </div>

            {/* Toggle Existing Customer vs Direct Type */}
            {customers.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setIsDirectCustomerMode(true)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    isDirectCustomerMode
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Type Direct Details
                </button>
                <button
                  type="button"
                  onClick={() => setIsDirectCustomerMode(false)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    !isDirectCustomerMode
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pick Existing Customer ({customers.length})
                </button>
              </div>
            )}
          </div>

          {!isDirectCustomerMode && customers.length > 0 ? (
            /* Pick Existing Customer Dropdown */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Saved Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const sel = customers.find((c) => c.id === e.target.value);
                    if (sel) {
                      setDirectCustName(sel.name);
                      setDirectCustPhone(sel.phone);
                      setDirectCustSite(sel.siteAddress || '');
                      setDirectCustAddress(sel.address || '');
                      setDirectCustGstin(sel.gstin || '');
                    }
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} {c.siteAddress ? `· Site: ${c.siteAddress}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          ) : (
            /* Direct Simple Inputs for Plumber */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer / Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sahoo or Mr. Sharma"
                  value={directCustName}
                  onChange={(e) => setDirectCustName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (WhatsApp)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={directCustPhone}
                  onChange={(e) => setDirectCustPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Site / Work Address (साइट का पता)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 302, Green Valley Apartments, Chandrasekharpur"
                  value={directCustSite}
                  onChange={(e) => setDirectCustSite(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 21ABCDE1234F1Z5"
                  value={directCustGstin}
                  onChange={(e) => setDirectCustGstin(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          {/* Quick status & validity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Document Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuotationBillDocument['status'])}
                className="w-full h-9 px-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800"
              >
                <option value="draft">Draft (कच्चा)</option>
                <option value="sent">Sent to Customer (भेजा गया)</option>
                <option value="accepted">Accepted / Approved (पास)</option>
                <option value="partial">Partially Paid (कुछ पैसा मिला)</option>
                <option value="paid">Fully Paid (पूरा भुगतान)</option>
              </select>
            </div>

            {documentType === 'quotation' && (
              <div>
                <label className="block font-bold text-slate-600 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-600 mb-1">Letterhead Format</label>
              <select
                value={selectedFormatId}
                onChange={(e) => setSelectedFormatId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800"
              >
                {formats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ============================================================
            SECTION 2: WORK ITEMS & WORK SCOPE PARAGRAPHS
            ============================================================ */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                Work Scope &amp; Item Details (काम और सामान)
              </span>
              <p className="text-xs text-slate-500 ml-8">
                Add contractor narrative paragraphs, individual pipe fittings, or custom work lines.
              </p>
            </div>

            {/* Prominent, Un-forced Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
              {/* PRIMARY FEATURE: Add Narrative Paragraph */}
              <button
                type="button"
                onClick={handleAddScopeParagraphBlock}
                className="h-10 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs active:scale-95 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>+ Add Work Paragraph</span>
              </button>

              {/* Add Material / Fitting from Catalogue */}
              <button
                type="button"
                onClick={() => setShowItemPicker(true)}
                className="h-10 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Plumbing Item</span>
              </button>

              {/* Quick Custom Item */}
              <button
                type="button"
                onClick={() => setShowQuickCustomDrawer(!showQuickCustomDrawer)}
                className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>+ Custom Item</span>
              </button>

              {/* Subdued Optional Bundle Helper */}
              {bundles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowBundlePicker(true)}
                  className="h-10 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1.5 border border-slate-200 transition-colors"
                  title="Optionally pick a pre-saved list of fittings and pipes"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bundle (Optional)</span>
                </button>
              )}
            </div>
          </div>

          {/* Inline Quick Custom Item Bar if open */}
          {showQuickCustomDrawer && (
            <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                  Add One-Off Custom Plumbing Item
                </span>
                <button
                  onClick={() => setShowQuickCustomDrawer(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Item / Work description (e.g. Wall Mixer Installation)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Size / Brand (e.g. Jaquar 3/4 inch)"
                    value={customSizeSpec}
                    onChange={(e) => setCustomSizeSpec(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-800"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="w-16">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="0.1"
                      value={customQty}
                      onChange={(e) => setCustomQty(parseFloat(e.target.value) || 1)}
                      className="w-full h-10 px-2 rounded-xl bg-white border border-slate-300 text-xs text-center font-bold"
                    />
                  </div>
                  <div className="w-20">
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value as UnitType)}
                      className="w-full h-10 px-1 rounded-xl bg-white border border-slate-300 text-xs font-semibold"
                    >
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Rate (₹):</span>
                  <input
                    type="number"
                    placeholder="Price in Rupees"
                    min="0"
                    value={customRateRupees || ''}
                    onChange={(e) => setCustomRateRupees(parseFloat(e.target.value) || 0)}
                    className="w-32 h-9 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900"
                  />
                  <span className="text-xs text-slate-500 font-mono">
                    Total: {formatINR(Math.round((customRateRupees || 0) * (customQty || 1) * 100))}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuickCustomItem}
                  disabled={!customName.trim()}
                  className="h-9 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs"
                >
                  + Add to List
                </button>
              </div>
            </div>
          )}

          {/* Lines Empty State */}
          {lines.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 mx-auto flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No items or scope added yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                Choose how you want to quote: write your own detailed work scope paragraph or pick individual plumbing pipes and fittings.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleAddScopeParagraphBlock}
                  className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>+ Add Work Description Paragraph</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowItemPicker(true)}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Browse Catalogue Items</span>
                </button>
              </div>
            </div>
          ) : (
            /* Items & Paragraphs List */
            <div className="space-y-4">
              {lines.map((line, index) => {
                const isParagraph = Boolean(line.isCustomScopeBlock || line.descriptionParagraph);

                return (
                  <div
                    key={line.id}
                    className={`rounded-2xl border transition-all ${
                      isParagraph
                        ? 'p-4 sm:p-5 bg-purple-50/40 border-purple-200 hover:border-purple-300 shadow-2xs'
                        : 'p-3.5 sm:p-4 bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Header of Item Row: Index, Type Badge, Reorder, Delete */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-xs font-mono font-bold text-slate-700 shrink-0">
                          {index + 1}
                        </span>

                        {isParagraph ? (
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-200/80 text-purple-900 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Work Scope Paragraph (काम का विवरण)
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            Material / Fitting Item
                          </span>
                        )}
                      </div>

                      {/* Reorder and Delete Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveLine(index, 'up')}
                          disabled={index === 0}
                          title="Move Up"
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveLine(index, 'down')}
                          disabled={index === lines.length - 1}
                          title="Move Down"
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLine(line)}
                          title="Delete this line"
                          className="ml-1 px-2.5 py-1 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {isParagraph ? (
                      /* ========================================================
                         RENDER PARAGRAPH / NARRATIVE WORK BLOCK
                         ======================================================== */
                      <div className="space-y-3">
                        {/* Title Input */}
                        <div>
                          <label className="block text-[11px] font-bold text-purple-950 uppercase mb-1">
                            Scope / Heading Title:
                          </label>
                          <input
                            type="text"
                            value={line.name}
                            onChange={(e) => handleUpdateLine(line.id, { name: e.target.value })}
                            className="w-full h-10 px-3 rounded-xl bg-white border border-purple-200 font-bold text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g. Master Bedroom Toilet Plumbing Pipeline Work"
                          />
                        </div>

                        {/* Narrative Paragraph Text Area */}
                        <div>
                          <label className="block text-[11px] font-bold text-purple-950 uppercase mb-1">
                            Contractor Work Scope Paragraph (विवरण लिखें):
                          </label>
                          <textarea
                            rows={3}
                            value={line.descriptionParagraph || ''}
                            onChange={(e) =>
                              handleUpdateLine(line.id, {
                                descriptionParagraph: e.target.value,
                                sizeSpec: e.target.value.slice(0, 100),
                              })
                            }
                            className="w-full p-3 rounded-xl bg-white border border-purple-200 text-xs sm:text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Write your custom paragraphs here: e.g. Laying CPVC 1 inch concealed hot & cold pipeline with 4 wall mixers, 2 showers, 2 western commodes and testing under 5 bar pressure..."
                          />
                        </div>

                        {/* Amount & Pricing for Scope */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-100">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-700">Estimated Work Cost:</span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={line.ratePaise / 100}
                                onChange={(e) => {
                                  const rupees = parseFloat(e.target.value) || 0;
                                  handleUpdateLine(line.id, {
                                    ratePaise: Math.round(rupees * 100),
                                    quantity: 1,
                                    unit: 'Job',
                                  });
                                }}
                                className="w-36 h-9 pl-6 pr-2 rounded-lg bg-white border border-purple-200 text-sm font-bold text-slate-900"
                              />
                            </div>
                            <span className="text-xs text-slate-500">(Lump-sum for this scope)</span>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] text-slate-500 block">Scope Total</span>
                            <span className="text-base sm:text-lg font-bold font-mono text-purple-950">
                              {formatINR(line.lineTotalPaise)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ========================================================
                         RENDER STANDARD MATERIAL / FITTING ITEM
                         ======================================================== */
                      <div className="space-y-2.5">
                        {/* Name and Dropdowns */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <input
                            type="text"
                            value={line.name}
                            onChange={(e) => handleUpdateLine(line.id, { name: e.target.value })}
                            className="font-bold text-sm sm:text-base text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none flex-1"
                            placeholder="Item Name (e.g. Elbow 90 Degree)"
                          />

                          {/* Interactive Type & Size Dropdowns */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Material/Type */}
                            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Type:</span>
                              <select
                                value={
                                  line.material ||
                                  (line.sizeSpec?.includes('UPVC')
                                    ? 'UPVC'
                                    : line.sizeSpec?.includes('Brass')
                                    ? 'Brass'
                                    : line.sizeSpec?.includes('GI')
                                    ? 'GI'
                                    : 'CPVC')
                                }
                                onChange={(e) =>
                                  handleMaterialOrSizeChange(
                                    line.id,
                                    e.target.value,
                                    line.size || '3/4 inch'
                                  )
                                }
                                className="text-xs font-bold text-sky-800 bg-transparent focus:outline-none cursor-pointer"
                              >
                                {STANDARD_MATERIALS.map((mat) => (
                                  <option key={mat} value={mat}>
                                    {mat}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Size */}
                            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Size:</span>
                              <select
                                value={line.size || '3/4 inch'}
                                onChange={(e) =>
                                  handleMaterialOrSizeChange(
                                    line.id,
                                    line.material || 'CPVC',
                                    e.target.value
                                  )
                                }
                                className="text-xs font-bold text-sky-800 bg-transparent focus:outline-none cursor-pointer"
                              >
                                {STANDARD_SIZES.map((sz) => (
                                  <option key={sz} value={sz}>
                                    {sz}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Numeric Row: Quantity, Unit, Rate, Total */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/70 items-center">
                          {/* Quantity */}
                          <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                              Quantity (मात्रा)
                            </label>
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateLine(line.id, {
                                    quantity: Math.max(1, line.quantity - 1),
                                  })
                                }
                                className="w-8 h-9 bg-slate-200 hover:bg-slate-300 rounded-l-lg text-slate-700 font-bold text-xs"
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
                                className="w-14 h-9 text-center text-xs font-bold bg-white border-y border-slate-300 text-slate-900"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateLine(line.id, {
                                    quantity: line.quantity + 1,
                                  })
                                }
                                className="w-8 h-9 bg-slate-200 hover:bg-slate-300 rounded-r-lg text-slate-700 font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Unit */}
                          <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                              Unit (इकाई)
                            </label>
                            <select
                              value={line.unit}
                              onChange={(e) =>
                                handleUpdateLine(line.id, {
                                  unit: e.target.value as UnitType,
                                })
                              }
                              className="w-full h-9 px-2 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                            >
                              {COMMON_UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Rate (₹) */}
                          <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                              Rate / Item (₹)
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
                              className="w-full h-9 px-2 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900"
                            />
                          </div>

                          {/* Total */}
                          <div className="text-right">
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                              Amount (रुपये)
                            </label>
                            <span className="text-sm sm:text-base font-bold font-mono text-slate-900 tabular-nums">
                              {formatINR(line.lineTotalPaise)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================
            SECTION 3: TAX, DISCOUNT, ADVANCE & LIVE SUMMARY
            ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Easy Contractor Settings */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <span className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              Taxes, Discount &amp; Advance (भुगतान)
            </span>

            {/* Simple GST Switch */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    Apply GST Tax (जीएसटी)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Turn ON only if providing an official GST invoice
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTaxEnabled}
                    onChange={(e) => {
                      setIsTaxEnabled(e.target.checked);
                      // Update line taxes
                      setLines((prev) =>
                        prev.map((l) => ({
                          ...l,
                          taxRate: e.target.checked ? taxRatePercent : 0,
                        }))
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {isTaxEnabled && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">GST Rate:</span>
                    <select
                      value={taxRatePercent}
                      onChange={(e) => {
                        const newRate = Number(e.target.value);
                        setTaxRatePercent(newRate);
                        setLines((prev) =>
                          prev.map((l) => ({
                            ...l,
                            taxRate: newRate,
                          }))
                        );
                      }}
                      className="h-8 px-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800"
                    >
                      {TAX_RATES.map((r) => (
                        <option key={r} value={r}>
                          {r}% GST
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsInterState(false)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        !isInterState ? 'bg-sky-600 text-white' : 'bg-white border text-slate-700'
                      }`}
                    >
                      CGST + SGST
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInterState(true)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        isInterState ? 'bg-sky-600 text-white' : 'bg-white border text-slate-700'
                      }`}
                    >
                      IGST
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Discount */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Discount Given (छूट)
              </label>
              <div className="flex gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                  className="h-10 px-3 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800"
                >
                  <option value="fixed">Rupees (₹ Fixed)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder={discountType === 'fixed' ? 'e.g. 500' : 'e.g. 5'}
                  className="h-10 flex-1 px-3 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Advance Payment Received */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Advance Payment Received (अग्रिम राशि) ₹
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={advancePaidRupees || ''}
                onChange={(e) => setAdvancePaidRupees(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 5000 (Token advance paid by customer)"
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
              />
              <p className="text-[11px] text-slate-500">
                Will be clearly deducted to display remaining balance on the bill.
              </p>
            </div>

            {/* Contractor Terms & Conditions Box */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Terms &amp; Work Conditions (शर्तें और वारंटी)
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contractor terms, payment milestones, leakage warranty..."
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
              />
            </div>
          </div>

          {/* Right Column: High-Contrast Live Billing Summary */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="font-bold text-sm tracking-wide text-sky-400 uppercase">
                  Calculation Summary (हिसाब)
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {lines.length} {lines.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-white text-base">
                    {formatINR(calcs.subtotalPaise)}
                  </span>
                </div>

                {calcs.discountPaise > 0 && (
                  <div className="flex justify-between items-center text-emerald-400">
                    <span>
                      Discount ({discountType === 'percentage' ? `${discountValue}%` : '₹'}):
                    </span>
                    <span className="font-mono font-bold">
                      -{formatINR(calcs.discountPaise)}
                    </span>
                  </div>
                )}

                {isTaxEnabled && (
                  <>
                    <div className="flex justify-between items-center text-slate-400 text-xs">
                      <span>Taxable Value:</span>
                      <span className="font-mono">{formatINR(calcs.taxableValuePaise)}</span>
                    </div>

                    {isInterState ? (
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>IGST ({taxRatePercent}%):</span>
                        <span className="font-mono">{formatINR(calcs.igstPaise)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center text-slate-400 text-xs">
                          <span>CGST ({(taxRatePercent / 2).toFixed(1)}%):</span>
                          <span className="font-mono">{formatINR(calcs.cgstPaise)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400 text-xs">
                          <span>SGST ({(taxRatePercent / 2).toFixed(1)}%):</span>
                          <span className="font-mono">{formatINR(calcs.sgstPaise)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}

                {calcs.roundOffPaise !== 0 && (
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>Round-off:</span>
                    <span className="font-mono">{formatINR(calcs.roundOffPaise)}</span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="border-t border-slate-700 pt-3 flex justify-between items-baseline">
                  <span className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                    Grand Total:
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-sky-400 tabular-nums">
                    {formatINR(calcs.grandTotalPaise)}
                  </span>
                </div>

                {/* Advance & Balance Due */}
                <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 space-y-2 mt-2">
                  <div className="flex justify-between items-center text-xs text-emerald-400">
                    <span className="font-semibold">Advance Payment Received:</span>
                    <span className="font-mono font-bold">
                      {formatINR(calcs.totalPaidPaise)}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline text-rose-300 font-bold border-t border-slate-700/80 pt-2">
                    <span className="text-sm uppercase tracking-wide">Balance Due:</span>
                    <span className="text-xl sm:text-2xl font-black font-mono tabular-nums">
                      {formatINR(calcs.balanceDuePaise)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* In Words */}
            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 italic">
              Amount in words: &quot;{calcs.amountInWords}&quot;
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-xl">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Grand Total</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 tabular-nums">
            {formatINR(calcs.grandTotalPaise)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenPreview(buildCurrentDocument())}
            className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold active:scale-95 transition-all"
          >
            👁️ Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-11 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <FileCheck className="w-4 h-4" />
            <span>Save Document</span>
          </button>
        </div>
      </div>

      {/* Catalogue Item Picker Modal */}
      {showItemPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Add Plumbing Item from Catalogue</h3>
                <p className="text-xs text-slate-500">Pick item, size, and material type</p>
              </div>
              <button
                type="button"
                onClick={() => setShowItemPicker(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search elbow, tee, pipe, valve, tap, tank..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {[
                  'All',
                  'Fittings',
                  'Pipes',
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
                    type="button"
                    onClick={() => setPickerCategory(cat)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-semibold transition-colors ${
                      pickerCategory === cat
                        ? 'bg-sky-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Items List */}
            <div className="overflow-y-auto p-3 space-y-2 divide-y divide-slate-100 flex-1">
              {filteredGlossary.map((item) => (
                <CatalogueItemRow
                  key={item.id}
                  item={item}
                  onAdd={(it, mat, sz) => handleAddGlossaryItem(it, mat, sz)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unobtrusive Pre-built Item Bundle Picker Modal (Optional) */}
      {showBundlePicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Saved Packages &amp; Bundles (Optional)</h3>
                <p className="text-xs text-slate-500">
                  Optional helper: add a pre-saved set of materials with 1 click
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBundlePicker(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 font-bold"
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
                      type="button"
                      onClick={() => handleAddBundle(bundle)}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shrink-0 active:scale-95 transition-all"
                    >
                      + Add All Items
                    </button>
                  </div>

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
    </div>
  );
};

// Catalogue Item Row Component
const CatalogueItemRow: React.FC<{
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
          <div className="font-bold text-xs sm:text-sm text-slate-900">
            {item.name}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
            {item.category && <span>{item.category}</span>}
            {item.hasVariants && (
              <span className="text-emerald-700 font-semibold">· Size &amp; Material options</span>
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
            type="button"
            onClick={() => onAdd(item, selectedMaterial, selectedSize)}
            className="h-8 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shrink-0 active:scale-95 transition-all"
          >
            + Add
          </button>
        </div>
      ) : (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onAdd(item)}
            className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shrink-0 active:scale-95 transition-all"
          >
            + Add to List
          </button>
        </div>
      )}
    </div>
  );
};
