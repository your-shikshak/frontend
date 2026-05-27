import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
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
  useMediaQuery,
  IconButton,
  Collapse,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  ShieldCheck,
  FileText,
  Upload,
  CheckCircle,
  User,
  CreditCard,
  Info,
  AlertCircle,
  FileCheck,
  Wallet,
  ScanLine,
  Clock,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Award,
  Briefcase,
  Eye,
  Maximize2,
  ChevronDown,
} from 'lucide-react';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import DocumentUploadModal from '../../components/common/DocumentUploadModal';
import { getMyProfile, uploadDocument, deleteDocument, updateVerificationFeeStatus, submitVerification } from '../../services/tutorService';
import { useAuth } from '../../hooks/useAuth';
import type { ITutor, IDocument } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────
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

const docTypes: { type: string; label: string; icon: React.ReactNode; isOptional?: boolean }[] = [
  { type: 'PROFILE_PHOTO', label: 'Profile Photo', icon: <User size={26} /> },
  { type: 'AADHAAR', label: 'Aadhaar Card', icon: <ScanLine size={26} /> },
  { type: 'CERTIFICATE', label: 'Certificate', icon: <Award size={26} /> },
  { type: 'EXPERIENCE_PROOF', label: 'Exp. Proof', icon: <Briefcase size={26} />, isOptional: true },
];

const steps = [
  { id: 'docs', label: 'Documents', shortLabel: 'Docs' },
  { id: 'payment', label: 'Payment', shortLabel: 'Pay' },
  { id: 'declaration', label: 'Declaration', shortLabel: 'Agree' },
  { id: 'review', label: 'Review', shortLabel: 'Review' },
  { id: 'submit', label: 'Submit', shortLabel: 'Submit' },
];

// ─── Step Progress Bar (Mobile) ───────────────────────────────────────────────
function MobileStepBar({ activeStep, total }: { activeStep: number; total: number }) {
  const progress = ((activeStep) / (total - 1)) * 100;
  const step = steps[activeStep];
  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
        <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
          Step {activeStep + 1} of {total}
        </Typography>
        <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ fontSize: '0.8rem' }}>
          {step.label}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 6, borderRadius: 4,
          bgcolor: alpha('#2D68C4', 0.12),
          '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: 'primary.main' },
        }}
      />
      {/* Step dots */}
      <Stack direction="row" justifyContent="space-between" mt={0.75} px={0.25}>
        {steps.map((s, i) => (
          <Box key={s.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
            <Box sx={{
              width: i <= activeStep ? 8 : 6,
              height: i <= activeStep ? 8 : 6,
              borderRadius: '50%',
              bgcolor: i < activeStep ? '#10B981' : i === activeStep ? 'primary.main' : alpha('#94A3B8', 0.4),
              transition: 'all 0.25s ease',
            }} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

// ─── Doc Card ────────────────────────────────────────────────────────────────
interface DocCardProps {
  docType: typeof docTypes[0];
  doc: DocumentUpload;
  formSubmitted: boolean;
  loading: boolean;
  onCardClick: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onUpload: () => void;
  isMobile: boolean;
}

function DocCard({ docType, doc, formSubmitted, loading, onCardClick, onDelete, onUpload, isMobile }: DocCardProps) {
  const isUploaded = doc.uploaded;
  const hasFile = !!doc.file;
  const hasError = !!doc.sizeError;

  const stateColor = isUploaded ? '#10B981' : hasError ? '#EF4444' : hasFile ? '#2D68C4' : '#94A3B8';
  const iconBg = isUploaded ? '#10B981' : hasError ? '#EF4444' : hasFile ? '#2D68C4' : alpha('#94A3B8', 0.15);
  const iconColor = isUploaded || hasFile || hasError ? '#fff' : '#64748B';

  return (
    <Card
      onClick={onCardClick}
      sx={{
        borderRadius: 3,
        border: '2px solid',
        borderColor: isUploaded ? alpha('#10B981', 0.4) : hasError ? alpha('#EF4444', 0.5) : alpha('#E2E8F0', 1),
        bgcolor: isUploaded ? alpha('#10B981', 0.03) : hasError ? alpha('#EF4444', 0.03) : '#fff',
        cursor: formSubmitted && !isUploaded ? 'default' : 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
        '&:hover': {
          transform: formSubmitted ? 'none' : 'translateY(-3px)',
          boxShadow: formSubmitted ? 'none' : `0 8px 24px ${alpha(stateColor, 0.18)}`,
          borderColor: formSubmitted ? undefined : stateColor,
        },
      }}
    >
      {/* Delete button */}
      {isUploaded && !formSubmitted && (
        <IconButton
          size="small"
          aria-label="delete"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          sx={{
            position: 'absolute', top: 6, right: 6, zIndex: 2,
            width: 22, height: 22,
            bgcolor: alpha('#EF4444', 0.1), color: '#EF4444',
            '&:hover': { bgcolor: alpha('#EF4444', 0.2) },
          }}
        >
          <XCircle size={14} />
        </IconButton>
      )}

      <CardContent sx={{ p: isMobile ? 1.75 : 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1 }}>
        {/* Icon */}
        <Box sx={{
          width: isMobile ? 52 : 60, height: isMobile ? 52 : 60,
          borderRadius: 3, bgcolor: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isUploaded ? `0 6px 16px ${alpha('#10B981', 0.28)}` : hasError ? `0 6px 16px ${alpha('#EF4444', 0.22)}` : hasFile ? `0 6px 16px ${alpha('#2D68C4', 0.2)}` : 'none',
          transition: 'all 0.25s ease',
        }}>
          {docType.icon}
        </Box>

        {/* Label */}
        <Box>
          <Typography fontWeight={700} sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1E293B', lineHeight: 1.2 }}>
            {docType.label}
            {!docType.isOptional && <Box component="span" sx={{ color: '#EF4444', ml: 0.25 }}>*</Box>}
          </Typography>
          {docType.isOptional && (
            <Typography sx={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 600, mt: 0.25 }}>Optional</Typography>
          )}
        </Box>

        {/* Status badge */}
        <Box sx={{
          px: 1, py: 0.25, borderRadius: 10,
          bgcolor: isUploaded ? alpha('#10B981', 0.1) : hasError ? alpha('#EF4444', 0.1) : hasFile ? alpha('#2D68C4', 0.1) : alpha('#94A3B8', 0.1),
          color: stateColor, fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {isUploaded ? '✓ Done' : hasError ? '✗ Too Large' : hasFile ? 'Ready' : `Max ${MAX_FILE_SIZE_MB}MB`}
        </Box>

        {/* Size error message */}
        {hasError && (
          <Typography sx={{ fontSize: '0.62rem', color: '#EF4444', fontWeight: 700, lineHeight: 1.3, textAlign: 'center', px: 0.5 }}>
            {doc.sizeError}
          </Typography>
        )}

        {/* Action buttons */}
        {isUploaded && (
          <Button
            variant="outlined" size="small" fullWidth
            startIcon={<Eye size={12} />}
            onClick={(e) => { e.stopPropagation(); onCardClick(e); }}
            sx={{ borderRadius: 2, fontSize: '0.65rem', fontWeight: 700, py: 0.4, textTransform: 'none', borderColor: alpha('#2D68C4', 0.3), color: '#2D68C4', '&:hover': { bgcolor: alpha('#2D68C4', 0.05) } }}
          >
            View
          </Button>
        )}

        {hasFile && !isUploaded && !formSubmitted && (
          <Button
            variant="contained" size="small" fullWidth
            onClick={(e) => { e.stopPropagation(); onUpload(); }}
            disabled={loading || hasError}
            sx={{ borderRadius: 2, fontSize: '0.65rem', fontWeight: 700, py: 0.4, textTransform: 'none', boxShadow: 'none' }}
          >
            {loading ? <CircularProgress size={12} color="inherit" /> : 'Upload'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Guidelines Accordion ────────────────────────────────────────────────────
function GuidelinesAccordion() {
  const [open, setOpen] = useState(false);
  const tips = [
    { icon: '📋', text: 'Upload both sides of Aadhaar in one PDF' },
    { icon: '👤', text: 'Name must match exactly across all docs' },
    { icon: '💳', text: 'Pay exactly ₹500 — upload clear screenshot' },
    { icon: '🔍', text: 'Clear, well-lit, uncropped photos only' },
    { icon: '⚠️', text: 'False info = permanent disqualification' },
  ];

  return (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2.5, borderColor: alpha('#2D68C4', 0.2), bgcolor: alpha('#2D68C4', 0.02), overflow: 'hidden' }}>
      <Box
        onClick={() => setOpen(p => !p)}
        sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Info size={16} color="#2D68C4" />
          <Typography fontWeight={700} fontSize="0.8125rem" color="#1E40AF">Submission Guidelines</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography fontSize="0.7rem" color="#64748B" fontWeight={600}>{open ? 'Hide' : 'Show'}</Typography>
          <Box sx={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
            <ChevronDown size={16} color="#64748B" />
          </Box>
        </Box>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {tips.map((tip, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography fontSize="0.875rem" lineHeight={1.4}>{tip.icon}</Typography>
              <Typography fontSize="0.8rem" color="#475569" lineHeight={1.4}>{tip.text}</Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const TutorVerificationFormPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user: currentUser } = useAuth();
  const [tutor, setTutor] = useState<ITutor | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>(() => {
    const initial: Record<string, DocumentUpload> = {};
    docTypes.forEach((doc) => {
      initial[doc.type] = { type: doc.type, label: doc.label, file: null, uploaded: false, isOptional: doc.isOptional };
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
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<{ type: string; label: string } | null>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyProfile();
        const tutorData = res.data;
        setTutor(tutorData);
        if (tutorData.verificationStatus === 'VERIFIED') setFormSubmitted(true);
        if (tutorData.documents) {
          setDocuments((prev) => {
            const updated = { ...prev };
            tutorData.documents?.forEach((doc: IDocument) => {
              if (updated[doc.documentType]) {
                updated[doc.documentType] = { ...updated[doc.documentType], uploaded: true, existingDoc: doc };
              }
            });
            return updated;
          });
        }
        if (tutorData.verificationFeeStatus) {
          if (tutorData.verificationFeeStatus === 'DEDUCT_FROM_FIRST_MONTH') setFeeStatus('DEDUCT');
          else if (tutorData.verificationFeeStatus === 'PAID') setFeeStatus('PAID');
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load profile');
      }
    };
    fetchProfile();
  }, []);

  const handleFileSelect = useCallback((type: string, file: File | null) => {
    const sizeError = file && file.size > MAX_FILE_SIZE_BYTES ? `Max ${MAX_FILE_SIZE_MB}MB allowed.` : '';
    setDocuments((prev) => ({ ...prev, [type]: { ...prev[type], file, sizeError } }));
  }, []);

  const handleUploadDocument = async (type: string, fileToUpload?: File) => {
    const doc = documents[type];
    const file = fileToUpload || doc.file;
    if (!file) { setError('Please select a file first'); return; }
    const tutorId = tutor?.id || tutor?._id;
    if (!tutorId) { setError('System error: Tutor profile not fully loaded. Please refresh.'); return; }
    try {
      setLoading(true); setError(null);
      const res = await uploadDocument(String(tutorId), type, file);
      const updatedTutor = res.data;
      setTutor(updatedTutor);
      setDocuments((prev) => ({
        ...prev,
        [type]: { ...prev[type], uploaded: true, file: null, existingDoc: updatedTutor.documents?.find((d: any) => d.documentType === type) },
      }));
    } catch (e: any) {
      setError(e?.response?.data?.message || `Failed to upload ${doc.label}`);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (type: string) => {
    if (!tutor) return;
    const docIndex = tutor.documents?.findIndex(d => d.documentType === type);
    if (docIndex === undefined || docIndex === -1) return;
    try {
      setLoading(true); setError(null);
      const res = await deleteDocument(tutor?.id || tutor?._id || '', docIndex);
      const updatedTutor = res.data;
      setTutor(updatedTutor);
      setDocuments((prev) => ({ ...prev, [type]: { ...prev[type], uploaded: false, file: null, existingDoc: undefined } }));
    } catch (e: any) {
      setError(e?.response?.data?.message || `Failed to delete ${documents[type].label}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeSubmit = async () => {
    if (!tutor) return;
    try {
      setLoading(true); setError(null);
      const status = feeStatus === 'DEDUCT' ? 'DEDUCT_FROM_FIRST_MONTH' : 'PENDING';
      const res = await updateVerificationFeeStatus(tutor?.id || tutor?._id || '', status, feeFile || undefined);
      setTutor(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update fee status');
    } finally {
      setLoading(false);
    }
  };

  const allMandatoryUploaded = () => docTypes.filter(d => !d.isOptional).every(d => documents[d.type]?.uploaded);
  const isFeePaid = tutor?.verificationFeeStatus === 'PAID' || tutor?.verificationFeeStatus === 'DEDUCT_FROM_FIRST_MONTH';
  const currentStepId = steps[activeStep]?.id;

  const canProceedToNextStep = () => {
    if (currentStepId === 'docs') return allMandatoryUploaded();
    if (currentStepId === 'payment') return feeStatus === 'DEDUCT' || (feeFile !== null && !feeFileError) || !!tutor?.verificationFeeStatus;
    if (currentStepId === 'declaration') return agreedToTerms && confirmedAuthentic && understandConsequences;
    return true;
  };

  const handleNext = async () => {
    if (currentStepId === 'payment') await handleFeeSubmit();
    let nextStep = activeStep + 1;
    if (nextStep === 1 && isFeePaid) nextStep = 2;
    if (nextStep < steps.length) {
      setActiveStep(nextStep);
    } else {
      try {
        setLoading(true);
        if (tutor?._id || tutor?.id) await submitVerification(String(tutor?._id || tutor?.id));
        setFormSubmitted(true); setSuccess(true);
        setTimeout(() => navigate('/tutor-profile'), 2000);
      } catch {
        setFormSubmitted(true); setSuccess(true);
        setTimeout(() => navigate('/tutor-profile'), 2000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      let prevStep = activeStep - 1;
      if (prevStep === 1 && isFeePaid) prevStep = 0;
      setActiveStep(prevStep);
    }
  };

  // ─── Success Screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, display: 'flex', alignItems: 'center', minHeight: '60vh' }}>
        <Paper elevation={0} sx={{ p: 5, borderRadius: 4, textAlign: 'center', bgcolor: alpha('#10b981', 0.04), border: `2px solid ${alpha('#10b981', 0.2)}`, width: '100%' }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, boxShadow: `0 12px 32px ${alpha('#10b981', 0.35)}` }}>
            <CheckCircle size={40} color="white" />
          </Box>
          <Typography variant="h5" fontWeight={800} color="#1e293b" gutterBottom>Verification Submitted!</Typography>
          <Typography variant="body2" color="text.secondary">Your documents have been uploaded. Our team will review your application shortly.</Typography>
        </Paper>
      </Container>
    );
  }

  // ─── Main Layout ──────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: isMobile ? '148px' : 0 }}>
      <Container maxWidth="md" sx={{ py: isMobile ? 2 : 4, px: isMobile ? 1.5 : 3 }}>

        {/* ── Page Header ── */}
        <Box sx={{ mb: isMobile ? 2 : 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#2D68C4', 0.1), color: 'primary.main', display: 'flex' }}>
              <ShieldCheck size={20} />
            </Box>
            <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={800} color="#1e293b">
              Tutor Verification
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ pl: isMobile ? 0 : 0.5 }}>
            Complete all steps to become a verified tutor.
          </Typography>

          {/* Rejection Alert */}
          {tutor?.verificationStatus === 'REJECTED' && (
            <Alert severity="error" icon={<XCircle size={18} />} sx={{ mt: 1.5, borderRadius: 2.5, '& .MuiAlert-message': { width: '100%' } }}>
              <Typography variant="subtitle2" fontWeight={700}>Verification Rejected</Typography>
              <Typography variant="body2" sx={{ mt: 0.25 }}>{tutor.verificationRejectionReason || 'Please review your documents and reapply.'}</Typography>
            </Alert>
          )}
        </Box>

        {/* ── Error Alert ── */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>
        )}

        {/* ── Step Indicator ── */}
        {isMobile ? (
          <MobileStepBar activeStep={activeStep} total={steps.length} />
        ) : (
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((s, index) => (
              <Step key={s.id} completed={index < activeStep || (index === 1 && isFeePaid)}>
                <StepLabel>{s.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {/* ── Step Content Card ── */}
        <Paper elevation={0} sx={{ p: isMobile ? 2 : 3.5, borderRadius: isMobile ? 2.5 : 3.5, border: '1px solid #E2E8F0', minHeight: 300, mb: isMobile ? 0 : 3 }}>

          {/* ════ STEP 1: DOCUMENTS ════ */}
          {currentStepId === 'docs' && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Upload Your Documents
              </Typography>

              {/* Mandatory warning — compact */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1.25, borderRadius: 2, bgcolor: alpha('#F59E0B', 0.08), border: `1px solid ${alpha('#F59E0B', 0.25)}` }}>
                <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0 }} />
                <Typography fontSize="0.8rem" fontWeight={600} color="#92400E">All starred (*) documents are mandatory.</Typography>
              </Box>

              {/* Collapsible Guidelines */}
              <GuidelinesAccordion />

              {/* Rejected docs tip */}
              {tutor?.verificationStatus === 'REJECTED' && (
                <Box sx={{ mb: 1.5, p: 1.25, borderRadius: 2, bgcolor: alpha('#3B82F6', 0.06), border: `1px solid ${alpha('#3B82F6', 0.18)}` }}>
                  <Typography fontSize="0.78rem" fontWeight={600} color="#1E40AF">
                    To replace a doc: tap the <XCircle size={12} style={{ display: 'inline', verticalAlign: 'middle', color: '#EF4444' }} /> to delete, then tap the card to upload new.
                  </Typography>
                </Box>
              )}

              {/* Document Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 1.25 : 2, mb: 2.5 }}>
                {docTypes.map((docType) => {
                  const doc = documents[docType.type];

                  const handleCardClick = (e: React.MouseEvent) => {
                    if ((e.target as HTMLElement).closest('button')?.getAttribute('aria-label') === 'delete') return;
                    if (doc.uploaded) {
                      const documentToView = doc.existingDoc || tutor?.documents?.find((d: IDocument) => d.documentType === docType.type);
                      if (documentToView) { setViewingDocument(documentToView); setViewerOpen(true); return; }
                    }
                    if (!formSubmitted) {
                      setSelectedDocType({ type: docType.type, label: docType.label });
                      setUploadModalOpen(true);
                    }
                  };

                  return (
                    <DocCard
                      key={docType.type}
                      docType={docType}
                      doc={doc}
                      formSubmitted={formSubmitted}
                      loading={loading}
                      onCardClick={handleCardClick}
                      onDelete={() => handleDeleteDocument(docType.type)}
                      onUpload={() => handleUploadDocument(docType.type)}
                      isMobile={isMobile}
                    />
                  );
                })}
              </Box>

              {/* Progress chips */}
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', pt: 1.5, borderTop: '1px solid #F1F5F9' }}>
                {docTypes.map((dt) => {
                  const done = documents[dt.type]?.uploaded;
                  return (
                    <Chip
                      key={dt.type}
                      size="small"
                      label={dt.label}
                      icon={done ? <CheckCircle size={12} /> : <FileText size={12} />}
                      sx={{
                        height: 24, fontSize: '0.7rem', fontWeight: 600, borderRadius: 10,
                        bgcolor: done ? alpha('#10B981', 0.1) : alpha('#94A3B8', 0.1),
                        color: done ? '#059669' : '#64748B',
                        '& .MuiChip-icon': { fontSize: 12 },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          {/* ════ STEP 2: PAYMENT ════ */}
          {currentStepId === 'payment' && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Verification Fee</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Choose how you'd like to pay.</Typography>

              {tutor?.verificationFeeStatus === 'PAID' ? (
                <Alert severity="success" icon={<CheckCircle size={20} />} sx={{ borderRadius: 2.5 }}>
                  <Typography fontWeight={700}>Fee already paid!</Typography>
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Option 1 — Pay Now */}
                  <Card
                    variant="outlined"
                    onClick={() => !formSubmitted && !isFeePaid && setFeeStatus('PENDING')}
                    sx={{
                      borderRadius: 3, cursor: (formSubmitted || isFeePaid) ? 'default' : 'pointer',
                      border: '2px solid',
                      borderColor: feeStatus === 'PENDING' ? '#2D68C4' : '#E2E8F0',
                      bgcolor: feeStatus === 'PENDING' ? alpha('#2D68C4', 0.03) : '#fff',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: (formSubmitted || isFeePaid) ? undefined : '#2D68C4' },
                    }}
                  >
                    <CardContent sx={{ p: isMobile ? 2 : 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: feeStatus === 'PENDING' && !isFeePaid ? 2 : 0 }}>
                        <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: feeStatus === 'PENDING' ? alpha('#2D68C4', 0.1) : alpha('#94A3B8', 0.1), color: feeStatus === 'PENDING' ? '#2D68C4' : '#94A3B8', display: 'flex' }}>
                          <CreditCard size={22} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight={700} fontSize="0.9375rem">Pay Now</Typography>
                          <Typography fontSize="0.8rem" color="text.secondary">One-time · faster processing</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography fontWeight={800} fontSize="1.25rem" color={feeStatus === 'PENDING' ? '#2D68C4' : 'text.primary'}>₹500</Typography>
                          <Chip label="Recommended" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha('#10B981', 0.1), color: '#059669', borderRadius: 10 }} />
                        </Box>
                      </Box>

                      {/* QR + Screenshot section */}
                      {feeStatus === 'PENDING' && !isFeePaid && (
                        <Box>
                          {/* QR code */}
                          <Box
                            sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0', textAlign: 'center', cursor: 'pointer', mb: 1.5, transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transform: 'scale(1.01)' } }}
                            onClick={() => setQrModalOpen(true)}
                          >
                            <img src="/verification-qr.png" alt="Payment QR" style={{ width: isMobile ? 110 : 130, height: isMobile ? 110 : 130, display: 'block', margin: '0 auto' }} />
                            <Button size="small" startIcon={<Maximize2 size={11} />} sx={{ mt: 0.75, fontSize: '0.65rem', color: '#64748B', textTransform: 'none' }}>
                              Tap to enlarge
                            </Button>
                          </Box>

                          {/* Screenshot upload */}
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setFeeFile(file);
                            setFeeFileError(file && file.size > MAX_FILE_SIZE_BYTES ? `Max ${MAX_FILE_SIZE_MB}MB allowed.` : null);
                          }} style={{ display: 'none' }} id="fee-file" disabled={formSubmitted} />
                          <label htmlFor="fee-file">
                            <Button
                              component="span" variant={feeFile ? 'contained' : 'outlined'} fullWidth
                              startIcon={feeFile ? <CheckCircle size={16} /> : <Upload size={16} />}
                              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, py: 1 }}
                              disabled={formSubmitted}
                            >
                              {feeFile ? `✓ ${feeFile.name.length > 24 ? feeFile.name.slice(0, 24) + '…' : feeFile.name}` : 'Upload Payment Screenshot'}
                            </Button>
                          </label>
                          {feeFileError && <Typography fontSize="0.72rem" color="error.main" mt={0.5}>{feeFileError}</Typography>}
                          {!feeFile && <Typography fontSize="0.68rem" color="text.disabled" textAlign="center" mt={0.5}>Max {MAX_FILE_SIZE_MB}MB · image only</Typography>}
                        </Box>
                      )}
                    </CardContent>
                  </Card>

                  {/* Option 2 — Pay Later */}
                  <Card
                    variant="outlined"
                    onClick={() => { if (!formSubmitted && !isFeePaid) { setFeeStatus('DEDUCT'); setFeeFile(null); } }}
                    sx={{
                      borderRadius: 3, cursor: (formSubmitted || isFeePaid) ? 'default' : 'pointer',
                      border: '2px solid',
                      borderColor: feeStatus === 'DEDUCT' ? '#F59E0B' : '#E2E8F0',
                      bgcolor: feeStatus === 'DEDUCT' ? alpha('#F59E0B', 0.03) : '#fff',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <CardContent sx={{ p: isMobile ? 2 : 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: feeStatus === 'DEDUCT' ? alpha('#F59E0B', 0.12) : alpha('#94A3B8', 0.1), color: feeStatus === 'DEDUCT' ? '#D97706' : '#94A3B8', display: 'flex' }}>
                          <Wallet size={22} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight={700} fontSize="0.9375rem">Pay Later</Typography>
                          <Typography fontSize="0.8rem" color="text.secondary">Deducted from first month · no upfront</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography fontWeight={800} fontSize="1.25rem" color={feeStatus === 'DEDUCT' ? '#D97706' : 'text.primary'}>₹700</Typography>
                          <Typography fontSize="0.6rem" color="#94A3B8" fontWeight={600}>+₹200 fee</Typography>
                        </Box>
                      </Box>
                      {feeStatus === 'DEDUCT' && (
                        <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 2, bgcolor: alpha('#F59E0B', 0.08), border: `1px solid ${alpha('#F59E0B', 0.2)}` }}>
                          <Typography fontSize="0.78rem" color="#92400E" fontWeight={600}>₹700 will be deducted from your first month's salary after your first class.</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Box>
          )}

          {/* ════ STEP 3: DECLARATION ════ */}
          {currentStepId === 'declaration' && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Declaration & Consent</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Please read and accept all terms before proceeding.</Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {[
                  { state: agreedToTerms, setter: setAgreedToTerms, label: 'I agree to the Terms & Conditions and Policies of the platform' },
                  { state: confirmedAuthentic, setter: setConfirmedAuthentic, label: 'All uploaded documents are genuine, authentic, and not fake' },
                  { state: understandConsequences, setter: setUnderstandConsequences, label: 'I understand false or misleading information may lead to rejection or permanent disqualification' },
                ].map((item, i) => (
                  <Card
                    key={i}
                    variant="outlined"
                    onClick={() => !formSubmitted && item.setter(!item.state)}
                    sx={{
                      borderRadius: 2.5, cursor: formSubmitted ? 'default' : 'pointer',
                      border: '2px solid',
                      borderColor: item.state ? alpha('#10B981', 0.5) : '#E2E8F0',
                      bgcolor: item.state ? alpha('#10B981', 0.03) : '#fff',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <CardContent sx={{ p: '14px !important', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Checkbox
                        checked={item.state}
                        onChange={(e) => !formSubmitted && item.setter(e.target.checked)}
                        disabled={formSubmitted}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        sx={{ p: 0, mt: 0.125, color: item.state ? '#10B981' : '#CBD5E1', '&.Mui-checked': { color: '#10B981' } }}
                      />
                      <Typography fontSize="0.8375rem" color={item.state ? '#065F46' : '#475569'} lineHeight={1.45} fontWeight={item.state ? 600 : 400}>
                        {item.label}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Rejection reasons — pill chips */}
              <Box sx={{ mt: 2.5, p: 1.5, borderRadius: 2, bgcolor: alpha('#FEF3C7', 0.8), border: `1px solid ${alpha('#F59E0B', 0.25)}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <XCircle size={14} color="#D97706" />
                  <Typography fontSize="0.72rem" fontWeight={700} color="#92400E" textTransform="uppercase" letterSpacing="0.04em">Common Rejection Reasons</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {['Blurry docs', 'Info mismatch', 'Missing payment', 'Incomplete upload', 'Fake documents'].map((r) => (
                    <Chip key={r} label={r} size="small" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 600, bgcolor: alpha('#F59E0B', 0.12), color: '#92400E', borderRadius: 10 }} />
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          {/* ════ STEP 4: REVIEW ════ */}
          {currentStepId === 'review' && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>What Happens Next</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Your manager will review your profile and documents.</Typography>

              {/* Timeline — vertical on mobile */}
              <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1.25 : 2, mb: 2.5 }}>
                {[
                  { icon: <Clock size={22} color="#2563EB" />, bg: alpha('#3B82F6', 0.1), title: '2–3 Business Days', sub: 'Typical review timeline' },
                  { icon: <FileCheck size={22} color="#8B5CF6" />, bg: alpha('#8B5CF6', 0.1), title: 'Manager Review', sub: 'Documents & profile check' },
                  { icon: <ShieldCheck size={22} color="#059669" />, bg: alpha('#10B981', 0.1), title: 'Decision Notified', sub: 'Via app notification' },
                ].map((item, i) => (
                  <Box
                    key={i}
                    sx={{
                      flex: 1, p: 1.75, borderRadius: 2.5,
                      border: '1px solid #E2E8F0', bgcolor: '#FAFAFA',
                      display: 'flex', alignItems: isMobile ? 'center' : 'flex-start',
                      flexDirection: isMobile ? 'row' : 'column',
                      gap: isMobile ? 1.5 : 1,
                    }}
                  >
                    <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: item.bg, display: 'flex', flexShrink: 0 }}>{item.icon}</Box>
                    <Box>
                      <Typography fontWeight={700} fontSize="0.875rem">{item.title}</Typography>
                      <Typography fontSize="0.78rem" color="text.secondary">{item.sub}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Application Summary */}
              <Box sx={{ p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FAFAFA' }}>
                <Typography fontWeight={700} fontSize="0.8125rem" sx={{ mb: 1.25 }}>Application Summary</Typography>

                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.25 }}>
                  {docTypes.map((dt) => {
                    const done = documents[dt.type]?.uploaded;
                    return (
                      <Chip key={dt.type} size="small" label={dt.label}
                        icon={done ? <CheckCircle size={11} /> : <FileText size={11} />}
                        color={done ? 'success' : 'default'}
                        sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600, borderRadius: 10 }}
                      />
                    );
                  })}
                </Box>

                <Chip
                  size="small"
                  label={tutor?.verificationFeeStatus === 'PAID' ? 'Fee: Paid' : feeStatus === 'DEDUCT' ? 'Fee: Pay Later ₹700' : 'Fee: Pay Now ₹500'}
                  icon={<CreditCard size={11} />}
                  color="primary"
                  sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600, borderRadius: 10 }}
                />
              </Box>
            </Box>
          )}

          {/* ════ STEP 5: SUBMIT ════ */}
          {currentStepId === 'submit' && (
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: alpha('#6366F1', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5, boxShadow: `0 8px 24px ${alpha('#6366F1', 0.2)}` }}>
                <ShieldCheck size={36} color="#6366F1" />
              </Box>

              <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={800} sx={{ mb: 1 }}>Ready to Submit!</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 420, mx: 'auto' }}>
                By submitting, you confirm all information is accurate and all documents are genuine. We'll review within 2–3 business days.
              </Typography>

              {/* Outcome cards */}
              <Box sx={{ display: 'flex', gap: 1.5, flexDirection: isMobile ? 'column' : 'row', textAlign: 'left', mb: 2 }}>
                <Box sx={{ flex: 1, p: 1.75, borderRadius: 2.5, bgcolor: alpha('#10B981', 0.06), border: `1px solid ${alpha('#10B981', 0.2)}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <CheckCircle size={15} color="#059669" />
                    <Typography fontWeight={700} fontSize="0.8125rem" color="#065F46">If Approved</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {['Profile activated', 'Start receiving classes', 'Full dashboard access'].map(p => (
                      <Typography key={p} fontSize="0.75rem" color="#065F46">• {p}</Typography>
                    ))}
                  </Box>
                </Box>
                <Box sx={{ flex: 1, p: 1.75, borderRadius: 2.5, bgcolor: alpha('#EF4444', 0.05), border: `1px solid ${alpha('#EF4444', 0.2)}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <XCircle size={15} color="#DC2626" />
                    <Typography fontWeight={700} fontSize="0.8125rem" color="#991B1B">If Rejected</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {['Detailed rejection reasons', 'Can re-apply after fixes', 'Contact support if needed'].map(p => (
                      <Typography key={p} fontSize="0.75rem" color="#991B1B">• {p}</Typography>
                    ))}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#2D68C4', 0.06), border: `1px solid ${alpha('#2D68C4', 0.15)}`, display: 'flex', gap: 1, alignItems: 'flex-start', textAlign: 'left' }}>
                <Info size={15} color="#2D68C4" style={{ flexShrink: 0, marginTop: 1 }} />
                <Typography fontSize="0.78rem" color="#1E40AF">Ensure all documents are clear, readable, and info matches your profile before submitting.</Typography>
              </Box>
            </Box>
          )}
        </Paper>

        {/* ── Desktop Navigation ── */}
        {!isMobile && (
          <Box display="flex" justifyContent="space-between" gap={2}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0 || formSubmitted}
              startIcon={<ChevronLeft size={18} />}
              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 3 }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceedToNextStep() || loading || formSubmitted}
              endIcon={currentStepId === 'submit' ? <CheckCircle size={18} /> : <ChevronRight size={18} />}
              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 4, bgcolor: currentStepId === 'submit' ? '#10b981' : undefined, '&:hover': { bgcolor: currentStepId === 'submit' ? '#059669' : undefined } }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : currentStepId === 'submit' ? 'Submit Application' : 'Continue'}
            </Button>
          </Box>
        )}
      </Container>

      {/* ── Mobile Sticky Nav ── */}
      {isMobile && (
        <Box sx={{
          position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 1400,
          bgcolor: '#fff', borderTop: '1px solid #E2E8F0',
          borderBottom: '1px solid #E2E8F0',
          px: 2, py: 1.5,
          display: 'flex', gap: 1.25, alignItems: 'center',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0 || formSubmitted}
            startIcon={<ChevronLeft size={18} />}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, py: 1.25, minWidth: 90, flex: '0 0 auto' }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceedToNextStep() || loading || formSubmitted}
            endIcon={currentStepId === 'submit' ? <CheckCircle size={18} /> : <ChevronRight size={18} />}
            fullWidth
            sx={{
              borderRadius: 2.5, textTransform: 'none', fontWeight: 700, py: 1.25, fontSize: '0.9375rem',
              bgcolor: currentStepId === 'submit' ? '#10b981' : undefined,
              '&:hover': { bgcolor: currentStepId === 'submit' ? '#059669' : undefined },
              '&.Mui-disabled': { bgcolor: alpha('#2D68C4', 0.12) },
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : currentStepId === 'submit' ? 'Submit Application' : 'Continue'}
          </Button>
        </Box>
      )}

      {/* ── QR Modal ── */}
      <Dialog open={qrModalOpen} onClose={() => setQrModalOpen(false)} maxWidth="xs" fullWidth={isMobile} PaperProps={{ sx: { borderRadius: 4, p: isMobile ? 2 : 3, textAlign: 'center', mx: isMobile ? 2 : 'auto' } }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>Scan to Pay</Typography>
        <Box sx={{ p: 1.5 }}>
          <img src="/verification-qr.png" alt="Payment QR" style={{ width: '100%', maxWidth: 260, height: 'auto', display: 'block', margin: '0 auto' }} />
        </Box>
        <Typography variant="h6" fontWeight={800} color="primary.main">₹{VERIFICATION_FEE_AMOUNT}</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>KAMALJEET DANGI SO VINOD SINGH</Typography>
        <Button variant="contained" onClick={() => setQrModalOpen(false)} fullWidth sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, py: 1.25 }}>Done</Button>
      </Dialog>

      <DocumentViewerModal open={viewerOpen} onClose={() => setViewerOpen(false)} document={viewingDocument} />
      {selectedDocType && (
        <DocumentUploadModal
          open={uploadModalOpen}
          onClose={() => { setUploadModalOpen(false); setSelectedDocType(null); }}
          docType={selectedDocType}
          onUpload={(file) => handleUploadDocument(selectedDocType.type, file)}
          loading={loading}
        />
      )}
    </Box>
  );
};

export default TutorVerificationFormPage;
