import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  Grid,
  Alert
} from '@mui/material';
import api from '../services/api.js';

export const StockInPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [purchaseReference, setPurchaseReference] = useState('');
  const [pricingMode, setPricingMode] = useState('Manual Selling Price');
  const [categoryName, setCategoryName] = useState('Ring');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [stoneWeight, setStoneWeight] = useState('0');
  const [purity, setPurity] = useState('22K');
  const [huid, setHuid] = useState('');

  const [currentStep, setCurrentStep] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppRes, catRes] = await Promise.all([
          api.get('/suppliers'),
          api.get('/categories')
        ]);
        if (suppRes.success && suppRes.data.length > 0) {
          setSuppliers(suppRes.data);
          setSupplierId(suppRes.data[0]._id);
        }
        if (catRes.success) {
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error('Error fetching stock in dropdowns:', err);
      }
    };
    fetchData();
  }, []);

  const handleCostChange = (val) => {
    setPurchaseCost(val);
    const cost = parseFloat(val) || 0;
    if (pricingMode === 'Pricing Rule — Cost + %') {
      setSellingPrice(String(Math.round(cost * 1.35)));
    } else if (pricingMode === 'Pricing Rule — Cost + Amount') {
      setSellingPrice(String(cost + 3500));
    }
  };

  const handleSaveAndContinue = async () => {
    if (!supplierId) {
      alert('Please select or create a supplier first');
      return;
    }
    if (!grossWeight || parseFloat(grossWeight) <= 0) {
      alert('Please enter a valid Gross Weight in grams');
      return;
    }

    setLoading(true);
    setSuccessMsg('');

    try {
      const selectedSupp = suppliers.find((s) => s._id === supplierId);
      const payload = {
        supplierId,
        supplierName: selectedSupp?.name || 'Supplier',
        supplierInvoiceNo: purchaseReference,
        pricingMode,
        items: [
          {
            name: `${categoryName} Gold Piece`,
            categoryName,
            purity,
            grossWeight: parseFloat(grossWeight),
            stoneWeight: parseFloat(stoneWeight) || 0,
            purchaseCost: parseFloat(purchaseCost) || 0,
            sellingPrice: parseFloat(sellingPrice) || 0,
            huid
          }
        ]
      };

      const res = await api.post('/purchases/guided-inward', payload);
      if (res.success) {
        setCurrentStep(4);
        setSuccessMsg(`✓ Stock Inward Saved! New Item ID and Barcode generated successfully. Redirecting to Tagging Station...`);
        setTimeout(() => {
          navigate('/tagging');
        }, 1800);
      }
    } catch (err) {
      alert(err.message || 'Error processing inward stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ p: 2.5 }}>
      {/* Header matching prototype */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 800 }}>
          Stock In — Guided Process
        </Typography>
        <span className="badge badge-blue">NEW PURCHASE</span>
      </Box>

      {/* 5 Guided steps matching prototype */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <span className={`step-badge ${currentStep >= 1 ? 'done' : ''}`}>1 · Supplier</span>
        <span className={`step-badge ${currentStep >= 2 ? 'done' : ''}`}>2 · Items</span>
        <span className={`step-badge ${currentStep >= 3 ? 'done' : ''}`}>3 · Pricing</span>
        <span className={`step-badge ${currentStep >= 4 ? 'done' : ''}`}>4 · Tags</span>
        <span className={`step-badge ${currentStep >= 5 ? 'done' : ''}`}>5 · Confirm</span>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMsg}
        </Alert>
      )}

      {/* Form Grid matching prototype */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'var(--muted)', fontWeight: 600 }}>
              Supplier*
            </Typography>
            <Button size="small" onClick={() => navigate('/suppliers')} sx={{ fontSize: '10px', py: 0 }}>
              ＋ New Supplier
            </Button>
          </Box>
          <Select
            size="small"
            fullWidth
            value={supplierId}
            displayEmpty
            onChange={(e) => setSupplierId(e.target.value)}
          >
            {suppliers.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {s.name} ({s.phone})
              </MenuItem>
            ))}
            {suppliers.length === 0 && (
              <MenuItem value="" disabled>
                -- No suppliers found (click + New Supplier) --
              </MenuItem>
            )}
          </Select>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="caption" sx={{ color: 'var(--muted)', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Purchase Reference
          </Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="Supplier bill / reference"
            value={purchaseReference}
            onChange={(e) => setPurchaseReference(e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="caption" sx={{ color: 'var(--muted)', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Pricing Mode
          </Typography>
          <Select
            size="small"
            fullWidth
            value={pricingMode}
            onChange={(e) => {
              setPricingMode(e.target.value);
              handleCostChange(purchaseCost);
            }}
          >
            <MenuItem value="Manual Selling Price">Manual Selling Price</MenuItem>
            <MenuItem value="Pricing Rule — Cost + %">Pricing Rule — Cost + % (35% Markup)</MenuItem>
            <MenuItem value="Pricing Rule — Cost + Amount">Pricing Rule — Cost + Amount (₹3,500)</MenuItem>
            <MenuItem value="Weight-based">Weight-based (Live Rate × Weight + Making)</MenuItem>
          </Select>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="caption" sx={{ color: 'var(--muted)', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Category
          </Typography>
          <Select
            size="small"
            fullWidth
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          >
            {categories.map((c) => (
              <MenuItem key={c._id} value={c.name}>
                {c.name}
              </MenuItem>
            ))}
            {categories.length === 0 && (
              <>
                <MenuItem value="Ring">Ring</MenuItem>
                <MenuItem value="Bangle">Bangle</MenuItem>
                <MenuItem value="Jhumka">Jhumka</MenuItem>
                <MenuItem value="Locket">Locket</MenuItem>
                <MenuItem value="Tops">Tops</MenuItem>
              </>
            )}
          </Select>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="caption" sx={{ color: 'var(--muted)', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Gross Weight (g) & Purity
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={grossWeight}
              onChange={(e) => setGrossWeight(e.target.value)}
              placeholder="e.g. 1.55"
            />
            <Select size="small" value={purity} onChange={(e) => setPurity(e.target.value)} sx={{ width: 110 }}>
              <MenuItem value="24K">24K</MenuItem>
              <MenuItem value="22K">22K</MenuItem>
              <MenuItem value="18K">18K</MenuItem>
              <MenuItem value="14K">14K</MenuItem>
            </Select>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="caption" sx={{ color: 'var(--muted)', fontWeight: 600, display: 'block', mb: 0.5 }}>
            HUID Hallmark ID
          </Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="e.g. AB1234"
            value={huid}
            onChange={(e) => setHuid(e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="caption" sx={{ color: 'var(--muted)', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Purchase Cost (₹)
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={purchaseCost}
            onChange={(e) => handleCostChange(e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="caption" sx={{ color: 'var(--muted)', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Selling Price (₹)
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
          />
        </Grid>
      </Grid>

      {/* Alert banner matching prototype */}
      <Box sx={{ backgroundColor: 'var(--goldbg)', border: '1px solid #ead9ac', borderRadius: '14px', p: 2, my: 3 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: '#66501d', mb: 0.5 }}>
          Next step
        </Typography>
        <Typography variant="body2" sx={{ color: '#66501d', fontSize: '12px' }}>
          Save the physical item → generate unique Item ID → print your selling-price tag → attach → scan to verify.
        </Typography>
      </Box>

      {/* Action buttons matching prototype */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveAndContinue}
          disabled={loading}
          sx={{ fontWeight: 800 }}
        >
          {loading ? 'Saving...' : 'Save Item & Continue'}
        </Button>
        <Button variant="outlined" onClick={() => navigate('/inventory')}>
          Import Excel
        </Button>
      </Box>
    </Card>
  );
};
