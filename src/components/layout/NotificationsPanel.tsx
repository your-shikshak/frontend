import React, { useEffect } from 'react';
import { Drawer, Box, Typography, List, ListItem, ListItemButton, ListItemText, IconButton, Badge, Divider, Button, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CampaignIcon from '@mui/icons-material/Campaign';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentsIcon from '@mui/icons-material/Payments';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LoadingSpinner from '../common/LoadingSpinner';
import useNotifications from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  open: boolean;
  onClose: () => void;
}

const typeIcon = (type?: string) => {
  switch (type) {
    case 'ANNOUNCEMENT':
      return <CampaignIcon fontSize="small" />;
    case 'DEMO_ASSIGNED':
      return <AssignmentIcon fontSize="small" />;
    case 'PAYMENT':
      return <PaymentsIcon fontSize="small" />;
    case 'VERIFICATION':
      return <VerifiedUserIcon fontSize="small" />;
    case 'ATTENDANCE':
      return <CheckCircleIcon fontSize="small" />;
    default:
      return <NotificationsIcon fontSize="small" />;
  }
};

export default function NotificationsPanel({ open, onClose }: Props) {
  const { notifications, loading, unreadCount, markRead, markAllRead, refetch } = useNotifications({ page: 1, limit: 20, enabled: open });

  useEffect(() => {
    if (open) refetch();
  }, [open]);

  const handleItemClick = async (n: any) => {
    if (!n.isRead) await markRead(n.id);
    // navigation can be added based on n.related*
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '86vw', sm: 380 } } }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1.5}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6">Notifications</Typography>
          <Badge color="error" badgeContent={unreadCount} />
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box px={2} py={1}>
        <Button size="small" onClick={markAllRead} disabled={unreadCount === 0}>Mark All Read</Button>
      </Box>
      <Divider />
      {loading ? (
        <Box p={3}><LoadingSpinner /></Box>
      ) : (
        <List sx={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
          {notifications.length === 0 && (
            <Box px={2} py={3} textAlign="center">
              <Typography color="text.secondary">No notifications</Typography>
            </Box>
          )}
          {notifications.map((n) => (
            <ListItem key={n.id} disablePadding>
              <ListItemButton onClick={() => handleItemClick(n)} sx={{ bgcolor: n.isRead ? 'transparent' : 'action.hover', borderLeft: n.isRead ? 'none' : (theme) => `3px solid ${theme.palette.primary.main}` }}>
                <Box mr={1} mt={0.5}>{typeIcon(n.type)}</Box>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2">{n.title}</Typography>
                      <Chip size="small" label={n.type} />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {n.message}
                      </Typography>
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.disabled"
                      >
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </Typography>
                    </>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Drawer>
  );
}

