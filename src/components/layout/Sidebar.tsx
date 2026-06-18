import React, { useEffect } from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Box, Typography, alpha, Tooltip, Switch, IconButton } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAVIGATION_ITEMS, USER_ROLES, VERIFICATION_STATUS } from '../../constants';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PaymentIcon from '@mui/icons-material/Payment';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ClassIcon from '@mui/icons-material/Class';
import TodayIcon from '@mui/icons-material/Today';
import CampaignIcon from '@mui/icons-material/Campaign';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import StorageIcon from '@mui/icons-material/Storage';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FolderIcon from '@mui/icons-material/Folder';
import EventIcon from '@mui/icons-material/Event';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SummarizeIcon from '@mui/icons-material/Summarize';
import InsightsIcon from '@mui/icons-material/Insights';
import PersonIcon from '@mui/icons-material/Person';
import RecentActorsIcon from '@mui/icons-material/RecentActors';
import CastForEducationIcon from '@mui/icons-material/CastForEducation';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';


export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  drawerWidth?: number;
  onResizeStart?: () => void;
}

const iconForLabel = (label: string) => {
  switch (label) {
    case 'Dashboard':
      return <DashboardIcon />;
    case 'Admin Dashboard':
      return <AdminPanelSettingsIcon />;
    case 'Tutor Dashboard':
      return <DashboardIcon />;
    case 'Timetable':
      return <ScheduleIcon />;
    case 'Class Requests':
      return <AssignmentIcon />;
    case 'Class Leads':
      return <AssignmentIcon />;
    case 'Test Scheduling':
      return <EventIcon />;
    case 'Tutors':
      return <PeopleIcon />;
    case 'Coordinators':
      return <SchoolIcon />;
    case 'Managers':
      return <SupervisorAccountIcon />;
    case 'Coordinators Management':
      return <ManageAccountsIcon />;
    case 'Final Classes':
      return <CastForEducationIcon />;
    case 'Lead CRM':
      return <RecentActorsIcon />;
    case 'Data Management':
      return <StorageIcon />;
    case 'Register New Member':
      return <PersonAddIcon />;
    case 'Attendance':
      return <CheckCircleIcon />;
    case 'Attendance Sheet':
      return <AssignmentIcon />;
    case 'Attendance Approvals':
      return <CheckCircleOutlineIcon />;
    case 'Payments':
      return <PaymentIcon />;
    case 'My Classes':
      return <ClassIcon />;
    case 'Analytics':
      return <AnalyticsIcon />;
    case 'Business Analytics':
      return <TrendingUpIcon />;
    case 'Profile':
      return <AccountCircleIcon />;
    case 'My Profile':
      return <PersonIcon />;
    case 'Admin Profile':
      return <AccountBoxIcon />;
    case "Today's Tasks":
      return <TodayIcon />;
    case 'Announcements':
      return <CampaignIcon />;
    case 'Tests':
      return <AssessmentIcon />;
    case 'Test Reports':
      return <SummarizeIcon />;
    case 'Tutor Performance':
      return <InsightsIcon />;
    case 'Shift Requests':
      return <SwapHorizIcon />;
    case 'Payment Tracking':
      return <AccountBalanceWalletIcon />;
    case 'Notes':
      return <FolderIcon />;
    default:
      return <DashboardIcon />;
  }
};

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, drawerWidth = 280, onResizeStart }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const userRole = (user?.role as string) || '';
  const isCollapsed = drawerWidth < 180;

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const drawer = (
    <Box sx={{
      width: drawerWidth,
      height: '100%',
      maxHeight: 'calc(100vh / var(--app-scale))',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      position: 'relative',
      bgcolor: '#ffffff',
    }}>
      <Box
        sx={{
          p: isCollapsed ? 1 : { xs: 2, sm: 2.5, md: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: { xs: 1.5, sm: 2 },
          minHeight: { xs: 56, sm: 64, md: 80 },
          px: 4,
        }}
      >
        {/* Branding removed as per user request, but space preserved */}
      </Box>

      <List sx={{ flexGrow: 1, py: 1, px: 2 }}>
        {NAVIGATION_ITEMS.filter((item: any) => !item.allowedRoles || item.allowedRoles.includes(userRole)).map((item) => {
          let resolvedPath = item.path;
          if (item.label === 'Dashboard') {
            if (userRole === USER_ROLES.ADMIN) {
              resolvedPath = '/admin-dashboard';
            } else if (userRole === USER_ROLES.COORDINATOR) {
              resolvedPath = '/coordinator-dashboard';
            }
          }

          if (item.label === 'Analytics' && userRole === USER_ROLES.ADMIN) {
            resolvedPath = '/admin/analytics';
          }

          if (item.label === 'Profile' && userRole === USER_ROLES.TUTOR) {
            resolvedPath = '/tutor-profile';
          }

          const selected = location.pathname === resolvedPath || location.pathname.startsWith(resolvedPath + '/');
          const isUnverifiedManager = userRole === USER_ROLES.MANAGER && (user?.verificationStatus === VERIFICATION_STATUS.PENDING || !user?.verificationStatus);
          const isUnverifiedCoordinator = userRole === USER_ROLES.COORDINATOR && user?.verificationStatus === VERIFICATION_STATUS.PENDING;
          const isItemDisabled = (isUnverifiedManager || isUnverifiedCoordinator) && !['Dashboard', 'Profile', 'My Profile'].includes(item.label);

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 1, display: 'block' }}>
              <Tooltip
                title={isCollapsed ? (
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', color: alpha('#fff', 0.8) }}>{(item as any).description}</Typography>
                  </Box>
                ) : ""}
                placement="right"
                arrow
              >
                <ListItemButton
                  selected={selected}
                  disabled={isItemDisabled}
                  onClick={() => !isItemDisabled && handleNavigation(resolvedPath)}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    px: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    bgcolor: 'transparent',
                    '&.Mui-selected': {
                      bgcolor: alpha('#6366f1', 0.08),
                      color: '#6366f1',
                      '&:hover': {
                        bgcolor: alpha('#6366f1', 0.12),
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#6366f1',
                        transform: 'scale(1.1)',
                      },
                    },
                    '&:hover': {
                      bgcolor: alpha('#6366f1', 0.04),
                      '& .MuiListItemIcon-root': { color: '#6366f1' },
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: 0, 
                      mr: isCollapsed ? 0 : 2, 
                      justifyContent: 'center',
                      color: selected ? '#6366f1' : '#64748b',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {React.cloneElement(iconForLabel(item.label) as React.ReactElement, { sx: { fontSize: 22 } })}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    sx={{ opacity: isCollapsed ? 0 : 1 }}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: selected ? 800 : 600,
                      fontFamily: "'Inter', sans-serif",
                      noWrap: true,
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>


      <Box sx={{ p: 3, display: isCollapsed ? 'none' : 'block' }}>
        <Box 
          sx={{ 
            p: 2, 
            borderRadius: 2, 
            bgcolor: alpha('#6366f1', 0.03), 
            border: `1px solid ${alpha('#6366f1', 0.05)}`,
            textAlign: 'center'
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: '#64748b',
              fontWeight: 800,
              fontSize: '0.65rem',
              letterSpacing: '0.02em'
            }}
          >
            © 2024 Your Shikshak
          </Typography>
        </Box>
      </Box>
      {/* Resize Handle */}
      <Box
        onMouseDown={onResizeStart}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '2px',
          height: '100%',
          cursor: 'col-resize',
          zIndex: 1200,
          transition: 'all 0.2s',
          '&:hover': {
            width: '4px',
            backgroundColor: alpha('#6366f1', 0.3),
          },
        }}
      />
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            /* iOS-feel drawer curve (from Ionic Framework) */
            transition: 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1) !important',
          },
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(15, 23, 42, 0.35)',
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #E2E8F0',
            overflowX: 'hidden',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Sidebar;
