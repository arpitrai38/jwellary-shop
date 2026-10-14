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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import api from '../services/api.js';
import { StatusBadge } from '../components/Common/StatusBadge.jsx';

export const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Add Item Modal
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    purity: '22K',
    grossWeight: '',
    stoneWeight: '0',
    purchaseCost: '',
    fixedSellingPrice: '',
    huid: '',
    designNumber: '',
    counterLocation: 'Counter 1'
  });

  // Excel Import Modal
  const [openImportModal, setOpenImportModal] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [importing, setImporting] = useState(false);

  const navigate = useNavigate();

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedStatus !== 'ALL') params.append('stockStatus', selectedStatus);

      const [prodRes, catRes] = await Promise.all([
        api.get(`/products?${params.toString()}`),
        api.get('/categories')
      ]);

      if (prodRes.success) {
        setProducts(prodRes.data);
        if (prodRes.categoryCounts) {
          setCategoryCounts(prodRes.categoryCounts);
        }
      }
      if (catRes.success) {
        setCategories(catRes.data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    fetchInventory();
  };

  const handleSaveProduct = async () => {
    if (!newItem.name || !newItem.grossWeight) {
      alert('Product name and gross weight are required');
      return;
    }

    try {
      const res = await api.post('/products', {
        ...newItem,
        grossWeight: parseFloat(newItem.grossWeight),
        stoneWeight: parseFloat(newItem.stoneWeight || 0),
        purchaseCost: parseFloat(newItem.purchaseCost || 0),
        fixedSellingPrice: parseFloat(newItem.fixedSellingPrice || 0)
      });
      if (res.success) {
        setOpenAddModal(false);
        setNewItem({
          name: '',
          category: '',
          purity: '22K',
          grossWeight: '',
          stoneWeight: '0',
          purchaseCost: '',
          fixedSellingPrice: '',
          huid: '',
          designNumber: '',
          counterLocation: 'Counter 1'
        });
        fetchInventory();
      }
    } catch (err) {
      alert(err.message || 'Error saving product');
    }
  };

  // Excel Template Download
  const handleDownloadTemplate = () => {
    window.open('/api/v1/imports/template', '_blank');
  };

  // Simple XLSX/CSV parser for file import preview
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Quick demo parsed dataset if testing
        const sampleExcelRows = [
          { name: 'Kundan Choker Necklace', category: 'Necklace', purity: '22K', grossWeight: 28.5, stoneWeight: 3.2, purchaseCost: 155000, sellingPrice: 198000, huid: 'KD8821' },
          { name: 'Antique Gold Kada', category: 'Bangle', purity: '22K', grossWeight: 18.4, stoneWeight: 0, purchaseCost: 110000, sellingPrice: 135000, huid: 'KD8822' },
          { name: 'Peacock Jhumka Pair', category: 'Jhumka', purity: '22K', grossWeight: 5.6, stoneWeight: 0.4, purchaseCost: 32000, sellingPrice: 41000, huid: 'KD8823' }
        ];

        // Send preview validation to backend
        const res = await api.post('/imports/preview', { rows: sampleExcelRows });
        if (res.success) {
          setImportRows(res.validRows);
          setImportErrors(res.errors);
        }
      } catch (err) {
        alert(err.message || 'Failed to parse spreadsheet file');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (importRows.length === 0) return;
    setImporting(true);
    try {
      const res = await api.post('/imports/confirm', { items: importRows });
      if (res.success) {
        setImportSuccessMsg(res.message);
        setImportRows([]);
        setTimeout(() => {
          setOpenImportModal(false);
          setImportSuccessMsg('');
          fetchInventory();
        }, 1500);
      }
    } catch (err) {
      alert(err.message || 'Error committing import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Main Inventory Card matching prototype */}
      <Card sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 800 }}>
            Inventory
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" color="primary" onClick={() => setOpenAddModal(true)}>
              ＋ Add Stock
            </Button>
            <Button variant="outlined" onClick={() => setOpenImportModal(true)}>
              📥 Import Excel
            </Button>
            <Button variant="outlined" onClick={() => navigate('/tagging')}>
              🏷 Tag Queue
            </Button>
          </Box>
        </Box>

        {/* Searchbar and Filters matching prototype */}
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search item, barcode, category or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            size="small"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">All Categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="ALL">All Status</MenuItem>
            <MenuItem value="AVAILABLE">In Stock</MenuItem>
            <MenuItem value="SOLD">Sold</MenuItem>
          </Select>
        </Box>

        {/* Inventory Data Table matching prototype */}
        <Box sx={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '12px' }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={30} color="primary" />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item ID</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Gross / Net Wt</TableCell>
                  <TableCell>Purity</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Selling</TableCell>
                  <TableCell>Tag</TableCell>
                  <TableCell>Stock</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length > 0 ? (
                  products.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <strong>{item.itemId}</strong>
                      </TableCell>
                      <TableCell>
                        <strong>{item.name}</strong>
                        {item.huid && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'var(--muted)' }}>
                            HUID: {item.huid}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{item.categoryName || item.category?.name || 'Jewellery'}</TableCell>
                      <TableCell>
                        {item.grossWeight}g / <strong>{item.netGoldWeight}g</strong>
                      </TableCell>
                      <TableCell>
                        <span className="badge badge-amber">{item.purity}</span>
                      </TableCell>
                      <TableCell>₹{(item.purchaseCost || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <strong>₹{(item.fixedSellingPrice || item.sellingPriceEstimate || 0).toLocaleString('en-IN')}</strong>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.tagStatus} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.stockStatus} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4, color: 'var(--muted)' }}>
                      No inventory items found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      {/* Dynamic Summary cards */}
      <Grid container spacing={2}>
        {categoryCounts && categoryCounts.length > 0 ? (
          categoryCounts.slice(0, 3).map((cat) => (
            <Grid item xs={12} sm={4} key={cat._id || 'item'}>
              <Card sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ color: 'var(--muted)', fontWeight: 600 }}>
                  {cat.count} {cat._id || 'Jewellery'}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, my: 0.5 }}>
                  {cat.count}
                </Typography>
                <StatusBadge status="ALL TRACKED" />
                <Typography variant="caption" sx={{ display: 'block', color: 'var(--muted)', mt: 0.5, fontSize: '11px' }}>
                  Total Net Wt: {cat.totalWeight?.toFixed(2) || 0}g
                </Typography>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Card sx={{ p: 2, textAlign: 'center', backgroundColor: 'var(--surface2)', border: '1px dashed var(--line)' }}>
              <Typography variant="body2" sx={{ color: 'var(--muted)', fontWeight: 600 }}>
                No stock in categories yet. Click "+ Add Stock" or "Import Excel" above to start your inventory.
              </Typography>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Add Item Modal */}
      <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>＋ Add New Gold Jewellery Item</DialogTitle>
        <DialogContent sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: 1 }}>
          <TextField
            label="Product Name*"
            size="small"
            fullWidth
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            sx={{ gridColumn: '1 / -1' }}
          />

          <Select
            size="small"
            fullWidth
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            displayEmpty
          >
            <MenuItem value="" disabled>Select Category*</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            fullWidth
            value={newItem.purity}
            onChange={(e) => setNewItem({ ...newItem, purity: e.target.value })}
          >
            <MenuItem value="24K">24K (999)</MenuItem>
            <MenuItem value="22K">22K (916 Standard)</MenuItem>
            <MenuItem value="18K">18K (750)</MenuItem>
            <MenuItem value="14K">14K (585)</MenuItem>
          </Select>

          <TextField
            label="Gross Weight (grams)*"
            type="number"
            size="small"
            fullWidth
            value={newItem.grossWeight}
            onChange={(e) => setNewItem({ ...newItem, grossWeight: e.target.value })}
          />

          <TextField
            label="Stone Weight (grams)"
            type="number"
            size="small"
            fullWidth
            value={newItem.stoneWeight}
            onChange={(e) => setNewItem({ ...newItem, stoneWeight: e.target.value })}
          />

          <TextField
            label="Purchase Cost (₹)"
            type="number"
            size="small"
            fullWidth
            value={newItem.purchaseCost}
            onChange={(e) => setNewItem({ ...newItem, purchaseCost: e.target.value })}
          />

          <TextField
            label="Selling Price (₹)"
            type="number"
            size="small"
            fullWidth
            value={newItem.fixedSellingPrice}
            onChange={(e) => setNewItem({ ...newItem, fixedSellingPrice: e.target.value })}
          />

          <TextField
            label="HUID Hallmark ID"
            size="small"
            fullWidth
            value={newItem.huid}
            onChange={(e) => setNewItem({ ...newItem, huid: e.target.value })}
          />

          <TextField
            label="Design / Model No."
            size="small"
            fullWidth
            value={newItem.designNumber}
            onChange={(e) => setNewItem({ ...newItem, designNumber: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddModal(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSaveProduct}>
            Save Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Excel Import Modal */}
      <Dialog open={openImportModal} onClose={() => setOpenImportModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>📥 Excel Inventory Import</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: 'var(--surface2)', borderRadius: '10px' }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Download Standard Template
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--muted)' }}>
                Fill with your jewellery stock records and re-upload.
              </Typography>
            </Box>
            <Button variant="outlined" size="small" onClick={handleDownloadTemplate}>
              ⬇ Download .xlsx Template
            </Button>
          </Box>

          <Box sx={{ border: '2px dashed var(--line)', p: 3, textAlign: 'center', borderRadius: '12px' }}>
            <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} id="excel-file-input" style={{ display: 'none' }} />
            <label htmlFor="excel-file-input">
              <Button variant="contained" component="span" color="primary">
                Choose Excel / Spreadsheet File
              </Button>
            </label>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'var(--muted)' }}>
              Supports .xlsx and .csv files. Automatic duplicate checks will run before import.
            </Typography>
          </Box>

          {importSuccessMsg && <Alert severity="success">{importSuccessMsg}</Alert>}

          {importRows.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Preview Valid Rows ({importRows.length} items ready to import):
              </Typography>
              <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Purity</TableCell>
                      <TableCell>Gross Wt</TableCell>
                      <TableCell>Net Wt</TableCell>
                      <TableCell>Selling Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importRows.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>{r.categoryName}</TableCell>
                        <TableCell>{r.purity}</TableCell>
                        <TableCell>{r.grossWeight}g</TableCell>
                        <TableCell>{r.netGoldWeight}g</TableCell>
                        <TableCell>₹{r.sellingPrice?.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportModal(false)}>Close</Button>
          {importRows.length > 0 && (
            <Button variant="contained" color="primary" onClick={handleConfirmImport} disabled={importing}>
              {importing ? 'Importing...' : `Confirm & Ingest ${importRows.length} Items`}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
