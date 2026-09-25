'use client'
import React, { useState } from 'react';
import { Avatar, IconButton, Menu, MenuItem, ListItemIcon, Box, Typography, Divider, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';

export default function UserMenu({ user }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const label = user.displayName || user.email || 'Account';

  return (
    <>
      <Tooltip title={label}>
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Account menu" sx={{ p: 0.5 }}>
          <Avatar src={user.photoURL || undefined} alt={label} sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
            {label.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1, maxWidth: 260 }}>
          {user.displayName && <Typography fontWeight={600} noWrap>{user.displayName}</Typography>}
          {user.email && <Typography variant="body2" color="text.secondary" noWrap>{user.email}</Typography>}
        </Box>
        <Divider />
        <MenuItem onClick={() => signOut(auth)}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
