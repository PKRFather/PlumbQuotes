/**
 * Converts Indian Rupee amounts into words using the Indian numbering system
 * (Crores, Lakhs, Thousands, Hundreds, Units, Paise).
 */

const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertBelowThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += tens[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ones[n] + ' ';
  }
  return str.trim();
}

/**
 * Converts amount in paise to Indian words string
 * e.g., 1425000 paise (= 14,250 INR) -> "Rupees Fourteen Thousand Two Hundred Fifty Only"
 */
export function numberToIndianWords(amountPaise: number): string {
  if (amountPaise <= 0) {
    return 'Rupees Zero Only';
  }

  const totalRupees = Math.floor(amountPaise / 100);
  const paise = amountPaise % 100;

  let crore = Math.floor(totalRupees / 10000000);
  let rem = totalRupees % 10000000;

  let lakh = Math.floor(rem / 100000);
  rem = rem % 100000;

  let thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  let hundredPart = rem;

  let words = '';

  if (crore > 0) {
    words += convertBelowThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertBelowThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertBelowThousand(thousand) + ' Thousand ';
  }
  if (hundredPart > 0) {
    words += convertBelowThousand(hundredPart) + ' ';
  }

  words = words.trim();
  if (!words) {
    words = 'Zero';
  }

  let result = `Rupees ${words}`;

  if (paise > 0) {
    result += ` and ${convertBelowThousand(paise)} Paise`;
  }

  result += ' Only';
  return result;
}

export function formatINR(amountPaise: number): string {
  const isNegative = amountPaise < 0;
  const absPaise = Math.abs(amountPaise);
  const rupees = absPaise / 100;

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatINRWithoutSymbol(amountPaise: number): string {
  const rupees = Math.abs(amountPaise) / 100;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}
