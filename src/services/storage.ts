import {
  BusinessProfile,
  Customer,
  DocumentLine,
  DocumentType,
  FormatTemplate,
  GlossaryItem,
  ItemBundle,
  QuotationBillDocument,
} from '../types';
import { DEFAULT_FORMATS } from '../data/defaultFormats';
import { STARTER_BUNDLES } from '../data/starterBundles';
import { STARTER_GLOSSARY_ITEMS } from '../data/starterGlossary';
import { getPanamGlossaryItems } from '../data/pipeFittingsValvesJointsConfig';

const STORAGE_KEYS = {
  PROFILE: 'plumb_profile_v1',
  FORMATS: 'plumb_formats_v1',
  GLOSSARY: 'plumb_glossary_v1',
  BUNDLES: 'plumb_bundles_v1',
  CUSTOMERS: 'plumb_customers_v1',
  DOCUMENTS: 'plumb_documents_v1',
  LAST_RATES: 'plumb_last_rates_v1',
};

const DEFAULT_PROFILE: BusinessProfile = {
  name: 'PARESWAR ROUT',
  tagline: 'P.H.D Contractor',
  address: 'At - Kalarahanga, Patia',
  cityStatePincode: 'Bhubaneswar, Odisha - 751024',
  phone: '+91 94370 12345',
  alternatePhone: '+91 70081 23456',
  email: 'pradeeprout56@gmail.com',
  gstin: '21ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  logoUrl: '/shiva-logo.svg',
  bankName: 'State Bank of India',
  accountNumber: '318900456123',
  ifscCode: 'SBIN0001234',
  upiId: 'pareswarrout@sbi',
  upiName: 'Pareswar Rout',
  defaultTerms: [
    'Quotation is valid for 15 days from the date of issue.',
    'Payment to be made stage-wise as per work completion.',
    'Material rate escalations, if any, will be charged as per actual market rates.',
    'Any additional civil, core cutting, or masonry work outside plumbing scope will be charged extra.',
    'All pipeline joints and fitting works carry 1-year leakage & defect guarantee.',
  ],
  signatureUrl: '',
  stateCode: '21',
  defaultLanguage: 'en',
  enableGstByDefault: false,
  quotationPrefix: 'PR-QT-',
  billPrefix: 'PR-BILL-',
  nextQuotationNumber: 1,
  nextBillNumber: 1,
  financialYear: '2026-27',
};

const STARTER_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Rajesh Kumar Pattnaik',
    phone: '+91 94370 11223',
    email: 'rajesh.pattnaik@gmail.com',
    address: 'Plot 104, Surya Nagar, Bhubaneswar',
    siteAddress: 'Duplex 14B, Royal Palm Enclave, Patia, Bhubaneswar',
    gstin: '',
    notes: '2-storey residential building plumbing & CPVC fitting work',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'cust-2',
    name: 'Dr. Anita Mohanty',
    phone: '+91 99371 44556',
    email: 'anita.mohanty@careclinic.org',
    address: 'Plot 220, Unit-4, Bhouma Nagar, Bhubaneswar',
    siteAddress: 'Dental Care Clinic, 2nd Floor, Saheed Nagar, Bhubaneswar',
    gstin: '21AABCM5678R1Z1',
    notes: 'Commercial dental clinic water line & drainage line maintenance',
    createdAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'cust-3',
    name: 'M/s Greenfield Infrastructure',
    phone: '+91 97760 99887',
    email: 'accounts@greenfieldinfra.in',
    address: 'Greenfield Tower, Chandrasekharpur, Bhubaneswar',
    siteAddress: 'Staff Quarters Block C, Infocity Road, Bhubaneswar',
    gstin: '21AAACG9900Q1Z9',
    notes: 'Contract plumbing & underground sewage line laying',
    createdAt: Date.now() - 86400000 * 20,
  },
];

// Helper to safely load JSON
function safeLoad<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Failed to parse localStorage key ${key}`, err);
    return fallback;
  }
}

function safeSave<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save to localStorage key ${key}`, err);
  }
}

class StorageService {
  private undoDeletedLine: { documentId: string; line: DocumentLine } | null = null;

  // Profile
  getProfile(): BusinessProfile {
    const profile = safeLoad<BusinessProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    if (!profile.name || profile.name === 'Sri Sai Plumbing & Sanitary Works') {
      safeSave(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    if (!profile.logoUrl) {
      profile.logoUrl = '/shiva-logo.svg';
      safeSave(STORAGE_KEYS.PROFILE, profile);
    }
    return profile;
  }

  saveProfile(profile: BusinessProfile): void {
    safeSave(STORAGE_KEYS.PROFILE, profile);
  }

  // Next Document Number Generator
  getNextNumber(type: DocumentType): string {
    const profile = this.getProfile();
    const prefix = type === 'quotation' ? profile.quotationPrefix : profile.billPrefix;
    const nextSeq = type === 'quotation' ? profile.nextQuotationNumber : profile.nextBillNumber;
    const formattedNum = String(nextSeq).padStart(4, '0');
    return `${prefix}${formattedNum}`;
  }

  incrementNextNumber(type: DocumentType): void {
    const profile = this.getProfile();
    if (type === 'quotation') {
      profile.nextQuotationNumber += 1;
    } else {
      profile.nextBillNumber += 1;
    }
    this.saveProfile(profile);
  }

  // Formats
  getFormats(): FormatTemplate[] {
    const formats = safeLoad<FormatTemplate[]>(STORAGE_KEYS.FORMATS, []);
    if (!formats || formats.length === 0) {
      safeSave(STORAGE_KEYS.FORMATS, DEFAULT_FORMATS);
      return DEFAULT_FORMATS;
    }
    const hasPhd = formats.some((f) => f.id === 'format-phd-contractor');
    if (!hasPhd) {
      formats.forEach((f) => { f.isDefault = false; });
      formats.unshift(DEFAULT_FORMATS[0]);
      safeSave(STORAGE_KEYS.FORMATS, formats);
    }
    return formats;
  }

  saveFormat(format: FormatTemplate): void {
    const formats = this.getFormats();
    const index = formats.findIndex((f) => f.id === format.id);
    if (index >= 0) {
      formats[index] = format;
    } else {
      formats.push(format);
    }
    // If set as default, unset others for that type
    if (format.isDefault) {
      formats.forEach((f) => {
        if (f.id !== format.id && (f.type === format.type || f.type === 'both')) {
          f.isDefault = false;
        }
      });
    }
    safeSave(STORAGE_KEYS.FORMATS, formats);
  }

  deleteFormat(id: string): void {
    const formats = this.getFormats().filter((f) => f.id !== id);
    safeSave(STORAGE_KEYS.FORMATS, formats);
  }

  getDefaultFormat(type: DocumentType): FormatTemplate {
    const formats = this.getFormats();
    const match = formats.find((f) => f.isDefault && (f.type === type || f.type === 'both'));
    return match || formats[0] || DEFAULT_FORMATS[0];
  }

  // Glossary
  getGlossary(): GlossaryItem[] {
    const items = safeLoad<GlossaryItem[]>(STORAGE_KEYS.GLOSSARY, []);
    if (!items || items.length === 0) {
      const seeded: GlossaryItem[] = STARTER_GLOSSARY_ITEMS.map((item, idx) => ({
        ...item,
        id: `glossary-${idx + 1}`,
      }));
      safeSave(STORAGE_KEYS.GLOSSARY, seeded);
      return seeded;
    }

    // Merge in any new variant items from starter and Panam config
    let hasNew = false;
    const allVariants = [...STARTER_GLOSSARY_ITEMS, ...getPanamGlossaryItems()];

    allVariants.forEach((variantItem, idx) => {
      if (variantItem.hasVariants) {
        const existingIdx = items.findIndex((i) => i.name.toLowerCase() === variantItem.name.toLowerCase());
        if (existingIdx === -1) {
          items.push({
            ...variantItem,
            id: `glossary-var-${idx + 1}`,
          });
          hasNew = true;
        } else if (!items[existingIdx].hasVariants || !items[existingIdx].availableMaterials?.includes('SS 316')) {
          // Upgrade existing item to have full multi-variant capabilities
          items[existingIdx] = {
            ...items[existingIdx],
            hasVariants: true,
            availableMaterials: variantItem.availableMaterials,
            availableSizes: variantItem.availableSizes,
            variantPrices: variantItem.variantPrices || items[existingIdx].variantPrices,
          };
          hasNew = true;
        }
      }
    });

    if (hasNew) {
      safeSave(STORAGE_KEYS.GLOSSARY, items);
    }

    return items;
  }

  saveGlossaryItem(item: GlossaryItem): void {
    const items = this.getGlossary();
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.unshift(item);
    }
    safeSave(STORAGE_KEYS.GLOSSARY, items);
  }

  deleteGlossaryItem(id: string): void {
    const items = this.getGlossary().filter((i) => i.id !== id);
    safeSave(STORAGE_KEYS.GLOSSARY, items);
  }

  bulkUpdateRates(percentageChange: number, category?: string): void {
    const items = this.getGlossary();
    const multiplier = 1 + percentageChange / 100;
    const updated = items.map((item) => {
      if (!category || category === 'All' || item.category === category) {
        return {
          ...item,
          defaultRatePaise: Math.round(item.defaultRatePaise * multiplier),
        };
      }
      return item;
    });
    safeSave(STORAGE_KEYS.GLOSSARY, updated);
  }

  // Item Bundles
  getBundles(): ItemBundle[] {
    const bundles = safeLoad<ItemBundle[]>(STORAGE_KEYS.BUNDLES, []);
    if (!bundles || bundles.length === 0) {
      safeSave(STORAGE_KEYS.BUNDLES, STARTER_BUNDLES);
      return STARTER_BUNDLES;
    }
    return bundles;
  }

  saveBundle(bundle: ItemBundle): void {
    const bundles = this.getBundles();
    const idx = bundles.findIndex((b) => b.id === bundle.id);
    if (idx >= 0) {
      bundles[idx] = bundle;
    } else {
      bundles.unshift(bundle);
    }
    safeSave(STORAGE_KEYS.BUNDLES, bundles);
  }

  // Customers
  getCustomers(): Customer[] {
    const customers = safeLoad<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    if (!customers || customers.length === 0) {
      safeSave(STORAGE_KEYS.CUSTOMERS, STARTER_CUSTOMERS);
      return STARTER_CUSTOMERS;
    }
    return customers;
  }

  saveCustomer(customer: Customer): Customer {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      customers[idx] = customer;
    } else {
      customers.unshift(customer);
    }
    safeSave(STORAGE_KEYS.CUSTOMERS, customers);
    return customer;
  }

  deleteCustomer(id: string): void {
    const customers = this.getCustomers().filter((c) => c.id !== id);
    safeSave(STORAGE_KEYS.CUSTOMERS, customers);
  }

  // Documents
  getDocuments(): QuotationBillDocument[] {
    const docs = safeLoad<QuotationBillDocument[]>(STORAGE_KEYS.DOCUMENTS, []);
    if (!docs || docs.length === 0) {
      // Seed sample initial quotation and invoice
      const initialDocs = this.seedInitialDocuments();
      safeSave(STORAGE_KEYS.DOCUMENTS, initialDocs);
      return initialDocs;
    }
    let modified = false;
    docs.forEach((d) => {
      if (d.formatId === 'format-modern-sky') {
        d.formatId = 'format-phd-contractor';
        modified = true;
      }
    });
    if (modified) {
      safeSave(STORAGE_KEYS.DOCUMENTS, docs);
    }
    return docs;
  }

  saveDocument(doc: QuotationBillDocument): void {
    const docs = this.getDocuments();
    const idx = docs.findIndex((d) => d.id === doc.id);
    const updatedDoc = {
      ...doc,
      updatedAt: Date.now(),
    };
    if (idx >= 0) {
      docs[idx] = updatedDoc;
    } else {
      docs.unshift(updatedDoc);
    }
    safeSave(STORAGE_KEYS.DOCUMENTS, docs);
  }

  deleteDocument(id: string): void {
    const docs = this.getDocuments().filter((d) => d.id !== id);
    safeSave(STORAGE_KEYS.DOCUMENTS, docs);
  }

  // Undo delete support for document lines
  setUndoLine(documentId: string, line: DocumentLine): void {
    this.undoDeletedLine = { documentId, line };
  }

  getUndoLine(): { documentId: string; line: DocumentLine } | null {
    return this.undoDeletedLine;
  }

  clearUndoLine(): void {
    this.undoDeletedLine = null;
  }

  // Last-used rate and quantity memory
  rememberLineUsage(itemName: string, ratePaise: number, quantity: number): void {
    const history = safeLoad<Record<string, { ratePaise: number; quantity: number }>>(
      STORAGE_KEYS.LAST_RATES,
      {}
    );
    history[itemName.toLowerCase()] = { ratePaise, quantity };
    safeSave(STORAGE_KEYS.LAST_RATES, history);
  }

  getLastUsed(itemName: string): { ratePaise: number; quantity: number } | null {
    const history = safeLoad<Record<string, { ratePaise: number; quantity: number }>>(
      STORAGE_KEYS.LAST_RATES,
      {}
    );
    return history[itemName.toLowerCase()] || null;
  }

  // Backup & Restore
  exportBackupJSON(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      formats: this.getFormats(),
      glossary: this.getGlossary(),
      bundles: this.getBundles(),
      customers: this.getCustomers(),
      documents: this.getDocuments(),
    };
    return JSON.stringify(data, null, 2);
  }

  restoreBackupJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.saveProfile(data.profile);
      if (Array.isArray(data.formats)) safeSave(STORAGE_KEYS.FORMATS, data.formats);
      if (Array.isArray(data.glossary)) safeSave(STORAGE_KEYS.GLOSSARY, data.glossary);
      if (Array.isArray(data.bundles)) safeSave(STORAGE_KEYS.BUNDLES, data.bundles);
      if (Array.isArray(data.customers)) safeSave(STORAGE_KEYS.CUSTOMERS, data.customers);
      if (Array.isArray(data.documents)) safeSave(STORAGE_KEYS.DOCUMENTS, data.documents);
      return true;
    } catch (err) {
      console.error('Failed to restore backup', err);
      return false;
    }
  }

  // Seed sample initial documents
  private seedInitialDocuments(): QuotationBillDocument[] {
    const sampleCustomer = STARTER_CUSTOMERS[0];
    const sampleCustomer2 = STARTER_CUSTOMERS[1];

    const doc1: QuotationBillDocument = {
      id: 'doc-seed-1',
      type: 'quotation',
      number: 'PR-QT-0001',
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
      customerId: sampleCustomer.id,
      customerSnapshot: sampleCustomer,
      formatId: 'format-phd-contractor',
      status: 'sent',
      lines: [
        {
          id: 'line-p1',
          name: 'B Block P.H.D. Work',
          sizeSpec: 'The project completed PH.D. and pipeline work for 32 flats, including rainwater and demo flat fittings.',
          unit: 'Job',
          quantity: 1,
          ratePaise: 11800000, // ₹1,18,000
          taxRate: 0,
          lineTotalPaise: 11800000,
        },
        {
          id: 'line-p2',
          name: 'C Block P.H.D. Work',
          sizeSpec: 'Inner waterline wiring complete for 16 flats across first and second floor Progress: Approx. 30%',
          unit: 'Nos',
          quantity: 16,
          ratePaise: 250000, // ₹2,500
          taxRate: 0,
          lineTotalPaise: 4000000, // ₹40,000
        },
      ],
      discountType: 'fixed',
      discountValue: 0,
      isTaxEnabled: false,
      isInterState: false,
      isPriceTaxInclusive: false,
      notes: 'All pipeline laying and testing carried out as per P.H.D standards.',
      advancePaidPaise: 1400000, // ₹14,000
      payments: [],
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000 * 2,
    };

    const doc2: QuotationBillDocument = {
      id: 'doc-seed-2',
      type: 'bill',
      number: 'INV-2026-0001',
      date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
      customerId: sampleCustomer2.id,
      customerSnapshot: sampleCustomer2,
      formatId: 'format-classic-contractor',
      status: 'partial',
      lines: [
        {
          id: 'line-b1',
          name: 'Single Lever Basin Mixer (Hot & Cold)',
          sizeSpec: 'With 450mm Braided Hoses',
          unit: 'Nos',
          quantity: 2,
          ratePaise: 215000,
          taxRate: 18,
          lineTotalPaise: 430000,
        },
        {
          id: 'line-b2',
          name: 'Wash Basin with Half / Full Pedestal',
          sizeSpec: '550 x 400 mm Ceramic',
          unit: 'Set',
          quantity: 2,
          ratePaise: 220000,
          taxRate: 18,
          lineTotalPaise: 440000,
        },
        {
          id: 'line-b3',
          name: 'Wash Basin & Waste Pipe Fitting Labour',
          sizeSpec: 'Bracket mounting & testing',
          unit: 'Nos',
          quantity: 2,
          ratePaise: 40000,
          taxRate: 18,
          lineTotalPaise: 80000,
        },
      ],
      discountType: 'fixed',
      discountValue: 500, // ₹500
      isTaxEnabled: true,
      isInterState: false,
      isPriceTaxInclusive: false,
      notes: 'Fittings installed and water pressure tested in Clinic room 1 & 2.',
      advancePaidPaise: 500000, // ₹5,000
      payments: [
        {
          id: 'pay-1',
          billId: 'doc-seed-2',
          date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
          amountPaise: 300000, // ₹3,000 via UPI
          mode: 'upi',
          transactionRef: 'UPI/2390184712',
          note: 'Part payment via GPay',
          recordedAt: Date.now() - 86400000 * 3,
        },
      ],
      createdAt: Date.now() - 86400000 * 4,
      updatedAt: Date.now() - 86400000 * 3,
    };

    return [doc1, doc2];
  }
}

export const storage = new StorageService();
