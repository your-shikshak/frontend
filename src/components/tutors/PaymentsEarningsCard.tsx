import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  Button,
  alpha,
  LinearProgress,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useDemoMode } from '../../hooks/useDemoMode';

import { getMyPaymentSummary } from '../../services/paymentService';
import { IPayment } from '../../types';
import { PAYMENT_TYPE } from '../../constants';

const PaymentsEarningsCard: React.FC = () => {
  const { isDemoMode, getDemoPayments } = useDemoMode();
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const res = await getMyPaymentSummary({ paymentType: PAYMENT_TYPE.TUTOR_PAYOUT });
        setPayments(getDemoPayments(res.data.payments || []));

      } catch (err: any) {
        setError(err.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const stats = useMemo(() => {
    const total = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const paid = payments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingArr = payments.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE');
    const pending = pendingArr.reduce((acc, p) => acc + (p.amount || 0), 0);
    const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 0;
    return { total, paid, pending, pendingCount: pendingArr.length, paidPercent };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    let list = payments;
    if (selectedMonth) {
      list = list.filter(p => p.createdAt && new Date(p.createdAt).toISOString().slice(0, 7) === selectedMonth);
    }
    if (currentTab === 1) return list.filter(p => p.status === 'PAID');
    if (currentTab === 2) return list.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE');
    return list;
  }, [payments, currentTab, selectedMonth]);

  const getStatusSx = (status: string) => {
    if (status === 'PAID') return { bgcolor: alpha('#10b981', 0.1), color: '#059669', fontWeight: 700 };
    if (status === 'OVERDUE') return { bgcolor: alpha('#ef4444', 0.1), color: '#dc2626', fontWeight: 700 };
    return { bgcolor: alpha('#f59e0b', 0.1), color: '#d97706', fontWeight: 700 };
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" p={8} flexDirection="column" gap={2}>
      <CircularProgress size={36} sx={{ color: '#6366f1' }} />
      <Typography variant="caption" color="text.secondary">Loading payments...</Typography>
    </Box>
  );

  if (error) return (
    <Box p={3} borderRadius={3} border="1px solid" borderColor={alpha('#ef4444', 0.2)} bgcolor={alpha('#ef4444', 0.03)}>
      <Typography color="error" fontWeight={600} fontSize="0.88rem">{error}</Typography>
    </Box>
  );

  return (
    <Box id="tour-payments">

      {/* ─── KPI Stat Cards Row ──────────────────── */}
      <Grid container spacing={{ xs: 1, sm: 2.5 }} mb={{ xs: 2.5, sm: 4 }}>
        {/* Total Earnings */}
        <Grid item xs={4} sx={{ display: 'flex' }}>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              minHeight: { xs: 112, sm: 180 },
              borderRadius: { xs: 2.5, sm: 3 },
              p: { xs: 1.5, sm: 3 },
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)',
              color: '#fff',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'default',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 32px rgba(99, 102, 241, 0.3)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-60%',
                right: '-30%',
                width: '80%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)',
                pointerEvents: 'none',
              },
            }}
          >
            <Box position="relative" zIndex={1} display="flex" flexDirection="column" gap={{ xs: 0.75, sm: 1.5 }}>
              <Box
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  borderRadius: 2,
                  bgcolor: alpha('#fff', 0.15),
                  width: 'fit-content',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <AccountBalanceWalletIcon sx={{ fontSize: { xs: 16, sm: 22 } }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: { xs: '0.55rem', sm: '0.72rem' }, fontWeight: 600, opacity: 0.8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Total Earnings
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.7rem' }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  ₹{stats.total.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Received */}
        <Grid item xs={4} sx={{ display: 'flex' }}>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              minHeight: { xs: 112, sm: 180 },
              borderRadius: { xs: 2.5, sm: 3 },
              p: { xs: 1.5, sm: 3 },
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
              color: '#fff',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'default',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 32px rgba(16, 185, 129, 0.3)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-60%',
                right: '-30%',
                width: '80%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)',
                pointerEvents: 'none',
              },
            }}
          >
            <Box position="relative" zIndex={1} display="flex" flexDirection="column" gap={{ xs: 0.75, sm: 1.5 }}>
              <Box
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  borderRadius: 2,
                  bgcolor: alpha('#fff', 0.15),
                  width: 'fit-content',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <CheckCircleIcon sx={{ fontSize: { xs: 16, sm: 22 } }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: { xs: '0.55rem', sm: '0.72rem' }, fontWeight: 600, opacity: 0.8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Received
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.7rem' }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  ₹{stats.paid.toLocaleString()}
                </Typography>
              </Box>
              {/* Progress bar */}
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography sx={{ fontSize: '0.62rem', opacity: 0.7, fontWeight: 600 }}>Collection Rate</Typography>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700 }}>{stats.paidPercent}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.paidPercent}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: alpha('#fff', 0.15),
                    '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 2 },
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Pending */}
        <Grid item xs={4} sx={{ display: 'flex' }}>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              minHeight: { xs: 112, sm: 180 },
              borderRadius: { xs: 2.5, sm: 3 },
              p: { xs: 1.5, sm: 3 },
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
              color: '#fff',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'default',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 32px rgba(245, 158, 11, 0.3)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-60%',
                right: '-30%',
                width: '80%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)',
                pointerEvents: 'none',
              },
            }}
          >
            <Box position="relative" zIndex={1} display="flex" flexDirection="column" gap={{ xs: 0.75, sm: 1.5 }}>
              <Box
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  borderRadius: 2,
                  bgcolor: alpha('#fff', 0.15),
                  width: 'fit-content',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <PendingActionsIcon sx={{ fontSize: { xs: 16, sm: 22 } }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: { xs: '0.55rem', sm: '0.72rem' }, fontWeight: 600, opacity: 0.8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Pending
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.7rem' }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  ₹{stats.pending.toLocaleString()}
                </Typography>
              </Box>
              {stats.pendingCount > 0 && (
                <Chip
                  label={`${stats.pendingCount} awaiting`}
                  size="small"
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    bgcolor: alpha('#fff', 0.2),
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    height: 20,
                    backdropFilter: 'blur(4px)',
                  }}
                />
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* ─── Payments Table ──────────────────────── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.100',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Table Header Controls */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
            flexWrap="wrap"
            gap={2}
          >
            <Tabs
              value={currentTab}
              onChange={(_e, v) => setCurrentTab(v)}
              sx={{
                minHeight: 36,
                '& .MuiTabs-indicator': {
                  bgcolor: '#6366f1',
                  height: 2.5,
                  borderRadius: 2,
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.82rem' },
                  minHeight: 36,
                  px: { xs: 1.5, sm: 2 },
                  '&.Mui-selected': { color: '#6366f1' },
                },
              }}
            >
              <Tab label="All" />
              <Tab label="Received" />
              <Tab label="Pending" />
            </Tabs>
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                type="month"
                size="small"
                label="Filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                sx={{
                  width: { xs: 130, sm: 170 },
                  '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.82rem' },
                }}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
                onClick={() => {
                  setLoading(true);
                  getMyPaymentSummary({ paymentType: PAYMENT_TYPE.TUTOR_PAYOUT }).then(res => {
                    setPayments(res.data.payments || []);
                    setLoading(false);
                  });
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  minWidth: { xs: 36, sm: 'auto' },
                  px: { xs: 1, sm: 2 },
                  borderColor: alpha('#6366f1', 0.25),
                  color: '#6366f1',
                  '& .MuiButton-startIcon': { display: { xs: 'inherit', sm: 'inherit' }, mr: { xs: 0, sm: 1 } },
                  '&:hover': { borderColor: '#6366f1', bgcolor: alpha('#6366f1', 0.04) },
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Refresh</Box>
              </Button>
            </Box>
          </Box>

          {/* Table */}
          <TableContainer
            sx={{
              '&::-webkit-scrollbar': { height: 4 },
              '&::-webkit-scrollbar-thumb': { background: '#ddd', borderRadius: 2 },
            }}
          >
            <Table sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow>
                  {['Service Date / Class', 'Amount', 'Status', 'Reference'].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        borderBottom: '2px solid',
                        borderColor: alpha('#6366f1', 0.08),
                        py: 1.5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${alpha('#6366f1', 0.08)}, ${alpha('#6366f1', 0.02)})`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <ReceiptLongIcon sx={{ fontSize: 24, color: '#6366f1' }} />
                      </Box>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.88rem' }}>
                        No records found
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>
                        Try adjusting your filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((p, idx) => (
                    <TableRow
                      key={p.id}
                      sx={{
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: alpha('#6366f1', 0.02) },
                        '& td': { borderBottom: '1px solid', borderColor: alpha('#6366f1', 0.04), py: { xs: 1.25, sm: 1.75 } },
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Box
                            sx={{
                              display: { xs: 'none', sm: 'flex' },
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              bgcolor: alpha('#6366f1', 0.06),
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <ReceiptLongIcon sx={{ fontSize: 16, color: '#6366f1' }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: { xs: '0.75rem', sm: '0.82rem' } }}>
                              {p.attendanceSheet?.periodLabel
                                ? `Monthly: ${p.attendanceSheet.periodLabel}`
                                : new Date(p.createdAt).toLocaleDateString()
                              }
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.62rem', sm: '0.7rem' } }}>
                              {(p.finalClass as any)?.className || 'Class'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={800} sx={{ color: '#0f172a', fontSize: { xs: '0.8rem', sm: '0.92rem' } }}>
                          ₹{p.amount?.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={p.status}
                          size="small"
                          sx={{
                            ...getStatusSx(p.status),
                            fontSize: { xs: '0.58rem', sm: '0.65rem' },
                            height: { xs: 20, sm: 22 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontFamily: 'monospace' }}>
                          {p.transactionId || '---'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Footer summary */}
          {filteredPayments.length > 0 && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: '1px solid',
                borderColor: alpha('#6366f1', 0.06),
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                Showing {filteredPayments.length} of {payments.length} records
              </Typography>
              <Box display="flex" alignItems="center" gap={0.75}>
                <TrendingUpIcon sx={{ fontSize: 14, color: '#10b981' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#10b981', fontSize: '0.72rem' }}>
                  ₹{filteredPayments.reduce((a, p) => a + (p.amount || 0), 0).toLocaleString()} total
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>

  );
};

export default PaymentsEarningsCard;

