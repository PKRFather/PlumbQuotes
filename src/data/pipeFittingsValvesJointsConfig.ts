/**
 * TypeScript configuration & loader for Pipe Fittings, Valves, and Joints
 * Derived from:
 * 1. Panam Engineers Pipe Fittings & Valves Catalog (https://www.panamengineers.com/ppdf/pipe%20fittings%20-%20pdf.pdf)
 * 2. Vocational Plumbing Standards (NCERT Class IX & Indian Plumbing Skills Council IPSC)
 *
 * Implements multi-variant architecture: items (such as Elbow 90°) have dynamic dropdowns
 * for "Size" (1/4" to 4") and "Type" (CPVC, UPVC, Brass, SS 316, SS 304, GI, PVC SWR, PPR),
 * automatically calculating prices in real-time.
 */

import { GlossaryItem, UnitType } from '../types';
import rawConfig from './pipeFittingsValvesJointsGlossary.json';
import {
  PANAM_FITTINGS_VALVES_JOINTS_CATALOG,
  getPanamGlossaryItems,
  PanamItemSpecification,
} from './panamPipeFittingsValvesJointsConfig';
import {
  generateVariantMatrix,
  getVariantPricePaise,
  STANDARD_MATERIALS,
  STANDARD_SIZES,
} from '../utils/variantPricing';

export interface FittingItemConfig {
  code: string;
  name: string;
  category: string;
  subcategory: string;
  function: string;
  specifications?: Record<string, string>;
  standardSizes: string[];
  materials: string[];
  unit: UnitType;
  defaultRatePaise: number;
  taxRate: number;
  notes: string;
}

export interface PipeClampSpacing {
  diameterMm: number;
  diameterInch: string;
  horizontalSpacingMeters: number;
  verticalSpacingMeters: number;
  mortarRatio: string;
  wallClearanceCm: number;
}

export interface TechnicalTerm {
  term: string;
  definition: string;
}

export interface PlumbingGlossaryConfiguration {
  title: string;
  description: string;
  version: string;
  lastUpdated: string;
  categories: {
    id: string;
    name: string;
    description: string;
    items: FittingItemConfig[];
  }[];
  pipeClampSpacingGuidelines: PipeClampSpacing[];
  technicalVocabulary: TechnicalTerm[];
}

export const PIPE_FITTINGS_VALVES_JOINTS_CONFIG = rawConfig as unknown as PlumbingGlossaryConfiguration;

export { PANAM_FITTINGS_VALVES_JOINTS_CATALOG, getPanamGlossaryItems };
export type { PanamItemSpecification };

/**
 * Transforms NCERT & IPSC configuration items into active application GlossaryItem objects
 * with dynamic variant matrices enabled where applicable.
 */
export function getStandardGlossaryItemsFromConfig(): GlossaryItem[] {
  const items: GlossaryItem[] = [];

  PIPE_FITTINGS_VALVES_JOINTS_CONFIG.categories.forEach((cat) => {
    cat.items.forEach((item) => {
      const defaultMat = item.materials[0] || 'CPVC';
      const defaultSz = item.standardSizes.includes('3/4"') || item.standardSizes.includes('3/4 inch')
        ? '3/4 inch'
        : item.standardSizes[0] || '3/4 inch';

      const hasMultipleVariants = item.materials.length > 1 || item.standardSizes.length > 1;

      const matrix = hasMultipleVariants
        ? generateVariantMatrix(item.defaultRatePaise, item.materials, item.standardSizes)
        : undefined;

      items.push({
        id: `config-${item.code.toLowerCase()}`,
        name: item.name,
        category: item.category,
        sizeSpec: `${defaultSz} (${defaultMat})`,
        unit: item.unit,
        defaultRatePaise: item.defaultRatePaise,
        taxRate: item.taxRate,
        active: true,
        hasVariants: hasMultipleVariants,
        availableMaterials: item.materials,
        availableSizes: item.standardSizes,
        variantPrices: matrix,
        notes: `${item.function} — ${item.notes}`,
      });
    });
  });

  return items;
}

/**
 * Merges both Panam Engineers and Vocational standards into one master list
 */
export function getAllConfigGlossaryItems(): GlossaryItem[] {
  const panamItems = getPanamGlossaryItems();
  const standardItems = getStandardGlossaryItemsFromConfig();

  const map = new Map<string, GlossaryItem>();
  panamItems.forEach((it) => map.set(it.name.toLowerCase(), it));
  standardItems.forEach((it) => {
    if (!map.has(it.name.toLowerCase())) {
      map.set(it.name.toLowerCase(), it);
    }
  });

  return Array.from(map.values());
}
