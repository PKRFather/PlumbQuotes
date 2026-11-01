/**
 * Core type definitions for Plumbing Quotation & Bill Generator
 */

export type DocumentType = 'quotation' | 'bill';

export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid' | 'partial';

export type PaymentMode = 'cash' | 'upi' | 'bank' | 'cheque';

export type UnitType =
  | 'Nos'
  | 'Mtr'
  | 'Rft'
  | 'Pkt'
  | 'Set'
  | 'Ft'
  | 'Kg'
  | 'Ltr'
  | 'Hr'
  | 'Day'
  | 'Point'
  | 'Job';

export type LanguageCode = 'en' | 'hi' | 'or'; // English, Hindi, Odia

export interface ItemVariantPrice {
  material: string; // e.g. "CPVC", "UPVC", "Brass", "GI", "SS 304", "PVC SWR", "PPR"
  size: string; // e.g. "1/2 inch", "3/4 inch", "1 inch", etc.
  ratePaise: number; // Stored in paise (1 INR = 100 paise)
}

export interface GlossaryItem {
  id: string;
  category: string;
  name: string;
  sizeSpec: string;
  unit: UnitType;
  defaultRatePaise: number; // Stored in paise (1 INR = 100 paise)
  taxRate: number; // e.g. 18 for 18%
  active: boolean;
  notes?: string;
  hasVariants?: boolean;
  availableMaterials?: string[];
  availableSizes?: string[];
  variantPrices?: ItemVariantPrice[];
}

export interface ItemBundle {
  id: string;
  title: string;
  description: string;
  category: string;
  items: {
    name: string;
    sizeSpec?: string;
    material?: string;
    size?: string;
    unit: UnitType;
    quantity: number;
    ratePaise: number;
    taxRate: number;
  }[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  siteAddress?: string;
  gstin?: string;
  notes?: string;
  createdAt: number;
}

export interface DocumentLine {
  id: string;
  itemId?: string;
  name: string;
  sizeSpec?: string;
  material?: string; // e.g. "CPVC", "UPVC", "Brass", "GI"
  size?: string; // e.g. "3/4 inch", "1 inch"
  unit: UnitType;
  quantity: number;
  ratePaise: number;
  taxRate: number;
  lineTotalPaise: number;
  isCustomScopeBlock?: boolean; // Custom narrative paragraph / contractor work scope block
  descriptionParagraph?: string; // Multi-line custom paragraph written by contractor
}

export interface Payment {
  id: string;
  billId: string;
  date: string;
  amountPaise: number;
  mode: PaymentMode;
  note?: string;
  transactionRef?: string;
  recordedAt: number;
}

export type LogoType =
  | 'shiva'
  | 'tools'
  | 'pipe_wrench'
  | 'water_drop'
  | 'contractor_shield'
  | 'industrial_valve'
  | 'custom'
  | 'none';

export type HeaderAlignment = 'left' | 'center' | 'split' | 'right';
export type DividerStyle = 'solid' | 'double' | 'dashed' | 'dotted' | 'thick_thin' | 'gradient' | 'none';
export type LayoutPresentation = 'itemized_table' | 'letterhead_blocks';
export type TableDensity = 'compact' | 'normal' | 'spacious';
export type TableBorderStyle = 'full_grid' | 'horizontal_only' | 'clean_minimal' | 'boxed';
export type DocumentBoxStyle = 'rounded_card' | 'bordered_box' | 'minimal' | 'accent_left';
export type BankCardStyle = 'card' | 'minimal' | 'table' | 'split' | 'hidden';
export type UpiQrPosition = 'bottom_right' | 'bottom_left' | 'with_bank' | 'header' | 'hidden';
export type SignatureAlignment = 'right' | 'center' | 'left' | 'split';
export type WatermarkType = 'text' | 'logo' | 'none';
export type FontFamilyOption =
  | 'serif'
  | 'playfair'
  | 'cinzel'
  | 'merriweather'
  | 'sans'
  | 'outfit'
  | 'jakarta'
  | 'slab'
  | 'mono';

export interface HeaderConfig {
  logoType: LogoType;
  customLogoUrl?: string;
  logoSizePx: number; // e.g., 80
  logoFrame: 'circle' | 'double_ring' | 'rounded' | 'square' | 'none';
  alignment: HeaderAlignment;
  topInvocationText?: string; // e.g. "|| ଶ୍ରୀ ଶ୍ରୀ ଧବଳେଶ୍ୱର ପ୍ରସନ୍ନ ||" or "|| ॐ नमः शिवाय ||"
  showInvocation: boolean;
  contractorNameFontFamily: FontFamilyOption;
  contractorNameFontSizePx: number; // e.g., 28
  contractorNameColor: string; // e.g., "#0f172a"
  contractorNameUppercase: boolean;
  contractorLetterSpacing: 'normal' | 'wide' | 'widest';
  taglineFontSizePx: number; // e.g., 14
  taglineColor: string; // e.g., "#334155"
  taglineFontFamily: FontFamilyOption;
  showTagline: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showAltPhone: boolean;
  showEmail: boolean;
  showGstin: boolean;
  contactRowLayout: 'spaced_between' | 'badges' | 'stacked' | 'compact';
  contactFontSizePx: number; // e.g., 12
  contactColor: string; // e.g., "#334155"
  dividerStyle: DividerStyle;
  dividerColor: string; // e.g., "#0f172a"
  dividerThicknessPx: number; // e.g., 2
  headerBgColor?: string; // e.g., "#ffffff"
}

export interface StylingConfig {
  primaryColor: string; // main brand accent (e.g. #702670 or #0284c7)
  secondaryColor: string;
  textColor: string;
  headingColor: string;
  paperBgColor: string; // #ffffff, #fcfbf9, #f8fafc
  fontFamily: FontFamilyOption;
  baseFontSizePx: number; // 12, 13, 14
  borderRadiusPx: number;
}

export interface MetadataBlockConfig {
  layout: 'badge_box' | 'banner_strip' | 'classic_inline' | 'modern_card';
  quotationTitle: string; // "QUOTATION" or "ESTIMATE"
  billTitle: string; // "TAX INVOICE" or "BILL"
  showNumber: boolean;
  showDate: boolean;
  showDueDate: boolean;
  titleColor: string;
  badgeBgColor: string;
}

export interface CustomerBlockConfig {
  style: DocumentBoxStyle;
  billToLabel: string; // "BILL TO:" or "CLIENT:"
  siteLabel: string; // "SITE / WORK ADDRESS:"
  bgColor: string;
  borderColor: string;
  showSiteAddress: boolean;
  showCustomerPhone: boolean;
  showCustomerEmail: boolean;
}

export interface TableConfig {
  presentation: LayoutPresentation;
  density: TableDensity;
  borderStyle: TableBorderStyle;
  borderColor: string;
  headerBgColor: string;
  headerTextColor: string;
  alternatingRowBg: boolean;
  stripeColor: string;
  fontSizePx: number;
  snoLabel: string;
  descriptionLabel: string;
  sizeSpecLabel: string;
  quantityLabel: string;
  unitLabel: string;
  rateLabel: string;
  taxLabel: string;
  amountLabel: string;
}

export interface TotalsConfig {
  highlightColor: string;
  showTaxBreakdown: boolean;
  showDiscountLine: boolean;
  showAdvancePaid: boolean;
  showBalanceDue: boolean;
  amountInWordsStyle: 'banner' | 'pill' | 'italic_note' | 'none';
  amountInWordsLabel: string;
}

export interface FooterConfig {
  bankStyle: BankCardStyle;
  bankTitle: string;
  upiPosition: UpiQrPosition;
  upiTitle: string;
  qrSizePx: number;
  termsStyle: 'boxed' | 'numbered' | 'bullets' | 'compact';
  termsTitle: string;
  termsText?: string;
  signatureTitle: string;
  signatureSubtext?: string;
  signatureAlign: SignatureAlignment;
  showSignatureLine: boolean;
  customFooterNote: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  type: WatermarkType;
  text: string;
  opacityPercent: number; // 3 to 25
  rotationDeg: number; // -45 to 45
  fontSizePx: number;
}

export interface FormatTemplate {
  id: string;
  name: string;
  type: 'quotation' | 'bill' | 'both';
  isDefault: boolean;
  pageSize: 'A4' | 'A5' | 'Letter';
  mode: 'custom_background' | 'built_in';
  theme: 'phd_contractor' | 'modern_sky' | 'classic_contractor' | 'minimal_slate' | 'emerald_pro';
  backgroundImage?: string; // base64 / data URL
  bodyArea: {
    topPercent: number; // e.g. 25% from top
    bottomPercent: number; // e.g. 15% from bottom
    leftPercent: number;
    rightPercent: number;
  };
  columnVisibility: {
    sno: boolean;
    description: boolean;
    sizeSpec: boolean;
    quantity: boolean;
    unit: boolean;
    rate: boolean;
    tax: boolean;
    amount: boolean;
  };
  showUpiQr: boolean;
  showTerms: boolean;
  showSignature: boolean;
  showBankDetails: boolean;

  // Complete Granular Letterhead Configuration
  header?: HeaderConfig;
  styling?: StylingConfig;
  metadataBlock?: MetadataBlockConfig;
  customerBlock?: CustomerBlockConfig;
  table?: TableConfig;
  totals?: TotalsConfig;
  footer?: FooterConfig;
  watermark?: WatermarkConfig;
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  address: string;
  cityStatePincode: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  gstin?: string;
  pan?: string;
  logoUrl?: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  upiName?: string;
  defaultTerms: string[];
  signatureUrl?: string;
  stateCode: string; // e.g. '21' for Odisha
  defaultLanguage: LanguageCode;
  enableGstByDefault: boolean;
  quotationPrefix: string;
  billPrefix: string;
  nextQuotationNumber: number;
  nextBillNumber: number;
  financialYear: string;
}

export interface QuotationBillDocument {
  id: string;
  type: DocumentType;
  number: string;
  date: string;
  validUntil?: string; // for quotations (e.g. 15/30 days)
  customerId: string;
  customerSnapshot: Customer;
  formatId: string;
  status: DocumentStatus;
  lines: DocumentLine[];
  discountType: 'percentage' | 'fixed';
  discountValue: number; // % or INR
  isTaxEnabled: boolean;
  isInterState: boolean; // if true, IGST; if false, CGST + SGST
  isPriceTaxInclusive: boolean;
  notes: string;
  advancePaidPaise: number;
  payments: Payment[];
  sourceQuotationId?: string; // set when quotation is converted to bill
  createdAt: number;
  updatedAt: number;
}

export interface DocumentCalculations {
  subtotalPaise: number;
  discountPaise: number;
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  roundOffPaise: number;
  grandTotalPaise: number;
  totalPaidPaise: number;
  balanceDuePaise: number;
  amountInWords: string;
}

export interface OwnerAccount {
  username: string; // e.g. "contractor"
  fullName: string; // e.g. "P.H.D Contractor"
  email: string;
  designation: string;
  phone: string;
  githubRepoUrl: string;
  githubRepoName: string;
  role: 'owner' | 'staff'; // active role session
  pinEnabled: boolean;
  pinCode?: string; // 4-digit security PIN
  githubToken?: string; // optional GitHub Personal Access Token for sync
  lastSyncedAt?: number;
  isOrphanClaimed: boolean; // ownership claimed & active
  claimedAt: number;
}

