import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar, Menu, MenuItem, Divider, Badge, Tooltip, alpha, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import useAuth from '../../hooks/useAuth';
import { USER_ROLES } from '../../constants';
import { useNavigate } from 'react-router-dom';
import NotificationsPanel from './NotificationsPanel';
import useNotifications from '../../hooks/useNotifications';
import { getMyProfile } from '../../services/tutorService';
import { ITutor } from '../../types';

interface TutorMobileAppBarProps {
  onMenuClick?: () => void;
}

const TutorMobileAppBar: React.FC<TutorMobileAppBarProps> = ({ onMenuClick }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications({ page: 1, limit: 20, enabled: Boolean(user) && notifOpen });
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleProfile = () => {
    handleMenuClose();
    navigate('/tutor-profile');
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  useEffect(() => {
    const loadTutorAvatar = async () => {
      if (!user || user.role !== USER_ROLES.TUTOR) return;
      try {
        const res = await getMyProfile();
        const profilePhotoDoc = (res.data.documents || []).find((doc: any) => doc.documentType === 'PROFILE_PHOTO');
        if (profilePhotoDoc) setAvatarUrl(profilePhotoDoc.documentUrl);
      } catch {
        setAvatarUrl(undefined);
      }
    };
    loadTutorAvatar();
  }, [user]);

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'YS';

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: alpha('#001F54', 0.85),
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        borderBottom: `1px solid ${alpha('#fff', 0.1)}`,
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: 2 }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{
            mr: 1,
            backgroundColor: alpha('#fff', 0.05),
            '&:hover': { backgroundColor: alpha('#fff', 0.1) },
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box display="flex" alignItems="center" gap={1.5} sx={{ flexGrow: 1 }}>
          <Avatar
            src="/1.jpg"
            sx={{
              width: 32,
              height: 32,
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
            }}
          />
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                fontSize: '1rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                color: '#fff',
              }}
            >
              YourShikshak
            </Typography>
            <Typography
              variant="caption"
              sx={{
                opacity: 0.7,
                fontSize: '0.65rem',
                display: 'block',
                lineHeight: 1,
                fontWeight: 500,
                color: '#fff',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Tutor Portal
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            color="inherit"
            onClick={() => setNotifOpen((prev) => !prev)}
            size="small"
            sx={{
              p: 1,
              backgroundColor: alpha('#fff', 0.05),
              '&:hover': { backgroundColor: alpha('#fff', 0.1) },
            }}
          >
            <Badge badgeContent={unreadCount} color="error" overlap="circular">
              <NotificationsIcon sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>

          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            size="small"
            sx={{
              p: 0.5,
              border: `1.5px solid ${alpha('#fff', 0.2)}`,
              '&:hover': { backgroundColor: alpha('#fff', 0.05) },
            }}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
              src={avatarUrl}
            >
              {initials}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 220,
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              },
            }}
          >
            <Box sx={{ px: 2.5, py: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary' }}>
                {user?.name || 'Tutor'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}>
                {user?.email || 'tutor@yourshikshak.in'}
              </Typography>
            </Box>
            <Divider sx={{ opacity: 0.6 }} />
            <MenuItem onClick={handleProfile} sx={{ py: 1.5, gap: 1.5 }}>
              <AccountCircleIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={600}>My Profile</Typography>
            </MenuItem>
            <MenuItem disabled sx={{ py: 1.5, gap: 1.5 }}>
              <SettingsIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={600}>Settings</Typography>
            </MenuItem>
            <Divider sx={{ opacity: 0.6 }} />
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, gap: 1.5, color: 'error.main' }}>
              <LogoutIcon fontSize="small" />
              <Typography variant="body2" fontWeight={700}>Sign Out</Typography>
            </MenuItem>
          </Menu>

          <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TutorMobileAppBar;

