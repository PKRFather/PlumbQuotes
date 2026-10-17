import { GlossaryItem } from '../types';
import { generateVariantMatrix } from '../utils/variantPricing';

export const STARTER_GLOSSARY_ITEMS: Omit<GlossaryItem, 'id'>[] = [
  // 1. DYNAMIC MULTI-VARIANT FITTINGS (Size & Type Dropdowns with Instant Price Change)
  {
    category: 'Fittings',
    name: 'Elbow 90°',
    sizeSpec: '3/4 inch (CPVC)',
    unit: 'Nos',
    defaultRatePaise: 3200, // ₹32 for 3/4" CPVC
    taxRate: 18,
    active: true,
    hasVariants: true,
    availableMaterials: ['CPVC', 'UPVC', 'Brass', 'GI', 'SS 304', 'PVC SWR', 'PPR'],
    availableSizes: [
      '1/2 inch',
      '3/4 inch',
      '1 inch',
      '1.25 inch',
      '1.5 inch',
      '2 inch',
      '2.5 inch',
      '3 inch',
      '4 inch',
    ],
    variantPrices: [
      // CPVC
      { material: 'CPVC', size: '1/2 inch', ratePaise: 2500 }, // ₹25
      { material: 'CPVC', size: '3/4 inch', ratePaise: 3200 }, // ₹32
      { material: 'CPVC', size: '1 inch', ratePaise: 4800 },   // ₹48
      { material: 'CPVC', size: '1.25 inch', ratePaise: 6800 }, // ₹68
      { material: 'CPVC', size: '1.5 inch', ratePaise: 9500 },  // ₹95
      { material: 'CPVC', size: '2 inch', ratePaise: 16500 },  // ₹165
      { material: 'CPVC', size: '2.5 inch', ratePaise: 28000 },
      { material: 'CPVC', size: '3 inch', ratePaise: 42000 },
      { material: 'CPVC', size: '4 inch', ratePaise: 75000 },

      // UPVC (Schedule 40/80 - more economical)
      { material: 'UPVC', size: '1/2 inch', ratePaise: 1800 }, // ₹18
      { material: 'UPVC', size: '3/4 inch', ratePaise: 2400 }, // ₹24
      { material: 'UPVC', size: '1 inch', ratePaise: 3600 },   // ₹36
      { material: 'UPVC', size: '1.25 inch', ratePaise: 5200 },
      { material: 'UPVC', size: '1.5 inch', ratePaise: 7200 },
      { material: 'UPVC', size: '2 inch', ratePaise: 12500 },
      { material: 'UPVC', size: '2.5 inch', ratePaise: 21000 },
      { material: 'UPVC', size: '3 inch', ratePaise: 32000 },
      { material: 'UPVC', size: '4 inch', ratePaise: 55000 },

      // Brass (Heavy plumbing grade)
      { material: 'Brass', size: '1/2 inch', ratePaise: 9500 },  // ₹95
      { material: 'Brass', size: '3/4 inch', ratePaise: 14500 }, // ₹145
      { material: 'Brass', size: '1 inch', ratePaise: 22500 },   // ₹225
      { material: 'Brass', size: '1.25 inch', ratePaise: 36000 },
      { material: 'Brass', size: '1.5 inch', ratePaise: 52000 },
      { material: 'Brass', size: '2 inch', ratePaise: 85000 },

      // GI (Class B Malleable Iron)
      { material: 'GI', size: '1/2 inch', ratePaise: 4200 }, // ₹42
      { material: 'GI', size: '3/4 inch', ratePaise: 5800 }, // ₹58
      { material: 'GI', size: '1 inch', ratePaise: 8800 },   // ₹88
      { material: 'GI', size: '1.25 inch', ratePaise: 13500 },
      { material: 'GI', size: '1.5 inch', ratePaise: 18500 },
      { material: 'GI', size: '2 inch', ratePaise: 29500 },

      // SS 304 (Stainless Steel - Panam Engineers style high spec)
      { material: 'SS 304', size: '1/2 inch', ratePaise: 14500 },
      { material: 'SS 304', size: '3/4 inch', ratePaise: 21000 },
      { material: 'SS 304', size: '1 inch', ratePaise: 34000 },
      { material: 'SS 304', size: '1.25 inch', ratePaise: 52000 },
      { material: 'SS 304', size: '1.5 inch', ratePaise: 74000 },
      { material: 'SS 304', size: '2 inch', ratePaise: 120000 },

      // PVC SWR (Soil, Waste & Rainwater)
      { material: 'PVC SWR', size: '2.5 inch', ratePaise: 16500 },
      { material: 'PVC SWR', size: '3 inch', ratePaise: 22000 },
      { material: 'PVC SWR', size: '4 inch', ratePaise: 34000 },
    ],
    notes: '90° Directional bend. Selecting Type or Size automatically recalibrates prices.',
  },
  {
    category: 'Fittings',
    name: 'Equal Tee',
    sizeSpec: '3/4 inch (CPVC)',
    unit: 'Nos',
    defaultRatePaise: 4200, // ₹42 for 3/4" CPVC
    taxRate: 18,
    active: true,
    hasVariants: true,
    availableMaterials: ['CPVC', 'UPVC', 'Brass', 'GI', 'SS 304', 'PVC SWR'],
    availableSizes: [
      '1/2 inch',
      '3/4 inch',
      '1 inch',
      '1.25 inch',
      '1.5 inch',
      '2 inch',
      '2.5 inch',
      '3 inch',
      '4 inch',
    ],
    variantPrices: [
      { material: 'CPVC', size: '1/2 inch', ratePaise: 3200 },
      { material: 'CPVC', size: '3/4 inch', ratePaise: 4200 },
      { material: 'CPVC', size: '1 inch', ratePaise: 6500 },
      { material: 'CPVC', size: '1.25 inch', ratePaise: 9200 },
      { material: 'CPVC', size: '1.5 inch', ratePaise: 13500 },
      { material: 'CPVC', size: '2 inch', ratePaise: 22000 },

      { material: 'UPVC', size: '1/2 inch', ratePaise: 2400 },
      { material: 'UPVC', size: '3/4 inch', ratePaise: 3100 },
      { material: 'UPVC', size: '1 inch', ratePaise: 4800 },
      { material: 'UPVC', size: '1.25 inch', ratePaise: 6800 },
      { material: 'UPVC', size: '1.5 inch', ratePaise: 9800 },
      { material: 'UPVC', size: '2 inch', ratePaise: 16000 },

      { material: 'Brass', size: '1/2 inch', ratePaise: 12500 },
      { material: 'Brass', size: '3/4 inch', ratePaise: 18500 },
      { material: 'Brass', size: '1 inch', ratePaise: 28500 },

      { material: 'GI', size: '1/2 inch', ratePaise: 5400 },
      { material: 'GI', size: '3/4 inch', ratePaise: 7600 },
      { material: 'GI', size: '1 inch', ratePaise: 11500 },
      { material: 'GI', size: '1.5 inch', ratePaise: 23500 },
      { material: 'GI', size: '2 inch', ratePaise: 38000 },
    ],
    notes: 'Three-way 90° distribution tee.',
  },
  {
    category: 'Fittings',
    name: 'Coupler / Socket',
    sizeSpec: '3/4 inch (CPVC)',
    unit: 'Nos',
    defaultRatePaise: 2400, // ₹24 for 3/4" CPVC
    taxRate: 18,
    active: true,
    hasVariants: true,
    availableMaterials: ['CPVC', 'UPVC', 'Brass', 'GI', 'SS 304'],
    availableSizes: ['1/2 inch', '3/4 inch', '1 inch', '1.25 inch', '1.5 inch', '2 inch', '3 inch', '4 inch'],
    variantPrices: [
      { material: 'CPVC', size: '1/2 inch', ratePaise: 1800 },
      { material: 'CPVC', size: '3/4 inch', ratePaise: 2400 },
      { material: 'CPVC', size: '1 inch', ratePaise: 3600 },
      { material: 'CPVC', size: '1.25 inch', ratePaise: 5400 },
      { material: 'CPVC', size: '1.5 inch', ratePaise: 7500 },
      { material: 'CPVC', size: '2 inch', ratePaise: 12500 },

      { material: 'UPVC', size: '1/2 inch', ratePaise: 1400 },
      { material: 'UPVC', size: '3/4 inch', ratePaise: 1800 },
      { material: 'UPVC', size: '1 inch', ratePaise: 2700 },
      { material: 'UPVC', size: '1.5 inch', ratePaise: 5500 },
      { material: 'UPVC', size: '2 inch', ratePaise: 9200 },

      { material: 'Brass', size: '1/2 inch', ratePaise: 7500 },
      { material: 'Brass', size: '3/4 inch', ratePaise: 11000 },
      { material: 'Brass', size: '1 inch', ratePaise: 17500 },

      { material: 'GI', size: '1/2 inch', ratePaise: 3200 },
      { material: 'GI', size: '3/4 inch', ratePaise: 4400 },
      { material: 'GI', size: '1 inch', ratePaise: 6800 },
    ],
    notes: 'Straight inline socket connection.',
  },
  {
    category: 'Fittings',
    name: 'Three-Piece Union',
    sizeSpec: '1 inch (CPVC)',
    unit: 'Nos',
    defaultRatePaise: 18500, // ₹185
    taxRate: 18,
    active: true,
    hasVariants: true,
    availableMaterials: ['CPVC', 'UPVC', 'Brass', 'GI', 'SS 304'],
    availableSizes: ['1/2 inch', '3/4 inch', '1 inch', '1.25 inch', '1.5 inch', '2 inch'],
    variantPrices: [
      { material: 'CPVC', size: '1/2 inch', ratePaise: 11000 },
      { material: 'CPVC', size: '3/4 inch', ratePaise: 14500 },
      { material: 'CPVC', size: '1 inch', ratePaise: 18500 },
      { material: 'CPVC', size: '1.25 inch', ratePaise: 27500 },
      { material: 'CPVC', size: '1.5 inch', ratePaise: 38000 },
      { material: 'CPVC', size: '2 inch', ratePaise: 58000 },

      { material: 'UPVC', size: '1/2 inch', ratePaise: 8500 },
      { material: 'UPVC', size: '3/4 inch', ratePaise: 11500 },
      { material: 'UPVC', size: '1 inch', ratePaise: 14500 },
      { material: 'UPVC', size: '1.5 inch', ratePaise: 29000 },
      { material: 'UPVC', size: '2 inch', ratePaise: 45000 },

      { material: 'Brass', size: '1/2 inch', ratePaise: 28000 },
      { material: 'Brass', size: '3/4 inch', ratePaise: 38000 },
      { material: 'Brass', size: '1 inch', ratePaise: 54000 },

      { material: 'GI', size: '1/2 inch', ratePaise: 12500 },
      { material: 'GI', size: '3/4 inch', ratePaise: 16500 },
      { material: 'GI', size: '1 inch', ratePaise: 22000 },
      { material: 'GI', size: '1.5 inch', ratePaise: 39000 },
      { material: 'GI', size: '2 inch', ratePaise: 56000 },
    ],
    notes: 'Three piece separable coupling with nut for quick disassembly.',
  },
  {
    category: 'Valves and Cocks',
    name: 'Ball Valve Full Bore',
    sizeSpec: '3/4 inch (Brass)',
    unit: 'Nos',
    defaultRatePaise: 42000, // ₹420
    taxRate: 18,
    active: true,
    hasVariants: true,
    availableMaterials: ['Brass', 'CPVC', 'UPVC', 'SS 304'],
    availableSizes: ['1/2 inch', '3/4 inch', '1 inch', '1.25 inch', '1.5 inch', '2 inch'],
    variantPrices: [
      { material: 'Brass', size: '1/2 inch', ratePaise: 32000 },
      { material: 'Brass', size: '3/4 inch', ratePaise: 42000 },
      { material: 'Brass', size: '1 inch', ratePaise: 58000 },
      { material: 'Brass', size: '1.25 inch', ratePaise: 95000 },
      { material: 'Brass', size: '1.5 inch', ratePaise: 145000 },
      { material: 'Brass', size: '2 inch', ratePaise: 220000 },

      { material: 'CPVC', size: '1/2 inch', ratePaise: 16000 },
      { material: 'CPVC', size: '3/4 inch', ratePaise: 22000 },
      { material: 'CPVC', size: '1 inch', ratePaise: 31000 },
      { material: 'CPVC', size: '1.25 inch', ratePaise: 48000 },
      { material: 'CPVC', size: '1.5 inch', ratePaise: 68000 },
      { material: 'CPVC', size: '2 inch', ratePaise: 110000 },

      { material: 'UPVC', size: '1/2 inch', ratePaise: 12000 },
      { material: 'UPVC', size: '3/4 inch', ratePaise: 16500 },
      { material: 'UPVC', size: '1 inch', ratePaise: 24000 },
      { material: 'UPVC', size: '1.5 inch', ratePaise: 52000 },
      { material: 'UPVC', size: '2 inch', ratePaise: 85000 },

      { material: 'SS 304', size: '1/2 inch', ratePaise: 65000 },
      { material: 'SS 304', size: '3/4 inch', ratePaise: 88000 },
      { material: 'SS 304', size: '1 inch', ratePaise: 135000 },
      { material: 'SS 304', size: '2 inch', ratePaise: 340000 },
    ],
    notes: 'Quarter turn shutoff valve. Brass / CPVC / UPVC / SS 304 options.',
  },
  {
    category: 'Pipes',
    name: 'Plumbing Supply Pipe (10 ft length)',
    sizeSpec: '3/4 inch (CPVC)',
    unit: 'Nos',
    defaultRatePaise: 38000, // ₹380
    taxRate: 18,
    active: true,
    hasVariants: true,
    availableMaterials: ['CPVC', 'UPVC', 'GI', 'PPR', 'PVC SWR'],
    availableSizes: [
      '1/2 inch',
      '3/4 inch',
      '1 inch',
      '1.25 inch',
      '1.5 inch',
      '2 inch',
      '2.5 inch',
      '3 inch',
      '4 inch',
    ],
    variantPrices: [
      { material: 'CPVC', size: '1/2 inch', ratePaise: 27000 },
      { material: 'CPVC', size: '3/4 inch', ratePaise: 38000 },
      { material: 'CPVC', size: '1 inch', ratePaise: 54000 },
      { material: 'CPVC', size: '1.25 inch', ratePaise: 79000 },
      { material: 'CPVC', size: '1.5 inch', ratePaise: 108000 },
      { material: 'CPVC', size: '2 inch', ratePaise: 172000 },

      { material: 'UPVC', size: '1/2 inch', ratePaise: 19500 },
      { material: 'UPVC', size: '3/4 inch', ratePaise: 27500 },
      { material: 'UPVC', size: '1 inch', ratePaise: 39500 },
      { material: 'UPVC', size: '1.25 inch', ratePaise: 58000 },
      { material: 'UPVC', size: '1.5 inch', ratePaise: 79000 },
      { material: 'UPVC', size: '2 inch', ratePaise: 125000 },

      { material: 'GI', size: '1/2 inch', ratePaise: 68000 },
      { material: 'GI', size: '3/4 inch', ratePaise: 89000 },
      { material: 'GI', size: '1 inch', ratePaise: 135000 },
      { material: 'GI', size: '1.5 inch', ratePaise: 220000 },
      { material: 'GI', size: '2 inch', ratePaise: 310000 },

      { material: 'PVC SWR', size: '2.5 inch', ratePaise: 42000 },
      { material: 'PVC SWR', size: '3 inch', ratePaise: 46000 },
      { material: 'PVC SWR', size: '4 inch', ratePaise: 68000 },
    ],
    notes: 'Straight pipe bundle (10 ft length). Selecting CPVC or UPVC adjusts price.',
  },
  {
    category: 'Fittings',
    name: 'Hex Nipple',
    sizeSpec: '3/4 inch (Brass)',
    unit: 'Nos',
    defaultRatePaise: 8500, // ₹85
    taxRate: 18,
    active: true,
    hasVariants: true,
    availableMaterials: ['Brass', 'GI', 'SS 304', 'CPVC', 'UPVC'],
    availableSizes: ['1/2 inch', '3/4 inch', '1 inch', '1.25 inch', '1.5 inch', '2 inch'],
    variantPrices: [
      { material: 'Brass', size: '1/2 inch', ratePaise: 6500 },
      { material: 'Brass', size: '3/4 inch', ratePaise: 8500 },
      { material: 'Brass', size: '1 inch', ratePaise: 13500 },

      { material: 'GI', size: '1/2 inch', ratePaise: 2800 },
      { material: 'GI', size: '3/4 inch', ratePaise: 3800 },
      { material: 'GI', size: '1 inch', ratePaise: 5800 },

      { material: 'CPVC', size: '1/2 inch', ratePaise: 2200 },
      { material: 'CPVC', size: '3/4 inch', ratePaise: 2900 },
      { material: 'CPVC', size: '1 inch', ratePaise: 4200 },
    ],
    notes: 'Male threaded barrel nipple for joining two female sockets.',
  },

  // 2. OTHER SPECIALIZED FITTINGS & VALVES
  {
    category: 'Fittings',
    name: 'CPVC Brass Elbow',
    sizeSpec: '3/4 x 1/2 inch',
    unit: 'Nos',
    defaultRatePaise: 11500, // ₹115
    taxRate: 18,
    active: true,
  },
  {
    category: 'Fittings',
    name: 'CPVC Reducing Tee',
    sizeSpec: '1 x 3/4 inch',
    unit: 'Nos',
    defaultRatePaise: 6500, // ₹65
    taxRate: 18,
    active: true,
  },
  {
    category: 'Fittings',
    name: 'CPVC Male Threaded Adaptor (MTA Brass)',
    sizeSpec: '3/4 x 1/2 inch',
    unit: 'Nos',
    defaultRatePaise: 12500, // ₹125
    taxRate: 18,
    active: true,
  },
  {
    category: 'Fittings',
    name: 'CPVC Female Threaded Adaptor (FTA Brass)',
    sizeSpec: '3/4 x 1/2 inch',
    unit: 'Nos',
    defaultRatePaise: 11000, // ₹110
    taxRate: 18,
    active: true,
  },
  {
    category: 'Fittings',
    name: 'PVC SWR Single Tee with Door',
    sizeSpec: '4 inch / 110mm',
    unit: 'Nos',
    defaultRatePaise: 16500, // ₹165
    taxRate: 18,
    active: true,
  },

  // 3. VALVES AND COCKS
  {
    category: 'Valves and Cocks',
    name: 'Concealed Stop Cock (Forged Brass)',
    sizeSpec: '1/2 inch with Flange',
    unit: 'Nos',
    defaultRatePaise: 65000, // ₹650
    taxRate: 18,
    active: true,
  },
  {
    category: 'Valves and Cocks',
    name: 'Brass Angle Cock Heavy',
    sizeSpec: '1/2 inch with Wall Flange',
    unit: 'Nos',
    defaultRatePaise: 38000, // ₹380
    taxRate: 18,
    active: true,
  },
  {
    category: 'Valves and Cocks',
    name: 'Two-Way Angle Cock Brass',
    sizeSpec: '1/2 inch',
    unit: 'Nos',
    defaultRatePaise: 69000, // ₹690
    taxRate: 18,
    active: true,
  },
  {
    category: 'Valves and Cocks',
    name: 'Non-Return Check Valve (NRV Brass)',
    sizeSpec: '1 inch Vertical/Horizontal',
    unit: 'Nos',
    defaultRatePaise: 52000, // ₹520
    taxRate: 18,
    active: true,
  },
  {
    category: 'Valves and Cocks',
    name: 'Brass Foot Valve with SS Strainer',
    sizeSpec: '1 inch for Suction Line',
    unit: 'Nos',
    defaultRatePaise: 48000, // ₹480
    taxRate: 18,
    active: true,
  },

  // 4. TAPS AND MIXERS
  {
    category: 'Taps and Mixers',
    name: 'Brass Bib Cock Long Body with Flange',
    sizeSpec: '1/2 inch Chrome Plated',
    unit: 'Nos',
    defaultRatePaise: 55000, // ₹550
    taxRate: 18,
    active: true,
  },
  {
    category: 'Taps and Mixers',
    name: 'Pillar Tap / Basin Tap (Brass Chrome)',
    sizeSpec: '1/2 inch Standard',
    unit: 'Nos',
    defaultRatePaise: 62000, // ₹620
    taxRate: 18,
    active: true,
  },
  {
    category: 'Taps and Mixers',
    name: 'Wall Mixer 3-in-1 with L-Bend',
    sizeSpec: 'Brass Heavy Chrome Plated',
    unit: 'Nos',
    defaultRatePaise: 345000, // ₹3,450
    taxRate: 18,
    active: true,
  },
  {
    category: 'Taps and Mixers',
    name: 'Single Lever Basin Mixer (Hot & Cold)',
    sizeSpec: 'With 450mm Braided Hoses',
    unit: 'Nos',
    defaultRatePaise: 215000, // ₹2,150
    taxRate: 18,
    active: true,
  },
  {
    category: 'Taps and Mixers',
    name: 'Health Faucet Gun with 1m SS Hose & Hook',
    sizeSpec: 'Brass/ABS Chrome Plated',
    unit: 'Set',
    defaultRatePaise: 55000, // ₹550
    taxRate: 18,
    active: true,
  },

  // 5. SANITARYWARE
  {
    category: 'Sanitaryware',
    name: 'European Water Closet (EWC) Floor Mount',
    sizeSpec: 'S-Trap / P-Trap with Slow Seat Cover',
    unit: 'Set',
    defaultRatePaise: 380000, // ₹3,800
    taxRate: 18,
    active: true,
  },
  {
    category: 'Sanitaryware',
    name: 'Wash Basin with Half / Full Pedestal',
    sizeSpec: '550 x 400 mm Ceramic',
    unit: 'Set',
    defaultRatePaise: 220000, // ₹2,200
    taxRate: 18,
    active: true,
  },
  {
    category: 'Sanitaryware',
    name: 'Dual Flush PVC Cistern (External Tank)',
    sizeSpec: '10 Litre Capacity with Inlet Float',
    unit: 'Nos',
    defaultRatePaise: 125000, // ₹1,250
    taxRate: 18,
    active: true,
  },
  {
    category: 'Sanitaryware',
    name: 'Kitchen Sink Single Bowl SS 304',
    sizeSpec: '24 x 18 x 9 inch (Heavy 1mm)',
    unit: 'Nos',
    defaultRatePaise: 260000, // ₹2,600
    taxRate: 18,
    active: true,
  },

  // 6. WATER TANKS AND PUMPS
  {
    category: 'Water Tanks and Pumps',
    name: 'Overhead Water Storage Tank 4-Layer Food Grade',
    sizeSpec: '1000 Litres (UV Stabilized)',
    unit: 'Nos',
    defaultRatePaise: 650000, // ₹6,500
    taxRate: 18,
    active: true,
  },
  {
    category: 'Water Tanks and Pumps',
    name: 'Overhead Water Storage Tank 3-Layer',
    sizeSpec: '500 Litres Capacity',
    unit: 'Nos',
    defaultRatePaise: 380000, // ₹3,800
    taxRate: 18,
    active: true,
  },
  {
    category: 'Water Tanks and Pumps',
    name: 'Self Priming Monobloc Water Pump',
    sizeSpec: '1.0 HP Single Phase Copper Winding',
    unit: 'Nos',
    defaultRatePaise: 620000, // ₹6,200
    taxRate: 18,
    active: true,
  },

  // 7. DRAINAGE
  {
    category: 'Drainage',
    name: 'Nahani Trap with Water Seal',
    sizeSpec: '110 x 75 mm PVC',
    unit: 'Nos',
    defaultRatePaise: 11000, // ₹110
    taxRate: 18,
    active: true,
  },
  {
    category: 'Drainage',
    name: 'SS 304 Anti-Cockroach Floor Drain Jali',
    sizeSpec: '5 x 5 inch Locking Type',
    unit: 'Nos',
    defaultRatePaise: 28000, // ₹280
    taxRate: 18,
    active: true,
  },

  // 8. CONSUMABLES
  {
    category: 'Consumables',
    name: 'PTFE Teflon Thread Seal Tape',
    sizeSpec: '12mm x 10m Heavy Grade',
    unit: 'Pkt',
    defaultRatePaise: 2500, // ₹25
    taxRate: 18,
    active: true,
  },
  {
    category: 'Consumables',
    name: 'CPVC Solvent Cement with Dauber',
    sizeSpec: '250 ml Tin (Medium Fast Set)',
    unit: 'Nos',
    defaultRatePaise: 18000, // ₹180
    taxRate: 18,
    active: true,
  },
  {
    category: 'Consumables',
    name: 'UPVC Solvent Cement',
    sizeSpec: '250 ml Tin',
    unit: 'Nos',
    defaultRatePaise: 13500, // ₹135
    taxRate: 18,
    active: true,
  },

  // 9. LABOUR & SERVICES
  {
    category: 'Labour and Service',
    name: 'Complete Bathroom Plumbing Concealed Line Fitting',
    sizeSpec: 'Hot & cold water, drainage & vent pipes',
    unit: 'Point',
    defaultRatePaise: 85000, // ₹850/point
    taxRate: 18,
    active: true,
  },
  {
    category: 'Labour and Service',
    name: 'Water Closet / Commode Installation & Testing',
    sizeSpec: 'Includes wax seal, floor fixing & connection',
    unit: 'Nos',
    defaultRatePaise: 65000, // ₹650
    taxRate: 18,
    active: true,
  },
  {
    category: 'Labour and Service',
    name: 'Overhead Water Tank Installation & Manifold Hookup',
    sizeSpec: 'Inlet, outlet, overflow, air vent & bypass valve',
    unit: 'Job',
    defaultRatePaise: 150000, // ₹1,500
    taxRate: 18,
    active: true,
  },
];

export const GLOSSARY_CATEGORIES = [
  'All',
  'Pipes',
  'Fittings',
  'Valves and Cocks',
  'Taps and Mixers',
  'Sanitaryware',
  'Water Tanks and Pumps',
  'Drainage',
  'Consumables',
  'Labour and Service',
] as const;
