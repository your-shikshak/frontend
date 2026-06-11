import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, Tabs, Tab, Dialog, DialogContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TablePagination, TextField, TableSortLabel, MenuItem, Select, InputAdornment, IconButton, Link as MuiLink, Avatar, Card, CardContent, Stack, useMediaQuery, Autocomplete } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
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
  getCities,
  getAreas,
} from '../../services/tutorService';
import { useTheme } from '@mui/material/styles';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import { getLeafSubjectLabel, getOptionLabel, getLeafSubjectList } from '../../utils/subjectUtils';

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
  const [confirmConfig, setConfirmConfig] = useState<{ open: boolean; title: string; message: string; action: () => void; severity: 'info' | 'error' | 'warning' }>({ open: false, title: '', message: '', action: () => { }, severity: 'info' });
  const [actionLoading, setActionLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [filters, setFilters] = useState({
    teacherId: '',
    name: '',
    email: '',
    phone: '',
    preferredMode: '',
    status: '',
    verifier: '',
    subjects: '',
    city: '',
    area: '',
    grade: '',
    board: ''
  });

  const [sort, setSort] = useState<{ sortBy: string; sortOrder: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [verifiersList, setVerifiersList] = useState<{ _id: string; name: string }[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [areasList, setAreasList] = useState<string[]>([]);

  const { options: subjectOptions } = useOptions('SUBJECT');

  const formatSubjectDisplay = (subjects: any[], limit?: number) => {
    if (!subjects || subjects.length === 0) return '-';
    const leafSubjects = getLeafSubjectList(subjects);
    if (limit && leafSubjects.length > limit) {
      return leafSubjects.slice(0, limit).join(', ') + '...';
    }
    return leafSubjects.join(', ');
  };

  const renderTutorCard = (t: ITutor, mode: 'pending' | 'all') => {
    const id = (t as any).id || (t as any)._id;
    const name = t.user?.name || 'Unknown Tutor';
    const email = t.user?.email || '-';
    const phone = t.user?.phone || '-';
    const locations = (t.preferredLocations || []).join(', ');

    return (
      <Card
        key={id}
        variant="outlined"
        sx={{
          borderRadius: 2,
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ pb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar src={t.documents?.find(d => d.documentType === 'PROFILE_PHOTO')?.documentUrl} sx={{ width: 44, height: 44 }}>
              {(name || 'T').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                component={RouterLink}
                to={`/tutor-profile/${id}`}
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
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

          <Box sx={{ mt: 1.25 }}>
            <Typography variant="body2">
              <strong>Mode:</strong> {t.preferredMode || '-'}
            </Typography>
            <Typography variant="body2">
              <strong>City:</strong> {t.user?.city || '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              <strong>Areas:</strong> {(t.preferredLocations || []).filter(l => l !== t.user?.city).join(', ') || '-'}
            </Typography>
          </Box>

          <Box sx={{ mt: 1.25 }}>
            <Typography variant="body2">
              <strong>Stats:</strong> {t.classesAssigned} Classes, {t.demosApproved} Demos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Exp:</strong> {t.experienceHours} hrs
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            <strong>Subjects:</strong> {formatSubjectDisplay(t.subjects)}
          </Typography>

          <Stack spacing={1} sx={{ mt: 2 }}>
            <Button
              fullWidth
              size="small"
              variant="contained"
              component={RouterLink}
              to={mode === 'pending' ? `/tutors/verify/${id}` : `/tutors/verify/${id}`}
            >
              {mode === 'pending' ? 'Details' : 'View'}
            </Button>
          </Stack>
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
          // Update cache but we bypass it for now to ensure fresh data
          localStorage.setItem('tutor_subjects_cache', JSON.stringify(res.data));
          localStorage.setItem('tutor_subjects_ts', String(Date.now()));
        }
      } catch (e) {
        console.error("Failed to fetch subjects", e);
      }
    };

    const fetchVerifiers = async () => {
      // Check cache first
      const cached = localStorage.getItem('tutor_verifiers_cache');
      const cacheTimestamp = localStorage.getItem('tutor_verifiers_ts');

      const now = Date.now();
      if (cached && cacheTimestamp && (now - parseInt(cacheTimestamp) < 24 * 60 * 60 * 1000)) {
        setVerifiersList(JSON.parse(cached));
      } else {
        try {
          const res = await getVerifiers();
          if (res.data) {
            setVerifiersList(res.data);
            localStorage.setItem('tutor_verifiers_cache', JSON.stringify(res.data));
            localStorage.setItem('tutor_verifiers_ts', String(now));
          }
        } catch (e) {
          console.error("Failed to fetch verifiers", e);
        }
      }
    };

    const fetchCities = async () => {
      // Check cache first
      const cached = localStorage.getItem('tutor_cities_cache');
      const cacheTimestamp = localStorage.getItem('tutor_cities_ts');

      const now = Date.now();
      if (cached && cacheTimestamp && (now - parseInt(cacheTimestamp) < 24 * 60 * 60 * 1000)) {
        setCitiesList(JSON.parse(cached));
      } else {
        try {
          const res = await getCities();
          if (res.data) {
            setCitiesList(res.data);
            localStorage.setItem('tutor_cities_cache', JSON.stringify(res.data));
            localStorage.setItem('tutor_cities_ts', String(now));
          }
        } catch (e) {
          console.error("Failed to fetch cities", e);
        }
      }
    };

    const fetchAreas = async () => {
      // Check cache first
      const cached = localStorage.getItem('tutor_areas_cache');
      const cacheTimestamp = localStorage.getItem('tutor_areas_ts');

      const now = Date.now();
      if (cached && cacheTimestamp && (now - parseInt(cacheTimestamp) < 24 * 60 * 60 * 1000)) {
        setAreasList(JSON.parse(cached));
      } else {
        try {
          const res = await getAreas();
          if (res.data) {
            setAreasList(res.data);
            localStorage.setItem('tutor_areas_cache', JSON.stringify(res.data));
            localStorage.setItem('tutor_areas_ts', String(now));
          }
        } catch (e) {
          console.error("Failed to fetch areas", e);
        }
      }
    };

    fetchSubjects();
    fetchVerifiers();
    fetchCities();
    fetchAreas();
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
    subjects: debouncedFilters.subjects ? [debouncedFilters.subjects] : undefined
  });

  // Use Options hook for dropdowns
  const { options: cityOptions } = useOptions('CITY');

  // Find selected city ID to fetch areas
  const selectedCityValue = filters.city;
  const selectedCityOption = cityOptions.find(o => (o as any).label === selectedCityValue);
  const { options: areaOptions } = useOptions(selectedCityOption?.value ? `AREA_${selectedCityOption.value}` : 'NONE', selectedCityOption?._id);
  const { options: boardOptions } = useOptions('BOARD');
  // Find selected board ID to fetch classes (grades)
  const selectedBoardValue = filters.board;
  const selectedBoardOption = boardOptions.find(o => (o as any).label === selectedBoardValue);
  const { options: gradeOptions } = useOptions(selectedBoardOption?.value ? `GRADE_${selectedBoardOption.value}` : 'GRADE', selectedBoardOption?._id);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const clearFilter = (field: string) => {
    handleFilterChange(field, '');
  };

  const handleSort = (columnId: string) => {
    const isAsc = sort.sortBy === columnId && sort.sortOrder === 'asc';
    setSort({
      sortBy: columnId,
      sortOrder: isAsc ? 'desc' : 'asc'
    });
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

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

  // Unused handlers removed
  // const handleViewDocs = (t: ITutor) => { ... }
  // const handleReview = (t: ITutor) => { ... }

  const handleVerifySubmit = (payload: { status: string; verificationNotes?: string; whatsappCommunityJoined?: boolean }) => {
    if (!selectedTutor) return;

    setConfirmConfig({
      open: true,
      title: payload.status === 'VERIFIED' ? 'Approve Tutor' : 'Reject Tutor',
      message: `Are you sure you want to ${payload.status === 'VERIFIED' ? 'approve' : 'reject'} verification for ${selectedTutor.user.name}?`,
      severity: payload.status === 'VERIFIED' ? 'info' : 'error',
      action: async () => {
        try {
          setActionLoading(true);
          await updateVerificationStatus(selectedTutor.id, payload.status, payload.verificationNotes, payload.whatsappCommunityJoined);
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
      }
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4A148C 0%, #311B92 100%)', // Deep Purple theme
          color: 'white',
          py: { xs: 4, md: 5 },
          px: { xs: 2, md: 4 },
          borderRadius: { xs: 0, md: 3 },
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, mb: 3 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Tutor Management
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
            Oversee tutor verifications, track performance stats, and manage tutor profiles.
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant={isMobile ? 'scrollable' : 'standard'}
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 600 },
              '& .Mui-selected': { color: '#fff !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#fff', height: 4 }
            }}
          >
            <Tab label={`Pending Verifications (${pending.length})`} />
            <Tab label="All Tutors" />
          </Tabs>
        </Box>

        {/* Abstract shapes */}
        <Box sx={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -50,
          left: 100,
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)',
        }} />
      </Box>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
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
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography>No tutors pending verification.</Typography>
              </Paper>
            ) : (
              pending.map((t) => renderTutorCard(t, 'pending'))
            )
          ) : (
            loadingTutors ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <LoadingSpinner />
              </Paper>
            ) : (
              <>
                {tutors.map((t) => renderTutorCard(t, 'all'))}
                {tutorsError ? (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <ErrorAlert error={tutorsError} />
                  </Paper>
                ) : null}
              </>
            )
          )}
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            width: '100%',
            overflowX: 'auto',
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100', '& .MuiTableCell-root': { color: 'text.primary', fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' } }}>
                <TableCell sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active={sort.sortBy === 'teacherId'}
                    direction={sort.sortBy === 'teacherId' ? sort.sortOrder : 'asc'}
                    onClick={() => handleSort('teacherId')}
                    sx={{
                      '&.MuiTableSortLabel-root': { color: 'inherit' },
                      '&.MuiTableSortLabel-root:hover': { color: 'inherit' },
                      '&.Mui-active': { color: 'inherit', '& .MuiTableSortLabel-icon': { color: 'inherit !important' } },
                    }}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active={sort.sortBy === 'name'}
                    direction={sort.sortBy === 'name' ? sort.sortOrder : 'asc'}
                    onClick={() => handleSort('name')}
                    sx={{
                      '&.MuiTableSortLabel-root': { color: 'inherit' },
                      '&.MuiTableSortLabel-root:hover': { color: 'inherit' },
                      '&.Mui-active': { color: 'inherit', '& .MuiTableSortLabel-icon': { color: 'inherit !important' } },
                    }}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Contact Info</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>City</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Area</TableCell>

                <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active={sort.sortBy === 'classesAssigned'}
                    direction={sort.sortBy === 'classesAssigned' ? sort.sortOrder : 'asc'}
                    onClick={() => handleSort('classesAssigned')}
                    sx={{
                      '&.MuiTableSortLabel-root': { color: 'inherit' },
                      '&.MuiTableSortLabel-root:hover': { color: 'inherit' },
                      '&.Mui-active': { color: 'inherit', '& .MuiTableSortLabel-icon': { color: 'inherit !important' } },
                    }}
                  >
                    Stats
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active={sort.sortBy === 'experienceHours'}
                    direction={sort.sortBy === 'experienceHours' ? sort.sortOrder : 'asc'}
                    onClick={() => handleSort('experienceHours')}
                    sx={{
                      '&.MuiTableSortLabel-root': { color: 'inherit' },
                      '&.MuiTableSortLabel-root:hover': { color: 'inherit' },
                      '&.Mui-active': { color: 'inherit', '& .MuiTableSortLabel-icon': { color: 'inherit !important' } },
                    }}
                  >
                    Exp
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Subjects</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Verifier</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
              {/* Filter Row */}
              <TableRow sx={{ bgcolor: 'background.paper' }}>
                <TableCell>
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder="Filter ID"
                    value={filters.teacherId}
                    onChange={(e) => handleFilterChange('teacherId', e.target.value)}
                    InputProps={{
                      sx: { fontSize: '0.8125rem' },
                      endAdornment: filters.teacherId && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => clearFilter('teacherId')}><ClearIcon sx={{ fontSize: '0.8rem' }} /></IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder="Filter Name"
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    InputProps={{
                      sx: { fontSize: '0.8125rem' },
                      endAdornment: filters.name && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => clearFilter('name')}><ClearIcon sx={{ fontSize: '0.8rem' }} /></IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder="Email"
                    value={filters.email}
                    onChange={(e) => handleFilterChange('email', e.target.value)}
                    InputProps={{
                      sx: { fontSize: '0.8125rem' },
                      endAdornment: filters.email && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => clearFilter('email')}><ClearIcon sx={{ fontSize: '0.8rem' }} /></IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder="Phone"
                    value={filters.phone}
                    onChange={(e) => handleFilterChange('phone', e.target.value)}
                    InputProps={{
                      sx: { fontSize: '0.8125rem', mt: 0.5 },
                      endAdornment: filters.phone && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => clearFilter('phone')}><ClearIcon sx={{ fontSize: '0.8rem' }} /></IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Autocomplete
                    freeSolo
                    size="small"
                    options={cityOptions.map(o => o.label)}
                    value={filters.city}
                    onChange={(_e, newValue) => handleFilterChange('city', newValue || '')}
                    onInputChange={(_e, newInputValue) => handleFilterChange('city', newInputValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="standard"
                        placeholder="City"
                        sx={{ '& .MuiInput-root': { fontSize: '0.8125rem' } }}
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Autocomplete
                    freeSolo
                    size="small"
                    options={areaOptions.map(o => o.label)}
                    value={filters.area}
                    onChange={(_e, newValue) => handleFilterChange('area', newValue || '')}
                    onInputChange={(_e, newInputValue) => handleFilterChange('area', newInputValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="standard"
                        placeholder="Area"
                        sx={{ '& .MuiInput-root': { fontSize: '0.8125rem' } }}
                      />
                    )}
                    disabled={!filters.city}
                  />
                </TableCell>

                <TableCell>
                  <Select
                    variant="standard"
                    value={filters.preferredMode}
                    onChange={(e) => handleFilterChange('preferredMode', e.target.value as string)}
                    displayEmpty
                    sx={{ fontSize: '0.8125rem', width: '100%' }}
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
                  <Autocomplete
                    size="small"
                    options={subjectsList}
                    getOptionLabel={(option) => getOptionLabel(option)}
                    value={
                      subjectsList.find(s => s._id === filters.subjects) ||
                      subjectOptions.find(o => o._id === filters.subjects || o.value === filters.subjects) ||
                      null
                    }
                    onChange={(_e, newValue) => handleFilterChange('subjects', newValue ? (newValue._id || newValue.value) : '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="standard"
                        placeholder="Subject"
                        sx={{ '& .MuiInput-root': { fontSize: '0.8125rem' } }}
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    variant="standard"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value as string)}
                    displayEmpty
                    sx={{ fontSize: '0.8125rem', width: '100%' }}
                  >
                    <MenuItem value=""><em>Any Status</em></MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="UNDER_REVIEW">Review</MenuItem>
                    <MenuItem value="VERIFIED">Verified</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    variant="standard"
                    value={filters.verifier}
                    onChange={(e) => handleFilterChange('verifier', e.target.value as string)}
                    displayEmpty
                    sx={{ fontSize: '0.8125rem', width: '100%' }}
                  >
                    <MenuItem value=""><em>Any Verifier</em></MenuItem>
                    {verifiersList.map((v) => (
                      <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {tab === 0 && (
                <>
                  {loading ? (
                    <TableRow><TableCell colSpan={13} align="center"><LoadingSpinner /></TableCell></TableRow>
                  ) : error ? (
                    <TableRow><TableCell colSpan={13} align="center"><ErrorAlert error={error} /></TableCell></TableRow>
                  ) : pending.length === 0 ? (
                    <TableRow><TableCell colSpan={13} align="center" sx={{ py: 8 }}><Typography color="text.secondary">No pending verifications</Typography></TableCell></TableRow>
                  ) : (
                    pending.map((t) => (
                      <TableRow key={t.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{t.teacherId || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              component={RouterLink}
                              to={`/tutor-profile/${t.id || (t as any)._id}`}
                              sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                            >
                              {t.user.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">DOCS: {t.documents?.length || 0}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{t.user.email}</Typography>
                          <Typography variant="caption" color="text.secondary">{t.user.phone || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{t.user.city || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 120 }} title={(t.preferredLocations || []).join(', ')}>
                            {(t.preferredLocations || []).join(', ')}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">{t.preferredMode || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{t.classesAssigned} Classes</Typography>
                          <Typography variant="caption" color="text.secondary">{t.demosApproved} Demos</Typography>
                        </TableCell>
                        <TableCell>{t.experienceHours} hrs</TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" noWrap title={formatSubjectDisplay(t.subjects)}>
                            {formatSubjectDisplay(t.subjects, 2)}
                          </Typography>
                        </TableCell>
                        <TableCell><VerificationStatusChip status={t.verificationStatus} /></TableCell>
                        <TableCell>
                          {t.verifiedBy ? (
                            <MuiLink component={RouterLink} to={`/manager-profile/${(t.verifiedBy as any).id || (t.verifiedBy as any)._id}`} sx={{ color: 'primary.main', textDecoration: 'none' }}>
                              {t.verifiedBy.name}
                            </MuiLink>
                          ) : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end" gap={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              component={RouterLink}
                              to={`/tutors/verify/${t.id || (t as any)._id}`}
                            >
                              Details
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )
                  }
                </>
              )}

              {tab === 1 && (
                <>
                  {loadingTutors ? (
                    <TableRow><TableCell colSpan={13} align="center"><LoadingSpinner /></TableCell></TableRow>
                  ) : (
                    <>
                      {tutors.map((t) => (
                        <TableRow key={t.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{t.teacherId || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar
                                src={t.documents?.find(d => d.documentType === 'PROFILE_PHOTO')?.documentUrl}
                                imgProps={{
                                  crossOrigin: 'anonymous',
                                  onError: () => console.error('Tutor Table Avatar Error', t.user?.name)
                                }}
                              >
                                {(t.user?.name || 'T').charAt(0).toUpperCase()}
                              </Avatar>
                              <MuiLink
                                variant="subtitle2"
                                component={RouterLink}
                                to={`/tutor-profile/${(t as any).id || (t as any)._id}`}
                                sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                              >
                                {t.user?.name || 'Unknown Tutor'}
                              </MuiLink>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{t.user?.email}</Typography>
                            <Typography variant="caption" color="text.secondary">{t.user?.phone || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{t.user?.city || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 120 }} title={(t.preferredLocations || []).filter(l => l !== t.user?.city).join(', ')}>
                              {(t.preferredLocations || []).filter(l => l !== t.user?.city).join(', ')}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2">{t.preferredMode || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{t.classesAssigned} Classes</Typography>
                            <Typography variant="caption" color="text.secondary">{t.demosApproved} Demos</Typography>
                          </TableCell>
                          <TableCell>{t.experienceHours} hrs</TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography variant="body2" noWrap title={formatSubjectDisplay(t.subjects)}>
                              {formatSubjectDisplay(t.subjects, 2)}
                            </Typography>
                          </TableCell>
                          <TableCell><VerificationStatusChip status={t.verificationStatus} /></TableCell>
                          <TableCell>
                            {t.verifiedBy ? (
                              <MuiLink component={RouterLink} to={`/manager-profile/${(t.verifiedBy as any).id || (t.verifiedBy as any)._id}`} sx={{ color: 'primary.main', textDecoration: 'none' }}>
                                {t.verifiedBy.name}
                              </MuiLink>
                            ) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              component={RouterLink}
                              to={`/tutors/verify/${(t as any).id || (t as any)._id}`}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {tutorsError && (
                        <TableRow><TableCell colSpan={10} align="center"><ErrorAlert error={tutorsError} /></TableCell></TableRow>
                      )}
                    </>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 1 && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={pagination?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}

      <Dialog open={docsOpen} onClose={() => setDocsOpen(false)} maxWidth="md" fullWidth>
        <DialogContent>
          {selectedTutor && (
            <DocumentViewer
              documents={selectedTutor?.documents || []}
              onView={handleViewDoc}
              canDelete={false}
            />
          )}
        </DialogContent>
      </Dialog>

      <DocumentViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        document={selectedDoc}
      />

      <VerificationModal open={verifyOpen} onClose={() => setVerifyOpen(false)} tutor={selectedTutor} onSubmit={handleVerifySubmit} />
      <SnackbarNotification open={snack.open} message={snack.message} severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} />

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

