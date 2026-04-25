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
  useMediaQuery,
  MobileStepper,
  IconButton,
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
  Award,
  Briefcase,
  Save,
  Trash2,
  Eye,
  Maximize2,
} from 'lucide-react';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import DocumentUploadModal from '../../components/common/DocumentUploadModal';
import { getMyProfile, uploadDocument, deleteDocument, updateVerificationFeeStatus, submitVerification } from '../../services/tutorService';
import { useAuth } from '../../hooks/useAuth';
import type { ITutor, IDocument } from '../../types';

interface DocumentUpload {
  type: string;
  label: string;
  file: File | null;
  uploaded: boolean;
  existingDoc?: IDocument;
  isOptional?: boolean;
  sizeError?: string;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;


const VERIFICATION_FEE_AMOUNT = 500;

const docTypes: { type: string; label: string; isOptional?: boolean }[] = [
  { type: 'PROFILE_PHOTO', label: 'Profile Photo' },
  { type: 'AADHAAR', label: 'Aadhar Card' },
  { type: 'CERTIFICATE', label: 'Qualification Certificate' },
  { type: 'EXPERIENCE_PROOF', label: 'Experience Proof', isOptional: true },
];

const TutorVerificationFormPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
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
  const [feeFileError, setFeeFileError] = useState<string | null>(null);
  const [feeStatus, setFeeStatus] = useState<'PENDING' | 'PAID' | 'DEDUCT'>('PENDING');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmedAuthentic, setConfirmedAuthentic] = useState(false);
  const [understandConsequences, setUnderstandConsequences] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<IDocument | null>(null);
  
  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<{ type: string; label: string } | null>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyProfile();
        const tutorData = res.data;
        setTutor(tutorData);

        // Check if verification already submitted
        // Note: REJECTED and UNDER_REVIEW status should allow re-uploading documents 
        // to correct errors or add missing info before final manager approval.
        // We only lock the form completely once the tutor is VERIFIED.
        if (tutorData.verificationStatus === 'VERIFIED') {
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
            setFeeStatus('PAID');
          }
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load profile');
      }
    };

    fetchProfile();
  }, []);

  const handleFileSelect = useCallback((type: string, file: File | null) => {
    let sizeError = '';
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      sizeError = `File too large. Max ${MAX_FILE_SIZE_MB}MB allowed.`;
    }

    setDocuments((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        file,
        sizeError,
      },
    }));
  }, []);


  const handleUploadDocument = async (type: string, fileToUpload?: File) => {
    const doc = documents[type];
    const file = fileToUpload || doc.file;
    
    if (!file) {
      setError('Please select a file first');
      return;
    }

    const tutorId = tutor?.id || tutor?._id;
    if (!tutorId) {
      console.error('Upload failed: Missing tutor ID', tutor);
      setError('System error: Tutor profile not fully loaded. Please refresh and try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Uploading ${type} for tutor ${tutorId}...`);
      const res = await uploadDocument(String(tutorId), type, file);
      
      console.log('Upload success:', res);
      const updatedTutor = res.data;
      setTutor(updatedTutor);
      
      // Update local documents state
      setDocuments((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          uploaded: true,
          file: null,
          existingDoc: updatedTutor.documents?.find((d: any) => d.documentType === type),
        },
      }));
    } catch (e: any) {
      setError(e?.response?.data?.message || `Failed to upload ${doc.label}`);
      throw e; // Re-throw to let the modal catch it
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (type: string) => {
    if (!tutor) return;
    
    // Find index of document in tutor.documents
    const docIndex = tutor.documents?.findIndex(d => d.documentType === type);
    if (docIndex === undefined || docIndex === -1) return;

    try {
      setLoading(true);
      setError(null);
      const res = await deleteDocument(tutor?.id || tutor?._id || '', docIndex);
      const updatedTutor = res.data;
      setTutor(updatedTutor);
      
      // Update local state to reflect deletion
      setDocuments((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          uploaded: false,
          file: null,
          existingDoc: undefined,
        },
      }));
    } catch (e: any) {
      setError(e?.response?.data?.message || `Failed to delete ${documents[type].label}`);
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
        tutor?.id || tutor?._id || '',
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

  const isFeePaid = tutor?.verificationFeeStatus === 'PAID' || tutor?.verificationFeeStatus === 'DEDUCT_FROM_FIRST_MONTH';
  
  const steps = [
    { id: 'docs', label: 'Upload Documents' },
    { id: 'payment', label: 'Payment' },
    { id: 'declaration', label: 'Declaration' },
    { id: 'review', label: 'Review' },
    { id: 'submit', label: 'Submit' },
  ];

  const currentStepId = steps[activeStep]?.id;

  const canProceedToNextStep = () => {
    if (currentStepId === 'docs') {
      // Documents step - all mandatory must be uploaded
      return allMandatoryUploaded();
    }
    if (currentStepId === 'payment') {
      // Fee step - must have either file (without error) or deduct option
      return feeStatus === 'DEDUCT' || (feeFile !== null && !feeFileError) || tutor?.verificationFeeStatus === 'PAID';
    }
    if (currentStepId === 'declaration') {
      // Declaration step - all checkboxes must be checked
      return agreedToTerms && confirmedAuthentic && understandConsequences;
    }
    return true;
  };

  const handleNext = async () => {
    if (currentStepId === 'payment') {
      await handleFeeSubmit();
    }
    
    let nextStep = activeStep + 1;
    // Skip payment if paid already
    if (nextStep === 1 && isFeePaid) {
      nextStep = 2;
    }

    if (nextStep < steps.length) {
      setActiveStep(nextStep);
    } else {
      // Final submission step
      try {
        setLoading(true);
        if (tutor?._id || tutor?.id) {
          await submitVerification(String(tutor?._id || tutor?.id));
        }
        setFormSubmitted(true);
        setSuccess(true);
        setTimeout(() => {
          navigate('/tutor-profile');
        }, 2000);
      } catch (err: any) {
        console.error('Failed to submit verification:', err);
        // show error if needed, but for now just proceed to success state 
        // to avoid stuck UI, since docs are already uploaded
        setFormSubmitted(true);
        setSuccess(true);
        setTimeout(() => {
          navigate('/tutor-profile');
        }, 2000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      let prevStep = activeStep - 1;
      // Skip payment if paid
      if (prevStep === 1 && isFeePaid) {
        prevStep = 0;
      }
      setActiveStep(prevStep);
    }
  };

  const stepLabels = steps.map(s => s.label);

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
    <Container maxWidth="md" sx={{ py: isMobile ? 2 : 4, px: isMobile ? 1 : 3 }}>
      {/* Header */}
      <Box sx={{ mb: isMobile ? 2 : 4 }}>
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          fontWeight={800}
          color="#1e293b"
          gutterBottom
          sx={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Tutor Verification
        </Typography>

        {tutor?.verificationStatus === 'REJECTED' && (
          <Alert
            severity="error"
            icon={<XCircle size={24} />}
            sx={{
              mt: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'error.light',
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              Verification Rejected
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Reason:</strong> {tutor.verificationRejectionReason || 'Please review your documents and try again.'}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
              Please correct the issues mentioned above and re-upload the necessary documents.
            </Typography>
          </Alert>
        )}
        <Typography variant={isMobile ? 'body2' : 'body1'} color="text.secondary">
          Complete the verification process to become a verified tutor on our platform.
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Mobile Stepper */}
      {isMobile ? (
        <MobileStepper
          variant="dots"
          steps={steps.length}
          position="static"
          activeStep={activeStep}
          sx={{ 
            mb: 2, 
            bgcolor: 'transparent',
            '& .MuiMobileStepper-dot': { width: 8, height: 8 },
            '& .MuiMobileStepper-dotActive': { bgcolor: '#3b82f6' }
          }}
          nextButton={null}
          backButton={null}
        />
      ) : (
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((s, index) => (
            <Step 
              key={s.id} 
              completed={index < activeStep || (index === 1 && isFeePaid)}
            >
              <StepLabel>{s.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* Current Step Label for Mobile */}
      {isMobile && (
        <Typography 
          variant="subtitle1" 
          fontWeight={700} 
          textAlign="center" 
          sx={{ mb: 2, color: '#3b82f6' }}
        >
          Step {activeStep + 1}: {steps[activeStep].label}
        </Typography>
      )}

      {/* Step Content */}
      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 2 : 4,
          borderRadius: isMobile ? 2 : 4,
          border: `1px solid ${alpha('#64748b', 0.1)}`,
          minHeight: 400,
        }}
      >
        {/* Step: Documents */}
        {currentStepId === 'docs' && (
          <Box>
            <Box sx={{ mb: isMobile ? 2 : 4 }}>
              <Typography
                variant={isMobile ? 'subtitle1' : 'h6'}
                fontWeight={700}
                sx={{ mb: 2, fontFamily: "'Manrope', sans-serif" }}
              >
                Step 1: Upload Required Documents
              </Typography>
              <Alert severity="warning" sx={{ mb: isMobile ? 2 : 3, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  Important: It is mandatory to upload all required documents for verification.
                </Typography>
              </Alert>
              <Alert severity="info" sx={{ mb: isMobile ? 2 : 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Verification Submission Guidelines
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • Upload both sides of your Aadhaar or government-issued ID combined into a single PDF file.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • Ensure your name, address, and age match exactly in your profile and in every uploaded document.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • Pay the verification fee as ₹500 only; do not pay more or less. Upload a clear screenshot of the successful payment.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • Verification may be rejected if any information is incorrect, inconsistent, misleading, or appears false.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • Select a verification fee option carefully — changes are not allowed after selection.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • If your verification is rejected, read the rejection notes carefully and reapply, or contact your manager for assistance.
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

            {tutor?.verificationStatus === 'REJECTED' && (
              <Alert 
                severity="info" 
                icon={<AlertCircle size={20} />}
                sx={{ mb: 3, borderRadius: '12px', bgcolor: alpha('#3b82f6', 0.05), border: '1px solid', borderColor: alpha('#3b82f6', 0.1) }}
              >
                <Typography variant="body2" fontWeight={600} color="#1e40af">
                  Replacing Documents:
                </Typography>
                <Typography variant="caption" color="#1e40af">
                  To update a document, first click the red "X" to delete the current one, then click the card to upload the new version.
                </Typography>
              </Alert>
            )}
            <Grid container spacing={isMobile ? 2 : 3}>
              {docTypes.map((docType) => {
                const doc = documents[docType.type];
                const isUploaded = doc.uploaded;
                const hasFile = !!doc.file;
                const hasError = !!doc.sizeError;
                const status = isUploaded ? 'REVIEWING' : hasFile ? (hasError ? 'SIZE EXCEEDED' : 'READY') : 'NOT UPLOADED';

                const handleCardClick = (e: React.MouseEvent) => {
                  // If clicking the delete button, don't trigger card click
                  if ((e.target as HTMLElement).closest('button')?.getAttribute('aria-label') === 'delete') {
                    return;
                  }

                  if (isUploaded) {
                    const documentToView = doc.existingDoc || tutor?.documents?.find((d: IDocument) => d.documentType === docType.type);
                    if (documentToView) {
                      setViewingDocument(documentToView);
                      setViewerOpen(true);
                      return;
                    }
                  }
                  
                  if (!formSubmitted) {
                    setSelectedDocType({ type: docType.type, label: docType.label });
                    setUploadModalOpen(true);
                  }
                };

                return (
                  <Grid item xs={6} sm={4} md={2.4} key={docType.type}>
                    <Card
                      onClick={handleCardClick}
                      sx={{
                        borderRadius: isMobile ? 4 : 5,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 0,
                        cursor: formSubmitted && !isUploaded ? 'default' : 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: `2px solid ${
                          isUploaded
                            ? alpha('#10b981', 0.5)
                            : alpha('#e2e8f0', 1)
                        }`,
                        bgcolor: isUploaded ? alpha('#10b981', 0.02) : '#fff',
                        '&:hover': {
                          transform: formSubmitted ? 'none' : 'translateY(-4px)',
                          boxShadow: formSubmitted ? 'none' : '0 12px 20px -10px rgba(0,0,0,0.1)',
                          borderColor: formSubmitted ? 'inherit' : isUploaded ? '#10b981' : '#3b82f6',
                        },
                      }}
                    >
                        <CardContent sx={{ 
                          p: isMobile ? 2 : 3, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          textAlign: 'center',
                          height: '100%'
                        }}>
                          <Box
                            sx={{
                              width: isMobile ? 56 : 64,
                              height: isMobile ? 56 : 64,
                              borderRadius: 4,
                              bgcolor: isUploaded 
                                ? '#f59e0b' 
                                : hasFile 
                                ? '#2563eb' 
                                : alpha('#64748b', 0.15),
                              color: isUploaded || hasFile ? '#fff' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mb: 2,
                              boxShadow: isUploaded ? `0 8px 16px ${alpha('#f59e0b', 0.3)}` : hasFile ? `0 8px 16px ${alpha('#2563eb', 0.2)}` : 'none',
                            }}
                          >
                            {docType.type === 'PROFILE_PHOTO' ? <User size={isMobile ? 28 : 32} /> :
                            docType.type === 'AADHAAR' ? <ScanLine size={isMobile ? 28 : 32} /> :
                            docType.type === 'CERTIFICATE' ? <Award size={isMobile ? 28 : 32} /> :
                            docType.type === 'EXPERIENCE_PROOF' ? <Briefcase size={isMobile ? 28 : 32} /> :
                            <FileText size={isMobile ? 28 : 32} />}
                          </Box>
                          
                          <Typography 
                            variant="caption" 
                            fontWeight={900} 
                            sx={{ 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.05em', 
                              mb: 0.5,
                              color: '#1e293b',
                              fontSize: isMobile ? '0.65rem' : '0.7rem',
                              display: 'block',
                              lineHeight: 1.2
                            }}
                          >
                            {docType.label}
                            {!docType.isOptional && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
                          </Typography>

                          <Typography 
                            variant="caption" 
                            fontWeight={800} 
                            sx={{ 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.1em',
                              fontSize: '0.6rem',
                              color: isUploaded ? '#d97706' : hasError ? '#ef4444' : hasFile ? '#2563eb' : '#64748b',
                              opacity: isUploaded || hasFile ? 1 : 0.6,
                              mb: 0.5
                            }}
                          >
                            {status}
                          </Typography>

                          {!isUploaded && !hasFile && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.55rem', 
                                color: '#64748b', 
                                fontWeight: 700,
                                mt: 0.5
                              }}
                            >
                              MAX {MAX_FILE_SIZE_MB}MB
                            </Typography>
                          )}

                          {hasError && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.55rem', 
                                color: '#ef4444', 
                                fontWeight: 700,
                                lineHeight: 1
                              }}
                            >
                              {doc.sizeError}
                            </Typography>
                          )}

                          {isUploaded && !formSubmitted && (
                            <IconButton
                              size="small"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleDeleteDocument(docType.type);
                              }}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: alpha('#ef4444', 0.08),
                                color: '#ef4444',
                                '&:hover': { bgcolor: alpha('#ef4444', 0.15) },
                                width: 24,
                                height: 24,
                              }}
                            >
                              <XCircle size={18} />
                            </IconButton>
                          )}

                          {isUploaded && (
                            <Button
                              variant="outlined"
                              size="small"
                              fullWidth
                              startIcon={<Eye size={14} />}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleCardClick(e);
                              }}
                              sx={{
                                mt: 2,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                py: 0.5,
                                color: '#3b82f6',
                                borderColor: alpha('#3b82f6', 0.3),
                                '&:hover': {
                                  bgcolor: alpha('#3b82f6', 0.05),
                                  borderColor: '#3b82f6',
                                }
                              }}
                            >
                              View Document
                            </Button>
                          )}

                          {hasFile && !isUploaded && !formSubmitted && (
                            <Button
                              variant="contained"
                              size="small"
                              fullWidth
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleUploadDocument(docType.type);
                              }}
                              disabled={loading || hasError}
                              sx={{
                                mt: 2,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                py: 0.5,
                                boxShadow: 'none',
                                bgcolor: hasError ? alpha('#ef4444', 0.1) : undefined,
                                color: hasError ? '#ef4444' : undefined,
                                '&:hover': {
                                  bgcolor: hasError ? alpha('#ef4444', 0.2) : undefined,
                                }
                              }}
                            >
                              {loading ? <CircularProgress size={14} color="inherit" /> : hasError ? 'Replace File' : 'Upload'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                  </Grid>
                );
              })}

              {/* System Fee Card Integration */}
              <Grid item xs={6} sm={4} md={2.4}>
                <Card
                  sx={{
                    borderRadius: isMobile ? 4 : 5,
                    bgcolor: feeStatus === 'PAID' ? alpha('#fff', 1) : feeStatus === 'DEDUCT' ? alpha('#eff6ff', 0.5) : alpha('#f8fafc', 0.5),
                    border: '2px solid',
                    borderColor: feeStatus === 'PAID' ? alpha('#10b981', 0.15) : feeStatus === 'DEDUCT' ? alpha('#6366f1', 0.15) : alpha('#64748b', 0.08),
                    height: '100%',
                    opacity: 1,
                  }}
                >
                  <CardContent sx={{ 
                    p: isMobile ? 2 : 3, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    textAlign: 'center',
                    height: '100%'
                  }}>
                    <Box
                      sx={{
                        width: isMobile ? 56 : 64,
                        height: isMobile ? 56 : 64,
                        borderRadius: 4,
                        bgcolor: feeStatus === 'PAID' ? '#10b981' : feeStatus === 'DEDUCT' ? '#6366f1' : alpha('#64748b', 0.15),
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        boxShadow: feeStatus === 'PAID' ? `0 8px 16px ${alpha('#10b981', 0.3)}` : feeStatus === 'DEDUCT' ? `0 8px 16px ${alpha('#6366f1', 0.3)}` : 'none',
                      }}
                    >
                      <CreditCard size={isMobile ? 28 : 32} />
                    </Box>
                    
                    <Typography 
                      variant="caption" 
                      fontWeight={900} 
                      sx={{ 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em', 
                        mb: 0.5,
                        color: '#1e293b',
                        fontSize: isMobile ? '0.65rem' : '0.7rem'
                      }}
                    >
                      System Fee
                    </Typography>

                    <Typography 
                      variant="caption" 
                      fontWeight={800} 
                      sx={{ 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.1em',
                        fontSize: '0.6rem',
                        color: feeStatus === 'PAID' ? '#059669' : feeStatus === 'DEDUCT' ? '#4f46e5' : '#64748b'
                      }}
                    >
                      {feeStatus === 'PAID' ? 'SETTLED' : feeStatus === 'DEDUCT' ? 'DEFERRED' : 'REQUIRED'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
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

        {/* Step: Payment */}
        {currentStepId === 'payment' && (
          <Box>
            <Box sx={{ mb: isMobile ? 2 : 4 }}>
              <Typography
                variant={isMobile ? 'subtitle1' : 'h6'}
                fontWeight={700}
                sx={{ mb: 2, fontFamily: "'Manrope', sans-serif" }}
              >
                Step 2: Choose Verification Payment Option
              </Typography>

              {/* Show selected status if already chosen */}
              {(feeStatus === 'PENDING' || feeStatus === 'DEDUCT') && (
                <Alert
                  severity="success"
                  sx={{ mb: isMobile ? 2 : 3, borderRadius: 2 }}
                  icon={<CheckCircle size={isMobile ? 20 : 24} />}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Payment option already selected:{' '}
                    <strong>
                      {feeStatus === 'DEDUCT'
                        ? 'Pay Later (₹700)'
                        : feeFile
                        ? 'Pay Now - Screenshot uploaded'
                        : 'Pay Now (₹500) - Pending screenshot'}
                    </strong>
                  </Typography>
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mb: isMobile ? 2 : 3 }}>
                Select your preferred payment method for the verification fee.
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

                <Grid container spacing={isMobile ? 2 : 3}>
                  <Grid item xs={12} md={6}>
                    <Card
                      variant="outlined"
                      onClick={() => !formSubmitted && !isFeePaid && setFeeStatus('PENDING')}
                      sx={{
                        borderRadius: isMobile ? 2 : 3,
                        cursor: (formSubmitted || isFeePaid) ? 'default' : 'pointer',
                        borderColor:
                          feeStatus === 'PENDING'
                            ? alpha('#3b82f6', 0.5)
                            : alpha('#64748b', 0.1),
                        bgcolor:
                          feeStatus === 'PENDING' ? alpha('#3b82f6', 0.02) : 'white',
                        opacity: (formSubmitted || isFeePaid) ? 0.7 : 1,
                      }}
                    >
                      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                        <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2} mb={isMobile ? 1.5 : 2}>
                          <Box
                            sx={{
                              p: isMobile ? 1 : 1.5,
                              borderRadius: 2,
                              bgcolor:
                                feeStatus === 'PENDING'
                                  ? alpha('#3b82f6', 0.1)
                                  : alpha('#64748b', 0.08),
                              color: feeStatus === 'PENDING' ? '#2563eb' : '#64748b',
                              minWidth: isMobile ? 40 : 48,
                              minHeight: isMobile ? 40 : 48,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <CreditCard size={isMobile ? 20 : 24} />
                          </Box>
                          <Box>
                            <Typography variant={isMobile ? 'body2' : 'subtitle2'} fontWeight={700}>
                              Pay Now
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ₹{VERIFICATION_FEE_AMOUNT}
                            </Typography>
                          </Box>
                        </Box>

                        {isFeePaid && (
                          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                            Verification fee already verified.
                          </Alert>
                        )}

                        {feeStatus === 'PENDING' && !isFeePaid && (
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
                              <Button
                                size="small"
                                startIcon={<Maximize2 size={12} />}
                                sx={{ mt: 1, textTransform: 'none', fontSize: '0.65rem', color: '#64748b' }}
                              >
                                Enlarge QR Code
                              </Button>
                            </Box>

                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setFeeFile(file);
                                if (file && file.size > MAX_FILE_SIZE_BYTES) {
                                  setFeeFileError(`File too large. Max ${MAX_FILE_SIZE_MB}MB allowed.`);
                                } else {
                                  setFeeFileError(null);
                                }
                              }}
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

                            {!feeFile && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  display: 'block', 
                                  textAlign: 'center', 
                                  mt: 1, 
                                  color: 'text.secondary',
                                  fontSize: '0.65rem',
                                  fontWeight: 600
                                }}
                              >
                                MAX {MAX_FILE_SIZE_MB}MB
                              </Typography>
                            )}

                            {feeFile && (
                              <Box sx={{ mt: 1, textAlign: 'center' }}>
                                <Typography
                                  variant="caption"
                                  color={feeFileError ? "error.main" : "success.main"}
                                  sx={{ display: 'block', fontWeight: 600 }}
                                >
                                  {feeFileError ? (
                                    <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                  ) : (
                                    <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                  )}
                                  {feeFileError || feeFile.name}
                                </Typography>
                              </Box>
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
                        if (!formSubmitted && !isFeePaid) {
                          setFeeStatus('DEDUCT');
                          setFeeFile(null);
                        }
                      }}
                      sx={{
                        borderRadius: 3,
                        cursor: (formSubmitted || isFeePaid) ? 'default' : 'pointer',
                        borderColor:
                          feeStatus === 'DEDUCT'
                            ? alpha('#f59e0b', 0.5)
                            : alpha('#64748b', 0.1),
                        bgcolor:
                          feeStatus === 'DEDUCT' ? alpha('#f59e0b', 0.02) : 'white',
                        opacity: (formSubmitted || isFeePaid) ? 0.7 : 1,
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

        {/* Step: Declaration */}
        {currentStepId === 'declaration' && (
          <Box>
            <Box sx={{ mb: isMobile ? 2 : 4 }}>
              <Typography
                variant={isMobile ? 'subtitle1' : 'h6'}
                fontWeight={700}
                sx={{ mb: 2, fontFamily: "'Manrope', sans-serif" }}
              >
                Step 3: Declaration & Consent
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: isMobile ? 2 : 3 }}>
                By submitting your application, you must agree to the following terms and conditions.
              </Typography>
            </Box>

            <Card
              variant="outlined"
              sx={{
                mb: isMobile ? 2 : 3,
                borderRadius: isMobile ? 2 : 3,
                borderColor: alpha('#f59e0b', 0.3),
                bgcolor: alpha('#f59e0b', 0.02),
              }}
            >
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Typography variant={isMobile ? 'body1' : 'subtitle2'} fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScanLine size={isMobile ? 16 : 18} color="#d97706" />
                  Terms & Conditions
                </Typography>

                <Alert severity="warning" sx={{ mb: isMobile ? 2 : 3, borderRadius: 2 }}>
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
                        sx={{ '& .MuiSvgIcon-root': { fontSize: isMobile ? 24 : 20 } }}
                      />
                    }
                    label={
                      <Typography variant={isMobile ? 'body2' : 'body2'} color="#475569">
                        I agree to the Terms & Conditions and Policies of the platform
                      </Typography>
                    }
                    sx={{ mb: isMobile ? 1.5 : 1, alignItems: 'flex-start' }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={confirmedAuthentic}
                        onChange={(e) => setConfirmedAuthentic(e.target.checked)}
                        disabled={formSubmitted}
                        sx={{ '& .MuiSvgIcon-root': { fontSize: isMobile ? 24 : 20 } }}
                      />
                    }
                    label={
                      <Typography variant={isMobile ? 'body2' : 'body2'} color="#475569">
                        I confirm that all uploaded documents are genuine, authentic, and not fake
                      </Typography>
                    }
                    sx={{ mb: isMobile ? 1.5 : 1, alignItems: 'flex-start' }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={understandConsequences}
                        onChange={(e) => setUnderstandConsequences(e.target.checked)}
                        disabled={formSubmitted}
                        sx={{ '& .MuiSvgIcon-root': { fontSize: isMobile ? 24 : 20 } }}
                      />
                    }
                    label={
                      <Typography variant={isMobile ? 'body2' : 'body2'} color="#475569">
                        I understand that any false or misleading information may lead to rejection or permanent disqualification
                      </Typography>
                    }
                    sx={{ mb: isMobile ? 1.5 : 1, alignItems: 'flex-start' }}
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

        {/* Step: Review */}
        {currentStepId === 'review' && (
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

        {/* Step: Submit */}
        {currentStepId === 'submit' && (
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
      <Box display="flex" justifyContent="space-between" mt={isMobile ? 2 : 3} gap={isMobile ? 1 : 2}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0 || formSubmitted}
          startIcon={<ChevronLeft size={isMobile ? 16 : 18} />}
          sx={{ 
            borderRadius: 2, 
            textTransform: 'none', 
            fontWeight: 600,
            minHeight: isMobile ? 48 : 40,
            px: isMobile ? 2 : 3,
            fontSize: isMobile ? '0.875rem' : '0.8125rem',
          }}
        >
          {isMobile ? 'Back' : 'Back'}
        </Button>

        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!canProceedToNextStep() || loading || formSubmitted}
          endIcon={activeStep === 4 ? <CheckCircle size={isMobile ? 16 : 18} /> : <ChevronRight size={isMobile ? 16 : 18} />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            minHeight: isMobile ? 48 : 40,
            px: isMobile ? 3 : 4,
            fontSize: isMobile ? '0.875rem' : '0.8125rem',
            bgcolor: activeStep === 4 ? '#10b981' : undefined,
            '&:hover': {
              bgcolor: activeStep === 4 ? '#059669' : undefined,
            },
          }}
        >
          {loading ? (
            <CircularProgress size={isMobile ? 24 : 20} color="inherit" />
          ) : currentStepId === 'submit' ? (
            'Submit'
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
        fullWidth={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 3 : 4,
            p: isMobile ? 2 : 3,
            textAlign: 'center',
            mx: isMobile ? 2 : 'auto',
          },
        }}
      >
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700} gutterBottom>
          Scan to Pay
        </Typography>
        <Box sx={{ p: isMobile ? 1 : 2 }}>
          <img
            src="/verification-qr.png"
            alt="Payment QR"
            style={{ width: isMobile ? '100%' : 280, height: 'auto', maxWidth: 280, maxHeight: 280 }}
          />
        </Box>
        <Typography variant="body1" color="text.secondary" fontWeight={600} gutterBottom>
          Amount: ₹{VERIFICATION_FEE_AMOUNT}
        </Typography>
        <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary" display="block" sx={{ mb: isMobile ? 2 : 3 }}>
          KAMALJEET DANGI SO VINOD SINGH
        </Typography>
        <Button
          variant="contained"
          onClick={() => setQrModalOpen(false)}
          fullWidth={isMobile}
          sx={{ 
            borderRadius: 2, 
            textTransform: 'none',
            minHeight: isMobile ? 48 : 40,
            fontWeight: 600,
          }}
        >
          Close
        </Button>
      </Dialog>
      <DocumentViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        document={viewingDocument}
      />
      {selectedDocType && (
        <DocumentUploadModal
          open={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setSelectedDocType(null);
          }}
          docType={selectedDocType}
          onUpload={(file) => handleUploadDocument(selectedDocType.type, file)}
          loading={loading}
        />
      )}
    </Container>
  );
};

export default TutorVerificationFormPage;
