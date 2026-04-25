import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Button,
  alpha,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  X,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Shield,
} from 'lucide-react';

interface DocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
  docType: { type: string; label: string };
  onUpload: (file: File) => Promise<void>;
  loading: boolean;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  open,
  onClose,
  docType,
  onUpload,
  loading,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to upload document');
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedFile(null);
    setError(null);
    onClose();
  };

  const isImage = selectedFile?.type.startsWith('image/');
  const isPdf = selectedFile?.type === 'application/pdf';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: alpha('#e2e8f0', 0.8),
          bgcolor: alpha('#f8fafc', 0.5),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: alpha('#3b82f6', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UploadCloud size={20} color="#3b82f6" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              Upload {docType.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Max size {MAX_FILE_SIZE_MB}MB • PDF, JPG, PNG
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: '#64748b',
            '&:hover': { bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' },
          }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        {error && (
          <Alert
            severity="error"
            icon={<AlertCircle size={18} />}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {error}
          </Alert>
        )}

        {!selectedFile ? (
          <Box
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: `2px dashed ${alpha('#3b82f6', 0.3)}`,
              borderRadius: 4,
              p: 6,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: alpha('#3b82f6', 0.02),
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha('#3b82f6', 0.05),
                borderColor: '#3b82f6',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept=".pdf,image/*"
            />
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: alpha('#3b82f6', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <UploadCloud size={32} color="#3b82f6" />
            </Box>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Click or drag file to upload
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Support PDF, JPG, PNG formats up to {MAX_FILE_SIZE_MB}MB
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box
              sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: alpha('#f1f5f9', 0.5),
                border: '1px solid',
                borderColor: alpha('#e2e8f0', 0.8),
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '12px',
                  bgcolor: isImage ? alpha('#10b981', 0.1) : alpha('#3b82f6', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isImage ? (
                  <ImageIcon size={24} color="#10b981" />
                ) : (
                  <FileText size={24} color="#3b82f6" />
                )}
              </Box>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => setSelectedFile(null)}
                disabled={loading}
                sx={{
                  bgcolor: alpha('#ef4444', 0.1),
                  color: '#ef4444',
                  '&:hover': { bgcolor: alpha('#ef4444', 0.2) },
                }}
              >
                <X size={16} />
              </IconButton>
            </Box>

            <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#10b981', 0.05), display: 'flex', gap: 1.5, mb: 4 }}>
              <Shield size={18} color="#059669" />
              <Typography variant="caption" color="#059669" fontWeight={500}>
                Your document is encrypted and stored securely. Only authorized managers can view it.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setSelectedFile(null)}
                disabled={loading}
                sx={{ borderRadius: 2.5, textTransform: 'none', py: 1.5, fontWeight: 700 }}
              >
                Change File
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleUploadClick}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle size={20} />}
                sx={{
                  borderRadius: 2.5,
                  textTransform: 'none',
                  py: 1.5,
                  fontWeight: 700,
                  boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
                }}
              >
                {loading ? 'Uploading...' : 'Confirm & Upload'}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadModal;
