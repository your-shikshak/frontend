import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Grid, Card, CardContent, Avatar, Divider, Chip, Tabs, Tab, Button, TextField, MenuItem, List, ListItem, ListItemText, IconButton, Paper, Stack } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import ChangePasswordOtpModal from '../../components/common/ChangePasswordOtpModal';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WorkIcon from '@mui/icons-material/Work';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ClassIcon from '@mui/icons-material/Class';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { ICoordinator, ICoordinatorProfileMetrics } from '../../types';
import { getCoordinatorByUserId, getProfileMetrics } from '../../services/coordinatorService';
import * as coordinatorService from '../../services/coordinatorService';
import MetricsCard from '../../components/dashboard/MetricsCard';
import DateRangePicker from '../../components/dashboard/DateRangePicker';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import SnackbarNotification from '../../components/common/SnackbarNotification';
import { subDays, format } from 'date-fns';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import ProfileCompletionModal from '../../components/common/ProfileCompletionModal';

const CoordinatorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [coordinatorProfile, setCoordinatorProfile] = useState<ICoordinator | null>(null);
  const [profileMetrics, setProfileMetrics] = useState<ICoordinatorProfileMetrics | null>(null);
  const [profileMissing, setProfileMissing] = useState<boolean>(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ fromDate?: string; toDate?: string }>({
    fromDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    toDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [tabValue, setTabValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

  const [docType, setDocType] = useState<string>('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState<boolean>(false);
  const [docError, setDocError] = useState<string | null>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any | null>(null);

  // Profile Completion Modal State
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [hasShownCompleteModal, setHasShownCompleteModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let profile: ICoordinator | null = null;
        let userIdForMetrics: string | undefined = undefined;

        if (id) {
          const profileRes = await coordinatorService.getCoordinatorById(id);
          profile = profileRes.data as unknown as ICoordinator;
          // profile.user may be a populated object — extract _id string correctly
          const userObj = (profile as any).user;
          userIdForMetrics = userObj?._id ? String(userObj._id) : (typeof userObj === 'string' ? userObj : undefined);
        } else if (user?.id) {
          const profileRes = await getCoordinatorByUserId(user.id);
          profile = profileRes.data as unknown as ICoordinator;
          userIdForMetrics = user.id;
        }

          if (profile) {
            setCoordinatorProfile(profile);
            setProfileMissing(false);
            
            // Check for incomplete profile to show modal (only on own profile)
            if (!id) {
              const isInfoIncomplete = !profile.bio || !profile.permanentAddress || !profile.residentialAddress || !profile.languagesKnown?.length;
              if (isInfoIncomplete && !hasShownCompleteModal) {
                setCompleteModalOpen(true);
                setHasShownCompleteModal(true);
              }
            }

            // Only fetch metrics if we have a userId to fetch for
            if (userIdForMetrics) {
              const metricsRes = await getProfileMetrics(dateRange.fromDate, dateRange.toDate, userIdForMetrics);
              setProfileMetrics(metricsRes.data as ICoordinatorProfileMetrics);
            }
          }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setProfileMissing(true);
          setCoordinatorProfile(null);
        } else {
          setError('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user?.id, dateRange.fromDate, dateRange.toDate]);

  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '';

  const canEditDocuments = !id && user?.role === 'COORDINATOR' && String((coordinatorProfile as any)?.verificationStatus) !== 'VERIFIED';

  const handleUploadDoc = async () => {
    if (!coordinatorProfile) return;
    if (!docType) {
      setDocError('Please select a document type');
      return;
    }
    if (!docFile) {
      setDocError('Please choose a file');
      return;
    }
    try {
      setDocUploading(true);
      setDocError(null);
      const coordinatorId = (coordinatorProfile as any).id || (coordinatorProfile as any)._id;
      const resp = await coordinatorService.uploadCoordinatorDocument(String(coordinatorId), docType, docFile);
      setCoordinatorProfile(resp.data as unknown as ICoordinator);
      setDocType('');
      setDocFile(null);
      setSnackbar({ open: true, message: 'Document uploaded', severity: 'success' });
    } catch (e: any) {
      setDocError(e?.response?.data?.message || e?.response?.data?.error || 'Failed to upload document');
    } finally {
      setDocUploading(false);
    }
  };

  const handleDeleteDoc = async (index: number) => {
    if (!coordinatorProfile) return;
    try {
      setDocUploading(true);
      setDocError(null);
      const coordinatorId = (coordinatorProfile as any).id || (coordinatorProfile as any)._id;
      const resp = await coordinatorService.deleteCoordinatorDocument(String(coordinatorId), index);
      setCoordinatorProfile(resp.data as unknown as ICoordinator);
      setSnackbar({ open: true, message: 'Document deleted', severity: 'success' });
    } catch (e: any) {
      setDocError(e?.response?.data?.message || e?.response?.data?.error || 'Failed to delete document');
    } finally {
      setDocUploading(false);
    }
  };

  const handleOpenViewer = (doc: any) => {
    setViewingDocument(doc);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setViewingDocument(null);
  };

  useEffect(() => {
    if (user?.isProfileComplete) {
      setCompleteModalOpen(false);
    }
  }, [user?.isProfileComplete]);

  return (
    <Container maxWidth="lg" sx={{ p: 3 }}>
      <Typography variant="h4" mb={3}>{id ? 'Coordinator Profile' : 'My Profile'}</Typography>

      {loading && !coordinatorProfile && <LoadingSpinner />}
      {error && <ErrorAlert error={error} />}

      {profileMissing && (
        <Card>
          <CardContent>
            <Typography variant="h6">Coordinator profile not found</Typography>
            <Typography color="text.secondary">Your account is active but does not have a coordinator profile yet. Please ask an administrator to create your coordinator profile.</Typography>
            <Typography variant="body2" color="text.secondary">Once created, you will see your performance metrics and activity here.</Typography>
          </CardContent>
        </Card>
      )}

      {coordinatorProfile && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                  <Avatar sx={{ width: 100, height: 100, bgcolor: 'primary.main' }}>
                    {initials || <AccountCircleIcon fontSize="large" />}
                  </Avatar>
                  <Typography variant="h5">{coordinatorProfile.user?.name || user?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{coordinatorProfile.user?.email || user?.email}</Typography>
                  <Chip label={coordinatorProfile.user?.role || user?.role} color="primary" />
                  {!id && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setChangePasswordOpen(true)}
                      sx={{ mt: 1 }}
                      startIcon={<LockResetIcon />}
                    >
                      Change Password
                    </Button>
                  )}
                  <Divider sx={{ width: '100%', my: 2 }} />
                  <Typography variant="body2">Joined: {new Date(coordinatorProfile.joiningDate).toLocaleDateString()}</Typography>
                  <Typography variant="body2">Max Capacity: {coordinatorProfile.maxClassCapacity}</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">Status:</Typography>
                    <Chip size="small" label={coordinatorProfile.isActive ? 'Active' : 'Inactive'} color={coordinatorProfile.isActive ? 'success' : 'default'} />
                  </Box>
                  {'verificationStatus' in (coordinatorProfile as any) && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">Verification:</Typography>
                      <Chip
                        size="small"
                        label={String((coordinatorProfile as any).verificationStatus || 'PENDING')}
                        color={String((coordinatorProfile as any).verificationStatus) === 'VERIFIED' ? 'success' : 'default'}
                      />
                    </Box>
                  )}

                  <Divider sx={{ width: '100%', my: 2 }} />

                  <Box width="100%">
                    <Typography variant="subtitle1" fontWeight={700} mb={1}>
                      Documents
                    </Typography>

                    {canEditDocuments && (
                      <Box display="flex" flexDirection="column" gap={1.5}>
                        <TextField
                          select
                          size="small"
                          label="Document Type"
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          fullWidth
                        >
                          {['AADHAAR', 'PROFILE_PHOTO', 'EXPERIENCE_PROOF', 'DEGREE', 'CERTIFICATE', 'OTHER'].map((t) => (
                            <MenuItem key={t} value={t}>
                              {t}
                            </MenuItem>
                          ))}
                        </TextField>

                        <Button variant="outlined" component="label" size="small" disabled={docUploading}>
                          Choose File
                          <input
                            hidden
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                          />
                        </Button>
                        {docFile && (
                          <Typography variant="caption" color="text.secondary">
                            {docFile.name}
                          </Typography>
                        )}

                        {docError && <Typography variant="caption" color="error">{docError}</Typography>}

                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleUploadDoc}
                          disabled={docUploading || !docType || !docFile}
                        >
                          {docUploading ? 'Uploading...' : 'Upload Document'}
                        </Button>
                      </Box>
                    )}

                    <List dense sx={{ mt: 1 }}>
                      {Array.isArray((coordinatorProfile as any).documents) && (coordinatorProfile as any).documents.length > 0 ? (
                        (coordinatorProfile as any).documents.map((d: any, idx: number) => {
                          const isClickable = !!id; // "Strictly this feature is for this page only" - when id is present in params
                          return (
                            <ListItem
                              key={`${d?.documentType || 'DOC'}-${idx}`}
                              onClick={isClickable ? () => handleOpenViewer(d) : undefined}
                              sx={{
                                cursor: isClickable ? 'pointer' : 'default',
                                '&:hover': isClickable ? { bgcolor: 'action.hover' } : {},
                                borderRadius: 1
                              }}
                              secondaryAction={
                                canEditDocuments ? (
                                  <IconButton edge="end" aria-label="delete" onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDoc(idx);
                                  }} disabled={docUploading}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                ) : null
                              }
                            >
                              <ListItemText
                                primary={`${d?.documentType || 'Document'}${d?.verifiedAt ? ' (Verified)' : ''}`}
                                secondary={''}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  fontWeight: isClickable ? 600 : 400,
                                  color: isClickable ? 'primary.main' : 'text.primary',
                                  sx: isClickable ? { textDecoration: 'underline', textUnderlineOffset: 2 } : {}
                                }}
                              />
                            </ListItem>
                          );
                        })
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No documents uploaded yet.
                        </Typography>
                      )}
                    </List>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <DateRangePicker fromDate={dateRange.fromDate} toDate={dateRange.toDate} onDateChange={setDateRange} />
                <Grid container spacing={2} mt={1}>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricsCard title="Total Classes Handled" value={profileMetrics?.totalClassesHandled ?? '-'} icon={<ClassIcon />} color="primary.main" loading={loading} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricsCard title="Active Classes" value={profileMetrics?.activeClassesCount ?? '-'} icon={<ClassIcon />} color="success.main" loading={loading} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricsCard title="Completed Classes" value={profileMetrics?.completedClassesCount ?? '-'} subtitle="In selected period" icon={<CheckCircleIcon />} color="info.main" loading={loading} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricsCard title="Paused Classes" value={profileMetrics?.pausedClassesCount ?? '-'} subtitle="In selected period" icon={<ClassIcon />} color="warning.main" loading={loading} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricsCard title="Attendance Approval Rate" value={profileMetrics?.attendanceApprovalRate !== undefined ? `${profileMetrics.attendanceApprovalRate}%` : '-'} icon={<CheckCircleIcon />} color="success.main" loading={loading} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricsCard title="Performance Score" value={profileMetrics?.performanceScore !== undefined ? `${profileMetrics.performanceScore}/100` : '-'} icon={<TrendingUpIcon />} color="secondary.main" loading={loading} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricsCard title="Available Capacity" value={profileMetrics?.availableCapacity ?? '-'} subtitle={`Max: ${profileMetrics?.maxClassCapacity ?? '-'}`} icon={<WorkIcon />} color="info.main" loading={loading} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricsCard 
                      title="Attendance Approval" 
                      value={profileMetrics?.pendingApprovalsCount ?? '-'} 
                      icon={<AssignmentIcon />} 
                      color="warning.main" 
                      loading={loading} 
                      onClick={() => navigate('/attendance-sheet-approvals')}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                  <Tab label="Overview" />
                  <Tab label="Activity" />
                </Tabs>
                {tabValue === 0 && (
                  <Box mt={2}>
                    <Typography variant="h6" gutterBottom>
                      Performance Overview
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Your contribution to managing classes and coordinating tutors
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Card>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={1}>
                              <TaskAltIcon color="success" />
                              <Typography variant="subtitle1">Today's Tasks</Typography>
                            </Box>
                            <Typography variant="h5" mt={1}>{profileMetrics?.todaysTasksCount ?? 0}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1">Capacity Utilization</Typography>
                            <Typography variant="body2" color="text.secondary" mt={1}>
                              {(profileMetrics?.activeClassesCount ?? 0)} / {(profileMetrics?.maxClassCapacity ?? 0)} ({Math.round(((profileMetrics?.activeClassesCount ?? 0) / ((profileMetrics?.maxClassCapacity ?? 1))) * 100)}%)
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                {tabValue === 1 && (
                  <Box mt={2}>
                    <Typography color="text.secondary">Activity log coming soon</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <ChangePasswordOtpModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />

      <DocumentViewerModal
        open={viewerOpen}
        onClose={handleCloseViewer}
        document={viewingDocument}
      />

      <SnackbarNotification open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} />

      <ProfileCompletionModal open={completeModalOpen} />
    </Container>
  );
};

export default CoordinatorProfilePage;

