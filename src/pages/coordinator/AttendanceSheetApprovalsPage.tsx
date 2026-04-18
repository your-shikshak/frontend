import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { USER_ROLES } from '../../constants';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  Grow,
  Fade,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import AttendanceSheet from '../../components/tutors/AttendanceSheet';
import {
  getCoordinatorPendingSheets,
  getAllPendingSheets,
  approveAttendanceSheet,
  rejectAttendanceSheet,
} from '../../services/attendanceSheetService';
import finalClassService from '../../services/finalClassService';
import AttendanceSheetReviewModal from '../../components/coordinator/AttendanceSheetReviewModal';
import RenewClassModal from '../../components/classes/RenewClassModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SnackbarNotification from '../../components/common/SnackbarNotification';

const AttendanceSheetApprovalsPage: React.FC = () => {
  const theme = useTheme();
  const user = useSelector(selectCurrentUser);
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewClassId, setRenewClassId] = useState<string | null>(null);
  const [renewInitialData, setRenewInitialData] = useState<{ fee?: number; sessions?: number }>({});

  // Dialog States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{ title: string; message: string; onConfirm: () => void; severity?: any }>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const handleOpenRenewModal = (sheet: any) => {
    // Enforcement: Only allow renewal if class is "completed" for the current cycle
    const taken = sheet.totalSessionsTaken || 0;
    const planned = sheet.totalSessionsPlanned || sheet.finalClass?.classesPerMonth || 8; 
    
    if (taken < planned) {
      setSnackbar({
        open: true,
        message: `Renewal is only allowed once the class is completed. (${taken}/${planned} sessions taken)`,
        severity: 'error'
      });
      return;
    }

    setRenewClassId(sheet.finalClass?._id || sheet.finalClass?.id);
    setRenewInitialData({
      fee: sheet.finalClass?.monthlyFees || sheet.finalClass?.monthlyFee,
      sessions: sheet.finalClass?.classesPerMonth || sheet.finalClass?.sessionsPerMonth
    });
    setRenewModalOpen(true);
  };

  const handleCloseRenewModal = () => {
    setRenewModalOpen(false);
    setRenewClassId(null);
  };

  const handleRenewClass = async (payload: { monthlyFee: number; sessionsPerMonth: number }) => {
    if (!renewClassId) return;
    setLoading(true);
    try {
      await finalClassService.renewClass(renewClassId, payload);
      setSnackbar({ open: true, message: 'Class renewed successfully', severity: 'success' });
      fetchSheets();
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed to renew class', severity: 'error' });
    } finally {
      setLoading(false);
      handleCloseRenewModal();
    }
  };

  const fetchSheets = useCallback(async () => {
    try {
      setLoading(true);
      const isAdmin = user?.role === USER_ROLES.ADMIN;
      const response = await (isAdmin ? getAllPendingSheets() : getCoordinatorPendingSheets());
      if (response.success) {
        setSheets(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch attendance sheets');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching sheets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  const handleReview = (sheet: any) => {
    setSelectedSheet(sheet);
    setModalOpen(true);
  };

  const handleApprove = async (id: string, shouldRenew: boolean = false) => {
    try {
      const response = await approveAttendanceSheet(id);
      if (response.success) {
        setSnackbar({ open: true, message: 'Sheet approved successfully', severity: 'success' });
        fetchSheets();
        
        if (shouldRenew && selectedSheet) {
          // Trigger renewal flow
          handleOpenRenewModal(selectedSheet);
        }
      } else {
        setSnackbar({ open: true, message: response.message || 'Approval failed', severity: 'error' });
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'An error occurred during approval', severity: 'error' });
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const response = await rejectAttendanceSheet(id, reason);
      if (response.success) {
        setSnackbar({ open: true, message: 'Sheet rejected successfully', severity: 'info' });
        fetchSheets();
      } else {
        setSnackbar({ open: true, message: response.message || 'Rejection failed', severity: 'error' });
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'An error occurred during rejection', severity: 'error' });
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Chip 
            label="Approved" 
            color="success" 
            size="small" 
            sx={{ fontWeight: 800, borderRadius: '6px', textTransform: 'uppercase', fontSize: '0.65rem' }} 
          />
        );
      case 'PENDING':
        return (
          <Chip 
            label="Pending" 
            color="warning" 
            size="small" 
            sx={{ fontWeight: 800, borderRadius: '6px', textTransform: 'uppercase', fontSize: '0.65rem' }} 
          />
        );
      case 'REJECTED':
        return (
          <Chip 
            label="Rejected" 
            color="error" 
            size="small" 
            sx={{ fontWeight: 800, borderRadius: '6px', textTransform: 'uppercase', fontSize: '0.65rem' }} 
          />
        );
      default:
        return (
          <Chip 
            label={status} 
            size="small" 
            sx={{ fontWeight: 800, borderRadius: '6px', textTransform: 'uppercase', fontSize: '0.65rem' }} 
          />
        );
    }
  };

  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Container maxWidth="xl" sx={{ pb: 8 }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          background: isDarkMode 
            ? 'linear-gradient(225deg, #4338CA 0%, #111827 100%)' 
            : 'linear-gradient(225deg, #4F46E5 0%, #3730A3 100%)',
          color: 'white',
          pt: { xs: 5, md: 7 },
          pb: { xs: 10, md: 12 },
          px: { xs: 3, md: 5 },
          borderRadius: { xs: 0, md: '32px' },
          mt: 3,
          mb: -6,
          overflow: 'hidden',
          boxShadow: '0 20px 40px -20px rgba(79, 70, 229, 0.4)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            zIndex: 0
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ maxWidth: '600px' }}>
            <Typography variant="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.03em' }}>
              Attendance Approvals
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400, mb: 4, lineHeight: 1.5 }}>
              Review submitted attendance sheets and authorize payouts for your assigned tutors.
            </Typography>
            
            <Box display="flex" gap={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: alpha('#fff', 0.1), px: 2, py: 1, borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                <HistoryEduIcon sx={{ fontSize: 20 }} />
                <Typography variant="body2" fontWeight={700}>
                  {sheets.filter(s => s.status === 'PENDING').length} Pending Review
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box display="flex" gap={2}>
            <Tooltip title="Refresh Sheets">
              <IconButton 
                onClick={fetchSheets} 
                disabled={loading}
                sx={{ 
                  color: 'white', 
                  bgcolor: alpha('#fff', 0.1), 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid',
                  borderColor: alpha('#fff', 0.2),
                  '&:hover': { bgcolor: alpha('#fff', 0.2) } 
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ position: 'relative', zIndex: 2, px: { xs: 0, md: 5 } }}>
        <Fade in timeout={800}>
          <Box>
            {error && (
              <Alert severity="error" variant="filled" sx={{ mb: 4, borderRadius: '16px' }}>
                {error}
              </Alert>
            )}

            {loading && sheets.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={10}>
                <CircularProgress thickness={5} size={60} />
              </Box>
            ) : sheets.length === 0 ? (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 6, 
                  textAlign: 'center', 
                  borderRadius: '32px',
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(20px)',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.divider, 0.1)
                }}
              >
                <Avatar sx={{ width: 80, height: 80, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', mb: 3, mx: 'auto' }}>
                  <HistoryEduIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  No Sheets to Review
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Everything is up to date! New attendance sheets will appear here once tutors submit them.
                </Typography>
              </Paper>
            ) : (
              <TableContainer 
                component={Paper} 
                elevation={0}
                sx={{ 
                  borderRadius: '24px', 
                  border: '1px solid',
                  borderColor: alpha(theme.palette.divider, 0.1),
                  background: alpha(theme.palette.background.paper, 0.7),
                  backdropFilter: 'blur(12px)',
                  overflow: 'hidden',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)'
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', py: 2.5 }}>Class / Student</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', py: 2.5 }}>Cycle Details</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', py: 2.5 }}>Sessions</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', py: 2.5 }}>Status</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', py: 2.5 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sheets.map((sheet, index) => (
                      <Grow in timeout={500 + index * 100} key={sheet._id}>
                        <TableRow 
                          hover
                          sx={{ 
                            '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) },
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                              {sheet.finalClass?.className || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              {sheet.finalClass?.studentName || 'Unknown Student'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{sheet.periodLabel}</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              Cycle #{sheet.cycleNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`${sheet.totalSessionsTaken || 0} Sessions`} 
                              size="small" 
                              sx={{ 
                                fontWeight: 800, 
                                borderRadius: '6px', 
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                color: 'primary.main',
                                border: 'none'
                              }} 
                            />
                          </TableCell>
                          <TableCell>
                            {getStatusChip(sheet.status)}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
                              <Button 
                                size="small"
                                startIcon={<VisibilityIcon sx={{ fontSize: '1rem !important' }} />}
                                onClick={() => handleReview(sheet)}
                                sx={{ 
                                  color: 'primary.main', 
                                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                                  fontWeight: 700,
                                  px: 1.5,
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) } 
                                }}
                              >
                                View
                              </Button>

                              {sheet.status !== 'PENDING' && sheet.status === 'APPROVED' && !sheet.renewedAt && (
                                <Button
                                  size="small"
                                  startIcon={<AutorenewIcon sx={{ fontSize: '1rem !important' }} />}
                                  onClick={() => handleOpenRenewModal(sheet)}
                                  sx={{
                                    color: 'warning.main',
                                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                                    fontWeight: 700,
                                    px: 1.5,
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.15) }
                                  }}
                                >
                                  Renew
                                </Button>
                              )}

                              {String(sheet.status) === 'PENDING' && (
                                <>
                                  <Button
                                    size="small"
                                    color="success"
                                    startIcon={<CheckCircleIcon sx={{ fontSize: '1rem !important' }} />}
                                    onClick={() => {

                                      if (true) { // No longer restricted by session count
                                        // Use handleReview to let them choose in the modal
                                        handleReview(sheet);
                                      } else {
                                        setConfirmData({
                                          title: 'Approve Attendance Sheet',
                                          message: 'Approve this sheet and create a one-time payout for sessions recorded so far?',
                                          severity: 'success',
                                          onConfirm: () => {
                                            handleApprove(sheet._id, false);
                                            setConfirmOpen(false);
                                          }
                                        });
                                        setConfirmOpen(true);
                                      }
                                    }}
                                    sx={{ 
                                      bgcolor: alpha(theme.palette.success.main, 0.08),
                                      fontWeight: 700,
                                      px: 1.5,
                                      borderRadius: '8px',
                                      fontSize: '0.75rem',
                                      '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.15) } 
                                    }}
                                  >
                                    {sheet.renewedAt ? 'Approve' : 'Approve & Renew'}
                                  </Button>
                                  <Button
                                    size="small"
                                    color="error"
                                    startIcon={<CancelIcon sx={{ fontSize: '1rem !important' }} />}
                                    onClick={() => {
                                      setRejectId(sheet._id);
                                      setRejectReason('');
                                      setRejectOpen(true);
                                    }}
                                    sx={{ 
                                      bgcolor: alpha(theme.palette.error.main, 0.08),
                                      fontWeight: 700,
                                      px: 1.5,
                                      borderRadius: '8px',
                                      fontSize: '0.75rem',
                                      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.15) } 
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      </Grow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Fade>
      </Box>

      <AttendanceSheetReviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sheet={selectedSheet}
        onApprove={handleApprove}
        onReject={handleReject}
        canRenew={true}
      />

      <RenewClassModal
        open={renewModalOpen}
        onClose={handleCloseRenewModal}
        onRenew={handleRenewClass}
        isAdmin={false} // Coordinators use this page
        initialMonthlyFee={renewInitialData.fee}
        initialSessionsPerMonth={renewInitialData.sessions}
        attendanceSheetId={selectedSheet?._id}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={confirmData.title}
        message={confirmData.message}
        onConfirm={confirmData.onConfirm}
        onClose={() => setConfirmOpen(false)}
        severity={confirmData.severity || 'warning'}
      />

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Attendance Sheet</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this sheet is being rejected..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            disabled={!rejectReason.trim()}
            onClick={() => {
              handleReject(rejectId!, rejectReason);
              setRejectOpen(false);
            }}
          >
            Reject Sheet
          </Button>
        </DialogActions>
      </Dialog>

      <SnackbarNotification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
    </Container>
  );
};

export default AttendanceSheetApprovalsPage;

