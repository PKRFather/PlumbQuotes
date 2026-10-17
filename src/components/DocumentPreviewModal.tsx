import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Share2,
  Printer,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Check,
  Building,
  Phone,
  Calendar,
  FileCheck,
  LayoutList,
  Layers,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  BusinessProfile,
  FormatTemplate,
  LanguageCode,
  QuotationBillDocument,
} from '../types';
import { calculateDocumentTotals } from '../utils/calculations';
import { formatINR } from '../utils/numberToWords';
import { documentTranslations } from '../utils/translations';

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
  const [layoutMode, setLayoutMode] = useState<'letterhead_blocks' | 'itemized_table'>(
    format.theme === 'phd_contractor' ? 'letterhead_blocks' : 'itemized_table'
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

  const isPhdTheme = format.theme === 'phd_contractor' || profile.name.includes('PARESWAR ROUT');

  // Native Print Handler
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = () => {
    const custPhone = doc.customerSnapshot.phone.replace(/[^0-9]/g, '');
    const isQuote = doc.type === 'quotation';
    const title = isQuote ? 'Quotation / Estimate' : 'Tax Invoice / Bill';

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
      `*${title}* #${doc.number}\n` +
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
      } else if (isPhdTheme) {
        // Pareswar Rout P.H.D Contractor Official Letterhead
        // 1. Double circular Lord Shiva Medallion on left
        pdf.setDrawColor(20, 20, 20);
        pdf.setLineWidth(0.7);
        pdf.circle(28, 20, 11, 'S');
        pdf.setLineWidth(0.3);
        pdf.circle(28, 20, 9.8, 'S');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6);
        pdf.setTextColor(20, 20, 20);
        pdf.text('SHIVA', 28, 20.5, { align: 'center' });

        // 2. PARESWAR ROUT
        pdf.setFont('times', 'bold');
        pdf.setFontSize(21);
        pdf.setTextColor(15, 23, 42);
        pdf.text(profile.name || 'PARESWAR ROUT', pageWidth / 2 + 10, 16, { align: 'center' });

        // 3. P.H.D Contractor
        pdf.setFont('times', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);
        pdf.text(profile.tagline || 'P.H.D Contractor', pageWidth / 2 + 10, 22, { align: 'center' });

        // 4. Address & Mobile
        pdf.setFont('times', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(51, 65, 85);
        pdf.text(`Address: ${profile.address}, ${profile.cityStatePincode}`, 44, 29);
        pdf.setFont('times', 'bold');
        pdf.text(`Mob. - ${profile.phone}`, pageWidth - 15, 29, { align: 'right' });

        // 5. Solid Horizontal Black Rule
        pdf.setDrawColor(15, 23, 42);
        pdf.setLineWidth(0.65);
        pdf.line(15, 33, pageWidth - 15, 33);

        // Sub-bar with Doc Type & Client
        y = 40;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(112, 38, 112); // Plum/Purple accent
        pdf.text(`${doc.type === 'quotation' ? 'QUOTATION' : 'BILL'} NO: ${doc.number}`, 15, y);
        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`DATE: ${doc.date}`, pageWidth - 15, y, { align: 'right' });

        y += 5;
        if (doc.customerSnapshot?.name) {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(15, 23, 42);
          pdf.text(`CLIENT: ${doc.customerSnapshot.name}`, 15, y);
          if (doc.customerSnapshot.siteAddress) {
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(71, 85, 105);
            pdf.text(`SITE: ${doc.customerSnapshot.siteAddress.slice(0, 45)}`, pageWidth / 2, y);
          }
          y += 9;
        }
      } else {
        // Built-in Modern Header
        pdf.setFillColor(2, 132, 199);
        pdf.rect(0, 0, pageWidth, 5, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(15, 23, 42);
        pdf.text(profile.name, 15, y);

        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(71, 85, 105);
        pdf.text(profile.tagline, 15, y);

        y += 4;
        pdf.text(`${profile.address}, ${profile.cityStatePincode}`, 15, y);
        y += 4;
        pdf.text(
          `Phone: ${profile.phone} ${profile.alternatePhone ? '| ' + profile.alternatePhone : ''} | Email: ${profile.email}`,
          15,
          y
        );

        // Right banner
        pdf.setFillColor(241, 245, 249);
        pdf.roundedRect(pageWidth - 75, 12, 60, 22, 2, 2, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(2, 132, 199);
        pdf.text(doc.type === 'quotation' ? 'QUOTATION' : 'TAX INVOICE', pageWidth - 45, 18, {
          align: 'center',
        });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(51, 65, 85);
        pdf.text(`No: ${doc.number}`, pageWidth - 45, 24, { align: 'center' });
        pdf.text(`Date: ${doc.date}`, pageWidth - 45, 29, { align: 'center' });

        y = 38;
        pdf.setDrawColor(226, 232, 240);
        pdf.line(15, y, pageWidth - 15, y);
        y += 6;

        // Customer details
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(15, 23, 42);
        pdf.text('BILL TO:', 15, y);
        if (doc.customerSnapshot.siteAddress) {
          pdf.text('SITE / WORK ADDRESS:', pageWidth / 2 + 5, y);
        }

        y += 4;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(51, 65, 85);
        pdf.text(doc.customerSnapshot.name, 15, y);
        if (doc.customerSnapshot.siteAddress) {
          pdf.text(doc.customerSnapshot.siteAddress.slice(0, 45), pageWidth / 2 + 5, y);
        }

        y += 4;
        pdf.text(`Phone: ${doc.customerSnapshot.phone}`, 15, y);
        if (doc.customerSnapshot.address) {
          y += 4;
          pdf.text(doc.customerSnapshot.address.slice(0, 45), 15, y);
        }
        y += 7;
      }

      // ==========================================
      // BODY RENDERING (Blocks vs Table)
      // ==========================================
      if (isPhdTheme && layoutMode === 'letterhead_blocks') {
        // Pareswar Rout Project Block Style
        doc.lines.forEach((line) => {
          if (y > pageHeight - 40) {
            pdf.addPage();
            y = 25;
          }

          // Purple Heading: RGB(112, 38, 112)
          pdf.setFont('times', 'bold');
          pdf.setFontSize(12);
          pdf.setTextColor(112, 38, 112);
          pdf.text(line.name, 15, y);
          y += 5.5;

          // Scope Description
          pdf.setFont('times', 'normal');
          pdf.setFontSize(9.5);
          pdf.setTextColor(30, 41, 59);
          const descText =
            line.sizeSpec ||
            `Plumbing, pipeline and fitting work for ${line.quantity} ${line.unit}.`;
          const splitDesc = pdf.splitTextToSize(descText, pageWidth - 90);
          pdf.text(splitDesc, 15, y);

          // Sub-calculation or Remaining payment balance line
          const amtText = `Rs. ${(line.lineTotalPaise / 100).toLocaleString('en-IN')}/-`;
          const calcLabel =
            line.quantity > 1
              ? `Estimated Cost = ${line.quantity} ${line.unit} x Rs. ${(line.ratePaise / 100).toLocaleString('en-IN')}/-`
              : 'Remaining Payment Balance';

          pdf.setFont('times', 'bold');
          pdf.setFontSize(9.5);
          pdf.setTextColor(15, 23, 42);
          pdf.text(calcLabel, pageWidth - 55, y, { align: 'right' });

          pdf.setTextColor(112, 38, 112);
          pdf.text(amtText, pageWidth - 15, y, { align: 'right' });

          y += Math.max(splitDesc.length * 5, 8) + 8;
        });

        // Total cost in bold purple
        y += 4;
        pdf.setFont('times', 'bold');
        pdf.setFontSize(13);
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

        pdf.text('S.No', 18, y + 4.5);
        pdf.text('Item Description & Size', 30, y + 4.5);
        pdf.text('Qty', pageWidth - 70, y + 4.5, { align: 'right' });
        pdf.text('Unit', pageWidth - 55, y + 4.5, { align: 'center' });
        pdf.text('Rate', pageWidth - 38, y + 4.5, { align: 'right' });
        pdf.text('Amount', pageWidth - 18, y + 4.5, { align: 'right' });

        y += 7;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(51, 65, 85);

        doc.lines.forEach((line, index) => {
          if (y > pageHeight - 50) {
            pdf.addPage();
            y = 20;
          }

          if (index % 2 === 1) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(15, y, pageWidth - 30, 6.5, 'F');
          }

          pdf.text(String(index + 1), 18, y + 4.5);
          const itemText = line.sizeSpec ? `${line.name} (${line.sizeSpec})` : line.name;
          pdf.text(itemText.slice(0, 48), 30, y + 4.5);
          pdf.text(String(line.quantity), pageWidth - 70, y + 4.5, { align: 'right' });
          pdf.text(line.unit, pageWidth - 55, y + 4.5, { align: 'center' });
          pdf.text((line.ratePaise / 100).toFixed(2), pageWidth - 38, y + 4.5, { align: 'right' });
          pdf.text((line.lineTotalPaise / 100).toFixed(2), pageWidth - 18, y + 4.5, {
            align: 'right',
          });

          y += 6.5;
        });

        pdf.setDrawColor(203, 213, 225);
        pdf.line(15, y, pageWidth - 15, y);
        y += 5;

        // Subtotal & Totals
        const totalsX = pageWidth - 80;
        pdf.setFontSize(8);
        pdf.text('Subtotal:', totalsX, y);
        pdf.text(`Rs. ${(calcs.subtotalPaise / 100).toFixed(2)}`, pageWidth - 18, y, {
          align: 'right',
        });
        y += 4.5;

        if (calcs.discountPaise > 0) {
          pdf.text('Discount:', totalsX, y);
          pdf.text(`-Rs. ${(calcs.discountPaise / 100).toFixed(2)}`, pageWidth - 18, y, {
            align: 'right',
          });
          y += 4.5;
        }

        if (doc.isTaxEnabled) {
          pdf.text('GST:', totalsX, y);
          pdf.text(`Rs. ${(calcs.totalTaxPaise / 100).toFixed(2)}`, pageWidth - 18, y, {
            align: 'right',
          });
          y += 4.5;
        }

        // Grand Total Bar
        pdf.setFillColor(112, 38, 112); // Plum/purple
        pdf.roundedRect(totalsX - 3, y - 1, pageWidth - totalsX - 12, 7, 1, 1, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Grand Total:', totalsX, y + 4);
        pdf.text(
          `Rs. ${(calcs.grandTotalPaise / 100).toLocaleString('en-IN')}/-`,
          pageWidth - 18,
          y + 4,
          { align: 'right' }
        );
        y += 10;
      }

      // Amount in words
      y += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Amount in Words:', 15, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(calcs.amountInWords, 45, y);

      // Signatory
      pdf.setFont('times', 'bold');
      pdf.setFontSize(8.5);
      pdf.text(`For ${profile.name}`, pageWidth - 55, pageHeight - 20);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text('P.H.D Contractor / Signatory', pageWidth - 55, pageHeight - 12);

      // Save PDF
      pdf.save(`${doc.number}.pdf`);
    } catch (err) {
      console.error('Error downloading PDF', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex flex-col items-center justify-start sm:p-4">
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-4xl bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-xl border-b border-slate-700 sm:rounded-t-2xl">
        <div className="flex items-center gap-2 truncate">
          <FileCheck className="w-5 h-5 text-sky-400 shrink-0" />
          <span className="font-bold text-sm sm:text-base truncate">
            {doc.number} ({doc.type === 'quotation' ? 'Quotation' : 'Bill'})
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Toggle between Contractor Scope Blocks and Itemized Table */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setLayoutMode('letterhead_blocks')}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
                layoutMode === 'letterhead_blocks'
                  ? 'bg-purple-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Pareswar Rout Official Letterhead Block Style (from photo)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Scope Blocks</span>
            </button>
            <button
              onClick={() => setLayoutMode('itemized_table')}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
                layoutMode === 'itemized_table'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Itemized Materials & Fittings Table"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Itemized Table</span>
            </button>
          </div>

          {/* Language Selector */}
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
            className="h-8 sm:h-9 px-2.5 sm:px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
            title="Share on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="h-8 sm:h-9 px-2.5 sm:px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="h-8 sm:h-9 px-2.5 sm:px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
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

      {/* Document Sheet Container (Clean A4 Paper Canvas) */}
      <div className="w-full max-w-4xl bg-white shadow-2xl p-6 sm:p-12 text-slate-900 min-h-screen sm:min-h-0 sm:rounded-b-2xl mb-8 print:p-0 print:shadow-none print:m-0">
        <div ref={printAreaRef} className="space-y-6">
          {/* Header Layout */}
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
          ) : isPhdTheme ? (
            /* ============================================================
               PARESWAR ROUT (P.H.D CONTRACTOR) OFFICIAL LETTERHEAD
               Matches user's exact uploaded document layout with Shiva logo
               ============================================================ */
            <div className="border-b-2 border-slate-900 pb-3 mb-6">
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Lord Shiva Circular Emblem */}
                <div className="shrink-0">
                  <img
                    src="/shiva-logo.svg"
                    alt="Lord Shiva Emblem"
                    className="w-20 h-20 sm:w-28 sm:h-28 object-contain"
                  />
                </div>

                {/* Center Contractor Name & Designation */}
                <div className="flex-1 text-center pr-4 sm:pr-16">
                  <h1 className="font-serif font-black text-2xl sm:text-4xl text-slate-900 tracking-wide uppercase">
                    {profile.name}
                  </h1>
                  <p className="font-serif font-bold text-xs sm:text-base tracking-widest text-slate-800 uppercase mt-0.5">
                    {profile.tagline || 'P.H.D Contractor'}
                  </p>

                  {/* Address & Mobile Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-xs sm:text-sm text-slate-800 mt-2 font-medium">
                    <span>
                      Address: {profile.address}, {profile.cityStatePincode}
                    </span>
                    <span className="font-bold">Mob. - {profile.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Modern Header */
            <div className="border-b border-slate-200 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {profile.name}
                  </h2>
                  <p className="text-xs font-medium text-sky-700">{profile.tagline}</p>
                  <p className="text-xs text-slate-500">
                    {profile.address}, {profile.cityStatePincode}
                  </p>
                  <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                    <span>Phone: {profile.phone}</span>
                    {profile.alternatePhone && <span>Alt: {profile.alternatePhone}</span>}
                    {profile.gstin && <span className="font-medium">GSTIN: {profile.gstin}</span>}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:min-w-[220px] text-right space-y-1.5 self-start sm:self-auto">
                  <div className="text-xs font-bold text-sky-700 tracking-wider">
                    {doc.type === 'quotation' ? t.quotationTitle : t.billTitle}
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {doc.type === 'quotation' ? t.quotationNo : t.billNo} {doc.number}
                  </div>
                  <div className="text-xs text-slate-500">
                    {t.date} <span className="font-medium text-slate-700">{doc.date}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer & Site Details Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 text-xs sm:text-sm text-slate-700 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                {t.billTo}
              </span>
              <p className="font-bold text-slate-900 text-sm sm:text-base">
                {doc.customerSnapshot.name}
              </p>
              <p className="text-slate-600">
                {t.phone} {doc.customerSnapshot.phone}
              </p>
              {doc.customerSnapshot.address && (
                <p className="text-slate-600">{doc.customerSnapshot.address}</p>
              )}
            </div>

            <div className="text-left sm:text-right space-y-0.5">
              <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                Document Details
              </span>
              <p className="font-bold text-slate-900">
                {doc.type === 'quotation' ? 'Quotation' : 'Bill'} #{doc.number}
              </p>
              <p className="text-slate-600">
                {t.date}: <span className="font-semibold text-slate-800">{doc.date}</span>
              </p>
              {doc.customerSnapshot.siteAddress && (
                <p className="text-slate-600 text-xs mt-1">
                  <strong>Site:</strong> {doc.customerSnapshot.siteAddress}
                </p>
              )}
            </div>
          </div>

          {/* ============================================================
             BODY CONTENT: EITHER CONTRACTOR SCOPE BLOCKS OR DETAILED TABLE
             ============================================================ */}
          {layoutMode === 'letterhead_blocks' ? (
            /* Pareswar Rout Project Scope / Block Milestone Style (from image) */
            <div className="space-y-6 pt-2">
              {doc.lines.map((line) => (
                <div
                  key={line.id}
                  className="space-y-1.5 border-b border-slate-200/80 pb-5 last:border-b-0"
                >
                  {/* Purple/Plum Heading */}
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#702670]">
                    {line.name}
                  </h3>

                  {/* Scope Description */}
                  <p className="font-serif text-xs sm:text-sm text-slate-800 leading-relaxed max-w-2xl">
                    {line.sizeSpec ||
                      `The project completed PH.D. and pipeline work for ${line.quantity} ${line.unit}, including rainwater and fixture fittings.`}
                  </p>

                  {/* Right Aligned Calculation & Cost */}
                  <div className="flex items-center justify-end gap-6 sm:gap-10 pt-2 font-serif text-xs sm:text-sm">
                    <span className="font-bold text-slate-900">
                      {line.quantity > 1
                        ? `Estimated Cost = ${line.quantity} ${line.unit} x Rs. ${(line.ratePaise / 100).toLocaleString('en-IN')}/-`
                        : 'Remaining Payment Balance'}
                    </span>
                    <span className="font-bold text-[#702670] font-mono text-sm sm:text-base">
                      Rs. {(line.lineTotalPaise / 100).toLocaleString('en-IN')}/-
                    </span>
                  </div>
                </div>
              ))}

              {/* Total Cost in Plum Bold Accent */}
              <div className="flex items-center justify-end gap-6 sm:gap-10 pt-6 border-t-2 border-slate-900 font-serif">
                <span className="font-bold text-base sm:text-xl text-slate-900">Total cost</span>
                <span className="font-bold text-[#702670] text-xl sm:text-2xl font-mono">
                  Rs. {(calcs.grandTotalPaise / 100).toLocaleString('en-IN')}/-
                </span>
              </div>
            </div>
          ) : (
            /* Standard Detailed Tabular View */
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-200 font-bold">
                      <th className="py-2.5 px-3 w-10 text-center">{t.sno}</th>
                      <th className="py-2.5 px-3">{t.itemDescription}</th>
                      <th className="py-2.5 px-3 w-16 text-right">{t.qty}</th>
                      <th className="py-2.5 px-3 w-16 text-center">{t.unit}</th>
                      <th className="py-2.5 px-3 w-28 text-right">{t.rate}</th>
                      {doc.isTaxEnabled && <th className="py-2.5 px-3 w-16 text-center">{t.tax}</th>}
                      <th className="py-2.5 px-3 w-32 text-right">{t.amount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-serif">
                    {doc.lines.map((line, idx) => (
                      <tr key={line.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#702670]">{line.name}</div>
                          {line.sizeSpec && (
                            <div className="text-xs text-slate-600 font-sans">{line.sizeSpec}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {line.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-sans">
                          {line.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          Rs. {(line.ratePaise / 100).toLocaleString('en-IN')}/-
                        </td>
                        {doc.isTaxEnabled && (
                          <td className="py-2.5 px-3 text-center text-slate-600 font-mono">
                            {line.taxRate}%
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-right font-bold text-[#702670] font-mono tabular-nums">
                          Rs. {(line.lineTotalPaise / 100).toLocaleString('en-IN')}/-
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-1/2 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm font-serif">
                  <div className="flex justify-between text-slate-700">
                    <span>{t.subtotal}:</span>
                    <span className="font-mono">
                      Rs. {(calcs.subtotalPaise / 100).toLocaleString('en-IN')}/-
                    </span>
                  </div>

                  {calcs.discountPaise > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>{t.discount}:</span>
                      <span className="font-mono">
                        -Rs. {(calcs.discountPaise / 100).toLocaleString('en-IN')}/-
                      </span>
                    </div>
                  )}

                  {doc.isTaxEnabled && (
                    <div className="flex justify-between text-slate-700">
                      <span>{t.tax}:</span>
                      <span className="font-mono">
                        Rs. {(calcs.totalTaxPaise / 100).toLocaleString('en-IN')}/-
                      </span>
                    </div>
                  )}

                  <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center font-bold text-base sm:text-lg">
                    <span className="text-slate-900">Total cost:</span>
                    <span className="text-[#702670] font-mono text-xl">
                      Rs. {(calcs.grandTotalPaise / 100).toLocaleString('en-IN')}/-
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amount in words */}
          <div className="text-xs sm:text-sm border-t border-slate-200 pt-3 flex items-start gap-2 text-slate-700">
            <span className="font-bold text-slate-900 uppercase">Amount in Words:</span>
            <span className="italic">{calcs.amountInWords}</span>
          </div>

          {/* Bank & Payment Details */}
          {(profile.bankName || profile.upiId) && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block">
                  Payment &amp; Bank Details
                </span>
                <p className="text-slate-700">
                  Bank: <strong>{profile.bankName}</strong> · A/C:{' '}
                  <strong className="font-mono">{profile.accountNumber}</strong> · IFSC:{' '}
                  <strong className="font-mono">{profile.ifscCode}</strong>
                </p>
                {profile.upiId && (
                  <p className="text-slate-700">
                    UPI ID: <strong className="text-sky-800 font-mono">{profile.upiId}</strong> (
                    {profile.upiName || profile.name})
                  </p>
                )}
              </div>
              <QrCode className="w-8 h-8 text-slate-700 shrink-0 hidden sm:block" />
            </div>
          )}

          {/* Signatory */}
          <div className="pt-8 flex justify-between items-end text-xs">
            <div className="text-slate-400">
              Generated by PlumbQuote &amp; Bill
            </div>
            <div className="text-right space-y-1">
              <p className="font-serif font-bold text-sm text-slate-900">
                For {profile.name}
              </p>
              <p className="text-slate-500 font-serif">P.H.D Contractor / Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
