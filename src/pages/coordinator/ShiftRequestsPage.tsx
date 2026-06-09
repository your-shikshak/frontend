import React, { useCallback, useEffect, useState } from 'react';
import {
  Container, Box, Typography, Card, CardContent, Grid, Button, Chip,
  CircularProgress, Alert, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, alpha, useTheme, Grow, Fade, Avatar, Tooltip,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SnackbarNotification from '../../components/common/SnackbarNotification';
import {
  getPendingShiftRequests,
  approveShiftRequest,
  rejectShiftRequest,
  IShiftRequest,
} from '../../services/shiftRequestService';

const ShiftRequestsPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [requests, setRequests] = useState<IShiftRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'success',
  });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getPendingShiftRequests();
      setRequests(res.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load shift requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveShiftRequest(id);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      setSnackbar({ open: true, message: 'Shift approved — sessions updated', severity: 'success' });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed to approve', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const openReject = (id: string) => { setRejectId(id); setRejectReason(''); setRejectOpen(true); };

  const handleReject = async () => {
    if (!rejectId) return;
    setActionLoading(rejectId);
    try {
      await rejectShiftRequest(rejectId, rejectReason.trim() || undefined);
      setRequests((prev) => prev.filter((r) => r._id !== rejectId));
      setSnackbar({ open: true, message: 'Shift request rejected', severity: 'info' });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed to reject', severity: 'error' });
    } finally {
      setActionLoading(null); setRejectOpen(false);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Fade in timeout={400}>
        <Box
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            mb: 4, flexWrap: 'wrap', gap: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              sx={{
                width: 44, height: 44, borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
              }}
            >
              <SwapHorizIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>
                Shift Requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending tutor reschedule requests
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            {!loading && (
              <Chip
                label={`${requests.length} pending`}
                color={requests.length > 0 ? 'warning' : 'default'}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}
            <Button
              startIcon={<RefreshIcon />}
              onClick={load}
              disabled={loading}
              variant="outlined"
              size="small"
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Fade>

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={240} gap={2}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">Loading requests…</Typography>
        </Box>
      )}

      {/* Error */}
      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 2 }} action={
          <Button size="small" onClick={load}>Retry</Button>
        }>{error}</Alert>
      )}

      {/* Empty */}
      {!loading && !error && requests.length === 0 && (
        <Fade in timeout={400}>
          <Card
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center', py: 8, px: 4 }}
          >
            <Avatar
              sx={{
                width: 64, height: 64, mx: 'auto', mb: 2, borderRadius: 3,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: 'success.main',
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700} gutterBottom>All clear!</Typography>
            <Typography variant="body2" color="text.secondary">
              No pending shift requests from tutors.
            </Typography>
          </Card>
        </Fade>
      )}

      {/* Request cards */}
      <Grid container spacing={2.5}>
        {requests.map((req, i) => {
          const cls = req.finalClass;
          const days = req.shiftDays;
          const isForward = days > 0;
          const busy = actionLoading === req._id;

          return (
            <Grid item xs={12} md={6} key={req._id}>
              <Grow in timeout={300 + i * 60}>
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main', boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}` },
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    {/* Top row */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                          {cls?.studentName || cls?.className || 'Class'}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                          <SchoolIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Cycle {req.cycleNumber}
                          </Typography>
                          {cls?.schedule?.timeSlot && (
                            <>
                              <Typography variant="caption" color="text.secondary"> · </Typography>
                              <AccessTimeIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {cls.schedule.timeSlot}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>

                      {/* Shift badge */}
                      <Chip
                        icon={<SwapHorizIcon sx={{ fontSize: '1rem !important' }} />}
                        label={`${isForward ? '+' : ''}${days} day${Math.abs(days) !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                          fontWeight: 700, borderRadius: 1.5,
                          bgcolor: isForward
                            ? alpha(theme.palette.primary.main, 0.1)
                            : alpha(theme.palette.warning.main, 0.1),
                          color: isForward ? 'primary.main' : 'warning.main',
                        }}
                      />
                    </Box>

                    <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                    {/* Tutor + date */}
                    <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {req.requestedBy?.name || 'Tutor'}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(req.createdAt)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Reason */}
                    <Box
                      sx={{
                        bgcolor: isDark ? alpha('#fff', 0.04) : '#F8FAFC',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 1.5,
                        mb: 2.5,
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                        Reason
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                        {req.reason}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Box display="flex" gap={1.5}>
                      <Tooltip title="Approve and apply shift to remaining PLANNED sessions">
                        <span style={{ flex: 1 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
                            onClick={() => handleApprove(req._id)}
                            disabled={busy}
                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 1 }}
                          >
                            {busy ? 'Approving…' : 'Approve'}
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Reject this shift request">
                        <span style={{ flex: 1 }}>
                          <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<CancelIcon />}
                            onClick={() => openReject(req._id)}
                            disabled={busy}
                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 1 }}
                          >
                            Reject
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          );
        })}
      </Grid>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Reject Shift Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Optionally provide a reason so the tutor knows why the request was declined.
          </Typography>
          <TextField
            fullWidth
            label="Rejection reason (optional)"
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Class already has make-up sessions scheduled"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setRejectOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={!!actionLoading}
            startIcon={actionLoading ? <CircularProgress size={14} color="inherit" /> : <CancelIcon />}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            {actionLoading ? 'Rejecting…' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      <SnackbarNotification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
    </Container>
  );
};

export default ShiftRequestsPage;
