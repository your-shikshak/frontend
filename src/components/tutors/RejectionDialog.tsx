import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  IconButton,
  CircularProgress,
  TextField,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface RejectionDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: (reason: string) => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const RejectionDialog: React.FC<RejectionDialogProps> = ({
  open,
  title = 'Reject Tutor',
  message = 'Please provide a clear reason for rejecting this tutor verification. This reason will be shown to the tutor.',
  onConfirm,
  onClose,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    setError('');
    await onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          boxShadow: '0px 20px 60px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pr: 6 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <ErrorOutlineIcon sx={{ fontSize: 40, color: 'error.main' }} />
          <Box>
            <Box fontWeight={700} fontSize="1.25rem">
              {title}
            </Box>
          </Box>
        </Box>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'text.secondary',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <DialogContentText sx={{ color: 'text.secondary', mb: 3 }}>
          {message}
        </DialogContentText>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          label="Reason for Rejection"
          placeholder="e.g. Profile photo is not clear, Aadhaar card mismatch, etc."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            borderRadius: '10px',
            fontWeight: 600,
            px: 3,
          }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          sx={{
            borderRadius: '10px',
            fontWeight: 600,
            px: 3,
          }}
          disabled={loading}
        >
          {loading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={18} color="inherit" />
              Rejecting...
            </Box>
          ) : (
            'Confirm Rejection'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RejectionDialog;
