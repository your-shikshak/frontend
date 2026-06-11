import React from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemIcon, ListItemText, Chip, Divider, Skeleton } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ISystemHealthIndicators } from '../../types';

interface SystemHealthCardProps {
  data: ISystemHealthIndicators | null | undefined;
  loading?: boolean;
  title?: string;
}

const calculateTotalInactiveUsers = (inactiveUsersByRole?: Record<string, number>) => {
  if (!inactiveUsersByRole) return 0;
  return Object.values(inactiveUsersByRole).reduce((sum, v) => sum + (v || 0), 0);
};

const formatInactiveUsersBreakdown = (inactiveUsersByRole?: Record<string, number>) => {
  if (!inactiveUsersByRole) return '';
  return Object.entries(inactiveUsersByRole)
    .filter(([_, v]) => (v || 0) > 0)
    .map(([k, v]) => `${k[0] + k.slice(1).toLowerCase()}: ${v}`)
    .join(', ');
};

const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ data, loading = false, title = 'System Health' }) => {
  const pendingApprovalsTotal = data?.pendingApprovals?.totalPending ?? data?.pendingApprovals?.attendance?.total ?? 0;
  const overduePayments = data?.overduePayments ?? 0;
  const pendingVerifications = data?.pendingTutorVerifications ?? 0;
  const inactiveTotal = calculateTotalInactiveUsers(data?.inactiveUsersByRole);
  const inactiveBreakdown = formatInactiveUsersBreakdown(data?.inactiveUsersByRole);

  const healthRows = [
    {
      label: 'Pending Approvals',
      sub: 'Attendance (Coord + Parent)',
      value: pendingApprovalsTotal,
      icon: pendingApprovalsTotal > 0 ? <WarningIcon color="warning" fontSize="small" /> : <CheckCircleIcon color="success" fontSize="small" />,
      chipColor: pendingApprovalsTotal > 0 ? 'warning' : 'success',
    },
    {
      label: 'Overdue Payments',
      sub: 'Past due date',
      value: overduePayments,
      icon: overduePayments > 0 ? <ErrorIcon color="error" fontSize="small" /> : <CheckCircleIcon color="success" fontSize="small" />,
      chipColor: overduePayments > 0 ? 'error' : 'success',
    },
    {
      label: 'Pending Verifications',
      sub: 'Tutors awaiting review',
      value: pendingVerifications,
      icon: pendingVerifications > 0 ? <InfoIcon color="info" fontSize="small" /> : <CheckCircleIcon color="success" fontSize="small" />,
      chipColor: pendingVerifications > 0 ? 'info' : 'success',
    },
    {
      label: 'Inactive Users',
      sub: inactiveBreakdown || 'None',
      value: inactiveTotal,
      icon: inactiveTotal > 0 ? <InfoIcon color="info" fontSize="small" /> : <CheckCircleIcon color="success" fontSize="small" />,
      chipColor: inactiveTotal > 0 ? 'info' : 'success',
    },
  ] as const;

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Typography
          variant="h6"
          fontWeight={700}
          mb={2}
          sx={{ fontSize: { xs: '0.95rem', sm: '1.125rem' } }}
        >
          {title}
        </Typography>

        {loading ? (
          <List dense disablePadding>
            {Array.from({ length: 4 }).map((_, i) => (
              <ListItem key={i} disablePadding sx={{ py: 1.25, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Skeleton variant="circular" width={20} height={20} />
                </ListItemIcon>
                <ListItemText
                  primary={<Skeleton variant="text" width="55%" />}
                  secondary={<Skeleton variant="text" width="75%" />}
                />
                <Skeleton variant="rounded" width={44} height={22} sx={{ borderRadius: '8px' }} />
              </ListItem>
            ))}
          </List>
        ) : !data ? (
          <Typography variant="body2" color="text.secondary">No data available</Typography>
        ) : (
          <List dense disablePadding>
            {healthRows.map((row, i) => (
              <React.Fragment key={row.label}>
                <ListItem
                  disablePadding
                  sx={{
                    py: { xs: 1.25, sm: 1 },
                    px: 0,
                    gap: 1,
                    alignItems: 'center',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    {row.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={row.label}
                    secondary={row.sub}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                    secondaryTypographyProps={{
                      fontSize: { xs: '0.68rem', sm: '0.75rem' },
                      noWrap: true,
                    }}
                  />
                  <Chip
                    size="small"
                    label={row.value}
                    color={row.chipColor as any}
                    variant={row.value > 0 ? 'filled' : 'outlined'}
                    sx={{ borderRadius: '8px', fontWeight: 700, minWidth: 36 }}
                  />
                </ListItem>
                {i < healthRows.length - 1 && <Divider sx={{ opacity: 0.5 }} />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthCard;

