import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Alert,
  Autocomplete,
  Grid
} from '@mui/material';
import api from '../services/api.js';
import { StatusBadge } from '../components/Common/StatusBadge.jsx';
import { InvoiceReceiptModal } from '../components/Common/InvoiceReceiptModal.jsx';

export const BillingPage = () => {
  const [scanCode, setScanCode] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [scannedProductPreview, setScannedProductPreview] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [isInterState, setIsInterState] = useState(false);
  const [invoiceSeq, setInvoiceSeq] = useState(1025);

  // Customer selection
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openNewCustomerModal, setOpenNewCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  // Completed Invoice Modal
  const [completedSale, setCompletedSale] = useState(null);
  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
  const [shopSetting, setShopSetting] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const scanInputRef = useRef(null);

  // Load shop settings and customers
  useEffect(() => {
    const initData = async () => {
      try {
        const [settingsRes, custRes] = await Promise.all([
          api.get('/settings'),
          api.get('/customers?limit=100').catch(() => ({ success: false, data: [] }))
        ]);
        if (settingsRes?.success && settingsRes.data) {
          setShopSetting(settingsRes.data);
          setInvoiceSeq((settingsRes.data.lastInvoiceSeq || 1024) + 1);
        }
        if (custRes?.success && Array.isArray(custRes.data)) {
          setCustomers(custRes.data);
        }
      } catch (err) {
        console.error('Error initializing billing data:', err);
      }
    };
    initData();
  }, []);

  const addItemToCart = (prod) => {
    if (!prod) return;
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.product === prod._id || item.itemId === prod.itemId);
      if (existing) {
        setErrorMsg(`Item ${prod.itemId} is already in the bill`);
        return prevItems;
      }

      const price = prod.fixedSellingPrice || prod.sellingPriceEstimate || 0;
      const newItem = {
        product: prod._id,
        itemId: prod.itemId,
        barcode: prod.barcode,
        name: prod.name,
        categoryName: prod.categoryName || 'Jewellery',
        purity: prod.purity || '22K',
        grossWeight: prod.grossWeight || 0,
        stoneWeight: prod.stoneWeight || 0,
        netGoldWeight: prod.netGoldWeight || 0,
        huid: prod.huid || '',
        pricingType: prod.pricingType || 'WEIGHT_BASED',
        fixedSellingPrice: prod.fixedSellingPrice || 0,
        goldRatePerGram: prod.purity === '24K' ? 7450 : 6850,
        makingCharge: prod.makingChargeValue || 650,
        unitPrice: price,
        quantity: 1,
        lineTotal: price
      };

      setScannedProductPreview(prod);
      setScanCode('');
      setErrorMsg('');
      return [...prevItems, newItem];
    });
  };

  const handleScanOrSearch = async (e) => {
    e?.preventDefault();
    const code = (scanCode || '').trim();
    if (!code) {
      setErrorMsg('Please enter or scan a barcode or Item ID');
      return;
    }
    handleScanByCode(code);
  };

  const handleScanByCode = async (code) => {
    setErrorMsg('');
    try {
      const res = await api.get(`/products/barcode/${code}`);
      if (res.success && res.data) {
        addItemToCart(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || `No product found for '${code}'`);
    }
  };

  const handleRemoveItem = (index) => {
    const updated = [...cartItems];
    updated.splice(index, 1);
    setCartItems(updated);
  };

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
  const numDiscount = Math.min(subtotal, Math.max(0, parseFloat(discount) || 0));
  const taxable = subtotal - numDiscount;

  const cgstRate = isInterState ? 0 : 1.5;
  const sgstRate = isInterState ? 0 : 1.5;
  const igstRate = isInterState ? 3.0 : 0;

  const cgst = Number((taxable * (cgstRate / 100)).toFixed(2));
  const sgst = Number((taxable * (sgstRate / 100)).toFixed(2));
  const igst = Number((taxable * (igstRate / 100)).toFixed(2));
  const totalTax = cgst + sgst + igst;
  const unroundedTotal = taxable + totalTax;
  const grandTotal = Math.round(unroundedTotal);
  const roundOff = Number((grandTotal - unroundedTotal).toFixed(2));

  // Quick Customer Creation
  const handleCreateCustomer = async () => {
    if (!newCustName || !newCustPhone) return;
    try {
      const res = await api.post('/customers', {
        name: newCustName,
        phone: newCustPhone
      });
      if (res.success) {
        setCustomers([res.data, ...customers]);
        setSelectedCustomer(res.data);
        setOpenNewCustomerModal(false);
        setNewCustName('');
        setNewCustPhone('');
      }
    } catch (err) {
      alert(err.message || 'Error creating customer');
    }
  };

  // Complete and Print Sale
  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      setErrorMsg('Please add at least one item to complete the bill');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const finalPaid = paidAmount === '' ? grandTotal : Math.min(grandTotal, parseFloat(paidAmount) || 0);

      const payload = {
        customerId: selectedCustomer?._id || null,
        customerSnapshot: selectedCustomer
          ? {
              name: selectedCustomer.name,
              phone: selectedCustomer.phone,
              address: selectedCustomer.address,
              city: selectedCustomer.city
            }
          : { name: 'Walk-in Customer' },
        items: cartItems.map((item) => ({
          productId: item.product,
          itemId: item.itemId,
          barcode: item.barcode,
          name: item.name,
          categoryName: item.categoryName,
          purity: item.purity,
          grossWeight: item.grossWeight,
          stoneWeight: item.stoneWeight,
          netGoldWeight: item.netGoldWeight,
          huid: item.huid,
          pricingType: item.pricingType,
          fixedSellingPrice: item.fixedSellingPrice,
          goldRatePerGram: item.goldRatePerGram,
          makingCharge: item.makingCharge,
          lineTotal: item.lineTotal
        })),
        discount: numDiscount,
        isInterState,
        paidAmount: finalPaid,
        paymentMethod,
        paymentRef
      };

      const res = await api.post('/sales', payload);
      if (res.success) {
        setCompletedSale(res.data);
        setOpenInvoiceModal(true);
        // Reset cart for next bill
        setCartItems([]);
        setDiscount(0);
        setPaidAmount('');
        setScannedProductPreview(null);
        setInvoiceSeq((prev) => prev + 1);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ p: 2.5 }}>
      {/* Header matching prototype */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 800 }}>
          New Bill
        </Typography>
        <span className="badge badge-blue">DRAFT #INV-{invoiceSeq}</span>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '12px' }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      {/* Barcode Search bar matching prototype */}
      <Box component="form" onSubmit={handleScanOrSearch} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
        <TextField
          id="scanInput"
          ref={scanInputRef}
          fullWidth
          size="small"
          placeholder="Scan barcode or type Item ID (e.g. JWL00126, JWL00124)..."
          value={scanCode}
          onChange={(e) => setScanCode(e.target.value)}
          autoFocus
        />
        <Button type="submit" variant="contained" color="primary" sx={{ whiteSpace: 'nowrap', px: 2.5 }}>
          ＋ Add Item
        </Button>
      </Box>

      {/* Scanned product preview card matching prototype */}
      {scannedProductPreview && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            mb: 2,
            backgroundColor: 'var(--surface2)',
            borderRadius: '12px',
            border: '1px solid var(--line)'
          }}
        >
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: '10px',
              background: 'linear-gradient(145deg, #f5e6b8, #b98520)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '11px',
              letterSpacing: '1px'
            }}
          >
            {scannedProductPreview.categoryName?.toUpperCase() || 'GOLD'}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: 'var(--muted)', fontSize: '10px' }}>
              Scanned item
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, fontSize: '13px' }}>
              {scannedProductPreview.itemId} · {scannedProductPreview.name}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: '16px', color: 'var(--ink)' }}>
              ₹{(scannedProductPreview.fixedSellingPrice || scannedProductPreview.sellingPriceEstimate || 10700).toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--muted)', fontSize: '10px' }}>
              {scannedProductPreview.purity} · {scannedProductPreview.netGoldWeight}g · Verified tag
            </Typography>
          </Box>
        </Box>
      )}

      {/* Bill Items Table matching prototype */}
      <Box sx={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '12px', mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Rate</TableCell>
              <TableCell>GST</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody id="billBody">
            {cartItems.length > 0 ? (
              cartItems.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <strong>{item.itemId} · {item.name}</strong>
                    <Typography variant="caption" sx={{ display: 'block', color: 'var(--muted)' }}>
                      {item.purity} · Net: {item.netGoldWeight}g {item.huid ? `· HUID: ${item.huid}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>₹{item.unitPrice?.toLocaleString('en-IN')}</TableCell>
                  <TableCell>3% (Included/Calculated)</TableCell>
                  <TableCell>
                    <strong>₹{item.lineTotal?.toLocaleString('en-IN')}</strong>
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" color="error" onClick={() => handleRemoveItem(idx)}>
                      ✕
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'var(--muted)' }}>
                  Cart is empty. Scan an item barcode or type Item ID to add.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Customer & Bill Summary Grid matching prototype */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {/* Left: Customer Section */}
        <Box sx={{ p: 2, backgroundColor: 'var(--surface2)', borderRadius: '14px', border: '1px solid var(--line)' }}>
          <Typography variant="caption" sx={{ color: 'var(--muted)', fontWeight: 700, display: 'block', mb: 1 }}>
            CUSTOMER
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant={!selectedCustomer ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setSelectedCustomer(null)}
            >
              Walk-in Customer
            </Button>
            <Button variant="outlined" size="small" onClick={() => setOpenNewCustomerModal(true)}>
              ＋ Add Customer
            </Button>
          </Box>

          <Autocomplete
            size="small"
            options={customers || []}
            getOptionLabel={(opt) => {
              if (!opt) return '';
              if (typeof opt === 'string') return opt;
              return `${opt.name || ''} ${opt.phone ? `(${opt.phone})` : ''}`.trim();
            }}
            isOptionEqualToValue={(option, value) => !value || option?._id === value?._id}
            value={selectedCustomer}
            onChange={(e, val) => setSelectedCustomer(val)}
            renderInput={(params) => <TextField {...params} placeholder="Search customer by name or mobile..." />}
          />

          {selectedCustomer && (
            <Box sx={{ mt: 1.5, p: 1, backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e8e4dc', fontSize: '11px' }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedCustomer.name}</Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'var(--muted)' }}>
                Phone: {selectedCustomer.phone} | Khata Due: ₹{Math.abs(selectedCustomer.currentBalance || 0)}
              </Typography>
            </Box>
          )}

          {/* Payment Method picker */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: 'var(--muted)', fontWeight: 700, display: 'block', mb: 0.5 }}>
              PAYMENT METHOD
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'].map((m) => (
                <Button
                  key={m}
                  size="small"
                  variant={paymentMethod === m ? 'contained' : 'outlined'}
                  onClick={() => setPaymentMethod(m)}
                >
                  {m}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Right: Bill Summary Card matching prototype */}
        <Box sx={{ p: 2, backgroundColor: 'var(--surface2)', borderRadius: '14px', border: '1px solid var(--line)' }}>
          <Typography variant="caption" sx={{ color: 'var(--muted)', fontWeight: 700, display: 'block', mb: 1.5 }}>
            BILL SUMMARY
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, fontSize: '12px' }}>
            <span>Subtotal ({cartItems.length} items)</span>
            <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, fontSize: '12px' }}>
            <span>Discount</span>
            <TextField
              size="small"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              sx={{ width: 100, '& input': { py: 0.5, textAlign: 'right', fontSize: '12px' } }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, fontSize: '12px', color: 'var(--muted)' }}>
            <span>Taxable Value</span>
            <span>₹{taxable.toLocaleString('en-IN')}</span>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, fontSize: '12px' }}>
            <span>
              GST (3% - {isInterState ? 'IGST 3%' : 'CGST 1.5% + SGST 1.5%'})
            </span>
            <span>₹{totalTax.toLocaleString('en-IN')}</span>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={<Switch size="small" checked={isInterState} onChange={(e) => setIsInterState(e.target.checked)} />}
              label={<Typography sx={{ fontSize: '11px', color: 'var(--muted)' }}>Inter-state IGST</Typography>}
            />
            <span style={{ fontSize: '11px', color: '#73757c' }}>Round off: ₹{roundOff}</span>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              pt: 1.5,
              mt: 1,
              borderTop: '2px solid var(--line)',
              fontSize: '18px',
              fontWeight: 900
            }}
          >
            <span>Total Payable</span>
            <span style={{ color: 'var(--ink)' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
          </Box>
        </Box>
      </Box>

      {/* Action Buttons matching prototype */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3, pt: 2, borderTop: '1px solid var(--line)' }}>
        <Button variant="outlined" onClick={() => alert('Bill put on hold')}>
          Hold Bill
        </Button>
        <Button variant="outlined" onClick={() => alert('Draft saved successfully')}>
          Save Draft
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCompleteSale}
          disabled={loading || cartItems.length === 0}
          sx={{ fontWeight: 800, px: 3, py: 1 }}
        >
          ✓ Complete & Print
        </Button>
      </Box>

      {/* Add Customer Modal */}
      <Dialog open={openNewCustomerModal} onClose={() => setOpenNewCustomerModal(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>＋ Add New Customer</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, minWidth: 320 }}>
          <TextField
            label="Customer Name"
            size="small"
            fullWidth
            value={newCustName}
            onChange={(e) => setNewCustName(e.target.value)}
            autoFocus
          />
          <TextField
            label="Mobile Number (10-digit)"
            size="small"
            fullWidth
            value={newCustPhone}
            onChange={(e) => setNewCustPhone(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewCustomerModal(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleCreateCustomer}>
            Save Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Printable GST Invoice Modal */}
      <InvoiceReceiptModal
        open={openInvoiceModal}
        onClose={() => setOpenInvoiceModal(false)}
        sale={completedSale}
        shopSetting={shopSetting}
      />
    </Card>
  );
};
