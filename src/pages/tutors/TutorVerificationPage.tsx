import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Tabs, Tab, Dialog, DialogContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Button, TablePagination,
  TextField, TableSortLabel, MenuItem, Select, InputAdornment, IconButton,
  Link as MuiLink, Avatar, Card, CardContent, Stack, useMediaQuery, Autocomplete, Chip, Collapse,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import SnackbarNotification from '../../components/common/SnackbarNotification';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import VerificationStatusChip from '../../components/tutors/VerificationStatusChip';
import DocumentViewer from '../../components/tutors/DocumentViewer';
import VerificationModal from '../../components/tutors/VerificationModal';
import useTutors from '../../hooks/useTutors';
import { useOptions } from '../../hooks/useOptions';
import { ITutor, IDocument } from '../../types';
import {
  getPendingVerifications, updateVerificationStatus, getSubjects, getVerifiers,
  getCities, getAreas, getTutors,
} from '../../services/tutorService';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import { getOptionLabel, getLeafSubjectList } from '../../utils/subjectUtils';

// ─── KPI stat card ────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        borderRadius: 2,
        bgcolor: alpha(accent, 0.08),
        border: `1px solid ${alpha(accent, 0.18)}`,
        flex: 1,
        minWidth: 0,
        transition: 'background 200ms ease-out',
        '&:hover': { bgcolor: alpha(accent, 0.13) },
      }}
    >
      <Box sx={{ color: accent, display: 'flex', flexShrink: 0, opacity: 0.85 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: { xs: '1.35rem', sm: '1.6rem' },
            fontWeight: 800,
            lineHeight: 1,
            color: '#FFFFFF',
            letterSpacing: '-0.03em',
          }}
        >
          {value}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: alpha('#FFFFFF', 0.55),
            mt: 0.25,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Shared sort-label sx ─────────────────────────────────────────────────────
const sortLabelSx = {
  '&.MuiTableSortLabel-root': { color: 'inherit' },
  '&.MuiTableSortLabel-root:hover': { color: 'inherit' },
  '&.Mui-active': { color: 'inherit', '& .MuiTableSortLabel-icon': { color: 'inherit !important' } },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TutorVerificationPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tab, setTab] = useState(1);
  const [pending, setPending] = useState<ITutor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<ITutor | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<IDocument | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean; title: string; message: string; action: () => void;
    severity: 'info' | 'error' | 'warning';
  }>({ open: false, title: '', message: '', action: () => {}, severity: 'info' });
  const [actionLoading, setActionLoading] = useState(false);
  const [snack, setSnack] = useState<{
    open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [filters, setFilters] = useState({
    teacherId: '', name: '', email: '', phone: '', preferredMode: '',
    status: '', verifier: '', subjects: '', city: '', area: '', grade: '', board: '',
  });
  const [sort, setSort] = useState<{ sortBy: string; sortOrder: 'asc' | 'desc' }>({
    sortBy: 'createdAt', sortOrder: 'desc',
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [verifiersList, setVerifiersList] = useState<{ _id: string; name: string }[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [areasList, setAreasList] = useState<string[]>([]);
  const [kpis, setKpis] = useState({ total: 0, verified: 0, underReview: 0, rejected: 0 });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { options: subjectOptions } = useOptions('SUBJECT');

  const formatSubjectDisplay = (subjects: any[], limit?: number) => {
    if (!subjects || subjects.length === 0) return '-';
    const leafSubjects = getLeafSubjectList(subjects);
    if (limit && leafSubjects.length > limit) {
      return leafSubjects.slice(0, limit).join(', ') + '…';
    }
    return leafSubjects.join(', ');
  };

  const renderTutorCard = (t: ITutor, mode: 'pending' | 'all') => {
    const id = (t as any).id || (t as any)._id;
    const name = t.user?.name || 'Unknown Tutor';
    const email = t.user?.email || '-';
    const phone = t.user?.phone || '-';

    return (
      <Card
        key={id}
        variant="outlined"
        sx={{
          borderRadius: 2,
          borderColor: 'divider',
          transition: 'box-shadow 180ms ease-out, border-color 180ms ease-out',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
          },
        }}
      >
        <CardContent sx={{ pb: '16px !important' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={t.documents?.find(d => d.documentType === 'PROFILE_PHOTO')?.documentUrl}
              sx={{ width: 44, height: 44, fontSize: '1rem', fontWeight: 700 }}
            >
              {(name || 'T').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                component={RouterLink}
                to={`/tutor-profile/${id}`}
                sx={{
                  color: 'primary.main', fontWeight: 700, textDecoration: 'none',
                  display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {t.teacherId || '-'}
              </Typography>
            </Box>
            <VerificationStatusChip status={t.verificationStatus} />
          </Stack>

          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{email}</Typography>
            <Typography variant="body2" color="text.secondary">{phone}</Typography>
          </Box>

          <Box sx={{ mt: 1.25, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
            <Typography variant="body2"><strong>Mode:</strong> {t.preferredMode || '-'}</Typography>
            <Typography variant="body2"><strong>City:</strong> {t.user?.city || '-'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ gridColumn: '1 / -1' }}>
              <strong>Areas:</strong>{' '}
              {(t.preferredLocations || []).filter(l => l !== t.user?.city).join(', ') || '-'}
            </Typography>
          </Box>

          <Box sx={{ mt: 1.25 }}>
            <Typography variant="body2">
              <strong>Stats:</strong> {t.classesAssigned} Classes · {t.demosApproved} Demos · {t.experienceHours} hrs
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              mt: 0.75, overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}
          >
            <strong>Subjects:</strong> {formatSubjectDisplay(t.subjects)}
          </Typography>

          <Button
            fullWidth size="small" variant="contained"
            component={RouterLink}
            to={`/tutors/verify/${id}`}
            sx={{
              mt: 2, borderRadius: 1.5, fontWeight: 600,
              transition: 'transform 160ms ease-out, box-shadow 160ms ease-out',
              '&:active': { transform: 'scale(0.97)' },
            }}
          >
            {mode === 'pending' ? 'Review' : 'View'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await getSubjects();
        if (res.data) {
          setSubjectsList(res.data);
          localStorage.setItem('tutor_subjects_cache', JSON.stringify(res.data));
          localStorage.setItem('tutor_subjects_ts', String(Date.now()));
        }
      } catch (e) { console.error('Failed to fetch subjects', e); }
    };

    const fetchVerifiers = async () => {
      const cached = localStorage.getItem('tutor_verifiers_cache');
      const cacheTimestamp = localStorage.getItem('tutor_verifiers_ts');
      const now = Date.now();
      if (cached && cacheTimestamp && now - parseInt(cacheTimestamp) < 24 * 60 * 60 * 1000) {
        setVerifiersList(JSON.parse(cached));
      } else {
        try {
          const res = await getVerifiers();
          if (res.data) {
            setVerifiersList(res.data);
            localStorage.setItem('tutor_verifiers_cache', JSON.stringify(res.data));
            localStorage.setItem('tutor_verifiers_ts', String(now));
          }
        } catch (e) { console.error('Failed to fetch verifiers', e); }
      }
    };

    const fetchCities = async () => {
      const cached = localStorage.getItem('tutor_cities_cache');
      const cacheTimestamp = localStorage.getItem('tutor_cities_ts');
      const now = Date.now();
      if (cached && cacheTimestamp && now - parseInt(cacheTimestamp) < 24 * 60 * 60 * 1000) {
        setCitiesList(JSON.parse(cached));
      } else {
        try {
          const res = await getCities();
          if (res.data) {
            setCitiesList(res.data);
            localStorage.setItem('tutor_cities_cache', JSON.stringify(res.data));
            localStorage.setItem('tutor_cities_ts', String(now));
          }
        } catch (e) { console.error('Failed to fetch cities', e); }
      }
    };

    const fetchAreas = async () => {
      const cached = localStorage.getItem('tutor_areas_cache');
      const cacheTimestamp = localStorage.getItem('tutor_areas_ts');
      const now = Date.now();
      if (cached && cacheTimestamp && now - parseInt(cacheTimestamp) < 24 * 60 * 60 * 1000) {
        setAreasList(JSON.parse(cached));
      } else {
        try {
          const res = await getAreas();
          if (res.data) {
            setAreasList(res.data);
            localStorage.setItem('tutor_areas_cache', JSON.stringify(res.data));
            localStorage.setItem('tutor_areas_ts', String(now));
          }
        } catch (e) { console.error('Failed to fetch areas', e); }
      }
    };

    const fetchKpis = async () => {
      try {
        const [total, verified, underReview, rejected] = await Promise.all([
          getTutors({ page: 1, limit: 1 }),
          getTutors({ page: 1, limit: 1, verificationStatus: 'VERIFIED' }),
          getTutors({ page: 1, limit: 1, verificationStatus: 'UNDER_REVIEW' }),
          getTutors({ page: 1, limit: 1, verificationStatus: 'REJECTED' }),
        ]);
        setKpis({
          total: total.pagination.total,
          verified: verified.pagination.total,
          underReview: underReview.pagination.total,
          rejected: rejected.pagination.total,
        });
      } catch { /* silently fail */ }
    };

    fetchSubjects();
    fetchVerifiers();
    fetchCities();
    fetchAreas();
    fetchKpis();
  }, []);

  const { tutors, loading: loadingTutors, error: tutorsError, pagination, refetch } = useTutors({
    page: page + 1,
    limit: rowsPerPage,
    verificationStatus: tab === 0 ? 'PENDING' : undefined,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    teacherId: debouncedFilters.teacherId,
    name: debouncedFilters.name,
    email: debouncedFilters.email,
    phone: debouncedFilters.phone,
    preferredMode: debouncedFilters.preferredMode,
    city: debouncedFilters.city,
    area: debouncedFilters.area,
    grade: debouncedFilters.grade,
    board: debouncedFilters.board,
    subjects: debouncedFilters.subjects ? [debouncedFilters.subjects] : undefined,
  });

  const { options: cityOptions } = useOptions('CITY');
  const selectedCityOption = cityOptions.find(o => (o as any).label === filters.city);
  const { options: areaOptions } = useOptions(
    selectedCityOption?.value ? `AREA_${selectedCityOption.value}` : 'NONE',
    selectedCityOption?._id,
  );
  const { options: boardOptions } = useOptions('BOARD');
  const selectedBoardOption = boardOptions.find(o => (o as any).label === filters.board);
  const { options: gradeOptions } = useOptions(
    selectedBoardOption?.value ? `GRADE_${selectedBoardOption.value}` : 'GRADE',
    selectedBoardOption?._id,
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };
  const clearFilter = (field: string) => handleFilterChange(field, '');

  const handleSort = (columnId: string) => {
    const isAsc = sort.sortBy === columnId && sort.sortOrder === 'asc';
    setSort({ sortBy: columnId, sortOrder: isAsc ? 'desc' : 'asc' });
  };

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPendingVerifications();
      setPending(res.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to fetch pending verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleViewDoc = (doc: IDocument) => {
    setSelectedDoc(doc);
    setViewerOpen(true);
  };

  const handleVerifySubmit = (payload: {
    status: string; verificationNotes?: string; whatsappCommunityJoined?: boolean;
  }) => {
    if (!selectedTutor) return;
    setConfirmConfig({
      open: true,
      title: payload.status === 'VERIFIED' ? 'Approve Tutor' : 'Reject Tutor',
      message: `Are you sure you want to ${payload.status === 'VERIFIED' ? 'approve' : 'reject'} verification for ${selectedTutor.user.name}?`,
      severity: payload.status === 'VERIFIED' ? 'info' : 'error',
      action: async () => {
        try {
          setActionLoading(true);
          await updateVerificationStatus(
            selectedTutor.id, payload.status, payload.verificationNotes,
            payload.whatsappCommunityJoined,
          );
          setSnack({ open: true, message: 'Verification updated', severity: 'success' });
          setVerifyOpen(false);
          setSelectedTutor(null);
          setConfirmConfig(c => ({ ...c, open: false }));
          await fetchPending();
          await refetch();
        } catch (e: any) {
          setSnack({ open: true, message: e.message || 'Verification update failed', severity: 'error' });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>

      {/* ── Header ── */}
      <Box
        sx={{
          bgcolor: '#0F172A',
          color: '#fff',
          px: { xs: 2.5, md: 4 },
          pt: { xs: 3, md: 3.5 },
          pb: 0,
          borderRadius: { xs: 2, md: 2.5 },
          mb: 3,
          overflow: 'hidden',
        }}
      >
        {/* Title row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: { xs: '1.35rem', md: '1.6rem' },
                fontWeight: 800,
                color: '#F8FAFC',
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
              }}
            >
              Tutor Management
            </Typography>
            <Typography
              sx={{
                fontSize: '0.8125rem',
                color: alpha('#fff', 0.5),
                mt: 0.5,
              }}
            >
              Verify tutors, track performance, manage profiles
            </Typography>
          </Box>

          {/* Active filters pill */}
          {Object.values(filters).some(Boolean) && (
            <Chip
              label="Filters active"
              size="small"
              onDelete={() => setFilters({
                teacherId: '', name: '', email: '', phone: '', preferredMode: '',
                status: '', verifier: '', subjects: '', city: '', area: '', grade: '', board: '',
              })}
              sx={{
                bgcolor: alpha('#6366F1', 0.25),
                color: '#A5B4FC',
                borderColor: alpha('#6366F1', 0.4),
                border: '1px solid',
                '& .MuiChip-deleteIcon': { color: '#A5B4FC' },
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          )}
        </Box>

        {/* KPI strip */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: { xs: 1, sm: 1.5 },
            mb: 3,
          }}
        >
          <StatCard icon={<PeopleAltOutlinedIcon fontSize="small" />} label="Total Tutors" value={kpis.total} accent="#818CF8" />
          <StatCard icon={<VerifiedOutlinedIcon fontSize="small" />} label="Verified" value={kpis.verified} accent="#34D399" />
          <StatCard icon={<HourglassEmptyOutlinedIcon fontSize="small" />} label="Under Review" value={kpis.underReview} accent="#FBBF24" />
          <StatCard icon={<CancelOutlinedIcon fontSize="small" />} label="Pending / Rejected" value={pending.length + kpis.rejected} accent="#F87171" />
        </Box>

        {/* Tab bar — sits flush at the bottom of the header */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant={isMobile ? 'scrollable' : 'standard'}
          allowScrollButtonsMobile
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              color: alpha('#fff', 0.5),
              fontWeight: 600,
              fontSize: '0.8125rem',
              minHeight: 44,
              textTransform: 'none',
              letterSpacing: 0,
              transition: 'color 180ms ease-out',
              '&:hover': { color: alpha('#fff', 0.85) },
            },
            '& .Mui-selected': { color: '#fff !important' },
            '& .MuiTabs-indicator': {
              backgroundColor: '#6366F1',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                Pending Verifications
                {pending.length > 0 && (
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 20,
                      height: 20,
                      px: 0.75,
                      borderRadius: 10,
                      bgcolor: alpha('#F87171', 0.2),
                      color: '#FCA5A5',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {pending.length}
                  </Box>
                )}
              </Box>
            }
          />
          <Tab label="All Tutors" />
        </Tabs>
      </Box>

      {/* ── Mobile filter bar ── */}
      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Button
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setShowMobileFilters(p => !p)}
              variant={showMobileFilters ? 'contained' : 'outlined'}
              sx={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', textTransform: 'none' }}
            >
              Filters
            </Button>
            {Object.values(filters).some(Boolean) && (
              <Chip
                label="Clear all"
                size="small"
                onDelete={() => setFilters({
                  teacherId: '', name: '', email: '', phone: '', preferredMode: '',
                  status: '', verifier: '', subjects: '', city: '', area: '', grade: '', board: '',
                })}
                sx={{ fontWeight: 600, fontSize: '0.72rem' }}
              />
            )}
          </Box>
          <Collapse in={showMobileFilters}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                size="small" label="Name" value={filters.name}
                onChange={e => handleFilterChange('name', e.target.value)}
                InputProps={{ endAdornment: filters.name && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => clearFilter('name')}><ClearIcon sx={{ fontSize: '0.8rem' }} /></IconButton>
                  </InputAdornment>
                )}}
              />
              <TextField
                size="small" label="Phone" value={filters.phone}
                onChange={e => handleFilterChange('phone', e.target.value)}
                InputProps={{ endAdornment: filters.phone && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => clearFilter('phone')}><ClearIcon sx={{ fontSize: '0.8rem' }} /></IconButton>
                  </InputAdornment>
                )}}
              />
              <Autocomplete
                freeSolo size="small" options={cityOptions.map(o => o.label)} value={filters.city}
                onChange={(_e, v) => handleFilterChange('city', v || '')}
                onInputChange={(_e, v) => handleFilterChange('city', v)}
                renderInput={params => <TextField {...params} label="City" />}
              />
              <Autocomplete
                freeSolo size="small" options={areaOptions.map(o => o.label)} value={filters.area}
                onChange={(_e, v) => handleFilterChange('area', v || '')}
                onInputChange={(_e, v) => handleFilterChange('area', v)}
                disabled={!filters.city}
                renderInput={params => <TextField {...params} label="Area" />}
              />
              <Select
                size="small" value={filters.preferredMode} displayEmpty
                onChange={e => handleFilterChange('preferredMode', e.target.value as string)}
                sx={{ fontSize: '0.875rem' }}
              >
                <MenuItem value=""><em>Mode</em></MenuItem>
                <MenuItem value="ONLINE">Online</MenuItem>
                <MenuItem value="OFFLINE">Offline</MenuItem>
                <MenuItem value="BOTH">Both</MenuItem>
              </Select>
              <Select
                size="small" value={filters.status} displayEmpty
                onChange={e => handleFilterChange('status', e.target.value as string)}
                sx={{ fontSize: '0.875rem' }}
              >
                <MenuItem value=""><em>Status</em></MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="UNDER_REVIEW">Review</MenuItem>
                <MenuItem value="VERIFIED">Verified</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </Paper>
          </Collapse>
        </Box>
      )}

      {/* ── Mobile card list ── */}
      {isMobile && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
          {tab === 0 ? (
            loading ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <LoadingSpinner />
              </Paper>
            ) : error ? (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <ErrorAlert error={error} />
              </Paper>
            ) : pending.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{ p: 4, borderRadius: 2, textAlign: 'center', borderStyle: 'dashed' }}
              >
                <HourglassEmptyOutlinedIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No tutors pending verification
                </Typography>
              </Paper>
            ) : (
              pending.map(t => renderTutorCard(t, 'pending'))
            )
          ) : (
            loadingTutors ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <LoadingSpinner />
              </Paper>
            ) : (
              <>
                {tutors.map(t => renderTutorCard(t, 'all'))}
                {tutorsError && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <ErrorAlert error={tutorsError} />
                  </Paper>
                )}
              </>
            )
          )}
        </Box>
      )}

      {/* ── Desktop table ── */}
      {!isMobile && (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            width: '100%',
            overflowX: 'auto',
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Table size="small" sx={{ minWidth: 1100 }}>
            {/* Column headers */}
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: '#F8FAFC',
                  '& .MuiTableCell-root': {
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                    py: 1.25,
                  },
                }}
              >
                <TableCell sx={{ width: 44 }}>#</TableCell>
                <TableCell>
                  <TableSortLabel active={sort.sortBy === 'teacherId'} direction={sort.sortBy === 'teacherId' ? sort.sortOrder : 'asc'} onClick={() => handleSort('teacherId')} sx={sortLabelSx}>ID</TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel active={sort.sortBy === 'name'} direction={sort.sortBy === 'name' ? sort.sortOrder : 'asc'} onClick={() => handleSort('name')} sx={sortLabelSx}>Name</TableSortLabel>
                </TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Area</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>
                  <TableSortLabel active={sort.sortBy === 'classesAssigned'} direction={sort.sortBy === 'classesAssigned' ? sort.sortOrder : 'asc'} onClick={() => handleSort('classesAssigned')} sx={sortLabelSx}>Stats</TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel active={sort.sortBy === 'experienceHours'} direction={sort.sortBy === 'experienceHours' ? sort.sortOrder : 'asc'} onClick={() => handleSort('experienceHours')} sx={sortLabelSx}>Exp</TableSortLabel>
                </TableCell>
                <TableCell>Subjects</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Verifier</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>

              {/* Filter row */}
              <TableRow
                sx={{
                  bgcolor: '#FAFBFC',
                  '& .MuiTableCell-root': {
                    py: 0.75,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  },
                }}
              >
                <TableCell />
                <TableCell>
                  <TextField size="small" variant="standard" placeholder="ID" value={filters.teacherId}
                    onChange={e => handleFilterChange('teacherId', e.target.value)}
                    InputProps={{
                      sx: { fontSize: '0.8rem' },
                      endAdornment: filters.teacherId && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => clearFilter('teacherId')}>
                            <ClearIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField size="small" variant="standard" placeholder="Name" value={filters.name}
                    onChange={e => handleFilterChange('name', e.target.value)}
                    InputProps={{
                      sx: { fontSize: '0.8rem' },
                      endAdornment: filters.name && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => clearFilter('name')}>
                            <ClearIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField size="small" variant="standard" placeholder="Email" value={filters.email}
                    onChange={e => handleFilterChange('email', e.target.value)}
                    InputProps={{
                      sx: { fontSize: '0.8rem' },
                      endAdornment: filters.email && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => clearFilter('email')}>
                            <ClearIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField size="small" variant="standard" placeholder="Phone" value={filters.phone}
                    onChange={e => handleFilterChange('phone', e.target.value)}
                    InputProps={{
                      sx: { fontSize: '0.8rem', mt: 0.5 },
                      endAdornment: filters.phone && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => clearFilter('phone')}>
                            <ClearIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Autocomplete freeSolo size="small" options={cityOptions.map(o => o.label)} value={filters.city}
                    onChange={(_e, v) => handleFilterChange('city', v || '')}
                    onInputChange={(_e, v) => handleFilterChange('city', v)}
                    renderInput={params => (
                      <TextField {...params} variant="standard" placeholder="City" sx={{ '& .MuiInput-root': { fontSize: '0.8rem' } }} />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Autocomplete freeSolo size="small" options={areaOptions.map(o => o.label)} value={filters.area}
                    onChange={(_e, v) => handleFilterChange('area', v || '')}
                    onInputChange={(_e, v) => handleFilterChange('area', v)}
                    disabled={!filters.city}
                    renderInput={params => (
                      <TextField {...params} variant="standard" placeholder="Area" sx={{ '& .MuiInput-root': { fontSize: '0.8rem' } }} />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Select variant="standard" value={filters.preferredMode} displayEmpty
                    onChange={e => handleFilterChange('preferredMode', e.target.value as string)}
                    sx={{ fontSize: '0.8rem', width: '100%' }}
                  >
                    <MenuItem value=""><em>Mode</em></MenuItem>
                    <MenuItem value="ONLINE">Online</MenuItem>
                    <MenuItem value="OFFLINE">Offline</MenuItem>
                    <MenuItem value="BOTH">Both</MenuItem>
                  </Select>
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell>
                  <Autocomplete size="small"
                    options={subjectsList}
                    getOptionLabel={option => getOptionLabel(option)}
                    value={
                      subjectsList.find(s => s._id === filters.subjects) ||
                      subjectOptions.find(o => o._id === filters.subjects || o.value === filters.subjects) ||
                      null
                    }
                    onChange={(_e, v) => handleFilterChange('subjects', v ? (v._id || v.value) : '')}
                    renderInput={params => (
                      <TextField {...params} variant="standard" placeholder="Subject" sx={{ '& .MuiInput-root': { fontSize: '0.8rem' } }} />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Select variant="standard" value={filters.status} displayEmpty
                    onChange={e => handleFilterChange('status', e.target.value as string)}
                    sx={{ fontSize: '0.8rem', width: '100%' }}
                  >
                    <MenuItem value=""><em>Any</em></MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="UNDER_REVIEW">Review</MenuItem>
                    <MenuItem value="VERIFIED">Verified</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select variant="standard" value={filters.verifier} displayEmpty
                    onChange={e => handleFilterChange('verifier', e.target.value as string)}
                    sx={{ fontSize: '0.8rem', width: '100%' }}
                  >
                    <MenuItem value=""><em>Any</em></MenuItem>
                    {verifiersList.map(v => (
                      <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>

            {/* Body */}
            <TableBody>
              {tab === 0 && (
                <>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={13} align="center" sx={{ py: 6 }}>
                        <LoadingSpinner />
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={13} align="center">
                        <ErrorAlert error={error} />
                      </TableCell>
                    </TableRow>
                  ) : pending.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} align="center" sx={{ py: 8 }}>
                        <HourglassEmptyOutlinedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                        <Typography variant="body2" color="text.secondary">
                          No pending verifications
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pending.map((t, idx) => (
                      <TableRow
                        key={t.id}
                        hover
                        sx={{
                          '&:hover': { bgcolor: alpha('#6366F1', 0.03) },
                          transition: 'background 120ms ease-out',
                        }}
                      >
                        <TableCell>
                          <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700 }}>
                            {idx + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                            {t.teacherId || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="subtitle2"
                            component={RouterLink}
                            to={`/tutor-profile/${t.id || (t as any)._id}`}
                            sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                          >
                            {t.user.name}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {t.documents?.length || 0} docs
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{t.user.email}</Typography>
                          <Typography variant="caption" color="text.secondary">{t.user.phone || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{t.user.city || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 110 }}
                            title={(t.preferredLocations || []).join(', ')}>
                            {(t.preferredLocations || []).join(', ') || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{t.preferredMode || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{t.classesAssigned} cls</Typography>
                          <Typography variant="caption" color="text.secondary">{t.demosApproved} demos</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{t.experienceHours} hrs</Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 180 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }} noWrap title={formatSubjectDisplay(t.subjects)}>
                            {formatSubjectDisplay(t.subjects, 2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <VerificationStatusChip status={t.verificationStatus} />
                        </TableCell>
                        <TableCell>
                          {t.verifiedBy ? (
                            <MuiLink component={RouterLink} to={`/manager-profile/${(t.verifiedBy as any).id || (t.verifiedBy as any)._id}`}
                              sx={{ color: 'primary.main', textDecoration: 'none', fontSize: '0.8rem', '&:hover': { textDecoration: 'underline' } }}>
                              {t.verifiedBy.name}
                            </MuiLink>
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            component={RouterLink}
                            to={`/tutors/verify/${t.id || (t as any)._id}`}
                            sx={{
                              borderRadius: 1.5,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              transition: 'transform 160ms ease-out',
                              '&:active': { transform: 'scale(0.96)' },
                            }}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </>
              )}

              {tab === 1 && (
                <>
                  {loadingTutors ? (
                    <TableRow>
                      <TableCell colSpan={13} align="center" sx={{ py: 6 }}>
                        <LoadingSpinner />
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {tutors.length === 0 && !tutorsError && (
                        <TableRow>
                          <TableCell colSpan={13} align="center" sx={{ py: 8 }}>
                            <PeopleAltOutlinedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                            <Typography variant="body2" color="text.secondary">No tutors found</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                      {tutors.map((t, idx) => (
                        <TableRow
                          key={t.id}
                          hover
                          sx={{
                            '&:hover': { bgcolor: alpha('#6366F1', 0.03) },
                            transition: 'background 120ms ease-out',
                          }}
                        >
                          <TableCell>
                            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700 }}>
                              {page * rowsPerPage + idx + 1}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                              {t.teacherId || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                              <Avatar
                                src={t.documents?.find(d => d.documentType === 'PROFILE_PHOTO')?.documentUrl}
                                sx={{ width: 30, height: 30, fontSize: '0.75rem', fontWeight: 700 }}
                                imgProps={{ crossOrigin: 'anonymous' }}
                              >
                                {(t.user?.name || 'T').charAt(0).toUpperCase()}
                              </Avatar>
                              <MuiLink
                                variant="subtitle2"
                                component={RouterLink}
                                to={`/tutor-profile/${(t as any).id || (t as any)._id}`}
                                sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                              >
                                {t.user?.name || 'Unknown'}
                              </MuiLink>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{t.user?.email}</Typography>
                            <Typography variant="caption" color="text.secondary">{t.user?.phone || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{t.user?.city || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 110 }}
                              title={(t.preferredLocations || []).filter(l => l !== t.user?.city).join(', ')}>
                              {(t.preferredLocations || []).filter(l => l !== t.user?.city).join(', ') || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{t.preferredMode || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{t.classesAssigned} cls</Typography>
                            <Typography variant="caption" color="text.secondary">{t.demosApproved} demos</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{t.experienceHours} hrs</Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 180 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }} noWrap title={formatSubjectDisplay(t.subjects)}>
                              {formatSubjectDisplay(t.subjects, 2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <VerificationStatusChip status={t.verificationStatus} />
                          </TableCell>
                          <TableCell>
                            {t.verifiedBy ? (
                              <MuiLink component={RouterLink} to={`/manager-profile/${(t.verifiedBy as any).id || (t.verifiedBy as any)._id}`}
                                sx={{ color: 'primary.main', textDecoration: 'none', fontSize: '0.8rem', '&:hover': { textDecoration: 'underline' } }}>
                                {t.verifiedBy.name}
                              </MuiLink>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              component={RouterLink}
                              to={`/tutors/verify/${(t as any).id || (t as any)._id}`}
                              sx={{
                                borderRadius: 1.5,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                transition: 'transform 160ms ease-out',
                                '&:active': { transform: 'scale(0.96)' },
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {tutorsError && (
                        <TableRow>
                          <TableCell colSpan={13} align="center">
                            <ErrorAlert error={tutorsError} />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {tab === 1 && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={pagination?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      )}

      {/* Dialogs / Modals */}
      <Dialog open={docsOpen} onClose={() => setDocsOpen(false)} maxWidth="md" fullWidth>
        <DialogContent>
          {selectedTutor && (
            <DocumentViewer documents={selectedTutor?.documents || []} onView={handleViewDoc} canDelete={false} />
          )}
        </DialogContent>
      </Dialog>

      <DocumentViewerModal open={viewerOpen} onClose={() => setViewerOpen(false)} document={selectedDoc} />
      <VerificationModal open={verifyOpen} onClose={() => setVerifyOpen(false)} tutor={selectedTutor} onSubmit={handleVerifySubmit} />
      <SnackbarNotification open={snack.open} message={snack.message} severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} />
      <ConfirmDialog
        open={confirmConfig.open}
        onClose={() => setConfirmConfig(c => ({ ...c, open: false }))}
        onConfirm={confirmConfig.action}
        title={confirmConfig.title}
        message={confirmConfig.message}
        severity={confirmConfig.severity}
        loading={actionLoading}
      />
    </Container>
  );
}
