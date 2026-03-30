import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  alpha,
  useTheme,
  Alert,
  CircularProgress,
  Dialog,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  ShieldCheck,
  FileText,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  User,
  CreditCard,
  Info,
  AlertCircle,
  FileCheck,
  Wallet,
  ScanLine,
  Clock,
  ThumbsUp,
  XCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { getMyProfile, uploadDocument, updateVerificationFeeStatus } from '../../services/tutorService';
import { useAuth } from '../../hooks/useAuth';
import type { ITutor, IDocument } from '../../types';

interface DocumentUpload {
  type: string;
  label: string;
  file: File | null;
  uploaded: boolean;
  existingDoc?: IDocument;
  isOptional?: boolean;
}

const VERIFICATION_FEE_AMOUNT = 500;

const docTypes: { type: string; label: string; isOptional?: boolean }[] = [
  { type: 'PROFILE_PHOTO', label: 'Profile Photo' },
  { type: 'AADHAAR', label: 'Aadhar Card' },
  { type: 'CERTIFICATE', label: 'Qualification Certificate' },
  { type: 'EXPERIENCE_PROOF', label: 'Experience Proof', isOptional: true },
];

const TutorVerificationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const [tutor, setTutor] = useState<ITutor | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>(() => {
    const initial: Record<string, DocumentUpload> = {};
    docTypes.forEach((doc) => {
      initial[doc.type] = {
        type: doc.type,
        label: doc.label,
        file: null,
        uploaded: false,
        isOptional: doc.isOptional,
      };
    });
    return initial;
  });

  const [feeFile, setFeeFile] = useState<File | null>(null);
  const [feeStatus, setFeeStatus] = useState<'PENDING' | 'DEDUCT'>('PENDING');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmedAuthentic, setConfirmedAuthentic] = useState(false);
  const [understandConsequences, setUnderstandConsequences] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyProfile();
        const tutorData = res.data;
        setTutor(tutorData);

        // Check if verification already submitted
        if (tutorData.verificationStatus === 'UNDER_REVIEW' || 
            tutorData.verificationStatus === 'VERIFIED') {
          setFormSubmitted(true);
        }

        // Check existing documents
        if (tutorData.documents) {
          setDocuments((prev) => {
            const updated = { ...prev };
            tutorData.documents?.forEach((doc: IDocument) => {
              if (updated[doc.documentType]) {
                updated[doc.documentType] = {
                  ...updated[doc.documentType],
                  uploaded: true,
                  existingDoc: doc,
                };
              }
            });
            return updated;
          });
        }

        // Check fee status
        if (tutorData.verificationFeeStatus) {
          if (tutorData.verificationFeeStatus === 'DEDUCT_FROM_FIRST_MONTH') {
            setFeeStatus('DEDUCT');
          } else if (tutorData.verificationFeeStatus === 'PAID') {
            setFeeStatus('PENDING'); // Already paid, but we show as pending for UI flow
          }
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load profile');
      }
    };

    fetchProfile();
  }, []);

  const handleFileSelect = useCallback((type: string, file: File | null) => {
    setDocuments((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        file,
      },
    }));
  }, []);

  const handleUploadDocument = async (type: string) => {
    const doc = documents[type];
    if (!doc.file) return;

    try {
      setLoading(true);
      setError(null);
      const res = await uploadDocument((tutor as any).id || tutor?._id || '', type, doc.file);
      setTutor(res.data);
      setDocuments((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          uploaded: true,
          file: null,
        },
      }));
    } catch (e: any) {
      setError(e?.response?.data?.message || `Failed to upload ${doc.label}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeSubmit = async () => {
    if (!tutor) return;

    try {
      setLoading(true);
      setError(null);

      const status = feeStatus === 'DEDUCT' ? 'DEDUCT_FROM_FIRST_MONTH' : 'PENDING';
      const res = await updateVerificationFeeStatus(
        (tutor as any).id || tutor._id,
        status,
        feeFile || undefined
      );
      setTutor(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update fee status');
    } finally {
      setLoading(false);
    }
  };

  const allMandatoryUploaded = () => {
    return docTypes
      .filter((d) => !d.isOptional)
      .every((d) => documents[d.type]?.uploaded);
  };

  const canProceedToNextStep = () => {
    if (activeStep === 0) {
      // Documents step - all mandatory must be uploaded
      return allMandatoryUploaded();
    }
    if (activeStep === 1) {
      // Fee step - must have either file or deduct option
      return feeStatus === 'DEDUCT' || feeFile !== null || tutor?.verificationFeeStatus === 'PAID';
    }
    if (activeStep === 2) {
      // Declaration step - all checkboxes must be checked
      return agreedToTerms && confirmedAuthentic && understandConsequences;
    }
    return true;
  };

  const handleNext = async () => {
    if (activeStep === 1) {
      await handleFeeSubmit();
    }
    if (activeStep < 4) {
      setActiveStep((prev) => prev + 1);
    } else {
      setFormSubmitted(true);
      setSuccess(true);
      setTimeout(() => {
        navigate('/tutor-profile');
      }, 2000);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const steps = ['Upload Documents', 'Payment', 'Declaration', 'Review', 'Submit'];

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 4,
            textAlign: 'center',
            bgcolor: alpha('#10b981', 0.05),
            border: `2px solid ${alpha('#10b981', 0.2)}`,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <CheckCircle size={40} color="white" />
          </Box>
          <Typography variant="h5" fontWeight={800} color="#1e293b" gutterBottom>
            Verification Submitted!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your documents have been uploaded successfully. Our team will review your application shortly.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={800}
          color="#1e293b"
          gutterBottom
          sx={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Tutor Verification
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete the verification process to become a verified tutor on our platform.
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          border: `1px solid ${alpha('#64748b', 0.1)}`,
          minHeight: 400,
        }}
      >
        {/* Step 1: Documents */}
        {activeStep === 0 && (
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 2, fontFamily: "'Manrope', sans-serif" }}
              >
                Step 1: Upload Required Documents
              </Typography>
              <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  Important: It is mandatory to upload all required documents for verification. Incomplete applications will not be processed.
                </Typography>
              </Alert>
            </Box>

            {/* Document Requirements Info */}
            <Card
              variant="outlined"
              sx={{
                mb: 3,
                borderRadius: 3,
                borderColor: alpha('#3b82f6', 0.3),
                bgcolor: alpha('#3b82f6', 0.02),
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info size={18} color="#2563eb" />
                  Required Documents
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2563eb', mt: 1 }} />
                      <Typography variant="body2" color="#475569">
                        <strong>Government ID Proof (Aadhaar)</strong> - front & back sides required
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2563eb', mt: 1 }} />
                      <Typography variant="body2" color="#475569">
                        <strong>Educational Certificates</strong> - Qualification proof
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2563eb', mt: 1 }} />
                      <Typography variant="body2" color="#475569">
                        <strong>Profile Picture</strong> - clear passport-size image (your own)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981', mt: 1 }} />
                      <Typography variant="body2" color="#475569">
                        <strong>Experience Proof</strong> - if applicable (optional)
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#f8fafc', 1),
                    border: `1px dashed ${alpha('#cbd5e1', 1)}`,
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <ThumbsUp size={14} color="#10b981" />
                    Document Upload Tips
                  </Typography>
                  <Typography variant="caption" color="#64748b" component="div" sx={{ pl: 1 }}>
                    • Upload both front and back sides of all documents (especially ID proof)<br/>
                    • Documents should be clear, readable, and not cropped<br/>
                    • Ensure good lighting when photographing documents
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              All documents marked with <span style={{ color: '#ef4444' }}>*</span> are mandatory.
              Experience proof is optional.
            </Typography>

            <Grid container spacing={3}>
              {docTypes.map((docType) => {
                const doc = documents[docType.type];
                const isUploaded = doc.uploaded;
                const hasFile = !!doc.file;

                return (
                  <Grid item xs={12} sm={6} key={docType.type}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        borderColor: isUploaded
                          ? alpha('#10b981', 0.3)
                          : hasFile
                          ? alpha('#3b82f6', 0.3)
                          : alpha('#64748b', 0.1),
                        bgcolor: isUploaded
                          ? alpha('#10b981', 0.02)
                          : hasFile
                          ? alpha('#3b82f6', 0.02)
                          : 'white',
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: isUploaded
                                ? alpha('#10b981', 0.1)
                                : hasFile
                                ? alpha('#3b82f6', 0.1)
                                : alpha('#64748b', 0.08),
                              color: isUploaded ? '#059669' : hasFile ? '#2563eb' : '#64748b',
                            }}
                          >
                            {isUploaded ? (
                              <CheckCircle size={24} />
                            ) : docType.type === 'PROFILE_PHOTO' ? (
                              <User size={24} />
                            ) : (
                              <FileText size={24} />
                            )}
                          </Box>
                          <Box flex={1}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {docType.label}
                              {!docType.isOptional && (
                                <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>
                              )}
                              {docType.isOptional && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ ml: 1 }}
                                >
                                  (Optional)
                                </Typography>
                              )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {isUploaded
                                ? 'Uploaded successfully'
                                : hasFile
                                ? 'Ready to upload'
                                : 'No file selected'}
                            </Typography>
                          </Box>
                        </Box>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,application/pdf"
                          onChange={(e) =>
                            handleFileSelect(docType.type, e.target.files?.[0] || null)
                          }
                          style={{ display: 'none' }}
                          id={`file-${docType.type}`}
                          disabled={formSubmitted}
                        />
                        <label htmlFor={`file-${docType.type}`}>
                          <Button
                            component="span"
                            variant="outlined"
                            fullWidth
                            startIcon={<Upload size={18} />}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                            }}
                            disabled={isUploaded || formSubmitted}
                          >
                            {isUploaded ? 'Uploaded' : hasFile ? 'Change File' : 'Select File'}
                          </Button>
                        </label>

                        {hasFile && !isUploaded && !formSubmitted && (
                          <Button
                            variant="contained"
                            fullWidth
                            sx={{ mt: 1, borderRadius: 2, textTransform: 'none' }}
                            onClick={() => handleUploadDocument(docType.type)}
                            disabled={loading || formSubmitted}
                          >
                            {loading ? (
                              <CircularProgress size={20} />
                            ) : (
                              <>
                                <Upload size={18} style={{ marginRight: 8 }} />
                                Upload Now
                              </>
                            )}
                          </Button>
                        )}

                        {doc.file && !isUploaded && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: 'block' }}
                          >
                            Selected: {doc.file.name}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Progress indicator */}
            <Box sx={{ mt: 4, p: 3, bgcolor: alpha('#f8fafc', 1), borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Document Upload Progress
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {docTypes.map((docType) => {
                  const isDone = documents[docType.type]?.uploaded;
                  return (
                    <Chip
                      key={docType.type}
                      label={docType.label}
                      size="small"
                      sx={{
                        bgcolor: isDone ? alpha('#10b981', 0.1) : alpha('#64748b', 0.08),
                        color: isDone ? '#059669' : '#64748b',
                        fontWeight: 600,
                      }}
                      icon={
                        isDone ? (
                          <CheckCircle size={14} color="#059669" />
                        ) : (
                          <FileText size={14} color="#64748b" />
                        )
                      }
                    />
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}

        {/* Step 2: Payment */}
        {activeStep === 1 && (
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 2, fontFamily: "'Manrope', sans-serif" }}
              >
                Step 2: Choose Verification Payment Option
              </Typography>

              {/* Show selected status if already chosen */}
              {(feeStatus === 'PENDING' || feeStatus === 'DEDUCT') && (
                <Alert
                  severity="success"
                  sx={{ mb: 3, borderRadius: 2 }}
                  icon={<CheckCircle size={24} />}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Payment option already selected:{' '}
                    <strong>
                      {feeStatus === 'DEDUCT'
                        ? 'Pay Later (₹700 deducted from first month)'
                        : feeFile
                        ? 'Pay Now - Screenshot uploaded'
                        : 'Pay Now (₹500) - Pending screenshot upload'}
                    </strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    You can change your selection below if needed, or click Next to continue.
                  </Typography>
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select your preferred payment method for the verification fee. You have two options available.
              </Typography>
            </Box>

            {tutor?.verificationFeeStatus === 'PAID' ? (
              <Alert severity="success" sx={{ mb: 3 }}>
                Your verification fee has already been paid!
              </Alert>
            ) : (
              <>
                {/* Payment Options Info Card */}
                <Card
                  variant="outlined"
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    borderColor: alpha('#8b5cf6', 0.3),
                    bgcolor: alpha('#8b5cf6', 0.02),
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Wallet size={18} color="#8b5cf6" />
                      Payment Options Explained
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#3b82f6', 0.05), border: `1px solid ${alpha('#3b82f6', 0.2)}` }}>
                          <Typography variant="subtitle2" fontWeight={700} color="#2563eb" gutterBottom>
                            Option 1: One-Time Payment (Recommended)
                          </Typography>
                          <Typography variant="body2" color="#475569" sx={{ mb: 1 }}>
                            • Pay <strong>₹500</strong> now via QR code<br/>
                            • Scan the QR code provided<br/>
                            • Upload the payment screenshot<br/>
                            • Submit your application immediately
                          </Typography>
                          <Typography variant="caption" color="#059669" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ThumbsUp size={12} />
                            Faster processing, no additional fees
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#f59e0b', 0.05), border: `1px solid ${alpha('#f59e0b', 0.2)}` }}>
                          <Typography variant="subtitle2" fontWeight={700} color="#d97706" gutterBottom>
                            Option 2: Deferred Payment
                          </Typography>
                          <Typography variant="body2" color="#475569" sx={{ mb: 1 }}>
                            • <strong>₹700</strong> will be deducted from first month<br/>
                            • No upfront payment required now<br/>
                            • Automatic deduction after first class<br/>
                            • Additional ₹200 processing fee applies
                          </Typography>
                          <Typography variant="caption" color="#f59e0b" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AlertCircle size={12} />
                            Higher cost but no immediate payment
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Grid container spacing={3}>
                  {/* Pay Now Option */}
                  <Grid item xs={12} md={6}>
                    <Card
                      variant="outlined"
                      onClick={() => !formSubmitted && setFeeStatus('PENDING')}
                      sx={{
                        borderRadius: 3,
                        cursor: formSubmitted ? 'default' : 'pointer',
                        borderColor:
                          feeStatus === 'PENDING'
                            ? alpha('#3b82f6', 0.5)
                            : alpha('#64748b', 0.1),
                        bgcolor:
                          feeStatus === 'PENDING' ? alpha('#3b82f6', 0.02) : 'white',
                        opacity: formSubmitted ? 0.7 : 1,
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor:
                                feeStatus === 'PENDING'
                                  ? alpha('#3b82f6', 0.1)
                                  : alpha('#64748b', 0.08),
                              color: feeStatus === 'PENDING' ? '#2563eb' : '#64748b',
                            }}
                          >
                            <CreditCard size={24} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                              Pay Now
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ₹{VERIFICATION_FEE_AMOUNT}
                            </Typography>
                          </Box>
                        </Box>

                        {feeStatus === 'PENDING' && (
                          <>
                            <Box
                              sx={{
                                p: 2,
                                bgcolor: 'white',
                                borderRadius: 2,
                                border: `1px solid ${alpha('#64748b', 0.1)}`,
                                textAlign: 'center',
                                mb: 2,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  boxShadow: `0 4px 12px ${alpha('#000', 0.1)}`,
                                  transform: 'scale(1.02)',
                                },
                              }}
                              onClick={() => setQrModalOpen(true)}
                            >
                              <img
                                src="/verification-qr.png"
                                alt="Payment QR"
                                style={{ width: 120, height: 120 }}
                              />
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                Click to enlarge
                              </Typography>
                            </Box>

                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setFeeFile(e.target.files?.[0] || null)}
                              style={{ display: 'none' }}
                              id="fee-file"
                              disabled={formSubmitted}
                            />
                            <label htmlFor="fee-file">
                              <Button
                                component="span"
                                variant="outlined"
                                fullWidth
                                startIcon={<Upload size={18} />}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                }}
                                disabled={formSubmitted}
                              >
                                {feeFile ? 'Change Screenshot' : 'Upload Payment Screenshot'}
                              </Button>
                            </label>

                            {feeFile && (
                              <Typography
                                variant="caption"
                                color="success.main"
                                sx={{ mt: 1, display: 'block' }}
                              >
                                <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                {feeFile.name}
                              </Typography>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Deduct from Salary Option */}
                  <Grid item xs={12} md={6}>
                    <Card
                      variant="outlined"
                      onClick={() => {
                        if (!formSubmitted) {
                          setFeeStatus('DEDUCT');
                          setFeeFile(null);
                        }
                      }}
                      sx={{
                        borderRadius: 3,
                        cursor: formSubmitted ? 'default' : 'pointer',
                        borderColor:
                          feeStatus === 'DEDUCT'
                            ? alpha('#f59e0b', 0.5)
                            : alpha('#64748b', 0.1),
                        bgcolor:
                          feeStatus === 'DEDUCT' ? alpha('#f59e0b', 0.02) : 'white',
                        opacity: formSubmitted ? 0.7 : 1,
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor:
                                feeStatus === 'DEDUCT'
                                  ? alpha('#f59e0b', 0.1)
                                  : alpha('#64748b', 0.08),
                              color: feeStatus === 'DEDUCT' ? '#d97706' : '#64748b',
                            }}
                          >
                            <CreditCard size={24} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                              Pay Later
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ₹{VERIFICATION_FEE_AMOUNT + 200}
                            </Typography>
                          </Box>
                        </Box>

                        {feeStatus === 'DEDUCT' && (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            The fee of ₹700 will be deducted from your first month's salary. This includes an additional ₹200 processing fee.
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}
          </Box>
        )}

        {/* Step 3: Declaration */}
        {activeStep === 2 && (
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 2, fontFamily: "'Manrope', sans-serif" }}
              >
                Step 3: Declaration & Consent
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                By submitting your application, you must agree to the following terms and conditions. Please read carefully and check all boxes to proceed.
              </Typography>
            </Box>

            <Card
              variant="outlined"
              sx={{
                mb: 3,
                borderRadius: 3,
                borderColor: alpha('#f59e0b', 0.3),
                bgcolor: alpha('#f59e0b', 0.02),
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScanLine size={18} color="#d97706" />
                  Terms & Conditions
                </Typography>

                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant="body2">
                    Any false or misleading information may lead to rejection or permanent disqualification from the platform.
                  </Typography>
                </Alert>

                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        disabled={formSubmitted}
                      />
                    }
                    label={
                      <Typography variant="body2" color="#475569">
                        I agree to the Terms & Conditions and Policies of the platform
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={confirmedAuthentic}
                        onChange={(e) => setConfirmedAuthentic(e.target.checked)}
                        disabled={formSubmitted}
                      />
                    }
                    label={
                      <Typography variant="body2" color="#475569">
                        I confirm that all uploaded documents are genuine, authentic, and not fake
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={understandConsequences}
                        onChange={(e) => setUnderstandConsequences(e.target.checked)}
                        disabled={formSubmitted}
                      />
                    }
                    label={
                      <Typography variant="body2" color="#475569">
                        I understand that any false or misleading information may lead to rejection or permanent disqualification
                      </Typography>
                    }
                  />
                </FormGroup>

                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#fef3c7', 0.5),
                    border: `1px solid ${alpha('#f59e0b', 0.2)}`,
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="#92400e" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <XCircle size={14} />
                    Common Reasons for Rejection
                  </Typography>
                  <Grid container spacing={1}>
                    {[
                      'Incomplete document uploads',
                      'Blurry or unclear document images',
                      'Information mismatch with uploaded documents',
                      'Fake or forged documents',
                      'Missing payment proof',
                    ].map((reason, i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <Typography variant="caption" color="#a16207" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                          {reason}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Step 4: Review */}
        {activeStep === 3 && (
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 2, fontFamily: "'Manrope', sans-serif" }}
              >
                Step 4: Review Process
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Here's what happens after you submit your application. Your respective manager will review your profile and documents.
              </Typography>
            </Box>

            <Card
              variant="outlined"
              sx={{
                mb: 3,
                borderRadius: 3,
                borderColor: alpha('#10b981', 0.3),
                bgcolor: alpha('#10b981', 0.02),
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Clock size={18} color="#059669" />
                  What to Expect
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          bgcolor: alpha('#3b82f6', 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <Clock size={28} color="#2563eb" />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Review Timeline
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Verification typically takes 2-3 business days depending on application volume
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          bgcolor: alpha('#8b5cf6', 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <FileCheck size={28} color="#8b5cf6" />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Manager Review
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your manager will review all documents and may contact you for clarification
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          bgcolor: alpha('#10b981', 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <ShieldCheck size={28} color="#059669" />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Final Decision
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        You'll receive notification once your verification is complete
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: alpha('#f8fafc', 1), border: `1px dashed ${alpha('#cbd5e1', 1)}` }}>
                  <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <ThumbsUp size={14} color="#10b981" />
                    Important Notes
                  </Typography>
                  <Typography variant="caption" color="#64748b" component="div" sx={{ pl: 1 }}>
                    • Keep your phone and email accessible for any clarification requests<br/>
                    • Respond promptly to any additional document requests<br/>
                    • Verification time may vary based on current application volume
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Application Summary */}
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: alpha('#64748b', 0.2),
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                  Application Summary
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Uploaded Documents
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {docTypes.map((docType) => {
                      const isDone = documents[docType.type]?.uploaded;
                      return (
                        <Chip
                          key={docType.type}
                          label={docType.label}
                          size="small"
                          color={isDone ? 'success' : 'default'}
                          icon={isDone ? <CheckCircle size={14} /> : <FileText size={14} />}
                        />
                      );
                    })}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Payment Option Selected
                  </Typography>
                  <Chip
                    label={
                      tutor?.verificationFeeStatus === 'PAID'
                        ? 'Paid'
                        : feeStatus === 'DEDUCT'
                        ? 'Deduct from Salary (₹700)'
                        : 'One-Time Payment (₹500)'
                    }
                    color="primary"
                    size="small"
                    icon={<CreditCard size={14} />}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Step 5: Submit */}
        {activeStep === 4 && (
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 2, fontFamily: "'Manrope', sans-serif" }}
              >
                Step 5: Submit & Verification Outcome
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review your complete application and submit for verification. Here's what happens next.
              </Typography>
            </Box>

            {/* Final Review Card */}
            <Card
              variant="outlined"
              sx={{
                mb: 3,
                borderRadius: 3,
                borderColor: alpha('#059669', 0.3),
                bgcolor: alpha('#10b981', 0.02),
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShieldCheck size={18} color="#059669" />
                  Final Confirmation
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#10b981', 0.05), border: `1px solid ${alpha('#10b981', 0.2)}`, height: '100%' }}>
                      <Typography variant="subtitle2" fontWeight={700} color="#059669" gutterBottom>
                        If Approved
                      </Typography>
                      <Typography variant="body2" color="#475569">
                        • Your profile will be activated<br/>
                        • You will start receiving opportunities/classes<br/>
                        • Full access to tutor dashboard<br/>
                        • Can begin teaching immediately
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#ef4444', 0.05), border: `1px solid ${alpha('#ef4444', 0.2)}`, height: '100%' }}>
                      <Typography variant="subtitle2" fontWeight={700} color="#dc2626" gutterBottom>
                        If Rejected
                      </Typography>
                      <Typography variant="body2" color="#475569">
                        • You will receive detailed reasons for rejection<br/>
                        • You can apply for re-verification after improvements<br/>
                        • Fix the issues mentioned and resubmit<br/>
                        • Contact support if you need assistance
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Important Reminders */}
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Before Submitting:
              </Typography>
              <Typography variant="body2">
                • Ensure all documents are clear and readable<br/>
                • Verify that all information matches your uploaded documents<br/>
                • Double-check your payment status<br/>
                • Incomplete applications will not be processed
              </Typography>
            </Alert>

            {/* Ready to Submit */}
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: alpha('#6366f1', 0.3),
                bgcolor: alpha('#6366f1', 0.02),
                textAlign: 'center',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: alpha('#6366f1', 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <CheckCircle size={32} color="#6366f1" />
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Ready to Submit!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  By clicking submit, you confirm that all information provided is accurate and all documents are genuine. Our team will review your application within 2-3 business days.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}
      </Paper>

      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0 || formSubmitted}
          startIcon={<ChevronLeft size={18} />}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Back
        </Button>

        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!canProceedToNextStep() || loading || formSubmitted}
          endIcon={activeStep === 4 ? <CheckCircle size={18} /> : <ChevronRight size={18} />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            bgcolor: activeStep === 4 ? '#10b981' : undefined,
            '&:hover': {
              bgcolor: activeStep === 4 ? '#059669' : undefined,
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : activeStep === 4 ? (
            'Submit Application'
          ) : (
            'Next'
          )}
        </Button>
      </Box>

      {/* QR Modal */}
      <Dialog
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 3,
            textAlign: 'center',
          },
        }}
      >
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Scan to Pay
        </Typography>
        <Box sx={{ p: 2 }}>
          <img
            src="/verification-qr.png"
            alt="Payment QR"
            style={{ width: 280, height: 280, maxWidth: '100%' }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Amount: ₹{VERIFICATION_FEE_AMOUNT}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          KAMALJEET DANGI SO VINOD SINGH
        </Typography>
        <Button
          variant="contained"
          onClick={() => setQrModalOpen(false)}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Close
        </Button>
      </Dialog>
    </Container>
  );
};

export default TutorVerificationFormPage;
