import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import api from '../services/api.js';
import { ThermalTag } from '../components/Common/ThermalTag.jsx';
import { StatusBadge } from '../components/Common/StatusBadge.jsx';

export const TaggingPage = () => {
  const [currentProduct, setCurrentProduct] = useState(null);
  const [tagStatus, setTagStatus] = useState('PENDING');
  const [s3Done, setS3Done] = useState(false);
  const [s4Done, setS4Done] = useState(false);
  const [queueItems, setQueueItems] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  // Verify scan dialog
  const [openVerifyDialog, setOpenVerifyDialog] = useState(false);
  const [scanInputCode, setScanInputCode] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');

  // Bulk queue dialog
  const [openQueueDialog, setOpenQueueDialog] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products?limit=50');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const items = res.data;
        setQueueItems(items);
        const firstPending = items.find((p) => p.tagStatus === 'PENDING') || items[0];
        setCurrentProduct({
          ...firstPending,
          sellingPrice: firstPending.fixedSellingPrice || firstPending.sellingPriceEstimate || 0
        });
        setTagStatus(firstPending.tagStatus || 'PENDING');
        if (firstPending.tagStatus === 'PRINTED') setS3Done(true);
        if (firstPending.tagStatus === 'VERIFIED') {
          setS3Done(true);
          setS4Done(true);
        }

        // Group by category
        const groups = {};
        items.forEach((p) => {
          const cat = p.categoryName || 'Other';
          groups[cat] = (groups[cat] || 0) + 1;
        });
        setCategoryBreakdown(Object.entries(groups).map(([name, count]) => ({ name, count })));
      } else {
        setQueueItems([]);
        setCurrentProduct(null);
        setCategoryBreakdown([]);
      }
    } catch (err) {
      console.error('Error fetching tagging items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSelectProduct = (prod) => {
    if (!prod) return;
    setCurrentProduct({
      ...prod,
      sellingPrice: prod.fixedSellingPrice || prod.sellingPriceEstimate || 0
    });
    setTagStatus(prod.tagStatus || 'PENDING');
    setS3Done(prod.tagStatus === 'PRINTED' || prod.tagStatus === 'VERIFIED');
    setS4Done(prod.tagStatus === 'VERIFIED');
  };

  const handlePrintTag = async () => {
    setTagStatus('PRINTED');
    setS3Done(true);

    if (currentProduct._id) {
      try {
        await api.patch(`/products/${currentProduct._id}/tag-status`, { status: 'PRINTED' });
      } catch {
        // ignore
      }
    }

    setModalTitle('Tag sent to printer');
    setModalContent(
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'var(--muted)', mb: 2 }}>
          Thermal print command generated for label (50mm × 25mm).
        </Typography>
        <ThermalTag
          shopName="AARNA JEWAR"
          itemName={currentProduct.name}
          itemId={currentProduct.itemId}
          barcode={currentProduct.barcode}
          price={currentProduct.sellingPrice}
          purity={currentProduct.purity}
          netWeight={currentProduct.netGoldWeight}
        />
        <Typography variant="body2" sx={{ color: 'var(--muted)', mt: 2, fontSize: '11px' }}>
          Next: attach this tag to the physical jewellery piece, then use <strong>Scan / Verify</strong>.
        </Typography>
      </Box>
    );
    setOpenModal(true);
  };

  const handleOpenVerify = () => {
    setScanInputCode('');
    setVerifyMessage('');
    setOpenVerifyDialog(true);
  };

  const handleVerifyScanSubmit = async (e) => {
    e?.preventDefault();
    const code = scanInputCode.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await api.post(`/products/verify/${code}`);
      if (res.success) {
        setTagStatus('VERIFIED');
        setS4Done(true);
        setVerifyMessage(`✓ Tag Verified: ${code} matched successfully. Physical tag is now officially linked to inventory.`);
        setTimeout(() => {
          setOpenVerifyDialog(false);
        }, 1500);
      }
    } catch (err) {
      setVerifyMessage(`Error: ${err.message || 'Tag barcode not found'}`);
    }
  };

  const handleBulkPrint = () => {
    setModalTitle('Bulk Tag Queue');
    setModalContent(
      <Box sx={{ fontSize: '13px' }}>
        <Typography variant="body1" sx={{ fontWeight: 800, mb: 1 }}>
          {queueItems.length} tags queued for thermal label generation:
        </Typography>
        {categoryBreakdown.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {categoryBreakdown.map((c) => (
              <li key={c.name}>
                {c.count} {c.name}
              </li>
            ))}
          </ul>
        ) : (
          <Typography variant="body2" sx={{ color: 'var(--muted)' }}>
            No items queued yet.
          </Typography>
        )}
        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'var(--muted)' }}>
          Thermal print sequence ready. Select printer and click Start Print.
        </Typography>
      </Box>
    );
    setOpenModal(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Grid container spacing={2}>
        {/* Left Card: Smart Tagging Station matching prototype */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2.5, height: '100%', boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 800 }}>
                Smart Tagging Station
              </Typography>
              <StatusBadge status={tagStatus} />
            </Box>

            {/* Current Product Card */}
            {currentProduct ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  borderRadius: '12px',
                  backgroundColor: 'var(--surface2)',
                  border: '1px solid var(--line)'
                }}
              >
                <Box
                  sx={{
                    width: 58,
                    height: 58,
                    borderRadius: '10px',
                    background: 'linear-gradient(145deg, #f5e6b8, #b98520)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '11px',
                    letterSpacing: '1px'
                  }}
                >
                  {currentProduct.categoryName?.toUpperCase() || 'ITEM'}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'var(--muted)', fontSize: '10px' }}>
                    Current physical item
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, fontSize: '14px' }}>
                    {currentProduct.itemId} · {currentProduct.name}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, fontSize: '17px', color: 'var(--ink)', my: 0.2 }}>
                    ₹{(currentProduct.sellingPrice || 0).toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--muted)', fontSize: '10px' }}>
                    Cost ₹{(currentProduct.purchaseCost || 0).toLocaleString('en-IN')} · Barcode {currentProduct.barcode || currentProduct.itemId}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center', backgroundColor: 'var(--surface2)', borderRadius: '12px' }}>
                <Typography variant="body2" sx={{ color: 'var(--muted)', fontWeight: 600 }}>
                  No items in stock to tag. Please add stock or import items to generate barcodes.
                </Typography>
              </Box>
            )}

            {/* 4 Steps matching prototype */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 2 }}>
              <span className={`step-badge ${currentProduct ? 'done' : ''}`}>1 · Item saved</span>
              <span className={`step-badge ${currentProduct ? 'done' : ''}`}>2 · Barcode generated</span>
              <span className={`step-badge ${s3Done ? 'done' : ''}`}>3 · Print tag</span>
              <span className={`step-badge ${s4Done ? 'done' : ''}`}>4 · Scan verify</span>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePrintTag}
                disabled={!currentProduct}
                sx={{ fontWeight: 700 }}
              >
                🖨 Print Tag
              </Button>
              <Button
                variant="outlined"
                onClick={handleOpenVerify}
                disabled={!currentProduct}
                sx={{ fontWeight: 700 }}
              >
                ▣ Scan / Verify
              </Button>
            </Box>

            {/* Live Tag Preview Paper */}
            {currentProduct && (
              <Box sx={{ backgroundColor: '#f2f0eb', p: 2, borderRadius: '12px' }}>
                <ThermalTag
                  shopName="AARNA JEWAR"
                  itemName={currentProduct.name}
                  itemId={currentProduct.itemId}
                  barcode={currentProduct.barcode}
                  price={currentProduct.sellingPrice}
                  purity={currentProduct.purity}
                  netWeight={currentProduct.netGoldWeight}
                />
              </Box>
            )}
          </Card>
        </Grid>

        {/* Right Card: Controlled Bulk Print */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2.5, height: '100%', boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 800 }}>
                Controlled Bulk Print
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--muted)' }}>
                No random tags
              </Typography>
            </Box>

            <Box sx={{ backgroundColor: 'var(--goldbg)', border: '1px solid #ead9ac', borderRadius: '14px', p: 2, mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 800, color: '#66501d', mb: 0.5 }}>
                {queueItems.length} items ready
              </Typography>
              <Typography variant="body2" sx={{ color: '#66501d', fontSize: '12px', lineHeight: 1.5 }}>
                {categoryBreakdown.length > 0
                  ? categoryBreakdown.map((c) => `${c.count} ${c.name}`).join(' · ')
                  : 'No items in the tagging queue. Add pieces through Stock In to print thermal tags.'}
              </Typography>
            </Box>

            <Box sx={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '12px', mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Group</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Queue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoryBreakdown.length > 0 ? (
                    categoryBreakdown.map((c) => (
                      <TableRow key={c.name}>
                        <TableCell>
                          <strong>{c.name}</strong>
                        </TableCell>
                        <TableCell>{c.count}</TableCell>
                        <TableCell>
                          <span className="badge badge-blue">READY</span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ textAlign: 'center', py: 2, color: 'var(--muted)' }}>
                        Queue empty
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <Button variant="contained" color="secondary" onClick={handleBulkPrint} sx={{ fontWeight: 700 }}>
                🖨 Print Selected Tags
              </Button>
              <Button variant="outlined" onClick={() => setOpenQueueDialog(true)} sx={{ fontWeight: 700 }}>
                View Queue
              </Button>
            </Box>

            <Typography variant="caption" sx={{ color: 'var(--muted)', display: 'block', fontSize: '11px' }}>
              Final build supports configurable tag sizes (50×25mm, 38×25mm), custom field order, and barcode printer integration.
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Modal Dialog for Prototype Actions */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{modalTitle}</DialogTitle>
        <DialogContent>{modalContent}</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Barcode Scan Verify Dialog */}
      <Dialog open={openVerifyDialog} onClose={() => setOpenVerifyDialog(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>▣ Hardware Barcode Scanner Verification</DialogTitle>
        <DialogContent sx={{ minWidth: 320 }}>
          <Typography variant="body2" sx={{ color: 'var(--muted)', mb: 2 }}>
            Point your handheld laser barcode scanner at the printed jewellery tag, or enter the barcode:
          </Typography>
          <form onSubmit={handleVerifyScanSubmit}>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. JWL00126"
              value={scanInputCode}
              onChange={(e) => setScanInputCode(e.target.value)}
              autoFocus
            />
            {verifyMessage && (
              <Alert severity={verifyMessage.startsWith('✓') ? 'success' : 'error'} sx={{ mt: 2, fontSize: '12px' }}>
                {verifyMessage}
              </Alert>
            )}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setOpenVerifyDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                Verify
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>

      {/* Queue View Dialog */}
      <Dialog open={openQueueDialog} onClose={() => setOpenQueueDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Tag Queue List</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queueItems.length > 0 ? (
                queueItems.map((q) => (
                  <TableRow
                    key={q._id || q.itemId}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      handleSelectProduct(q);
                      setOpenQueueDialog(false);
                    }}
                  >
                    <TableCell>
                      <strong>{q.itemId}</strong>
                    </TableCell>
                    <TableCell>{q.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={q.tagStatus || q.status || 'PENDING'} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: 'center', py: 2, color: 'var(--muted)' }}>
                    No items in queue
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQueueDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
