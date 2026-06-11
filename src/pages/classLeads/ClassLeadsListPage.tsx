import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Container, Box, Typography, Button, Paper, IconButton, Tooltip, Pagination,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, TextField, Select, MenuItem, InputAdornment, Skeleton,
  Stack, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Autocomplete, alpha, Avatar, Collapse,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useClassLeads from '../../hooks/useClassLeads';
import { usePermissionCheck } from '../../hooks/useManagerPermissions';
import { getLeadFilterOptions } from '../../services/leadService';
import { getSubjects } from '../../services/tutorService';
import ClassLeadStatusChip from '../../components/classLeads/ClassLeadStatusChip';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorDialog from '../../components/common/ErrorDialog';
import SnackbarNotification from '../../components/common/SnackbarNotification';
import GroupStudentsModal from '../../components/classLeads/GroupStudentsModal';
import { IClassLead } from '../../types';
import { getSubjectList, formatHierarchicalSubject, getLeafSubjectList } from '../../utils/subjectUtils';

// ── Deterministic avatar colours ──────────────────────────────────────────────
const AVATAR_PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#2E7D32'];
const getAvatarColor = (name: string) => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];
const getInitials = (name: string) =>
  (name || '?').trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();

// ── Animated lead card (mobile) ───────────────────────────────────────────────
function LeadCard({
  lead,
  index,
  isAdmin,
  onStudentClick,
  onMarkPayment,
  onView,
  onEdit,
  onDelete,
}: {
  lead: any;
  index: number;
  isAdmin: boolean;
  onStudentClick: (l: any) => void;
  onMarkPayment: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const leadId = lead._id || lead.id;
  const delay = Math.min(index * 55, 280);
  const color = getAvatarColor(lead.studentName || '');

  return (
    <Box
      sx={{
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        bgcolor: '#fff',
        overflow: 'hidden',
        /* 3D depth entrance */
        '@keyframes cardIn': {
          from: { opacity: 0, transform: 'perspective(600px) translateZ(-14px) translateY(10px)' },
          to: { opacity: 1, transform: 'perspective(600px) translateZ(0) translateY(0)' },
        },
        animation: `cardIn 320ms cubic-bezier(0.23,1,0.32,1) ${delay}ms both`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
        /* 3D layered shadow */
        boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 3px rgba(0,0,0,0.05), 0 4px 10px ${alpha(color, 0.08)}`,
        transition: 'transform 180ms cubic-bezier(0.23,1,0.32,1), box-shadow 180ms cubic-bezier(0.23,1,0.32,1)',
        '@media (hover: none)': {
          '&:active': { transform: 'scale(0.97)', transition: 'transform 100ms cubic-bezier(0.23,1,0.32,1)' },
        },
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': {
            transform: 'perspective(800px) translateZ(6px) translateY(-3px)',
            boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 8px 20px rgba(0,0,0,0.07), 0 16px 28px ${alpha(color, 0.1)}`,
          },
        },
      }}
    >
      {/* Card body */}
      <Box sx={{ p: 2 }}>
        {/* Row 1: Avatar + Name + Status */}
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              borderRadius: '11px',
              bgcolor: alpha(color, 0.12),
              color,
              fontWeight: 800,
              fontSize: '0.875rem',
              flexShrink: 0,
            }}
          >
            {getInitials(lead.studentName)}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography
              fontWeight={700}
              sx={{
                fontSize: '0.9rem',
                lineHeight: 1.25,
                cursor: 'pointer',
                color: 'text.primary',
                transition: 'color 150ms ease',
                '@media (hover: hover) and (pointer: fine)': {
                  '&:hover': { color: '#6366f1' },
                },
              }}
              onClick={() => onStudentClick(lead)}
              noWrap
            >
              {lead.studentName}
              {lead.studentType === 'GROUP' && (
                <Chip label="Group" size="small" sx={{ ml: 0.75, height: 16, fontSize: '0.6rem', fontWeight: 700 }} />
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {lead.grade && `Grade ${lead.grade}`}
              {lead.board && ` · ${lead.board}`}
            </Typography>
          </Box>
          <ClassLeadStatusChip status={lead.status} />
        </Box>

        {/* Row 2: Mode + Subjects */}
        <Box display="flex" gap={0.75} flexWrap="wrap" mb={1.25}>
          <Chip
            label={lead.mode}
            size="small"
            variant="outlined"
            sx={{
              borderRadius: '7px',
              fontSize: '0.68rem',
              fontWeight: 700,
              borderColor: lead.mode === 'ONLINE' ? alpha('#6366f1', 0.3) : alpha('#2E7D32', 0.3),
              color: lead.mode === 'ONLINE' ? '#6366f1' : '#2E7D32',
              bgcolor: lead.mode === 'ONLINE' ? alpha('#6366f1', 0.05) : alpha('#2E7D32', 0.05),
            }}
          />
          {lead.displaySubjects.slice(0, 3).map((s: any, i: number) => {
            const label = typeof s === 'string' ? s : s?.label || s?.name || 'N/A';
            return (
              <Chip
                key={i}
                label={label}
                size="small"
                sx={{ borderRadius: '7px', fontSize: '0.68rem', fontWeight: 600, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}
              />
            );
          })}
          {lead.displaySubjects.length > 3 && (
            <Chip label={`+${lead.displaySubjects.length - 3}`} size="small" sx={{ borderRadius: '7px', fontSize: '0.68rem', bgcolor: '#F1F5F9' }} />
          )}
        </Box>

        {/* Row 3: Timing + Location */}
        {(lead.timing || lead.area || lead.city) && (
          <Box display="flex" gap={2} mb={0.5}>
            {lead.timing && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <AccessTimeIcon sx={{ fontSize: 12 }} />
                {lead.timing}
              </Typography>
            )}
            {lead.mode === 'OFFLINE' && (lead.area || lead.city) && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
                📍 {[lead.area, lead.city].filter(Boolean).join(', ')}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          bgcolor: '#F8FAFC',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          {(lead.createdBy as any)?.name || '—'}
        </Typography>
        <Box display="flex" gap={0.25}>
          {(lead.status === 'CONVERTED' || lead.status === 'WON') && !lead.paymentReceived && (
            <Tooltip title="Mark Payment Received">
              <IconButton size="small" color="success" onClick={() => onMarkPayment(leadId)} sx={{ borderRadius: '8px' }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          {(lead.status === 'CONVERTED' || lead.status === 'WON') && lead.paymentReceived && (
            <Tooltip title="Payment Received">
              <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main', mt: 0.5 }} />
            </Tooltip>
          )}
          <Tooltip title="View">
            <IconButton size="small" onClick={() => onView(leadId)} sx={{ borderRadius: '8px', '&:hover': { bgcolor: alpha('#6366f1', 0.08), color: '#6366f1' } }}>
              <VisibilityIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(leadId)} sx={{ borderRadius: '8px', '&:hover': { bgcolor: alpha('#6366f1', 0.08), color: '#6366f1' } }}>
              <EditIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => onDelete(leadId)} sx={{ borderRadius: '8px', '&:hover': { bgcolor: alpha('#ef4444', 0.08) } }}>
              <DeleteIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function LeadCardSkeleton({ index }: { index: number }) {
  return (
    <Box
      sx={{
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        bgcolor: '#fff',
        p: 2,
        '@keyframes skeletonIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        animation: `skeletonIn 200ms ease ${index * 40}ms both`,
      }}
    >
      <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
        <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '11px', flexShrink: 0 }} />
        <Box flex={1}>
          <Skeleton variant="text" width="60%" height={18} />
          <Skeleton variant="text" width="40%" height={14} />
        </Box>
        <Skeleton variant="rounded" width={72} height={22} sx={{ borderRadius: '8px' }} />
      </Box>
      <Box display="flex" gap={0.75} mb={1.25}>
        <Skeleton variant="rounded" width={56} height={22} sx={{ borderRadius: '7px' }} />
        <Skeleton variant="rounded" width={72} height={22} sx={{ borderRadius: '7px' }} />
      </Box>
      <Box sx={{ pt: 1.25, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton variant="text" width={80} height={14} />
        <Box display="flex" gap={0.5}>
          <Skeleton variant="rounded" width={28} height={28} sx={{ borderRadius: '8px' }} />
          <Skeleton variant="rounded" width={28} height={28} sx={{ borderRadius: '8px' }} />
          <Skeleton variant="rounded" width={28} height={28} sx={{ borderRadius: '8px' }} />
        </Box>
      </Box>
    </Box>
  );
}

// ── Stat pill in hero ─────────────────────────────────────────────────────────
function HeroStat({ label, value, delay }: { label: string; value: number | string; delay: number }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        px: { xs: 1.5, sm: 2 },
        '@keyframes statIn': {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        animation: `statIn 300ms cubic-bezier(0.23,1,0.32,1) ${delay}ms both`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
      }}
    >
      <Typography fontWeight={800} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.68rem', opacity: 0.75, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.25 }}>
        {label}
      </Typography>
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ClassLeadsListPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { isAuthorized: canCreateLeads } = usePermissionCheck('canCreateLeads');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    studentName: '', grade: '', subject: '', board: '', mode: '',
    status: '', search: '', timing: '', createdByName: '', area: '',
  });

  const [filterOptions, setFilterOptions] = useState<{
    grades: string[]; subjects: string[]; boards: string[]; areas: string[]; creators: string[]; status?: string[];
  }>({ grades: [], subjects: [], boards: [], areas: [], creators: [], status: [] });

  const [subjectsList, setSubjectsList] = useState<any[]>([]);

  useEffect(() => {
    getSubjects().then((res: any) => { if (res.data) setSubjectsList(res.data); }).catch(console.error);
    getLeadFilterOptions().then((res: any) => { if (res.success && res.data) setFilterOptions(res.data); }).catch(console.error);
  }, []);

  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sort, setSort] = useState<{ sortBy: string; sortOrder: 'asc' | 'desc' }>({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [selectedLeadStudents, setSelectedLeadStudents] = useState<any[]>([]);
  const [selectedLeadName, setSelectedLeadName] = useState('');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedFilters(filters); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [filters]);

  const { leads, loading, error, pagination, deleteLead, updateStatus } = useClassLeads({
    page, limit: rowsPerPage,
    status: debouncedFilters.status || undefined,
    studentName: debouncedFilters.studentName || undefined,
    grade: debouncedFilters.grade || undefined,
    subject: debouncedFilters.subject || undefined,
    board: debouncedFilters.board || undefined,
    mode: debouncedFilters.mode || undefined,
    search: debouncedFilters.search || undefined,
    createdByName: debouncedFilters.createdByName || undefined,
    area: debouncedFilters.area || undefined,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  });

  useEffect(() => { if (error) setShowErrorDialog(true); }, [error]);

  const handleFilterChange = (field: string, value: string) => setFilters((p) => ({ ...p, [field]: value }));
  const clearFilter = (field: string) => handleFilterChange(field, '');

  const handleSort = (col: string) => {
    const isAsc = sort.sortBy === col && sort.sortOrder === 'asc';
    setSort({ sortBy: col, sortOrder: isAsc ? 'desc' : 'asc' });
  };

  const handleStudentNameClick = (lead: IClassLead) => {
    if (lead.studentType === 'GROUP') {
      setSelectedLeadStudents(lead.associatedStudents || (lead as any).studentDetails || []);
      setSelectedLeadName(lead.studentName || 'Group Lead');
      setGroupModalOpen(true);
    } else {
      const studentId = lead.associatedStudents?.[0]?.studentId || (lead as any).studentId;
      if (studentId) navigate(`/admin/student-profile/${studentId}`);
      else setSnack({ open: true, message: 'No student profile linked', severity: 'info' });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteLead(id);
    setSnack({ open: true, message: 'Lead deleted', severity: 'success' });
  };

  const handleMarkPaymentReceived = async (leadId: string) => {
    try {
      await updateStatus(leadId, 'PAYMENT_RECEIVED');
      setSnack({ open: true, message: 'Payment marked as received', severity: 'success' });
    } catch (e: any) {
      setSnack({ open: true, message: e?.response?.data?.message || 'Failed to update', severity: 'error' });
    }
  };

  const handleAddressClick = (lead: IClassLead) => {
    setSelectedAddress(`${lead.address || ''}${lead.area ? `, ${lead.area}` : ''}${lead.city ? `, ${lead.city}` : ''}`.trim() || 'No address available');
    setAddressModalOpen(true);
  };

  const formattedLeads = useMemo(() =>
    (leads as IClassLead[]).map((l) => ({ ...l, displaySubjects: getLeafSubjectList(l.subject) })),
    [leads]
  );

  // Stats computed from current page (indicative counts)
  const pageStats = useMemo(() => ({
    total: pagination.total || formattedLeads.length,
    converted: formattedLeads.filter((l) => l.status === 'CONVERTED' || (l as any).status === 'WON').length,
    demo: formattedLeads.filter((l) => l.status === 'DEMO_SCHEDULED' || l.status === 'DEMO_COMPLETED').length,
    fresh: formattedLeads.filter((l) => l.status === 'NEW').length,
  }), [formattedLeads, pagination.total]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && k !== 'search').length;

  const sortLabelSx = {
    '&.MuiTableSortLabel-root': { color: 'inherit' },
    '&.MuiTableSortLabel-root:hover': { color: 'inherit' },
    '&.Mui-active': { color: 'inherit', '& .MuiTableSortLabel-icon': { color: 'inherit !important' } },
  };

  return (
    <Container maxWidth="xl" disableGutters sx={{ px: { xs: 0, sm: 0 } }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
          color: 'white',
          py: { xs: 3.5, md: 5 },
          px: { xs: 2.5, md: 4 },
          borderRadius: { xs: 0, md: 3 },
          mb: { xs: 0, md: 4 },
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          '@keyframes heroIn': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
          animation: 'heroIn 360ms cubic-bezier(0.23,1,0.32,1) forwards',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
        }}
      >
        {/* Main row */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              fontWeight={800}
              sx={{ fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.125rem' }, letterSpacing: '-0.02em', lineHeight: 1.15 }}
            >
              Class Leads
            </Typography>
            <Typography sx={{ opacity: 0.85, fontSize: { xs: '0.82rem', sm: '0.95rem' }, mt: 0.5, lineHeight: 1.5 }}>
              Track student enquiries from first contact to converted class.
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={2} sx={{ flexShrink: 0 }}>
            {/* Stats pills — desktop inline, mobile below */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                gap: 0,
                bgcolor: 'rgba(0,0,0,0.2)',
                borderRadius: '12px',
                px: 1,
                py: 0.75,
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <HeroStat label="Total" value={loading ? '…' : pageStats.total} delay={200} />
              <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.15)', my: 0.5 }} />
              <HeroStat label="New" value={loading ? '…' : pageStats.fresh} delay={260} />
              <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.15)', my: 0.5 }} />
              <HeroStat label="Converted" value={loading ? '…' : pageStats.converted} delay={320} />
            </Box>

            <Tooltip title={user?.role === 'MANAGER' && !canCreateLeads ? 'No permission to create leads' : ''} arrow>
              <span>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/class-leads/new')}
                  disabled={user?.role === 'MANAGER' && !canCreateLeads}
                  sx={{
                    bgcolor: 'white',
                    color: '#1B5E20',
                    fontWeight: 800,
                    px: 2.5,
                    py: 1,
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), box-shadow 160ms ease',
                    '@media (hover: hover) and (pointer: fine)': {
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.95)', transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' },
                    },
                    '@media (hover: none)': { '&:active': { transform: 'scale(0.97)' } },
                    '&:disabled': { bgcolor: 'rgba(255,255,255,0.45)', color: 'rgba(27,94,32,0.5)' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  New Lead
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Mobile stats row */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            gap: 0,
            bgcolor: 'rgba(0,0,0,0.2)',
            borderRadius: '10px',
            px: 1,
            py: 0.5,
            border: '1px solid rgba(255,255,255,0.12)',
            mt: 2,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <HeroStat label="Total" value={loading ? '…' : pageStats.total} delay={200} />
          <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.15)', my: 0.75 }} />
          <HeroStat label="New" value={loading ? '…' : pageStats.fresh} delay={240} />
          <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.15)', my: 0.75 }} />
          <HeroStat label="Demo" value={loading ? '…' : pageStats.demo} delay={280} />
          <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.15)', my: 0.75 }} />
          <HeroStat label="Converted" value={loading ? '…' : pageStats.converted} delay={320} />
        </Box>

        {/* Orbs */}
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -50, left: 20, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      </Box>

      {/* ── Content area ─────────────────────────────────────────────────── */}
      <Box sx={{ px: { xs: 1.5, sm: 2.5, md: 0 }, pt: { xs: 2, md: 0 } }}>

        {/* ── Filter toolbar ──────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            mb: { xs: 2, md: 3 },
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            overflow: 'hidden',
            '@keyframes toolbarIn': {
              from: { opacity: 0, transform: 'translateY(6px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
            animation: 'toolbarIn 300ms cubic-bezier(0.23,1,0.32,1) 120ms both',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
          }}
        >
          {/* Mobile: compact header row */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, px: 1.5, py: 1.25 }}>
            {/* Search always visible */}
            <TextField
              size="small"
              placeholder="Search leads…"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
                endAdornment: filters.search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => clearFilter('search')} sx={{ p: 0.25 }}><ClearIcon sx={{ fontSize: 14 }} /></IconButton>
                  </InputAdornment>
                ) : undefined,
                sx: { fontSize: '0.875rem', borderRadius: '8px' },
              }}
              sx={{ flex: 1 }}
            />
            <Chip
              icon={<FilterListIcon sx={{ fontSize: '14px !important' }} />}
              label={activeFilterCount > 0 ? `${activeFilterCount}` : 'Filter'}
              size="small"
              onClick={() => setFiltersOpen((p) => !p)}
              deleteIcon={<KeyboardArrowDownIcon sx={{ fontSize: '15px !important', transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 220ms cubic-bezier(0.23,1,0.32,1)', color: 'inherit !important' }} />}
              onDelete={() => setFiltersOpen((p) => !p)}
              sx={{
                fontWeight: 700,
                fontSize: '0.73rem',
                bgcolor: filtersOpen || activeFilterCount > 0 ? alpha('#6366f1', 0.1) : 'transparent',
                border: '1px solid',
                borderColor: filtersOpen || activeFilterCount > 0 ? alpha('#6366f1', 0.3) : '#E2E8F0',
                color: filtersOpen || activeFilterCount > 0 ? '#6366f1' : 'text.secondary',
                transition: 'all 180ms cubic-bezier(0.23,1,0.32,1)',
                '& .MuiChip-icon': { color: 'inherit' },
                flexShrink: 0,
              }}
            />
          </Box>

          {/* Mobile: expandable filters */}
          <Collapse in={filtersOpen} timeout={220}>
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.25, px: 1.5, pb: 1.5, borderTop: '1px solid #F1F5F9' }}>
              <Box sx={{ pt: 1.25, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
                <Select size="small" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value as string)} displayEmpty sx={{ borderRadius: '8px', fontSize: '0.8rem' }}>
                  <MenuItem value=""><em>All Status</em></MenuItem>
                  <MenuItem value="NEW">New</MenuItem>
                  <MenuItem value="ANNOUNCED">Announced</MenuItem>
                  <MenuItem value="DEMO_SCHEDULED">Demo Scheduled</MenuItem>
                  <MenuItem value="DEMO_COMPLETED">Demo Completed</MenuItem>
                  <MenuItem value="CONVERTED">Converted</MenuItem>
                </Select>
                <Select size="small" value={filters.mode} onChange={(e) => handleFilterChange('mode', e.target.value as string)} displayEmpty sx={{ borderRadius: '8px', fontSize: '0.8rem' }}>
                  <MenuItem value=""><em>Any Mode</em></MenuItem>
                  <MenuItem value="ONLINE">Online</MenuItem>
                  <MenuItem value="OFFLINE">Offline</MenuItem>
                  <MenuItem value="HYBRID">Hybrid</MenuItem>
                </Select>
                <Select size="small" value={filters.grade} onChange={(e) => handleFilterChange('grade', e.target.value as string)} displayEmpty sx={{ borderRadius: '8px', fontSize: '0.8rem' }}>
                  <MenuItem value=""><em>All Grades</em></MenuItem>
                  {filterOptions.grades.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </Select>
                <Select size="small" value={filters.board} onChange={(e) => handleFilterChange('board', e.target.value as string)} displayEmpty sx={{ borderRadius: '8px', fontSize: '0.8rem' }}>
                  <MenuItem value=""><em>Any Board</em></MenuItem>
                  {filterOptions.boards.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </Select>
              </Box>
              {activeFilterCount > 0 && (
                <Button size="small" startIcon={<ClearIcon />} onClick={() => setFilters({ studentName: '', grade: '', subject: '', board: '', mode: '', status: '', search: '', timing: '', createdByName: '', area: '' })} sx={{ alignSelf: 'flex-start', color: 'error.main', fontWeight: 700, fontSize: '0.75rem' }}>
                  Clear All
                </Button>
              )}
            </Box>
          </Collapse>

          {/* Desktop: full filter row */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexWrap: 'wrap', gap: 1.5, p: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search…"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16 }} /></InputAdornment>, sx: { borderRadius: '8px' } }}
              sx={{ flex: '0 1 220px' }}
            />
            <Select size="small" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value as string)} displayEmpty sx={{ flex: '0 1 160px', borderRadius: '8px' }}>
              <MenuItem value=""><em>All Status</em></MenuItem>
              <MenuItem value="NEW">New</MenuItem>
              <MenuItem value="ANNOUNCED">Announced</MenuItem>
              <MenuItem value="DEMO_SCHEDULED">Demo Scheduled</MenuItem>
              <MenuItem value="DEMO_COMPLETED">Demo Completed</MenuItem>
              <MenuItem value="CONVERTED">Converted</MenuItem>
            </Select>
            <Select size="small" value={filters.mode} onChange={(e) => handleFilterChange('mode', e.target.value as string)} displayEmpty sx={{ flex: '0 1 140px', borderRadius: '8px' }}>
              <MenuItem value=""><em>Any Mode</em></MenuItem>
              <MenuItem value="ONLINE">Online</MenuItem>
              <MenuItem value="OFFLINE">Offline</MenuItem>
              <MenuItem value="HYBRID">Hybrid</MenuItem>
            </Select>
            <Select size="small" value={filters.grade} onChange={(e) => handleFilterChange('grade', e.target.value as string)} displayEmpty sx={{ flex: '0 1 130px', borderRadius: '8px' }}>
              <MenuItem value=""><em>All Grades</em></MenuItem>
              {filterOptions.grades.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </Select>
            <Select size="small" value={filters.board} onChange={(e) => handleFilterChange('board', e.target.value as string)} displayEmpty sx={{ flex: '0 1 130px', borderRadius: '8px' }}>
              <MenuItem value=""><em>Any Board</em></MenuItem>
              {filterOptions.boards.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </Select>
            <Autocomplete
              size="small"
              options={subjectsList}
              getOptionLabel={(o) => formatHierarchicalSubject(o)}
              value={subjectsList.find((s) => s._id === filters.subject) || null}
              onChange={(_e, v) => handleFilterChange('subject', v ? (v._id || v.value) : '')}
              renderInput={(params) => <TextField {...params} placeholder="Subject" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />}
              sx={{ flex: '0 1 180px' }}
            />
            {isAdmin && (
              <Select size="small" value={filters.createdByName} onChange={(e) => handleFilterChange('createdByName', e.target.value as string)} displayEmpty sx={{ flex: '0 1 160px', borderRadius: '8px' }}>
                <MenuItem value=""><em>All Managers</em></MenuItem>
                {filterOptions.creators.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            )}
            {activeFilterCount > 0 && (
              <Button size="small" startIcon={<ClearIcon />} color="error" onClick={() => setFilters({ studentName: '', grade: '', subject: '', board: '', mode: '', status: '', search: '', timing: '', createdByName: '', area: '' })} sx={{ ml: 'auto', fontWeight: 700 }}>
                Clear
              </Button>
            )}
          </Box>
        </Paper>

        {/* ── Mobile: card list ──────────────────────────────────────────── */}
        {isMobile && (
          <Stack spacing={1.5} mb={3}>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <LeadCardSkeleton key={i} index={i} />)
              : formattedLeads.length === 0
                ? (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 8,
                      border: '1px dashed #CBD5E1',
                      borderRadius: '16px',
                      '@keyframes emptyIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
                      animation: 'emptyIn 300ms cubic-bezier(0.23,1,0.32,1) both',
                    }}
                  >
                    <PeopleAltIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1.5 }} />
                    <Typography fontWeight={700} color="text.secondary">No leads found</Typography>
                    <Typography variant="caption" color="text.disabled">Try adjusting your filters</Typography>
                  </Box>
                )
                : formattedLeads.map((lead, i) => (
                  <LeadCard
                    key={(lead as any)._id || lead.id}
                    lead={lead}
                    index={i}
                    isAdmin={isAdmin}
                    onStudentClick={handleStudentNameClick}
                    onMarkPayment={handleMarkPaymentReceived}
                    onView={(id) => navigate(`/class-leads/${id}`)}
                    onEdit={(id) => navigate(`/class-leads/${id}/edit`)}
                    onDelete={handleDelete}
                  />
                ))
            }
          </Stack>
        )}

        {/* ── Desktop: table ─────────────────────────────────────────────── */}
        {!isMobile && (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              overflowX: 'auto',
              '@keyframes tableIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
              animation: 'tableIn 320ms cubic-bezier(0.23,1,0.32,1) 80ms both',
              '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
            }}
          >
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: '#F8FAFC',
                    '& .MuiTableCell-root': {
                      color: '#374151',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      borderBottom: '1px solid #E2E8F0',
                      py: 1.5,
                    },
                  }}
                >
                  <TableCell><TableSortLabel active={sort.sortBy === 'studentName'} direction={sort.sortBy === 'studentName' ? sort.sortOrder : 'asc'} onClick={() => handleSort('studentName')} sx={sortLabelSx}>Student</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel active={sort.sortBy === 'grade'} direction={sort.sortBy === 'grade' ? sort.sortOrder : 'asc'} onClick={() => handleSort('grade')} sx={sortLabelSx}>Grade</TableSortLabel></TableCell>
                  <TableCell>Subjects</TableCell>
                  <TableCell>Board</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Area</TableCell>
                  <TableCell>Timing</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Source</TableCell>
                  {isAdmin && <TableCell>Created By</TableCell>}
                  <TableCell><TableSortLabel active={sort.sortBy === 'createdAt'} direction={sort.sortBy === 'createdAt' ? sort.sortOrder : 'asc'} onClick={() => handleSort('createdAt')} sx={sortLabelSx}>Date</TableSortLabel></TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
                {/* Inline filter row */}
                <TableRow sx={{ bgcolor: '#FAFAFA', '& .MuiTableCell-root': { py: 0.75, borderBottom: '1px solid #E2E8F0' } }}>
                  <TableCell>
                    <TextField size="small" variant="standard" placeholder="Name" value={filters.studentName} onChange={(e) => handleFilterChange('studentName', e.target.value)} InputProps={{ sx: { fontSize: '0.78rem' }, endAdornment: filters.studentName ? <InputAdornment position="end"><IconButton size="small" onClick={() => clearFilter('studentName')} sx={{ p: 0 }}><ClearIcon sx={{ fontSize: 13 }} /></IconButton></InputAdornment> : undefined }} />
                  </TableCell>
                  <TableCell>
                    <Select variant="standard" value={filters.grade} onChange={(e) => handleFilterChange('grade', e.target.value as string)} displayEmpty sx={{ fontSize: '0.78rem', width: '100%' }}>
                      <MenuItem value=""><em>All</em></MenuItem>
                      {filterOptions.grades.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                    </Select>
                  </TableCell>
                  <TableCell sx={{ minWidth: 180 }}>
                    <Autocomplete size="small" options={subjectsList} getOptionLabel={(o) => formatHierarchicalSubject(o)} value={subjectsList.find((s) => s._id === filters.subject) || null} onChange={(_e, v) => handleFilterChange('subject', v ? (v._id || v.value) : '')} renderInput={(params) => <TextField {...params} variant="standard" placeholder="Subject" sx={{ '& .MuiInput-root': { fontSize: '0.78rem' } }} />} />
                  </TableCell>
                  <TableCell>
                    <Select variant="standard" value={filters.board} onChange={(e) => handleFilterChange('board', e.target.value as string)} displayEmpty sx={{ fontSize: '0.78rem', width: '100%' }}>
                      <MenuItem value=""><em>Any</em></MenuItem>
                      {filterOptions.boards.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select variant="standard" value={filters.mode} onChange={(e) => handleFilterChange('mode', e.target.value as string)} displayEmpty sx={{ fontSize: '0.78rem', width: '100%' }}>
                      <MenuItem value=""><em>Any</em></MenuItem>
                      <MenuItem value="ONLINE">Online</MenuItem>
                      <MenuItem value="OFFLINE">Offline</MenuItem>
                      <MenuItem value="HYBRID">Hybrid</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select variant="standard" value={filters.area} onChange={(e) => handleFilterChange('area', e.target.value as string)} displayEmpty sx={{ fontSize: '0.78rem', width: '100%' }}>
                      <MenuItem value=""><em>All</em></MenuItem>
                      {filterOptions.areas.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <TextField size="small" variant="standard" placeholder="Timing" value={filters.timing} onChange={(e) => handleFilterChange('timing', e.target.value)} InputProps={{ sx: { fontSize: '0.78rem' } }} />
                  </TableCell>
                  <TableCell>
                    <Select variant="standard" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value as string)} displayEmpty sx={{ fontSize: '0.78rem', width: '100%' }}>
                      <MenuItem value=""><em>Any</em></MenuItem>
                      <MenuItem value="NEW">New</MenuItem>
                      <MenuItem value="ANNOUNCED">Announced</MenuItem>
                      <MenuItem value="DEMO_SCHEDULED">Demo Scheduled</MenuItem>
                      <MenuItem value="DEMO_COMPLETED">Demo Completed</MenuItem>
                      <MenuItem value="CONVERTED">Converted</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell />{/* Source — no filter */}
                  {isAdmin && (
                    <TableCell>
                      <Select variant="standard" value={filters.createdByName} onChange={(e) => handleFilterChange('createdByName', e.target.value as string)} displayEmpty sx={{ fontSize: '0.78rem', width: '100%' }}>
                        <MenuItem value=""><em>All</em></MenuItem>
                        {filterOptions.creators.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </Select>
                    </TableCell>
                  )}
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={12} align="center" sx={{ py: 4 }}><LoadingSpinner /></TableCell></TableRow>
                ) : formattedLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                      <PeopleAltIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography color="text.secondary" fontWeight={600}>No leads found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  formattedLeads.map((lead, rowIdx) => {
                    const leadId = (lead as any)._id || lead.id;
                    const ac = getAvatarColor(lead.studentName || '');
                    return (
                      <TableRow
                        key={leadId}
                        sx={{
                          transition: 'background 150ms ease, box-shadow 150ms ease',
                          '@keyframes rowIn': {
                            from: { opacity: 0, transform: 'translateX(-4px)' },
                            to: { opacity: 1, transform: 'none' },
                          },
                          animation: `rowIn 250ms cubic-bezier(0.23,1,0.32,1) ${Math.min(rowIdx * 30, 200)}ms both`,
                          '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
                          '& .MuiTableCell-root': { borderBottom: '1px solid #F1F5F9', py: 1.25 },
                          '@media (hover: hover) and (pointer: fine)': {
                            '&:hover': {
                              bgcolor: '#FAFBFF',
                              '& .row-actions': { opacity: 1 },
                            },
                          },
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha(ac, 0.12), color: ac, fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>
                              {getInitials(lead.studentName)}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                sx={{ cursor: 'pointer', transition: 'color 150ms ease', lineHeight: 1.2, '@media (hover: hover) and (pointer: fine)': { '&:hover': { color: '#6366f1' } } }}
                                onClick={() => handleStudentNameClick(lead)}
                              >
                                {lead.studentName}
                              </Typography>
                              {lead.studentType === 'GROUP' && <Chip label="Group" size="small" variant="outlined" sx={{ height: 14, fontSize: '0.6rem', mt: 0.25 }} />}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{lead.grade}</Typography></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {lead.displaySubjects.map((s: any, i: number) => {
                              const label = typeof s === 'string' ? s : s?.label || s?.name || 'N/A';
                              return <Chip key={i} label={label} size="small" sx={{ fontSize: '0.65rem', borderRadius: '6px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }} />;
                            })}
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{lead.board}</Typography></TableCell>
                        <TableCell>
                          <Chip label={lead.mode} size="small" sx={{ borderRadius: '7px', fontSize: '0.68rem', fontWeight: 700, bgcolor: lead.mode === 'ONLINE' ? alpha('#6366f1', 0.08) : alpha('#2E7D32', 0.08), color: lead.mode === 'ONLINE' ? '#6366f1' : '#2E7D32', border: 'none' }} />
                        </TableCell>
                        <TableCell>
                          {lead.mode === 'OFFLINE' ? (
                            <Typography variant="body2" color="primary" sx={{ fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => handleAddressClick(lead)}>
                              {lead.area || 'View'}
                            </Typography>
                          ) : (
                            <Typography variant="body2" sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>Zoom</Typography>
                          )}
                        </TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.78rem' }}>{lead.timing}</Typography></TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <ClassLeadStatusChip status={lead.status} />
                            {(lead as any).paymentReceived
                              ? <Tooltip title="Payment Received"><CheckCircleIcon sx={{ fontSize: 15, color: 'success.main' }} /></Tooltip>
                              : (lead.status === 'CONVERTED' || (lead as any).status === 'WON') && (
                                <Tooltip title="Mark Payment Received">
                                  <IconButton size="small" color="success" onClick={() => handleMarkPaymentReceived(leadId)} sx={{ p: 0.25 }}>
                                    <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {(lead as any).leadSource
                            ? <Chip label={(lead as any).leadSource.replace(/_/g, ' ')} size="small" sx={{ borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600, textTransform: 'capitalize' }} />
                            : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Typography variant="caption" display="block" fontWeight={600}>{(lead.createdBy as any)?.name || '—'}</Typography>
                            <Typography variant="caption" color="text.secondary">{(lead.createdBy as any)?.role || ''}</Typography>
                          </TableCell>
                        )}
                        <TableCell><Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>{new Date(lead.createdAt).toLocaleDateString()}</Typography></TableCell>
                        <TableCell align="right">
                          <Box className="row-actions" sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25 }}>
                            <Tooltip title="View"><IconButton size="small" onClick={() => navigate(`/class-leads/${leadId}`)} sx={{ borderRadius: '7px', '&:hover': { bgcolor: alpha('#6366f1', 0.08), color: '#6366f1' } }}><VisibilityIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                            <Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/class-leads/${leadId}/edit`)} sx={{ borderRadius: '7px', '&:hover': { bgcolor: alpha('#6366f1', 0.08), color: '#6366f1' } }}><EditIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(leadId)} sx={{ borderRadius: '7px', '&:hover': { bgcolor: alpha('#ef4444', 0.08) } }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        <Box display="flex" justifyContent="center" pb={3}>
          <Pagination
            count={pagination.pages || 1}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            sx={{
              '& .MuiPaginationItem-root': { borderRadius: '8px', fontWeight: 600 },
              '& .Mui-selected': { fontWeight: 800 },
            }}
          />
        </Box>
      </Box>

      {/* ── Modals & Notifications ─────────────────────────────────────── */}
      <SnackbarNotification open={snack.open} message={snack.message} severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} />
      <GroupStudentsModal open={groupModalOpen} onClose={() => setGroupModalOpen(false)} students={selectedLeadStudents} leadName={selectedLeadName} />
      <Dialog open={addressModalOpen} onClose={() => setAddressModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Full Address</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>{selectedAddress}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddressModalOpen(false)} sx={{ borderRadius: '8px', fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>
      <ErrorDialog open={showErrorDialog} onClose={() => setShowErrorDialog(false)} error={error} title="Unable to Load Leads" />
    </Container>
  );
}
