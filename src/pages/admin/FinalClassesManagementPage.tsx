import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  Paper,
  Stack,
  Divider,
  CircularProgress,
  Link,
  InputAdornment,
  MenuItem,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ErrorAlert from '../../components/common/ErrorAlert';
import SnackbarNotification from '../../components/common/SnackbarNotification';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import GroupStudentsModal from '../../components/classLeads/GroupStudentsModal';
import finalClassService from '../../services/finalClassService';
import { IFinalClass } from '../../types';
import { FINAL_CLASS_STATUS } from '../../constants';
import TutorSelectionModal from '../../components/common/TutorSelectionModal';
import { changeTutor, recordTutorLeaving, repostAsLead } from '../../services/finalClassService';
import ClassPlanModal from '../../components/classes/ClassPlanModal';

// ─── Design tokens ────────────────────────────────────────────────────────────
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const T = `all 150ms ${EASE}`;

// ─── Avatar colour ────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#2D68C4', '#0E7490', '#059669', '#7C3AED', '#D97706', '#E11D48'];
const avatarColor = (name = '') =>
  AVATAR_COLORS[(name.charCodeAt(0) || 65) % AVATAR_COLORS.length];
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// ─── Status pill ─────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { bg: string; color: string; dot: string }> = {
  [FINAL_CLASS_STATUS.ACTIVE]:    { bg: '#DCFCE7', color: '#15803D', dot: '#16A34A' },
  [FINAL_CLASS_STATUS.PAUSED]:    { bg: '#FEF9C3', color: '#A16207', dot: '#CA8A04' },
  [FINAL_CLASS_STATUS.COMPLETED]: { bg: '#DBEAFE', color: '#1D4ED8', dot: '#3B82F6' },
  [FINAL_CLASS_STATUS.CANCELLED]: { bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' },
};
const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const m = STATUS_META[status] || { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' };
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', px: 1.25, py: 0.4, borderRadius: '6px', fontSize: 11, fontWeight: 700, letterSpacing: 0.3, bgcolor: m.bg, color: m.color }}>
      <Box component="span" sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: m.dot }} />
      {status}
    </Box>
  );
};

// ─── Inline progress bar ──────────────────────────────────────────────────────
const ProgressBar: React.FC<{ pct: number; sessions: number; total: number }> = ({ pct, sessions, total }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.4 }}>
    <Typography sx={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}>
      {sessions}/{total}
    </Typography>
    <Box sx={{ width: 64, height: 4, bgcolor: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
      <Box sx={{ width: `${Math.min(100, pct)}%`, height: '100%', bgcolor: pct >= 100 ? '#16A34A' : '#2D68C4', borderRadius: 99, transition: 'width 0.4s ease' }} />
    </Box>
    <Typography sx={{ fontSize: 10, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>{Math.round(pct)}%</Typography>
  </Box>
);

// ─── Subject formatter ────────────────────────────────────────────────────────
const formatSubject = (subject: any) =>
  Array.isArray(subject)
    ? subject.map((s: any) => (typeof s === 'object' ? s.label : String(s))).join(', ')
    : String(subject || '-');

// ─── All status tabs ──────────────────────────────────────────────────────────
const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: FINAL_CLASS_STATUS.ACTIVE },
  { label: 'Paused', value: FINAL_CLASS_STATUS.PAUSED },
  { label: 'Completed', value: FINAL_CLASS_STATUS.COMPLETED },
  { label: 'Cancelled', value: FINAL_CLASS_STATUS.CANCELLED },
];

// ─── Main page ────────────────────────────────────────────────────────────────
const FinalClassesManagementPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [classes, setClasses] = useState<IFinalClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [coordinatorFilter, setCoordinatorFilter] = useState(searchParams.get('coordinator') || 'all');

  const [selectedClass, setSelectedClass] = useState<IFinalClass | null>(null);
  const [windowValue, setWindowValue] = useState(2);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [selectedLeadStudents, setSelectedLeadStudents] = useState<any[]>([]);
  const [selectedLeadName, setSelectedLeadName] = useState('');
  const [tutorModalOpen, setTutorModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean; title: string; message: string; action: () => Promise<void> | void; severity?: 'warning' | 'error' | 'info';
  }>({ open: false, title: '', message: '', action: () => {} });

  const debouncedSearch = useMemo(() => {
    let timer: any;
    return (q: string) => { clearTimeout(timer); timer = setTimeout(() => setSearchQuery(q), 500); };
  }, []);

  const loadClasses = useCallback(async (p = page, l = rowsPerPage) => {
    setLoading(true);
    try {
      const res = await finalClassService.getFinalClasses(p + 1, l, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
        noCoordinator: coordinatorFilter === 'unassigned',
      });
      setClasses(res.data);
      setTotal(res.pagination.total);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, searchQuery, coordinatorFilter]);

  useEffect(() => { loadClasses(0, rowsPerPage); }, []);
  useEffect(() => { setPage(0); loadClasses(0, rowsPerPage); }, [statusFilter, searchQuery, rowsPerPage, coordinatorFilter]);

  const totalPages = Math.ceil(total / rowsPerPage) || 1;

  // KPIs
  const activeCount = useMemo(() => classes.filter((c) => c.status === FINAL_CLASS_STATUS.ACTIVE).length, [classes]);
  const avgProgress = useMemo(() =>
    classes.length ? Math.round(classes.reduce((s, c) => s + (c.progressPercentage || 0), 0) / classes.length) : 0,
    [classes]);
  const unassignedCount = useMemo(() => classes.filter((c) => !c.coordinator).length, [classes]);

  // Handlers
  const handleEditClick = (cls: IFinalClass) => {
    setSelectedClass(cls);
    setWindowValue(cls.attendanceSubmissionWindow ?? 2);
    setIsModalOpen(true);
  };

  const handleStudentNameClick = useCallback((row: any) => {
    const classLead = row.classLead || {};
    const studentType = classLead.studentType || row.studentType;
    if (studentType === 'GROUP') {
      setSelectedLeadStudents(classLead.associatedStudents || classLead.studentDetails || row.associatedStudents || row.studentDetails || []);
      setSelectedLeadName(row.studentName || classLead.studentName || 'Group Lead');
      setGroupModalOpen(true);
    } else {
      const studentId = classLead.associatedStudents?.[0]?.studentId || classLead.studentId || row.associatedStudents?.[0]?.studentId || row.studentId;
      if (studentId) navigate(`/admin/student-profile/${studentId}`);
      else setNotification({ message: 'No student profile linked to this record', severity: 'info' });
    }
  }, [navigate]);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedClass) return;
    const isPause = newStatus === FINAL_CLASS_STATUS.PAUSED;
    setConfirmConfig({
      open: true,
      title: isPause ? 'Pause Class' : 'Resume Class',
      message: `${isPause ? 'Pause' : 'Resume'} ${selectedClass.className}?`,
      severity: isPause ? 'warning' : 'info',
      action: async () => {
        setActionLoading(true);
        try {
          await finalClassService.updateClassStatus(selectedClass.id, newStatus);
          setNotification({ message: `Class ${newStatus.toLowerCase()}`, severity: 'success' });
          setIsModalOpen(false); loadClasses();
          setConfirmConfig((p) => ({ ...p, open: false }));
        } catch (e: any) {
          setNotification({ message: e?.response?.data?.error || 'Failed to update status', severity: 'error' });
        } finally { setActionLoading(false); }
      },
    });
  };

  const handleChangeTutor = async (newTutorId: string, tutorName: string) => {
    if (!selectedClass) return;
    setConfirmConfig({
      open: true, title: 'Change Tutor', severity: 'info',
      message: `Change tutor to ${tutorName} for ${selectedClass.className}?`,
      action: async () => {
        const reason = window.prompt(`Reason for changing tutor to ${tutorName}:`);
        if (reason === null) return;
        try {
          setActionLoading(true);
          await changeTutor(selectedClass.id, newTutorId, reason);
          setTutorModalOpen(false);
          setNotification({ message: 'Tutor changed', severity: 'success' });
          loadClasses(); setIsModalOpen(false);
          setConfirmConfig((p) => ({ ...p, open: false }));
        } catch (e: any) {
          setNotification({ message: e?.response?.data?.message || 'Failed to change tutor', severity: 'error' });
        } finally { setActionLoading(false); }
      },
    });
  };

  const handleTutorLeavingAction = async () => {
    if (!selectedClass) return;
    setConfirmConfig({
      open: true, title: 'Tutor Left', severity: 'warning',
      message: `Mark current tutor as LEFT for ${selectedClass.className}?`,
      action: async () => {
        const reason = window.prompt('Reason for tutor leaving:');
        if (reason === null) return;
        try {
          setActionLoading(true);
          await recordTutorLeaving(selectedClass.id, reason);
          setNotification({ message: 'Tutor departure recorded', severity: 'success' });
          loadClasses(); setIsModalOpen(false);
          setConfirmConfig((p) => ({ ...p, open: false }));
        } catch (e: any) {
          setNotification({ message: e?.response?.data?.message || 'Failed to record tutor leaving', severity: 'error' });
        } finally { setActionLoading(false); }
      },
    });
  };

  const handleRepostAction = async () => {
    if (!selectedClass) return;
    setConfirmConfig({
      open: true, title: 'Repost as Lead', severity: 'info',
      message: `Repost ${selectedClass.className} as a new lead?`,
      action: async () => {
        try {
          setActionLoading(true);
          await repostAsLead(selectedClass.id);
          setNotification({ message: 'Class reposted as lead', severity: 'success' });
          setConfirmConfig((p) => ({ ...p, open: false }));
        } catch (e: any) {
          setNotification({ message: e?.response?.data?.message || 'Failed to repost lead', severity: 'error' });
        } finally { setActionLoading(false); }
      },
    });
  };

  const handleRenewMonthlyClass = async () => {
    if (!selectedClass) return;
    setConfirmConfig({
      open: true, title: 'Renew Monthly Class', severity: 'warning',
      message: `Renew ${selectedClass.className} for the next cycle? Progress resets to 0.`,
      action: async () => {
        setActionLoading(true);
        try {
          await finalClassService.updateClassProgress(selectedClass.id, 0);
          setNotification({ message: 'Class renewed', severity: 'success' });
          setIsModalOpen(false); loadClasses();
          setConfirmConfig((p) => ({ ...p, open: false }));
        } catch (e: any) {
          setNotification({ message: e?.response?.data?.error || 'Failed to renew class', severity: 'error' });
        } finally { setActionLoading(false); }
      },
    });
  };

  const handleDownloadAttendance = async () => {
    if (!selectedClass) return;
    setActionLoading(true);
    try {
      await finalClassService.downloadAttendancePdf(selectedClass.id);
      setNotification({ message: 'Attendance sheet downloaded', severity: 'success' });
    } catch {
      setNotification({ message: 'No attendance records found', severity: 'error' });
    } finally { setActionLoading(false); }
  };

  const handleUpdateWindow = async () => {
    if (!selectedClass) return;
    setActionLoading(true);
    try {
      await finalClassService.updateAttendanceSubmissionWindow(selectedClass.id, windowValue);
      setNotification({ message: 'Submission window updated', severity: 'success' });
      setIsModalOpen(false); loadClasses();
    } catch (e: any) {
      setNotification({ message: e?.response?.data?.error || 'Failed to update window', severity: 'error' });
    } finally { setActionLoading(false); }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#1C3556', px: { xs: 2.5, md: 4 }, pt: { xs: 3, md: 3.5 }, pb: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 800, letterSpacing: -0.6, color: '#fff', lineHeight: 1.15 }}>
              Final Classes
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', mt: 0.4, fontWeight: 500 }}>
              Monitor ongoing classes, track progress and manage assignments
            </Typography>
          </Box>
        </Box>

        {/* KPI strip */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' } }}>
          {[
            { label: 'Total', value: loading ? '-' : total, sub: 'classes' },
            { label: 'Active', value: loading ? '-' : activeCount, sub: `of ${classes.length} loaded` },
            { label: 'Avg Progress', value: loading ? '-' : `${avgProgress}%`, sub: 'session completion' },
            { label: 'No Coordinator', value: loading ? '-' : unassignedCount, sub: 'need assignment' },
          ].map((kpi, i) => (
            <Box
              key={kpi.label}
              sx={{
                px: { xs: 2, md: 2.5 }, py: 1.75,
                borderTop: '1px solid rgba(255,255,255,0.07)',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                '&:nth-of-type(3)': { borderLeft: { xs: '1px solid rgba(255,255,255,0.07)', sm: '1px solid rgba(255,255,255,0.07)' } },
                cursor: kpi.label === 'No Coordinator' && unassignedCount > 0 ? 'pointer' : 'default',
              }}
              onClick={() => {
                if (kpi.label === 'No Coordinator' && unassignedCount > 0)
                  setCoordinatorFilter(coordinatorFilter === 'unassigned' ? 'all' : 'unassigned');
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', mb: 0.5 }}>
                {kpi.label}
              </Typography>
              <Typography sx={{
                fontSize: { xs: 22, md: 26 }, fontWeight: 800, color: kpi.label === 'No Coordinator' && unassignedCount > 0 ? '#FCD34D' : '#fff',
                letterSpacing: -0.5, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              }}>
                {kpi.value}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', mt: 0.35, fontWeight: 500 }}>
                {kpi.label === 'No Coordinator' && unassignedCount > 0 ? 'click to filter' : kpi.sub}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Content area ────────────────────────────────────────────────────── */}
      <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2.5, md: 3 } }}>

        {error && <Box mb={2.5}><ErrorAlert error={error} /></Box>}

        {/* ── Status pill tabs ──────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <Box
                key={tab.value}
                component="button"
                onClick={() => setStatusFilter(tab.value)}
                sx={{
                  px: 1.75, py: 0.6, border: 'none', cursor: 'pointer', borderRadius: '8px', fontSize: 12, fontWeight: 700,
                  transition: T,
                  bgcolor: active ? '#1C3556' : '#F1F5F9',
                  color: active ? '#fff' : '#64748B',
                  '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': { bgcolor: active ? '#1C3556' : '#E2E8F0' },
                  },
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                {tab.label}
              </Box>
            );
          })}
        </Box>

        {/* ── Filter bar ────────────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mb: 2.5, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search student, class or subject..."
            onChange={(e) => debouncedSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: '1 1 220px', maxWidth: 340,
              '& .MuiOutlinedInput-root': {
                borderRadius: '9px', fontSize: 13, bgcolor: '#fff', transition: T,
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#94A3B8' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1.5 },
              },
            }}
          />

          <TextField
            select size="small"
            value={coordinatorFilter}
            onChange={(e) => setCoordinatorFilter(e.target.value)}
            sx={{
              minWidth: 160,
              '& .MuiOutlinedInput-root': {
                borderRadius: '9px', fontSize: 13, bgcolor: '#fff',
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#94A3B8' },
              },
            }}
          >
            <MenuItem value="all">All coordinators</MenuItem>
            <MenuItem value="unassigned">Unassigned only</MenuItem>
          </TextField>

          {(searchQuery || coordinatorFilter !== 'all') && (
            <Button
              size="small" variant="text"
              onClick={() => { setSearchQuery(''); setCoordinatorFilter('all'); }}
              sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 500, px: 1.5, borderRadius: '8px', transition: T, '&:hover': { bgcolor: '#F1F5F9', color: 'text.primary' } }}
            >
              Clear
            </Button>
          )}
        </Box>

        {/* ── Desktop table ─────────────────────────────────────────────────── */}
        {!isMobile ? (
          <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 820 }}>
                <TableHead>
                  <TableRow sx={{
                    bgcolor: '#F8FAFC',
                    '& .MuiTableCell-root': { color: '#64748B', fontWeight: 700, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', py: 1.25, borderBottom: '1px solid #E2E8F0' },
                  }}>
                    <TableCell>Class</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Subject / Grade</TableCell>
                    <TableCell>Tutor</TableCell>
                    <TableCell>Coordinator</TableCell>
                    <TableCell align="right">Progress</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right" sx={{ pr: 2 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                        <CircularProgress size={22} thickness={4} />
                      </TableCell>
                    </TableRow>
                  ) : classes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled', fontSize: 14 }}>
                        No classes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    classes.map((cls) => (
                      <TableRow
                        key={cls.id}
                        sx={{
                          transition: T,
                          '& .MuiTableCell-root': { py: 1.25, borderBottom: '1px solid #F1F5F9', fontSize: 13 },
                          '@media (hover: hover) and (pointer: fine)': { '&:hover': { bgcolor: '#F8FAFC' } },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cls.className}
                        </TableCell>

                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.25}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 10, fontWeight: 700, bgcolor: avatarColor(cls.studentName), flexShrink: 0 }}>
                              {initials(cls.studentName)}
                            </Avatar>
                            <Typography
                              sx={{ fontSize: 13, fontWeight: 600, color: 'primary.main', cursor: 'pointer', transition: T, '@media (hover: hover) and (pointer: fine)': { '&:hover': { textDecoration: 'underline' } } }}
                              onClick={() => handleStudentNameClick(cls)}
                            >
                              {cls.studentName}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontSize: 13, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {formatSubject(cls.subject)}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>{cls.grade}</Typography>
                        </TableCell>

                        <TableCell>
                          {cls.tutor ? (
                            <Link component={RouterLink} to={`/tutor-profile/${(cls.tutor as any).id || (cls.tutor as any)._id}`}
                              sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', textDecoration: 'none', transition: T, '@media (hover: hover) and (pointer: fine)': { '&:hover': { color: 'primary.main' } } }}>
                              {(cls.tutor as any).name || 'Unknown'}
                            </Link>
                          ) : <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>-</Typography>}
                        </TableCell>

                        <TableCell>
                          {cls.coordinator ? (
                            <Link component={RouterLink} to={`/coordinator-profile/${(cls.coordinator as any).id || (cls.coordinator as any)._id}`}
                              sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', textDecoration: 'none', transition: T, '@media (hover: hover) and (pointer: fine)': { '&:hover': { color: 'primary.main' } } }}>
                              {(cls.coordinator as any).name || 'Unknown'}
                            </Link>
                          ) : (
                            <Box component="span" sx={{ fontSize: 11, fontWeight: 600, px: 1.25, py: 0.4, borderRadius: '6px', bgcolor: '#FEF9C3', color: '#A16207' }}>
                              Unassigned
                            </Box>
                          )}
                        </TableCell>

                        <TableCell align="right">
                          <ProgressBar
                            pct={cls.progressPercentage || 0}
                            sessions={cls.completedSessions || 0}
                            total={cls.classesPerMonth || cls.totalSessions || 0}
                          />
                        </TableCell>

                        <TableCell><StatusPill status={cls.status} /></TableCell>

                        <TableCell align="right" sx={{ pr: 1.5 }}>
                          <Tooltip title="Manage class">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(cls)}
                              sx={{
                                color: 'text.secondary', borderRadius: '8px', transition: T,
                                '@media (hover: hover) and (pointer: fine)': { '&:hover': { color: 'primary.main', bgcolor: '#EFF6FF' } },
                                '&:active': { transform: 'scale(0.9)' },
                              }}
                            >
                              <EditIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_e, p) => { setPage(p); loadClasses(p, rowsPerPage); }}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { const v = parseInt(e.target.value, 10); setRowsPerPage(v); setPage(0); loadClasses(0, v); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                borderTop: '1px solid #F1F5F9',
                '& .MuiTablePagination-toolbar': { fontSize: 13 },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: 13, color: 'text.secondary' },
              }}
            />
          </Paper>
        ) : (
          /* ── Mobile cards ─────────────────────────────────────────────────── */
          <Stack spacing={1.5}>
            {loading ? (
              <Box textAlign="center" py={5}><CircularProgress size={22} thickness={4} /></Box>
            ) : classes.length === 0 ? (
              <Box textAlign="center" py={6}><Typography color="text.disabled" fontSize={14}>No classes found</Typography></Box>
            ) : (
              classes.map((cls) => (
                <Paper key={cls.id} elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', px: 2, pt: 2, pb: 1.5, gap: 1 }}>
                    <Box minWidth={0}>
                      <Typography fontWeight={700} fontSize={14} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.className}</Typography>
                      <Typography
                        sx={{ fontSize: 12, color: 'primary.main', cursor: 'pointer', mt: 0.25, fontWeight: 500 }}
                        onClick={() => handleStudentNameClick(cls)}
                      >
                        {cls.studentName}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.75} flexShrink={0}>
                      <StatusPill status={cls.status} />
                      <IconButton size="small" onClick={() => handleEditClick(cls)}
                        sx={{ borderRadius: '8px', color: 'text.secondary', transition: T, '&:active': { transform: 'scale(0.9)', color: 'primary.main' } }}>
                        <EditIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: '#F1F5F9' }} />

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', px: 2, py: 1.5, gap: 1.5 }}>
                    <Box>
                      <Typography sx={{ fontSize: 10, color: 'text.disabled', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', mb: 0.25 }}>Subject</Typography>
                      <Typography fontSize={12} fontWeight={500}>{formatSubject(cls.subject)}</Typography>
                      <Typography fontSize={11} color="text.disabled">{cls.grade}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 10, color: 'text.disabled', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', mb: 0.25 }}>Progress</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {cls.completedSessions}/{cls.classesPerMonth || cls.totalSessions}
                      </Typography>
                      <Box sx={{ width: '100%', height: 4, bgcolor: '#E2E8F0', borderRadius: 99, mt: 0.5, overflow: 'hidden' }}>
                        <Box sx={{ width: `${Math.min(100, cls.progressPercentage || 0)}%`, height: '100%', bgcolor: '#2D68C4', borderRadius: 99 }} />
                      </Box>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 10, color: 'text.disabled', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', mb: 0.25 }}>Tutor</Typography>
                      <Typography fontSize={12} fontWeight={500}>{cls.tutor ? (cls.tutor as any).name : '-'}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 10, color: 'text.disabled', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', mb: 0.25 }}>Coordinator</Typography>
                      <Typography fontSize={12} fontWeight={500} color={cls.coordinator ? 'text.primary' : 'warning.main'}>
                        {cls.coordinator ? (cls.coordinator as any).name : 'Unassigned'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))
            )}

            {classes.length > 0 && (
              <Box display="flex" justifyContent="space-between" alignItems="center" pt={1}>
                <Button size="small" disabled={page === 0}
                  onClick={() => { const p = page - 1; setPage(p); loadClasses(p, rowsPerPage); }}
                  sx={{ fontSize: 12, borderRadius: '8px', color: 'text.secondary', transition: T }}>
                  Previous
                </Button>
                <Typography fontSize={12} color="text.secondary">{page + 1} / {totalPages}</Typography>
                <Button size="small" disabled={page >= totalPages - 1}
                  onClick={() => { const p = page + 1; setPage(p); loadClasses(p, rowsPerPage); }}
                  sx={{ fontSize: 12, borderRadius: '8px', color: 'text.secondary', transition: T }}>
                  Next
                </Button>
              </Box>
            )}
          </Stack>
        )}
      </Box>

      {/* ── Manage Class Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={isModalOpen}
        onClose={() => !actionLoading && setIsModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', border: '1px solid #E2E8F0' } }}
      >
        <DialogTitle sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: '1px solid #F1F5F9' }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography fontWeight={800} fontSize={16} letterSpacing={-0.3}>{selectedClass?.className}</Typography>
              <Typography fontSize={12} color="text.secondary" mt={0.25}>{selectedClass?.studentName}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {selectedClass && <StatusPill status={selectedClass.status} />}
              <IconButton size="small" onClick={() => setIsModalOpen(false)} disabled={actionLoading}
                sx={{ borderRadius: '8px', color: 'text.secondary', transition: T }}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          {selectedClass && (
            <Stack spacing={2.5}>

              {/* Progress */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography fontSize={12} fontWeight={700} color="text.secondary" letterSpacing={0.4} textTransform="uppercase">
                    Session Progress
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {selectedClass.completedSessions} / {selectedClass.classesPerMonth} sessions
                  </Typography>
                </Box>
                <Box sx={{ height: 6, bgcolor: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                  <Box sx={{ width: `${selectedClass.progressPercentage}%`, height: '100%', bgcolor: '#2D68C4', borderRadius: 99, transition: 'width 0.5s ease' }} />
                </Box>
                <Typography fontSize={11} color="text.disabled" mt={0.5}>{Math.round(selectedClass.progressPercentage || 0)}% complete</Typography>
              </Box>

              {/* Info grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, p: 2, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                {[
                  { label: 'Tutor', value: selectedClass.tutor ? (selectedClass.tutor as any).name : 'Unknown' },
                  { label: 'Coordinator', value: selectedClass.coordinator ? (selectedClass.coordinator as any).name : 'Not Assigned' },
                  { label: 'Subject', value: formatSubject(selectedClass.subject) },
                  { label: 'Grade', value: selectedClass.grade || '-' },
                ].map((item) => (
                  <Box key={item.label}>
                    <Typography sx={{ fontSize: 10, color: 'text.disabled', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', mb: 0.3 }}>{item.label}</Typography>
                    <Typography fontSize={13} fontWeight={500}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ borderColor: '#F1F5F9' }} />

              {/* Status actions */}
              <Box>
                <Typography fontSize={11} fontWeight={700} color="text.secondary" letterSpacing={0.5} textTransform="uppercase" mb={1.25}>
                  Class Status
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {selectedClass.status === FINAL_CLASS_STATUS.ACTIVE && (
                    <Button
                      variant="contained" color="warning" startIcon={<PauseIcon sx={{ fontSize: '15px !important' }} />}
                      onClick={() => handleStatusChange(FINAL_CLASS_STATUS.PAUSED)} disabled={actionLoading}
                      sx={{ fontWeight: 700, fontSize: 12, px: 2, borderRadius: '9px', boxShadow: 'none', transition: T, '&:active': { transform: 'scale(0.97)' } }}
                    >
                      Pause
                    </Button>
                  )}
                  {selectedClass.status === FINAL_CLASS_STATUS.PAUSED && (
                    <Button
                      variant="contained" color="success" startIcon={<PlayArrowIcon sx={{ fontSize: '15px !important' }} />}
                      onClick={() => handleStatusChange(FINAL_CLASS_STATUS.ACTIVE)} disabled={actionLoading}
                      sx={{ fontWeight: 700, fontSize: 12, px: 2, borderRadius: '9px', boxShadow: 'none', transition: T, '&:active': { transform: 'scale(0.97)' } }}
                    >
                      Resume
                    </Button>
                  )}
                  <Button
                    variant="outlined" startIcon={<AutorenewIcon sx={{ fontSize: '15px !important' }} />}
                    onClick={handleRenewMonthlyClass}
                    disabled={actionLoading || (selectedClass.completedSessions || 0) < (selectedClass.classesPerMonth || selectedClass.totalSessions || 0)}
                    sx={{ fontWeight: 700, fontSize: 12, px: 2, borderRadius: '9px', transition: T, '&:active': { transform: 'scale(0.97)' } }}
                  >
                    Renew Month
                  </Button>
                  <Button
                    variant="outlined" startIcon={<DownloadIcon sx={{ fontSize: '15px !important' }} />}
                    onClick={handleDownloadAttendance} disabled={actionLoading}
                    sx={{ fontWeight: 700, fontSize: 12, px: 2, borderRadius: '9px', transition: T, '&:active': { transform: 'scale(0.97)' } }}
                  >
                    Attendance
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ borderColor: '#F1F5F9' }} />

              {/* Attendance window */}
              <Box>
                <Typography fontSize={11} fontWeight={700} color="text.secondary" letterSpacing={0.5} textTransform="uppercase" mb={1.25}>
                  Submission Window
                </Typography>
                <Box display="flex" gap={1.25} alignItems="center">
                  <TextField
                    size="small" type="number" value={windowValue}
                    onChange={(e) => setWindowValue(Number(e.target.value))}
                    disabled={actionLoading}
                    helperText="Days tutors have to submit attendance"
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: 13, '& fieldset': { borderColor: '#E2E8F0' } },
                    }}
                  />
                  <Button
                    variant="contained" onClick={handleUpdateWindow}
                    disabled={actionLoading || windowValue === selectedClass.attendanceSubmissionWindow}
                    sx={{ fontWeight: 700, fontSize: 13, px: 2.5, borderRadius: '9px', boxShadow: 'none', flexShrink: 0, transition: T, '&:active': { transform: 'scale(0.97)' } }}
                  >
                    Save
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ borderColor: '#F1F5F9' }} />

              {/* Financial plan */}
              <Box>
                <Typography fontSize={11} fontWeight={700} color="text.secondary" letterSpacing={0.5} textTransform="uppercase" mb={1.25}>
                  Financial Plan
                </Typography>
                <Button
                  variant="outlined" fullWidth onClick={() => setPlanModalOpen(true)} disabled={actionLoading}
                  sx={{ fontWeight: 700, fontSize: 13, py: 1, borderRadius: '9px', transition: T, '&:active': { transform: 'scale(0.97)' } }}
                >
                  Manage Class Plan
                </Button>
              </Box>

              {/* Tutor management */}
              {selectedClass.status === FINAL_CLASS_STATUS.ACTIVE && (
                <>
                  <Divider sx={{ borderColor: '#F1F5F9' }} />
                  <Box>
                    <Typography fontSize={11} fontWeight={700} color="text.secondary" letterSpacing={0.5} textTransform="uppercase" mb={1.25}>
                      Tutor Management
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Button
                        variant="outlined" size="small" onClick={() => setTutorModalOpen(true)} disabled={actionLoading}
                        sx={{ fontWeight: 700, fontSize: 12, px: 1.75, borderRadius: '9px', transition: T, '&:active': { transform: 'scale(0.97)' } }}
                      >
                        Change Tutor
                      </Button>
                      <Button
                        variant="outlined" size="small" color="warning" onClick={handleTutorLeavingAction} disabled={actionLoading}
                        sx={{ fontWeight: 700, fontSize: 12, px: 1.75, borderRadius: '9px', transition: T, '&:active': { transform: 'scale(0.97)' } }}
                      >
                        Tutor Left
                      </Button>
                      <Button
                        variant="outlined" size="small" color="info" onClick={handleRepostAction} disabled={actionLoading}
                        sx={{ fontWeight: 700, fontSize: 12, px: 1.75, borderRadius: '9px', transition: T, '&:active': { transform: 'scale(0.97)' } }}
                      >
                        Repost Lead
                      </Button>
                    </Box>
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F1F5F9' }}>
          <Button
            onClick={() => setIsModalOpen(false)} disabled={actionLoading}
            sx={{ fontWeight: 700, fontSize: 13, borderRadius: '9px', color: 'text.secondary', transition: T }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <ClassPlanModal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        classId={selectedClass?.id || ''}
        className={selectedClass?.className || ''}
      />

      <GroupStudentsModal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        students={selectedLeadStudents}
        leadName={selectedLeadName}
      />

      <TutorSelectionModal
        open={tutorModalOpen}
        onClose={() => setTutorModalOpen(false)}
        onSelect={handleChangeTutor}
        excludeTutorId={selectedClass?.tutor?.id || (selectedClass?.tutor as any)?._id}
      />

      <ConfirmDialog
        open={confirmConfig.open}
        onClose={() => setConfirmConfig((p) => ({ ...p, open: false }))}
        onConfirm={confirmConfig.action}
        title={confirmConfig.title}
        message={confirmConfig.message}
        severity={confirmConfig.severity}
        loading={actionLoading}
      />

      <SnackbarNotification
        open={!!notification}
        message={notification?.message || ''}
        severity={notification?.severity || 'success'}
        onClose={() => setNotification(null)}
      />

      <SnackbarNotification
        open={!!error}
        message={error || ''}
        severity="error"
        onClose={() => setError(null)}
      />
    </Box>
  );
};

export default FinalClassesManagementPage;
