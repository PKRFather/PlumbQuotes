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
