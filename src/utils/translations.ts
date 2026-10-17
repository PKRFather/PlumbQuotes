import { LanguageCode } from '../types';

export interface DocumentLabels {
  quotationTitle: string;
  billTitle: string;
  quotationNo: string;
  billNo: string;
  date: string;
  validUntil: string;
  billTo: string;
  siteAddress: string;
  phone: string;
  gstin: string;
  sno: string;
  itemDescription: string;
  sizeSpec: string;
  qty: string;
  unit: string;
  rate: string;
  tax: string;
  amount: string;
  subtotal: string;
  discount: string;
  taxableValue: string;
  cgst: string;
  sgst: string;
  igst: string;
  roundOff: string;
  grandTotal: string;
  advancePaid: string;
  balanceDue: string;
  amountInWords: string;
  bankDetails: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  upiId: string;
  scanToPay: string;
  termsTitle: string;
  authorizedSignatory: string;
  customerSignature: string;
  thankYouMessage: string;
}

export const documentTranslations: Record<LanguageCode, DocumentLabels> = {
  en: {
    quotationTitle: 'PLUMBING ESTIMATE / QUOTATION',
    billTitle: 'TAX INVOICE / CASH BILL',
    quotationNo: 'Quotation No:',
    billNo: 'Invoice No:',
    date: 'Date:',
    validUntil: 'Valid Until:',
    billTo: 'Customer Details:',
    siteAddress: 'Work Site Address:',
    phone: 'Phone:',
    gstin: 'GSTIN:',
    sno: 'S.No',
    itemDescription: 'Item Description & Work Details',
    sizeSpec: 'Size / Spec',
    qty: 'Qty',
    unit: 'Unit',
    rate: 'Rate (₹)',
    tax: 'GST',
    amount: 'Amount (₹)',
    subtotal: 'Subtotal:',
    discount: 'Discount:',
    taxableValue: 'Taxable Value:',
    cgst: 'CGST:',
    sgst: 'SGST:',
    igst: 'IGST:',
    roundOff: 'Round Off:',
    grandTotal: 'Grand Total:',
    advancePaid: 'Advance Paid:',
    balanceDue: 'Balance Due:',
    amountInWords: 'Amount in Words:',
    bankDetails: 'Bank & UPI Payment Details',
    bankName: 'Bank Name:',
    accountNo: 'A/C Number:',
    ifsc: 'IFSC Code:',
    upiId: 'UPI ID:',
    scanToPay: 'Scan UPI QR to Pay',
    termsTitle: 'Terms & Conditions',
    authorizedSignatory: 'Authorized Signatory',
    customerSignature: 'Customer Signature',
    thankYouMessage: 'Thank you for your business! Quality plumbing guaranteed.',
  },
  hi: {
    quotationTitle: 'प्लंबिंग कोटेशन / अनुमान पत्र',
    billTitle: 'कर इनवॉइस / पक्का बिल',
    quotationNo: 'कोटेशन संख्या:',
    billNo: 'बिल संख्या:',
    date: 'दिनांक:',
    validUntil: 'वैधता तिथि:',
    billTo: 'ग्राहक का विवरण:',
    siteAddress: 'कार्य स्थल का पता:',
    phone: 'फ़ोन नंबर:',
    gstin: 'जीएसटी नंबर:',
    sno: 'क्र.',
    itemDescription: 'सामग्री एवं प्लंबिंग कार्य विवरण',
    sizeSpec: 'माप / साइज',
    qty: 'मात्रा',
    unit: 'इकाई',
    rate: 'दर (₹)',
    tax: 'जीएसटी',
    amount: 'रकम (₹)',
    subtotal: 'उप-योग:',
    discount: 'छूट:',
    taxableValue: 'कर योग्य मूल्य:',
    cgst: 'सी.जी.एस.टी:',
    sgst: 'एस.जी.एस.टी:',
    igst: 'आई.जी.एस.टी:',
    roundOff: 'राउंड ऑफ:',
    grandTotal: 'कुल देय राशि:',
    advancePaid: 'अग्रिम भुगतान:',
    balanceDue: 'बकाया राशि:',
    amountInWords: 'शब्दों में राशि:',
    bankDetails: 'बैंक एवं यूपीआई भुगतान विवरण',
    bankName: 'बैंक का नाम:',
    accountNo: 'खाता संख्या:',
    ifsc: 'आईएफएससी कोड:',
    upiId: 'यूपीआई आईडी:',
    scanToPay: 'भुगतान हेतु यूपीआई क्यूआर स्कैन करें',
    termsTitle: 'नियम एवं शर्तें',
    authorizedSignatory: 'अधिकृत हस्ताक्षरकर्ता',
    customerSignature: 'ग्राहक के हस्ताक्षर',
    thankYouMessage: 'आपके विश्वास और काम के लिए धन्यवाद! उत्तम प्लंबिंग सेवा हमारी पहचान।',
  },
  or: {
    quotationTitle: 'ପ୍ଲମ୍ବିଂ କୋଟେସନ୍ / ଅଟକଳ ପତ୍ର',
    billTitle: 'ଟ୍ୟାକ୍ସ ଇନଭଏସ / ପକ୍କା ବିଲ୍',
    quotationNo: 'କୋଟେସନ୍ ନଂ:',
    billNo: 'ବିଲ୍ ନଂ:',
    date: 'ତାରିଖ:',
    validUntil: 'ବୈଧତା ତାରିଖ:',
    billTo: 'ଗ୍ରାହକଙ୍କ ବିବରଣୀ:',
    siteAddress: 'କାର୍ଯ୍ୟ ସ୍ଥଳ ଠିକଣା:',
    phone: 'ଫୋନ୍ ନଂ:',
    gstin: 'ଜିଏସଟି ନଂ:',
    sno: 'କ୍ରମିକ',
    itemDescription: 'ସାମଗ୍ରୀ ଓ କାର୍ଯ୍ୟର ବିବରଣୀ',
    sizeSpec: 'ମାପ / ସାଇଜ୍',
    qty: 'ପରିମାଣ',
    unit: 'ୟୁନିଟ୍',
    rate: 'ଦର (₹)',
    tax: 'ଜିଏସଟି',
    amount: 'ଟଙ୍କା (₹)',
    subtotal: 'ସମୁଦାୟ ଦର:',
    discount: 'ରିହାତି:',
    taxableValue: 'କରଯୋଗ୍ୟ ମୂଲ୍ୟ:',
    cgst: 'ସି.ଜି.ଏସ.ଟି:',
    sgst: 'ଏସ.ଜି.ଏସ.ଟି:',
    igst: 'ଆଇ.ଜି.ଏସ.ଟି:',
    roundOff: 'ରାଉଣ୍ଡ ଅଫ୍:',
    grandTotal: 'ସର୍ବମୋଟ ରାଶି:',
    advancePaid: 'ଅଗ୍ରୀମ ପ୍ରଦତ୍ତ:',
    balanceDue: 'ବାକି ରାଶି:',
    amountInWords: 'ଅକ୍ଷରରେ ରାଶି:',
    bankDetails: 'ବ୍ୟାଙ୍କ ଓ ୟୁପିଆଇ ବିବରଣୀ',
    bankName: 'ବ୍ୟାଙ୍କ ନାମ:',
    accountNo: 'ଖାତା ନଂ:',
    ifsc: 'ଆଇଏଫଏସସି କୋଡ୍:',
    upiId: 'ୟୁପିଆଇ ଆଇଡି:',
    scanToPay: 'ୟୁପିଆଇ କ୍ୟୁଆର ସ୍କାନ୍ କରି ପୈଠ କରନ୍ତୁ',
    termsTitle: 'ନିୟମାବଳୀ ଓ ସର୍ତ୍ତାବଳୀ',
    authorizedSignatory: 'ଅଧିକୃତ ଦସ୍ତଖତ',
    customerSignature: 'ଗ୍ରାହକଙ୍କ ଦସ୍ତଖତ',
    thankYouMessage: 'ଆପଣଙ୍କର ସହଯୋଗ ପାଇଁ ଧନ୍ୟବାଦ! ବିଶ୍ୱସ୍ତ ପ୍ଲମ୍ବିଂ ସେବା।',
  },
};
