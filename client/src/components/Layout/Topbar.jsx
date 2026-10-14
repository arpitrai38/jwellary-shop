import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Menu, MenuItem, IconButton, Avatar } from '@mui/material';
import { useAuth } from '../../context/AuthContext.jsx';

const pageMeta = {
  '/': ['Good Morning 👋', 'Aarna Jewar · Jewellery business command center'],
  '/billing': ['New Bill', 'Scan an item and complete the sale'],
  '/inventory': ['Inventory', 'Every physical piece has a unique identity'],
  '/tagging': ['Smart Tagging', 'Print, attach and verify every jewellery tag'],
  '/stock-in': ['Stock In', 'A guided process from purchase to ready stock'],
  '/customers': ['Customers', 'Customer history and relationship management'],
  '/suppliers': ['Suppliers', 'Supplier purchases and payable tracking'],
  '/reports': ['Reports', 'Sales, stock, profit and GST insights'],
  '/settings': ['Settings', 'Configure pricing, tags, printers and permissions'],
  '/profile': ['My Profile & Account', 'Manage account details, profile picture & password']
};

export const Topbar = ({ onToggleSidebar, onToggleMobile, isCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const meta = pageMeta[location.pathname] || ['Jewellery ERP', 'Aarna Jewar'];

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleToggle = onToggleSidebar || onToggleMobile;

  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        mb: 2.5
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Hamburger Icon Button - Visible on All Screens */}
        <IconButton
          onClick={handleToggle}
          aria-label="Toggle navigation menu"
          title="Toggle Navigation Menu"
          sx={{
            display: 'inline-flex',
            backgroundColor: '#ffffff',
            border: '1.5px solid #e8e4dc',
            borderRadius: '10px',
            color: '#171a1f',
            p: 1.1,
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            transition: 'all 0.18s ease',
            '&:hover': {
              backgroundColor: 'var(--goldbg)',
              borderColor: '#d6b35a',
              color: '#76530d',
              transform: 'scale(1.04)'
            }
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </IconButton>

        <Box>
          <Typography variant="h1" sx={{ fontSize: { xs: '19px', sm: '23px' }, fontWeight: 800, m: 0 }}>
            {meta[0]}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--muted)', fontSize: '12px', mt: 0.5 }}>
            {meta[1]}
          </Typography>
        </Box>
      </Box>

      {/* Top right actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            display: { xs: 'none', sm: 'inline-block' },
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: 'var(--goldbg)',
            color: '#76530d',
            padding: '7px 12px',
            borderRadius: '999px',
            border: '1px solid rgba(214, 179, 90, 0.4)'
          }}
        >
          GST Registered
        </Box>

        <Button
          variant="outlined"
          onClick={handleOpenMenu}
          sx={{
            borderColor: '#e8e4dc',
            color: '#1b1c20',
            fontWeight: 700,
            fontSize: '12px',
            px: 1.5,
            py: 0.6,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Avatar
            src={user?.avatar || undefined}
            sx={{
              width: 24,
              height: 24,
              fontSize: '11px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #d6b35a, #8e681c)',
              color: '#fff'
            }}
          >
            {(user?.name || 'O')[0].toUpperCase()}
          </Avatar>
          <span>{user?.name || 'Owner Profile'}</span>
          <span style={{ fontSize: '10px', color: '#73757c' }}>▾</span>
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: '12px',
              border: '1px solid #e8e4dc',
              boxShadow: '0 8px 30px rgba(27,28,32,0.1)',
              minWidth: 180
            }
          }}
        >
          <Box sx={{ px: 2, py: 1.2, borderBottom: '1px solid #f0ece3' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {user?.name || 'Store Owner'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#73757c', display: 'block' }}>
              {user?.shopName || 'Jewellery Shop'} · <span style={{ fontWeight: 700 }}>{user?.role || 'OWNER'}</span>
            </Typography>
          </Box>

          <MenuItem
            onClick={() => {
              handleCloseMenu();
              navigate('/profile');
            }}
            sx={{ fontWeight: 600, fontSize: '13px', py: 1 }}
          >
            👤 My Profile & Account
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleCloseMenu();
              navigate('/settings');
            }}
            sx={{ fontWeight: 600, fontSize: '13px', py: 1 }}
          >
            ⚙ Shop Settings
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleCloseMenu();
              logout();
            }}
            sx={{ color: '#b74444', fontWeight: 600, fontSize: '13px', py: 1, borderTop: '1px solid #f0ece3' }}
          >
            🚪 Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};
