import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress
} from '@mui/material';
import api from '../services/api.js';
import { MetricCard } from '../components/Common/MetricCard.jsx';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('SALES');
  const [reportData, setReportData] = useState(null);
  const [globalSummary, setGlobalSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        if (res?.success && res.data) {
          setGlobalSummary(res.data);
        }
      } catch {
        // ignore
      }
    };
    fetchSummary();
  }, []);

  const fetchReport = async (tab) => {
    setLoading(true);
    try {
      let endpoint = '/reports/sales';
      if (tab === 'STOCK') endpoint = '/reports/stock';
      if (tab === 'PROFIT') endpoint = '/reports/profit';
      if (tab === 'GST') endpoint = '/reports/gst';

      const res = await api.get(endpoint);
      if (res.success) {
        setReportData(res);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  const handleExportExcel = () => {
    const type = activeTab === 'STOCK' ? 'stock' : 'sales';
    window.open(`/api/v1/reports/export-excel?type=${type}`, '_blank');
  };

  const gs = globalSummary || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 4 Real Dynamic Metrics */}
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <MetricCard
            label="Today's Sales"
            value={`₹${(gs.todaySales || 0).toLocaleString('en-IN')}`}
            delta={gs.todaySales > 0 ? 'Live today' : 'No sales yet'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard
            label="Stock Pieces"
            value={gs.stockPieces || 0}
            delta={gs.stockPieces > 0 ? 'In inventory' : 'Empty stock'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard
            label="Stock Value"
            value={`₹${((gs.stockValuation || 0) / 100000).toFixed(2)}L`}
            delta="Current valuation"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard
            label="Low Stock Alert"
            value={gs.lowStockCount || 0}
            delta={gs.lowStockCount > 0 ? 'Needs restock' : 'Healthy'}
            deltaColor={gs.lowStockCount > 0 ? 'var(--red)' : 'var(--green)'}
          />
        </Grid>
      </Grid>

      {/* Reports Section matching prototype */}
      <Card sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 800 }}>
              Reports
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--muted)' }}>
              Exportable in final build
            </Typography>
          </Box>
          <Button variant="contained" color="secondary" onClick={handleExportExcel} sx={{ fontWeight: 700 }}>
            📥 Export to Excel
          </Button>
        </Box>

        {/* Report Category Buttons matching prototype */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          <Button
            variant={activeTab === 'SALES' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('SALES')}
            color="primary"
          >
            Sales Report
          </Button>
          <Button
            variant={activeTab === 'STOCK' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('STOCK')}
            color="primary"
          >
            Stock Report
          </Button>
          <Button
            variant={activeTab === 'PROFIT' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('PROFIT')}
            color="primary"
          >
            Profit Report
          </Button>
          <Button
            variant={activeTab === 'GST' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('GST')}
            color="primary"
          >
            GST Report
          </Button>
        </Box>

        {/* Report Content View */}
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={30} color="primary" />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '12px' }}>
            {activeTab === 'SALES' && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice No</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Pieces</TableCell>
                    <TableCell>Net Gold (g)</TableCell>
                    <TableCell>Taxable (₹)</TableCell>
                    <TableCell>GST (₹)</TableCell>
                    <TableCell align="right">Grand Total (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData?.data && reportData.data.length > 0 ? (
                    reportData.data.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell><strong>#{s.invoiceNumber}</strong></TableCell>
                        <TableCell>{new Date(s.invoiceDate).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>{s.customerSnapshot?.name || 'Walk-in Customer'}</TableCell>
                        <TableCell>{s.totalPieces}</TableCell>
                        <TableCell>{s.totalNetWeight}g</TableCell>
                        <TableCell>₹{s.taxableAmount?.toLocaleString('en-IN')}</TableCell>
                        <TableCell>₹{s.totalTax?.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right"><strong>₹{s.grandTotal?.toLocaleString('en-IN')}</strong></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3, color: 'var(--muted)' }}>
                        No sales records found for this period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {activeTab === 'GST' && (
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 3, mb: 2, p: 2, backgroundColor: 'var(--surface2)', borderRadius: '10px' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--muted)' }}>HSN Code:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800 }}>7113 (Gold Jewellery)</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--muted)' }}>Total Taxable Value:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800 }}>₹{reportData?.summary?.totalTaxable?.toLocaleString('en-IN') || 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--muted)' }}>CGST (1.5%):</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>₹{reportData?.summary?.totalCGST?.toLocaleString('en-IN') || 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--muted)' }}>SGST (1.5%):</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>₹{reportData?.summary?.totalSGST?.toLocaleString('en-IN') || 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--muted)' }}>Total Output GST:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: 'var(--green)' }}>₹{reportData?.summary?.totalTax?.toLocaleString('en-IN') || 0}</Typography>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: 'var(--muted)' }}>
                  Compliant with intra-state and inter-state GST schedules for bullion and articles of gold jewellery.
                </Typography>
              </Box>
            )}

            {activeTab === 'PROFIT' && (
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="caption" sx={{ color: 'var(--muted)' }}>Taxable Sales Revenue:</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>₹{reportData?.summary?.totalRevenue?.toLocaleString('en-IN') || 0}</Typography>
                  </Card>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="caption" sx={{ color: 'var(--muted)' }}>Estimated Cost of Goods:</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#73757c' }}>₹{reportData?.summary?.totalCostOfGoods?.toLocaleString('en-IN') || 0}</Typography>
                  </Card>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="caption" sx={{ color: 'var(--muted)' }}>Gross Profit (Margin: {reportData?.summary?.grossMarginPercent || 0}%):</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'var(--green)' }}>₹{reportData?.summary?.grossProfit?.toLocaleString('en-IN') || 0}</Typography>
                  </Card>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="caption" sx={{ color: 'var(--muted)' }}>Estimated Net Profit:</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#b7892b' }}>₹{reportData?.summary?.netProfit?.toLocaleString('en-IN') || 0}</Typography>
                  </Card>
                </Box>
              </Box>
            )}

            {activeTab === 'STOCK' && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Purity</TableCell>
                    <TableCell>Piece Count</TableCell>
                    <TableCell>Gross Weight</TableCell>
                    <TableCell>Net Gold Weight</TableCell>
                    <TableCell>Cost Valuation</TableCell>
                    <TableCell align="right">Selling Valuation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData?.summaryByPurity?.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell><strong>{p._id}</strong></TableCell>
                      <TableCell>{p.count}</TableCell>
                      <TableCell>{p.grossWeight?.toFixed(2)}g</TableCell>
                      <TableCell><strong>{p.netGoldWeight?.toFixed(2)}g</strong></TableCell>
                      <TableCell>₹{p.costValuation?.toLocaleString('en-IN')}</TableCell>
                      <TableCell align="right"><strong>₹{p.sellingValuation?.toLocaleString('en-IN')}</strong></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
      </Card>
    </Box>
  );
};
