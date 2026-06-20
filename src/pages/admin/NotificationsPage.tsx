import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, IconButton, MenuItem, Paper, Stack, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImageIcon from '@mui/icons-material/Image';
import CampaignIcon from '@mui/icons-material/Campaign';
import HistoryIcon from '@mui/icons-material/History';
import { sendAdminBroadcast, getBroadcastHistory, deleteBroadcastLog, IBroadcastLog } from '../../services/announcementService';
import { getBanners, createBanner, deleteBanner, IBanner } from '../../services/bannerService';

type Tab = 'push' | 'push-history' | 'banner' | 'history';

const RECIPIENT_GROUPS = [
  { value: 'ALL_TEACHERS', label: 'All Teachers' },
  { value: 'ALL_COORDINATORS', label: 'All Coordinators' },
  { value: 'ALL_MANAGERS', label: 'All Managers' },
  { value: 'ALL_PARENTS', label: 'All Parents' },
];

const AdminNotificationsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('push');

  // Push notification
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientGroup, setRecipientGroup] = useState('ALL_TEACHERS');
  const [sending, setSending] = useState(false);
  const [pushSuccess, setPushSuccess] = useState('');
  const [pushError, setPushError] = useState('');

  // Push history
  const [pushLogs, setPushLogs] = useState<IBroadcastLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  const loadPushLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const res = await getBroadcastHistory();
      setPushLogs(res.logs);
    } catch {
      setLogsError('Failed to load push notification history');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('Delete this broadcast log?')) return;
    try {
      await deleteBroadcastLog(id);
      setPushLogs((prev) => prev.filter((l) => l._id !== id));
    } catch {
      setLogsError('Failed to delete log');
    }
  };

  // Banner
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [expiresAt, setExpiresAt] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const loadBanners = useCallback(async () => {
    try {
      setBannerLoading(true);
      setBanners(await getBanners());
    } catch {
      setBannerError('Failed to load banners');
    } finally {
      setBannerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'banner' || tab === 'history') loadBanners();
    if (tab === 'push-history') loadPushLogs();
  }, [tab, loadBanners, loadPushLogs]);

  const handleSendPush = async () => {
    if (!subject.trim()) return setPushError('Subject is required');
    if (!message.trim()) return setPushError('Message is required');
    setPushError('');
    setSending(true);
    try {
      const res = await sendAdminBroadcast({
        subject,
        message,
        recipientGroup: recipientGroup as any,
      });
      setPushSuccess(`Sent to ${(res as any)?.data?.recipientCount ?? 'all'} recipients`);
      setSubject('');
      setMessage('');
      loadPushLogs();
    } catch (e: any) {
      setPushError(e?.response?.data?.message || e?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const resetBannerForm = () => {
    setFile(null);
    setPreview(null);
    setExpiresAt('');
    setFormError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleBannerSubmit = async () => {
    if (!file) return setFormError('Please select an image.');
    if (!expiresAt) return setFormError('Please set an expiry date and time.');
    if (new Date(expiresAt) <= new Date()) return setFormError('Expiry must be in the future.');
    setFormError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('expiresAt', new Date(expiresAt).toISOString());
      await createBanner(fd);
      setDialogOpen(false);
      resetBannerForm();
      loadBanners();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || 'Failed to create banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Deactivate this banner?')) return;
    try {
      await deleteBanner(id);
      loadBanners();
    } catch {
      setBannerError('Failed to deactivate banner');
    }
  };

  const now = new Date();
  const minDateTime = new Date(now.getTime() + 60000).toISOString().slice(0, 16);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Notifications</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Send push notifications or banner images to users
          </Typography>
        </Box>
        {tab === 'banner' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Create Banner
          </Button>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab value="push" label="Push Notification" icon={<CampaignIcon />} iconPosition="start" />
          <Tab value="push-history" label="Push History" icon={<HistoryIcon />} iconPosition="start" />
          <Tab value="banner" label="Banner Notification" icon={<ImageIcon />} iconPosition="start" />
          <Tab value="history" label="Banner History" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Push Notification Tab */}
      {tab === 'push' && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>Send Push Notification</Typography>
          <Stack spacing={2.5}>
            {pushSuccess && <Alert severity="success" onClose={() => setPushSuccess('')}>{pushSuccess}</Alert>}
            {pushError && <Alert severity="error" onClose={() => setPushError('')}>{pushError}</Alert>}
            <TextField
              select
              label="Send To"
              value={recipientGroup}
              onChange={(e) => setRecipientGroup(e.target.value)}
              fullWidth
            >
              {RECIPIENT_GROUPS.map((g) => (
                <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
            />
            <TextField
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              multiline
              rows={5}
              placeholder="Enter your message..."
            />
            <Button
              variant="contained"
              startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              disabled={sending}
              onClick={handleSendPush}
              sx={{ alignSelf: 'flex-end', borderRadius: 2, fontWeight: 700, px: 4 }}
            >
              {sending ? 'Sending…' : 'Send Notification'}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Push History Tab */}
      {tab === 'push-history' && (
        <>
          {logsError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLogsError('')}>{logsError}</Alert>}
          {logsLoading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : pushLogs.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No push notifications sent yet</Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Message</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Sent To</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Recipients</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Sent By</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pushLogs.map((log) => (
                    <TableRow key={log._id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{log.subject}</Typography></TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {log.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.recipientGroup.replace('ALL_', '').replace('_', ' ')}
                          size="small"
                          color={log.recipientGroup === 'ALL_PARENTS' ? 'success' : log.recipientGroup === 'ALL_TEACHERS' ? 'primary' : 'default'}
                          sx={{ fontWeight: 700, fontSize: 11, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell><Typography variant="body2" fontWeight={700}>{log.recipientCount}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{log.sentByName}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Delete log">
                          <IconButton size="small" color="error" onClick={() => handleDeleteLog(log._id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Banner Tab */}
      {tab === 'banner' && (
        <>
          {bannerError && <Alert severity="error" sx={{ mb: 2 }}>{bannerError}</Alert>}
          {bannerLoading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : banners.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <ImageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No banners yet. Click "Create Banner" to add one.</Typography>
            </Paper>
          ) : (
            <BannerTable banners={banners} now={now} onDelete={handleDeleteBanner} />
          )}
        </>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <>
          {bannerError && <Alert severity="error" sx={{ mb: 2 }}>{bannerError}</Alert>}
          {bannerLoading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : banners.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No banner history</Typography>
            </Paper>
          ) : (
            <BannerTable banners={banners} now={now} onDelete={handleDeleteBanner} />
          )}
        </>
      )}

      {/* Create Banner Dialog */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); resetBannerForm(); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 0 }}>Create Banner Notification</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Box>
              <Typography variant="body2" fontWeight={600} mb={1}>Banner Image *</Typography>
              <Box
                onClick={() => fileRef.current?.click()}
                sx={{
                  border: '2px dashed #CBD5E1', borderRadius: 2, p: 2, textAlign: 'center',
                  cursor: 'pointer', bgcolor: '#F8FAFC',
                  '&:hover': { borderColor: 'primary.main', bgcolor: '#EFF6FF' },
                  transition: 'all 0.2s',
                }}
              >
                {preview ? (
                  <Box component="img" src={preview} sx={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 1.5 }} />
                ) : (
                  <Stack alignItems="center" spacing={1} py={2}>
                    <AddPhotoAlternateIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.secondary">Click to upload banner image</Typography>
                    <Typography variant="caption" color="text.disabled">PNG, JPG — recommended 1200×400px</Typography>
                  </Stack>
                )}
              </Box>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg" hidden onChange={handleFileChange} />
            </Box>
            <TextField
              label="Banner Expiry Date & Time *"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              inputProps={{ min: minDateTime }}
              InputLabelProps={{ shrink: true }}
              fullWidth
              helperText="Banner disappears from teacher devices after this time"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => { setDialogOpen(false); resetBannerForm(); }} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={handleBannerSubmit} disabled={submitting} sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>
            {submitting ? <CircularProgress size={18} color="inherit" /> : 'Publish Banner'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const BannerTable: React.FC<{ banners: IBanner[]; now: Date; onDelete: (id: string) => void }> = ({ banners, now, onDelete }) => (
  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: '#F8FAFC' }}>
          <TableCell sx={{ fontWeight: 700 }}>Preview</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Uploaded By</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Expires</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
          <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {banners.map((b) => {
          const expired = new Date(b.expiresAt) <= now;
          const active = b.isActive && !expired;
          return (
            <TableRow key={b._id} hover>
              <TableCell>
                <Box component="img" src={b.imageUrl} alt="banner"
                  sx={{ width: 100, height: 48, objectFit: 'cover', borderRadius: 1.5, border: '1px solid #E2E8F0' }} />
              </TableCell>
              <TableCell><Typography variant="body2" fontWeight={600}>{b.uploaderName}</Typography></TableCell>
              <TableCell>
                <Chip label={b.uploaderRole} size="small" color={b.uploaderRole === 'ADMIN' ? 'primary' : 'default'} sx={{ fontWeight: 700, fontSize: 11 }} />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {new Date(b.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color={expired ? 'error' : 'text.secondary'}>
                  {new Date(b.expiresAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip label={active ? 'Active' : expired ? 'Expired' : 'Deactivated'} size="small" color={active ? 'success' : 'default'} sx={{ fontWeight: 700, fontSize: 11 }} />
              </TableCell>
              <TableCell align="center">
                {active && (
                  <Tooltip title="Deactivate">
                    <IconButton size="small" color="error" onClick={() => onDelete(b._id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

export default AdminNotificationsPage;
