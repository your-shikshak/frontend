import { useEffect, useState } from 'react';
import {
  Container, Box, Typography, Button, Grid, Divider, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, FormControl, InputLabel, Select, MenuItem, Paper, alpha,
  useMediaQuery, useTheme, Avatar,
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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Menu from '@mui/material/Menu';
import MenuItemMui from '@mui/material/MenuItem';
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
import { getLeafSubjectList } from '../../utils/subjectUtils';

// ── Avatar colour ─────────────────────────────────────────────────────────────
const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#2E7D32'];
const avatarColor = (name: string) => PALETTE[(name?.charCodeAt(0) ?? 0) % PALETTE.length];
const initials = (name: string) =>
  (name || '?').trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();

// ── Section card — no ghost-card, 3D depth shadow ─────────────────────────────
function SectionCard({ children, sx, animDelay = 0 }: { children: React.ReactNode; sx?: any; animDelay?: number }) {
  return (
    <Box
      sx={{
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        bgcolor: '#fff',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 10px rgba(0,0,0,0.03)',
        transition: 'transform 180ms cubic-bezier(0.23,1,0.32,1), box-shadow 180ms cubic-bezier(0.23,1,0.32,1)',
        '@keyframes sectionIn': {
          from: { opacity: 0, transform: 'perspective(600px) translateZ(-10px) translateY(8px)' },
          to: { opacity: 1, transform: 'perspective(600px) translateZ(0) translateY(0)' },
        },
        animation: `sectionIn 320ms cubic-bezier(0.23,1,0.32,1) ${animDelay}ms both`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': {
            transform: 'perspective(800px) translateZ(4px) translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.07), 0 12px 24px rgba(0,0,0,0.04)',
          },
        },
        ...sx,
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
    </Box>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box display="flex" alignItems="center" gap={1.25} mb={2}>
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: '9px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha('#6366f1', 0.08),
          color: '#6366f1',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography fontWeight={800} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
        {title}
      </Typography>
    </Box>
  );
}

// ── Info row — label + value ──────────────────────────────────────────────────
function InfoRow({ icon, label, value, chip }: { icon: React.ReactNode; label: string; value?: React.ReactNode; chip?: React.ReactNode }) {
  if (!value && !chip) return null;
  return (
    <Box display="flex" alignItems="flex-start" gap={1.25} py={0.875}>
      <Box sx={{ color: '#94a3b8', mt: 0.125, flexShrink: 0 }}>{icon}</Box>
      <Box flex={1} minWidth={0}>
        <Typography
          sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', display: 'block', mb: 0.2 }}
        >
          {label}
        </Typography>
        {chip || (
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, wordBreak: 'break-word', color: '#1e293b' }}>
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ── 2-column info grid for atomic pairs ──────────────────────────────────────
function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr' },
        gap: 0,
        '& > *': { borderBottom: '1px solid #F1F5F9', '&:last-child': { borderBottom: 'none' }, '&:nth-of-type(odd)': { borderRight: '1px solid #F1F5F9' } },
      }}
    >
      {children}
    </Box>
  );
}

function InfoCell({ icon, label, value, chip, fullWidth }: { icon: React.ReactNode; label: string; value?: React.ReactNode; chip?: React.ReactNode; fullWidth?: boolean }) {
  if (!value && !chip) return null;
  return (
    <Box sx={{ p: { xs: 1.25, sm: 1.5 }, gridColumn: fullWidth ? 'span 2' : undefined }}>
      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', mb: 0.25 }}>
        {label}
      </Typography>
      {chip || (
        <Typography sx={{ fontSize: '0.83rem', fontWeight: 600, color: '#1e293b', wordBreak: 'break-word' }}>
          {value}
        </Typography>
      )}
    </Box>
  );
}

// ── Action button (used in sticky bar + sidebar) ──────────────────────────────
function ActionBtn({
  children, onClick, variant = 'outlined', color = 'primary', icon, disabled = false, fullWidth = true,
}: {
  children: React.ReactNode; onClick?: () => void; variant?: 'outlined' | 'contained' | 'text';
  color?: any; icon?: React.ReactNode; disabled?: boolean; fullWidth?: boolean;
}) {
  return (
    <Button
      variant={variant}
      color={color}
      onClick={onClick}
      startIcon={icon}
      disabled={disabled}
      fullWidth={fullWidth}
      disableElevation
      sx={{
        borderRadius: '10px',
        fontWeight: 700,
        fontSize: '0.85rem',
        py: 1.125,
        justifyContent: 'flex-start',
        transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), box-shadow 160ms ease',
        '@media (hover: none)': { '&:active': { transform: 'scale(0.97)' } },
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': { transform: 'translateY(-1px)' },
        },
      }}
    >
      {children}
    </Button>
  );
}

export default function ClassLeadDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useSelector(selectCurrentUser);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [coordinators, setCoordinators] = useState<{ id: string; name: string }[]>([]);
  const [approveOpen, setApproveOpen] = useState(false);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('');
  const [approvingDemo, setApprovingDemo] = useState(false);
  const { error: dialogError, showError, clearError, handleError } = useErrorDialog();

  const fetchFilters = async () => {
    try {
      const res = await leadService.getLeadFilterOptions();
      setManagers(res.data.managers || []);
      setCoordinators(res.data.coordinators || []);
    } catch { }
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
      } catch { setAnnouncement(null); }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && id !== 'undefined') { refetchAll(); fetchFilters(); }
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
    setReassignOpen(true);
    handleMenuClose();
  };

  const handleReassignSubmit = async () => {
    if (!id || !selectedManagerId) return;
    setReassigning(true);
    try {
      await leadService.reassignLead(id, selectedManagerId);
      await refetchAll();
      setReassignOpen(false);
      setSnack({ open: true, message: 'Lead reassigned', severity: 'success' });
    } catch {
      setSnack({ open: true, message: 'Failed to reassign', severity: 'error' });
    } finally { setReassigning(false); }
  };

  const handleApproveDemo = () => setApproveOpen(true);

  const handleApproveDemoConfirm = async () => {
    if (!id || !selectedCoordinatorId) {
      setSnack({ open: true, message: 'Coordinator required', severity: 'error' });
      return;
    }
    setApprovingDemo(true);
    try {
      await demoService.updateDemoStatus(id, DEMO_STATUS.APPROVED, undefined, undefined, selectedCoordinatorId);
      await refetchAll();
      setApproveOpen(false);
      setSelectedCoordinatorId('');
      setSnack({ open: true, message: 'Demo approved and converted', severity: 'success' });
    } catch (e: any) { handleError(e); }
    finally { setApprovingDemo(false); }
  };

  const handleRejectDemo = async () => {
    if (!id) return;
    try {
      await demoService.updateDemoStatus(id, DEMO_STATUS.REJECTED);
      await refetchAll();
      setSnack({ open: true, message: 'Demo rejected', severity: 'success' });
    } catch (e: any) { handleError(e); }
  };

  const handleMarkPaymentReceived = async () => {
    if (!id) return;
    try {
      await leadService.updateClassLeadStatus(id, CLASS_LEAD_STATUS.PAYMENT_RECEIVED);
      await refetchAll();
      setSnack({ open: true, message: 'Payment marked as received', severity: 'success' });
    } catch (e: any) {
      setSnack({ open: true, message: e?.response?.data?.message || 'Failed', severity: 'error' });
    }
  };

  if (loading) return <LoadingSpinner fullScreen /> as any;
  if (error) return <Container maxWidth="lg" sx={{ py: 3 }}><ErrorAlert error={error} /></Container>;
  if (!classLead) return null;

  const isManagerOrAdmin = user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.ADMIN;
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const subjectList = getLeafSubjectList(classLead.subject || (classLead as any).subjects || (classLead as any).subjectList);
  const r: any = classLead;

  const buildShareText = () => {
    const gradeLabel = classLead.grade ? String(classLead.grade) : '';
    const boardLabel = classLead.board ? String(classLead.board) : '';
    const subjectsLabel = subjectList.length > 0 ? subjectList.join(', ').replace(/,([^,]*)$/, ' &$1') : '';
    const tutorGender = String(r.preferredTutorGender || '').toUpperCase();
    const tutorGenderLabel = tutorGender === 'MALE' ? 'Male' : tutorGender === 'FEMALE' ? 'Female' : tutorGender === 'OTHER' ? 'Other' : 'No Preference';
    const fees = r.tutorFees != null ? `₹${Number(r.tutorFees).toLocaleString()}` : r.paymentAmount != null ? `₹${Number(r.paymentAmount).toLocaleString()}` : '';
    const weekdays = Array.isArray(r.weekdays) ? r.weekdays.filter(Boolean) : [];
    const daysPerWeek = weekdays.length > 0 ? `${weekdays.length} days/week` : '';
    const durationHours = r.classDurationHours != null ? `${r.classDurationHours} hour each` : '';
    const sessionsPerMonth = r.classesPerMonth != null ? `Total: ${r.classesPerMonth} sessions/month` : '';
    const sessionLine = [daysPerWeek, durationHours].filter(Boolean).join(', ');
    const sessionSuffix = sessionsPerMonth ? ` (${sessionsPerMonth})` : '';
    const timing = classLead.timing ? String(classLead.timing) : 'any time';
    const locationParts = [r.location, r.area, r.city].map((x: any) => (x ? String(x).trim() : '')).filter(Boolean);
    const locationText = locationParts.join(', ');
    const noteText = r.notes ? String(r.notes).trim() : '';
    const publicUrl = `${window.location.origin}/leads/public/${id}`;
    const lines: string[] = [];
    lines.push('\u{1F4E2} Your Shikshak Requirement', '');
    if (gradeLabel) lines.push(`\u{1F4DA} Class: ${gradeLabel}`);
    if (boardLabel) lines.push(`\u{1F4CB} Board: ${boardLabel}`);
    if (subjectsLabel) lines.push(`\u{1F4D6} Subject: ${subjectsLabel}.`);
    lines.push(`\u{1F6BB} Gender: ${tutorGenderLabel}`);
    if (fees) lines.push(`\u{1F4B0} Fees: ${fees}`);
    if (sessionLine) lines.push(`\u{23F3} Session: ${sessionLine}${sessionSuffix}`);
    lines.push(`\u{1F552} Time: ${timing}`, '');
    if (locationText) { lines.push(`\u{1F4CC} Location: ${locationText}.`, ''); }
    if (noteText) { lines.push(`\u{1F5D2}️Note: ${noteText}`, ''); }
    lines.push('\u{1F4DE} For More Details, Contact:', '\u{1F4F1} +91-9244947668', '');
    lines.push('To Express interest or share with your friends click the link below!', publicUrl);
    return lines.join('\n');
  };

  const latestDemoFromHistory = demoHistory.slice().sort((a, b) => {
    const at = new Date((a as any).completedAt || (a as any).assignedAt || (a as any).createdAt || 0).getTime();
    const bt = new Date((b as any).completedAt || (b as any).assignedAt || (b as any).createdAt || 0).getTime();
    return bt - at;
  })[0];

  const demoDetailsToShow: any = (classLead as any).demoDetails || (latestDemoFromHistory ? {
    demoStatus: (latestDemoFromHistory as any).status,
    demoDate: (latestDemoFromHistory as any).demoDate,
    demoTime: (latestDemoFromHistory as any).demoTime,
    notes: (latestDemoFromHistory as any).notes,
    feedback: (latestDemoFromHistory as any).feedback,
    rejectionReason: (latestDemoFromHistory as any).rejectionReason,
    completedAt: (latestDemoFromHistory as any).completedAt,
  } : null);

  const demoTutorToShow: any = (demoDetailsToShow as any)?.tutor || (demoDetailsToShow as any)?.assignedTutor || (latestDemoFromHistory as any)?.tutor || (latestDemoFromHistory as any)?.assignedTutor || null;

  const canApproveOrRejectDemo = isManagerOrAdmin && !!demoDetailsToShow &&
    ((demoDetailsToShow as any).demoStatus === DEMO_STATUS.COMPLETED || (demoDetailsToShow as any).demoStatus === 'COMPLETED');

  const ac = avatarColor(classLead.studentName || '');

  // Primary actions for mobile sticky bar
  const primaryAction = classLead.status === CLASS_LEAD_STATUS.NEW && !announcement
    ? { label: 'Post Announcement', icon: <AnnouncementIcon />, onClick: () => setOpenAnnouncement(true), color: 'primary' as const, variant: 'contained' as const }
    : classLead.status === CLASS_LEAD_STATUS.REJECTED
      ? { label: 'Repost Lead', icon: <AnnouncementIcon />, onClick: () => setOpenAnnouncement(true), color: 'primary' as const, variant: 'contained' as const }
      : canApproveOrRejectDemo
        ? { label: 'Approve & Convert', icon: <CheckCircleIcon />, onClick: handleApproveDemo, color: 'primary' as const, variant: 'contained' as const }
        : (classLead.status === CLASS_LEAD_STATUS.CONVERTED || (classLead as any).status === 'WON') && !(classLead as any).paymentReceived
          ? { label: 'Mark Paid', icon: <CheckCircleIcon />, onClick: handleMarkPaymentReceived, color: 'success' as const, variant: 'contained' as const }
          : null;

  // ── Sections JSX ─────────────────────────────────────────────────────────────
  const studentInfoSection = (
    <SectionCard animDelay={isMobile ? 80 : 0}>
      <SectionHeader icon={<PersonIcon sx={{ fontSize: 16 }} />} title="Student Information" />
      <InfoGrid>
        <InfoCell
          icon={<PersonIcon sx={{ fontSize: 15 }} />}
          label={`Student${r.studentType === 'GROUP' ? 's' : ''}`}
          value={r.studentType === 'GROUP' ? (r.studentDetails?.map((s: any) => s.name).join(', ') || '—') : classLead.studentName || '—'}
          fullWidth
        />
        {r.parentName && <InfoCell icon={<PersonIcon sx={{ fontSize: 15 }} />} label="Parent / Guardian" value={r.parentName} fullWidth />}
        {r.parentEmail && <InfoCell icon={<EmailIcon sx={{ fontSize: 15 }} />} label="Email" value={r.parentEmail} fullWidth />}
        {r.parentPhone && <InfoCell icon={<PhoneIcon sx={{ fontSize: 15 }} />} label="Phone" value={r.parentPhone} fullWidth />}
      </InfoGrid>
    </SectionCard>
  );

  const academicSection = (
    <SectionCard animDelay={isMobile ? 140 : 0}>
      <SectionHeader icon={<SchoolIcon sx={{ fontSize: 16 }} />} title="Academic Details" />
      <InfoGrid>
        <InfoCell icon={<SchoolIcon sx={{ fontSize: 15 }} />} label="Board" value={classLead.board} />
        <InfoCell icon={<ClassIcon sx={{ fontSize: 15 }} />} label="Grade" value={classLead.grade} />
        {r.preferredTutorGender && (
          <InfoCell
            icon={<PersonIcon sx={{ fontSize: 15 }} />}
            label="Preferred Tutor"
            value={r.preferredTutorGender === 'MALE' ? 'Male' : r.preferredTutorGender === 'FEMALE' ? 'Female' : r.preferredTutorGender === 'NO_PREFERENCE' ? 'No preference' : r.preferredTutorGender}
          />
        )}
        <InfoCell
          icon={<ClassIcon sx={{ fontSize: 15 }} />}
          label="Subjects"
          fullWidth
          chip={
            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.25}>
              {subjectList.map((s: string) => (
                <Chip key={s} label={s} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', borderRadius: '7px', bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', border: 'none' }} />
              ))}
            </Box>
          }
        />
      </InfoGrid>
    </SectionCard>
  );

  const scheduleSection = (
    <SectionCard animDelay={isMobile ? 200 : 0}>
      <SectionHeader icon={<AccessTimeIcon sx={{ fontSize: 16 }} />} title="Class Schedule" />
      <InfoGrid>
        <InfoCell icon={<ClassIcon sx={{ fontSize: 15 }} />} label="Mode" value={classLead.mode} />
        <InfoCell icon={<AccessTimeIcon sx={{ fontSize: 15 }} />} label="Timing" value={classLead.timing} />
        {r.classesPerMonth != null && <InfoCell icon={<CalendarMonthIcon sx={{ fontSize: 15 }} />} label="Classes / Month" value={r.classesPerMonth} />}
        {r.classDurationHours != null && <InfoCell icon={<TimerIcon sx={{ fontSize: 15 }} />} label="Duration" value={`${r.classDurationHours} hrs`} />}
        {classLead.mode === 'OFFLINE' && r.city && <InfoCell icon={<PlaceIcon sx={{ fontSize: 15 }} />} label="City" value={r.city} />}
        {classLead.mode === 'OFFLINE' && r.area && <InfoCell icon={<PlaceIcon sx={{ fontSize: 15 }} />} label="Area" value={r.area} />}
        {classLead.mode === 'OFFLINE' && r.address && <InfoCell icon={<PlaceIcon sx={{ fontSize: 15 }} />} label="Address" value={r.address} fullWidth />}
        {classLead.mode === 'HYBRID' && classLead.location && <InfoCell icon={<PlaceIcon sx={{ fontSize: 15 }} />} label="Location" value={classLead.location} fullWidth />}
      </InfoGrid>
    </SectionCard>
  );

  const financialsSection = r.studentType === 'SINGLE' && r.paymentAmount != null ? (
    <SectionCard animDelay={isMobile ? 260 : 0}>
      <SectionHeader icon={<CurrencyRupeeIcon sx={{ fontSize: 16 }} />} title="Financials" />
      <Box display="flex" flexWrap="wrap" gap={1.25}>
        {[
          { label: 'Student Fees', value: r.paymentAmount, color: '#6366f1' },
          ...(r.tutorFees != null ? [{ label: 'Tutor Payout', value: r.tutorFees, color: '#0ea5e9' }] : []),
          ...(r.tutorFees != null ? [{ label: 'Service Charge', value: (r.paymentAmount || 0) - (r.tutorFees || 0), color: '#10b981' }] : []),
        ].map(({ label, value, color }) => (
          <Box
            key={label}
            flex="1 1 120px"
            sx={{
              p: 1.5,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: alpha(color, 0.2),
              bgcolor: alpha(color, 0.05),
            }}
          >
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', mb: 0.25 }}>{label}</Typography>
            <Typography fontWeight={800} sx={{ fontSize: '1.1rem', color }}>{`₹${(value || 0).toLocaleString()}`}</Typography>
          </Box>
        ))}
      </Box>
    </SectionCard>
  ) : null;

  const groupStudentsSection = r.studentType === 'GROUP' ? (() => {
    const details = r.studentDetails?.length > 0 ? r.studentDetails : r.groupClass?.students;
    if (!details || details.length === 0) return null;
    const totalFees = details.reduce((s: number, x: any) => s + (x.fees || 0), 0);
    const totalTutor = details.reduce((s: number, x: any) => s + (x.tutorFees || 0), 0);
    return (
      <SectionCard animDelay={isMobile ? 260 : 0}>
        <SectionHeader icon={<GroupsIcon sx={{ fontSize: 16 }} />} title="Group Students" />
        <Box display="flex" flexDirection="column" gap={1}>
          {details.map((student: any, i: number) => {
            const sc = avatarColor(student.name || String(i));
            return (
              <Box
                key={i}
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  bgcolor: '#FAFAFA',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                }}
              >
                <Avatar sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: alpha(sc, 0.12), color: sc, fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>
                  {initials(student.name || String(i + 1))}
                </Avatar>
                <Box flex={1} minWidth={0}>
                  <Typography fontWeight={700} sx={{ fontSize: '0.82rem' }} noWrap>{student.name}</Typography>
                  <Box display="flex" gap={1.5}>
                    <Typography variant="caption" color="text.secondary">Fees: <strong style={{ color: '#6366f1' }}>₹{(student.fees || 0).toLocaleString()}</strong></Typography>
                    <Typography variant="caption" color="text.secondary">Tutor: <strong style={{ color: '#0ea5e9' }}>₹{(student.tutorFees || 0).toLocaleString()}</strong></Typography>
                    <Typography variant="caption" color="text.secondary">Net: <strong style={{ color: '#10b981' }}>₹{((student.fees || 0) - (student.tutorFees || 0)).toLocaleString()}</strong></Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
          {/* Totals */}
          <Box sx={{ mt: 0.5, p: 1.5, borderRadius: '12px', bgcolor: alpha('#6366f1', 0.04), border: '1px solid', borderColor: alpha('#6366f1', 0.1), display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {[{ l: 'Total Fees', v: totalFees, c: '#6366f1' }, { l: 'Tutor Payout', v: totalTutor, c: '#0ea5e9' }, { l: 'Service', v: totalFees - totalTutor, c: '#10b981' }].map(({ l, v, c }) => (
              <Box key={l}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>{l}</Typography>
                <Typography fontWeight={800} sx={{ fontSize: '1rem', color: c }}>₹{v.toLocaleString()}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </SectionCard>
    );
  })() : null;

  const notesSection = r.notes ? (
    <SectionCard animDelay={isMobile ? 300 : 0}>
      <SectionHeader icon={<NoteIcon sx={{ fontSize: 16 }} />} title="Notes" />
      <Typography sx={{ fontSize: '0.85rem', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{r.notes}</Typography>
    </SectionCard>
  ) : null;

  const internalNotesSection = (user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.COORDINATOR) && r.internalNotes ? (
    <SectionCard animDelay={isMobile ? 320 : 0}>
      <SectionHeader icon={<NoteIcon sx={{ fontSize: 16 }} />} title="Internal Notes" />
      <Typography sx={{ fontSize: '0.85rem', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{r.internalNotes}</Typography>
    </SectionCard>
  ) : null;

  const demoSection = demoDetailsToShow ? (
    <SectionCard animDelay={isMobile ? 280 : 0}>
      <SectionHeader icon={<ClassIcon sx={{ fontSize: 16 }} />} title="Demo Details" />
      <InfoGrid>
        <InfoCell
          icon={<ClassIcon sx={{ fontSize: 15 }} />}
          label="Status"
          chip={<Chip size="small" label={demoDetailsToShow.demoStatus} color="primary" variant="outlined" sx={{ fontWeight: 600, borderRadius: '7px', mt: 0.25, fontSize: '0.72rem' }} />}
        />
        {demoTutorToShow && <InfoCell icon={<PersonIcon sx={{ fontSize: 15 }} />} label="Tutor" value={demoTutorToShow.name || demoTutorToShow.fullName || 'Assigned'} />}
        {demoDetailsToShow.demoDate && <InfoCell icon={<CalendarMonthIcon sx={{ fontSize: 15 }} />} label="Date" value={new Date(demoDetailsToShow.demoDate).toLocaleDateString()} />}
        {demoDetailsToShow.demoTime && <InfoCell icon={<AccessTimeIcon sx={{ fontSize: 15 }} />} label="Time" value={demoDetailsToShow.demoTime} />}
        {(demoDetailsToShow as any).attendanceStatus && (
          <InfoCell
            icon={<CheckCircleIcon sx={{ fontSize: 15 }} />}
            label="Attendance"
            chip={
              <Chip size="small" label={(demoDetailsToShow as any).attendanceStatus}
                color={(demoDetailsToShow as any).attendanceStatus === 'PRESENT' ? 'success' : 'error'}
                sx={{ fontWeight: 600, borderRadius: '7px', mt: 0.25, fontSize: '0.72rem' }}
              />
            }
          />
        )}
        {(demoDetailsToShow as any).topicCovered && <InfoCell icon={<NoteIcon sx={{ fontSize: 15 }} />} label="Topic" value={(demoDetailsToShow as any).topicCovered} fullWidth />}
        {demoDetailsToShow.notes && <InfoCell icon={<NoteIcon sx={{ fontSize: 15 }} />} label="Notes" value={demoDetailsToShow.notes} fullWidth />}
        {demoDetailsToShow.feedback && <InfoCell icon={<NoteIcon sx={{ fontSize: 15 }} />} label="Feedback" value={demoDetailsToShow.feedback} fullWidth />}
      </InfoGrid>
      {canApproveOrRejectDemo && (
        <Box display="flex" gap={1.25} mt={2} pt={2} sx={{ borderTop: '1px solid #F1F5F9' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApproveDemo}
            startIcon={<CheckCircleIcon />}
            disableElevation
            sx={{ borderRadius: '10px', fontWeight: 700, flex: 1, '@media (hover: none)': { '&:active': { transform: 'scale(0.97)' } } }}
          >
            Approve &amp; Convert
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleRejectDemo}
            sx={{ borderRadius: '10px', fontWeight: 600, '@media (hover: none)': { '&:active': { transform: 'scale(0.97)' } } }}
          >
            Reject
          </Button>
        </Box>
      )}
    </SectionCard>
  ) : null;

  const timelineSection = (
    <SectionCard animDelay={isMobile ? 360 : 0}>
      <SectionHeader icon={<AccessTimeIcon sx={{ fontSize: 16 }} />} title="Status Timeline" />
      <StatusTimeline classLead={classLead} demoHistory={demoHistory} announcement={announcement} />
    </SectionCard>
  );

  // ── Sidebar actions (desktop) + mobile action list ────────────────────────
  const actionList = (
    <Box display="flex" flexDirection="column" gap={1}>
      <ActionBtn onClick={handleEdit} icon={<EditIcon />}>Edit Lead</ActionBtn>
      {classLead.status === CLASS_LEAD_STATUS.NEW && !announcement && (
        <ActionBtn onClick={() => setOpenAnnouncement(true)} icon={<AnnouncementIcon />} variant="contained" color="primary">
          Post Announcement
        </ActionBtn>
      )}
      {classLead.status === CLASS_LEAD_STATUS.REJECTED && (
        <ActionBtn onClick={() => setOpenAnnouncement(true)} icon={<AnnouncementIcon />} variant="contained" color="primary">
          Repost Lead
        </ActionBtn>
      )}
      <ActionBtn onClick={() => setOpenInterested(true)} icon={<GroupsIcon />} disabled={!announcement}>
        View Interested Tutors
      </ActionBtn>
      {(classLead.status === CLASS_LEAD_STATUS.CONVERTED || (classLead as any).status === 'WON') && !(classLead as any).paymentReceived && (
        <ActionBtn onClick={handleMarkPaymentReceived} icon={<CheckCircleIcon />} variant="contained" color="success">
          Mark Payment Received
        </ActionBtn>
      )}
      {isAdmin && (
        <ActionBtn onClick={handleReassignOpen} icon={<SwapHorizIcon />} color="secondary">
          Reassign Manager
        </ActionBtn>
      )}
    </Box>
  );

  const shareList = (
    <Box display="flex" flexDirection="column" gap={1}>
      <ActionBtn
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildShareText())}`, '_blank')}
        icon={<WhatsAppIcon />}
        variant="contained"
        color="success"
      >
        Share on WhatsApp
      </ActionBtn>
      <ActionBtn
        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/leads/public/${id}`); setSnack({ open: true, message: 'Link copied!', severity: 'info' }); }}
        icon={<ContentCopyIcon />}
      >
        Copy Public Link
      </ActionBtn>
    </Box>
  );

  return (
    <>
      {/* ── Mobile sticky header ────────────────────────────────────────── */}
      {isMobile && (
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            bgcolor: alpha('#fff', 0.92),
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 1px 0 rgba(15,23,42,0.06)',
            px: 1.5,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '@keyframes hdrIn': { from: { opacity: 0, transform: 'translateY(-100%)' }, to: { opacity: 1, transform: 'none' } },
            animation: 'hdrIn 300ms cubic-bezier(0.32,0.72,0,1) forwards',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <IconButton
            onClick={() => navigate('/class-leads')}
            size="small"
            sx={{ bgcolor: '#F1F5F9', borderRadius: '9px', flexShrink: 0, '&:active': { transform: 'scale(0.93)' } }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Box flex={1} minWidth={0}>
            <Typography fontWeight={800} noWrap sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
              {classLead.studentName}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1 }}>
              {[classLead.grade, classLead.board, classLead.mode].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          <ClassLeadStatusChip status={classLead.status} />
          {!!(classLead as any).paymentReceived && (
            <Chip icon={<CheckCircleIcon sx={{ fontSize: '12px !important' }} />} label="Paid" color="success" size="small" sx={{ fontWeight: 700, borderRadius: '7px', height: 22, fontSize: '0.65rem' }} />
          )}
          <IconButton size="small" onClick={handleMenuOpen} sx={{ bgcolor: '#F1F5F9', borderRadius: '9px', '&:active': { transform: 'scale(0.93)' } }}>
            <MoreVertIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}

      {/* ── Mobile hero ─────────────────────────────────────────────────── */}
      {isMobile && (
        <Box
          sx={{
            background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
            px: 2.5,
            pt: 2.5,
            pb: 3,
            position: 'relative',
            overflow: 'hidden',
            '@keyframes heroIn': {
              from: { opacity: 0, transform: 'translateY(10px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
            animation: 'heroIn 400ms cubic-bezier(0.23,1,0.32,1) 60ms both',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5} mb={1.5} sx={{ position: 'relative', zIndex: 1 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                borderRadius: '13px',
                bgcolor: alpha(ac, 0.25),
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.1rem',
                border: '2px solid rgba(255,255,255,0.2)',
                flexShrink: 0,
              }}
            >
              {initials(classLead.studentName || '?')}
            </Avatar>
            <Box>
              <Typography fontWeight={800} sx={{ color: '#fff', fontSize: '1.15rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                {classLead.studentName}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', mt: 0.25 }}>
                Created by {(classLead.createdBy as any)?.name || 'Unknown'}
              </Typography>
            </Box>
          </Box>

          {/* Quick-share row */}
          <Box display="flex" gap={1} sx={{ position: 'relative', zIndex: 1 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<WhatsAppIcon sx={{ fontSize: '16px !important' }} />}
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildShareText())}`, '_blank')}
              sx={{
                bgcolor: '#25D366', color: '#fff', borderRadius: '9px', fontWeight: 700, fontSize: '0.75rem',
                boxShadow: 'none', py: 0.75, '&:active': { transform: 'scale(0.97)' },
                '&:hover': { bgcolor: '#22c55e' },
              }}
            >
              Share
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon sx={{ fontSize: '14px !important' }} />}
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/leads/public/${id}`); setSnack({ open: true, message: 'Link copied!', severity: 'info' }); }}
              sx={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', borderRadius: '9px', fontWeight: 700, fontSize: '0.75rem', py: 0.75, '&:active': { transform: 'scale(0.97)' } }}
            >
              Copy Link
            </Button>
          </Box>

          {/* Orbs */}
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        </Box>
      )}

      {/* ── Desktop page header ──────────────────────────────────────────── */}
      {!isMobile && (
        <Container maxWidth="lg" sx={{ pt: 4 }}>
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            mb={3}
            pb={2.5}
            sx={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <IconButton
              onClick={() => navigate('/class-leads')}
              sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', '&:hover': { bgcolor: '#F1F5F9' }, '&:active': { transform: 'scale(0.95)' } }}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box flex={1} minWidth={0}>
              <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                <Typography variant="h5" fontWeight={800} sx={{ fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                  {classLead.studentName || 'Class Lead'}
                </Typography>
                <ClassLeadStatusChip status={classLead.status} />
                {!!(classLead as any).paymentReceived && (
                  <Chip icon={<CheckCircleIcon />} label="Paid" color="success" size="small" sx={{ fontWeight: 700, borderRadius: '8px' }} />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {classLead.grade} · {classLead.board} · {classLead.mode}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button variant="outlined" size="small" startIcon={<EditIcon sx={{ fontSize: 15 }} />} onClick={handleEdit} sx={{ borderRadius: '9px', fontWeight: 600 }}>
                Edit
              </Button>
              <IconButton onClick={handleMenuOpen} sx={{ border: '1px solid #E2E8F0', borderRadius: '9px', '&:active': { transform: 'scale(0.95)' } }}>
                <MoreVertIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>
        </Container>
      )}

      {/* ── Overflow menu ───────────────────────────────────────────────── */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 200, border: '1px solid #F1F5F9' } }}
      >
        <MenuItemMui onClick={handleEdit} sx={{ gap: 1.5, py: 1.25, borderRadius: '8px', mx: 0.5 }}>
          <EditIcon fontSize="small" sx={{ color: '#64748b' }} />
          <Typography variant="body2" fontWeight={600}>Edit Lead</Typography>
        </MenuItemMui>
        {classLead.status === CLASS_LEAD_STATUS.NEW && !announcement && (
          <MenuItemMui onClick={handlePostAnnouncement} sx={{ gap: 1.5, py: 1.25, borderRadius: '8px', mx: 0.5 }}>
            <AnnouncementIcon fontSize="small" sx={{ color: '#64748b' }} />
            <Typography variant="body2" fontWeight={600}>Post Announcement</Typography>
          </MenuItemMui>
        )}
        {classLead.status === CLASS_LEAD_STATUS.REJECTED && (
          <MenuItemMui onClick={handlePostAnnouncement} sx={{ gap: 1.5, py: 1.25, borderRadius: '8px', mx: 0.5 }}>
            <AnnouncementIcon fontSize="small" sx={{ color: '#64748b' }} />
            <Typography variant="body2" fontWeight={600}>Repost Lead</Typography>
          </MenuItemMui>
        )}
        {(classLead.status === CLASS_LEAD_STATUS.ANNOUNCED || announcement) && (
          <MenuItemMui onClick={handleViewInterestedTutors} sx={{ gap: 1.5, py: 1.25, borderRadius: '8px', mx: 0.5 }}>
            <GroupsIcon fontSize="small" sx={{ color: '#64748b' }} />
            <Typography variant="body2" fontWeight={600}>Interested Tutors</Typography>
          </MenuItemMui>
        )}
        {isAdmin && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <MenuItemMui onClick={handleReassignOpen} sx={{ gap: 1.5, py: 1.25, borderRadius: '8px', mx: 0.5 }}>
              <SwapHorizIcon fontSize="small" sx={{ color: '#64748b' }} />
              <Typography variant="body2" fontWeight={600}>Reassign Manager</Typography>
            </MenuItemMui>
          </>
        )}
        <Divider sx={{ my: 0.5 }} />
        <MenuItemMui onClick={handleDelete} sx={{ gap: 1.5, py: 1.25, borderRadius: '8px', mx: 0.5, color: '#ef4444' }}>
          <DeleteIcon fontSize="small" />
          <Typography variant="body2" fontWeight={600}>Delete Lead</Typography>
        </MenuItemMui>
      </Menu>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, pb: isMobile && primaryAction ? '96px' : undefined }}>
        {isMobile ? (
          // Mobile: single column, all sections stacked
          <Box display="flex" flexDirection="column" gap={1.5}>
            {studentInfoSection}
            {academicSection}
            {scheduleSection}
            {financialsSection}
            {groupStudentsSection}
            {demoSection}
            {notesSection}
            {internalNotesSection}
            {timelineSection}

            {/* Share + Actions as sections on mobile */}
            <SectionCard animDelay={380}>
              <SectionHeader icon={<AnnouncementIcon sx={{ fontSize: 16 }} />} title="Actions" />
              {actionList}
            </SectionCard>

            <SectionCard animDelay={420}>
              <SectionHeader icon={<WhatsAppIcon sx={{ fontSize: 16 }} />} title="Share Lead" />
              {shareList}
            </SectionCard>

            {/* Danger zone */}
            <SectionCard animDelay={460} sx={{ borderColor: alpha('#ef4444', 0.2) }}>
              <Typography fontWeight={700} sx={{ fontSize: '0.78rem', color: '#ef4444', mb: 1.25, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Danger Zone
              </Typography>
              <ActionBtn onClick={handleDelete} icon={<DeleteIcon />} color="error">
                Delete Lead
              </ActionBtn>
            </SectionCard>
          </Box>
        ) : (
          // Desktop: 8 + 4 grid
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box display="flex" flexDirection="column" gap={3}>
                {studentInfoSection}
                {academicSection}
                {scheduleSection}
                {financialsSection}
                {groupStudentsSection}
                {notesSection}
                {internalNotesSection}
                {demoSection}
                {timelineSection}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" flexDirection="column" gap={3} sx={{ position: 'sticky', top: 80 }}>
                <SectionCard>
                  <Typography fontWeight={800} sx={{ mb: 2, fontSize: '0.95rem' }}>Quick Actions</Typography>
                  {actionList}
                </SectionCard>
                <SectionCard>
                  <Typography fontWeight={800} sx={{ mb: 2, fontSize: '0.95rem' }}>Share Lead</Typography>
                  {shareList}
                </SectionCard>
                <SectionCard sx={{ borderColor: alpha('#ef4444', 0.2) }}>
                  <Typography fontWeight={700} sx={{ fontSize: '0.78rem', color: '#ef4444', mb: 1.25, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Danger Zone</Typography>
                  <ActionBtn onClick={handleDelete} icon={<DeleteIcon />} color="error">Delete Lead</ActionBtn>
                </SectionCard>
              </Box>
            </Grid>
          </Grid>
        )}
      </Container>

      {/* ── Mobile sticky primary CTA bar ───────────────────────────────── */}
      {isMobile && primaryAction && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            px: 2,
            pt: 1.25,
            pb: `calc(1.25rem + env(safe-area-inset-bottom))`,
            bgcolor: alpha('#fff', 0.92),
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 -1px 0 rgba(15,23,42,0.06), 0 -8px 24px rgba(15,23,42,0.06)',
            '@keyframes barIn': { from: { opacity: 0, transform: 'translateY(100%)' }, to: { opacity: 1, transform: 'none' } },
            animation: 'barIn 360ms cubic-bezier(0.32,0.72,0,1) 200ms both',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
          }}
        >
          <Button
            variant={primaryAction.variant}
            color={primaryAction.color}
            startIcon={primaryAction.icon}
            onClick={primaryAction.onClick}
            fullWidth
            disableElevation
            sx={{
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              py: 1.375,
              boxShadow: primaryAction.variant === 'contained' ? `0 4px 14px ${alpha(primaryAction.color === 'success' ? '#10b981' : '#6366f1', 0.35)}` : undefined,
              transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)',
              '@media (hover: none)': { '&:active': { transform: 'scale(0.97)' } },
            }}
          >
            {primaryAction.label}
          </Button>
        </Box>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}

      {/* Reassign manager */}
      <Dialog open={reassignOpen} onClose={() => setReassignOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Reassign Manager</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Select a new manager for <strong>{classLead?.studentName}</strong>:
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Target Manager</InputLabel>
            <Select value={selectedManagerId} label="Target Manager" onChange={(e) => setSelectedManagerId(e.target.value)}>
              {managers.map((mgr) => <MenuItem key={mgr.id} value={mgr.id}>{mgr.name}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setReassignOpen(false)} sx={{ borderRadius: '9px', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={reassigning || !selectedManagerId}
            onClick={handleReassignSubmit}
            disableElevation
            sx={{ borderRadius: '9px', fontWeight: 700 }}
          >
            {reassigning ? 'Reassigning…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve demo with coordinator */}
      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Approve Demo &amp; Convert</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Select a coordinator to manage this class:
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Assign Coordinator</InputLabel>
            <Select value={selectedCoordinatorId} label="Assign Coordinator" onChange={(e) => setSelectedCoordinatorId(e.target.value)}>
              {coordinators.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setApproveOpen(false)} disabled={approvingDemo} sx={{ borderRadius: '9px', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={approvingDemo || !selectedCoordinatorId}
            onClick={handleApproveDemoConfirm}
            disableElevation
            sx={{ borderRadius: '9px', fontWeight: 700 }}
          >
            {approvingDemo ? 'Processing…' : 'Approve & Convert'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modals */}
      <AnnouncementModal open={openAnnouncement} onClose={() => setOpenAnnouncement(false)} classLead={classLead} onSuccess={refetchAll} />
      <InterestedTutorsModal open={openInterested} onClose={() => setOpenInterested(false)} announcementId={announcement?.id || ''} onSelectTutor={handleSelectTutor} />
      {selectedTutor && (
        <DemoAssignmentModal open={openDemoAssign} onClose={() => setOpenDemoAssign(false)} classLead={classLead} selectedTutor={selectedTutor} onSuccess={handleDemoAssignSuccess} />
      )}

      <SnackbarNotification open={snack.open} message={snack.message} severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} />
      <ErrorDialog open={showError} onClose={clearError} error={dialogError} title="Demo Update Error" />
    </>
  );
}
