import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Share2,
  Printer,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Building,
  Phone,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  BusinessProfile,
  FormatTemplate,
  LanguageCode,
  QuotationBillDocument,
} from '../types';
import { calculateDocumentTotals } from '../utils/calculations';
import { documentTranslations } from '../utils/translations';
import { resolveFormatConfig, getFontFamilyCSS } from '../utils/formatResolver';
import { LetterheadLogo } from './LetterheadLogo';

interface DocumentPreviewModalProps {
  document: QuotationBillDocument;
  format: FormatTemplate;
  profile: BusinessProfile;
  onClose: () => void;
  onUpdateStatus?: (status: QuotationBillDocument['status']) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: doc,
  format,
  profile,
  onClose,
  onUpdateStatus,
}) => {
  const [lang, setLang] = useState<LanguageCode>(profile.defaultLanguage || 'en');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const cfg = resolveFormatConfig(format);

  const [layoutMode, setLayoutMode] = useState<'letterhead_blocks' | 'itemized_table'>(
    cfg.table.presentation || (format.theme === 'phd_contractor' ? 'letterhead_blocks' : 'itemized_table')
  );
  const printAreaRef = useRef<HTMLDivElement>(null);

  const t = documentTranslations[lang];

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

  const isQuote = doc.type === 'quotation';
  const docTitle = isQuote ? cfg.metadataBlock.quotationTitle : cfg.metadataBlock.billTitle;

  // Native Print Handler
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = () => {
    const custPhone = doc.customerSnapshot.phone.replace(/[^0-9]/g, '');

    const itemsSummary = doc.lines
      .slice(0, 5)
      .map(
        (l, i) =>
          `${i + 1}. ${l.name} (${l.quantity} ${l.unit}) - Rs. ${(l.lineTotalPaise / 100).toLocaleString('en-IN')}/-`
      )
      .join('\n');

    const message =
      `*${profile.name}*\n` +
      `*${profile.tagline || 'P.H.D Contractor'}*\n` +
      `*${docTitle}* #${doc.number}\n` +
      `Date: ${doc.date}\n` +
      `Customer: ${doc.customerSnapshot.name}\n` +
      `--------------------------------\n` +
      `${itemsSummary}\n` +
      (doc.lines.length > 5 ? `...and ${doc.lines.length - 5} more items\n` : '') +
      `--------------------------------\n` +
      `*Total Cost: Rs. ${(calcs.grandTotalPaise / 100).toLocaleString('en-IN')}/-*\n` +
      (calcs.balanceDuePaise > 0
        ? `*Remaining Balance: Rs. ${(calcs.balanceDuePaise / 100).toLocaleString('en-IN')}/-*\n`
        : `*Status: FULLY PAID*\n`) +
      `UPI ID for payment: ${profile.upiId}\n\n` +
      `Thank you for choosing ${profile.name}!`;

    const encoded = encodeURIComponent(message);
    const url = custPhone ? `https://wa.me/${custPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Generate crisp client-side vector PDF with jsPDF
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let y = 15;

      if (format.mode === 'custom_background' && format.backgroundImage) {
        try {
          pdf.addImage(format.backgroundImage, 'JPEG', 0, 0, pageWidth, pageHeight);
          y = (pageHeight * format.bodyArea.topPercent) / 100;
        } catch (e) {
          console.error('Failed to draw custom background onto PDF', e);
        }
      } else {
        // Invocation if enabled
        if (cfg.header.showInvocation && cfg.header.topInvocationText) {
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(8);
          pdf.setTextColor(100, 116, 139);
          pdf.text(cfg.header.topInvocationText, pageWidth / 2, y, { align: 'center' });
          y += 5;
        }

        // Emblem / Logo circle
        if (cfg.header.logoType === 'shiva') {
          pdf.setDrawColor(20, 20, 20);
          pdf.setLineWidth(0.6);
          pdf.circle(28, y + 8, 9, 'S');
          pdf.setLineWidth(0.3);
          pdf.circle(28, y + 8, 8, 'S');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(6);
          pdf.setTextColor(20, 20, 20);
          pdf.text('SHIVA', 28, y + 8.5, { align: 'center' });
        }

        // Contractor Name
        pdf.setFont('times', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(15, 23, 42);
        pdf.text(profile.name || 'P.H.D CONTRACTOR', pageWidth / 2 + 10, y + 5, { align: 'center' });

        // Tagline
        if (cfg.header.showTagline && profile.tagline) {
          pdf.setFont('times', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(55, 65, 81);
          pdf.text(profile.tagline, pageWidth / 2 + 10, y + 11, { align: 'center' });
        }

        // Contact info line
        pdf.setFont('times', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(51, 65, 85);
        if (cfg.header.showAddress) {
          pdf.text(`Address: ${profile.address}, ${profile.cityStatePincode}`, 42, y + 17);
        }
        if (cfg.header.showPhone) {
          pdf.setFont('times', 'bold');
          pdf.text(`Mob. - ${profile.phone}`, pageWidth - 15, y + 17, { align: 'right' });
        }

        y += 21;

        // Divider
        pdf.setDrawColor(15, 23, 42);
        pdf.setLineWidth(cfg.header.dividerThicknessPx ? cfg.header.dividerThicknessPx * 0.35 : 0.6);
        pdf.line(15, y, pageWidth - 15, y);

        // Document Meta Line
        y += 7;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(112, 38, 112);
        pdf.text(`${docTitle} NO: ${doc.number}`, 15, y);
        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`DATE: ${doc.date}`, pageWidth - 15, y, { align: 'right' });

        y += 5;
        if (doc.customerSnapshot?.name) {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(15, 23, 42);
          pdf.text(`${cfg.customerBlock.billToLabel} ${doc.customerSnapshot.name}`, 15, y);
          if (doc.customerSnapshot.siteAddress && cfg.customerBlock.showSiteAddress) {
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(71, 85, 105);
            pdf.text(
              `${cfg.customerBlock.siteLabel} ${doc.customerSnapshot.siteAddress.slice(0, 40)}`,
              pageWidth / 2,
              y
            );
          }
          y += 8;
        }
      }

      // BODY RENDERING
      if (layoutMode === 'letterhead_blocks') {
        doc.lines.forEach((line) => {
          if (y > pageHeight - 40) {
            pdf.addPage();
            y = 25;
          }

          pdf.setFont('times', 'bold');
          pdf.setFontSize(11);
          pdf.setTextColor(112, 38, 112);
          pdf.text(line.name, 15, y);
          y += 5;

          pdf.setFont('times', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(30, 41, 59);
          const descText =
            line.sizeSpec ||
            `Plumbing, pipeline and fitting work for ${line.quantity} ${line.unit}.`;
          const splitDesc = pdf.splitTextToSize(descText, pageWidth - 85);
          pdf.text(splitDesc, 15, y);

          const amtText = `Rs. ${(line.lineTotalPaise / 100).toLocaleString('en-IN')}/-`;
          const calcLabel =
            line.quantity > 1
              ? `Estimated Cost = ${line.quantity} ${line.unit} x Rs. ${(line.ratePaise / 100).toLocaleString('en-IN')}/-`
              : 'Remaining Payment Balance';

          pdf.setFont('times', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(15, 23, 42);
          pdf.text(calcLabel, pageWidth - 55, y, { align: 'right' });

          pdf.setTextColor(112, 38, 112);
          pdf.text(amtText, pageWidth - 15, y, { align: 'right' });

          y += Math.max(splitDesc.length * 4.5, 7) + 6;
        });

        y += 4;
        pdf.setFont('times', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(15, 23, 42);
        pdf.text('Total cost', pageWidth - 55, y, { align: 'right' });

        pdf.setTextColor(112, 38, 112);
        pdf.text(
          `Rs. ${(calcs.grandTotalPaise / 100).toLocaleString('en-IN')}/-`,
          pageWidth - 15,
          y,
          { align: 'right' }
        );
        y += 12;
      } else {
        // Detailed Items Table
        pdf.setFillColor(248, 250, 252);
        pdf.rect(15, y, pageWidth - 30, 7, 'F');
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(15, y, pageWidth - 30, 7, 'S');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(15, 23, 42);

        pdf.text(cfg.table.snoLabel, 18, y + 4.5);
        pdf.text(cfg.table.descriptionLabel, 30, y + 4.5);
        pdf.text(cfg.table.quantityLabel, pageWidth - 70, y + 4.5, { align: 'right' });
        pdf.text(cfg.table.unitLabel, pageWidth - 55, y + 4.5, { align: 'center' });
        pdf.text(cfg.table.rateLabel, pageWidth - 38, y + 4.5, { align: 'right' });
        pdf.text(cfg.table.amountLabel, pageWidth - 18, y + 4.5, { align: 'right' });

        y += 7;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(51, 65, 85);

        doc.lines.forEach((line, index) => {
          if (y > pageHeight - 50) {
            pdf.addPage();
            y = 20;
          }

          if (index % 2 === 1 && cfg.table.alternatingRowBg) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(15, y, pageWidth - 30, 7, 'F');
          }

          pdf.text(String(index + 1), 18, y + 4.5);
          pdf.setFont('helvetica', 'bold');
          pdf.text(line.name.slice(0, 34), 30, y + 4.5);
          pdf.setFont('helvetica', 'normal');

          pdf.text(String(line.quantity), pageWidth - 70, y + 4.5, { align: 'right' });
          pdf.text(line.unit, pageWidth - 55, y + 4.5, { align: 'center' });
          pdf.text(
            `${(line.ratePaise / 100).toLocaleString('en-IN')}`,
            pageWidth - 38,
            y + 4.5,
            { align: 'right' }
          );
          pdf.text(
            `${(line.lineTotalPaise / 100).toLocaleString('en-IN')}`,
            pageWidth - 18,
            y + 4.5,
            { align: 'right' }
          );

          y += 7;
        });

        // Totals Box
        y += 4;
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(pageWidth - 85, y, 70, 22, 2, 2, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(pageWidth - 85, y, 70, 22, 2, 2, 'S');

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);
        pdf.text('Subtotal:', pageWidth - 80, y + 6);
        pdf.text(
          `Rs. ${(calcs.subtotalPaise / 100).toLocaleString('en-IN')}/-`,
          pageWidth - 20,
          y + 6,
          { align: 'right' }
        );

        if (calcs.discountPaise > 0) {
          pdf.text('Discount:', pageWidth - 80, y + 11);
          pdf.text(
            `-Rs. ${(calcs.discountPaise / 100).toLocaleString('en-IN')}/-`,
            pageWidth - 20,
            y + 11,
            { align: 'right' }
          );
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(112, 38, 112);
        pdf.text('Total Cost:', pageWidth - 80, y + 17);
        pdf.text(
          `Rs. ${(calcs.grandTotalPaise / 100).toLocaleString('en-IN')}/-`,
          pageWidth - 20,
          y + 17,
          { align: 'right' }
        );

        y += 26;
      }

      // Amount in words
      if (calcs.amountInWords) {
        pdf.setFont('times', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(51, 65, 85);
        pdf.text(
          `${cfg.totals.amountInWordsLabel} ${calcs.amountInWords}`,
          15,
          y
        );
        y += 8;
      }

      // Footer: Bank and Signatory
      if (format.showBankDetails && profile.bankName) {
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(15, y, 100, 18, 1.5, 1.5, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(cfg.footer.bankTitle, 18, y + 5);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(71, 85, 105);
        pdf.text(
          `Bank: ${profile.bankName} | A/C: ${profile.accountNumber} | IFSC: ${profile.ifscCode}`,
          18,
          y + 10
        );
        if (profile.upiId) {
          pdf.text(`UPI ID: ${profile.upiId}`, 18, y + 14);
        }
      }

      if (format.showSignature) {
        pdf.setFont('times', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(15, 23, 42);
        pdf.text(`For ${cfg.footer.signatureTitle || profile.name}`, pageWidth - 15, y + 12, {
          align: 'right',
        });
        pdf.setFont('times', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          cfg.footer.signatureSubtext || 'Authorized Signatory',
          pageWidth - 15,
          y + 16,
          { align: 'right' }
        );
      }

      pdf.save(`${docTitle}_${doc.number}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getDividerBorderClass = () => {
    switch (cfg.header.dividerStyle) {
      case 'double':
        return 'border-b-4 border-double';
      case 'dashed':
        return 'border-b-2 border-dashed';
      case 'dotted':
        return 'border-b-2 border-dotted';
      case 'thick_thin':
        return 'border-b-[3px] border-solid';
      case 'gradient':
        return 'border-b-2 border-transparent bg-gradient-to-r from-transparent via-current to-transparent';
      case 'none':
        return '';
      case 'solid':
      default:
        return 'border-b-2 border-solid';
    }
  };

  const getTableDensityClass = () => {
    switch (cfg.table.density) {
      case 'compact':
        return 'py-1.5 px-2 text-xs';
      case 'spacious':
        return 'py-3.5 px-4 text-sm';
      case 'normal':
      default:
        return 'py-2.5 px-3 text-xs sm:text-sm';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center overflow-y-auto p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Top Action Bar (Hidden during print) */}
      <div className="w-full max-w-4xl bg-slate-900 text-white rounded-t-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl print:hidden sticky top-2 z-10">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm sm:text-base flex items-center gap-2">
            <span>{docTitle}</span>
            <span className="text-slate-400 font-mono text-xs">#{doc.number}</span>
          </span>

          {/* Layout Mode Toggle */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 ml-2">
            <button
              onClick={() => setLayoutMode('letterhead_blocks')}
              className={`px-2 py-1 text-xs rounded-md font-medium flex items-center gap-1 ${
                layoutMode === 'letterhead_blocks'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Project Blocks</span>
            </button>
            <button
              onClick={() => setLayoutMode('itemized_table')}
              className={`px-2 py-1 text-xs rounded-md font-medium flex items-center gap-1 ${
                layoutMode === 'itemized_table'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Itemized Table</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 text-xs rounded font-medium ${
                lang === 'en' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-2 py-1 text-xs rounded font-medium ${
                lang === 'hi' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिं
            </button>
            <button
              onClick={() => setLang('or')}
              className={`px-2 py-1 text-xs rounded font-medium ${
                lang === 'or' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ଓଡ଼ି
            </button>
          </div>

          <button
            onClick={handleWhatsAppShare}
            className="h-8 sm:h-9 px-2.5 sm:px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
            title="Share on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="h-8 sm:h-9 px-2.5 sm:px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="h-8 sm:h-9 px-2.5 sm:px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all border border-slate-700 shadow-sm"
            title="Print Document"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Document Sheet Container (Clean Paper Canvas with Watermark & Configured Styles) */}
      <div
        className="w-full max-w-4xl shadow-2xl p-6 sm:p-12 min-h-screen sm:min-h-0 sm:rounded-b-2xl mb-8 print:p-0 print:shadow-none print:m-0 relative overflow-hidden transition-all"
        style={{
          backgroundColor: cfg.styling.paperBgColor || '#ffffff',
          color: cfg.styling.textColor || '#0f172a',
          fontFamily: getFontFamilyCSS(cfg.styling.fontFamily),
          fontSize: `${cfg.styling.baseFontSizePx || 13}px`,
        }}
      >
        {/* Background Watermark if enabled */}
        {cfg.watermark.enabled && (
          <div
            className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden z-0"
            style={{ opacity: (cfg.watermark.opacityPercent || 6) / 100 }}
          >
            {cfg.watermark.type === 'logo' ? (
              <div
                style={{
                  transform: `rotate(${cfg.watermark.rotationDeg || -25}deg)`,
                  width: '320px',
                  height: '320px',
                }}
              >
                <LetterheadLogo
                  type={cfg.header.logoType}
                  customUrl={cfg.header.customLogoUrl}
                  size={320}
                  primaryColor={cfg.styling.primaryColor}
                />
              </div>
            ) : (
              <div
                style={{
                  transform: `rotate(${cfg.watermark.rotationDeg || -25}deg)`,
                  fontSize: `${cfg.watermark.fontSizePx || 56}px`,
                  fontFamily: getFontFamilyCSS(cfg.header.contractorNameFontFamily),
                }}
                className="font-black tracking-widest uppercase text-slate-900 text-center whitespace-nowrap"
              >
                {cfg.watermark.text || 'PLUMBING ESTIMATE'}
              </div>
            )}
          </div>
        )}

        <div ref={printAreaRef} className="space-y-6 relative z-10">
          {/* Pre-printed Letterhead Background Image (Option A) */}
          {format.mode === 'custom_background' && format.backgroundImage ? (
            <div className="relative mb-6">
              <img
                src={format.backgroundImage}
                alt="Letterhead background"
                className="w-full h-auto object-contain rounded-lg border border-slate-200"
              />
              <div className="mt-2 text-center text-xs text-slate-400">
                [Pre-printed letterhead format active]
              </div>
            </div>
          ) : (
            /* Built-in Dynamic Letterhead Header */
            <div
              className={`pb-4 ${getDividerBorderClass()}`}
              style={{
                borderColor: cfg.header.dividerColor || '#0f172a',
                borderBottomWidth: `${cfg.header.dividerThicknessPx || 2}px`,
                backgroundColor: cfg.header.headerBgColor || 'transparent',
              }}
            >
              {/* Auspicious Invocation Header (e.g. || ଶ୍ରୀ ଶ୍ରୀ ଧବଳେଶ୍ୱର ପ୍ରସନ୍ନ ||) */}
              {cfg.header.showInvocation && cfg.header.topInvocationText && (
                <div className="text-center pb-2 text-xs font-serif font-semibold tracking-wider text-slate-600">
                  {cfg.header.topInvocationText}
                </div>
              )}

              <div
                className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-6 ${
                  cfg.header.alignment === 'center'
                    ? 'justify-center text-center'
                    : cfg.header.alignment === 'left'
                    ? 'justify-start text-left'
                    : cfg.header.alignment === 'right'
                    ? 'justify-end text-right'
                    : 'justify-between'
                }`}
              >
                {/* Emblem / Logo */}
                {cfg.header.logoType !== 'none' && (
                  <div className="shrink-0">
                    <LetterheadLogo
                      type={cfg.header.logoType}
                      customUrl={cfg.header.customLogoUrl}
                      size={cfg.header.logoSizePx || 88}
                      frame={cfg.header.logoFrame}
                      primaryColor={cfg.styling.primaryColor}
                    />
                  </div>
                )}

                {/* Contractor Name, Tagline & Contact details */}
                <div
                  className={`flex-1 ${
                    cfg.header.alignment === 'center'
                      ? 'text-center'
                      : cfg.header.alignment === 'left'
                      ? 'text-left'
                      : cfg.header.alignment === 'right'
                      ? 'text-right'
                      : 'text-center sm:text-center sm:pr-4'
                  }`}
                >
                  <h1
                    style={{
                      fontFamily: getFontFamilyCSS(cfg.header.contractorNameFontFamily),
                      fontSize: `${cfg.header.contractorNameFontSizePx || 28}px`,
                      color: cfg.header.contractorNameColor || '#0f172a',
                      letterSpacing:
                        cfg.header.contractorLetterSpacing === 'widest'
                          ? '0.15em'
                          : cfg.header.contractorLetterSpacing === 'wide'
                          ? '0.05em'
                          : 'normal',
                      textTransform: cfg.header.contractorNameUppercase ? 'uppercase' : 'none',
                    }}
                    className="font-bold leading-tight"
                  >
                    {profile.name}
                  </h1>

                  {cfg.header.showTagline && profile.tagline && (
                    <p
                      style={{
                        fontFamily: getFontFamilyCSS(cfg.header.taglineFontFamily),
                        fontSize: `${cfg.header.taglineFontSizePx || 13}px`,
                        color: cfg.header.taglineColor || '#334155',
                      }}
                      className="font-semibold tracking-wider mt-0.5"
                    >
                      {profile.tagline}
                    </p>
                  )}

                  {/* Contact Row (Configurable Layout) */}
                  <div
                    style={{
                      fontSize: `${cfg.header.contactFontSizePx || 12}px`,
                      color: cfg.header.contactColor || '#334155',
                    }}
                    className={`mt-2 font-medium ${
                      cfg.header.contactRowLayout === 'spaced_between'
                        ? 'flex flex-col sm:flex-row items-center justify-between gap-1'
                        : cfg.header.contactRowLayout === 'badges'
                        ? 'flex flex-wrap items-center justify-center gap-2 pt-1'
                        : cfg.header.contactRowLayout === 'compact'
                        ? 'flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5'
                        : 'space-y-0.5'
                    }`}
                  >
                    {cfg.header.showAddress && (
                      <span
                        className={
                          cfg.header.contactRowLayout === 'badges'
                            ? 'px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700'
                            : ''
                        }
                      >
                        Address: {profile.address}, {profile.cityStatePincode}
                      </span>
                    )}

                    {cfg.header.showPhone && (
                      <span
                        className={`font-bold ${
                          cfg.header.contactRowLayout === 'badges'
                            ? 'px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800'
                            : ''
                        }`}
                      >
                        Mob. - {profile.phone}
                        {cfg.header.showAltPhone && profile.alternatePhone
                          ? ` / ${profile.alternatePhone}`
                          : ''}
                      </span>
                    )}

                    {cfg.header.showEmail && profile.email && (
                      <span
                        className={
                          cfg.header.contactRowLayout === 'badges'
                            ? 'px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700'
                            : ''
                        }
                      >
                        Email: {profile.email}
                      </span>
                    )}

                    {cfg.header.showGstin && profile.gstin && (
                      <span
                        className={
                          cfg.header.contactRowLayout === 'badges'
                            ? 'px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono'
                            : 'font-mono'
                        }
                      >
                        GSTIN: {profile.gstin}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer & Document Metadata Bar */}
          <div
            style={{
              backgroundColor: cfg.customerBlock.bgColor || '#f8fafc',
              borderColor: cfg.customerBlock.borderColor || '#cbd5e1',
              borderRadius: `${cfg.styling.borderRadiusPx || 8}px`,
            }}
            className={`p-3.5 border flex flex-col sm:flex-row justify-between items-start gap-4 ${
              cfg.customerBlock.style === 'accent_left'
                ? 'border-l-4'
                : cfg.customerBlock.style === 'minimal'
                ? 'border-none bg-transparent p-0'
                : ''
            }`}
          >
            {/* Customer Details */}
            <div className="space-y-0.5">
              <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                {cfg.customerBlock.billToLabel}
              </span>
              <p className="font-bold text-slate-900 text-sm sm:text-base">
                {doc.customerSnapshot.name}
              </p>
              {cfg.customerBlock.showCustomerPhone && (
                <p className="text-slate-600 text-xs sm:text-sm">
                  {t.phone}: {doc.customerSnapshot.phone}
                </p>
              )}
              {cfg.customerBlock.showCustomerEmail && doc.customerSnapshot.email && (
                <p className="text-slate-600 text-xs sm:text-sm">
                  Email: {doc.customerSnapshot.email}
                </p>
              )}
              {doc.customerSnapshot.address && (
                <p className="text-slate-600 text-xs">{doc.customerSnapshot.address}</p>
              )}
              {cfg.customerBlock.showSiteAddress && doc.customerSnapshot.siteAddress && (
                <p className="text-slate-700 text-xs mt-1 font-medium">
                  <strong>{cfg.customerBlock.siteLabel}</strong> {doc.customerSnapshot.siteAddress}
                </p>
              )}
            </div>

            {/* Document Details Badge */}
            <div
              style={{
                backgroundColor: cfg.metadataBlock.badgeBgColor || '#f1f5f9',
                borderColor: cfg.styling.primaryColor,
              }}
              className="p-3 rounded-lg border border-slate-200 text-left sm:text-right space-y-1 min-w-[200px] self-stretch sm:self-auto"
            >
              <div
                style={{ color: cfg.metadataBlock.titleColor || cfg.styling.primaryColor }}
                className="font-bold text-xs uppercase tracking-wider"
              >
                {docTitle}
              </div>
              <p className="font-bold text-slate-900 font-mono text-sm">
                No: {doc.number}
              </p>
              <p className="text-slate-600 text-xs">
                {t.date}: <span className="font-semibold text-slate-800">{doc.date}</span>
              </p>
              {doc.validUntil && cfg.metadataBlock.showDueDate && (
                <p className="text-slate-500 text-[11px]">
                  Valid Until: <span className="font-medium">{doc.validUntil}</span>
                </p>
              )}
            </div>
          </div>

          {/* ============================================================
             BODY CONTENT: CONTRACTOR SCOPE BLOCKS OR DETAILED TABLE
             ============================================================ */}
          {layoutMode === 'letterhead_blocks' ? (
            /* P.H.D Contractor Official Scope / Block Style */
            <div className="space-y-6 pt-2">
              {doc.lines.map((line) => (
                <div
                  key={line.id}
                  className="space-y-1.5 border-b border-slate-200/80 pb-5 last:border-b-0"
                >
                  <h3
                    style={{
                      color: cfg.totals.highlightColor || cfg.styling.primaryColor,
                      fontFamily: getFontFamilyCSS(cfg.styling.fontFamily),
                    }}
                    className="font-bold text-base sm:text-lg"
                  >
                    {line.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed max-w-2xl">
                    {line.sizeSpec ||
                      `Plumbing, pipeline and fitting work for ${line.quantity} ${line.unit}.`}
                  </p>

                  <div className="flex items-center justify-end gap-6 sm:gap-10 pt-2 text-xs sm:text-sm">
                    <span className="font-bold text-slate-900">
                      {line.quantity > 1
                        ? `Estimated Cost = ${line.quantity} ${line.unit} x Rs. ${(line.ratePaise / 100).toLocaleString('en-IN')}/-`
                        : 'Remaining Payment Balance'}
                    </span>
                    <span
                      style={{ color: cfg.totals.highlightColor || cfg.styling.primaryColor }}
                      className="font-bold font-mono text-sm sm:text-base"
                    >
                      Rs. ${(line.lineTotalPaise / 100).toLocaleString('en-IN')}/-
                    </span>
                  </div>
                </div>
              ))}

              {/* Total Cost Row */}
              <div
                style={{
                  borderColor: cfg.header.dividerColor || '#0f172a',
                }}
                className="flex items-center justify-end gap-6 sm:gap-10 pt-5 border-t-2 font-bold"
              >
                <span className="text-base sm:text-xl text-slate-900">Total cost</span>
                <span
                  style={{ color: cfg.totals.highlightColor || cfg.styling.primaryColor }}
                  className="text-xl sm:text-2xl font-mono"
                >
                  Rs. ${(calcs.grandTotalPaise / 100).toLocaleString('en-IN')}/-
                </span>
              </div>
            </div>
          ) : (
            /* Standard Detailed Tabular View */
            <div className="space-y-4">
              <div
                style={{
                  borderColor: cfg.table.borderColor || '#cbd5e1',
                  borderRadius: `${cfg.styling.borderRadiusPx || 8}px`,
                }}
                className="overflow-x-auto border"
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      style={{
                        backgroundColor: cfg.table.headerBgColor || cfg.styling.primaryColor,
                        color: cfg.table.headerTextColor || '#ffffff',
                      }}
                      className="font-bold text-xs uppercase tracking-wider"
                    >
                      {format.columnVisibility.sno && (
                        <th className={`w-10 text-center ${getTableDensityClass()}`}>
                          {cfg.table.snoLabel}
                        </th>
                      )}
                      {format.columnVisibility.description && (
                        <th className={getTableDensityClass()}>
                          {cfg.table.descriptionLabel}
                        </th>
                      )}
                      {format.columnVisibility.quantity && (
                        <th className={`w-16 text-right ${getTableDensityClass()}`}>
                          {cfg.table.quantityLabel}
                        </th>
                      )}
                      {format.columnVisibility.unit && (
                        <th className={`w-16 text-center ${getTableDensityClass()}`}>
                          {cfg.table.unitLabel}
                        </th>
                      )}
                      {format.columnVisibility.rate && (
                        <th className={`w-28 text-right ${getTableDensityClass()}`}>
                          {cfg.table.rateLabel}
                        </th>
                      )}
                      {format.columnVisibility.tax && doc.isTaxEnabled && (
                        <th className={`w-16 text-center ${getTableDensityClass()}`}>
                          {cfg.table.taxLabel}
                        </th>
                      )}
                      {format.columnVisibility.amount && (
                        <th className={`w-32 text-right ${getTableDensityClass()}`}>
                          {cfg.table.amountLabel}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doc.lines.map((line, idx) => (
                      <tr
                        key={line.id}
                        style={{
                          backgroundColor:
                            idx % 2 === 1 && cfg.table.alternatingRowBg
                              ? cfg.table.stripeColor || '#f8fafc'
                              : 'transparent',
                        }}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {format.columnVisibility.sno && (
                          <td
                            className={`text-center text-slate-400 font-mono ${getTableDensityClass()}`}
                          >
                            {idx + 1}
                          </td>
                        )}
                        {format.columnVisibility.description && (
                          <td className={getTableDensityClass()}>
                            <div
                              style={{ color: cfg.totals.highlightColor || cfg.styling.primaryColor }}
                              className="font-bold"
                            >
                              {line.name}
                            </div>
                            {format.columnVisibility.sizeSpec && line.sizeSpec && (
                              <div className="text-xs text-slate-600 font-sans">
                                {line.sizeSpec}
                              </div>
                            )}
                          </td>
                        )}
                        {format.columnVisibility.quantity && (
                          <td className={`text-right font-mono tabular-nums ${getTableDensityClass()}`}>
                            {line.quantity}
                          </td>
                        )}
                        {format.columnVisibility.unit && (
                          <td className={`text-center text-slate-600 font-sans ${getTableDensityClass()}`}>
                            {line.unit}
                          </td>
                        )}
                        {format.columnVisibility.rate && (
                          <td className={`text-right font-mono tabular-nums ${getTableDensityClass()}`}>
                            Rs. {(line.ratePaise / 100).toLocaleString('en-IN')}/-
                          </td>
                        )}
                        {format.columnVisibility.tax && doc.isTaxEnabled && (
                          <td className={`text-center text-slate-600 font-mono ${getTableDensityClass()}`}>
                            {line.taxRate}%
                          </td>
                        )}
                        {format.columnVisibility.amount && (
                          <td
                            style={{ color: cfg.totals.highlightColor || cfg.styling.primaryColor }}
                            className={`text-right font-bold font-mono tabular-nums ${getTableDensityClass()}`}
                          >
                            Rs. {(line.lineTotalPaise / 100).toLocaleString('en-IN')}/-
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Calculation Summary */}
              <div className="flex justify-end pt-2">
                <div
                  style={{
                    borderRadius: `${cfg.styling.borderRadiusPx || 8}px`,
                  }}
                  className="w-full sm:w-1/2 space-y-2 bg-slate-50/80 p-4 border border-slate-200 text-xs sm:text-sm"
                >
                  <div className="flex justify-between text-slate-700">
                    <span>{t.subtotal}:</span>
                    <span className="font-mono">
                      Rs. {(calcs.subtotalPaise / 100).toLocaleString('en-IN')}/-
                    </span>
                  </div>

                  {cfg.totals.showDiscountLine && calcs.discountPaise > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>{t.discount}:</span>
                      <span className="font-mono">
                        -Rs. {(calcs.discountPaise / 100).toLocaleString('en-IN')}/-
                      </span>
                    </div>
                  )}

                  {cfg.totals.showTaxBreakdown && doc.isTaxEnabled && (
                    <div className="flex justify-between text-slate-700">
                      <span>{t.tax}:</span>
                      <span className="font-mono">
                        Rs. {(calcs.totalTaxPaise / 100).toLocaleString('en-IN')}/-
                      </span>
                    </div>
                  )}

                  {cfg.totals.showAdvancePaid && (doc.advancePaidPaise || 0) > 0 && (
                    <div className="flex justify-between text-sky-800 font-medium">
                      <span>Advance Received:</span>
                      <span className="font-mono">
                        -Rs. {((doc.advancePaidPaise || 0) / 100).toLocaleString('en-IN')}/-
                      </span>
                    </div>
                  )}

                  <div
                    style={{ borderColor: cfg.header.dividerColor || '#0f172a' }}
                    className="border-t-2 pt-2 flex justify-between items-center font-bold text-base sm:text-lg"
                  >
                    <span className="text-slate-900">Total cost:</span>
                    <span
                      style={{ color: cfg.totals.highlightColor || cfg.styling.primaryColor }}
                      className="font-mono text-xl"
                    >
                      Rs. {(calcs.grandTotalPaise / 100).toLocaleString('en-IN')}/-
                    </span>
                  </div>

                  {cfg.totals.showBalanceDue && calcs.balanceDuePaise > 0 && (
                    <div className="flex justify-between items-center pt-1 text-xs text-rose-700 font-bold border-t border-slate-200">
                      <span>Balance Due:</span>
                      <span className="font-mono text-sm">
                        Rs. {(calcs.balanceDuePaise / 100).toLocaleString('en-IN')}/-
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Amount in words Banner / Pill */}
          {cfg.totals.amountInWordsStyle !== 'none' && calcs.amountInWords && (
            <div
              className={`text-xs sm:text-sm ${
                cfg.totals.amountInWordsStyle === 'banner'
                  ? 'p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex items-start gap-2 text-slate-800'
                  : cfg.totals.amountInWordsStyle === 'pill'
                  ? 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800'
                  : 'pt-2 flex items-start gap-2 text-slate-600 italic'
              }`}
            >
              <span className="font-bold uppercase tracking-wider text-slate-900 text-[11px]">
                {cfg.totals.amountInWordsLabel}
              </span>
              <span className="font-medium italic">{calcs.amountInWords}</span>
            </div>
          )}

          {/* Bank & Payment Details */}
          {format.showBankDetails && (profile.bankName || profile.upiId) && (
            <div
              style={{
                borderRadius: `${cfg.styling.borderRadiusPx || 8}px`,
              }}
              className="p-3.5 bg-slate-50/80 border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block">
                  {cfg.footer.bankTitle}
                </span>
                {profile.bankName && (
                  <p className="text-slate-700">
                    Bank: <strong>{profile.bankName}</strong> · A/C:{' '}
                    <strong className="font-mono">{profile.accountNumber}</strong> · IFSC:{' '}
                    <strong className="font-mono">{profile.ifscCode}</strong>
                  </p>
                )}
                {profile.upiId && (
                  <p className="text-slate-700">
                    UPI ID: <strong className="text-sky-800 font-mono">{profile.upiId}</strong> (
                    {profile.upiName || profile.name})
                  </p>
                )}
              </div>

              {/* UPI QR Code */}
              {format.showUpiQr && profile.upiId && cfg.footer.upiPosition !== 'hidden' && (
                <div className="shrink-0 flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                  <QrCode
                    style={{
                      width: `${Math.min(cfg.footer.qrSizePx || 70, 70)}px`,
                      height: `${Math.min(cfg.footer.qrSizePx || 70, 70)}px`,
                    }}
                    className="text-slate-800"
                  />
                  <div className="text-[10px] text-slate-600 leading-tight">
                    <p className="font-bold text-slate-800">Scan &amp; Pay</p>
                    <p className="font-mono text-sky-700">{profile.upiId}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Terms & Conditions Block */}
          {format.showTerms && cfg.footer.termsText && (
            <div
              style={{
                borderRadius: `${cfg.styling.borderRadiusPx || 8}px`,
              }}
              className="p-3 bg-slate-50/50 border border-slate-200 text-[11px] text-slate-600 space-y-1"
            >
              <span className="font-bold uppercase tracking-wider text-slate-700 text-[10px] block">
                {cfg.footer.termsTitle}
              </span>
              <div className="whitespace-pre-line leading-relaxed">{cfg.footer.termsText}</div>
            </div>
          )}

          {/* Signatory & Stamp Section */}
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-end gap-4 text-xs">
            <div className="text-slate-500 text-[11px] italic">
              {cfg.footer.customFooterNote || 'Thank you for your business!'}
            </div>

            {format.showSignature && (
              <div
                className={`space-y-1 ${
                  cfg.footer.signatureAlign === 'left'
                    ? 'text-left self-start'
                    : cfg.footer.signatureAlign === 'center'
                    ? 'text-center self-center'
                    : 'text-right'
                }`}
              >
                {cfg.footer.showSignatureLine && (
                  <div className="w-48 border-b border-slate-400 mb-2 ml-auto" />
                )}
                <p className="font-bold text-sm text-slate-900">
                  For {cfg.footer.signatureTitle || profile.name}
                </p>
                <p className="text-slate-500">
                  {cfg.footer.signatureSubtext || 'P.H.D Contractor / Authorized Signatory'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
