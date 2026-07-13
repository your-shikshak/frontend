import React, { useCallback, useEffect, useState } from 'react';
import {
  Container, Box, Typography, Card, CardContent, Grid, Button, Chip,
  CircularProgress, Alert, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, alpha, useTheme, Fade, Avatar, Tooltip,
  Tab, Tabs, IconButton, Stack, Badge,
} from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SnackbarNotification from '../../components/common/SnackbarNotification';
import {
  listTickets,
  getTicket,
  getTicketStats,
  addTicketComment,
  updateTicketStatus,
  ITicket,
  ITicketStats,
} from '../../services/ticketService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const STATUS_CONFIG: Record<string, { color: 'default' | 'warning' | 'success' | 'error' | 'info'; label: string }> = {
  OPEN:        { color: 'error',   label: 'Open' },
  IN_PROGRESS: { color: 'warning', label: 'In Progress' },
  RESOLVED:    { color: 'success', label: 'Resolved' },
  CLOSED:      { color: 'default', label: 'Closed' },
};

const PRIORITY_CONFIG: Record<string, { color: 'error' | 'warning' | 'success'; label: string }> = {
  HIGH:   { color: 'error',   label: 'High' },
  MEDIUM: { color: 'warning', label: 'Medium' },
  LOW:    { color: 'success', label: 'Low' },
};

const STATUS_TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

// ─── Ticket Detail Dialog ────────────────────────────────────────────────────

const TicketDetailDialog: React.FC<{
  ticketId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}> = ({ ticketId, open, onClose, onUpdated }) => {
  const theme = useTheme();
  const [ticket, setTicket] = useState<ITicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolveBox, setShowResolveBox] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'success',
  });

  const load = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const res = await getTicket(ticketId);
      setTicket(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (open && ticketId) {
      load();
    } else {
      setTicket(null);
      setComment('');
      setResolutionNote('');
      setShowResolveBox(false);
    }
  }, [open, ticketId, load]);

  const submitComment = async () => {
    if (!ticket || !comment.trim()) return;
    setPosting(true);
    try {
      await addTicketComment(ticket._id, comment.trim());
      setComment('');
      await load();
      onUpdated();
      setSnackbar({ open: true, message: 'Comment added', severity: 'success' });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed to post comment', severity: 'error' });
    } finally {
      setPosting(false);
    }
  };

  const markInProgress = async () => {
    if (!ticket) return;
    try {
      await updateTicketStatus(ticket._id, { status: 'IN_PROGRESS' });
      await load();
      onUpdated();
      setSnackbar({ open: true, message: 'Ticket marked In Progress', severity: 'info' });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed', severity: 'error' });
    }
  };

  const resolveTicket = async () => {
    if (!ticket) return;
    setResolving(true);
    try {
      await updateTicketStatus(ticket._id, { status: 'RESOLVED', resolutionNote: resolutionNote.trim() || undefined });
      onUpdated();
      onClose();
      setSnackbar({ open: true, message: 'Ticket resolved', severity: 'success' });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed to resolve', severity: 'error' });
    } finally {
      setResolving(false);
    }
  };

  const isActive = ticket && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED';

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <ConfirmationNumberIcon color="primary" />
          <Box flex={1}>
            <Typography variant="h6" fontWeight={700}>{ticket?.ticketNumber ?? 'Ticket Details'}</Typography>
            {ticket && (
              <Typography variant="caption" color="text.secondary">
                Raised {fmtDate(ticket.createdAt)}{ticket.raisedByName ? ` · ${ticket.raisedByName}` : ''}
              </Typography>
            )}
          </Box>
          {ticket && (
            <Stack direction="row" gap={1}>
              <Chip
                size="small"
                label={STATUS_CONFIG[ticket.status]?.label ?? ticket.status}
                color={STATUS_CONFIG[ticket.status]?.color ?? 'default'}
              />
              <Chip
                size="small"
                label={PRIORITY_CONFIG[ticket.priority]?.label ?? ticket.priority}
                color={PRIORITY_CONFIG[ticket.priority]?.color ?? 'default'}
                variant="outlined"
              />
            </Stack>
          )}
        </DialogTitle>

        <DialogContent dividers>
          {loading && !ticket ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          ) : ticket ? (
            <Stack gap={2.5}>
              {/* Subject + description */}
              <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>{ticket.subject}</Typography>
                {ticket.studentName && (
                  <Typography variant="body2" color="text.secondary" mb={1}>Student: {ticket.studentName}</Typography>
                )}
                {ticket.description && (
                  <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, p: 2 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</Typography>
                  </Box>
                )}
              </Box>

              {/* Resolution note */}
              {ticket.resolutionNote && (
                <Box sx={{ display: 'flex', gap: 1, bgcolor: alpha(theme.palette.success.main, 0.08), borderRadius: 2, p: 2 }}>
                  <CheckCircleIcon fontSize="small" color="success" sx={{ mt: 0.2 }} />
                  <Box>
                    <Typography variant="caption" color="success.main" fontWeight={700}>Resolution</Typography>
                    <Typography variant="body2">{ticket.resolutionNote}</Typography>
                    {ticket.resolvedByName && (
                      <Typography variant="caption" color="text.secondary">by {ticket.resolvedByName}</Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Comments */}
              {ticket.comments.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Comments ({ticket.comments.length})
                  </Typography>
                  <Stack gap={1} mt={1}>
                    {ticket.comments.map((c) => (
                      <Box
                        key={c._id}
                        sx={{
                          bgcolor: c.authorRole === 'PARENT'
                            ? alpha(theme.palette.info.main, 0.06)
                            : alpha(theme.palette.grey[500], 0.07),
                          borderRadius: 2,
                          p: 1.5,
                          borderLeft: `3px solid ${c.authorRole === 'PARENT' ? theme.palette.info.main : theme.palette.primary.main}`,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography variant="caption" fontWeight={700}>{c.authorName}</Typography>
                          <Chip label={c.authorRole} size="small" sx={{ height: 16, fontSize: 10 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{fmtDateTime(c.createdAt)}</Typography>
                        </Box>
                        <Typography variant="body2">{c.message}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Reply box */}
              {isActive && (
                <Box display="flex" gap={1} alignItems="flex-end">
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="Add a comment or update…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    inputProps={{ maxLength: 1000 }}
                    size="small"
                  />
                  <Tooltip title="Send">
                    <span>
                      <IconButton
                        color="primary"
                        onClick={submitComment}
                        disabled={!comment.trim() || posting}
                        sx={{ mb: 0.5 }}
                      >
                        {posting ? <CircularProgress size={18} /> : <SendIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              )}

              {/* Resolve box */}
              {isActive && (
                showResolveBox ? (
                  <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Resolution Note (optional)</Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      placeholder="Describe what was done to resolve this…"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      inputProps={{ maxLength: 500 }}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    <Stack direction="row" gap={1} justifyContent="flex-end">
                      <Button variant="outlined" onClick={() => setShowResolveBox(false)}>Cancel</Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={resolving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                        onClick={resolveTicket}
                        disabled={resolving}
                      >
                        Confirm Resolve
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Stack direction="row" gap={1}>
                    {ticket.status === 'OPEN' && (
                      <Button
                        variant="outlined"
                        startIcon={<PlayArrowIcon />}
                        onClick={markInProgress}
                        size="small"
                      >
                        Mark In Progress
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => setShowResolveBox(true)}
                      size="small"
                    >
                      Resolve Ticket
                    </Button>
                  </Stack>
                )
              )}
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
      <SnackbarNotification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TicketsPage: React.FC = () => {
  const theme = useTheme();

  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [stats, setStats] = useState<ITicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'success',
  });

  const currentStatus = STATUS_TABS[tabIndex];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.allSettled([
        listTickets({ status: currentStatus === 'ALL' ? undefined : currentStatus, limit: 100 }),
        getTicketStats(),
      ]);
      if (listRes.status === 'fulfilled') setTickets(listRes.value.data ?? []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (listRes.status === 'rejected') setError('Failed to load tickets');
    } catch (e: any) {
      setError(e?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [currentStatus]);

  useEffect(() => { load(); }, [load]);

  const openTicket = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Fade in timeout={400}>
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}>
                <ConfirmationNumberIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={800}>Support Tickets</Typography>
                <Typography variant="body2" color="text.secondary">Manage and resolve parent concerns</Typography>
              </Box>
            </Box>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
              Refresh
            </Button>
          </Box>

          {/* Stats */}
          {stats && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: 'Open',        val: stats.open,       color: theme.palette.error.main },
                { label: 'In Progress', val: stats.inProgress, color: theme.palette.warning.main },
                { label: 'Resolved',    val: stats.resolved,   color: theme.palette.success.main },
                { label: 'Total',       val: stats.total,      color: theme.palette.primary.main },
              ].map((s) => (
                <Grid item xs={6} sm={3} key={s.label}>
                  <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, textAlign: 'center', py: 1.5 }}>
                    <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>{s.val}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Tabs */}
          <Tabs
            value={tabIndex}
            onChange={(_, v) => setTabIndex(v)}
            sx={{ mb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {STATUS_TABS.map((s, i) => {
              const count = s === 'OPEN' ? stats?.open : s === 'IN_PROGRESS' ? stats?.inProgress : s === 'RESOLVED' ? stats?.resolved : undefined;
              return (
                <Tab
                  key={s}
                  label={
                    <Badge badgeContent={count} color={i === 1 ? 'error' : 'primary'} max={99}>
                      <span style={{ paddingRight: count ? 10 : 0 }}>{s.replace('_', ' ')}</span>
                    </Badge>
                  }
                />
              );
            })}
          </Tabs>

          {/* Error */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* List */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
          ) : tickets.length === 0 ? (
            <Box textAlign="center" py={8}>
              <ConfirmationNumberIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">
                No tickets{currentStatus !== 'ALL' ? ` with status "${currentStatus.replace('_', ' ')}"` : ' yet'}
              </Typography>
            </Box>
          ) : (
            <Stack gap={1.5}>
              {tickets.map((ticket) => {
                const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN;
                const priCfg = PRIORITY_CONFIG[ticket.priority];
                return (
                  <Card
                    key={ticket._id}
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'box-shadow 0.15s, border-color 0.15s',
                      '&:hover': { boxShadow: theme.shadows[3], borderColor: theme.palette.primary.main },
                    }}
                    onClick={() => openTicket(ticket._id)}
                  >
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" alignItems="flex-start" gap={1.5}>
                        <Box flex={1} minWidth={0}>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                            <Typography variant="caption" color="primary" fontWeight={700} sx={{ letterSpacing: 0.3 }}>
                              {ticket.ticketNumber}
                            </Typography>
                            <Chip size="small" label={statusCfg.label} color={statusCfg.color} />
                            {priCfg && (
                              <Chip size="small" label={priCfg.label} color={priCfg.color} variant="outlined" />
                            )}
                          </Box>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>{ticket.subject}</Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
                            {ticket.raisedByName && (
                              <Typography variant="caption" color="text.secondary">{ticket.raisedByName}</Typography>
                            )}
                            {ticket.studentName && (
                              <Typography variant="caption" color="text.secondary">· {ticket.studentName}</Typography>
                            )}
                          </Box>
                        </Box>
                        <Box textAlign="right" flexShrink={0}>
                          <Typography variant="caption" color="text.secondary">{fmtDate(ticket.createdAt)}</Typography>
                          {ticket.comments.length > 0 && (
                            <Box display="flex" alignItems="center" gap={0.5} justifyContent="flex-end" mt={0.5}>
                              <ChatBubbleOutlineIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                              <Typography variant="caption" color="text.disabled">{ticket.comments.length}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Box>
      </Fade>

      <TicketDetailDialog
        ticketId={selectedId}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={load}
      />

      <SnackbarNotification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
    </Container>
  );
};

export default TicketsPage;
