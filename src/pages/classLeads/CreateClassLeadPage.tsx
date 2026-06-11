import { useState, useEffect } from 'react';
import {
  Container, Box, Typography, IconButton, alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import ClassLeadForm from '../../components/classLeads/ClassLeadForm';
import { IClassLeadFormData } from '../../types';
import leadService from '../../services/leadService';
import SnackbarNotification from '../../components/common/SnackbarNotification';
import { usePermissionCheck } from '../../hooks/useManagerPermissions';
import useAuth from '../../hooks/useAuth';
import PermissionDeniedDialog from '../../components/common/PermissionDeniedDialog';
import ErrorDialog from '../../components/common/ErrorDialog';
import { useErrorDialog } from '../../hooks/useErrorDialog';

export default function CreateClassLeadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { error, showError, clearError, handleError } = useErrorDialog();
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  const { isAuthorized, errorMessage } = usePermissionCheck('canCreateLeads');

  useEffect(() => {
    if (user?.role === 'MANAGER' && !isAuthorized) {
      setShowPermissionDialog(true);
    }
  }, [user?.role, isAuthorized]);

  const handleSubmit = async (data: IClassLeadFormData) => {
    if (!isAuthorized) { setShowPermissionDialog(true); return; }
    try {
      setLoading(true);
      const res = await leadService.createClassLead(data);
      setSnack({ open: true, message: 'Lead created successfully', severity: 'success' });
      const createdId = (res as any)?.data?.id || (res as any)?.data?._id;
      if (createdId) navigate(`/class-leads/${createdId}`);
      else navigate('/class-leads');
    } catch (e: any) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
          px: { xs: 2, sm: 3 },
          pt: { xs: 1.5, sm: 2.5 },
          pb: { xs: 2, sm: 3 },
          position: 'relative',
          overflow: 'hidden',
          '@keyframes heroIn': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
          animation: 'heroIn 400ms cubic-bezier(0.23,1,0.32,1) 60ms both',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
        }}
      >
        <Box display="flex" alignItems="center" gap={2} sx={{ position: 'relative', zIndex: 1 }}>
          <IconButton
              onClick={() => navigate('/class-leads')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                '&:active': { transform: 'scale(0.95)' },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '13px',
              bgcolor: 'rgba(255,255,255,0.15)',
              border: '1.5px solid rgba(255,255,255,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AddIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography fontWeight={800} sx={{ color: '#fff', fontSize: { xs: '1.2rem', sm: '1.5rem' }, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              Create New Lead
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: { xs: '0.78rem', sm: '0.88rem' }, mt: 0.25 }}>
              Fill in the details below to register a new class lead
            </Typography>
          </Box>
        </Box>
        {/* Orbs */}
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -40, left: '30%', width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      </Box>

      {/* ── Form ─────────────────────────────────────────────────────── */}
      <Container maxWidth="md" sx={{ py: { xs: 1.5, sm: 3 } }}>
        <ClassLeadForm onSubmit={handleSubmit} loading={loading} submitButtonText="Create Lead" />
      </Container>

      <SnackbarNotification open={snack.open} message={snack.message} severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} />
      <ErrorDialog open={showError} onClose={clearError} error={error} title="Unable to Create Lead" />
      <PermissionDeniedDialog
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        message={errorMessage || 'You do not have permission to create leads.'}
        navigateOnClose={true}
      />
    </>
  );
}
