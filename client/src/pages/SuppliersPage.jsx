import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import api from '../services/api.js';
import { MetricCard } from '../components/Common/MetricCard.jsx';
import { StatusBadge } from '../components/Common/StatusBadge.jsx';

export const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [metrics, setMetrics] = useState({
    totalSuppliers: 0,
    purchaseThisMonth: 0,
    pendingPayables: 0
  });
  const [loading, setLoading] = useState(true);

  // Add Supplier Modal
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newSupp, setNewSupp] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    city: '',
    openingBalance: '0'
  });

  // Supplier Ledger Modal
  const [openLedgerModal, setOpenLedgerModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState(null);

  // Pay Supplier Modal
  const [openPayModal, setOpenPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('BANK_TRANSFER');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      if (res.success) {
        setSuppliers(res.data);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async () => {
    if (!newSupp.name || !newSupp.phone) {
      alert('Supplier name and phone are required');
      return;
    }
    try {
      const res = await api.post('/suppliers', {
        ...newSupp,
        openingBalance: parseFloat(newSupp.openingBalance || 0)
      });
      if (res.success) {
        setOpenAddModal(false);
        setNewSupp({ name: '', contactPerson: '', phone: '', email: '', gstin: '', city: '', openingBalance: '0' });
        fetchSuppliers();
      }
    } catch (err) {
      alert(err.message || 'Error creating supplier');
    }
  };

  const handleViewLedger = async (supp) => {
    setSelectedSupplier(supp);
    try {
      const res = await api.get(`/suppliers/${supp._id}/ledger`);
      if (res.success) {
        setLedgerEntries(res.data);
        setLedgerSummary(res.summary);
        setOpenLedgerModal(true);
      }
    } catch (err) {
      alert(err.message || 'Error fetching supplier ledger');
    }
  };

  const handleDisbursePayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    try {
      const res = await api.post(`/suppliers/${selectedSupplier._id}/payment`, {
        amount: parseFloat(payAmount),
        paymentMethod: payMethod
      });
      if (res.success) {
        setOpenPayModal(false);
        setPayAmount('');
        handleViewLedger(selectedSupplier);
        fetchSuppliers();
      }
    } catch (err) {
      alert(err.message || 'Error disbursing supplier payment');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 3 Metrics */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <MetricCard label="Suppliers" value={metrics.totalSuppliers ?? 0} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Purchase This Month"
            value={`₹${((metrics.purchaseThisMonth || 0) / 100000).toFixed(2)}L`}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Pending Payables"
            value={`₹${(metrics.pendingPayables || 0).toLocaleString('en-IN')}`}
            deltaColor="var(--amber)"
          />
        </Grid>
      </Grid>

      {/* Supplier Section Card matching prototype */}
      <Card sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 800 }}>
            Suppliers
          </Typography>
          <Button variant="contained" color="primary" onClick={() => setOpenAddModal(true)}>
            ＋ Add Supplier
          </Button>
        </Box>

        {/* Supplier Table matching prototype */}
        <Box sx={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '12px' }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={30} color="primary" />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Last Purchase</TableCell>
                  <TableCell>Total Purchase</TableCell>
                  <TableCell>Payable</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.length > 0 ? (
                  suppliers.map((supp) => (
                    <TableRow key={supp._id}>
                      <TableCell>
                        <strong>{supp.name}</strong>
                        {supp.contactPerson && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'var(--muted)' }}>
                            {supp.contactPerson} · {supp.phone}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {supp.lastPurchaseDate ? new Date(supp.lastPurchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                      </TableCell>
                      <TableCell>
                        ₹{(supp.totalPurchased || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <strong>₹{(supp.currentPayable || 0).toLocaleString('en-IN')}</strong>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={supp.currentPayable > 0 ? 'PENDING' : 'CLEAR'} />
                      </TableCell>
                      <TableCell align="center">
                        <Button size="small" variant="outlined" onClick={() => handleViewLedger(supp)}>
                          Ledger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, color: 'var(--muted)' }}>
                      No suppliers registered yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      {/* Add Supplier Modal */}
      <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>＋ Add New Supplier / Karigar</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Supplier / Business Name*"
            size="small"
            fullWidth
            value={newSupp.name}
            onChange={(e) => setNewSupp({ ...newSupp, name: e.target.value })}
            autoFocus
          />
          <TextField
            label="Contact Person"
            size="small"
            fullWidth
            value={newSupp.contactPerson}
            onChange={(e) => setNewSupp({ ...newSupp, contactPerson: e.target.value })}
          />
          <TextField
            label="Phone Number*"
            size="small"
            fullWidth
            value={newSupp.phone}
            onChange={(e) => setNewSupp({ ...newSupp, phone: e.target.value })}
          />
          <TextField
            label="GSTIN (if applicable)"
            size="small"
            fullWidth
            value={newSupp.gstin}
            onChange={(e) => setNewSupp({ ...newSupp, gstin: e.target.value })}
          />
          <TextField
            label="Opening Pending Payable Amount (₹)"
            type="number"
            size="small"
            fullWidth
            value={newSupp.openingBalance}
            onChange={(e) => setNewSupp({ ...newSupp, openingBalance: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddModal(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleCreateSupplier}>
            Save Supplier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Supplier Ledger Modal */}
      <Dialog open={openLedgerModal} onClose={() => setOpenLedgerModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Supplier Ledger: {selectedSupplier?.name}</span>
          <Button variant="contained" size="small" color="primary" onClick={() => setOpenPayModal(true)}>
            Pay Supplier
          </Button>
        </DialogTitle>
        <DialogContent>
          {ledgerSummary && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 1.5, backgroundColor: 'var(--surface2)', borderRadius: '10px' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'var(--muted)' }}>Total Purchases:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>₹{ledgerSummary.totalPurchased?.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'var(--muted)' }}>Total Paid:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'var(--green)' }}>₹{ledgerSummary.totalPaid?.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'var(--muted)' }}>Current Payable:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: 'var(--amber)' }}>
                  ₹{ledgerSummary.currentPayable?.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
          )}

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Ref No</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Debit (Paid)</TableCell>
                <TableCell align="right">Credit (Purchased)</TableCell>
                <TableCell align="right">Payable Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledgerEntries.map((e) => (
                <TableRow key={e._id}>
                  <TableCell>{new Date(e.entryDate).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell><strong>{e.referenceNumber}</strong></TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell align="right" sx={{ color: 'var(--green)' }}>
                    {e.entryType === 'DEBIT' ? `₹${e.amount.toLocaleString('en-IN')}` : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {e.entryType === 'CREDIT' ? `₹${e.amount.toLocaleString('en-IN')}` : '—'}
                  </TableCell>
                  <TableCell align="right"><strong>₹{e.runningBalance.toLocaleString('en-IN')}</strong></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLedgerModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Pay Supplier Modal */}
      <Dialog open={openPayModal} onClose={() => setOpenPayModal(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Disburse Payment to Supplier</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, minWidth: 280 }}>
          <TextField
            label="Payment Amount (₹)*"
            type="number"
            size="small"
            fullWidth
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            autoFocus
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['BANK_TRANSFER', 'UPI', 'CASH'].map((m) => (
              <Button
                key={m}
                size="small"
                variant={payMethod === m ? 'contained' : 'outlined'}
                onClick={() => setPayMethod(m)}
              >
                {m}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPayModal(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleDisbursePayment}>
            Confirm Disbursement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
