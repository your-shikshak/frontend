import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Box, Typography, Chip, IconButton, Menu, MenuItem,
  alpha, Divider, Button, Avatar, useMediaQuery, useTheme,
  FormControl, Select, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Collapse,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import LeadIcon from '@mui/icons-material/ContactMail';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getCRMLeads, updateClassLeadStatus, getLeadFilterOptions, reassignLead } from '../../services/leadService';
import { IClassLead } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { USER_ROLES } from '../../constants';

// ── Avatar palette ────────────────────────────────────────────────────────────
const AVATAR_PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#2E7D32'];
const getAvatarColor = (name: string) => AVATAR_PALETTE[(name?.charCodeAt(0) || 65) % AVATAR_PALETTE.length];
const getInitials = (name: string) =>
  (name || '?').trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();

// ── Column config ─────────────────────────────────────────────────────────────
const COLUMN_CONFIG = [
  { key: 'new',          label: 'New',            color: '#6366f1', description: 'Freshly created leads' },
  { key: 'announced',    label: 'Announced',       color: '#8b5cf6', description: 'Posted to tutors' },
  { key: 'interested',   label: 'Interested',      color: '#f59e0b', description: 'Tutors showing interest' },
  { key: 'demoScheduled',label: 'Demo Scheduled',  color: '#10b981', description: 'Demos booked' },
  { key: 'demoPending',  label: 'Demo Completed',  color: '#0ea5e9', description: 'Pending approval' },
  { key: 'won',          label: 'Won',             color: '#2E7D32', description: 'Converted to class' },
  { key: 'others',       label: 'Others',          color: '#94a3b8', description: 'Rejected / closed' },
];

const getDaysLabel = (date: string | Date) => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  return days === 0 ? 'Today' : `${days}d ago`;
};

const getPriority = (date: string | Date) => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (days > 7) return { label: 'High', color: '#ef4444', bg: alpha('#ef4444', 0.08) };
  if (days > 3) return { label: 'Mid',  color: '#f59e0b', bg: alpha('#f59e0b', 0.08) };
  return null;
};

// ── Lead card ─────────────────────────────────────────────────────────────────
const LeadCard: React.FC<{
  lead: IClassLead;
  delay: number;
  managers: { id: string; name: string }[];
  onRefresh: () => void;
  onReassign: (lead: IClassLead) => void;
}> = ({ lead, delay, managers, onRefresh, onReassign }) => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const ac = getAvatarColor(lead.studentName || '');
  const priority = getPriority(lead.createdAt);

  const subjects = useMemo(() => {
    const raw = lead.subject;
    const arr: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return arr.map((s: any) => typeof s === 'string' ? s : s?.label || s?.name || '').filter(Boolean).slice(0, 2);
  }, [lead.subject]);

  const handleMoveTo = async (status: string) => {
    setAnchorEl(null);
    try { await updateClassLeadStatus(lead.id, status); onRefresh(); } catch { }
  };

  const modeColor: Record<string, string> = { ONLINE: '#10b981', OFFLINE: '#f59e0b', HYBRID: '#6366f1' };
  const modeLabel = (lead.mode || '').toUpperCase();
  const mc = modeColor[modeLabel] || '#94a3b8';

  return (
    <Box
      onClick={() => navigate(`/class-leads/${lead.id}`)}
      sx={{
        mb: 1.25,
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        bgcolor: '#fff',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'border-color 160ms cubic-bezier(0.23,1,0.32,1), transform 160ms cubic-bezier(0.23,1,0.32,1), box-shadow 160ms cubic-bezier(0.23,1,0.32,1)',
        '@keyframes cardSlideIn': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        animation: `cardSlideIn 260ms cubic-bezier(0.23,1,0.32,1) ${delay}ms both`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': { borderColor: '#CBD5E1', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.07)' },
        },
        '@media (hover: none)': { '&:active': { transform: 'scale(0.97)' } },
      }}
    >
      {/* Color accent strip based on priority */}
      {priority && <Box sx={{ height: 3, bgcolor: priority.color, borderRadius: '12px 12px 0 0' }} />}

      <Box sx={{ p: 1.5 }}>
        {/* Header row: avatar + name + menu */}
        <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
          <Avatar
            sx={{
              width: 32, height: 32, borderRadius: '9px',
              bgcolor: alpha(ac, 0.12), color: ac,
              fontSize: '0.68rem', fontWeight: 800, flexShrink: 0, mt: 0.1,
            }}
          >
            {getInitials(lead.studentName || '?')}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography
              fontWeight={700}
              sx={{
                fontSize: '0.82rem', lineHeight: 1.3, color: '#1e293b',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                wordBreak: 'break-word',
              }}
            >
              {lead.studentName}
            </Typography>
            <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, mt: 0.1 }}>
              {getDaysLabel(lead.createdAt)}
              {isAdmin && (lead as any).createdBy?.name && (
                <Box component="span" sx={{ ml: 0.75, color: '#64748b', fontWeight: 700, bgcolor: '#F1F5F9', px: 0.5, py: 0.1, borderRadius: '4px', fontSize: '0.58rem' }}>
                  {(lead as any).createdBy.name}
                </Box>
              )}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}
            sx={{ flexShrink: 0, color: '#cbd5e1', borderRadius: '7px', width: 24, height: 24, mt: 0.1, '&:active': { transform: 'scale(0.88)' }, '&:hover': { color: '#64748b', bgcolor: '#F8FAFC' } }}
          >
            <MoreVertIcon sx={{ fontSize: 15 }} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            onClick={(e) => e.stopPropagation()}
            PaperProps={{ sx: { borderRadius: '10px', border: '1px solid #F1F5F9', boxShadow: '0 8px 24px rgba(0,0,0,0.09)', minWidth: 180 } }}
          >
            <MenuItem onClick={(e) => { e.stopPropagation(); setAnchorEl(null); navigate(`/class-leads/${lead.id}`); }} sx={{ fontSize: '0.82rem', fontWeight: 600, gap: 1, borderRadius: '7px', mx: 0.5 }}>
              View Details
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={() => handleMoveTo('ANNOUNCED')} sx={{ fontSize: '0.82rem', fontWeight: 600, borderRadius: '7px', mx: 0.5 }}>Move → Announced</MenuItem>
            <MenuItem onClick={() => handleMoveTo('DEMO_SCHEDULED')} sx={{ fontSize: '0.82rem', fontWeight: 600, borderRadius: '7px', mx: 0.5 }}>Move → Demo Scheduled</MenuItem>
            <MenuItem onClick={() => handleMoveTo('CONVERTED')} sx={{ fontSize: '0.82rem', fontWeight: 600, borderRadius: '7px', mx: 0.5 }}>Move → Won</MenuItem>
            {isAdmin && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={(e) => { e.stopPropagation(); setAnchorEl(null); onReassign(lead); }} sx={{ fontSize: '0.82rem', fontWeight: 600, gap: 1, color: '#6366f1', borderRadius: '7px', mx: 0.5 }}>
                  <SwapHorizIcon sx={{ fontSize: 15 }} /> Reassign
                </MenuItem>
              </>
            )}
          </Menu>
        </Box>

        {/* Chips row: grade + subjects */}
        <Box display="flex" gap={0.5} flexWrap="wrap" mb={1}>
          {lead.grade && (
            <Box sx={{ px: 0.75, py: 0.25, borderRadius: '6px', bgcolor: alpha('#6366f1', 0.08) }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#6366f1', lineHeight: 1 }}>Gr. {lead.grade}</Typography>
            </Box>
          )}
          {subjects.slice(0, 2).map((s) => (
            <Box key={s} sx={{ px: 0.75, py: 0.25, borderRadius: '6px', bgcolor: '#F1F5F9' }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569', lineHeight: 1 }}>{s}</Typography>
            </Box>
          ))}
        </Box>

        {/* Footer: mode badge + date + interests */}
        <Box display="flex" alignItems="center" justifyContent="space-between" pt={0.75} sx={{ borderTop: '1px solid #F8FAFC' }}>
          <Box sx={{ px: 0.75, py: 0.25, borderRadius: '6px', bgcolor: alpha(mc, 0.08) }}>
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: mc, lineHeight: 1 }}>{modeLabel || 'N/A'}</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#cbd5e1' }}>
            {format(new Date(lead.createdAt), 'MMM d')}
          </Typography>
          {(lead as any).interestCount > 0 && (
            <Box sx={{ px: 0.75, py: 0.25, borderRadius: '6px', bgcolor: alpha('#8b5cf6', 0.08) }}>
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#8b5cf6', lineHeight: 1 }}>
                {(lead as any).interestCount} 🙋
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// ── Kanban column ─────────────────────────────────────────────────────────────
const KanbanColumn: React.FC<{
  col: typeof COLUMN_CONFIG[0];
  leads: IClassLead[];
  highlighted: boolean;
  colIndex: number;
  managers: { id: string; name: string }[];
  onRefresh: () => void;
  onReassign: (lead: IClassLead) => void;
}> = ({ col, leads, highlighted, colIndex, managers, onRefresh, onReassign }) => (
  <Box
    sx={{
      minWidth: { xs: 248, sm: 272, md: 290 },
      width: { xl: 'calc((100% - 48px) / 7)' },
      flexShrink: 0,
      scrollSnapAlign: 'start',
      display: 'flex',
      flexDirection: 'column',
      '@keyframes colIn': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      animation: `colIn 320ms cubic-bezier(0.23,1,0.32,1) ${colIndex * 50}ms both`,
      '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
    }}
  >
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: highlighted ? '#F0F4FF' : '#F8FAFC',
        borderRadius: '14px',
        border: '1px solid',
        borderColor: highlighted ? alpha(col.color, 0.25) : '#E2E8F0',
        overflow: 'hidden',
        transition: 'border-color 200ms ease',
      }}
    >
      {/* Column header with top accent */}
      <Box sx={{ borderTop: `3px solid ${col.color}`, px: 1.5, pt: 1.5, pb: 1.25 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography fontWeight={800} sx={{ fontSize: '0.82rem', color: '#1e293b', lineHeight: 1.2 }}>
              {col.label}
            </Typography>
            <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', mt: 0.1, fontWeight: 500 }}>
              {col.description}
            </Typography>
          </Box>
          <Box
            sx={{
              minWidth: 24, height: 22, px: 0.75,
              borderRadius: '7px',
              bgcolor: alpha(col.color, 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: col.color }}>{leads.length}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Cards scroll area */}
      <Box
        sx={{
          flex: 1,
          px: 1.25,
          pb: 1.25,
          pt: 0.75,
          overflowY: 'auto',
          maxHeight: 620,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.08)', borderRadius: 10 },
        }}
      >
        {leads.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', opacity: 0.35 }}>
            <LeadIcon sx={{ fontSize: 36, color: '#94a3b8', mb: 0.75 }} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>No leads here</Typography>
          </Box>
        ) : (
          leads.map((lead, i) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              delay={colIndex * 40 + Math.min(i * 30, 180)}
              managers={managers}
              onRefresh={onRefresh}
              onReassign={onReassign}
            />
          ))
        )}
      </Box>
    </Box>
  </Box>
);

// ── Board component ───────────────────────────────────────────────────────────
export const ManagerLeadCRMBoard: React.FC<{ showHeader?: boolean; showBackground?: boolean }> = ({
  showHeader = true,
  showBackground = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useSelector(selectCurrentUser);
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightColumnRaw = searchParams.get('column');
  const highlightColumn = highlightColumnRaw === 'demoPending' ? 'demoCompleted' : highlightColumnRaw;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [groups, setGroups] = useState<Record<string, IClassLead[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [managerFilter, setManagerFilter] = useState<string>('All');
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [reassignOpen, setReassignOpen] = useState(false);
  const [leadToReassign, setLeadToReassign] = useState<IClassLead | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const fetchFilters = async () => {
    try {
      const res = await getLeadFilterOptions();
      if (res.data?.managers) setManagers(res.data.managers);
      if (res.data?.grades) setAvailableGrades(res.data.grades);
      if (res.data?.subjects) setAvailableSubjects(res.data.subjects);
    } catch { }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await getCRMLeads(managerFilter !== 'All' ? managerFilter : undefined);
      const raw: Record<string, IClassLead[]> = (res as any)?.data || {};
      if (raw.demoPending) raw.demoCompleted = raw.demoPending;
      setGroups(raw);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch CRM data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFilters(); }, []);
  useEffect(() => { fetchLeads(); }, [managerFilter]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [groups]);

  const scrollBoard = (dir: 'left' | 'right') =>
    scrollContainerRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });

  const getFilteredLeads = (key: string) => {
    const sq = searchQuery.toLowerCase();
    return (groups[key] || []).filter((lead) => {
      if (!lead || typeof lead !== 'object') return false;
      const matchSearch = !sq ||
        (lead.studentName || '').toLowerCase().includes(sq) ||
        (lead.leadId || '').toLowerCase().includes(sq) ||
        (lead.id || '').toLowerCase().includes(sq) ||
        ((lead as any).createdBy?.name || '').toLowerCase().includes(sq);
      const matchGrade = gradeFilter === 'All' || lead.grade === gradeFilter;
      const matchSubject = subjectFilter === 'All' ||
        (Array.isArray(lead.subject) ? (lead.subject as string[]).some(s => s === subjectFilter) : lead.subject === subjectFilter);
      return matchSearch && matchGrade && matchSubject;
    });
  };

  const totalLeads = useMemo(() => COLUMN_CONFIG.reduce((s, col) => s + (groups[col.key]?.length || 0), 0), [groups]);
  const activeFilters = (gradeFilter !== 'All' ? 1 : 0) + (subjectFilter !== 'All' ? 1 : 0) + (managerFilter !== 'All' ? 1 : 0);

  const handleReassignOpen = (lead: IClassLead) => {
    setLeadToReassign(lead);
    const id = (lead as any).createdBy?._id || (lead as any).createdBy?.id || lead.createdBy;
    setSelectedManagerId(typeof id === 'string' ? id : '');
    setReassignOpen(true);
  };

  const handleReassignSubmit = async () => {
    if (!leadToReassign || !selectedManagerId) return;
    setReassigning(true);
    try {
      await reassignLead(leadToReassign.id, selectedManagerId);
      await fetchLeads();
      setReassignOpen(false);
      setLeadToReassign(null);
      setSelectedManagerId('');
    } catch { }
    finally { setReassigning(false); }
  };

  if (loading && Object.keys(groups).length === 0) return <LoadingSpinner /> as any;

  const body = (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>

      {/* ── Hero header ────────────────────────────────────────────────── */}
      {showHeader && (
        <Box
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            px: { xs: 2, sm: 4 },
            pt: { xs: 2, sm: 3 },
            pb: { xs: 2.5, sm: 3.5 },
            position: 'relative',
            overflow: 'hidden',
            '@keyframes heroIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
            animation: 'heroIn 360ms cubic-bezier(0.23,1,0.32,1) forwards',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1400, mx: 'auto' }}>
            <Box display="flex" alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <Box>
                <Typography fontWeight={800} sx={{ color: '#fff', fontSize: { xs: '1.3rem', sm: '1.65rem' }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  Lead Tracker CRM
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: { xs: '0.78rem', sm: '0.88rem' }, mt: 0.4 }}>
                  {isAdmin
                    ? 'Monitor all manager leads through the CRM funnel.'
                    : 'Track your leads through the sales funnel with real-time interest.'}
                </Typography>

                {/* Stats pills */}
                <Box display="flex" gap={1} mt={1.25} flexWrap="wrap">
                  {[{ l: 'Total', v: totalLeads }, ...COLUMN_CONFIG.slice(0, 3).map(c => ({ l: c.label, v: groups[c.key]?.length || 0 }))].map(({ l, v }) => (
                    <Box key={l} sx={{ px: 1.25, py: 0.4, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{v} <span style={{ fontWeight: 500, opacity: 0.75 }}>{l}</span></Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Search + refresh */}
              <Box display="flex" gap={1} alignItems="center" sx={{ flexShrink: 0 }}>
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    bgcolor: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    borderRadius: '10px',
                    px: 1.25, py: 0.75,
                    width: { xs: '100%', sm: 220 },
                  }}
                >
                  <SearchIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                  <input
                    placeholder="Search leads…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none', background: 'transparent', outline: 'none',
                      color: '#fff', fontSize: '0.83rem', fontWeight: 500, width: '100%',
                    }}
                  />
                </Box>
                <IconButton
                  onClick={fetchLeads}
                  disabled={loading}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    borderRadius: '10px',
                    color: '#fff', width: 38, height: 38,
                    '&:active': { transform: 'scale(0.93)' },
                    '&:disabled': { opacity: 0.5 },
                  }}
                >
                  <RefreshIcon sx={{ fontSize: 18, ...(loading && { animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }) }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
          {/* Orb */}
          <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        </Box>
      )}

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E2E8F0', px: { xs: 2, sm: 4 }, py: 1, maxWidth: 1400, mx: 'auto' }}>
        {isMobile ? (
          // Mobile: collapsed filter
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                size="small"
                startIcon={<FilterListIcon sx={{ fontSize: 15 }} />}
                endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 15, transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />}
                onClick={() => setFiltersOpen(!filtersOpen)}
                variant="outlined"
                sx={{
                  borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem',
                  borderColor: activeFilters > 0 ? '#6366f1' : '#E2E8F0',
                  color: activeFilters > 0 ? '#6366f1' : '#64748b',
                  bgcolor: activeFilters > 0 ? alpha('#6366f1', 0.05) : 'transparent',
                  textTransform: 'none', py: 0.5,
                }}
              >
                Filters {activeFilters > 0 && `(${activeFilters})`}
              </Button>
              {gradeFilter !== 'All' && (
                <Chip size="small" label={gradeFilter} onDelete={() => setGradeFilter('All')} sx={{ borderRadius: '7px', fontWeight: 700, fontSize: '0.7rem' }} />
              )}
              {subjectFilter !== 'All' && (
                <Chip size="small" label={subjectFilter} onDelete={() => setSubjectFilter('All')} sx={{ borderRadius: '7px', fontWeight: 700, fontSize: '0.7rem' }} />
              )}
            </Box>
            <Collapse in={filtersOpen}>
              <Box pt={1.5} pb={0.5} display="flex" flexDirection="column" gap={1.25}>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 }}>Grade</Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {['All', ...availableGrades].map(g => (
                      <Chip key={g} label={g} size="small" onClick={() => setGradeFilter(g)}
                        sx={{ borderRadius: '7px', fontWeight: gradeFilter === g ? 700 : 500, fontSize: '0.7rem', cursor: 'pointer', bgcolor: gradeFilter === g ? '#6366f1' : '#F8FAFC', color: gradeFilter === g ? '#fff' : '#475569', border: '1px solid', borderColor: gradeFilter === g ? '#6366f1' : '#E2E8F0', '&:active': { transform: 'scale(0.95)' } }}
                      />
                    ))}
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 }}>Subject</Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {['All', ...availableSubjects].slice(0, 10).map(s => (
                      <Chip key={s} label={s} size="small" onClick={() => setSubjectFilter(s)}
                        sx={{ borderRadius: '7px', fontWeight: subjectFilter === s ? 700 : 500, fontSize: '0.7rem', cursor: 'pointer', bgcolor: subjectFilter === s ? '#6366f1' : '#F8FAFC', color: subjectFilter === s ? '#fff' : '#475569', border: '1px solid', borderColor: subjectFilter === s ? '#6366f1' : '#E2E8F0', '&:active': { transform: 'scale(0.95)' } }}
                      />
                    ))}
                  </Box>
                </Box>
                {isAdmin && (
                  <FormControl size="small" sx={{ maxWidth: 240 }}>
                    <InputLabel>Manager</InputLabel>
                    <Select value={managerFilter} label="Manager" onChange={(e) => setManagerFilter(e.target.value)} sx={{ borderRadius: '9px' }}>
                      <MenuItem value="All">All Managers</MenuItem>
                      {managers.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Collapse>
          </Box>
        ) : (
          // Desktop: inline filter row
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={0.5}>
              <FilterListIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>Grade:</Typography>
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {['All', ...availableGrades].map(g => (
                  <Chip key={g} label={g} size="small" onClick={() => setGradeFilter(g)}
                    sx={{ borderRadius: '7px', fontWeight: gradeFilter === g ? 700 : 500, fontSize: '0.7rem', cursor: 'pointer', bgcolor: gradeFilter === g ? '#6366f1' : '#F8FAFC', color: gradeFilter === g ? '#fff' : '#475569', border: '1px solid', borderColor: gradeFilter === g ? '#6366f1' : '#E2E8F0', '&:active': { transform: 'scale(0.95)' } }}
                  />
                ))}
              </Box>
            </Box>
            <Box sx={{ width: '1px', height: 16, bgcolor: '#E2E8F0' }} />
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>Subject:</Typography>
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {['All', ...availableSubjects].slice(0, 8).map(s => (
                  <Chip key={s} label={s} size="small" onClick={() => setSubjectFilter(s)}
                    sx={{ borderRadius: '7px', fontWeight: subjectFilter === s ? 700 : 500, fontSize: '0.7rem', cursor: 'pointer', bgcolor: subjectFilter === s ? '#6366f1' : '#F8FAFC', color: subjectFilter === s ? '#fff' : '#475569', border: '1px solid', borderColor: subjectFilter === s ? '#6366f1' : '#E2E8F0', '&:active': { transform: 'scale(0.95)' } }}
                  />
                ))}
              </Box>
            </Box>
            {isAdmin && (
              <>
                <Box sx={{ width: '1px', height: 16, bgcolor: '#E2E8F0' }} />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Manager</InputLabel>
                  <Select value={managerFilter} label="Manager" onChange={(e) => setManagerFilter(e.target.value)} sx={{ borderRadius: '9px', fontSize: '0.82rem' }}>
                    <MenuItem value="All">All Managers</MenuItem>
                    {managers.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* ── Board ──────────────────────────────────────────────────────── */}
      <Box sx={{ px: { xs: 1.5, sm: 3 }, py: 2, maxWidth: 1400, mx: 'auto' }}>
        {error && <Box mb={2}><ErrorAlert error={error} /></Box>}

        <Box sx={{ position: 'relative' }}>
          {/* Left/right fade scroll hints */}
          {showLeftArrow && (
            <Box sx={{
              position: 'absolute', left: 0, top: 0, bottom: 16, width: 48, zIndex: 5, pointerEvents: 'none',
              background: 'linear-gradient(to right, #F8FAFC 0%, transparent 100%)',
            }} />
          )}
          {showRightArrow && (
            <Box sx={{
              position: 'absolute', right: 0, top: 0, bottom: 16, width: 56, zIndex: 5, pointerEvents: 'none',
              background: 'linear-gradient(to left, #F8FAFC 0%, transparent 100%)',
            }} />
          )}

          {/* Scroll arrows (desktop only) */}
          {showLeftArrow && !isMobile && (
            <IconButton onClick={() => scrollBoard('left')}
              sx={{ position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)', zIndex: 10, bgcolor: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.07)', borderRadius: '10px', '&:hover': { bgcolor: '#F8FAFC' } }}>
              <ChevronLeftIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
          {showRightArrow && !isMobile && (
            <IconButton onClick={() => scrollBoard('right')}
              sx={{ position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)', zIndex: 10, bgcolor: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.07)', borderRadius: '10px', '&:hover': { bgcolor: '#F8FAFC' } }}>
              <ChevronRightIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}

          <Box
            ref={scrollContainerRef}
            onScroll={handleScroll}
            sx={{
              display: 'flex',
              gap: 1.5,
              overflowX: 'auto',
              pb: 2,
              scrollSnapType: 'x mandatory',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              alignItems: 'flex-start',
            }}
          >
            {COLUMN_CONFIG.map((col, i) => (
              <KanbanColumn
                key={col.key}
                col={col}
                leads={getFilteredLeads(col.key)}
                highlighted={highlightColumn === col.key}
                colIndex={i}
                managers={managers}
                onRefresh={fetchLeads}
                onReassign={handleReassignOpen}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Reassign dialog ─────────────────────────────────────────────── */}
      <Dialog open={reassignOpen} onClose={() => setReassignOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Reassign Manager</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Select a new manager for <strong>{leadToReassign?.studentName}</strong>:
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Target Manager</InputLabel>
            <Select value={selectedManagerId} label="Target Manager" onChange={(e) => setSelectedManagerId(e.target.value)}>
              {managers.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
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
            sx={{ borderRadius: '9px', fontWeight: 700, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
          >
            {reassigning ? 'Reassigning…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  return body;
};

const ManagerLeadCRMPage: React.FC = () => <ManagerLeadCRMBoard showHeader showBackground />;

export default ManagerLeadCRMPage;
