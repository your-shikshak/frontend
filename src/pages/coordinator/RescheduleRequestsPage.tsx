import React, { useCallback, useEffect, useState } from 'react';
import {
  Container, Box, Typography, Card, CardContent, Grid, Button, Chip,
  CircularProgress, Alert, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, alpha, useTheme, Grow, Fade, Avatar, Tooltip,
} from '@mui/material';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SchoolIcon from '@mui/icons-material/School';
import SnackbarNotification from '../../components/common/SnackbarNotification';
import {
  getPendingRescheduleRequests,
  approveRescheduleRequest,
  rejectRescheduleRequest,
  IRescheduleRequest,
} from '../../services/rescheduleRequestService';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const RescheduleRequestsPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [requests, setRequests] = useState<IRescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ classId: string; requestId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'success',
  });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getPendingRescheduleRequests();
      setRequests(res.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load reschedule requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (classId: string, requestId: string) => {
    setActionLoading(requestId);
    try {
      await approveRescheduleRequest(classId, requestId);
      setRequests(prev => prev.filter(r => r.requestId !== requestId));
      setSnackbar({ open: true, message: 'Reschedule approved — session updated', severity: 'success' });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed to approve', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const openReject = (classId: string, requestId: string) => {
    setRejectTarget({ classId, requestId });
    setRejectReason('');
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.requestId);
    try {
      await rejectRescheduleRequest(rejectTarget.classId, rejectTarget.requestId, rejectReason.trim() || undefined);
      setRequests(prev => prev.filter(r => r.requestId !== rejectTarget.requestId));
      setSnackbar({ open: true, message: 'Request rejected', severity: 'info' });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed to reject', severity: 'error' });
    } finally {
      setActionLoading(null);
      setRejectOpen(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Fade in timeout={400}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}>
              <EventRepeatIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>
                Reschedule Requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending parent reschedule requests
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
            <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading} variant="outlined" size="small" sx={{ borderRadius: 2 }}>
              Refresh
            </Button>
          </Box>
        </Box>
      </Fade>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={240} gap={2}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">Loading requests…</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 2 }} action={<Button size="small" onClick={load}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {!loading && !error && requests.length === 0 && (
        <Fade in timeout={400}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center', py: 8, px: 4 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}>
              <CheckCircleIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700} gutterBottom>All clear!</Typography>
            <Typography variant="body2" color="text.secondary">No pending reschedule requests from parents.</Typography>
          </Card>
        </Fade>
      )}

      <Grid container spacing={2.5}>
        {requests.map((req, i) => {
          const busy = actionLoading === req.requestId;
          const subjects = req.subject?.map(s => s.label).join(', ') || '—';

          return (
            <Grid item xs={12} md={6} key={req.requestId}>
              <Grow in timeout={300 + i * 60}>
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid', borderColor: 'divider', borderRadius: 3, transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main', boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}` },
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    {/* Top */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                          {req.studentName}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                          <SchoolIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">{subjects}</Typography>
                        </Box>
                      </Box>
                      <Box display="flex" gap={0.75}>
                        <Chip
                          label={req.requestType === 'TUTOR' ? 'Tutor' : 'Parent'}
                          size="small"
                          sx={{
                            fontWeight: 700, borderRadius: 1.5,
                            bgcolor: alpha(req.requestType === 'TUTOR' ? theme.palette.info.main : theme.palette.secondary.main, 0.1),
                            color: req.requestType === 'TUTOR' ? 'info.main' : 'secondary.main',
                          }}
                        />
                        <Chip
                          label="Pending"
                          size="small"
                          sx={{ fontWeight: 700, borderRadius: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }}
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                    {/* Date change */}
                    <Box
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        bgcolor: isDark ? alpha('#fff', 0.04) : '#F8FAFC',
                        border: '1px solid', borderColor: 'divider',
                        borderRadius: 2, p: 1.5, mb: 2,
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={0.75} flex={1}>
                        <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>From</Typography>
                          <Typography variant="body2" fontWeight={600}>{fmtDate(req.fromDate)}</Typography>
                        </Box>
                      </Box>
                      <ArrowForwardIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                      <Box display="flex" alignItems="center" gap={0.75} flex={1}>
                        <CalendarTodayIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>To</Typography>
                          <Typography variant="body2" fontWeight={600} color="primary.main">{fmtDate(req.toDate)}</Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Typography variant="caption" color="text.disabled" display="block" mb={2}>
                      Requested on {fmtDate(req.requestedAt)}
                    </Typography>

                    {/* Actions */}
                    <Box display="flex" gap={1.5}>
                      <Tooltip title="Approve and reschedule the session to the requested date">
                        <span style={{ flex: 1 }}>
                          <Button
                            fullWidth variant="contained" color="success" size="small"
                            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
                            onClick={() => handleApprove(req.classId, req.requestId)}
                            disabled={busy}
                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 1 }}
                          >
                            {busy ? 'Approving…' : 'Approve'}
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Reject this reschedule request">
                        <span style={{ flex: 1 }}>
                          <Button
                            fullWidth variant="outlined" color="error" size="small"
                            startIcon={<CancelIcon />}
                            onClick={() => openReject(req.classId, req.requestId)}
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
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Reject Reschedule Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Optionally provide a reason so the parent knows why the request was declined.
          </Typography>
          <TextField
            fullWidth label="Rejection reason (optional)" multiline rows={3}
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Requested date conflicts with another session"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setRejectOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={handleReject} variant="contained" color="error"
            disabled={!!actionLoading}
            startIcon={actionLoading ? <CircularProgress size={14} color="inherit" /> : <CancelIcon />}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            {actionLoading ? 'Rejecting…' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      <SnackbarNotification
        open={snackbar.open} message={snackbar.message} severity={snackbar.severity}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      />
    </Container>
  );
};

export default RescheduleRequestsPage;
