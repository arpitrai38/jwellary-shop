import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from '@mui/material';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import api from '../services/api.js';
import { MetricCard } from '../components/Common/MetricCard.jsx';
import { StatusBadge } from '../components/Common/StatusBadge.jsx';

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/summary');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const d = data || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 4 Top Metric Cards matching prototype */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <MetricCard
            label="Today's Sales"
            value={`₹${(d.todaySales || 0).toLocaleString('en-IN')}`}
            delta={d.todaySales > 0 ? (d.salesDeltaPercent ? `↑ ${d.salesDeltaPercent}% vs yesterday` : 'Active today') : 'No sales today yet'}
            deltaColor="var(--green)"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard
            label="Bills Today"
            value={d.billsToday || 0}
            delta={d.billsToday > 0 ? `${d.pendingBillsToday || 0} pending payments` : 'Ready for billing'}
            deltaColor="var(--muted)"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard
            label="Stock Pieces"
            value={d.stockPieces || 0}
            delta={d.stockPieces > 0 ? `₹${((d.stockValuation || 0) / 100000).toFixed(2)}L stock value` : 'Add stock or import Excel'}
            deltaColor="var(--muted)"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard
            label="Low Stock"
            value={d.lowStockCount || 0}
            delta={d.lowStockCount > 0 ? 'Needs attention' : 'Stock healthy'}
            deltaColor={d.lowStockCount > 0 ? 'var(--red)' : 'var(--green)'}
          />
        </Grid>
      </Grid>

      {/* Quick Actions & Today's Insight Grid matching prototype */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '100%', boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="h4" sx={{ fontSize: '14px', fontWeight: 700 }}>
                Quick Actions
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--muted)' }}>
                Do the common things fast
              </Typography>
            </Box>

            <Grid container spacing={1.2}>
              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/billing')}
                  sx={{
                    flexDirection: 'column',
                    py: 1.5,
                    px: 1,
                    textAlign: 'left',
                    alignItems: 'flex-start',
                    backgroundColor: 'var(--surface2)',
                    borderColor: 'var(--line)'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🧾</span>
                  <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.5, color: 'var(--ink)' }}>
                    New Bill
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--muted)', fontSize: '10px' }}>
                    Scan & sell
                  </Typography>
                </Button>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/stock-in')}
                  sx={{
                    flexDirection: 'column',
                    py: 1.5,
                    px: 1,
                    textAlign: 'left',
                    alignItems: 'flex-start',
                    backgroundColor: 'var(--surface2)',
                    borderColor: 'var(--line)'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>📦</span>
                  <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.5, color: 'var(--ink)' }}>
                    Add Stock
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--muted)', fontSize: '10px' }}>
                    Receive items
                  </Typography>
                </Button>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/tagging')}
                  sx={{
                    flexDirection: 'column',
                    py: 1.5,
                    px: 1,
                    textAlign: 'left',
                    alignItems: 'flex-start',
                    backgroundColor: 'var(--surface2)',
                    borderColor: 'var(--line)'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🏷</span>
                  <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.5, color: 'var(--ink)' }}>
                    Tag Items
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--muted)', fontSize: '10px' }}>
                    Print & verify
                  </Typography>
                </Button>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/customers')}
                  sx={{
                    flexDirection: 'column',
                    py: 1.5,
                    px: 1,
                    textAlign: 'left',
                    alignItems: 'flex-start',
                    backgroundColor: 'var(--surface2)',
                    borderColor: 'var(--line)'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>👤</span>
                  <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.5, color: 'var(--ink)' }}>
                    Customer
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--muted)', fontSize: '10px' }}>
                    Find / add
                  </Typography>
                </Button>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box
            sx={{
              backgroundColor: 'var(--goldbg)',
              border: '1px solid #ead9ac',
              borderRadius: '14px',
              p: 2.2,
              height: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 800, color: '#66501d', mb: 0.8 }}>
                💡 Today's Insight
              </Typography>
              <Typography variant="body2" sx={{ color: '#66501d', lineHeight: 1.6, fontSize: '12px' }}>
                {d.stockPieces === 0
                  ? 'Welcome to your jewellery shop management system! To start billing, add your first physical jewellery piece using "+ Add Stock" or import stock from Excel.'
                  : `${d.lowStockCount || 0} items are low in stock. Current 22K manual gold rate is set at ₹${d.currentGoldRate22K || 6900}/g.`}
              </Typography>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/inventory')}
                sx={{
                  backgroundColor: '#ffffff',
                  borderColor: '#d3c8ad',
                  color: '#76530d',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                Review Low Stock
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Sales Trend Chart */}
      {d.salesTrend && d.salesTrend.length > 0 && (
        <Card sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ fontSize: '14px', fontWeight: 700 }}>
              Sales Activity Trend
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--muted)' }}>
              Last 7 Days Turnover
            </Typography>
          </Box>
          <Box sx={{ height: 180, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.salesTrend}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b7892b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#b7892b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" stroke="#73757c" fontSize={11} />
                <YAxis stroke="#73757c" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales']} />
                <Area type="monotone" dataKey="totalSales" stroke="#b7892b" strokeWidth={2} fillOpacity={1} fill="url(#goldGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Card>
      )}

      {/* Recent Activity Card matching prototype */}
      <Card sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h4" sx={{ fontSize: '14px', fontWeight: 700 }}>
            Recent Activity
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--muted)' }}>
            Latest business events
          </Typography>
        </Box>

        <Box sx={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '12px' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {d.recentActivities && d.recentActivities.length > 0 ? (
                d.recentActivities.map((act) => (
                  <TableRow key={act.id}>
                    <TableCell sx={{ color: 'var(--muted)', fontSize: '11px' }}>
                      {new Date(act.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{act.activity}</TableCell>
                    <TableCell>{act.item}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{act.amount}</TableCell>
                    <TableCell>
                      <StatusBadge status={act.status} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3, color: 'var(--muted)' }}>
                    No recent activity recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
};
