import test from 'node:test';
import assert from 'node:assert';
import {
  calculateItemPrice,
  calculateInvoiceTotals,
  roundMoney,
  roundWeight
} from '../src/utils/decimalUtil.js';

test('Financial Decimal Utility - Weight and Money Rounding', () => {
  assert.strictEqual(roundWeight(1.4567), 1.457);
  assert.strictEqual(roundMoney(10700.556), 10700.56);
  assert.strictEqual(roundMoney(10700.554), 10700.55);
});

test('Pricing Engine - Weight-based calculation with making charges and wastage', () => {
  // Gross: 10g, Stone: 1g => Net gold: 9g
  // Gold rate: ₹7000/g => Metal value: 9 * 7000 = ₹63,000
  // Making charge: ₹600/g => 9 * 600 = ₹5,400
  // Wastage: 2% of metal value => 63,000 * 0.02 = ₹1,260
  // Expected Unit Price: 63,000 + 5,400 + 1,260 = ₹69,660
  const result = calculateItemPrice({
    pricingType: 'WEIGHT_BASED',
    grossWeight: 10,
    stoneWeight: 1,
    goldRatePerGram: 7000,
    makingChargeType: 'PER_GRAM',
    makingChargeValue: 600,
    wastagePercent: 2,
    quantity: 1
  });

  assert.strictEqual(result.netGoldWeight, 9);
  assert.strictEqual(result.metalValue, 63000);
  assert.strictEqual(result.makingCharge, 5400);
  assert.strictEqual(result.wastageValue, 1260);
  assert.strictEqual(result.unitPrice, 69660);
  assert.strictEqual(result.lineTotal, 69660);
});

test('Pricing Engine - Fixed-price product calculation', () => {
  const result = calculateItemPrice({
    pricingType: 'FIXED',
    fixedSellingPrice: 10700,
    grossWeight: 1.45,
    stoneWeight: 0,
    quantity: 1
  });

  assert.strictEqual(result.pricingType, 'FIXED');
  assert.strictEqual(result.unitPrice, 10700);
  assert.strictEqual(result.lineTotal, 10700);
});

test('GST Invoice Calculation - Intra-state 3% split (1.5% CGST + 1.5% SGST) with round-off', () => {
  const items = [
    { lineTotal: 10000 },
    { lineTotal: 25000 }
  ];

  // Subtotal = 35000, Discount = 1000 => Taxable = 34000
  // CGST 1.5% = 510, SGST 1.5% = 510 => Total Tax = 1020
  // Grand Total = 34000 + 1020 = 35020
  const totals = calculateInvoiceTotals({
    items,
    discount: 1000,
    isInterState: false,
    cgstRate: 1.5,
    sgstRate: 1.5
  });

  assert.strictEqual(totals.subtotal, 35000);
  assert.strictEqual(totals.discount, 1000);
  assert.strictEqual(totals.taxableAmount, 34000);
  assert.strictEqual(totals.cgstAmount, 510);
  assert.strictEqual(totals.sgstAmount, 510);
  assert.strictEqual(totals.igstAmount, 0);
  assert.strictEqual(totals.totalTax, 1020);
  assert.strictEqual(totals.grandTotal, 35020);
});

test('GST Invoice Calculation - Inter-state 3% IGST', () => {
  const items = [{ lineTotal: 50000 }];

  // Taxable = 50000, IGST 3% = 1500 => Grand Total = 51500
  const totals = calculateInvoiceTotals({
    items,
    discount: 0,
    isInterState: true,
    igstRate: 3.0
  });

  assert.strictEqual(totals.isInterState, true);
  assert.strictEqual(totals.cgstAmount, 0);
  assert.strictEqual(totals.sgstAmount, 0);
  assert.strictEqual(totals.igstAmount, 1500);
  assert.strictEqual(totals.totalTax, 1500);
  assert.strictEqual(totals.grandTotal, 51500);
});
