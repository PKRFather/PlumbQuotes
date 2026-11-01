import {
  FormatTemplate,
  HeaderConfig,
  StylingConfig,
  MetadataBlockConfig,
  CustomerBlockConfig,
  TableConfig,
  TotalsConfig,
  FooterConfig,
  WatermarkConfig,
  FontFamilyOption,
} from '../types';

export interface ResolvedFormatConfig {
  header: HeaderConfig;
  styling: StylingConfig;
  metadataBlock: MetadataBlockConfig;
  customerBlock: CustomerBlockConfig;
  table: TableConfig;
  totals: TotalsConfig;
  footer: FooterConfig;
  watermark: WatermarkConfig;
}

export function getFontFamilyCSS(font?: FontFamilyOption): string {
  switch (font) {
    case 'cinzel':
      return "'Cinzel', serif";
    case 'playfair':
      return "'Playfair Display', serif";
    case 'merriweather':
      return "'Merriweather', serif";
    case 'serif':
      return "Georgia, 'Times New Roman', serif";
    case 'outfit':
      return "'Outfit', sans-serif";
    case 'jakarta':
      return "'Plus Jakarta Sans', sans-serif";
    case 'slab':
      return "'Roboto Slab', serif";
    case 'mono':
      return "'JetBrains Mono', monospace";
    case 'sans':
    default:
      return "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  }
}

export function resolveFormatConfig(format?: Partial<FormatTemplate> | null): ResolvedFormatConfig {
  const theme = format?.theme || 'phd_contractor';
  const isPhd = theme === 'phd_contractor';
  const isSky = theme === 'modern_sky';
  const isEmerald = theme === 'emerald_pro';
  const isSlate = theme === 'minimal_slate';

  // 1. Primary Colors
  const defaultPrimary = isPhd
    ? '#702670' // P.H.D Contractor signature Plum/Purple
    : isSky
    ? '#0284c7' // Modern Sky
    : isEmerald
    ? '#059669' // Industrial Emerald
    : isSlate
    ? '#0f172a' // Minimal Slate
    : '#1e3a8a'; // Classic Contractor Navy

  const defaultSecondary = isPhd
    ? '#b45309' // Golden Bronze
    : isSky
    ? '#38bdf8'
    : isEmerald
    ? '#10b981'
    : isSlate
    ? '#64748b'
    : '#3b82f6';

  // 2. Default Header
  const header: HeaderConfig = {
    logoType: format?.header?.logoType ?? (isPhd ? 'shiva' : isSky ? 'water_drop' : isEmerald ? 'industrial_valve' : 'tools'),
    customLogoUrl: format?.header?.customLogoUrl || '',
    logoSizePx: format?.header?.logoSizePx ?? (isPhd ? 96 : 72),
    logoFrame: format?.header?.logoFrame ?? (isPhd ? 'double_ring' : 'none'),
    alignment: format?.header?.alignment ?? (isPhd ? 'split' : isSlate ? 'left' : 'split'),
    topInvocationText:
      format?.header?.topInvocationText ?? (isPhd ? '|| ଶ୍ରୀ ଶ୍ରୀ ଧବଳେଶ୍ୱର ପ୍ରସନ୍ନ ||' : ''),
    showInvocation: format?.header?.showInvocation ?? isPhd,
    contractorNameFontFamily: format?.header?.contractorNameFontFamily ?? (isPhd ? 'serif' : isEmerald ? 'slab' : 'jakarta'),
    contractorNameFontSizePx: format?.header?.contractorNameFontSizePx ?? (isPhd ? 32 : 24),
    contractorNameColor: format?.header?.contractorNameColor ?? (isPhd ? '#0f172a' : defaultPrimary),
    contractorNameUppercase: format?.header?.contractorNameUppercase ?? true,
    contractorLetterSpacing: format?.header?.contractorLetterSpacing ?? (isPhd ? 'wide' : 'normal'),
    taglineFontSizePx: format?.header?.taglineFontSizePx ?? (isPhd ? 14 : 12),
    taglineColor: format?.header?.taglineColor ?? (isPhd ? '#334155' : '#64748b'),
    taglineFontFamily: format?.header?.taglineFontFamily ?? (isPhd ? 'serif' : 'sans'),
    showTagline: format?.header?.showTagline ?? true,
    showAddress: format?.header?.showAddress ?? true,
    showPhone: format?.header?.showPhone ?? true,
    showAltPhone: format?.header?.showAltPhone ?? true,
    showEmail: format?.header?.showEmail ?? (!isPhd),
    showGstin: format?.header?.showGstin ?? true,
    contactRowLayout: format?.header?.contactRowLayout ?? (isPhd ? 'spaced_between' : 'badges'),
    contactFontSizePx: format?.header?.contactFontSizePx ?? (isPhd ? 12 : 11),
    contactColor: format?.header?.contactColor ?? '#334155',
    dividerStyle: format?.header?.dividerStyle ?? (isPhd ? 'solid' : 'gradient'),
    dividerColor: format?.header?.dividerColor ?? (isPhd ? '#0f172a' : defaultPrimary),
    dividerThicknessPx: format?.header?.dividerThicknessPx ?? (isPhd ? 2 : 2),
    headerBgColor: format?.header?.headerBgColor ?? '#ffffff',
  };

  // 3. Default Styling
  const styling: StylingConfig = {
    primaryColor: format?.styling?.primaryColor ?? defaultPrimary,
    secondaryColor: format?.styling?.secondaryColor ?? defaultSecondary,
    textColor: format?.styling?.textColor ?? '#0f172a',
    headingColor: format?.styling?.headingColor ?? '#0f172a',
    paperBgColor: format?.styling?.paperBgColor ?? '#ffffff',
    fontFamily: format?.styling?.fontFamily ?? (isPhd ? 'serif' : 'jakarta'),
    baseFontSizePx: format?.styling?.baseFontSizePx ?? 13,
    borderRadiusPx: format?.styling?.borderRadiusPx ?? (isPhd ? 0 : 8),
  };

  // 4. Default Metadata Block
  const metadataBlock: MetadataBlockConfig = {
    layout: format?.metadataBlock?.layout ?? (isPhd ? 'classic_inline' : 'badge_box'),
    quotationTitle: format?.metadataBlock?.quotationTitle ?? (isPhd ? 'QUOTATION' : 'ESTIMATE / QUOTATION'),
    billTitle: format?.metadataBlock?.billTitle ?? (isPhd ? 'BILL' : 'TAX INVOICE'),
    showNumber: format?.metadataBlock?.showNumber ?? true,
    showDate: format?.metadataBlock?.showDate ?? true,
    showDueDate: format?.metadataBlock?.showDueDate ?? false,
    titleColor: format?.metadataBlock?.titleColor ?? defaultPrimary,
    badgeBgColor: format?.metadataBlock?.badgeBgColor ?? (isPhd ? '#fdf4ff' : '#f0f9ff'),
  };

  // 5. Default Customer Block
  const customerBlock: CustomerBlockConfig = {
    style: format?.customerBlock?.style ?? (isPhd ? 'bordered_box' : 'rounded_card'),
    billToLabel: format?.customerBlock?.billToLabel ?? (isPhd ? 'CLIENT:' : 'BILL TO:'),
    siteLabel: format?.customerBlock?.siteLabel ?? 'SITE / WORK ADDRESS:',
    bgColor: format?.customerBlock?.bgColor ?? (isPhd ? '#ffffff' : '#f8fafc'),
    borderColor: format?.customerBlock?.borderColor ?? (isPhd ? '#cbd5e1' : '#e2e8f0'),
    showSiteAddress: format?.customerBlock?.showSiteAddress ?? true,
    showCustomerPhone: format?.customerBlock?.showCustomerPhone ?? true,
    showCustomerEmail: format?.customerBlock?.showCustomerEmail ?? false,
  };

  // 6. Default Table Config
  const table: TableConfig = {
    presentation:
      format?.table?.presentation ?? (isPhd ? 'letterhead_blocks' : 'itemized_table'),
    density: format?.table?.density ?? 'normal',
    borderStyle: format?.table?.borderStyle ?? (isPhd ? 'boxed' : 'full_grid'),
    borderColor: format?.table?.borderColor ?? (isPhd ? '#0f172a' : '#e2e8f0'),
    headerBgColor: format?.table?.headerBgColor ?? (isPhd ? '#f8fafc' : defaultPrimary),
    headerTextColor: format?.table?.headerTextColor ?? (isPhd ? '#0f172a' : '#ffffff'),
    alternatingRowBg: format?.table?.alternatingRowBg ?? (!isPhd),
    stripeColor: format?.table?.stripeColor ?? '#f8fafc',
    fontSizePx: format?.table?.fontSizePx ?? 12,
    snoLabel: format?.table?.snoLabel ?? 'S.No',
    descriptionLabel: format?.table?.descriptionLabel ?? 'Item Description',
    sizeSpecLabel: format?.table?.sizeSpecLabel ?? 'Size / Spec',
    quantityLabel: format?.table?.quantityLabel ?? 'Qty',
    unitLabel: format?.table?.unitLabel ?? 'Unit',
    rateLabel: format?.table?.rateLabel ?? 'Rate',
    taxLabel: format?.table?.taxLabel ?? 'GST %',
    amountLabel: format?.table?.amountLabel ?? 'Amount (₹)',
  };

  // 7. Default Totals
  const totals: TotalsConfig = {
    highlightColor: format?.totals?.highlightColor ?? defaultPrimary,
    showTaxBreakdown: format?.totals?.showTaxBreakdown ?? (!isPhd),
    showDiscountLine: format?.totals?.showDiscountLine ?? true,
    showAdvancePaid: format?.totals?.showAdvancePaid ?? true,
    showBalanceDue: format?.totals?.showBalanceDue ?? true,
    amountInWordsStyle: format?.totals?.amountInWordsStyle ?? (isPhd ? 'banner' : 'pill'),
    amountInWordsLabel: format?.totals?.amountInWordsLabel ?? 'Amount in Words:',
  };

  // 8. Default Footer
  const footer: FooterConfig = {
    bankStyle: format?.footer?.bankStyle ?? (isPhd ? 'card' : 'card'),
    bankTitle: format?.footer?.bankTitle ?? 'Bank Details for NEFT / RTGS',
    upiPosition: format?.footer?.upiPosition ?? (isPhd ? 'bottom_right' : 'with_bank'),
    upiTitle: format?.footer?.upiTitle ?? 'Scan & Pay via UPI / PhonePe / GPay',
    qrSizePx: format?.footer?.qrSizePx ?? 90,
    termsStyle: format?.footer?.termsStyle ?? (isPhd ? 'numbered' : 'boxed'),
    termsTitle: format?.footer?.termsTitle ?? 'Terms & Conditions',
    termsText:
      format?.footer?.termsText ??
      '1. Payment 50% advance along with work order.\n2. Materials once supplied will not be returned.\n3. Extra work beyond quote will be charged as per actual measurements.\n4. Subject to local jurisdiction.',
    signatureTitle: format?.footer?.signatureTitle ?? (isPhd ? 'P.H.D CONTRACTOR' : 'Authorized Signatory'),
    signatureSubtext:
      format?.footer?.signatureSubtext ?? (isPhd ? 'Authorized Signatory' : 'Proprietor / Signatory'),
    signatureAlign: format?.footer?.signatureAlign ?? 'right',
    showSignatureLine: format?.footer?.showSignatureLine ?? true,
    customFooterNote:
      format?.footer?.customFooterNote ?? (isPhd ? 'Thank you! P.H.D Sanitary & Plumbing Works' : 'Thank you for your business!'),
  };

  // 9. Watermark
  const watermark: WatermarkConfig = {
    enabled: format?.watermark?.enabled ?? false,
    type: format?.watermark?.type ?? (isPhd ? 'logo' : 'text'),
    text: format?.watermark?.text ?? (isPhd ? 'P.H.D CONTRACTOR' : 'ESTIMATE'),
    opacityPercent: format?.watermark?.opacityPercent ?? 6,
    rotationDeg: format?.watermark?.rotationDeg ?? -25,
    fontSizePx: format?.watermark?.fontSizePx ?? 56,
  };

  return {
    header,
    styling,
    metadataBlock,
    customerBlock,
    table,
    totals,
    footer,
    watermark,
  };
}
