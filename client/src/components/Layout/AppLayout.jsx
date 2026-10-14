import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Drawer } from '@mui/material';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 900) {
      setMobileOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg)' }}>
      {/* Desktop Sidebar */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          width: sidebarCollapsed ? 72 : 230,
          transition: 'width 0.22s ease',
          flexShrink: 0,
          overflow: 'hidden'
        }}
      >
        <Sidebar collapsed={sidebarCollapsed} onClose={() => {}} />
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 240,
            border: 'none',
            backgroundColor: '#171a1f',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
              width: 0,
              height: 0,
              background: 'transparent'
            }
          }
        }}
      >
        <Sidebar collapsed={false} onClose={() => setMobileOpen(false)} />
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          p: { xs: 2, sm: 3, md: '20px 24px 36px' },
          overflowY: 'auto'
        }}
      >
        <Topbar onToggleSidebar={handleToggleSidebar} isCollapsed={sidebarCollapsed} />
        <Outlet />
      </Box>
    </Box>
  );
};
