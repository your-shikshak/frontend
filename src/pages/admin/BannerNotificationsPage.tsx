import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography, Alert, CircularProgress,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImageIcon from '@mui/icons-material/Image';
import { getBanners, createBanner, deleteBanner, IBanner } from '../../services/bannerService';

const BannerNotificationsPage: React.FC = () => {
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [expiresAt, setExpiresAt] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      setBanners(await getBanners());
    } catch {
      setError('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setExpiresAt('');
    setFormError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
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
      setOpen(false);
      resetForm();
      load();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to create banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deactivate this banner?')) return;
    try {
      await deleteBanner(id);
      load();
    } catch {
      setError('Failed to deactivate banner');
    }
  };

  const now = new Date();
  const minDateTime = new Date(now.getTime() + 60000).toISOString().slice(0, 16);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="text.primary">
            Banner Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Upload image banners shown to teachers in the mobile app
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
        >
          Create Banner
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* History Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : banners.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <ImageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No banners created yet</Typography>
        </Paper>
      ) : (
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
                      <Box
                        component="img"
                        src={b.imageUrl}
                        alt="banner"
                        sx={{ width: 100, height: 48, objectFit: 'cover', borderRadius: 1.5, border: '1px solid #E2E8F0' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{b.uploaderName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={b.uploaderRole}
                        size="small"
                        color={b.uploaderRole === 'ADMIN' ? 'primary' : 'default'}
                        sx={{ fontWeight: 700, fontSize: 11 }}
                      />
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
                      <Chip
                        label={active ? 'Active' : expired ? 'Expired' : 'Deactivated'}
                        size="small"
                        color={active ? 'success' : 'default'}
                        sx={{ fontWeight: 700, fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {active && (
                        <Tooltip title="Deactivate">
                          <IconButton size="small" color="error" onClick={() => handleDelete(b._id)}>
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
      )}

      {/* Create Banner Dialog */}
      <Dialog open={open} onClose={() => { setOpen(false); resetForm(); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 0 }}>Create Banner Notification</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}

            {/* Image upload area */}
            <Box>
              <Typography variant="body2" fontWeight={600} mb={1}>Banner Image *</Typography>
              <Box
                onClick={() => fileRef.current?.click()}
                sx={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: '#F8FAFC',
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

            {/* Expiry */}
            <TextField
              label="Banner Expiry Date & Time *"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              inputProps={{ min: minDateTime }}
              InputLabelProps={{ shrink: true }}
              fullWidth
              helperText="Banner will disappear from teacher devices after this time"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => { setOpen(false); resetForm(); }} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
          >
            {submitting ? <CircularProgress size={18} color="inherit" /> : 'Publish Banner'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BannerNotificationsPage;
