import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { setSidebarWidth } from '../../store/slices/uiSlice';
import { USER_ROLES } from '../../constants';
import {
    Box,
    Container,
    Typography,
    Grid,
    Paper,
    Avatar,
    Divider,
    Chip,
    Button,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Alert,
    AlertColor,
    Card,
    CardContent,
    useTheme,
} from '@mui/material';
import {
    Phone as PhoneIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
    ArrowBack as ArrowBackIcon,
    Description as DescriptionIcon,
    CheckCircle as CheckCircleIcon,
    School as SchoolIcon,
    Work as WorkIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import { ITutor } from '../../types';
import tutorService from '../../services/tutorService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import SnackbarNotification from '../../components/common/SnackbarNotification';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import RejectionDialog from '../../components/tutors/RejectionDialog';
import { Eye } from 'lucide-react';

const getDocumentComponent = (url: string) => {
    const cleanUrl = url.toLowerCase().split('?')[0];
    const isPdf = cleanUrl.endsWith('.pdf');
    const isImage = cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|jfif)$/i) || url.includes('image');

    if (isImage) {
        return (
            <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                    src={url}
                    alt="Document Preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderRadius: '8px' }}
                />
            </Box>
        );
    } else if (isPdf) {
        return (
            <iframe
                src={url}
                title="PDF Preview"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
            />
        );
    } else {
        return (
            <Box textAlign="center" color="text.secondary" p={4}>
                <DescriptionIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>Preview not available</Typography>
                <Typography variant="body2">This file type cannot be previewed inline.</Typography>
            </Box>
        );
    }
};

const TutorVerificationDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const currentUser = useSelector(selectCurrentUser);
    const theme = useTheme();

    const [tutor, setTutor] = useState<ITutor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [selectedDocIndex, setSelectedDocIndex] = useState(0);
    const [viewerOpen, setViewerOpen] = useState(false);

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setSidebarWidth(80));
        return () => {
            dispatch(setSidebarWidth(280));
        };
    }, [dispatch]);

    const [verifyDropdownOpen, setVerifyDropdownOpen] = useState(false);
    const [rejectDropdownOpen, setRejectDropdownOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: AlertColor }>({ open: false, message: '', severity: 'success' });

    const fetchTutor = useCallback(async () => {
        try {
            setLoading(true);
            if (id) {
                const response = await tutorService.getTutorById(id);
                setTutor(response.data);
            }
        } catch (err: any) {
            setError(err?.response?.data?.error || err.message || 'Failed to fetch tutor details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTutor();
    }, [fetchTutor]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleVerify = async () => {
        if (!tutor) return;
        try {
            setActionLoading(true);
            await tutorService.updateVerificationStatus(tutor.id, 'VERIFIED');

            setSnackbar({ open: true, message: 'Tutor verified successfully', severity: 'success' });
            setVerifyDropdownOpen(false);
            fetchTutor();
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message || 'Verification failed', severity: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (reason: string) => {
        if (!tutor) return;
        try {
            setActionLoading(true);
            await tutorService.updateVerificationStatus(tutor.id, 'REJECTED', undefined, undefined, reason);
            setSnackbar({ open: true, message: 'Tutor rejected', severity: 'success' });
            setRejectDropdownOpen(false);
            fetchTutor();
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message || 'Rejection failed', severity: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <Container maxWidth="lg" sx={{ mt: 4 }}><ErrorAlert error={error} /></Container>;
    if (!tutor) return <Container maxWidth="lg" sx={{ mt: 4 }}><Alert severity="warning">Tutor not found</Alert></Container>;

    const documents = tutor.documents || [];
    const paymentTabIndex = documents.length;
    const isPaymentTab = selectedDocIndex === paymentTabIndex;
    const selectedDocument = !isPaymentTab ? documents[selectedDocIndex] : undefined;
    const profilePhotoUrl = tutor.documents?.find(d => d.documentType === 'PROFILE_PHOTO')?.documentUrl;
    const paymentProofUrl = tutor.verificationFeePaymentProof;
    const paymentDate = tutor.verificationFeePaymentDate ? new Date(tutor.verificationFeePaymentDate).toLocaleString() : undefined;
    const paymentStatusLabel = tutor.verificationFeeStatus?.replace(/_/g, ' ') || 'PENDING';

    return (
        <Box sx={{ height: 'calc(100vh - 64px)', bgcolor: '#f5f5f5', overflow: 'hidden' }}>
            <Grid container sx={{ height: '100%' }}>
                {/* SIDEBAR: Tutor Details */}
                <Grid item xs={12} md={3} sx={{ height: '100%', bgcolor: 'white', borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
                    <Box p={3}>
                        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/tutors')} sx={{ mb: 2 }}>
                            Back to List
                        </Button>

                        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                            <Avatar
                                src={profilePhotoUrl}
                                alt={tutor.user.name}
                                sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main', fontSize: '2.5rem' }}
                            >
                                {tutor.user.name?.charAt(0)}
                            </Avatar>
                            <Typography variant="h6" fontWeight={700} textAlign="center">{tutor.user.name}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{tutor.teacherId}</Typography>
                            <Chip
                                label={tutor.verificationStatus || 'PENDING'}
                                color={tutor.verificationStatus === 'VERIFIED' ? 'success' : tutor.verificationStatus === 'REJECTED' ? 'error' : 'warning'}
                                size="small"
                                sx={{ mt: 1 }}
                            />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Personal Details */}
                        <Typography variant="subtitle2" gutterBottom fontWeight={600} color="text.secondary">Personal Information</Typography>
                        <List disablePadding dense>
                            <ListItem disableGutters>
                                <ListItemIcon sx={{ minWidth: 35 }}><PhoneIcon color="action" fontSize="small" /></ListItemIcon>
                                <ListItemText primary={tutor.user.phone || 'N/A'} secondary="Phone" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemIcon sx={{ minWidth: 35 }}><EmailIcon color="action" fontSize="small" /></ListItemIcon>
                                <ListItemText primary={tutor.user.email} secondary="Email" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemIcon sx={{ minWidth: 35 }}><LocationIcon color="action" fontSize="small" /></ListItemIcon>
                                <ListItemText primary={tutor.user.city || 'N/A'} secondary="City" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemIcon sx={{ minWidth: 35 }}><LocationIcon color="action" fontSize="small" /></ListItemIcon>
                                <ListItemText primary={tutor.residentialAddress || 'N/A'} secondary="Residential Address" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemIcon sx={{ minWidth: 35 }}><LocationIcon color="action" fontSize="small" /></ListItemIcon>
                                <ListItemText primary={tutor.permanentAddress || 'N/A'} secondary="Permanent Address" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemText
                                    primary={tutor.user.gender || 'N/A'}
                                    secondary="Gender"
                                    inset
                                />
                            </ListItem>
                        </List>

                        <Divider sx={{ my: 2 }} />

                        {/* Professional Details */}
                        <Typography variant="subtitle2" gutterBottom fontWeight={600} color="text.secondary">Professional Details</Typography>
                        <List disablePadding dense>
                            <ListItem disableGutters>
                                <ListItemIcon sx={{ minWidth: 35 }}><SchoolIcon color="action" fontSize="small" /></ListItemIcon>
                                <ListItemText primary={(tutor.qualifications as any[])?.map(q => typeof q === 'string' ? q : (q as any)?.label || (q as any)?.name).join(', ') || 'N/A'} secondary="Qualifications" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemIcon sx={{ minWidth: 35 }}><WorkIcon color="action" fontSize="small" /></ListItemIcon>
                                <ListItemText primary={`${tutor.experienceHours} Hours / ${tutor.yearsOfExperience} Years`} secondary="Experience" />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemText primary={tutor.preferredMode || 'N/A'} secondary="Preferred Mode" inset />
                            </ListItem>
                        </List>

                        <Typography variant="body2" fontWeight={600} mt={1}>Subjects</Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5} mb={1} mt={0.5}>
                            {tutor.subjects && tutor.subjects.length > 0 ? (
                                (tutor.subjects as any[]).map((subj, index) => (
                                    <Chip key={index} label={typeof subj === 'string' ? subj : (subj as any)?.label || (subj as any)?.name || 'N/A'} size="small" variant="outlined" />
                                ))
                            ) : (
                                <Typography variant="caption" color="text.secondary">No subjects listed.</Typography>
                            )}
                        </Box>

                        <Typography variant="body2" fontWeight={600}>Bio</Typography>
                        <Typography variant="body2" paragraph color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                            {tutor.bio || 'No bio provided.'}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Box display="flex" flexDirection="column" gap={1}>
                            <Button
                                variant="contained"
                                color="success"
                                fullWidth
                                onClick={() => setVerifyDropdownOpen(true)}
                                disabled={tutor.verificationStatus === 'VERIFIED'}
                            >
                                Verify Tutor
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                fullWidth
                                onClick={() => setRejectDropdownOpen(true)}
                                disabled={tutor.verificationStatus === 'REJECTED'}
                            >
                                Reject Tutor
                            </Button>
                        </Box>
                    </Box>
                </Grid>

                {/* MAIN CONTENT: Documents & Verification */}
                <Grid item xs={12} md={9} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {currentUser?.role === USER_ROLES.MANAGER && tutor.verificationStatus === 'VERIFIED' ? (
                        <Paper variant="outlined" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, m: 2 }}>
                            <LockIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h5" color="text.secondary" gutterBottom>
                                Access Restricted
                            </Typography>
                            <Typography color="text.secondary">
                                Documents for verified tutors are only accessible to Administrators to ensure data privacy.
                            </Typography>
                        </Paper>
                    ) : (
                        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                            {/* Document Tabs/Selection */}
                            <Paper variant="outlined" sx={{ m: 2, mb: 0, p: 1, display: 'flex', gap: 1, overflowX: 'auto', flexShrink: 0 }}>
                                {documents.length > 0 ? documents.map((doc, index) => (
                                    <Chip
                                        key={index}
                                        label={doc.documentType.replace('_', ' ')}
                                        onClick={() => setSelectedDocIndex(index)}
                                        color={selectedDocIndex === index ? 'primary' : 'default'}
                                        variant={selectedDocIndex === index ? 'filled' : 'outlined'}
                                        icon={doc.verifiedAt ? <CheckCircleIcon /> : undefined}
                                        clickable
                                    />
                                )) : (
                                    <Typography variant="body2" sx={{ p: 1, color: 'text.secondary' }}>No documents uploaded</Typography>
                                )}
                                <Chip
                                    label="Payment Status"
                                    onClick={() => setSelectedDocIndex(paymentTabIndex)}
                                    color={isPaymentTab ? 'primary' : 'default'}
                                    variant={isPaymentTab ? 'filled' : 'outlined'}
                                    icon={tutor.verificationFeeStatus === 'PAID' ? <CheckCircleIcon /> : undefined}
                                    clickable
                                />
                            </Paper>

                            {/* Viewer */}
                            <Paper variant="outlined" sx={{ flexGrow: 1, m: 2, overflow: 'hidden', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                {isPaymentTab ? (
                                    <Box sx={{ p: 3, flexGrow: 1, overflow: 'auto' }}>
                                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                                            <Typography variant="h6" fontWeight={700}>Verification Fee</Typography>
                                            <Chip
                                                size="small"
                                                label={paymentStatusLabel}
                                                color={tutor.verificationFeeStatus === 'PAID' ? 'success' : tutor.verificationFeeStatus === 'DEDUCT_FROM_FIRST_MONTH' ? 'warning' : 'default'}
                                            />
                                        </Box>
                                        {tutor.verificationFeeStatus === 'DEDUCT_FROM_FIRST_MONTH' && (
                                            <Alert severity="warning" sx={{ mb: 2 }}>
                                                Tutor chose to deduct the verification fee from the first month payout.
                                            </Alert>
                                        )}
                                        {tutor.verificationFeeStatus === 'PAID' && !paymentProofUrl && (
                                            <Alert severity="info" sx={{ mb: 2 }}>
                                                Marked as paid, but no payment proof was uploaded.
                                            </Alert>
                                        )}
                                        {paymentDate && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                Payment date: {paymentDate}
                                            </Typography>
                                        )}
                                        {paymentProofUrl ? (
                                            <Box sx={{ position: 'relative', height: '100%', minHeight: 360 }}>
                                                <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 1, zIndex: 10 }}>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<Eye size={16} />}
                                                        onClick={() => setViewerOpen(true)}
                                                        sx={{
                                                            borderRadius: '8px',
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                            bgcolor: 'white',
                                                            color: 'text.primary',
                                                            '&:hover': { bgcolor: '#f5f5f5' }
                                                        }}
                                                    >
                                                        Full View
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => window.open(paymentProofUrl, '_blank')}
                                                    >
                                                        Open in New Tab
                                                    </Button>
                                                </Box>
                                                <Box sx={{ height: '100%', minHeight: 360, pt: 4 }}>
                                                    {getDocumentComponent(paymentProofUrl)}
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Typography color="text.secondary">No payment proof available.</Typography>
                                        )}
                                    </Box>
                                ) : selectedDocument ? (
                                    <>
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 16,
                                            right: 16,
                                            zIndex: 10,
                                            display: 'flex',
                                            gap: 1
                                        }}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<Eye size={16} />}
                                                onClick={() => setViewerOpen(true)}
                                                sx={{
                                                    borderRadius: '8px',
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                    bgcolor: 'white',
                                                    color: 'text.primary',
                                                    '&:hover': { bgcolor: '#f5f5f5' }
                                                }}
                                            >
                                                Full View
                                            </Button>
                                        </Box>
                                        <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
                                            {getDocumentComponent(selectedDocument.documentUrl)}
                                        </Box>
                                    </>
                                ) : (
                                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                                        <Typography color="text.secondary">Select a document to preview</Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Box>
                    )}
                </Grid>
            </Grid>

            {/* Dialogs */}
            <ConfirmDialog
                open={verifyDropdownOpen}
                title="Approve Tutor"
                message={`Are you sure you want to verify ${tutor.user.name}? This will mark their profile as verified.`}
                confirmText="Yes, Verify"
                onConfirm={handleVerify}
                onClose={() => setVerifyDropdownOpen(false)}
                loading={actionLoading}
                severity="success"
            />

            <RejectionDialog
                open={rejectDropdownOpen}
                title="Reject Tutor"
                onConfirm={handleReject}
                onClose={() => setRejectDropdownOpen(false)}
                loading={actionLoading}
            />

            <SnackbarNotification
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            />

            <DocumentViewerModal
                open={viewerOpen}
                onClose={() => setViewerOpen(false)}
                document={isPaymentTab && paymentProofUrl ? { documentType: 'PAYMENT_PROOF', documentUrl: paymentProofUrl, uploadedAt: new Date() } : selectedDocument || null}
            />
        </Box>
    );
};

export default TutorVerificationDetailsPage;

