import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Switch,
  FormControlLabel,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import api from '../services/api.js';

export const SettingsPage = () => {
  const [shopSetting, setShopSetting] = useState(null);
  const [metalRates, setMetalRates] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Modals
  const [openPricingModal, setOpenPricingModal] = useState(false);
  const [openTagModal, setOpenTagModal] = useState(false);
  const [openPrinterModal, setOpenPrinterModal] = useState(false);
  const [openUsersModal, setOpenUsersModal] = useState(false);
  const [openAddUserModal, setOpenAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    role: 'CASHIER',
    email: ''
  });
  const [userMsg, setUserMsg] = useState('');

  // Rate update state
  const [rate24K, setRate24K] = useState(7450);
  const [rate22K, setRate22K] = useState(6850);
  const [rate18K, setRate18K] = useState(5600);
  const [rate14K, setRate14K] = useState(4350);
  const [rateNotes, setRateNotes] = useState('Standard Sarafa Bazar morning rate update');
  const [rateMsg, setRateMsg] = useState('');

  // Shop profile state
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [shopSavedMsg, setShopSavedMsg] = useState('');

  // Tag template settings
  const [showShopName, setShowShopName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showWeight, setShowWeight] = useState(true);
  const [showPurity, setShowPurity] = useState(true);

  // Printer settings
  const [tagWidth, setTagWidth] = useState(50);
  const [tagHeight, setTagHeight] = useState(25);

  const fetchSettings = async () => {
    try {
      const [settingsRes, ratesRes, usersRes] = await Promise.all([
        api.get('/settings'),
        api.get('/metal-rates/latest'),
        api.get('/users').catch(() => ({ success: false, data: [] }))
      ]);

      if (settingsRes.success && settingsRes.data) {
        setShopSetting(settingsRes.data);
        setShopName(settingsRes.data.shopName || '');
        setPhone(settingsRes.data.phone || '');
        setGstin(settingsRes.data.gstin || '');
        setAddress(settingsRes.data.address || '');
        setShowShopName(settingsRes.data.showShopNameOnTag ?? true);
        setShowPrice(settingsRes.data.showPriceOnTag ?? true);
        setShowWeight(settingsRes.data.showWeightOnTag ?? true);
        setShowPurity(settingsRes.data.showPurityOnTag ?? true);
        setTagWidth(settingsRes.data.tagWidthMm || 50);
        setTagHeight(settingsRes.data.tagHeightMm || 25);
      }

      if (ratesRes.success && ratesRes.data) {
        setMetalRates(ratesRes.data);
        ratesRes.data.forEach((r) => {
          if (r.purity === '24K') setRate24K(r.ratePerGram);
          if (r.purity === '22K') setRate22K(r.ratePerGram);
          if (r.purity === '18K') setRate18K(r.ratePerGram);
          if (r.purity === '14K') setRate14K(r.ratePerGram);
        });
      }

      if (usersRes.success) {
        setUsersList(usersRes.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateRates = async () => {
    try {
      const res = await api.post('/metal-rates/update', {
        rates: [
          { purity: '24K', ratePerGram: parseFloat(rate24K) },
          { purity: '22K', ratePerGram: parseFloat(rate22K) },
          { purity: '18K', ratePerGram: parseFloat(rate18K) },
          { purity: '14K', ratePerGram: parseFloat(rate14K) }
        ],
        notes: rateNotes
      });
      if (res.success) {
        setRateMsg('✓ Gold rates updated successfully! Historical invoices remain unchanged.');
        setTimeout(() => {
          setOpenPricingModal(false);
          setRateMsg('');
          fetchSettings();
        }, 1500);
      }
    } catch (err) {
      alert(err.message || 'Error updating gold rates');
    }
  };

  const handleSaveShopProfile = async () => {
    try {
      const res = await api.patch('/settings', {
        shopName,
        phone,
        gstin,
        address,
        showShopNameOnTag: showShopName,
        showPriceOnTag: showPrice,
        showWeightOnTag: showWeight,
        showPurityOnTag: showPurity,
        tagWidthMm: tagWidth,
        tagHeightMm: tagHeight
      });
      if (res.success) {
        setShopSavedMsg('✓ Shop details & settings saved successfully');
        setTimeout(() => setShopSavedMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Error saving settings');
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.password) {
      alert('Please fill Name, Login Username, and Password');
      return;
    }
    if (newUser.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    try {
      const res = await api.post('/users', newUser);
      if (res.success) {
        setUserMsg(`✓ Staff account "${newUser.username}" created successfully!`);
        setNewUser({ name: '', username: '', password: '', role: 'CASHIER', email: '' });
        setOpenAddUserModal(false);
        fetchSettings();
        setTimeout(() => setUserMsg(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Error creating staff account');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await api.patch(`/users/${userId}/toggle-status`);
      if (res.success) {
        fetchSettings();
      }
    } catch (err) {
      alert(err.message || 'Error updating user status');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 4 Cards matching prototype 2-column grid */}
      <Grid container spacing={2}>
        {/* Pricing Card */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 800 }}>
                  Pricing & Gold Rates
                </Typography>
                <span className="badge badge-blue">FLEXIBLE</span>
              </Box>
              <Typography variant="body2" sx={{ color: 'var(--muted)', fontSize: '12px', mb: 2 }}>
                Manual selling price remains available. Enter purity-specific rates (24K, 22K, 18K, 14K) with audit timestamps.
              </Typography>

              {/* Current Rates Preview */}
              <Box sx={{ p: 1.5, backgroundColor: 'var(--surface2)', borderRadius: '10px', mb: 2, fontSize: '12px' }}>
                <Typography variant="caption" sx={{ color: 'var(--muted)', fontWeight: 700, display: 'block', mb: 0.5 }}>
                  ACTIVE RATES TODAY:
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>24K: <strong>₹{rate24K}/g</strong></span>
                  <span>22K: <strong>₹{rate22K}/g</strong></span>
                  <span>18K: <strong>₹{rate18K}/g</strong></span>
                </Box>
              </Box>
            </Box>

            <Button variant="contained" color="primary" onClick={() => setOpenPricingModal(true)} sx={{ fontWeight: 700 }}>
              Configure Rules & Rates
            </Button>
          </Card>
        </Grid>

        {/* Tag Template Card */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 800 }}>
                  Tag Template
                </Typography>
                <span className="badge badge-blue">CONFIGURABLE</span>
              </Box>
              <Typography variant="body2" sx={{ color: 'var(--muted)', fontSize: '12px', mb: 2 }}>
                Choose Item ID, barcode, selling price, weight, purity and other fields for thermal labels.
              </Typography>
            </Box>

            <Button variant="outlined" onClick={() => setOpenTagModal(true)} sx={{ fontWeight: 700 }}>
              Edit Template
            </Button>
          </Card>
        </Grid>

        {/* Printer & Scanner Card */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 800 }}>
                  Printer & Scanner
                </Typography>
                <span className="badge badge-blue">DEVICE AGNOSTIC</span>
              </Box>
              <Typography variant="body2" sx={{ color: 'var(--muted)', fontSize: '12px', mb: 2 }}>
                Label dimensions and printer settings are configurable so hardware can change later.
              </Typography>
            </Box>

            <Button variant="outlined" onClick={() => setOpenPrinterModal(true)} sx={{ fontWeight: 700 }}>
              Printer Setup
            </Button>
          </Card>
        </Grid>

        {/* Users & Permissions Card */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 800 }}>
                  Users & Permissions
                </Typography>
                <span className="badge badge-blue">ROLE BASED</span>
              </Box>
              <Typography variant="body2" sx={{ color: 'var(--muted)', fontSize: '12px', mb: 2 }}>
                Owner, Manager, Cashier and Stock roles. Sensitive actions can be restricted.
              </Typography>
            </Box>

            <Button variant="outlined" onClick={() => setOpenUsersModal(true)} sx={{ fontWeight: 700 }}>
              Manage Users
            </Button>
          </Card>
        </Grid>
      </Grid>

      {/* Shop Profile Section */}
      <Card sx={{ p: 2.5 }}>
        <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 800, mb: 2 }}>
          Shop Profile & Invoicing Details
        </Typography>

        {shopSavedMsg && <Alert severity="success" sx={{ mb: 2 }}>{shopSavedMsg}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Jewellery Shop Name"
              size="small"
              fullWidth
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Shop Phone"
              size="small"
              fullWidth
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Shop Address"
              size="small"
              fullWidth
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="GSTIN Number"
              size="small"
              fullWidth
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" color="primary" onClick={handleSaveShopProfile} sx={{ fontWeight: 700 }}>
            Save Shop Settings
          </Button>
        </Box>
      </Card>

      {/* Modal: Configure Gold Rates */}
      <Dialog open={openPricingModal} onClose={() => setOpenPricingModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Update Manual Gold Rates</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="caption" sx={{ color: 'var(--muted)' }}>
            Enter new rate per gram. Applied rates are snapshotted on every bill and never change historical invoices.
          </Typography>

          {rateMsg && <Alert severity="success">{rateMsg}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="24K (999 Pure) Rate (₹/g)"
                type="number"
                size="small"
                fullWidth
                value={rate24K}
                onChange={(e) => setRate24K(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="22K (916 Standard) Rate (₹/g)"
                type="number"
                size="small"
                fullWidth
                value={rate22K}
                onChange={(e) => setRate22K(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="18K (750 Hallmark) Rate (₹/g)"
                type="number"
                size="small"
                fullWidth
                value={rate18K}
                onChange={(e) => setRate18K(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="14K (585) Rate (₹/g)"
                type="number"
                size="small"
                fullWidth
                value={rate14K}
                onChange={(e) => setRate14K(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Rate Update Note"
                size="small"
                fullWidth
                value={rateNotes}
                onChange={(e) => setRateNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPricingModal(false)}>Close</Button>
          <Button variant="contained" color="primary" onClick={handleUpdateRates}>
            Update Active Rates
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Tag Template */}
      <Dialog open={openTagModal} onClose={() => setOpenTagModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Tag Template Fields</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={<Switch checked={showShopName} onChange={(e) => setShowShopName(e.target.checked)} />}
            label="Show Shop Name (AARNA JEWAR)"
          />
          <FormControlLabel
            control={<Switch checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} />}
            label="Show Selling Price"
          />
          <FormControlLabel
            control={<Switch checked={showWeight} onChange={(e) => setShowWeight(e.target.checked)} />}
            label="Show Net Weight"
          />
          <FormControlLabel
            control={<Switch checked={showPurity} onChange={(e) => setShowPurity(e.target.checked)} />}
            label="Show Gold Purity (22K)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTagModal(false)}>Close</Button>
          <Button variant="contained" color="primary" onClick={() => setOpenTagModal(false)}>
            Save Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Printer Setup */}
      <Dialog open={openPrinterModal} onClose={() => setOpenPrinterModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Printer & Label Setup</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Label Width (mm)"
            type="number"
            size="small"
            value={tagWidth}
            onChange={(e) => setTagWidth(e.target.value)}
          />
          <TextField
            label="Label Height (mm)"
            type="number"
            size="small"
            value={tagHeight}
            onChange={(e) => setTagHeight(e.target.value)}
          />
          <Button variant="outlined" onClick={() => window.print()}>
            🖨 Test Print Current Label
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPrinterModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Manage Users */}
      <Dialog open={openUsersModal} onClose={() => setOpenUsersModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
          <span>Users & Staff Permissions</span>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => setOpenAddUserModal(true)}
          >
            ＋ Add Staff Member
          </Button>
        </DialogTitle>
        <DialogContent>
          {userMsg && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {userMsg}
            </Alert>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersList.length > 0 ? (
                usersList.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell><strong>{u.name}</strong></TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>
                      <span className={`badge ${u.role === 'OWNER' ? 'badge-amber' : u.role === 'MANAGER' ? 'badge-blue' : 'badge-green'}`}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`badge ${u.isActive !== false ? 'badge-green' : 'badge-amber'}`}>
                        {u.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      {u.role !== 'OWNER' ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color={u.isActive !== false ? 'warning' : 'success'}
                          onClick={() => handleToggleUserStatus(u._id)}
                        >
                          {u.isActive !== false ? 'Deactivate' : 'Activate'}
                        </Button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Owner (Primary)</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2, color: 'var(--muted)' }}>
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUsersModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Add New Staff Member */}
      <Dialog open={openAddUserModal} onClose={() => setOpenAddUserModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>＋ Add Staff / Cashier Account</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'var(--muted)', fontSize: '12px' }}>
            Staff members can log in simultaneously from any phone, tablet, or desktop connected to your shop network.
          </Typography>
          <TextField
            label="Full Name*"
            size="small"
            fullWidth
            placeholder="e.g. Rahul Sharma"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            autoFocus
          />
          <TextField
            label="Login Username*"
            size="small"
            fullWidth
            placeholder="e.g. cashier1"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toLowerCase().trim() })}
          />
          <TextField
            label="Password (min 6 characters)*"
            type="password"
            size="small"
            fullWidth
            placeholder="••••••"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <TextField
            label="Email Address (optional)"
            type="email"
            size="small"
            fullWidth
            placeholder="e.g. rahul@jewar.com"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Role & Permissions</InputLabel>
            <Select
              value={newUser.role}
              label="Role & Permissions"
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <MenuItem value="CASHIER">CASHIER (Rapid POS, Billing, Cash/Khata Collection)</MenuItem>
              <MenuItem value="MANAGER">MANAGER (Billing, Stock, Purchase, Reports)</MenuItem>
              <MenuItem value="STOCK_STAFF">STOCK_STAFF (Inward Stock & Barcoding)</MenuItem>
              <MenuItem value="OWNER">OWNER (Full Store Admin Access)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAddUserModal(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleCreateUser}>
            Create Staff Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
