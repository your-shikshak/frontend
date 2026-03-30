import { useEffect, useState } from 'react';
import {
  Container, Box, Typography, Card, CardContent, Button, Grid, Divider, Chip,
  IconButton, Menu, MenuItem, FormControl, InputLabel, Select, Paper, alpha
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TimerIcon from '@mui/icons-material/Timer';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import NoteIcon from '@mui/icons-material/Note';
import ClassIcon from '@mui/icons-material/Class';
import GroupsIcon from '@mui/icons-material/Groups';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import leadService from '../../services/leadService';
import demoService from '../../services/demoService';
import announcementService from '../../services/announcementService';
import { IAnnouncement, IClassLead, IDemoHistory, ITutorComparison } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import SnackbarNotification from '../../components/common/SnackbarNotification';
import ClassLeadStatusChip from '../../components/classLeads/ClassLeadStatusChip';
import StatusTimeline from '../../components/classLeads/StatusTimeline';
import AnnouncementModal from '../../components/classLeads/AnnouncementModal';
import InterestedTutorsModal from '../../components/classLeads/InterestedTutorsModal';
import DemoAssignmentModal from '../../components/classLeads/DemoAssignmentModal';
import { CLASS_LEAD_STATUS, DEMO_STATUS, USER_ROLES } from '../../constants';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useErrorDialog } from '../../hooks/useErrorDialog';
import ErrorDialog from '../../components/common/ErrorDialog';

/* ─── Reusable Info Row ───────────────────────────────────────────────────── */
function InfoRow({ icon, label, value, chip }: { icon: React.ReactNode; label: string; value?: React.ReactNode; chip?: React.ReactNode }) {
  if (!value && !chip) return null;
  return (
    <Box display="flex" alignItems="flex-start" gap={1.5} py={1}>
      <Box sx={{ color: 'text.disabled', mt: 0.25, flexShrink: 0 }}>{icon}</Box>
      <Box flex={1} minWidth={0}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 0.25 }}>
          {label}
        </Typography>
        {chip || (
          <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-word' }}>
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/* ─── Section Card ────────────────────────────────────────────────────────── */
function SectionCard({ children, sx }: { children: React.ReactNode; sx?: any }) {
  return (
    <Card
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.100',
        boxShadow: '0 2px 12px -4px rgba(0,0,0,0.06)',
        overflow: 'visible',
        transition: 'box-shadow 0.2s ease',
        '&:hover': { boxShadow: '0 6px 20px -6px rgba(0,0,0,0.1)' },
        ...sx,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, '&:last-child': { pb: { xs: 2.5, sm: 3 } } }}>
        {children}
      </CardContent>
    </Card>
  );
}

/* ─── Section Header ──────────────────────────────────────────────────────── */
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme: any) => alpha(theme.palette.primary.main, 0.08),
          color: 'primary.main',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle1" fontWeight={800} sx={{ fontSize: '1rem' }}>
        {title}
      </Typography>
    </Box>
  );
}

import { getSubjectList, getLeafSubjectList } from '../../utils/subjectUtils';

export default function ClassLeadDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useSelector(selectCurrentUser);
  const [classLead, setClassLead] = useState<IClassLead | null>(null);
  const [demoHistory, setDemoHistory] = useState<IDemoHistory[]>([]);
  const [announcement, setAnnouncement] = useState<IAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openAnnouncement, setOpenAnnouncement] = useState(false);
  const [openInterested, setOpenInterested] = useState(false);
  const [openDemoAssign, setOpenDemoAssign] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<ITutorComparison | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const [managers, setManagers] = useState<{ id: string, name: string }[]>([]);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [reassigning, setReassigning] = useState(false);
  const [coordinators, setCoordinators] = useState<{ id: string, name: string }[]>([]);
  const [approveWithCoordinatorOpen, setApproveWithCoordinatorOpen] = useState(false);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState<string>('');
  const [approvingDemo, setApprovingDemo] = useState(false);
  const { error: dialogError, showError, clearError, handleError } = useErrorDialog();

  const fetchFilters = async () => {
    try {
      const res = await leadService.getLeadFilterOptions();
      setManagers(res.data.managers || []);
      setCoordinators(res.data.coordinators || []);
    } catch (err) {
      console.error('Failed to fetch filters', err);
    }
  };

  const refetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const leadRes = await leadService.getClassLeadById(id as string);
      setClassLead(leadRes.data);
      const demoRes = await demoService.getDemoHistory(id as string);
      setDemoHistory(demoRes.data);
      try {
        const annRes = await announcementService.getAnnouncementByLeadId(id as string);
        setAnnouncement(annRes.data);
      } catch {
        setAnnouncement(null);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && id !== 'undefined') {
      refetchAll();
      fetchFilters();
    }
  }, [id]);

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleEdit = () => navigate(`/class-leads/${id}/edit`);
  const handleDelete = async () => {
    const ok = window.confirm('Delete this lead?');
    if (!ok) return;
    await leadService.deleteClassLead(id as string);
    navigate('/class-leads');
  };

  const handlePostAnnouncement = () => { setOpenAnnouncement(true); handleMenuClose(); };
  const handleViewInterestedTutors = () => { setOpenInterested(true); handleMenuClose(); };
  const handleSelectTutor = (t: ITutorComparison) => { setSelectedTutor(t); setOpenInterested(false); setOpenDemoAssign(true); };
  const handleDemoAssignSuccess = async () => { await refetchAll(); setSnack({ open: true, message: 'Demo assigned successfully', severity: 'success' }); };

  const handleReassignOpen = () => {
    if (!classLead) return;
    const creatorId = (classLead as any).createdBy?._id || (classLead as any).createdBy?.id || classLead.createdBy;
    setSelectedManagerId(typeof creatorId === 'string' ? creatorId : '');
    setReassignModalOpen(true);
    handleMenuClose();
  };

  const handleReassignClose = () => {
    setReassignModalOpen(false);
    setSelectedManagerId('');
  };

  const handleReassignSubmit = async () => {
    if (!id || !selectedManagerId) return;
    setReassigning(true);
    try {
      await leadService.reassignLead(id, selectedManagerId);
      await refetchAll();
      handleReassignClose();
      setSnack({ open: true, message: 'Lead reassigned successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to reassign lead', err);
      setSnack({ open: true, message: 'Failed to reassign lead', severity: 'error' });
    } finally {
      setReassigning(false);
    }
  };

  const handleApproveDemo = async () => {
    setApproveWithCoordinatorOpen(true);
  };

  const handleApproveDemoWithCoordinator = async () => {
    if (!id) return;
    if (!selectedCoordinatorId) {
      setSnack({ open: true, message: 'Coordinator is required to convert to final class', severity: 'error' });
      return;
    }
    setApprovingDemo(true);
    try {
      await demoService.updateDemoStatus(id as string, DEMO_STATUS.APPROVED, undefined, undefined, selectedCoordinatorId);
      await refetchAll();
      setApproveWithCoordinatorOpen(false);
      setSelectedCoordinatorId('');
      setSnack({ open: true, message: 'Demo approved and lead converted successfully', severity: 'success' });
    } catch (e: any) {
      handleError(e);
    } finally {
      setApprovingDemo(false);
    }
  };

  const handleApproveDemoCancel = () => {
    setApproveWithCoordinatorOpen(false);
    setSelectedCoordinatorId('');
  };

  const handleRejectDemo = async () => {
    if (!id) return;
    try {
      await demoService.updateDemoStatus(id, DEMO_STATUS.REJECTED);
      await refetchAll();
      setSnack({ open: true, message: 'Demo rejected', severity: 'success' });
    } catch (e: any) {
      handleError(e);
    }
  };


  const handleMarkPaymentReceived = async () => {
    if (!id) return;
    try {
      await leadService.updateClassLeadStatus(id, CLASS_LEAD_STATUS.PAYMENT_RECEIVED);
      await refetchAll();
      setSnack({ open: true, message: 'Payment marked as received', severity: 'success' });
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to update payment status';
      setSnack({ open: true, message: msg, severity: 'error' });
    }
  };

  if (loading) return <LoadingSpinner fullScreen /> as any;
  if (error) return <Container maxWidth="lg" sx={{ py: 3 }}><ErrorAlert error={error} /></Container>;
  if (!classLead) return null;

  const isManagerOrAdmin = user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.ADMIN;
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  const subjectList = getLeafSubjectList(classLead.subject || (classLead as any).subjects || (classLead as any).subjectList);

  const buildShareText = () => {
    const r: any = classLead as any;

    const gradeLabel = classLead.grade ? String(classLead.grade) : '';
    const boardLabel = classLead.board ? String(classLead.board) : '';
    const subjectsLabel = subjectList.length > 0
      ? subjectList.join(', ').replace(/,([^,]*)$/, ' &$1')
      : '';

    const tutorGender = String(r.preferredTutorGender || '').toUpperCase();
    const tutorGenderLabel = tutorGender === 'MALE'
      ? 'Male'
      : tutorGender === 'FEMALE'
        ? 'Female'
        : tutorGender === 'OTHER'
          ? 'Other'
          : 'No Preferrence';

    const fees = r.tutorFees != null 
      ? `₹${Number(r.tutorFees).toLocaleString()}` 
      : r.paymentAmount != null 
        ? `₹${Number(r.paymentAmount).toLocaleString()}` 
        : '';

    const weekdays = Array.isArray(r.weekdays) ? r.weekdays.filter(Boolean) : [];
    const daysPerWeek = weekdays.length > 0 ? `${weekdays.length} days/week` : '';
    const durationHours = r.classDurationHours != null ? `${r.classDurationHours} hour each` : '';
    const sessionsPerMonth = r.classesPerMonth != null ? `Total: ${r.classesPerMonth} sessions/month` : '';
    const sessionLine = [daysPerWeek, durationHours].filter(Boolean).join(', ');
    const sessionSuffix = sessionsPerMonth ? ` (${sessionsPerMonth})` : '';

    const timing = classLead.timing ? String(classLead.timing) : 'any time';

    const locationParts = [r.location, r.area, r.city]
      .map((x: any) => (x ? String(x).trim() : ''))
      .filter(Boolean);
    const locationText = locationParts.join(', ');
    const mapsUrl = locationText ? `https://www.google.com/maps?q=${encodeURIComponent(locationText)}` : '';

    const noteText = r.notes ? String(r.notes).trim() : '';
    const publicUrl = `${window.location.origin}/leads/public/${id}`;

    const lines: string[] = [];
    lines.push('📢 Your Shikshak Requirement');
    lines.push('');
    if (gradeLabel) lines.push(`📚 Class: ${gradeLabel}`);
    if (boardLabel) lines.push(`📋 Board: ${boardLabel}`);
    if (subjectsLabel) lines.push(`📖 Subject: ${subjectsLabel}.`);
    lines.push(`🚻 Gender:  ${tutorGenderLabel}`);
    if (fees) lines.push(`💰 Fees: ${fees}`);
    if (sessionLine) lines.push(`⏳ Session: ${sessionLine}${sessionSuffix}`);
    lines.push(`🕒 Time: ${timing}`);
    lines.push('');
    if (locationText) {
      lines.push(`📌 Location: ${locationText}.`);
      lines.push('');
    }
    if (noteText) {
      lines.push(`🗒️Note: ${noteText}`);
      lines.push('');
    }
    lines.push('📞 For More Details, Contact:');
    lines.push('📱 +91-9244947668');
    lines.push('');
    lines.push('To Express interest or share with your friends click the link below!');
    lines.push(publicUrl);
    return lines.join('\n');
  };

  const latestDemoFromHistory = demoHistory
    .slice()
    .sort((a, b) => {
      const at = new Date((a as any).completedAt || (a as any).assignedAt || (a as any).createdAt || 0).getTime();
      const bt = new Date((b as any).completedAt || (b as any).assignedAt || (b as any).createdAt || 0).getTime();
      return bt - at;
    })[0];

  const demoDetailsToShow: any = (classLead as any).demoDetails ||
    (latestDemoFromHistory
      ? {
        demoStatus: (latestDemoFromHistory as any).status,
        demoDate: (latestDemoFromHistory as any).demoDate,
        demoTime: (latestDemoFromHistory as any).demoTime,
        notes: (latestDemoFromHistory as any).notes,
        feedback: (latestDemoFromHistory as any).feedback,
        rejectionReason: (latestDemoFromHistory as any).rejectionReason,
        completedAt: (latestDemoFromHistory as any).completedAt,
      }
      : null);

  const demoTutorToShow: any =
    (demoDetailsToShow as any)?.tutor ||
    (demoDetailsToShow as any)?.assignedTutor ||
    (latestDemoFromHistory as any)?.tutor ||
    (latestDemoFromHistory as any)?.assignedTutor ||
    null;

  const canApproveOrRejectDemo =
    isManagerOrAdmin &&
    !!demoDetailsToShow &&
    ((demoDetailsToShow as any).demoStatus === DEMO_STATUS.COMPLETED || (demoDetailsToShow as any).demoStatus === 'COMPLETED');

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>

      {/* ═══════════════ Reassign Modal ═══════════════ */}
      <Menu
        anchorEl={null}
        open={reassignModalOpen}
        onClose={handleReassignClose}
        PaperProps={{ sx: { p: 2.5, minWidth: 320, borderRadius: 2, boxShadow: '0 8px 32px -8px rgba(0,0,0,0.15)' } }}
        anchorReference="anchorPosition"
        anchorPosition={{ top: window.innerHeight / 2, left: window.innerWidth / 2 }}
        transformOrigin={{ vertical: 'center', horizontal: 'center' }}
      >
        <Typography variant="subtitle1" fontWeight={800} mb={1}>Reassign Manager</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Select a new manager for <strong>{classLead?.studentName}</strong>:
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel>Target Manager</InputLabel>
          <Select value={selectedManagerId} label="Target Manager" onChange={(e) => setSelectedManagerId(e.target.value)}>
            {managers.map((mgr) => (
              <MenuItem key={mgr.id} value={mgr.id}>{mgr.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box display="flex" gap={1} justifyContent="flex-end">
          <Button onClick={handleReassignClose} size="small" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            size="small"
            disabled={reassigning || !selectedManagerId || selectedManagerId === ((classLead as any)?.createdBy?._id || (classLead as any)?.createdBy?.id || classLead?.createdBy)}
            onClick={handleReassignSubmit}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {reassigning ? 'Reassigning...' : 'Confirm'}
          </Button>
        </Box>
      </Menu>

      {/* ═══════════════ Page Header ═══════════════ */}
      <Box
        display="flex"
        alignItems="center"
        gap={2}
        mb={3}
        sx={{ pb: 2.5, borderBottom: '1px solid', borderColor: 'grey.100' }}
      >
        <IconButton
          onClick={() => navigate('/class-leads')}
          sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200', '&:hover': { bgcolor: 'grey.100' } }}
        >
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Box flex={1} minWidth={0}>
          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
              {classLead.studentName || 'Class Lead'}
            </Typography>
            <ClassLeadStatusChip status={classLead.status} />
            {!!(classLead as any).paymentReceived && (
              <Chip icon={<CheckCircleIcon />} label="Paid" color="success" size="small" sx={{ fontWeight: 700, borderRadius: '8px', height: 26 }} />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {classLead.grade} • {classLead.board} • {classLead.mode}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon sx={{ fontSize: 16 }} />}
            onClick={handleEdit}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Edit
          </Button>
          <IconButton onClick={handleMenuOpen} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
            <MoreVertIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{ sx: { borderRadius: 1.5, boxShadow: '0 8px 24px -6px rgba(0,0,0,0.12)', minWidth: 200 } }}
          >
            <MenuItem onClick={handleEdit} sx={{ gap: 1.5, py: 1, fontSize: '0.875rem' }}>
              <EditIcon fontSize="small" sx={{ color: 'text.secondary' }} /> Edit Lead
            </MenuItem>
            {classLead.status === CLASS_LEAD_STATUS.NEW && !announcement && (
              <MenuItem onClick={handlePostAnnouncement} sx={{ gap: 1.5, py: 1, fontSize: '0.875rem' }}>
                <AnnouncementIcon fontSize="small" sx={{ color: 'text.secondary' }} /> Post Announcement
              </MenuItem>
            )}
            {classLead.status === CLASS_LEAD_STATUS.REJECTED && (
              <MenuItem onClick={handlePostAnnouncement} sx={{ gap: 1.5, py: 1, fontSize: '0.875rem' }}>
                <AnnouncementIcon fontSize="small" sx={{ color: 'text.secondary' }} /> Repost Lead
              </MenuItem>
            )}
            {(classLead.status === CLASS_LEAD_STATUS.ANNOUNCED || announcement) && (
              <MenuItem onClick={handleViewInterestedTutors} sx={{ gap: 1.5, py: 1, fontSize: '0.875rem' }}>
                <GroupsIcon fontSize="small" sx={{ color: 'text.secondary' }} /> View Interested Tutors
              </MenuItem>
            )}
            {isAdmin && (
              <>
                <Divider />
                <MenuItem onClick={handleReassignOpen} sx={{ gap: 1.5, py: 1, fontSize: '0.875rem' }}>
                  <SwapHorizIcon fontSize="small" sx={{ color: 'text.secondary' }} /> Reassign Manager
                </MenuItem>
              </>
            )}
            <Divider />
            <MenuItem onClick={handleDelete} sx={{ gap: 1.5, py: 1, fontSize: '0.875rem', color: 'error.main' }}>
              <DeleteIcon fontSize="small" /> Delete Lead
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* ═══════════════ LEFT COLUMN — Details ═══════════════ */}
        <Grid item xs={12} md={8}>
          <Box display="flex" flexDirection="column" gap={3}>

            {/* ─── Student Info ─── */}
            <SectionCard>
              <SectionHeader icon={<PersonIcon sx={{ fontSize: 18 }} />} title="Student Information" />
              <Grid container spacing={0}>
                <Grid item xs={12} sm={6}>
                  <InfoRow
                    icon={<PersonIcon sx={{ fontSize: 18 }} />}
                    label={`Student Name${(classLead as any).studentType === 'GROUP' ? 's' : ''}`}
                    value={
                      (classLead as any).studentType === 'GROUP'
                        ? (classLead as any).studentDetails?.map((s: any) => s.name).join(', ') || 'No students'
                        : classLead.studentName || 'N/A'
                    }
                  />
                </Grid>
                {(classLead as any).parentName && (
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<PersonIcon sx={{ fontSize: 18 }} />} label="Parent / Guardian" value={(classLead as any).parentName} />
                  </Grid>
                )}
                {(classLead as any).parentEmail && (
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<EmailIcon sx={{ fontSize: 18 }} />} label="Email" value={(classLead as any).parentEmail} />
                  </Grid>
                )}
                {(classLead as any).parentPhone && (
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<PhoneIcon sx={{ fontSize: 18 }} />} label="Phone" value={(classLead as any).parentPhone} />
                  </Grid>
                )}
              </Grid>
            </SectionCard>

            {/* ─── Academic Details ─── */}
            <SectionCard>
              <SectionHeader icon={<SchoolIcon sx={{ fontSize: 18 }} />} title="Academic Details" />
              <Grid container spacing={0}>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<SchoolIcon sx={{ fontSize: 18 }} />} label="Board" value={classLead.board} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<ClassIcon sx={{ fontSize: 18 }} />} label="Grade" value={classLead.grade} />
                </Grid>
                <Grid item xs={12}>
                  <InfoRow
                    icon={<ClassIcon sx={{ fontSize: 18 }} />}
                    label="Subjects"
                    chip={
                      <Box display="flex" flexWrap="wrap" gap={0.75} mt={0.5}>
                        {subjectList.map((s: string) => (
                          <Chip
                            key={s}
                            label={s}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              borderRadius: '8px',
                              bgcolor: (theme: any) => alpha(theme.palette.primary.main, 0.08),
                              color: 'primary.main',
                            }}
                          />
                        ))}
                      </Box>
                    }
                  />
                </Grid>
                {(classLead as any).preferredTutorGender && (
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      icon={<PersonIcon sx={{ fontSize: 18 }} />}
                      label="Preferred Tutor"
                      value={
                        ((classLead as any).preferredTutorGender === 'MALE' && 'Male') ||
                        ((classLead as any).preferredTutorGender === 'FEMALE' && 'Female') ||
                        ((classLead as any).preferredTutorGender === 'NO_PREFERENCE' && 'No preference') ||
                        (classLead as any).preferredTutorGender
                      }
                    />
                  </Grid>
                )}
              </Grid>
            </SectionCard>

            {/* ─── Class Schedule ─── */}
            <SectionCard>
              <SectionHeader icon={<AccessTimeIcon sx={{ fontSize: 18 }} />} title="Class Schedule" />
              <Grid container spacing={0}>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<ClassIcon sx={{ fontSize: 18 }} />} label="Teaching Mode" value={classLead.mode} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<AccessTimeIcon sx={{ fontSize: 18 }} />} label="Timing" value={classLead.timing} />
                </Grid>
                {(classLead as any).classesPerMonth != null && (
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />} label="Classes / Month" value={(classLead as any).classesPerMonth} />
                  </Grid>
                )}
                {(classLead as any).classDurationHours != null && (
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<TimerIcon sx={{ fontSize: 18 }} />} label="Duration" value={`${(classLead as any).classDurationHours} hrs`} />
                  </Grid>
                )}
                {/* Location details */}
                {classLead.mode === 'HYBRID' && classLead.location && (
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<PlaceIcon sx={{ fontSize: 18 }} />} label="Location" value={classLead.location} />
                  </Grid>
                )}
                {classLead.mode === 'OFFLINE' && (
                  <>
                    {(classLead as any).city && (
                      <Grid item xs={12} sm={6}>
                        <InfoRow icon={<PlaceIcon sx={{ fontSize: 18 }} />} label="City" value={(classLead as any).city} />
                      </Grid>
                    )}
                    {(classLead as any).area && (
                      <Grid item xs={12} sm={6}>
                        <InfoRow icon={<PlaceIcon sx={{ fontSize: 18 }} />} label="Area" value={(classLead as any).area} />
                      </Grid>
                    )}
                    {(classLead as any).address && (
                      <Grid item xs={12}>
                        <InfoRow icon={<PlaceIcon sx={{ fontSize: 18 }} />} label="Address" value={(classLead as any).address} />
                      </Grid>
                    )}
                  </>
                )}
              </Grid>
            </SectionCard>

            {/* ─── Financials ─── */}
            {((classLead as any).studentType === 'SINGLE' && (classLead as any).paymentAmount != null) && (
              <SectionCard>
                <SectionHeader icon={<CurrencyRupeeIcon sx={{ fontSize: 18 }} />} title="Financials" />
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      flex: '1 1 140px',
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: (theme: any) => alpha(theme.palette.primary.main, 0.04),
                      border: '1px solid',
                      borderColor: (theme: any) => alpha(theme.palette.primary.main, 0.1),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Student Fees
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="primary.main">
                      ₹{((classLead as any).paymentAmount || 0).toLocaleString()}
                    </Typography>
                  </Paper>
                  {(classLead as any).tutorFees != null && (
                    <Paper
                      elevation={0}
                      sx={{
                        flex: '1 1 140px',
                        p: 2,
                        borderRadius: 1.5,
                        bgcolor: (theme: any) => alpha(theme.palette.info.main, 0.04),
                        border: '1px solid',
                        borderColor: (theme: any) => alpha(theme.palette.info.main, 0.1),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Tutor Payout
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="info.main">
                        ₹{((classLead as any).tutorFees || 0).toLocaleString()}
                      </Typography>
                    </Paper>
                  )}
                  {(classLead as any).tutorFees != null && (
                    <Paper
                      elevation={0}
                      sx={{
                        flex: '1 1 140px',
                        p: 2,
                        borderRadius: 1.5,
                        bgcolor: (theme: any) => alpha(theme.palette.success.main, 0.04),
                        border: '1px solid',
                        borderColor: (theme: any) => alpha(theme.palette.success.main, 0.1),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Service Charge
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="success.main">
                        ₹{(((classLead as any).paymentAmount || 0) - ((classLead as any).tutorFees || 0)).toLocaleString()}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </SectionCard>
            )}

            {/* ─── Group Student Details ─── */}
            {(classLead as any).studentType === 'GROUP' && (() => {
              const details = (classLead as any).studentDetails?.length > 0
                ? (classLead as any).studentDetails
                : (classLead as any).groupClass?.students;
              if (!details || details.length === 0) return null;

              const totalFees = details.reduce((sum: number, s: any) => sum + (s.fees || 0), 0);
              const totalTutorFees = details.reduce((sum: number, s: any) => sum + (s.tutorFees || 0), 0);

              return (
                <SectionCard>
                  <SectionHeader icon={<GroupsIcon sx={{ fontSize: 18 }} />} title="Group Students" />
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    {details.map((student: any, index: number) => (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'grey.100',
                          borderLeft: '4px solid',
                          borderLeftColor: 'primary.main',
                          bgcolor: 'grey.50',
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              color: 'common.white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography variant="subtitle2" fontWeight={700}>{student.name}</Typography>
                        </Box>
                        <Box display="flex" flexWrap="wrap" gap={2}>
                          <Typography variant="body2" color="text.secondary">
                            Fees: <strong style={{ color: '#1976d2' }}>₹{(student.fees || 0).toLocaleString()}</strong>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tutor: <strong style={{ color: '#1976d2' }}>₹{(student.tutorFees || 0).toLocaleString()}</strong>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Net: <strong style={{ color: '#2e7d32' }}>₹{((student.fees || 0) - (student.tutorFees || 0)).toLocaleString()}</strong>
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                    {/* Totals */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 1.5,
                        background: 'linear-gradient(135deg, rgba(15,98,254,0.04) 0%, rgba(15,98,254,0.08) 100%)',
                        border: '1px solid',
                        borderColor: 'primary.100',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Total Fees
                        </Typography>
                        <Typography variant="h6" fontWeight={800} color="primary.main">₹{totalFees.toLocaleString()}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Tutor Payout
                        </Typography>
                        <Typography variant="h6" fontWeight={800} color="primary.main">₹{totalTutorFees.toLocaleString()}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Service Charge
                        </Typography>
                        <Typography variant="h6" fontWeight={800} color="success.main">₹{(totalFees - totalTutorFees).toLocaleString()}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </SectionCard>
              );
            })()}

            {/* ─── Notes ─── */}
            {(classLead as any).notes && (
              <SectionCard>
                <SectionHeader icon={<NoteIcon sx={{ fontSize: 18 }} />} title="Notes" />
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {(classLead as any).notes}
                </Typography>
              </SectionCard>
            )}

            {((user as any)?.role === USER_ROLES.ADMIN || (user as any)?.role === USER_ROLES.MANAGER || (user as any)?.role === USER_ROLES.COORDINATOR) &&
              (classLead as any).internalNotes && (
                <SectionCard>
                  <SectionHeader icon={<NoteIcon sx={{ fontSize: 18 }} />} title="Internal Notes" />
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    {(classLead as any).internalNotes}
                  </Typography>
                </SectionCard>
              )}

            {/* ─── Demo Details Card ─── */}
            {demoDetailsToShow && (
              <SectionCard>
                <SectionHeader icon={<ClassIcon sx={{ fontSize: 18 }} />} title="Demo Details" />
                <Grid container spacing={0}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      icon={<ClassIcon sx={{ fontSize: 18 }} />}
                      label="Status"
                      chip={
                        <Chip
                          size="small"
                          label={demoDetailsToShow.demoStatus}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600, borderRadius: '8px', mt: 0.5 }}
                        />
                      }
                    />
                  </Grid>
                  {demoTutorToShow && (
                    <Grid item xs={12} sm={6}>
                      <InfoRow icon={<PersonIcon sx={{ fontSize: 18 }} />} label="Tutor" value={demoTutorToShow.name || demoTutorToShow.fullName || 'Assigned'} />
                    </Grid>
                  )}
                  {demoDetailsToShow.demoDate && (
                    <Grid item xs={12} sm={6}>
                      <InfoRow icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />} label="Date" value={new Date(demoDetailsToShow.demoDate).toLocaleDateString()} />
                    </Grid>
                  )}
                  {demoDetailsToShow.demoTime && (
                    <Grid item xs={12} sm={6}>
                      <InfoRow icon={<AccessTimeIcon sx={{ fontSize: 18 }} />} label="Time" value={demoDetailsToShow.demoTime} />
                    </Grid>
                  )}
                  {(demoDetailsToShow as any).duration && (
                    <Grid item xs={12} sm={6}>
                      <InfoRow icon={<TimerIcon sx={{ fontSize: 18 }} />} label="Duration" value={(demoDetailsToShow as any).duration} />
                    </Grid>
                  )}
                  {(demoDetailsToShow as any).attendanceStatus && (
                    <Grid item xs={12} sm={6}>
                      <InfoRow
                        icon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
                        label="Attendance"
                        chip={
                          <Chip
                            size="small"
                            label={(demoDetailsToShow as any).attendanceStatus}
                            color={(demoDetailsToShow as any).attendanceStatus === 'PRESENT' ? 'success' : 'error'}
                            sx={{ fontWeight: 600, borderRadius: '8px', mt: 0.5 }}
                          />
                        }
                      />
                    </Grid>
                  )}
                  {(demoDetailsToShow as any).topicCovered && (
                    <Grid item xs={12}>
                      <InfoRow icon={<NoteIcon sx={{ fontSize: 18 }} />} label="Topic Covered" value={(demoDetailsToShow as any).topicCovered} />
                    </Grid>
                  )}
                  {(demoDetailsToShow as any).notes && (
                    <Grid item xs={12}>
                      <InfoRow icon={<NoteIcon sx={{ fontSize: 18 }} />} label="Notes" value={(demoDetailsToShow as any).notes} />
                    </Grid>
                  )}
                  {demoDetailsToShow.feedback && (
                    <Grid item xs={12}>
                      <InfoRow icon={<NoteIcon sx={{ fontSize: 18 }} />} label="Feedback" value={demoDetailsToShow.feedback} />
                    </Grid>
                  )}
                </Grid>

                {/* Demo approve/reject actions */}
                {canApproveOrRejectDemo && (
                  <Box display="flex" gap={1.5} mt={2.5} pt={2} sx={{ borderTop: '1px solid', borderColor: 'grey.100' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleApproveDemo}
                      startIcon={<CheckCircleIcon />}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, flex: 1 }}
                    >
                      Approve & Convert
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleRejectDemo}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      Reject
                    </Button>
                  </Box>
                )}
              </SectionCard>
            )}

            {/* ─── Status Timeline ─── */}
            <SectionCard>
              <SectionHeader icon={<AccessTimeIcon sx={{ fontSize: 18 }} />} title="Status Timeline" />
              <StatusTimeline classLead={classLead} demoHistory={demoHistory} announcement={announcement} />
            </SectionCard>
          </Box>
        </Grid>

        {/* ═══════════════ RIGHT COLUMN — Actions ═══════════════ */}
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection="column" gap={3} sx={{ position: { md: 'sticky' }, top: { md: 80 } }}>

            {/* ─── Quick Actions ─── */}
            <SectionCard>
              <Typography variant="subtitle1" fontWeight={800} mb={2}>Quick Actions</Typography>
              <Box display="flex" flexDirection="column" gap={1.25}>
                <Button
                  variant="outlined"
                  onClick={handleEdit}
                  startIcon={<EditIcon />}
                  fullWidth
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, justifyContent: 'flex-start', py: 1.25 }}
                >
                  Edit Lead
                </Button>
                {classLead.status === CLASS_LEAD_STATUS.NEW && !announcement && (
                  <Button
                    variant="contained"
                    onClick={() => setOpenAnnouncement(true)}
                    startIcon={<AnnouncementIcon />}
                    fullWidth
                    disableElevation
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      justifyContent: 'flex-start',
                      py: 1.25,
                      boxShadow: '0 4px 14px -4px rgba(15,98,254,0.35)',
                    }}
                  >
                    Post Announcement
                  </Button>
                )}
                {classLead.status === CLASS_LEAD_STATUS.REJECTED && (
                  <Button
                    variant="contained"
                    onClick={() => setOpenAnnouncement(true)}
                    startIcon={<AnnouncementIcon />}
                    fullWidth
                    disableElevation
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, justifyContent: 'flex-start', py: 1.25 }}
                  >
                    Repost Lead
                  </Button>
                )}
                <Button
                  variant="outlined"
                  disabled={!announcement}
                  onClick={() => setOpenInterested(true)}
                  startIcon={<GroupsIcon />}
                  fullWidth
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, justifyContent: 'flex-start', py: 1.25 }}
                >
                  View Interested Tutors
                </Button>
                {(classLead.status === CLASS_LEAD_STATUS.CONVERTED || (classLead as any).status === 'WON') && !(classLead as any).paymentReceived && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleMarkPaymentReceived}
                    startIcon={<CheckCircleIcon />}
                    fullWidth
                    disableElevation
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, justifyContent: 'flex-start', py: 1.25 }}
                  >
                    Mark Payment Received
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleReassignOpen}
                    startIcon={<SwapHorizIcon />}
                    fullWidth
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, justifyContent: 'flex-start', py: 1.25 }}
                  >
                    Reassign Manager
                  </Button>
                )}
              </Box>
            </SectionCard>

            {/* ─── Share ─── */}
            <SectionCard>
              <Typography variant="subtitle1" fontWeight={800} mb={2}>Share Lead</Typography>
              <Box display="flex" flexDirection="column" gap={1.25}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<WhatsAppIcon />}
                  fullWidth
                  disableElevation
                  onClick={() => {
                    const text = buildShareText();
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, justifyContent: 'flex-start', py: 1.25 }}
                >
                  Share on WhatsApp
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  fullWidth
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/leads/public/${id}`);
                    setSnack({ open: true, message: 'Link copied!', severity: 'info' });
                  }}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, justifyContent: 'flex-start', py: 1.25 }}
                >
                  Copy Public Link
                </Button>
              </Box>
            </SectionCard>

            {/* ─── Danger Zone ─── */}
            <SectionCard sx={{ borderColor: 'error.100' }}>
              <Typography variant="subtitle2" fontWeight={700} color="error.main" mb={1.5}>Danger Zone</Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDelete}
                startIcon={<DeleteIcon />}
                fullWidth
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, justifyContent: 'flex-start', py: 1.25 }}
              >
                Delete Lead
              </Button>
            </SectionCard>
          </Box>
        </Grid>
      </Grid>

      {/* ═══════════════ Modals ═══════════════ */}
      <AnnouncementModal open={openAnnouncement} onClose={() => setOpenAnnouncement(false)} classLead={classLead} onSuccess={refetchAll} />
      <InterestedTutorsModal open={openInterested} onClose={() => setOpenInterested(false)} announcementId={announcement?.id || ''} onSelectTutor={handleSelectTutor} />
      {selectedTutor && (
        <DemoAssignmentModal open={openDemoAssign} onClose={() => setOpenDemoAssign(false)} classLead={classLead} selectedTutor={selectedTutor} onSuccess={handleDemoAssignSuccess} />
      )}

      {/* Approve Demo with Coordinator */}
      <Menu
        anchorEl={null}
        open={approveWithCoordinatorOpen}
        onClose={handleApproveDemoCancel}
        PaperProps={{ sx: { p: 2.5, minWidth: 350, borderRadius: 2, boxShadow: '0 8px 32px -8px rgba(0,0,0,0.15)' } }}
        anchorReference="anchorPosition"
        anchorPosition={{ top: window.innerHeight / 2, left: window.innerWidth / 2 }}
        transformOrigin={{ vertical: 'center', horizontal: 'center' }}
      >
        <Typography variant="subtitle1" fontWeight={800} mb={1}>Approve Demo & Convert</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Select a coordinator to manage this class:
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel>Assign Coordinator</InputLabel>
          <Select value={selectedCoordinatorId} label="Assign Coordinator" onChange={(e) => setSelectedCoordinatorId(e.target.value)}>
            {coordinators.map((coord) => (
              <MenuItem key={coord.id} value={coord.id}>{coord.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box display="flex" gap={1} justifyContent="flex-end">
          <Button variant="outlined" onClick={handleApproveDemoCancel} disabled={approvingDemo} sx={{ borderRadius: 2, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApproveDemoWithCoordinator}
            disabled={approvingDemo || !selectedCoordinatorId}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {approvingDemo ? 'Processing...' : 'Approve & Convert'}
          </Button>
        </Box>
      </Menu>

      <SnackbarNotification open={snack.open} message={snack.message} severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} />

      <ErrorDialog
        open={showError}
        onClose={clearError}
        error={dialogError}
        title="Demo Update Error"
      />
    </Container>
  );
}

