import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { XCircle, AlertCircle, ArrowRight, X } from 'lucide-react';

interface VerificationRejectedModalProps {
  open: boolean;
  onClose: () => void;
  reason?: string;
}

const VerificationRejectedModal: React.FC<VerificationRejectedModalProps> = ({
  open,
  onClose,
  reason,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleGoToVerification = () => {
    navigate('/tutor-verification-form');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          padding: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.error.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <XCircle size={48} color={theme.palette.error.main} />
        </Box>
        
        <Typography variant="h5" fontWeight={800} gutterBottom sx={{ color: '#1e293b' }}>
          Verification Rejected
        </Typography>
        
        <DialogContentText sx={{ mb: 3, color: '#64748b' }}>
          Your profile verification was not approved. Please review the reason below and update your documents.
        </DialogContentText>
        
        <Box
          sx={{
            p: 2,
            borderRadius: '16px',
            backgroundColor: alpha(theme.palette.error.main, 0.05),
            border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
            textAlign: 'left',
            mb: 3,
          }}
        >
          <Typography variant="caption" fontWeight={700} color="error" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
            Reason for Rejection:
          </Typography>
          <Typography variant="body2" color="#334155" fontWeight={500}>
            {reason || 'Please check your verification form for details.'}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ pb: 3, px: 3, flexDirection: 'column', gap: 1.5 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleGoToVerification}
          endIcon={<ArrowRight size={18} />}
          sx={{
            py: 1.5,
            borderRadius: '12px',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 700,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          Fix Verification Issues
        </Button>
        <Button
          fullWidth
          variant="text"
          onClick={onClose}
          sx={{
            py: 1,
            color: '#64748b',
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          I'll do it later
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerificationRejectedModal;
