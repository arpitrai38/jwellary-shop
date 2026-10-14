import Decimal from 'decimal.js';

// Configure Decimal.js precision and default rounding to HALF_UP
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export const toDecimal = (val) => new Decimal(val || 0);

export const roundMoney = (val) => {
  return Number(new Decimal(val || 0).toFixed(2));
};

export const roundWeight = (val) => {
  return Number(new Decimal(val || 0).toFixed(3));
};

export const roundToInt = (val) => {
  return Number(new Decimal(val || 0).toFixed(0));
};

/**
 * Calculates item pricing snapshot
 * Supports both WEIGHT_BASED and FIXED pricing
 */
export const calculateItemPrice = ({
  pricingType = 'WEIGHT_BASED',
  fixedSellingPrice = 0,
  grossWeight = 0,
  stoneWeight = 0,
  goldRatePerGram = 0,
  makingChargeType = 'PER_GRAM', // PER_GRAM, PERCENTAGE, FIXED
  makingChargeValue = 0,
  wastagePercent = 0,
  quantity = 1
}) => {
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  if (pricingType === 'FIXED') {
    const fixedUnit = roundMoney(fixedSellingPrice);
    const lineTotal = roundMoney(new Decimal(fixedUnit).times(qty));
    return {
      pricingType: 'FIXED',
      netGoldWeight: roundWeight(new Decimal(grossWeight).minus(stoneWeight)),
      goldRatePerGram: roundMoney(goldRatePerGram),
      metalValue: 0,
      makingCharge: 0,
      wastageValue: 0,
      unitPrice: fixedUnit,
      lineTotal
    };
  }

  // Weight-based pricing
  const dGross = toDecimal(grossWeight);
  const dStone = toDecimal(stoneWeight);
  const dNet = Decimal.max(0, dGross.minus(dStone));
  const netGoldWeight = roundWeight(dNet);

  const dRate = toDecimal(goldRatePerGram);
  const dMetalValue = dNet.times(dRate);
  const metalValue = roundMoney(dMetalValue);

  // Making charges
  let dMakingCharge = new Decimal(0);
  const dMCVal = toDecimal(makingChargeValue);
  if (makingChargeType === 'PER_GRAM') {
    dMakingCharge = dNet.times(dMCVal);
  } else if (makingChargeType === 'PERCENTAGE') {
    dMakingCharge = dMetalValue.times(dMCVal.dividedBy(100));
  } else if (makingChargeType === 'FIXED') {
    dMakingCharge = dMCVal;
  }
  const makingCharge = roundMoney(dMakingCharge);

  // Wastage value
  const dWastagePercent = toDecimal(wastagePercent);
  const dWastageVal = dMetalValue.times(dWastagePercent.dividedBy(100));
  const wastageValue = roundMoney(dWastageVal);

  // Unit price = metal + making + wastage
  const dUnitPrice = dMetalValue.plus(dMakingCharge).plus(dWastageVal);
  const unitPrice = roundMoney(dUnitPrice);
  const lineTotal = roundMoney(dUnitPrice.times(qty));

  return {
    pricingType: 'WEIGHT_BASED',
    grossWeight: roundWeight(dGross),
    stoneWeight: roundWeight(dStone),
    netGoldWeight,
    goldRatePerGram: roundMoney(dRate),
    metalValue,
    makingChargeType,
    makingChargeValue: roundMoney(dMCVal),
    makingCharge,
    wastagePercent: Number(dWastagePercent.toFixed(2)),
    wastageValue,
    unitPrice,
    lineTotal
  };
};

/**
 * Calculates invoice financial totals, GST breakdowns, and round-offs
 */
export const calculateInvoiceTotals = ({
  items = [],
  discount = 0,
  isInterState = false,
  cgstRate = 1.5,
  sgstRate = 1.5,
  igstRate = 3.0
}) => {
  let subtotalDec = new Decimal(0);

  items.forEach((item) => {
    subtotalDec = subtotalDec.plus(toDecimal(item.lineTotal || item.amount || 0));
  });

  const subtotal = roundMoney(subtotalDec);
  const dDiscount = Decimal.min(subtotalDec, Decimal.max(0, toDecimal(discount)));
  const discountAmount = roundMoney(dDiscount);
  const taxableAmountDec = subtotalDec.minus(dDiscount);
  const taxableAmount = roundMoney(taxableAmountDec);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstAmount = roundMoney(taxableAmountDec.times(toDecimal(igstRate).dividedBy(100)));
  } else {
    cgstAmount = roundMoney(taxableAmountDec.times(toDecimal(cgstRate).dividedBy(100)));
    sgstAmount = roundMoney(taxableAmountDec.times(toDecimal(sgstRate).dividedBy(100)));
  }

  const totalTax = roundMoney(new Decimal(cgstAmount).plus(sgstAmount).plus(igstAmount));
  const unroundedGrandTotalDec = taxableAmountDec.plus(totalTax);
  const unroundedGrandTotal = roundMoney(unroundedGrandTotalDec);

  // Indian accounting practice standard integer round-off
  const grandTotal = Math.round(unroundedGrandTotal);
  const roundOff = roundMoney(new Decimal(grandTotal).minus(unroundedGrandTotal));

  return {
    subtotal,
    discount: discountAmount,
    taxableAmount,
    isInterState,
    cgstRate: isInterState ? 0 : cgstRate,
    cgstAmount,
    sgstRate: isInterState ? 0 : sgstRate,
    sgstAmount,
    igstRate: isInterState ? igstRate : 0,
    igstAmount,
    totalTax,
    roundOff,
    grandTotal
  };
};
