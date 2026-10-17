import React, { useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Percent,
  Download,
  Upload,
  BookOpen,
  Check,
  RotateCcw,
  Tag,
  ExternalLink,
  Sliders,
  Sparkles,
  Info,
  Layers,
  Wrench,
} from 'lucide-react';
import { GlossaryItem, UnitType } from '../types';
import { GLOSSARY_CATEGORIES } from '../data/starterGlossary';
import { formatINR } from '../utils/numberToWords';
import {
  PIPE_FITTINGS_VALVES_JOINTS_CONFIG,
  PANAM_FITTINGS_VALVES_JOINTS_CATALOG,
  getPanamGlossaryItems,
  getStandardGlossaryItemsFromConfig,
  getAllConfigGlossaryItems,
  PanamItemSpecification,
} from '../data/pipeFittingsValvesJointsConfig';
import {
  getVariantPricePaise,
  STANDARD_MATERIALS,
  STANDARD_SIZES,
} from '../utils/variantPricing';

interface GlossaryManagerProps {
  glossary: GlossaryItem[];
  onSaveItem: (item: GlossaryItem) => void;
  onDeleteItem: (id: string) => void;
  onBulkUpdateRates: (percentage: number, category?: string) => void;
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

/**
 * Interactive card row for each glossary item
 * If the item has variants (e.g. Elbow, Tee, Union, Valve), it allows selecting
 * Size and Type from dropdowns with instantaneous price recalculation.
 */
const InteractiveGlossaryRow: React.FC<{
  item: GlossaryItem;
  onEdit: (item: GlossaryItem) => void;
  onDelete: (id: string) => void;
}> = ({ item, onEdit, onDelete }) => {
  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    item.availableMaterials?.[0] || (item.sizeSpec?.includes('UPVC') ? 'UPVC' : 'CPVC')
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    item.availableSizes?.includes('3/4 inch')
      ? '3/4 inch'
      : item.availableSizes?.[0] || '3/4 inch'
  );

  const currentRatePaise = item.hasVariants
    ? getVariantPricePaise(item, selectedMaterial, selectedSize)
    : item.defaultRatePaise;

  const currentRateWithTaxPaise = Math.round(
    currentRatePaise * (1 + (item.taxRate || 18) / 100)
  );

  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      {/* Item Name & Details */}
      <td className="py-3 px-4">
        <div className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
          <span>{item.name}</span>
          {item.hasVariants && (
            <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-md border border-sky-200">
              Multi-Variant
            </span>
          )}
        </div>
        {item.notes && (
          <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm line-clamp-1">
            {item.notes}
          </p>
        )}
      </td>

      {/* Category */}
      <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
          {item.category}
        </span>
      </td>

      {/* Size & Type Dropdowns (Interactive!) */}
      <td className="py-3 px-4">
        {item.hasVariants ? (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type / Material Dropdown */}
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-300 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Type:</span>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="text-xs font-bold text-sky-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {(item.availableMaterials || STANDARD_MATERIALS).map((mat) => (
                  <option key={mat} value={mat}>
                    {mat}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Dropdown */}
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-300 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Size:</span>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="text-xs font-bold text-sky-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {(item.availableSizes || STANDARD_SIZES).map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <span className="text-slate-600 text-xs">{item.sizeSpec || 'Standard'}</span>
        )}
      </td>

      {/* Unit */}
      <td className="py-3 px-4 text-center text-slate-600 text-xs font-medium">
        {item.unit}
      </td>

      {/* Dynamic Rate Readout */}
      <td className="py-3 px-4 text-right">
        <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 tabular-nums">
          {formatINR(currentRatePaise)}
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          incl. GST: {formatINR(currentRateWithTaxPaise)}
        </div>
      </td>

      {/* GST % */}
      <td className="py-3 px-4 text-center text-slate-500 font-mono text-xs">
        {item.taxRate}%
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
          title="Edit item"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete "${item.name}" from glossary?`)) {
              onDelete(item.id);
            }
          }}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
};

export const GlossaryManager: React.FC<GlossaryManagerProps> = ({
  glossary,
  onSaveItem,
  onDeleteItem,
  onBulkUpdateRates,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showStandardsModal, setShowStandardsModal] = useState(false);
  const [standardsTab, setStandardsTab] = useState<'panam' | 'ncert' | 'clamps' | 'terms'>('panam');

  // Interactive tester for Panam specs inside modal
  const [panamTestSelections, setPanamTestSelections] = useState<
    Record<string, { material: string; size: string }>
  >({});

  // Bulk rate update state
  const [bulkPercent, setBulkPercent] = useState<number>(5);
  const [bulkCategory, setBulkCategory] = useState<string>('All');

  // Add / Edit Item state
  const [editingItem, setEditingItem] = useState<GlossaryItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Pipes');
  const [itemSize, setItemSize] = useState('');
  const [itemUnit, setItemUnit] = useState<UnitType>('Nos');
  const [itemRateRupees, setItemRateRupees] = useState<number>(0);
  const [itemTaxRate, setItemTaxRate] = useState<number>(18);
  const [itemHasVariants, setItemHasVariants] = useState<boolean>(false);

  const openNewItem = () => {
    setEditingItem(null);
    setItemName('');
    setItemCategory(selectedCategory === 'All' ? 'Pipes' : selectedCategory);
    setItemSize('');
    setItemUnit('Nos');
    setItemRateRupees(0);
    setItemTaxRate(18);
    setItemHasVariants(false);
    setShowItemModal(true);
  };

  const openEditItem = (item: GlossaryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemSize(item.sizeSpec);
    setItemUnit(item.unit);
    setItemRateRupees(item.defaultRatePaise / 100);
    setItemTaxRate(item.taxRate);
    setItemHasVariants(!!item.hasVariants);
    setShowItemModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const saved: GlossaryItem = {
      id: editingItem?.id || `glossary-${Date.now()}`,
      name: itemName.trim(),
      category: itemCategory,
      sizeSpec: itemSize.trim(),
      unit: itemUnit,
      defaultRatePaise: Math.round(itemRateRupees * 100),
      taxRate: itemTaxRate,
      active: true,
      hasVariants: itemHasVariants,
      availableMaterials: editingItem?.availableMaterials || STANDARD_MATERIALS.slice(0, 6),
      availableSizes: editingItem?.availableSizes || STANDARD_SIZES.slice(1, 7),
      variantPrices: editingItem?.variantPrices,
    };

    onSaveItem(saved);
    setShowItemModal(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Category', 'Name', 'SizeSpec', 'Unit', 'RateINR', 'TaxRatePercent', 'HasVariants'];
    const rows = glossary.map((item) => [
      `"${item.category}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${(item.sizeSpec || '').replace(/"/g, '""')}"`,
      `"${item.unit}"`,
      (item.defaultRatePaise / 100).toFixed(2),
      item.taxRate,
      item.hasVariants ? 'YES' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plumbing_glossary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n');
        let importedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split(',');
          if (parts.length >= 5) {
            const cat = parts[0].replace(/"/g, '').trim();
            const name = parts[1].replace(/"/g, '').trim();
            const size = parts[2].replace(/"/g, '').trim();
            const unit = (parts[3].replace(/"/g, '').trim() as UnitType) || 'Nos';
            const rate = parseFloat(parts[4].replace(/"/g, '').trim()) || 0;
            const tax = parseFloat(parts[5]?.replace(/"/g, '').trim()) || 18;

            if (name) {
              onSaveItem({
                id: `import-${Date.now()}-${i}`,
                category: cat || 'Pipes',
                name,
                sizeSpec: size,
                unit,
                defaultRatePaise: Math.round(rate * 100),
                taxRate: tax,
                active: true,
              });
              importedCount++;
            }
          }
        }
        alert(`Successfully imported ${importedCount} plumbing items.`);
      } catch (err) {
        console.error('Failed to import CSV', err);
        alert('Invalid CSV file format.');
      }
    };
    reader.readAsText(file);
  };

  const filteredItems = glossary.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sizeSpec && item.sizeSpec.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
      {/* Title & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Plumbing Items Glossary</span>
            <span className="text-xs font-normal text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Interactive Dropdowns
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {filteredItems.length} items · Select Type (CPVC, UPVC, Brass, SS 316) &amp; Size to test live rates
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowStandardsModal(true)}
            className="h-10 px-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold flex items-center gap-1.5 border border-sky-200 transition-colors shadow-xs"
            title="View technical configuration, fittings, valves, joints standards (Panam Engineers & NCERT)"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-700" />
            <span>Fittings, Valves &amp; Joints Config</span>
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            className="h-10 px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1.5 border border-amber-200 transition-colors"
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Bulk Rate Update</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <label className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          <button
            onClick={openNewItem}
            className="h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Information Banner for Dynamic Dropdowns */}
      <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-sky-900 shadow-2xs">
        <Sparkles className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">
            Multi-Variant Fitting Engine (Panam Engineers &amp; Standard Plumbing)
          </p>
          <p className="text-slate-600 leading-relaxed">
            Fittings such as <strong>Elbow 90°</strong>, <strong>Equal Tee</strong>, <strong>Three-Piece Union</strong>, and <strong>Ball Valves</strong> contain interactive <strong>Type</strong> (CPVC, UPVC, Brass, GI, SS 304, SS 316) and <strong>Size</strong> (1/4&quot; to 4&quot;) dropdowns. Changing either dropdown immediately recalculates supplier and contractor prices in real-time.
          </p>
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items (e.g. Elbow, Tee, Union, Ball Valve, CPVC, UPVC, Brass, SS 316)..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {GLOSSARY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Interactive Type &amp; Size</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-right">Current Rate</th>
                <th className="py-3 px-4 text-center">GST %</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No items found matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <InteractiveGlossaryRow
                    key={item.id}
                    item={item}
                    onEdit={openEditItem}
                    onDelete={onDeleteItem}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                {editingItem ? 'Edit Glossary Item' : 'New Plumbing Item'}
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Item Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elbow 90°"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full h-10 px-2 rounded-xl bg-slate-50 border border-slate-300 font-medium"
                  >
                    {GLOSSARY_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Size / Spec</label>
                  <input
                    type="text"
                    placeholder="e.g. 3/4 inch (CPVC)"
                    value={itemSize}
                    onChange={(e) => setItemSize(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value as UnitType)}
                    className="w-full h-10 px-2 rounded-xl bg-slate-50 border border-slate-300 font-medium"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={itemRateRupees || ''}
                    onChange={(e) => setItemRateRupees(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST %</label>
                  <select
                    value={itemTaxRate}
                    onChange={(e) => setItemTaxRate(Number(e.target.value))}
                    className="w-full h-10 px-2 rounded-xl bg-slate-50 border border-slate-300 font-medium"
                  >
                    {[0, 5, 12, 18, 28].map((t) => (
                      <option key={t} value={t}>
                        {t}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-sky-50 rounded-xl border border-sky-200">
                <input
                  type="checkbox"
                  id="hasVariantsToggle"
                  checked={itemHasVariants}
                  onChange={(e) => setItemHasVariants(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <label htmlFor="hasVariantsToggle" className="cursor-pointer font-medium text-slate-800">
                  Enable dynamic Size &amp; Type dropdowns with automatic price scaling
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-white shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Rate Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  %
                </div>
                <h3 className="font-bold text-base text-slate-900">Bulk Rate Adjustment</h3>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-500 leading-relaxed">
              Quickly update all supplier prices by a positive or negative percentage when market rates change.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Apply To Category</label>
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-medium"
              >
                {GLOSSARY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Percentage Change (+ or -)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={bulkPercent}
                  onChange={(e) => setBulkPercent(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 5 for +5%, -3 for -3%"
                  className="flex-1 h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                />
                <span className="font-bold text-slate-700 text-sm">%</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onBulkUpdateRates(bulkPercent, bulkCategory);
                  setShowBulkModal(false);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-white shadow-sm"
              >
                Apply Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standards & Technical Configuration Modal */}
      {showStandardsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    Pipe Fittings, Valves &amp; Joints Configuration
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                    <span>Panam Engineers Catalog &amp; Plumbing Standards</span>
                    <a
                      href="https://www.panamengineers.com/ppdf/pipe%20fittings%20-%20pdf.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>Panam Catalog PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowStandardsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Sub-Tabs & Actions Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setStandardsTab('panam')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    standardsTab === 'panam'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Panam Engineers Catalog ({PANAM_FITTINGS_VALVES_JOINTS_CATALOG.length} Items)
                </button>
                <button
                  onClick={() => setStandardsTab('ncert')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    standardsTab === 'ncert'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vocational Standards (NCERT/IPSC)
                </button>
                <button
                  onClick={() => setStandardsTab('clamps')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    standardsTab === 'clamps'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pipe Clamp Spacing (Table 5.1)
                </button>
                <button
                  onClick={() => setStandardsTab('terms')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    standardsTab === 'terms'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Technical Terms
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href="/panam-pipe-fittings-valves-joints.config.json"
                  download="panam-pipe-fittings-valves-joints.config.json"
                  className="h-8 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Config JSON</span>
                </a>

                <button
                  onClick={() => {
                    const panamItems = getPanamGlossaryItems();
                    panamItems.forEach((it) => onSaveItem(it));
                    alert(`Imported ${panamItems.length} Panam Engineers items into active inventory!`);
                    setShowStandardsModal(false);
                  }}
                  className="h-8 px-3.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Import All to Inventory</span>
                </button>
              </div>
            </div>

            {/* Tab Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {standardsTab === 'panam' && (
                <div className="space-y-4">
                  <div className="bg-sky-50/80 p-3.5 rounded-xl border border-sky-200 text-xs text-sky-900 space-y-1">
                    <p className="font-semibold text-sky-950">
                      Panam Engineers Ltd. — High Precision Pipe Fittings, Valves &amp; Joints
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Below are the catalog items with live interactive <strong>Type</strong> and <strong>Size</strong> dropdowns. Try selecting <em>&quot;3/4 inch&quot;</em> and switching between <em>&quot;CPVC&quot;</em>, <em>&quot;UPVC&quot;</em>, <em>&quot;Brass&quot;</em>, or <em>&quot;SS 316&quot;</em> to see the price update dynamically!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {PANAM_FITTINGS_VALVES_JOINTS_CATALOG.map((spec) => {
                      const currentSelection = panamTestSelections[spec.code] || {
                        material: spec.availableMaterials[0] || 'CPVC',
                        size: spec.availableSizes.includes('3/4 inch')
                          ? '3/4 inch'
                          : spec.availableSizes[0] || '3/4 inch',
                      };

                      const dynamicPricePaise = getVariantPricePaise(
                        {
                          id: spec.code,
                          category: spec.category,
                          name: spec.name,
                          sizeSpec: `${currentSelection.size} (${currentSelection.material})`,
                          unit: spec.unit,
                          defaultRatePaise: spec.baseRate3_4CPVCPaise,
                          taxRate: spec.taxRate,
                          active: true,
                        },
                        currentSelection.material,
                        currentSelection.size
                      );

                      return (
                        <div
                          key={spec.code}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 transition-all space-y-2.5 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-bold">
                                  {spec.code}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {spec.subcategory}
                                </span>
                              </div>
                              <h5 className="font-bold text-slate-900 text-sm mt-1">
                                {spec.name}
                              </h5>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono font-bold text-sm text-slate-900 block">
                                {formatINR(dynamicPricePaise)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                per {spec.unit}
                              </span>
                            </div>
                          </div>

                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            {spec.function}
                          </p>

                          {/* Interactive Dropdown Controls */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Type dropdown */}
                              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Type:</span>
                                <select
                                  value={currentSelection.material}
                                  onChange={(e) =>
                                    setPanamTestSelections((prev) => ({
                                      ...prev,
                                      [spec.code]: {
                                        ...currentSelection,
                                        material: e.target.value,
                                      },
                                    }))
                                  }
                                  className="text-xs font-bold text-sky-800 bg-transparent focus:outline-none cursor-pointer"
                                >
                                  {spec.availableMaterials.map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Size dropdown */}
                              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Size:</span>
                                <select
                                  value={currentSelection.size}
                                  onChange={(e) =>
                                    setPanamTestSelections((prev) => ({
                                      ...prev,
                                      [spec.code]: {
                                        ...currentSelection,
                                        size: e.target.value,
                                      },
                                    }))
                                  }
                                  className="text-xs font-bold text-sky-800 bg-transparent focus:outline-none cursor-pointer"
                                >
                                  {spec.availableSizes.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                onSaveItem({
                                  id: `panam-${spec.code.toLowerCase()}`,
                                  category: spec.category,
                                  name: spec.name,
                                  sizeSpec: `${currentSelection.size} (${currentSelection.material})`,
                                  unit: spec.unit,
                                  defaultRatePaise: dynamicPricePaise,
                                  taxRate: spec.taxRate,
                                  active: true,
                                  hasVariants: true,
                                  availableMaterials: spec.availableMaterials,
                                  availableSizes: spec.availableSizes,
                                  notes: `${spec.subcategory} · ${spec.function}`,
                                });
                                alert(`Added "${spec.name}" (${currentSelection.size} ${currentSelection.material}) to your inventory!`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] shadow-2xs active:scale-95 transition-all"
                            >
                              + Add to Inventory
                            </button>
                          </div>

                          {spec.panamCatalogRef && (
                            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                              <span>{spec.panamCatalogRef}</span>
                              {spec.pressureRatings && (
                                <span className="font-mono text-slate-500">{spec.pressureRatings}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {standardsTab === 'ncert' && (
                <div className="space-y-6">
                  {PIPE_FITTINGS_VALVES_JOINTS_CONFIG.categories.map((cat) => (
                    <div key={cat.id} className="space-y-3">
                      <div className="border-b border-slate-200 pb-2">
                        <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider text-sky-700">
                          {cat.name}
                        </h4>
                        <p className="text-xs text-slate-500">{cat.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cat.items.map((item) => (
                          <div
                            key={item.code}
                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-sky-300 transition-all space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-mono text-[10px] text-slate-400 font-bold block">
                                  {item.code} · {item.subcategory}
                                </span>
                                <h5 className="font-bold text-slate-900 text-sm leading-snug">
                                  {item.name}
                                </h5>
                              </div>
                              <span className="font-mono font-bold text-slate-900 shrink-0">
                                {formatINR(item.defaultRatePaise)}/{item.unit}
                              </span>
                            </div>

                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {item.function}
                            </p>

                            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                              <span>
                                <strong>Sizes:</strong> {item.standardSizes.slice(0, 4).join(', ')}
                                {item.standardSizes.length > 4 ? '...' : ''}
                              </span>
                              <span>
                                <strong>Materials:</strong> {item.materials.join(', ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {standardsTab === 'clamps' && (
                <div className="space-y-4">
                  <div className="bg-sky-50 p-4 rounded-xl border border-sky-200 text-xs space-y-1">
                    <h4 className="font-bold text-sky-900 text-sm">
                      GI Pipe Laying &amp; Clamp Spacing (NCERT Table 5.1 Standards)
                    </h4>
                    <p className="text-sky-800 leading-relaxed">
                      For surface fixing, pipes must be held <strong>1.5 cm apart from the wall</strong> and embedded with cement mortar <strong>1:3 (1 cement : 3 coarse sand)</strong>. Must be coated with anti-corrosive paint and laid with sand expansion layers under floors.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3">Diameter (mm)</th>
                          <th className="py-2.5 px-3">Nominal Bore (Inches)</th>
                          <th className="py-2.5 px-3">Max Horizontal Length (m)</th>
                          <th className="py-2.5 px-3">Max Vertical Length (m)</th>
                          <th className="py-2.5 px-3">Mortar Ratio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {PIPE_FITTINGS_VALVES_JOINTS_CONFIG.pipeClampSpacingGuidelines.map((g) => (
                          <tr key={g.diameterMm} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {g.diameterMm} mm
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-sky-700">
                              {g.diameterInch}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {g.horizontalSpacingMeters.toFixed(2)} m
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {g.verticalSpacingMeters.toFixed(2)} m
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">
                              {g.mortarRatio}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {standardsTab === 'terms' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PIPE_FITTINGS_VALVES_JOINTS_CONFIG.technicalVocabulary.map((t) => (
                    <div
                      key={t.term}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs"
                    >
                      <h5 className="font-bold text-slate-900 text-sm text-sky-800">{t.term}</h5>
                      <p className="text-slate-600 leading-relaxed">{t.definition}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span className="font-mono">Panam Engineers &amp; Vocational Schema v2.0.0</span>
              <button
                onClick={() => setShowStandardsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
