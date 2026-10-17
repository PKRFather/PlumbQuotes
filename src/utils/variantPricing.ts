import { GlossaryItem, ItemVariantPrice } from '../types';

export const STANDARD_MATERIALS = [
  'CPVC',
  'UPVC',
  'Brass',
  'GI',
  'SS 304',
  'SS 316',
  'Carbon Steel',
  'PVC SWR',
  'PVC Agri',
  'PPR',
  'HDPE',
  'Copper',
  'Cast Iron',
] as const;

export const STANDARD_SIZES = [
  '1/4 inch',
  '3/8 inch',
  '1/2 inch',
  '3/4 inch',
  '1 inch',
  '1.25 inch',
  '1.5 inch',
  '2 inch',
  '2.5 inch',
  '3 inch',
  '4 inch',
  '6 inch',
] as const;

// Base material relative cost factors (normalized around CPVC = 1.0)
export const MATERIAL_FACTORS: Record<string, number> = {
  CPVC: 1.0,
  UPVC: 0.72,
  'PVC SWR': 0.65,
  'PVC Agri': 0.58,
  PPR: 1.12,
  GI: 1.85,
  Brass: 3.8,
  'SS 304': 4.5,
  'SS 316': 6.2, // Panam Engineers precision instrumentation standard
  'Carbon Steel': 2.4, // ASTM A105 forged steel
  Copper: 5.5,
  'Cast Iron': 1.6,
  HDPE: 0.95,
};

// Base size relative cost factors (normalized around 3/4 inch = 1.0)
export const SIZE_FACTORS: Record<string, number> = {
  '1/4 inch': 0.65,
  '3/8 inch': 0.70,
  '1/2 inch': 0.78,
  '3/4 inch': 1.0,
  '1 inch': 1.48,
  '1.25 inch': 1.95,
  '1.5 inch': 2.55,
  '2 inch': 3.75,
  '2.5 inch': 5.2,
  '3 inch': 7.1,
  '4 inch': 11.8,
  '6 inch': 22.5,
};

/**
 * Normalizes size string to standard format (e.g. '3/4"' -> '3/4 inch')
 */
export function normalizeSize(size: string): string {
  if (!size) return '3/4 inch';
  const clean = size.trim().toLowerCase();
  if (clean === '1/4' || clean === '1/4"' || clean === '1/4 inch') return '1/4 inch';
  if (clean === '3/8' || clean === '3/8"' || clean === '3/8 inch') return '3/8 inch';
  if (clean === '1/2' || clean === '1/2"' || clean === '1/2 inch' || clean === '15mm') return '1/2 inch';
  if (clean === '3/4' || clean === '3/4"' || clean === '3/4 inch' || clean === '20mm' || clean === '3/4th') return '3/4 inch';
  if (clean === '1' || clean === '1"' || clean === '1 inch' || clean === '25mm') return '1 inch';
  if (clean === '1.25' || clean === '1 1/4"' || clean === '1.25 inch' || clean === '32mm') return '1.25 inch';
  if (clean === '1.5' || clean === '1 1/2"' || clean === '1.5 inch' || clean === '40mm') return '1.5 inch';
  if (clean === '2' || clean === '2"' || clean === '2 inch' || clean === '50mm') return '2 inch';
  if (clean === '2.5' || clean === '2 1/2"' || clean === '2.5 inch' || clean === '65mm') return '2.5 inch';
  if (clean === '3' || clean === '3"' || clean === '3 inch' || clean === '75mm' || clean === '80mm') return '3 inch';
  if (clean === '4' || clean === '4"' || clean === '4 inch' || clean === '110mm' || clean === '100mm') return '4 inch';
  if (clean === '6' || clean === '6"' || clean === '6 inch' || clean === '160mm') return '6 inch';
  return size;
}

/**
 * Returns the price in paise for an item given its material and size.
 * If an explicit variant price is stored, it returns that.
 * Otherwise, it applies standard market scaling factors.
 */
export function getVariantPricePaise(
  item: GlossaryItem,
  material: string,
  size: string
): number {
  const normSize = normalizeSize(size);
  const cleanMat = material.trim();

  // 1. Check for exact variant in item's variantPrices
  if (item.variantPrices && item.variantPrices.length > 0) {
    const match = item.variantPrices.find(
      (v) =>
        v.material.toLowerCase() === cleanMat.toLowerCase() &&
        (normalizeSize(v.size) === normSize || v.size.toLowerCase() === cleanMat.toLowerCase())
    );
    if (match) {
      return match.ratePaise;
    }

    // Check by size if matching material is found
    const matchByMaterial = item.variantPrices.find(
      (v) => v.material.toLowerCase() === cleanMat.toLowerCase()
    );
    if (matchByMaterial) {
      const sizeMultiplier =
        (SIZE_FACTORS[normSize] || 1.0) / (SIZE_FACTORS[normalizeSize(matchByMaterial.size)] || 1.0);
      return Math.round(matchByMaterial.ratePaise * sizeMultiplier);
    }
  }

  // 2. Fallback to base rate scaled by material and size factor
  const baseRate = item.defaultRatePaise > 0 ? item.defaultRatePaise : 3200;
  const matFactor = MATERIAL_FACTORS[cleanMat] || 1.0;
  const szFactor = SIZE_FACTORS[normSize] || 1.0;

  return Math.round(baseRate * matFactor * szFactor);
}

/**
 * Generates an exhaustive variant price matrix for a base plumbing item
 */
export function generateVariantMatrix(
  baseRate3_4CPVCPaise: number,
  materials: string[] = ['CPVC', 'UPVC', 'Brass', 'GI', 'SS 304', 'SS 316', 'PVC SWR'],
  sizes: string[] = ['1/2 inch', '3/4 inch', '1 inch', '1.25 inch', '1.5 inch', '2 inch', '3 inch', '4 inch']
): ItemVariantPrice[] {
  const list: ItemVariantPrice[] = [];

  for (const mat of materials) {
    const mFactor = MATERIAL_FACTORS[mat] || 1.0;
    for (const sz of sizes) {
      const normSz = normalizeSize(sz);
      const sFactor = SIZE_FACTORS[normSz] || 1.0;
      const ratePaise = Math.round(baseRate3_4CPVCPaise * mFactor * sFactor);
      list.push({
        material: mat,
        size: normSz,
        ratePaise,
      });
    }
  }

  return list;
}
