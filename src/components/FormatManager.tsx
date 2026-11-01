import React, { useState } from 'react';
import {
  Upload,
  Plus,
  Sliders,
  Check,
  Eye,
  Trash2,
  FileText,
  Sparkles,
  Layers,
  Copy,
  RotateCcw,
  Palette,
  Type,
  Layout,
  Table as TableIcon,
  CreditCard,
  Stamp,
  ShieldCheck,
  FileBadge,
} from 'lucide-react';
import {
  FormatTemplate,
  LogoType,
  FontFamilyOption,
  HeaderAlignment,
  DividerStyle,
  LayoutPresentation,
  TableDensity,
  TableBorderStyle,
  DocumentBoxStyle,
  BankCardStyle,
  UpiQrPosition,
  SignatureAlignment,
  WatermarkType,
  QuotationBillDocument,
} from '../types';
import { storage } from '../services/storage';
import { DEFAULT_FORMATS } from '../data/defaultFormats';
import { resolveFormatConfig, getFontFamilyCSS } from '../utils/formatResolver';
import { LetterheadLogo } from './LetterheadLogo';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface FormatManagerProps {
  formats: FormatTemplate[];
  onSaveFormat: (format: FormatTemplate) => void;
  onDeleteFormat: (id: string) => void;
}

type TabKey = 'header' | 'typography' | 'blocks' | 'table' | 'totals' | 'footer' | 'watermark';

// Sample document for live preview in the manager
const MOCK_PREVIEW_DOC: QuotationBillDocument = {
  id: 'mock-doc-preview',
  type: 'quotation',
  number: 'QUO-2026-088',
  date: '01/11/2026',
  validUntil: '15/11/2026',
  customerId: 'mock-cust-1',
  customerSnapshot: {
    id: 'mock-cust-1',
    name: 'Sri Alok Mohanty',
    phone: '+91 94370 55443',
    email: 'alok.mohanty@gmail.com',
    address: 'Plot 108, Saheed Nagar, Bhubaneswar',
    siteAddress: 'Duplex No 4B, Royal Palm Enclave, Patia, Bhubaneswar',
    createdAt: Date.now(),
  },
  lines: [
    {
      id: 'mock-line-1',
      name: 'P.H.D Piping & Rainwater Pipeline Work',
      material: 'CPVC Schedule 80',
      sizeSpec: '3/4 inch & 1 inch concealed piping for 2 bathrooms and kitchen',
      quantity: 1,
      unit: 'Job',
      ratePaise: 1850000,
      taxRate: 18,
      lineTotalPaise: 1850000,
    },
    {
      id: 'mock-line-2',
      name: 'CPVC 3/4" 90° Heavy Duty Elbows (Panam)',
      material: 'CPVC',
      size: '3/4 inch',
      sizeSpec: '3/4 inch Solvent Welded (10 Pcs Pack)',
      quantity: 3,
      unit: 'Pkt',
      ratePaise: 65000,
      taxRate: 18,
      lineTotalPaise: 195000,
    },
    {
      id: 'mock-line-3',
      name: 'Concealed Heavy Stop Cock (Brass Body)',
      material: 'Brass Chrome Plated',
      size: '15mm',
      sizeSpec: '15mm with flange and metal knob',
      quantity: 2,
      unit: 'Nos',
      ratePaise: 145000,
      taxRate: 18,
      lineTotalPaise: 290000,
    },
  ],
  isTaxEnabled: true,
  isInterState: false,
  isPriceTaxInclusive: false,
  discountType: 'percentage',
  discountValue: 5,
  advancePaidPaise: 500000,
  payments: [],
  status: 'sent',
  formatId: 'format-phd-contractor',
  notes: 'Quality plumbing workmanship guaranteed.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const FormatManager: React.FC<FormatManagerProps> = ({
  formats,
  onSaveFormat,
  onDeleteFormat,
}) => {
  const profile = storage.getProfile();
  const [selectedFormat, setSelectedFormat] = useState<FormatTemplate>(
    formats[0] || DEFAULT_FORMATS[0]
  );
  const [activeTab, setActiveTab] = useState<TabKey>('header');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [showFullModalPreview, setShowFullModalPreview] = useState(false);

  // Resolved config object for active editing
  const cfg = resolveFormatConfig(selectedFormat);

  // Helper to deep update selectedFormat
  const updateFormat = (updater: (prev: FormatTemplate) => FormatTemplate) => {
    setSelectedFormat((prev) => {
      const updated = updater(prev);
      onSaveFormat(updated);
      return updated;
    });
  };

  // Helper to clone a template
  const handleDuplicate = (base: FormatTemplate) => {
    const newFmt: FormatTemplate = {
      ...base,
      id: `format-${Date.now()}`,
      name: `${base.name} (Copy)`,
      isDefault: false,
    };
    onSaveFormat(newFmt);
    setSelectedFormat(newFmt);
  };

  // Helper to create a new blank format
  const handleCreateNew = (mode: 'built_in' | 'custom_background') => {
    const base = DEFAULT_FORMATS[0];
    const newFmt: FormatTemplate = {
      ...base,
      id: `format-${Date.now()}`,
      name: mode === 'custom_background' ? 'Uploaded Letterhead Format' : 'Custom Letterhead Format',
      mode,
      isDefault: false,
    };
    onSaveFormat(newFmt);
    setSelectedFormat(newFmt);
    setActiveTab(mode === 'custom_background' ? 'watermark' : 'header');
  };

  // Helper to reset default formats to factory settings
  const handleResetDefaults = () => {
    if (window.confirm('Reset all built-in letterhead formats to factory original templates?')) {
      DEFAULT_FORMATS.forEach((df) => onSaveFormat(df));
      setSelectedFormat(DEFAULT_FORMATS[0]);
    }
  };

  // Pre-printed Background Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      updateFormat((prev) => ({
        ...prev,
        mode: 'custom_background',
        backgroundImage: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Custom Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      updateFormat((prev) => ({
        ...prev,
        header: {
          ...resolveFormatConfig(prev).header,
          logoType: 'custom',
          customLogoUrl: result,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 pb-24">
      {/* Active Format Header Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LetterheadLogo
            type={cfg.header.logoType}
            customUrl={cfg.header.customLogoUrl}
            size={40}
            primaryColor={cfg.styling.primaryColor}
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900">
                P.H.D Contractor Official Style
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                Official Default
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Complete granular visual styling for all quotations and tax invoices
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFullModalPreview(true)}
          className="h-9 px-3.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all self-stretch sm:self-auto justify-center"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Full Document View</span>
        </button>
      </div>



      {/* Format Name & Quick Mode Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Format Name:
          </label>
          <input
            type="text"
            value={selectedFormat.name}
            onChange={(e) =>
              updateFormat((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full sm:w-80 h-9 px-3 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Type:</span>
            <select
              value={selectedFormat.type}
              onChange={(e) =>
                updateFormat((prev) => ({
                  ...prev,
                  type: e.target.value as FormatTemplate['type'],
                }))
              }
              className="h-8 px-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700"
            >
              <option value="both">Both Quotation &amp; Bill</option>
              <option value="quotation">Quotation Only</option>
              <option value="bill">Bill Only</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Mobile Tab switch */}
          <div className="flex lg:hidden items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setMobileView('editor')}
              className={`px-3 py-1 text-xs font-semibold rounded-md ${
                mobileView === 'editor' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
              }`}
            >
              Configure
            </button>
            <button
              onClick={() => setMobileView('preview')}
              className={`px-3 py-1 text-xs font-semibold rounded-md ${
                mobileView === 'preview' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
              }`}
            >
              Live Preview
            </button>
          </div>

          <button
            onClick={() => setShowFullModalPreview(true)}
            className="h-9 px-3.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Full Document View</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Comprehensive Customizer Left, Real-time Live Document Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Configuration Tabs & Granular Settings */}
        <div
          className={`lg:col-span-6 space-y-4 ${
            mobileView === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Tabs Navigation */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('header')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'header'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileBadge className="w-3.5 h-3.5" />
              <span>1. Header &amp; Emblem</span>
            </button>

            <button
              onClick={() => setActiveTab('typography')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'typography'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>2. Fonts &amp; Colors</span>
            </button>

            <button
              onClick={() => setActiveTab('blocks')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'blocks'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>3. Document &amp; Client</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'table'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>4. Table &amp; Presentation</span>
            </button>

            <button
              onClick={() => setActiveTab('totals')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'totals'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>5. Totals &amp; Words</span>
            </button>

            <button
              onClick={() => setActiveTab('footer')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'footer'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>6. Bank, QR &amp; Sign</span>
            </button>

            <button
              onClick={() => setActiveTab('watermark')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'watermark'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>7. Watermark &amp; Margins</span>
            </button>
          </div>

          {/* TAB 1: HEADER & EMBLEM */}
          {activeTab === 'header' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                <FileBadge className="w-4 h-4 text-sky-600" />
                <span>Header Emblem &amp; Branding Details</span>
              </h3>

              {/* Logo / Emblem Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Emblem / Logo Icon:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'shiva', label: 'Lord Shiva Medallion' },
                    { type: 'pipe_wrench', label: 'Crossed Pipe & Wrench' },
                    { type: 'tools', label: 'Sanitary Tool Kit' },
                    { type: 'water_drop', label: 'Hydraulic Water Drop' },
                    { type: 'contractor_shield', label: 'Certified Shield' },
                    { type: 'industrial_valve', label: 'Industrial Valve' },
                    { type: 'custom', label: 'Custom Logo / Image' },
                    { type: 'none', label: 'No Icon (Text Only)' },
                  ].map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            logoType: opt.type as LogoType,
                          },
                        }))
                      }
                      className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                        cfg.header.logoType === opt.type
                          ? 'border-sky-500 bg-sky-50 font-bold text-sky-900 shadow-sm ring-1 ring-sky-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <LetterheadLogo
                        type={opt.type as LogoType}
                        customUrl={cfg.header.customLogoUrl}
                        size={32}
                        primaryColor={cfg.styling.primaryColor}
                      />
                      <span className="text-[11px] leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Logo Upload if custom selected */}
              {cfg.header.logoType === 'custom' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Upload Your Custom Business Logo:
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-500"
                  />
                  {cfg.header.customLogoUrl && (
                    <div className="flex items-center gap-2 pt-1">
                      <img
                        src={cfg.header.customLogoUrl}
                        alt="Preview"
                        className="w-12 h-12 object-contain border rounded"
                      />
                      <span className="text-xs text-emerald-600 font-semibold">
                        Logo loaded successfully!
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Logo Size & Frame Controls */}
              {cfg.header.logoType !== 'none' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Emblem Size</span>
                      <span className="font-mono text-sky-700">{cfg.header.logoSizePx} px</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={130}
                      step={4}
                      value={cfg.header.logoSizePx}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            logoSizePx: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg accent-sky-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Emblem Frame Style
                    </label>
                    <select
                      value={cfg.header.logoFrame}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            logoFrame: e.target.value as any,
                          },
                        }))
                      }
                      className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700"
                    >
                      <option value="none">None (Borderless)</option>
                      <option value="double_ring">Double Circular Ring (Official Seal)</option>
                      <option value="circle">Single Circle Ring</option>
                      <option value="rounded">Rounded Square</option>
                      <option value="square">Square Frame</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Top Auspicious Invocation Header */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Auspicious Invocation Line (Top Header)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.header.showInvocation}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            showInvocation: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>Show</span>
                  </label>
                </div>
                {cfg.header.showInvocation && (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={cfg.header.topInvocationText || ''}
                      placeholder="e.g. || ଶ୍ରୀ ଶ୍ରୀ ଧବଳେଶ୍ୱର ପ୍ରସନ୍ନ || or || ॐ नमः शिवाय ||"
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            topInvocationText: e.target.value,
                          },
                        }))
                      }
                      className="w-full h-8 px-3 rounded-lg border border-slate-300 text-xs text-slate-800"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '|| ଶ୍ରୀ ଶ୍ରୀ ଧବଳେଶ୍ୱର ପ୍ରସନ୍ନ ||',
                        '|| ॐ नमः शिवाय ||',
                        '|| श्री गणेशाय नमः ||',
                        '|| ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ ||',
                        '|| IN THE NAME OF GOD ||',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            updateFormat((p) => ({
                              ...p,
                              header: {
                                ...resolveFormatConfig(p).header,
                                topInvocationText: preset,
                              },
                            }))
                          }
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contractor Name Styling */}
              <div className="space-y-3 border-t pt-4">
                <label className="text-xs font-bold text-slate-700 block">
                  Contractor / Firm Name Typography
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Font Family</label>
                    <select
                      value={cfg.header.contractorNameFontFamily}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            contractorNameFontFamily: e.target.value as FontFamilyOption,
                          },
                        }))
                      }
                      className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700"
                    >
                      <option value="serif">Classic Serif (Times/Georgia)</option>
                      <option value="playfair">Playfair Display (Luxury)</option>
                      <option value="cinzel">Cinzel (Royal Roman)</option>
                      <option value="merriweather">Merriweather (Editorial)</option>
                      <option value="slab">Roboto Slab (Contractor)</option>
                      <option value="jakarta">Plus Jakarta Sans (Modern)</option>
                      <option value="outfit">Outfit (Geometric)</option>
                      <option value="sans">System Sans</option>
                      <option value="mono">JetBrains Mono (Technical)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Size</span>
                      <span className="font-mono text-sky-700">
                        {cfg.header.contractorNameFontSizePx}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={18}
                      max={40}
                      value={cfg.header.contractorNameFontSizePx}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            contractorNameFontSizePx: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg accent-sky-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Name Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cfg.header.contractorNameColor}
                        onChange={(e) =>
                          updateFormat((p) => ({
                            ...p,
                            header: {
                              ...resolveFormatConfig(p).header,
                              contractorNameColor: e.target.value,
                            },
                          }))
                        }
                        className="w-8 h-8 rounded border p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cfg.header.contractorNameColor}
                        onChange={(e) =>
                          updateFormat((p) => ({
                            ...p,
                            header: {
                              ...resolveFormatConfig(p).header,
                              contractorNameColor: e.target.value,
                            },
                          }))
                        }
                        className="w-24 h-8 px-2 rounded border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.header.contractorNameUppercase}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            contractorNameUppercase: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>All Uppercase (e.g. P.H.D CONTRACTOR)</span>
                  </label>

                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <span>Spacing:</span>
                    <select
                      value={cfg.header.contractorLetterSpacing}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            contractorLetterSpacing: e.target.value as any,
                          },
                        }))
                      }
                      className="h-7 px-2 rounded border border-slate-300 text-xs font-medium"
                    >
                      <option value="normal">Normal</option>
                      <option value="wide">Wide</option>
                      <option value="widest">Extra Wide</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <span>Alignment:</span>
                    <select
                      value={cfg.header.alignment}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            alignment: e.target.value as HeaderAlignment,
                          },
                        }))
                      }
                      className="h-7 px-2 rounded border border-slate-300 text-xs font-medium"
                    >
                      <option value="split">Split (Logo Left, Text Center/Right)</option>
                      <option value="center">Centered Stack</option>
                      <option value="left">Left Aligned</option>
                      <option value="right">Right Aligned</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tagline / Subtitle */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Tagline / Designation Styling ("P.H.D Contractor")
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.header.showTagline}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            showTagline: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>Show</span>
                  </label>
                </div>
                {cfg.header.showTagline && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Tagline Size</span>
                        <span className="font-mono text-sky-700">
                          {cfg.header.taglineFontSizePx}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={20}
                        value={cfg.header.taglineFontSizePx}
                        onChange={(e) =>
                          updateFormat((p) => ({
                            ...p,
                            header: {
                              ...resolveFormatConfig(p).header,
                              taglineFontSizePx: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg accent-sky-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Tagline Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={cfg.header.taglineColor}
                          onChange={(e) =>
                            updateFormat((p) => ({
                              ...p,
                              header: {
                                ...resolveFormatConfig(p).header,
                                taglineColor: e.target.value,
                              },
                            }))
                          }
                          className="w-8 h-8 rounded border p-0.5 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={cfg.header.taglineColor}
                          onChange={(e) =>
                            updateFormat((p) => ({
                              ...p,
                              header: {
                                ...resolveFormatConfig(p).header,
                                taglineColor: e.target.value,
                              },
                            }))
                          }
                          className="w-24 h-8 px-2 rounded border border-slate-300 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Row Info & Divider */}
              <div className="space-y-3 border-t pt-4">
                <label className="text-xs font-bold text-slate-700 block">
                  Contact Row Visibility &amp; Header Rule
                </label>
                <div className="flex flex-wrap gap-4 text-xs">
                  <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.header.showAddress}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            showAddress: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>Address</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.header.showPhone}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            showPhone: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>Primary Phone</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.header.showAltPhone}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            showAltPhone: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>Alternate Phone</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.header.showEmail}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            showEmail: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>Email</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.header.showGstin}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            showGstin: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>GSTIN</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Divider Style</label>
                    <select
                      value={cfg.header.dividerStyle}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            dividerStyle: e.target.value as DividerStyle,
                          },
                        }))
                      }
                      className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-medium"
                    >
                      <option value="solid">Solid Black Rule (Official)</option>
                      <option value="double">Double Horizontal Line</option>
                      <option value="dashed">Dashed Line</option>
                      <option value="dotted">Dotted Line</option>
                      <option value="gradient">Gradient Accent Bar</option>
                      <option value="none">No Divider</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Divider Thickness</span>
                      <span className="font-mono text-sky-700">
                        {cfg.header.dividerThicknessPx}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={6}
                      value={cfg.header.dividerThicknessPx}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          header: {
                            ...resolveFormatConfig(p).header,
                            dividerThicknessPx: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg accent-sky-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Divider Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cfg.header.dividerColor}
                        onChange={(e) =>
                          updateFormat((p) => ({
                            ...p,
                            header: {
                              ...resolveFormatConfig(p).header,
                              dividerColor: e.target.value,
                            },
                          }))
                        }
                        className="w-8 h-8 rounded border p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cfg.header.dividerColor}
                        onChange={(e) =>
                          updateFormat((p) => ({
                            ...p,
                            header: {
                              ...resolveFormatConfig(p).header,
                              dividerColor: e.target.value,
                            },
                          }))
                        }
                        className="w-24 h-8 px-2 rounded border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FONTS & COLORS */}
          {activeTab === 'typography' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-600" />
                <span>Brand Colors &amp; Document Typography</span>
              </h3>

              {/* Color Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Quick Brand Palette Presets:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { name: 'P.H.D Royal Plum', primary: '#702670', secondary: '#b45309' },
                    { name: 'Modern Sky Blue', primary: '#0284c7', secondary: '#38bdf8' },
                    { name: 'Industrial Emerald', primary: '#059669', secondary: '#10b981' },
                    { name: 'Classic Contractor Navy', primary: '#1e3a8a', secondary: '#3b82f6' },
                    { name: 'Minimal Slate Dark', primary: '#0f172a', secondary: '#64748b' },
                    { name: 'Sanitary Bronze Amber', primary: '#b45309', secondary: '#d97706' },
                    { name: 'Ruby Industrial', primary: '#b91c1c', secondary: '#f87171' },
                    { name: 'Steel Blue Corporate', primary: '#2563eb', secondary: '#60a5fa' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        updateFormat((p) => ({
                          ...p,
                          styling: {
                            ...resolveFormatConfig(p).styling,
                            primaryColor: preset.primary,
                            secondaryColor: preset.secondary,
                          },
                          totals: {
                            ...resolveFormatConfig(p).totals,
                            highlightColor: preset.primary,
                          },
                          table: {
                            ...resolveFormatConfig(p).table,
                            headerBgColor: preset.primary,
                          },
                        }))
                      }
                      className="p-2 rounded-xl border border-slate-200 hover:border-slate-400 text-left flex items-center gap-2 transition-all"
                    >
                      <div
                        style={{ backgroundColor: preset.primary }}
                        className="w-5 h-5 rounded-full shrink-0 shadow-sm border border-black/10"
                      />
                      <span className="text-[11px] font-semibold text-slate-800 leading-tight">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cfg.styling.primaryColor}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          styling: {
                            ...resolveFormatConfig(p).styling,
                            primaryColor: e.target.value,
                          },
                        }))
                      }
                      className="w-9 h-9 rounded-lg border p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={cfg.styling.primaryColor}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          styling: {
                            ...resolveFormatConfig(p).styling,
                            primaryColor: e.target.value,
                          },
                        }))
                      }
                      className="w-24 h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Secondary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cfg.styling.secondaryColor}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          styling: {
                            ...resolveFormatConfig(p).styling,
                            secondaryColor: e.target.value,
                          },
                        }))
                      }
                      className="w-9 h-9 rounded-lg border p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={cfg.styling.secondaryColor}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          styling: {
                            ...resolveFormatConfig(p).styling,
                            secondaryColor: e.target.value,
                          },
                        }))
                      }
                      className="w-24 h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Paper Canvas Tint
                  </label>
                  <select
                    value={cfg.styling.paperBgColor}
                    onChange={(e) =>
                      updateFormat((p) => ({
                        ...p,
                        styling: {
                          ...resolveFormatConfig(p).styling,
                          paperBgColor: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-medium"
                  >
                    <option value="#ffffff">Pure Crisp White (#ffffff)</option>
                    <option value="#fdfbf7">Warm Ivory Cream (#fdfbf7)</option>
                    <option value="#f8fafc">Cool Ice Slate (#f8fafc)</option>
                    <option value="#fafaf9">Warm Stone Neutral (#fafaf9)</option>
                  </select>
                </div>
              </div>

              {/* Base Document Font & Sizing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Body Font Family
                  </label>
                  <select
                    value={cfg.styling.fontFamily}
                    onChange={(e) =>
                      updateFormat((p) => ({
                        ...p,
                        styling: {
                          ...resolveFormatConfig(p).styling,
                          fontFamily: e.target.value as FontFamilyOption,
                        },
                      }))
                    }
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-medium"
                  >
                    <option value="serif">Classic Serif (Official Look)</option>
                    <option value="jakarta">Plus Jakarta Sans (Modern Clean)</option>
                    <option value="slab">Roboto Slab (Sturdy Contractor)</option>
                    <option value="outfit">Outfit (Contemporary)</option>
                    <option value="playfair">Playfair Display (Elegant)</option>
                    <option value="cinzel">Cinzel (Formal Stone)</option>
                    <option value="mono">JetBrains Mono (Technical Spec)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Base Font Size</span>
                    <span className="font-mono text-sky-700">{cfg.styling.baseFontSizePx}px</span>
                  </div>
                  <input
                    type="range"
                    min={11}
                    max={15}
                    value={cfg.styling.baseFontSizePx}
                    onChange={(e) =>
                      updateFormat((p) => ({
                        ...p,
                        styling: {
                          ...resolveFormatConfig(p).styling,
                          baseFontSizePx: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full h-1.5 bg-slate-200 rounded-lg accent-sky-600 mt-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Corner Border Radius</span>
                    <span className="font-mono text-sky-700">{cfg.styling.borderRadiusPx}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={16}
                    step={2}
                    value={cfg.styling.borderRadiusPx}
                    onChange={(e) =>
                      updateFormat((p) => ({
                        ...p,
                        styling: {
                          ...resolveFormatConfig(p).styling,
                          borderRadiusPx: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full h-1.5 bg-slate-200 rounded-lg accent-sky-600 mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENT & CLIENT BLOCK */}
          {activeTab === 'blocks' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                <Layout className="w-4 h-4 text-sky-600" />
                <span>Document Titles &amp; Client Address Block</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Quotation Header Title
                  </label>
                  <input
                    type="text"
                    value={cfg.metadataBlock.quotationTitle}
                    onChange={(e) =>
                      updateFormat((p) => ({
                        ...p,
                        metadataBlock: {
                          ...resolveFormatConfig(p).metadataBlock,
                          quotationTitle: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Bill / Invoice Header Title
                  </label>
                  <input
                    type="text"
                    value={cfg.metadataBlock.billTitle}
                    onChange={(e) =>
                      updateFormat((p) => ({
                        ...p,
                        metadataBlock: {
                          ...resolveFormatConfig(p).metadataBlock,
                          billTitle: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Customer Box Style */}
              <div className="space-y-3 border-t pt-4">
                <label className="text-xs font-bold text-slate-700 block">
                  Customer &amp; Site Details Block
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Card Box Style</label>
                    <select
                      value={cfg.customerBlock.style}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          customerBlock: {
                            ...resolveFormatConfig(p).customerBlock,
                            style: e.target.value as DocumentBoxStyle,
                          },
                        }))
                      }
                      className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-medium"
                    >
                      <option value="bordered_box">Bordered Box (Official P.H.D Style)</option>
                      <option value="rounded_card">Rounded Modern Card</option>
                      <option value="accent_left">Accent Left Color Bar</option>
                      <option value="minimal">Minimal (Clean Borderless)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">"Bill To" Custom Label</label>
                    <input
                      type="text"
                      value={cfg.customerBlock.billToLabel}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          customerBlock: {
                            ...resolveFormatConfig(p).customerBlock,
                            billToLabel: e.target.value,
                          },
                        }))
                      }
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      "Site / Work Address" Custom Label
                    </label>
                    <input
                      type="text"
                      value={cfg.customerBlock.siteLabel}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          customerBlock: {
                            ...resolveFormatConfig(p).customerBlock,
                            siteLabel: e.target.value,
                          },
                        }))
                      }
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.customerBlock.showSiteAddress}
                        onChange={(e) =>
                          updateFormat((p) => ({
                            ...p,
                            customerBlock: {
                              ...resolveFormatConfig(p).customerBlock,
                              showSiteAddress: e.target.checked,
                            },
                          }))
                        }
                        className="rounded text-sky-600"
                      />
                      <span>Show Site Address</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.customerBlock.showCustomerPhone}
                        onChange={(e) =>
                          updateFormat((p) => ({
                            ...p,
                            customerBlock: {
                              ...resolveFormatConfig(p).customerBlock,
                              showCustomerPhone: e.target.checked,
                            },
                          }))
                        }
                        className="rounded text-sky-600"
                      />
                      <span>Show Phone</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.customerBlock.showCustomerEmail}
                        onChange={(e) =>
                          updateFormat((p) => ({
                            ...p,
                            customerBlock: {
                              ...resolveFormatConfig(p).customerBlock,
                              showCustomerEmail: e.target.checked,
                            },
                          }))
                        }
                        className="rounded text-sky-600"
                      />
                      <span>Show Email</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TABLE & PRESENTATION */}
          {activeTab === 'table' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-sky-600" />
                <span>Line Items Table &amp; Presentation Style</span>
              </h3>

              {/* Big Style Choice: Milestone Scope Blocks vs Table */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Body Items Presentation Format:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() =>
                      updateFormat((p) => ({
                        ...p,
                        table: {
                          ...resolveFormatConfig(p).table,
                          presentation: 'letterhead_blocks',
                        },
                      }))
                    }
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      cfg.table.presentation === 'letterhead_blocks'
                        ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-4 h-4 text-[#702670]" />
                      <span className="font-bold text-xs text-slate-900">
                        Contractor Project Scope Blocks
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Matches official P.H.D Contractor style: large bold violet item headings, narrative scope of work, and right-aligned line totals.
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      updateFormat((p) => ({
                        ...p,
                        table: {
                          ...resolveFormatConfig(p).table,
                          presentation: 'itemized_table',
                        },
                      }))
                    }
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      cfg.table.presentation === 'itemized_table'
                        ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <TableIcon className="w-4 h-4 text-sky-600" />
                      <span className="font-bold text-xs text-slate-900">
                        Detailed Itemized Table Grid
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Multi-column grid with S.No, Description, Size/Spec, Qty, Unit, Rate, GST %, and Total Amount.
                    </p>
                  </div>
                </div>
              </div>

              {/* Table Grid Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Row Padding Density
                  </label>
                  <select
                    value={cfg.table.density}
                    onChange={(e) =>
                      updateFormat((p) => ({
                        ...p,
                        table: {
                          ...resolveFormatConfig(p).table,
                          density: e.target.value as TableDensity,
                        },
                      }))
                    }
                    className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-medium"
                  >
                    <option value="compact">Compact (More items per page)</option>
                    <option value="normal">Normal (Balanced)</option>
                    <option value="spacious">Spacious (Executive)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Grid Border Style
                  </label>
                  <select
                    value={cfg.table.borderStyle}
                    onChange={(e) =>
                      updateFormat((p) => ({
                        ...p,
                        table: {
                          ...resolveFormatConfig(p).table,
                          borderStyle: e.target.value as TableBorderStyle,
                        },
                      }))
                    }
                    className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-medium"
                  >
                    <option value="full_grid">Full Grid (All Cells Bordered)</option>
                    <option value="horizontal_only">Horizontal Dividers Only</option>
                    <option value="boxed">Boxed Border</option>
                    <option value="clean_minimal">Clean Minimalist</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Alternating Rows
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1.5">
                    <input
                      type="checkbox"
                      checked={cfg.table.alternatingRowBg}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          table: {
                            ...resolveFormatConfig(p).table,
                            alternatingRowBg: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>Zebra Stripe Rows</span>
                  </label>
                </div>
              </div>

              {/* Column Visibility Toggles */}
              <div className="space-y-2 border-t pt-4">
                <label className="text-xs font-bold text-slate-700 block">
                  Columns to Display in Quotation / Bill:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(selectedFormat.columnVisibility).map(([colKey, isVisible]) => (
                    <label
                      key={colKey}
                      className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={(e) =>
                          updateFormat((p) => ({
                            ...p,
                            columnVisibility: {
                              ...p.columnVisibility,
                              [colKey]: e.target.checked,
                            },
                          }))
                        }
                        className="rounded text-sky-600"
                      />
                      <span className="capitalize font-medium text-slate-800">
                        {colKey === 'sno'
                          ? 'S.No'
                          : colKey === 'sizeSpec'
                          ? 'Size / Spec'
                          : colKey}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Column Header Labels */}
              <div className="space-y-2 border-t pt-4">
                <label className="text-xs font-bold text-slate-700 block">
                  Customize Column Header Text:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">S.No Label</span>
                    <input
                      type="text"
                      value={cfg.table.snoLabel}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          table: { ...resolveFormatConfig(p).table, snoLabel: e.target.value },
                        }))
                      }
                      className="w-full h-7 px-2 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">Description Label</span>
                    <input
                      type="text"
                      value={cfg.table.descriptionLabel}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          table: { ...resolveFormatConfig(p).table, descriptionLabel: e.target.value },
                        }))
                      }
                      className="w-full h-7 px-2 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">Quantity Label</span>
                    <input
                      type="text"
                      value={cfg.table.quantityLabel}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          table: { ...resolveFormatConfig(p).table, quantityLabel: e.target.value },
                        }))
                      }
                      className="w-full h-7 px-2 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">Rate Label</span>
                    <input
                      type="text"
                      value={cfg.table.rateLabel}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          table: { ...resolveFormatConfig(p).table, rateLabel: e.target.value },
                        }))
                      }
                      className="w-full h-7 px-2 border rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TOTALS, TAX & WORDS */}
          {activeTab === 'totals' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Totals Summary &amp; Amount in Words</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Total Highlight Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cfg.totals.highlightColor}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          totals: {
                            ...resolveFormatConfig(p).totals,
                            highlightColor: e.target.value,
                          },
                        }))
                      }
                      className="w-8 h-8 rounded border p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={cfg.totals.highlightColor}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          totals: {
                            ...resolveFormatConfig(p).totals,
                            highlightColor: e.target.value,
                          },
                        }))
                      }
                      className="w-28 h-8 px-2 rounded border border-slate-300 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Amount in Words Display Style
                  </label>
                  <select
                    value={cfg.totals.amountInWordsStyle}
                    onChange={(e) =>
                      updateFormat((p) => ({
                        ...p,
                        totals: {
                          ...resolveFormatConfig(p).totals,
                          amountInWordsStyle: e.target.value as any,
                        },
                      }))
                    }
                    className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-medium"
                  >
                    <option value="banner">Prominent Full Width Banner</option>
                    <option value="pill">Subtle Rounded Badge Pill</option>
                    <option value="italic_note">Classic Italic Line</option>
                    <option value="none">Hidden</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 border-t pt-4">
                <label className="text-xs font-bold text-slate-700 block">
                  Show or Hide Calculation Rows:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.totals.showTaxBreakdown}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          totals: {
                            ...resolveFormatConfig(p).totals,
                            showTaxBreakdown: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>GST Tax Breakdown</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.totals.showDiscountLine}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          totals: {
                            ...resolveFormatConfig(p).totals,
                            showDiscountLine: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>Discount Line</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.totals.showAdvancePaid}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          totals: {
                            ...resolveFormatConfig(p).totals,
                            showAdvancePaid: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>Advance Received</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.totals.showBalanceDue}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          totals: {
                            ...resolveFormatConfig(p).totals,
                            showBalanceDue: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>Remaining Balance</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BANK, QR & SIGNATURE */}
          {activeTab === 'footer' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                <Stamp className="w-4 h-4 text-sky-600" />
                <span>Bank Details, UPI QR &amp; Authorized Signature</span>
              </h3>

              {/* Bank Details & UPI QR Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Bank Details Card Style
                  </label>
                  <select
                    value={cfg.footer.bankStyle}
                    onChange={(e) =>
                      updateFormat((p) => ({
                        ...p,
                        footer: {
                          ...resolveFormatConfig(p).footer,
                          bankStyle: e.target.value as BankCardStyle,
                        },
                      }))
                    }
                    className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-medium"
                  >
                    <option value="card">Rounded Card with Borders</option>
                    <option value="minimal">Minimal Plain Text</option>
                    <option value="table">Tabular Bordered Block</option>
                    <option value="hidden">Hide Bank Details</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    UPI QR Code Placement
                  </label>
                  <select
                    value={cfg.footer.upiPosition}
                    onChange={(e) =>
                      updateFormat((p) => ({
                        ...p,
                        footer: {
                          ...resolveFormatConfig(p).footer,
                          upiPosition: e.target.value as UpiQrPosition,
                        },
                      }))
                    }
                    className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-medium"
                  >
                    <option value="bottom_right">Bottom Right of Page</option>
                    <option value="with_bank">Integrated in Bank Card</option>
                    <option value="bottom_left">Bottom Left</option>
                    <option value="hidden">Hide UPI QR Code</option>
                  </select>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Terms &amp; Conditions Text:
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFormat.showTerms}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          showTerms: e.target.checked,
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>Show on Document</span>
                  </label>
                </div>
                {selectedFormat.showTerms && (
                  <textarea
                    rows={4}
                    value={cfg.footer.termsText || ''}
                    onChange={(e) =>
                      updateFormat((p) => ({
                        ...p,
                        footer: {
                          ...resolveFormatConfig(p).footer,
                          termsText: e.target.value,
                        },
                      }))
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 font-mono leading-relaxed focus:ring-2 focus:ring-sky-500"
                  />
                )}
              </div>

              {/* Signature Line */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Authorized Signatory Block
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFormat.showSignature}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          showSignature: e.target.checked,
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>Show</span>
                  </label>
                </div>

                {selectedFormat.showSignature && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">
                        Signatory Name / Firm
                      </span>
                      <input
                        type="text"
                        value={cfg.footer.signatureTitle}
                        onChange={(e) =>
                          updateFormat((p) => ({
                            ...p,
                            footer: {
                              ...resolveFormatConfig(p).footer,
                              signatureTitle: e.target.value,
                            },
                          }))
                        }
                        placeholder="e.g. P.H.D CONTRACTOR"
                        className="w-full h-8 px-2.5 border rounded-lg text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">
                        Designation / Role
                      </span>
                      <input
                        type="text"
                        value={cfg.footer.signatureSubtext || ''}
                        onChange={(e) =>
                          updateFormat((p) => ({
                            ...p,
                            footer: {
                              ...resolveFormatConfig(p).footer,
                              signatureSubtext: e.target.value,
                            },
                          }))
                        }
                        placeholder="e.g. P.H.D Contractor (Signature)"
                        className="w-full h-8 px-2.5 border rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Footer Note */}
              <div className="border-t pt-4 space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Custom Greeting / Footer Note:
                </label>
                <input
                  type="text"
                  value={cfg.footer.customFooterNote}
                  onChange={(e) =>
                    updateFormat((p) => ({
                      ...p,
                      footer: {
                        ...resolveFormatConfig(p).footer,
                        customFooterNote: e.target.value,
                      },
                    }))
                  }
                  className="w-full h-8 px-3 border rounded-lg text-xs text-slate-700"
                />
              </div>
            </div>
          )}

          {/* TAB 7: WATERMARK & MARGINS */}
          {activeTab === 'watermark' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-600" />
                <span>Security Watermark &amp; Page Margins</span>
              </h3>

              {/* Watermark Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Background Watermark
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.watermark.enabled}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          watermark: {
                            ...resolveFormatConfig(p).watermark,
                            enabled: e.target.checked,
                          },
                        }))
                      }
                      className="rounded text-sky-600"
                    />
                    <span>Enable Watermark</span>
                  </label>
                </div>

                {cfg.watermark.enabled && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Watermark Type
                        </label>
                        <select
                          value={cfg.watermark.type}
                          onChange={(e) =>
                            updateFormat((p) => ({
                              ...p,
                              watermark: {
                                ...resolveFormatConfig(p).watermark,
                                type: e.target.value as WatermarkType,
                              },
                            }))
                          }
                          className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-medium"
                        >
                          <option value="logo">Emblem / Logo Watermark</option>
                          <option value="text">Diagonal Custom Text</option>
                        </select>
                      </div>

                      {cfg.watermark.type === 'text' && (
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            Watermark Text
                          </label>
                          <input
                            type="text"
                            value={cfg.watermark.text}
                            onChange={(e) =>
                              updateFormat((p) => ({
                                ...p,
                                watermark: {
                                  ...resolveFormatConfig(p).watermark,
                                  text: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g. P.H.D CONTRACTOR or ESTIMATE"
                            className="w-full h-8 px-2.5 border rounded-lg text-xs font-bold uppercase"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>Opacity</span>
                          <span className="font-mono text-sky-700">
                            {cfg.watermark.opacityPercent}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={25}
                          value={cfg.watermark.opacityPercent}
                          onChange={(e) =>
                            updateFormat((p) => ({
                              ...p,
                              watermark: {
                                ...resolveFormatConfig(p).watermark,
                                opacityPercent: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full h-1.5 bg-slate-200 rounded-lg accent-sky-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>Angle / Rotation</span>
                          <span className="font-mono text-sky-700">
                            {cfg.watermark.rotationDeg}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-45}
                          max={45}
                          value={cfg.watermark.rotationDeg}
                          onChange={(e) =>
                            updateFormat((p) => ({
                              ...p,
                              watermark: {
                                ...resolveFormatConfig(p).watermark,
                                rotationDeg: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full h-1.5 bg-slate-200 rounded-lg accent-sky-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pre-printed Option A Background Upload */}
              <div className="space-y-3 border-t pt-4">
                <label className="text-xs font-bold text-slate-700 block">
                  Option A: Pre-Printed Physical Letterhead Scan / PDF
                </label>
                <p className="text-xs text-slate-500">
                  If you already have physical stationery letterhead paper with pre-printed logo and header, upload its scan here. The app will print items only in the designated body area.
                </p>

                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                  />

                  {selectedFormat.backgroundImage && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Pre-printed letterhead image attached
                      </span>
                      <button
                        onClick={() =>
                          updateFormat((p) => ({
                            ...p,
                            backgroundImage: undefined,
                            mode: 'built_in',
                          }))
                        }
                        className="text-xs text-rose-600 hover:underline font-semibold"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>

                {/* Printable Margin Offsets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">Top Margin %</span>
                    <input
                      type="number"
                      min={5}
                      max={45}
                      value={selectedFormat.bodyArea.topPercent}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          bodyArea: {
                            ...p.bodyArea,
                            topPercent: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full h-8 px-2 border rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">Bottom Margin %</span>
                    <input
                      type="number"
                      min={5}
                      max={45}
                      value={selectedFormat.bodyArea.bottomPercent}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          bodyArea: {
                            ...p.bodyArea,
                            bottomPercent: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full h-8 px-2 border rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">Left Margin %</span>
                    <input
                      type="number"
                      min={2}
                      max={25}
                      value={selectedFormat.bodyArea.leftPercent}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          bodyArea: {
                            ...p.bodyArea,
                            leftPercent: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full h-8 px-2 border rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">Right Margin %</span>
                    <input
                      type="number"
                      min={2}
                      max={25}
                      value={selectedFormat.bodyArea.rightPercent}
                      onChange={(e) =>
                        updateFormat((p) => ({
                          ...p,
                          bodyArea: {
                            ...p.bodyArea,
                            rightPercent: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full h-8 px-2 border rounded text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Real-Time Live Letterhead Canvas Preview */}
        <div
          className={`lg:col-span-6 space-y-3 sticky top-4 ${
            mobileView === 'editor' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            <span>Instant Live Letterhead Preview</span>
            <span className="text-sky-700 font-semibold normal-case">
              Updates in real-time
            </span>
          </div>

          {/* Interactive Document Sheet Canvas */}
          <div
            style={{
              backgroundColor: cfg.styling.paperBgColor || '#ffffff',
              color: cfg.styling.textColor || '#0f172a',
              fontFamily: getFontFamilyCSS(cfg.styling.fontFamily),
              borderRadius: `${cfg.styling.borderRadiusPx || 8}px`,
            }}
            className="border border-slate-300 shadow-xl p-6 sm:p-8 space-y-4 relative overflow-hidden text-xs transition-all select-none"
          >
            {/* Live Watermark */}
            {cfg.watermark.enabled && (
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0"
                style={{ opacity: (cfg.watermark.opacityPercent || 6) / 100 }}
              >
                {cfg.watermark.type === 'logo' ? (
                  <div
                    style={{
                      transform: `rotate(${cfg.watermark.rotationDeg || -25}deg)`,
                      width: '240px',
                      height: '240px',
                    }}
                  >
                    <LetterheadLogo
                      type={cfg.header.logoType}
                      customUrl={cfg.header.customLogoUrl}
                      size={240}
                      primaryColor={cfg.styling.primaryColor}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      transform: `rotate(${cfg.watermark.rotationDeg || -25}deg)`,
                      fontSize: `${Math.min(cfg.watermark.fontSizePx || 48, 48)}px`,
                      fontFamily: getFontFamilyCSS(cfg.header.contractorNameFontFamily),
                    }}
                    className="font-black uppercase tracking-widest text-slate-900 whitespace-nowrap"
                  >
                    {cfg.watermark.text || 'PLUMBING QUOTE'}
                  </div>
                )}
              </div>
            )}

            {/* Header Area */}
            <div
              style={{
                borderColor: cfg.header.dividerColor || '#0f172a',
                borderBottomWidth: `${cfg.header.dividerThicknessPx || 2}px`,
                backgroundColor: cfg.header.headerBgColor || 'transparent',
              }}
              className={`pb-3 relative z-10 ${
                cfg.header.dividerStyle === 'double'
                  ? 'border-b-4 border-double'
                  : cfg.header.dividerStyle === 'dashed'
                  ? 'border-b-2 border-dashed'
                  : cfg.header.dividerStyle === 'gradient'
                  ? 'border-b-2 border-transparent bg-gradient-to-r from-transparent via-current to-transparent'
                  : 'border-b-2 border-solid'
              }`}
            >
              {/* Top Auspicious invocation */}
              {cfg.header.showInvocation && cfg.header.topInvocationText && (
                <div className="text-center pb-1 text-[10px] font-serif font-semibold text-slate-600">
                  {cfg.header.topInvocationText}
                </div>
              )}

              <div
                className={`flex items-center gap-3 ${
                  cfg.header.alignment === 'center'
                    ? 'justify-center text-center flex-col'
                    : cfg.header.alignment === 'left'
                    ? 'justify-start text-left'
                    : cfg.header.alignment === 'right'
                    ? 'justify-end text-right'
                    : 'justify-between'
                }`}
              >
                {cfg.header.logoType !== 'none' && (
                  <div className="shrink-0">
                    <LetterheadLogo
                      type={cfg.header.logoType}
                      customUrl={cfg.header.customLogoUrl}
                      size={Math.min(cfg.header.logoSizePx || 70, 70)}
                      frame={cfg.header.logoFrame}
                      primaryColor={cfg.styling.primaryColor}
                    />
                  </div>
                )}

                <div
                  className={`flex-1 ${
                    cfg.header.alignment === 'center'
                      ? 'text-center'
                      : cfg.header.alignment === 'left'
                      ? 'text-left'
                      : cfg.header.alignment === 'right'
                      ? 'text-right'
                      : 'text-center'
                  }`}
                >
                  <h2
                    style={{
                      fontFamily: getFontFamilyCSS(cfg.header.contractorNameFontFamily),
                      fontSize: `${Math.min(cfg.header.contractorNameFontSizePx || 24, 24)}px`,
                      color: cfg.header.contractorNameColor || '#0f172a',
                      letterSpacing:
                        cfg.header.contractorLetterSpacing === 'widest'
                          ? '0.1em'
                          : cfg.header.contractorLetterSpacing === 'wide'
                          ? '0.04em'
                          : 'normal',
                      textTransform: cfg.header.contractorNameUppercase ? 'uppercase' : 'none',
                    }}
                    className="font-bold leading-tight"
                  >
                    {profile.name}
                  </h2>

                  {cfg.header.showTagline && profile.tagline && (
                    <p
                      style={{
                        fontFamily: getFontFamilyCSS(cfg.header.taglineFontFamily),
                        fontSize: `${cfg.header.taglineFontSizePx || 12}px`,
                        color: cfg.header.taglineColor || '#334155',
                      }}
                      className="font-semibold"
                    >
                      {profile.tagline}
                    </p>
                  )}

                  <div
                    style={{
                      fontSize: `${Math.max(cfg.header.contactFontSizePx - 1, 9)}px`,
                      color: cfg.header.contactColor || '#334155',
                    }}
                    className={`mt-1 ${
                      cfg.header.contactRowLayout === 'spaced_between'
                        ? 'flex justify-between items-center'
                        : 'flex flex-wrap items-center justify-center gap-1.5'
                    }`}
                  >
                    {cfg.header.showAddress && (
                      <span>
                        Address: {profile.address}, {profile.cityStatePincode}
                      </span>
                    )}
                    {cfg.header.showPhone && (
                      <span className="font-bold">Mob. - {profile.phone}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Details & Customer Bar */}
            <div
              style={{
                backgroundColor: cfg.customerBlock.bgColor || '#f8fafc',
                borderColor: cfg.customerBlock.borderColor || '#cbd5e1',
                borderRadius: `${cfg.styling.borderRadiusPx || 8}px`,
              }}
              className="p-2.5 border flex justify-between items-start gap-2 relative z-10"
            >
              <div>
                <span className="font-bold text-[9px] text-slate-500 uppercase block">
                  {cfg.customerBlock.billToLabel}
                </span>
                <p className="font-bold text-slate-900 text-xs">{MOCK_PREVIEW_DOC.customerSnapshot.name}</p>
                <p className="text-slate-600 text-[10px]">
                  Phone: {MOCK_PREVIEW_DOC.customerSnapshot.phone}
                </p>
                {cfg.customerBlock.showSiteAddress && (
                  <p className="text-slate-700 text-[10px] font-medium mt-0.5">
                    <strong>{cfg.customerBlock.siteLabel}</strong> Patia, Bhubaneswar
                  </p>
                )}
              </div>

              <div
                style={{
                  backgroundColor: cfg.metadataBlock.badgeBgColor || '#eff6ff',
                  borderColor: cfg.styling.primaryColor,
                }}
                className="p-2 rounded border border-slate-200 text-right min-w-[120px]"
              >
                <div
                  style={{ color: cfg.metadataBlock.titleColor || cfg.styling.primaryColor }}
                  className="font-bold text-[10px] uppercase"
                >
                  {cfg.metadataBlock.quotationTitle}
                </div>
                <p className="font-bold text-slate-900 text-[10px]">{MOCK_PREVIEW_DOC.number}</p>
                <p className="text-slate-600 text-[9px]">{MOCK_PREVIEW_DOC.date}</p>
              </div>
            </div>

            {/* Body Content */}
            <div className="relative z-10">
              {cfg.table.presentation === 'letterhead_blocks' ? (
                /* P.H.D Contractor Blocks */
                <div className="space-y-3 pt-1">
                  {MOCK_PREVIEW_DOC.lines.map((l) => (
                    <div key={l.id} className="border-b border-slate-200/80 pb-2">
                      <h4
                        style={{ color: cfg.totals.highlightColor || cfg.styling.primaryColor }}
                        className="font-bold text-xs"
                      >
                        {l.name}
                      </h4>
                      <p className="text-[10px] text-slate-700">{l.sizeSpec}</p>
                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <span className="text-slate-800">
                          {l.quantity > 1
                            ? `${l.quantity} ${l.unit} x Rs. ${(l.ratePaise / 100).toLocaleString('en-IN')}/-`
                            : 'Remaining Payment Balance'}
                        </span>
                        <span
                          style={{ color: cfg.totals.highlightColor || cfg.styling.primaryColor }}
                          className="font-bold font-mono"
                        >
                          Rs. ${(l.lineTotalPaise / 100).toLocaleString('en-IN')}/-
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900 font-bold text-xs">
                    <span>Total cost</span>
                    <span
                      style={{ color: cfg.totals.highlightColor || cfg.styling.primaryColor }}
                      className="font-mono text-sm"
                    >
                      Rs. 23,350/-
                    </span>
                  </div>
                </div>
              ) : (
                /* Itemized Table */
                <div className="space-y-2">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr
                        style={{
                          backgroundColor: cfg.table.headerBgColor || cfg.styling.primaryColor,
                          color: cfg.table.headerTextColor || '#ffffff',
                        }}
                        className="font-bold"
                      >
                        <th className="p-1.5 w-6 text-center">{cfg.table.snoLabel}</th>
                        <th className="p-1.5">{cfg.table.descriptionLabel}</th>
                        <th className="p-1.5 w-10 text-right">{cfg.table.quantityLabel}</th>
                        <th className="p-1.5 w-12 text-right">{cfg.table.rateLabel}</th>
                        <th className="p-1.5 w-16 text-right">{cfg.table.amountLabel}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {MOCK_PREVIEW_DOC.lines.map((l, i) => (
                        <tr
                          key={l.id}
                          style={{
                            backgroundColor:
                              i % 2 === 1 && cfg.table.alternatingRowBg
                                ? cfg.table.stripeColor
                                : 'transparent',
                          }}
                        >
                          <td className="p-1.5 text-center text-slate-400 font-mono">{i + 1}</td>
                          <td className="p-1.5 font-semibold text-slate-900">{l.name}</td>
                          <td className="p-1.5 text-right font-mono">{l.quantity}</td>
                          <td className="p-1.5 text-right font-mono">
                            {(l.ratePaise / 100).toLocaleString('en-IN')}
                          </td>
                          <td
                            style={{ color: cfg.totals.highlightColor || cfg.styling.primaryColor }}
                            className="p-1.5 text-right font-bold font-mono"
                          >
                            {(l.lineTotalPaise / 100).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end pt-1">
                    <div className="w-48 bg-slate-50 p-2 rounded border border-slate-200 text-[10px] space-y-0.5">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-mono">Rs. 23,350/-</span>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount:</span>
                        <span className="font-mono">-Rs. 1,168/-</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-1">
                        <span>Total:</span>
                        <span
                          style={{ color: cfg.totals.highlightColor || cfg.styling.primaryColor }}
                          className="font-mono"
                        >
                          Rs. 22,182/-
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Amount in words */}
            {cfg.totals.amountInWordsStyle !== 'none' && (
              <div className="p-2 rounded bg-slate-100/90 text-[10px] text-slate-700 relative z-10">
                <span className="font-bold text-slate-900 uppercase">
                  {cfg.totals.amountInWordsLabel}
                </span>{' '}
                <span className="italic">
                  Twenty-Two Thousand One Hundred Eighty-Two Rupees Only
                </span>
              </div>
            )}

            {/* Bank Card / QR */}
            {selectedFormat.showBankDetails && (
              <div className="p-2.5 bg-slate-50/80 rounded border border-slate-200 flex justify-between items-center text-[10px] relative z-10">
                <div>
                  <span className="font-bold text-slate-900 uppercase text-[9px] block">
                    {cfg.footer.bankTitle}
                  </span>
                  <p className="text-slate-600">Bank: {profile.bankName} · A/C: {profile.accountNumber}</p>
                  <p className="text-slate-600">UPI ID: <span className="font-mono font-bold text-sky-800">{profile.upiId}</span></p>
                </div>
                {selectedFormat.showUpiQr && cfg.footer.upiPosition !== 'hidden' && (
                  <div className="p-1 bg-white rounded border flex items-center gap-1 shadow-sm">
                    <span className="text-[8px] font-bold text-slate-700">Scan UPI</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer Signature */}
            <div className="pt-3 flex justify-between items-end text-[10px] relative z-10">
              <span className="text-slate-400 italic">
                {cfg.footer.customFooterNote || 'Thank you!'}
              </span>
              {selectedFormat.showSignature && (
                <div className="text-right">
                  <div className="w-24 border-b border-slate-400 mb-1 ml-auto" />
                  <p className="font-bold text-slate-900">
                    For {cfg.footer.signatureTitle || profile.name}
                  </p>
                  <p className="text-slate-500 text-[9px]">
                    {cfg.footer.signatureSubtext || 'Authorized Signatory'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Modal Document Preview Test */}
      {showFullModalPreview && (
        <DocumentPreviewModal
          document={MOCK_PREVIEW_DOC}
          format={selectedFormat}
          profile={profile}
          onClose={() => setShowFullModalPreview(false)}
        />
      )}
    </div>
  );
};
