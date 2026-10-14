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
  CircularProgress,
  Alert
} from '@mui/material';
import api from '../services/api.js';
import { MetricCard } from '../components/Common/MetricCard.jsx';
import { StatusBadge } from '../components/Common/StatusBadge.jsx';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    repeatCustomers: 0,
    newToday: 0,
    totalOutstanding: 0
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Customer Modal
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newCust, setNewCust] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    openingBalance: '0'
  });

  // Ledger Statement Modal
  const [openLedgerModal, setOpenLedgerModal] = useState(false);
  const [ledgerCustomer, setLedgerCustomer] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState(null);

  // Collect Payment Modal
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      if (res.success) {
        setCustomers(res.data);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    fetchCustomers();
  };

  const handleCreateCustomer = async () => {
    if (!newCust.name || !newCust.phone) {
      alert('Name and phone are required');
      return;
    }
    try {
      const res = await api.post('/customers', {
        ...newCust,
        openingBalance: parseFloat(newCust.openingBalance || 0)
      });
      if (res.success) {
        setOpenAddModal(false);
        setNewCust({ name: '', phone: '', email: '', city: '', address: '', openingBalance: '0' });
        fetchCustomers();
      }
    } catch (err) {
      alert(err.message || 'Error creating customer');
    }
  };

  const handleViewLedger = async (cust) => {
    setLedgerCustomer(cust);
    try {
      const res = await api.get(`/customers/${cust._id}/ledger`);
      if (res.success) {
        setLedgerEntries(res.data);
        setLedgerSummary(res.summary);
        setOpenLedgerModal(true);
      }
    } catch (err) {
      alert(err.message || 'Error fetching customer ledger');
    }
  };

  const handleRecordPayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    try {
      const res = await api.post(`/customers/${ledgerCustomer._id}/payment`, {
        amount: parseFloat(payAmount),
        paymentMethod: payMethod
      });
      if (res.success) {
        setOpenPaymentModal(false);
        setPayAmount('');
        // Refresh ledger
        handleViewLedger(ledgerCustomer);
        fetchCustomers();
      }
    } catch (err) {
      alert(err.message || 'Error recording payment');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 4 Metrics matching prototype */}
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <MetricCard label="Customers" value={metrics.totalCustomers ?? 0} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard label="Repeat Customers" value={metrics.repeatCustomers ?? 0} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard label="New Today" value={metrics.newToday ?? 0} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard
            label="Outstanding"
            value={`₹${(metrics.totalOutstanding || 0).toLocaleString('en-IN')}`}
            deltaColor="var(--red)"
          />
        </Grid>
      </Grid>

      {/* Customer CRM Card matching prototype */}
      <Card sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 800 }}>
            Customer CRM
          </Typography>
          <Button variant="contained" color="primary" onClick={() => setOpenAddModal(true)}>
            ＋ Add Customer
          </Button>
        </Box>

        {/* Search bar matching prototype */}
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>

        {/* Customer Table matching prototype */}
        <Box sx={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '12px' }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={30} color="primary" />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Bills</TableCell>
                  <TableCell>Total Purchase</TableCell>
                  <TableCell>Khata Balance</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.length > 0 ? (
                  customers.map((cust) => (
                    <TableRow key={cust._id}>
                      <TableCell>
                        <strong>{cust.name}</strong>
                        {cust.city && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'var(--muted)' }}>
                            {cust.city}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{cust.phone}</TableCell>
                      <TableCell>{cust.totalBillsCount || 0}</TableCell>
                      <TableCell>₹{(cust.totalPurchases || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        {cust.currentBalance < 0 ? (
                          <span style={{ color: 'var(--red)', fontWeight: 700 }}>
                            Due: ₹{Math.abs(cust.currentBalance).toLocaleString('en-IN')}
                          </span>
                        ) : cust.currentBalance > 0 ? (
                          <span style={{ color: 'var(--green)', fontWeight: 700 }}>
                            Advance: ₹{cust.currentBalance.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>Clear</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={cust.customerType || 'REGULAR'} />
                      </TableCell>
                      <TableCell align="center">
                        <Button size="small" variant="outlined" onClick={() => handleViewLedger(cust)}>
                          Ledger Statement
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: 'var(--muted)' }}>
                      No customer profiles found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      {/* Add Customer Modal */}
      <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>＋ Add New Customer</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Full Name*"
            size="small"
            fullWidth
            value={newCust.name}
            onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
            autoFocus
          />
          <TextField
            label="Mobile Number (10-digit)*"
            size="small"
            fullWidth
            value={newCust.phone}
            onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
          />
          <TextField
            label="City"
            size="small"
            fullWidth
            value={newCust.city}
            onChange={(e) => setNewCust({ ...newCust, city: e.target.value })}
          />
          <TextField
            label="Address"
            size="small"
            fullWidth
            value={newCust.address}
            onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
          />
          <TextField
            label="Opening Balance (+ for Advance, - for Due Amount)"
            type="number"
            size="small"
            fullWidth
            value={newCust.openingBalance}
            onChange={(e) => setNewCust({ ...newCust, openingBalance: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddModal(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleCreateCustomer}>
            Save Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Khata Ledger Statement Modal */}
      <Dialog open={openLedgerModal} onClose={() => setOpenLedgerModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Customer Khata Statement: {ledgerCustomer?.name}</span>
          <Button variant="contained" size="small" color="primary" onClick={() => setOpenPaymentModal(true)}>
            ＋ Collect Payment
          </Button>
        </DialogTitle>
        <DialogContent>
          {ledgerSummary && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 1.5, backgroundColor: 'var(--surface2)', borderRadius: '10px' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'var(--muted)' }}>Total Invoices Billed:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>₹{ledgerSummary.totalDebits?.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'var(--muted)' }}>Total Payments Received:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'var(--green)' }}>₹{ledgerSummary.totalCredits?.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'var(--muted)' }}>Current Status:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: ledgerSummary.closingBalance < 0 ? 'var(--red)' : 'var(--ink)' }}>
                  {ledgerSummary.closingBalance < 0
                    ? `Due: ₹${Math.abs(ledgerSummary.closingBalance).toLocaleString('en-IN')}`
                    : `Balance: ₹${ledgerSummary.closingBalance.toLocaleString('en-IN')}`}
                </Typography>
              </Box>
            </Box>
          )}

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Debit (Invoice)</TableCell>
                <TableCell align="right">Credit (Paid)</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledgerEntries.map((e) => (
                <TableRow key={e._id}>
                  <TableCell>{new Date(e.entryDate).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell><strong>{e.referenceNumber}</strong></TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell align="right">
                    {e.entryType === 'DEBIT' ? `₹${e.amount.toLocaleString('en-IN')}` : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'var(--green)' }}>
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
          <Button variant="outlined" onClick={() => window.print()}>
            🖨 Print Statement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Collect Payment Modal */}
      <Dialog open={openPaymentModal} onClose={() => setOpenPaymentModal(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Record Customer Payment Receipt</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, minWidth: 280 }}>
          <TextField
            label="Received Amount (₹)*"
            type="number"
            size="small"
            fullWidth
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            autoFocus
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'].map((m) => (
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
          <Button onClick={() => setOpenPaymentModal(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleRecordPayment}>
            Confirm Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
