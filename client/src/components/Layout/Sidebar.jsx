import React from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { useAuth } from '../../context/AuthContext.jsx';

const navItems = [
  { path: '/', label: 'Dashboard', symbol: '⌂' },
  { path: '/billing', label: 'New Bill', symbol: '▣' },
  { path: '/inventory', label: 'Inventory', symbol: '◇' },
  { path: '/tagging', label: 'Smart Tagging', symbol: '🏷' },
  { path: '/stock-in', label: 'Stock In', symbol: '＋' },
  { path: '/customers', label: 'Customers', symbol: '♙' },
  { path: '/suppliers', label: 'Suppliers', symbol: '▤' },
  { path: '/reports', label: 'Reports', symbol: '▥' },
  { path: '/settings', label: 'Settings', symbol: '⚙' },
  { path: '/profile', label: 'My Profile', symbol: '👤' }
];

export const Sidebar = ({ mobileOpen, onClose, collapsed = false }) => {
  const { user } = useAuth();

  return (
    <Box
      component="aside"
      sx={{
        width: collapsed ? 72 : 230,
        flexShrink: 0,
        backgroundColor: '#171a1f',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        padding: collapsed ? '20px 8px' : '20px 14px',
        boxSizing: 'border-box',
        zIndex: 1200,
        borderRight: '1px solid #242932',
        transition: 'width 0.22s ease, padding 0.22s ease',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
          width: 0,
          height: 0,
          background: 'transparent'
        }
      }}
    >
      {/* Brand Logo Header */}
      <Box sx={{ pb: collapsed ? 2 : 3, pt: 1, textAlign: 'center', minHeight: 48, flexShrink: 0 }}>
        <Typography
          className="brand-title"
          sx={{
            fontFamily: 'Cinzel, Georgia, serif',
            letterSpacing: collapsed ? '1px' : '3px',
            fontSize: collapsed ? '17px' : '19px',
            color: '#e7c46c',
            fontWeight: 800,
            whiteSpace: 'nowrap'
          }}
        >
          {collapsed ? 'AJ' : 'AARNA JEWAR'}
        </Typography>
        {!collapsed && (
          <Typography
            className="brand-subtitle"
            sx={{
              fontSize: '9px',
              letterSpacing: '2px',
              color: '#a9adb5',
              mt: 0.8,
              textTransform: 'uppercase',
              fontWeight: 600
            }}
          >
            Jewellery CRM
          </Typography>
        )}
      </Box>

      {/* Navigation Links */}
      <Box
        className="sidebar-nav"
        sx={{
          display: 'grid',
          gap: '5px',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
            width: 0,
            height: 0,
            background: 'transparent'
          }
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            title={item.label}
            style={({ isActive }) => ({
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? '0px' : '10px',
              padding: collapsed ? '11px 0' : '11px 13px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              color: isActive ? '#ffffff' : '#c9cdd3',
              backgroundColor: isActive ? '#292e36' : 'transparent',
              boxShadow: isActive ? 'inset 3px 0 0 #d6b35a' : 'none',
              transition: 'all 0.15s ease'
            })}
          >
            <span style={{ fontSize: '16px', color: '#e7c46c', display: 'flex', alignItems: 'center' }}>
              {item.symbol}
            </span>
            {!collapsed && (
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </Box>

      {/* Footer Info */}
      <Box
        sx={{
          mt: 'auto',
          pt: 1.5,
          flexShrink: 0,
          borderTop: '1px solid #30353e',
          fontSize: '11px',
          color: '#9297a0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: collapsed ? 'center' : 'stretch',
          gap: 0.5
        }}
      >
        {!collapsed ? (
          <>
            <Typography variant="caption" sx={{ color: '#a9adb5', fontWeight: 600 }}>
              {user?.city ? user.city : (user?.shopName || 'Jewellery Store')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
              <span style={{ fontSize: '10px', color: '#73757c' }}>Logged as:</span>
              <span className="badge badge-amber" style={{ fontSize: '9px', padding: '2px 6px' }}>
                {user?.role || 'OWNER'}
              </span>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: '#292e36',
              color: '#e7c46c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800
            }}
            title={user?.name || 'Owner'}
          >
            {(user?.name || 'O')[0].toUpperCase()}
          </Box>
        )}
      </Box>
    </Box>
  );
};
