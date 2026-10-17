import { DocumentCalculations, DocumentLine, Payment } from '../types';
import { numberToIndianWords } from './numberToWords';

export interface CalculationInput {
  lines: DocumentLine[];
  discountType: 'percentage' | 'fixed';
  discountValue: number; // percentage (e.g. 5 for 5%) or rupees (e.g. 500 for ₹500)
  isTaxEnabled: boolean;
  isInterState: boolean;
  isPriceTaxInclusive: boolean;
  advancePaidPaise: number;
  payments: Payment[];
}

/**
 * Calculates document financial totals using pure integer paise arithmetic.
 */
export function calculateDocumentTotals(input: CalculationInput): DocumentCalculations {
  const {
    lines,
    discountType,
    discountValue,
    isTaxEnabled,
    isInterState,
    isPriceTaxInclusive,
    advancePaidPaise,
    payments,
  } = input;

  // 1. Calculate raw line totals
  let rawSubtotalPaise = 0;
  const processedLines = lines.map((line) => {
    let lineTotalPaise = 0;
    if (isPriceTaxInclusive && isTaxEnabled && line.taxRate > 0) {
      // If entered price already includes tax, extract base rate
      // BaseRate = GrossRate / (1 + taxRate/100)
      const grossPaise = Math.round(line.quantity * line.ratePaise);
      lineTotalPaise = Math.round(grossPaise / (1 + line.taxRate / 100));
    } else {
      lineTotalPaise = Math.round(line.quantity * line.ratePaise);
    }
    rawSubtotalPaise += lineTotalPaise;
    return {
      ...line,
      lineTotalPaise,
    };
  });

  // 2. Calculate document discount
  let discountPaise = 0;
  if (discountValue > 0) {
    if (discountType === 'percentage') {
      discountPaise = Math.round((rawSubtotalPaise * discountValue) / 100);
    } else {
      // Fixed discount given in Rupees -> convert to paise
      discountPaise = Math.min(rawSubtotalPaise, Math.round(discountValue * 100));
    }
  }

  // 3. Taxable value
  const taxableValuePaise = Math.max(0, rawSubtotalPaise - discountPaise);

  // 4. GST calculation
  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;
  let totalTaxPaise = 0;

  if (isTaxEnabled && rawSubtotalPaise > 0) {
    // Apportion discount proportionately across lines for exact line-tax calculations
    const discountRatio = discountPaise / rawSubtotalPaise;

    for (const line of processedLines) {
      if (line.taxRate > 0) {
        const lineTaxablePaise = line.lineTotalPaise * (1 - discountRatio);
        const lineGstPaise = Math.round((lineTaxablePaise * line.taxRate) / 100);
        totalTaxPaise += lineGstPaise;
      }
    }

    if (isInterState) {
      igstPaise = totalTaxPaise;
    } else {
      // Split evenly into CGST and SGST
      cgstPaise = Math.floor(totalTaxPaise / 2);
      sgstPaise = totalTaxPaise - cgstPaise; // avoids loss of 1 paisa
    }
  }

  // 5. Raw grand total and round-off
  const exactGrandTotalPaise = taxableValuePaise + totalTaxPaise;
  // Round to nearest 100 paise (nearest ₹1)
  const remainderPaise = exactGrandTotalPaise % 100;
  let roundOffPaise = 0;

  if (remainderPaise !== 0) {
    if (remainderPaise < 50) {
      roundOffPaise = -remainderPaise; // round down
    } else {
      roundOffPaise = 100 - remainderPaise; // round up
    }
  }

  const grandTotalPaise = exactGrandTotalPaise + roundOffPaise;

  // 6. Payments and Balance Due
  const totalRecordedPaymentsPaise = payments.reduce((acc, p) => acc + p.amountPaise, 0);
  const totalPaidPaise = advancePaidPaise + totalRecordedPaymentsPaise;
  const balanceDuePaise = Math.max(0, grandTotalPaise - totalPaidPaise);

  const amountInWords = numberToIndianWords(grandTotalPaise);

  return {
    subtotalPaise: rawSubtotalPaise,
    discountPaise,
    taxableValuePaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    totalTaxPaise,
    roundOffPaise,
    grandTotalPaise,
    totalPaidPaise,
    balanceDuePaise,
    amountInWords,
  };
}
