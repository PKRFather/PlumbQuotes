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
  Camera,
  Layers,
  Settings2,
} from 'lucide-react';
import { FormatTemplate } from '../types';
import { storage } from '../services/storage';
import { DEFAULT_FORMATS } from '../data/defaultFormats';

interface FormatManagerProps {
  formats: FormatTemplate[];
  onSaveFormat: (format: FormatTemplate) => void;
  onDeleteFormat: (id: string) => void;
}

export const FormatManager: React.FC<FormatManagerProps> = ({
  formats,
  onSaveFormat,
  onDeleteFormat,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<FormatTemplate>(
    formats[0] || DEFAULT_FORMATS[0]
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  // Form State for editing / creating
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<FormatTemplate['type']>('both');
  const [editPageSize, setEditPageSize] = useState<FormatTemplate['pageSize']>('A4');
  const [editMode, setEditMode] = useState<FormatTemplate['mode']>('built_in');
  const [editTheme, setEditTheme] = useState<FormatTemplate['theme']>('modern_sky');
  const [editBgImage, setEditBgImage] = useState<string | undefined>(undefined);
  const [topPercent, setTopPercent] = useState<number>(22);
  const [bottomPercent, setBottomPercent] = useState<number>(18);
  const [leftPercent, setLeftPercent] = useState<number>(6);
  const [rightPercent, setRightPercent] = useState<number>(6);
  const [isDefault, setIsDefault] = useState(false);

  const startNewFormat = (mode: 'custom_background' | 'built_in') => {
    setSelectedFormat({
      id: `format-${Date.now()}`,
      name: mode === 'custom_background' ? 'My Uploaded Letterhead' : 'Custom Built-in Format',
      type: 'both',
      isDefault: false,
      pageSize: 'A4',
      mode,
      theme: 'modern_sky',
      backgroundImage: undefined,
      bodyArea: {
        topPercent: 25,
        bottomPercent: 18,
        leftPercent: 6,
        rightPercent: 6,
      },
      columnVisibility: {
        sno: true,
        description: true,
        sizeSpec: true,
        quantity: true,
        unit: true,
        rate: true,
        tax: true,
        amount: true,
      },
      showUpiQr: true,
      showTerms: true,
      showSignature: true,
      showBankDetails: true,
    });
    setEditName(mode === 'custom_background' ? 'My Uploaded Letterhead' : 'Custom Theme');
    setEditType('both');
    setEditPageSize('A4');
    setEditMode(mode);
    setEditTheme('modern_sky');
    setEditBgImage(undefined);
    setTopPercent(25);
    setBottomPercent(18);
    setLeftPercent(6);
    setRightPercent(6);
    setIsDefault(false);
    setIsEditing(true);
  };

  const startEditExisting = (fmt: FormatTemplate) => {
    setSelectedFormat(fmt);
    setEditName(fmt.name);
    setEditType(fmt.type);
    setEditPageSize(fmt.pageSize);
    setEditMode(fmt.mode);
    setEditTheme(fmt.theme);
    setEditBgImage(fmt.backgroundImage);
    setTopPercent(fmt.bodyArea.topPercent);
    setBottomPercent(fmt.bodyArea.bottomPercent);
    setLeftPercent(fmt.bodyArea.leftPercent);
    setRightPercent(fmt.bodyArea.rightPercent);
    setIsDefault(fmt.isDefault);
    setIsEditing(true);
  };

  // Image Upload handler (Option A Letterhead / Sample Bill)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setEditBgImage(result);
      setEditMode('custom_background');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!editName.trim()) return;

    const updated: FormatTemplate = {
      ...selectedFormat,
      name: editName.trim(),
      type: editType,
      pageSize: editPageSize,
      mode: editMode,
      theme: editTheme,
      backgroundImage: editBgImage,
      isDefault,
      bodyArea: {
        topPercent,
        bottomPercent,
        leftPercent,
        rightPercent,
      },
    };

    onSaveFormat(updated);
    setIsEditing(false);
    setSelectedFormat(updated);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Letterheads &amp; Document Formats
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Upload custom letterhead background scans or choose built-in contractor templates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => startNewFormat('custom_background')}
            className="h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Letterhead (Option A)</span>
          </button>
        </div>
      </div>

      {/* Formats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {formats.map((fmt) => (
          <div
            key={fmt.id}
            onClick={() => setSelectedFormat(fmt)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
              selectedFormat.id === fmt.id
                ? 'bg-sky-50/60 border-sky-600 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            {fmt.isDefault && (
              <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Default
              </span>
            )}

            <div>
              <div className="h-32 rounded-xl bg-slate-100 border border-slate-200 mb-3 overflow-hidden flex items-center justify-center relative">
                {fmt.backgroundImage ? (
                  <img
                    src={fmt.backgroundImage}
                    alt={fmt.name}
                    className="w-full h-full object-cover"
                  />
                ) : fmt.theme === 'phd_contractor' ? (
                  <div className="w-full h-full p-2.5 flex flex-col justify-between text-[8px] bg-white border border-slate-200">
                    <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1">
                      <img src="/shiva-logo.svg" alt="Shiva" className="w-5 h-5 object-contain" />
                      <div>
                        <div className="font-serif font-bold text-[9px] text-slate-900 uppercase">PARESWAR ROUT</div>
                        <div className="font-serif text-[6.5px] text-slate-700">P.H.D Contractor</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-serif font-bold text-[7.5px] text-purple-900">B Block P.H.D. Work</div>
                      <div className="h-1.5 bg-slate-100 rounded w-4/5"></div>
                      <div className="font-serif font-bold text-[7.5px] text-purple-900">C Block P.H.D. Work</div>
                      <div className="h-1.5 bg-slate-100 rounded w-3/4"></div>
                    </div>
                    <div className="text-right font-serif font-bold text-[8px] text-purple-900 border-t border-slate-200 pt-0.5">
                      Total cost: Rs. 1,44,000/-
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full p-2 flex flex-col justify-between text-[8px] text-slate-400 bg-white">
                    <div className="h-4 bg-sky-100 rounded w-2/3"></div>
                    <div className="space-y-1">
                      <div className="h-2 bg-slate-100 rounded"></div>
                      <div className="h-2 bg-slate-100 rounded w-4/5"></div>
                      <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-slate-200 rounded w-1/3 self-end"></div>
                  </div>
                )}

                <span className="absolute bottom-2 left-2 text-[9px] font-mono px-1.5 py-0.5 bg-black/60 text-white rounded">
                  {fmt.mode === 'custom_background' ? 'Uploaded Letterhead' : 'Built-in Theme'}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 leading-snug">{fmt.name}</h4>
              <p className="text-xs text-slate-500 capitalize mt-0.5">
                {fmt.type} · {fmt.pageSize}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditExisting(fmt);
                }}
                className="text-xs text-sky-700 hover:text-sky-900 font-semibold"
              >
                Configure / Calibrate
              </button>

              {formats.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete format "${fmt.name}"?`)) {
                      onDeleteFormat(fmt.id);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Editor & Body Area Calibrator Modal / Drawer */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-base">Format Setup &amp; Body Calibration</h3>
                <p className="text-xs text-slate-400">
                  Mark where table items &amp; totals print on your letterhead
                </p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Form Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Format Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applicable For</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as FormatTemplate['type'])}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-medium"
                  >
                    <option value="both">Both Quotations &amp; Bills</option>
                    <option value="quotation">Quotations Only</option>
                    <option value="bill">Bills Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Page Size</label>
                  <select
                    value={editPageSize}
                    onChange={(e) => setEditPageSize(e.target.value as FormatTemplate['pageSize'])}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-medium"
                  >
                    <option value="A4">A4 (Standard 210 x 297 mm)</option>
                    <option value="A5">A5 (Half page 148 x 210 mm)</option>
                    <option value="Letter">US Letter</option>
                  </select>
                </div>
              </div>

              {/* Upload Section if Option A */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Option A: Upload Letterhead Background Photo / Scan
                    </h4>
                    <p className="text-xs text-slate-500">
                      Header, pre-printed logo, address, and borders stay exactly as uploaded.
                    </p>
                  </div>

                  <label className="h-9 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Choose Photo or PDF</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {editBgImage && (
                  <div className="flex items-center gap-3 pt-2 text-xs text-emerald-700 font-medium">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Letterhead background loaded successfully.</span>
                    <button
                      onClick={() => setEditBgImage(undefined)}
                      className="text-red-600 underline ml-2"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Interactive Calibration Canvas Preview */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Body Margins &amp; Print Area Calibration
                    </h4>
                    <p className="text-xs text-slate-500">
                      Adjust top and bottom margins so table items never overlap pre-printed letterhead headers or footers.
                    </p>
                  </div>
                </div>

                {/* Range Sliders */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-white p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Top Margin: {topPercent}%
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="45"
                      value={topPercent}
                      onChange={(e) => setTopPercent(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bottom Margin: {bottomPercent}%
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="35"
                      value={bottomPercent}
                      onChange={(e) => setBottomPercent(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Left Margin: {leftPercent}%
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      value={leftPercent}
                      onChange={(e) => setLeftPercent(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Right Margin: {rightPercent}%
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      value={rightPercent}
                      onChange={(e) => setRightPercent(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Visual A4 Sheet Simulation */}
                <div className="max-w-md mx-auto aspect-[1/1.414] bg-white border border-slate-300 rounded-lg shadow-md relative overflow-hidden flex flex-col justify-between p-2">
                  {/* Background letterhead preview */}
                  {editBgImage && (
                    <img
                      src={editBgImage}
                      alt="letterhead background"
                      className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
                    />
                  )}

                  {/* Top excluded header banner */}
                  <div
                    style={{ height: `${topPercent}%` }}
                    className="w-full bg-amber-500/10 border-b border-dashed border-amber-500/50 flex items-center justify-center text-[10px] text-amber-800 font-mono"
                  >
                    [Pre-printed Letterhead Header Zone]
                  </div>

                  {/* Calibrated Body Area where items print */}
                  <div
                    style={{
                      paddingLeft: `${leftPercent}%`,
                      paddingRight: `${rightPercent}%`,
                    }}
                    className="flex-1 bg-sky-500/10 border-2 border-dashed border-sky-500 rounded p-2 flex flex-col justify-between my-1"
                  >
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-sky-900 border-b border-sky-300 pb-0.5">
                        Calibrated Body Print Area
                      </div>
                      <div className="text-[8px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between font-bold border-b border-slate-200">
                          <span>Item Description</span>
                          <span>Qty</span>
                          <span>Total</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CPVC Pipe 3/4&quot;</span>
                          <span>10 Nos</span>
                          <span>₹3,800</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Brass Ball Valve 1&quot;</span>
                          <span>2 Nos</span>
                          <span>₹1,160</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Concealed Fitting Labour</span>
                          <span>6 Points</span>
                          <span>₹5,100</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[8px] font-bold text-sky-950 border-t border-sky-300 pt-1">
                      Grand Total: ₹10,060.00
                    </div>
                  </div>

                  {/* Bottom excluded footer banner */}
                  <div
                    style={{ height: `${bottomPercent}%` }}
                    className="w-full bg-amber-500/10 border-t border-dashed border-amber-500/50 flex items-center justify-center text-[10px] text-amber-800 font-mono"
                  >
                    [Pre-printed Letterhead Footer / Terms Zone]
                  </div>
                </div>
              </div>

              {/* Set as Default Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="defaultFmt"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600"
                />
                <label htmlFor="defaultFmt" className="text-xs font-semibold text-slate-800">
                  Set as default format for new quotations and bills
                </label>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white shadow-sm"
              >
                Save Format
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
