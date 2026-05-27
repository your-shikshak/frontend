import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar, Menu, MenuItem, Divider, Badge, Tooltip, alpha } from '@mui/material';
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

interface HeaderProps {
  onMenuClick?: () => void;
  showSidebarMenu?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, showSidebarMenu = true }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications({ page: 1, limit: 20, enabled: Boolean(user) && notifOpen });
  const [tutorProfile, setTutorProfile] = useState<ITutor | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);

  const handleProfile = () => {
    handleMenuClose();
    const role = user?.role;
    const target =
      role === USER_ROLES.COORDINATOR
        ? '/coordinator-profile'
        : role === USER_ROLES.TUTOR
          ? '/tutor-profile'
          : '/profile';
    navigate(target);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  const initials =
    user?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'YS';

  useEffect(() => {
    const loadTutorAvatar = async () => {
      if (!user || user.role !== USER_ROLES.TUTOR) return;
      try {
        const res = await getMyProfile();
        const tutor = res.data;
        setTutorProfile(tutor);
        const profilePhotoDoc = (tutor.documents || []).find((doc) => doc.documentType === 'PROFILE_PHOTO');
        if (profilePhotoDoc) {
          setAvatarUrl(profilePhotoDoc.documentUrl);
        } else {
          setAvatarUrl(undefined);
        }
      } catch {
        setAvatarUrl(undefined);
      }
    };

    loadTutorAvatar();
  }, [user]);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: alpha('#ffffff', 0.8),
        backdropFilter: 'blur(12px)',
        borderBottom: 'none',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
        color: '#0f172a',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64, md: 70 }, px: { xs: 2, sm: 3 } }}>
        {showSidebarMenu && onMenuClick && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{
              display: { md: 'none', xs: 'inline-flex' },
              mr: 2,
              bgcolor: alpha('#6366f1', 0.04),
              borderRadius: 2,
              '&:hover': {
                backgroundColor: alpha('#6366f1', 0.08),
              },
            }}
          >
            <MenuIcon sx={{ color: '#6366f1' }} />
          </IconButton>
        )}

        <Box display="flex" alignItems="center" gap={2} sx={{ flexGrow: 1 }}>
          <Box
            sx={{
              p: 0.5,
              borderRadius: 2,
              bgcolor: alpha('#6366f1', 0.06),
              display: { xs: 'none', sm: 'flex' },
              border: `1px solid ${alpha('#6366f1', 0.1)}`
            }}
          >
            <Box
              component="img"
              src="/1.jpg"
              alt="Logo"
              sx={{
                height: { xs: 36, sm: 46 },
                width: { xs: 36, sm: 46 },
                borderRadius: '50%',
              }}
            />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '1rem', sm: '1.2rem' },
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                color: '#0f172a',
                fontFamily: "'Manrope', sans-serif"
              }}
            >
              Your Shikshak
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: { xs: 'none', md: 'block' },
                color: '#64748b',
                fontWeight: 750,
                fontSize: '0.65rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                mt: -0.25
              }}
            >
              Yourshikshak
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
          <Tooltip title="Notifications" arrow>
            <IconButton
              onClick={() => setNotifOpen((prev) => !prev)}
              size="small"
              sx={{
                borderRadius: 2,
                bgcolor: alpha('#6366f1', 0.04),
                '&:hover': { backgroundColor: alpha('#6366f1', 0.08) },
                p: 1.25
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontWeight: 900,
                    fontSize: '0.65rem',
                    minWidth: 18,
                    height: 18,
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                  },
                }}
              >
                <NotificationsIcon sx={{ fontSize: 22, color: '#6366f1' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Account" arrow>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{
                p: 0.5,
                borderRadius: 2,
                border: `1px solid ${alpha('#6366f1', 0.1)}`,
                bgcolor: alpha('#6366f1', 0.02),
                '&:hover': { backgroundColor: alpha('#6366f1', 0.06) }
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 36, sm: 44 },
                  height: { xs: 36, sm: 44 },
                  bgcolor: '#6366f1',
                  fontWeight: 900,
                  fontSize: { xs: '0.85rem', sm: '1rem' },
                  fontFamily: "'Manrope', sans-serif",
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                }}
                src={avatarUrl}
              >
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 240,
                borderRadius: 2,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${alpha('#64748b', 0.08)}`,
                p: 1
              },
            }}
          >
            <Box sx={{ px: 2, py: 2, mb: 1, borderRadius: 2, bgcolor: alpha('#6366f1', 0.03) }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                {user?.email || ''}
              </Typography>
            </Box>

            <MenuItem
              onClick={handleProfile}
              sx={{
                py: 1.5,
                px: 2,
                borderRadius: 1.5,
                gap: 1.5,
                '&:hover': {
                  backgroundColor: alpha('#6366f1', 0.04),
                  '& .MuiSvgIcon-root': { color: '#6366f1' }
                },
              }}
            >
              <AccountCircleIcon fontSize="small" sx={{ color: '#64748b', transition: 'color 0.2s' }} />
              <Typography variant="body2" sx={{ fontWeight: 750 }}>Profile</Typography>
            </MenuItem>

            <MenuItem
              disabled
              sx={{
                py: 1.5,
                px: 2,
                borderRadius: 1.5,
                gap: 1.5,
              }}
            >
              <SettingsIcon fontSize="small" sx={{ color: '#64748b' }} />
              <Typography variant="body2" sx={{ fontWeight: 750 }}>Settings</Typography>
            </MenuItem>

            <Divider sx={{ my: 1, opacity: 0.5 }} />

            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.5,
                px: 2,
                borderRadius: 1.5,
                gap: 1.5,
                color: '#ef4444',
                '&:hover': {
                  backgroundColor: alpha('#ef4444', 0.04),
                },
              }}
            >
              <LogoutIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 800 }}>Logout</Typography>
            </MenuItem>
          </Menu>

          <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
