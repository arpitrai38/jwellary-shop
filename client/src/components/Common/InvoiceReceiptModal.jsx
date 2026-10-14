import React from 'react';
import { Dialog, DialogContent, Box, Typography, Button, Divider, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

export const InvoiceReceiptModal = ({ open, onClose, sale, shopSetting }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const shopName = shopSetting?.shopName || 'Jewellery Store';
  const shopAddress = shopSetting?.address || '';
  const shopCity = shopSetting?.city ? `${shopSetting.city}${shopSetting.state ? `, ${shopSetting.state}` : ''}${shopSetting.pincode ? ` - ${shopSetting.pincode}` : ''}` : '';
  const shopPhone = shopSetting?.phone || '';
  const shopGstin = shopSetting?.gstin || '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <Typography variant="h3">Tax Invoice Preview</Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="contained" color="primary" onClick={handlePrint}>
            🖨 Print Invoice
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>

      <DialogContent sx={{ pt: 0 }}>
        <Box
          className="printable-area"
          sx={{
            p: 3,
            backgroundColor: '#ffffff',
            border: '1px solid #e8e4dc',
            borderRadius: '12px'
          }}
        >
          {/* Shop Header */}
          <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '2px solid #b7892b' }}>
            <Typography variant="h2" sx={{ fontFamily: 'Cinzel, Georgia, serif', letterSpacing: '2px', color: '#b7892b' }}>
              {shopName}
            </Typography>
            <Typography variant="body2" sx={{ color: '#555' }}>
              {shopAddress}, {shopCity}
            </Typography>
            <Typography variant="body2" sx={{ color: '#555', fontSize: '11px' }}>
              Phone: {shopPhone} | GSTIN: <strong>{shopGstin}</strong> | HSN Code: 7113
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1, letterSpacing: '1px' }}>
              GST TAX INVOICE
            </Typography>
          </Box>

          {/* Invoice & Customer Meta */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 2, fontSize: '12px' }}>
            <Box>
              <Typography variant="body2"><strong>Invoice No:</strong> #{sale.invoiceNumber}</Typography>
              <Typography variant="body2"><strong>Date:</strong> {new Date(sale.invoiceDate).toLocaleString('en-IN')}</Typography>
              <Typography variant="body2"><strong>Cashier:</strong> {sale.cashierName || 'Staff'}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2"><strong>Billed To:</strong> {sale.customerSnapshot?.name || 'Walk-in Customer'}</Typography>
              {sale.customerSnapshot?.phone && (
                <Typography variant="body2"><strong>Phone:</strong> {sale.customerSnapshot.phone}</Typography>
              )}
              {sale.customerSnapshot?.address && (
                <Typography variant="body2">{sale.customerSnapshot.address}</Typography>
              )}
            </Box>
          </Box>

          {/* Line Items Table */}
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Item & SKU</TableCell>
                <TableCell>Purity</TableCell>
                <TableCell align="right">Gross Wt</TableCell>
                <TableCell align="right">Net Gold Wt</TableCell>
                <TableCell align="right">Gold Rate (₹/g)</TableCell>
                <TableCell align="right">Making & Wastage</TableCell>
                <TableCell align="right">Line Total (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sale.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <strong>{item.name}</strong>
                    <Typography variant="caption" sx={{ display: 'block', color: 'var(--muted)' }}>
                      {item.itemId} {item.huid ? `· HUID: ${item.huid}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.purity}</TableCell>
                  <TableCell align="right">{item.grossWeight}g</TableCell>
                  <TableCell align="right"><strong>{item.netGoldWeight}g</strong></TableCell>
                  <TableCell align="right">₹{item.goldRatePerGram?.toLocaleString('en-IN')}</TableCell>
                  <TableCell align="right">₹{(item.makingCharge + (item.wastageValue || 0))?.toLocaleString('en-IN')}</TableCell>
                  <TableCell align="right"><strong>₹{item.lineTotal?.toLocaleString('en-IN')}</strong></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals & Tax Calculation Breakdown */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ width: '320px', display: 'flex', flexDirection: 'column', gap: 0.8, fontSize: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal ({sale.totalPieces} pcs, {sale.totalNetWeight}g):</span>
                <span>₹{sale.subtotal?.toLocaleString('en-IN')}</span>
              </Box>
              {sale.discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#b74444' }}>
                  <span>Discount:</span>
                  <span>- ₹{sale.discount?.toLocaleString('en-IN')}</span>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>Taxable Amount:</span>
                <span>₹{sale.taxableAmount?.toLocaleString('en-IN')}</span>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              {sale.isInterState ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>IGST ({sale.igstRate}%):</span>
                  <span>₹{sale.igstAmount?.toLocaleString('en-IN')}</span>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CGST ({sale.cgstRate}%):</span>
                    <span>₹{sale.cgstAmount?.toLocaleString('en-IN')}</span>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>SGST ({sale.sgstRate}%):</span>
                    <span>₹{sale.sgstAmount?.toLocaleString('en-IN')}</span>
                  </Box>
                </>
              )}
              {sale.roundOff !== 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#73757c' }}>
                  <span>Round off:</span>
                  <span>{sale.roundOff > 0 ? `+ ₹${sale.roundOff}` : `- ₹${Math.abs(sale.roundOff)}`}</span>
                </Box>
              )}
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800 }}>
                <span>Grand Total:</span>
                <span style={{ color: '#b7892b' }}>₹{sale.grandTotal?.toLocaleString('en-IN')}</span>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'var(--green)', fontWeight: 600 }}>
                <span>Amount Paid:</span>
                <span>₹{sale.paidAmount?.toLocaleString('en-IN')}</span>
              </Box>
              {sale.balanceDue > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#b74444', fontWeight: 700 }}>
                  <span>Balance Due:</span>
                  <span>₹{sale.balanceDue?.toLocaleString('en-IN')}</span>
                </Box>
              )}
            </Box>
          </Box>

          {/* Footer Terms & Sign */}
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px dashed #d9d5cc', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px', color: '#73757c' }}>
            <Box>
              <Typography variant="caption" sx={{ display: 'block' }}>• Gold jewellery tested for hallmark compliance.</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>• Goods once sold can be exchanged within 7 days with original invoice.</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>• Thank you for visiting Aarna Jewar!</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', width: '150px' }}>
              <Box sx={{ borderBottom: '1px solid #171a1f', height: '35px' }}></Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mt: 0.5, display: 'block' }}>Authorised Signatory</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
