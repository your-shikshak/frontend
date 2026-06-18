import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
  TableSortLabel,
  Paper,
  Stack,
  Divider,
  IconButton,
  Checkbox,
  CircularProgress,
  Link,
  InputAdornment,
  MenuItem,
  Avatar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ErrorAlert from '../../components/common/ErrorAlert';
import SnackbarNotification from '../../components/common/SnackbarNotification';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CreateCoordinatorModal from '../../components/admin/CreateCoordinatorModal';
import EditCoordinatorModal from '../../components/admin/EditCoordinatorModal';
import coordinatorService from '../../services/coordinatorService';
import { ICoordinator, IUser } from '../../types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const T = `all 150ms ${EASE}`;

// ─── Avatar colour ────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#2D68C4', '#0E7490', '#059669', '#7C3AED', '#D97706', '#E11D48'];
const avatarColor = (name = '') =>
  AVATAR_COLORS[(name.charCodeAt(0) || 65) % AVATAR_COLORS.length];
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// ─── Inline chips ─────────────────────────────────────────────────────────────
const StatusPill: React.FC<{ active: boolean }> = ({ active }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      px: 1.25,
      py: 0.4,
      borderRadius: '6px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.3,
      bgcolor: active ? '#DCFCE7' : '#F1F5F9',
      color: active ? '#15803D' : '#64748B',
    }}
  >
    <Box
      component="span"
      sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: active ? '#16A34A' : '#94A3B8' }}
    />
    {active ? 'Active' : 'Inactive'}
  </Box>
);

const CapacityPill: React.FC<{ value: number }> = ({ value }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      px: 1.25,
      py: 0.4,
      borderRadius: '6px',
      fontSize: 11,
      fontWeight: 700,
      bgcolor: value > 0 ? '#DCFCE7' : '#FEE2E2',
      color: value > 0 ? '#15803D' : '#DC2626',
    }}
  >
    {value > 0 ? `+${value} open` : 'Full'}
  </Box>
);

const ScorePill: React.FC<{ score: number }> = ({ score }) => {
  const good = score > 80;
  const ok = score > 60;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        px: 1.25,
        py: 0.4,
        borderRadius: '6px',
        fontSize: 11,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        bgcolor: good ? '#DCFCE7' : ok ? '#FEF9C3' : '#FEE2E2',
        color: good ? '#15803D' : ok ? '#A16207' : '#DC2626',
      }}
    >
      {score}
    </Box>
  );
};

const SpecTag: React.FC<{ label: string }> = ({ label }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      px: 1,
      py: 0.25,
      borderRadius: '5px',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: 0.2,
      bgcolor: '#EFF6FF',
      color: '#2D68C4',
      border: '1px solid #BFDBFE',
    }}
  >
    {label}
  </Box>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const CoordinatorsManagementPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [coordinators, setCoordinators] = useState<ICoordinator[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState<ICoordinator | null>(null);
  const [coordinatorToDelete, setCoordinatorToDelete] = useState<ICoordinator | null>(null);
  const [selectedCoordinators, setSelectedCoordinators] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean; message: string; severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    search: '',
    isActive: 'all' as 'all' | 'active' | 'inactive',
    hasCapacity: 'all' as 'all' | 'yes' | 'no',
    specialization: '',
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedFilters(filters); setPage(0); }, 500);
    return () => clearTimeout(t);
  }, [filters]);

  const loadCoordinators = useCallback(async (p = page, l = rowsPerPage) => {
    setLoading(true);
    try {
      const isActiveValue = debouncedFilters.isActive === 'all' ? undefined : debouncedFilters.isActive === 'active';
      const hasCapacityValue = debouncedFilters.hasCapacity === 'all' ? undefined : debouncedFilters.hasCapacity === 'yes';
      const res = await coordinatorService.getCoordinators(
        p + 1, l,
        isActiveValue, hasCapacityValue,
        sortBy, sortOrder,
        undefined, undefined, undefined,
        debouncedFilters.specialization || undefined,
        debouncedFilters.search || undefined,
      );
      setCoordinators(res.data as unknown as ICoordinator[]);
      setTotal(res.pagination.total);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load coordinators');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedFilters, sortBy, sortOrder]);

  const loadEligibleUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data } = await coordinatorService.getEligibleCoordinatorUsers();
      const mapped = (data as any[]).map((u: any) => ({
        id: u.id || u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as IUser[];
      setUsers(mapped);
    } catch {
      setError('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => { loadEligibleUsers(); }, [loadEligibleUsers]);
  useEffect(() => { loadCoordinators(page, rowsPerPage); }, [loadCoordinators, page, rowsPerPage]);

  const handleSort = (col: string) => {
    setSortOrder(sortBy === col && sortOrder === 'asc' ? 'desc' : 'asc');
    setSortBy(col);
  };

  const handleCreateCoordinator = useCallback(async (payload: { userId: string; maxClassCapacity?: number; specialization?: string[] }) => {
    try {
      await coordinatorService.createCoordinator(payload);
      setSnackbar({ open: true, message: 'Coordinator created', severity: 'success' });
      setCreateModalOpen(false);
      loadCoordinators();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to create coordinator';
      setSnackbar({ open: true, message: msg, severity: 'error' });
      throw e;
    }
  }, [loadCoordinators]);

  const handleEditCoordinator = useCallback(async (id: string, data: { maxClassCapacity?: number; specialization?: string[]; isActive?: boolean }) => {
    try {
      await coordinatorService.updateCoordinator(id, data);
      setSnackbar({ open: true, message: 'Coordinator updated', severity: 'success' });
      setEditModalOpen(false);
      setSelectedCoordinator(null);
      loadCoordinators();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to update coordinator';
      setSnackbar({ open: true, message: msg, severity: 'error' });
      throw e;
    }
  }, [loadCoordinators]);

  const handleDeleteCoordinator = useCallback(async (id: string) => {
    try {
      setConfirmLoading(true);
      await coordinatorService.deleteCoordinator(id);
      setSnackbar({ open: true, message: 'Coordinator deleted', severity: 'success' });
      setDeleteDialogOpen(false);
      setCoordinatorToDelete(null);
      const nextPage = coordinators.length === 1 && page > 0 ? page - 1 : page;
      await loadCoordinators(nextPage, rowsPerPage);
      setPage(nextPage);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Cannot delete coordinator with active classes';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setConfirmLoading(false);
    }
  }, [loadCoordinators, coordinators.length, page, rowsPerPage]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSelectedCoordinators(e.target.checked ? coordinators.map((c) => c.id) : []);
  const handleSelectOne = (id: string) =>
    setSelectedCoordinators((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    let success = 0; let failed = 0;
    for (const id of selectedCoordinators) {
      try { await coordinatorService.deleteCoordinator(id); success++; }
      catch { failed++; }
    }
    setBulkLoading(false);
    setBulkDialogOpen(false);
    setSelectedCoordinators([]);
    await loadCoordinators(page, rowsPerPage);
    setSnackbar({ open: true, message: `Deleted ${success}.${failed ? ` ${failed} failed.` : ''}`, severity: failed ? 'info' : 'success' });
  };

  const totalPages = Math.ceil(total / rowsPerPage) || 1;

  // KPIs derived from loaded data
  const activeCount = useMemo(() => coordinators.filter((c) => c.isActive).length, [coordinators]);
  const totalActiveClasses = useMemo(() => coordinators.reduce((s, c) => s + (c.activeClassesCount || 0), 0), [coordinators]);
  const totalAvailable = useMemo(() => coordinators.reduce((s, c) => s + Math.max(0, c.availableCapacity || 0), 0), [coordinators]);

  const hasFilters = filters.search || filters.isActive !== 'all' || filters.hasCapacity !== 'all' || filters.specialization;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: '#1C3556',
          px: { xs: 2.5, md: 4 },
          pt: { xs: 3, md: 3.5 },
          pb: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Top row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 800, letterSpacing: -0.6, color: '#fff', lineHeight: 1.15 }}>
              Coordinators
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', mt: 0.4, fontWeight: 500 }}>
              Track capacity, active classes and team performance
            </Typography>
          </Box>

          <Box display="flex" gap={1.25} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<VerifiedUserIcon sx={{ fontSize: '15px !important' }} />}
              onClick={() => navigate('/admin/verify-coordinators')}
              sx={{
                fontSize: 13,
                fontWeight: 700,
                px: 2,
                py: 0.85,
                borderRadius: '10px',
                color: 'rgba(255,255,255,0.8)',
                borderColor: 'rgba(255,255,255,0.25)',
                transition: T,
                '@media (hover: hover) and (pointer: fine)': {
                  '&:hover': { borderColor: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.06)' },
                },
                '&:active': { transform: 'scale(0.97)' },
              }}
            >
              Verify
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
              onClick={() => navigate('/register?role=COORDINATOR')}
              sx={{
                bgcolor: '#2D68C4',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                px: 2.25,
                py: 0.9,
                borderRadius: '10px',
                boxShadow: 'none',
                transition: T,
                '@media (hover: hover) and (pointer: fine)': {
                  '&:hover': { bgcolor: '#2560B0', boxShadow: 'none' },
                },
                '&:active': { transform: 'scale(0.97)', boxShadow: 'none' },
              }}
            >
              Add Coordinator
            </Button>
          </Box>
        </Box>

        {/* KPI strip */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          }}
        >
          {[
            { label: 'Total', value: loading ? '-' : total, sub: 'coordinators' },
            { label: 'Active', value: loading ? '-' : activeCount, sub: `of ${coordinators.length} loaded` },
            { label: 'Live Classes', value: loading ? '-' : totalActiveClasses, sub: 'running now' },
            { label: 'Open Slots', value: loading ? '-' : totalAvailable, sub: 'available capacity' },
          ].map((kpi, i) => (
            <Box
              key={kpi.label}
              sx={{
                px: { xs: 2, md: 2.5 },
                py: 1.75,
                borderTop: '1px solid rgba(255,255,255,0.07)',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                '&:nth-of-type(3)': {
                  borderLeft: { xs: '1px solid rgba(255,255,255,0.07)', sm: '1px solid rgba(255,255,255,0.07)' },
                },
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', mb: 0.5 }}>
                {kpi.label}
              </Typography>
              <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 800, color: '#fff', letterSpacing: -0.5, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {kpi.value}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', mt: 0.35, fontWeight: 500 }}>
                {kpi.sub}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Content area ────────────────────────────────────────────────────── */}
      <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2.5, md: 3 } }}>

        {error && <Box mb={2.5}><ErrorAlert error={error} /></Box>}

        {/* ── Filter bar ────────────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mb: selectedCoordinators.length > 0 ? 1.5 : 2.5, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search name, email or phone..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: '1 1 200px',
              maxWidth: 320,
              '& .MuiOutlinedInput-root': {
                borderRadius: '9px', fontSize: 13, bgcolor: '#fff',
                transition: T,
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#94A3B8' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1.5 },
              },
            }}
          />

          <TextField
            select size="small"
            value={filters.isActive}
            onChange={(e) => setFilters((p) => ({ ...p, isActive: e.target.value as any }))}
            sx={{
              minWidth: 130,
              '& .MuiOutlinedInput-root': {
                borderRadius: '9px', fontSize: 13, bgcolor: '#fff',
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#94A3B8' },
              },
            }}
          >
            <MenuItem value="all">All status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>

          <TextField
            select size="small"
            value={filters.hasCapacity}
            onChange={(e) => setFilters((p) => ({ ...p, hasCapacity: e.target.value as any }))}
            sx={{
              minWidth: 140,
              '& .MuiOutlinedInput-root': {
                borderRadius: '9px', fontSize: 13, bgcolor: '#fff',
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#94A3B8' },
              },
            }}
          >
            <MenuItem value="all">Any capacity</MenuItem>
            <MenuItem value="yes">Has slots</MenuItem>
            <MenuItem value="no">Full</MenuItem>
          </TextField>

          <TextField
            size="small"
            placeholder="Specialization..."
            value={filters.specialization}
            onChange={(e) => setFilters((p) => ({ ...p, specialization: e.target.value }))}
            sx={{
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                borderRadius: '9px', fontSize: 13, bgcolor: '#fff',
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#94A3B8' },
              },
            }}
          />

          {hasFilters && (
            <Button
              size="small" variant="text"
              onClick={() => setFilters({ search: '', isActive: 'all', hasCapacity: 'all', specialization: '' })}
              sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 500, px: 1.5, borderRadius: '8px', transition: T, '&:hover': { bgcolor: '#F1F5F9', color: 'text.primary' } }}
            >
              Clear
            </Button>
          )}
        </Box>

        {/* ── Bulk action bar ───────────────────────────────────────────────── */}
        {selectedCoordinators.length > 0 && (
          <Box
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              px: 2, py: 1.25, mb: 2, borderRadius: '10px',
              bgcolor: '#EFF6FF', border: '1px solid #BFDBFE',
            }}
          >
            <Typography fontSize={13} fontWeight={600} color="primary.main">
              {selectedCoordinators.length} selected
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                size="small" color="error" variant="contained"
                onClick={() => setBulkDialogOpen(true)}
                sx={{ fontWeight: 700, fontSize: 12, px: 2, borderRadius: '8px', boxShadow: 'none', transition: T, '&:active': { transform: 'scale(0.97)' } }}
              >
                Delete
              </Button>
              <Button
                size="small" variant="text"
                onClick={() => setSelectedCoordinators([])}
                sx={{ fontWeight: 600, fontSize: 12, color: 'text.secondary', borderRadius: '8px', transition: T }}
              >
                Deselect
              </Button>
            </Box>
          </Box>
        )}

        {/* ── Desktop table ─────────────────────────────────────────────────── */}
        {!isMobile ? (
          <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: '#F8FAFC',
                      '& .MuiTableCell-root': {
                        color: '#64748B', fontWeight: 700, fontSize: 11,
                        letterSpacing: 0.5, textTransform: 'uppercase',
                        py: 1.25, borderBottom: '1px solid #E2E8F0',
                      },
                    }}
                  >
                    <TableCell padding="checkbox" sx={{ pl: 2 }}>
                      <Checkbox
                        size="small"
                        indeterminate={selectedCoordinators.length > 0 && selectedCoordinators.length < coordinators.length}
                        checked={coordinators.length > 0 && selectedCoordinators.length === coordinators.length}
                        onChange={handleSelectAll}
                        sx={{ color: '#CBD5E1' }}
                      />
                    </TableCell>
                    <TableCell>
                      <TableSortLabel active={sortBy === 'name'} direction={sortBy === 'name' ? sortOrder : 'asc'} onClick={() => handleSort('name')}
                        sx={{ '& .MuiTableSortLabel-icon': { fontSize: 14 }, '&.Mui-active': { color: '#2D68C4' } }}>
                        Coordinator
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Specialization</TableCell>
                    <TableCell align="right">
                      <TableSortLabel active={sortBy === 'activeClassesCount'} direction={sortBy === 'activeClassesCount' ? sortOrder : 'asc'} onClick={() => handleSort('activeClassesCount')}
                        sx={{ '&.Mui-active': { color: '#2D68C4' } }}>
                        Active
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel active={sortBy === 'totalClassesHandled'} direction={sortBy === 'totalClassesHandled' ? sortOrder : 'asc'} onClick={() => handleSort('totalClassesHandled')}
                        sx={{ '&.Mui-active': { color: '#2D68C4' } }}>
                        Total
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">Cap</TableCell>
                    <TableCell align="right">Slots</TableCell>
                    <TableCell align="right">
                      <TableSortLabel active={sortBy === 'performanceScore'} direction={sortBy === 'performanceScore' ? sortOrder : 'asc'} onClick={() => handleSort('performanceScore')}
                        sx={{ '&.Mui-active': { color: '#2D68C4' } }}>
                        Score
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right" sx={{ pr: 2 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                        <CircularProgress size={22} thickness={4} />
                      </TableCell>
                    </TableRow>
                  ) : coordinators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 6, color: 'text.disabled', fontSize: 14 }}>
                        No coordinators found
                      </TableCell>
                    </TableRow>
                  ) : (
                    coordinators.map((c) => (
                      <TableRow
                        key={c.id}
                        sx={{
                          transition: T,
                          '& .MuiTableCell-root': { py: 1.25, borderBottom: '1px solid #F1F5F9', fontSize: 13 },
                          '@media (hover: hover) and (pointer: fine)': {
                            '&:hover': { bgcolor: '#F8FAFC' },
                          },
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ pl: 2 }}>
                          <Checkbox size="small" checked={selectedCoordinators.includes(c.id)} onChange={() => handleSelectOne(c.id)} sx={{ color: '#CBD5E1' }} />
                        </TableCell>

                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.25}>
                            <Avatar
                              sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 700, bgcolor: avatarColor(c.user?.name), flexShrink: 0 }}
                            >
                              {initials(c.user?.name)}
                            </Avatar>
                            <Box minWidth={0}>
                              <Link
                                component={RouterLink}
                                to={`/coordinator-profile/${c.id || (c as any)._id}`}
                                sx={{
                                  fontWeight: 600, fontSize: 13, color: 'text.primary',
                                  textDecoration: 'none', display: 'block',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  transition: T,
                                  '@media (hover: hover) and (pointer: fine)': {
                                    '&:hover': { color: 'primary.main' },
                                  },
                                }}
                              >
                                {c.user?.name}
                              </Link>
                              {c.user?.phone && (
                                <Typography fontSize={11} color="text.disabled">{c.user.phone}</Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ color: 'text.secondary', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.user?.email}
                        </TableCell>

                        <TableCell>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {(c.specialization || []).slice(0, 3).map((s) => (
                              <SpecTag key={s} label={s} />
                            ))}
                            {(c.specialization || []).length > 3 && (
                              <Box component="span" sx={{ fontSize: 10, color: 'text.disabled', alignSelf: 'center' }}>
                                +{(c.specialization || []).length - 3}
                              </Box>
                            )}
                          </Box>
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {c.activeClassesCount}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
                          {c.totalClassesHandled}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
                          {c.maxClassCapacity}
                        </TableCell>
                        <TableCell align="right">
                          <CapacityPill value={c.availableCapacity} />
                        </TableCell>
                        <TableCell align="right">
                          <ScorePill score={c.performanceScore} />
                        </TableCell>
                        <TableCell>
                          <StatusPill active={c.isActive} />
                        </TableCell>

                        <TableCell align="right" sx={{ pr: 1.5 }}>
                          <Box display="flex" justifyContent="flex-end" gap={0.5}>
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedCoordinator(c); setEditModalOpen(true); }}
                              aria-label="Edit coordinator"
                              sx={{
                                color: 'text.secondary', borderRadius: '8px', transition: T,
                                '@media (hover: hover) and (pointer: fine)': {
                                  '&:hover': { color: 'primary.main', bgcolor: '#EFF6FF' },
                                },
                                '&:active': { transform: 'scale(0.9)' },
                              }}
                            >
                              <EditIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => { setCoordinatorToDelete(c); setDeleteDialogOpen(true); }}
                              aria-label="Delete coordinator"
                              sx={{
                                color: 'text.disabled', borderRadius: '8px', transition: T,
                                '@media (hover: hover) and (pointer: fine)': {
                                  '&:hover': { color: '#DC2626', bgcolor: '#FEF2F2' },
                                },
                                '&:active': { transform: 'scale(0.9)' },
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Box>
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
              onPageChange={(_e, newPage) => { setPage(newPage); loadCoordinators(newPage, rowsPerPage); }}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setRowsPerPage(v); setPage(0); loadCoordinators(0, v);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                borderTop: '1px solid #F1F5F9',
                '& .MuiTablePagination-toolbar': { fontSize: 13 },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: 13, color: 'text.secondary',
                },
              }}
            />
          </Paper>
        ) : (
          /* ── Mobile cards ─────────────────────────────────────────────────── */
          <Stack spacing={1.5}>
            {loading ? (
              <Box textAlign="center" py={5}><CircularProgress size={22} thickness={4} /></Box>
            ) : coordinators.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Typography color="text.disabled" fontSize={14}>No coordinators found</Typography>
              </Box>
            ) : (
              coordinators.map((c) => (
                <Paper key={c.id} elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  {/* Header row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, pt: 2, pb: 1.5 }}>
                    <Checkbox size="small" checked={selectedCoordinators.includes(c.id)} onChange={() => handleSelectOne(c.id)} sx={{ color: '#CBD5E1', p: 0 }} />
                    <Avatar sx={{ width: 34, height: 34, fontSize: 12, fontWeight: 700, bgcolor: avatarColor(c.user?.name), flexShrink: 0 }}>
                      {initials(c.user?.name)}
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Link
                        component={RouterLink}
                        to={`/coordinator-profile/${c.id || (c as any)._id}`}
                        sx={{ fontWeight: 700, fontSize: 14, color: 'text.primary', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {c.user?.name}
                      </Link>
                      <Typography variant="body2" color="text.secondary" fontSize={12} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.user?.email}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={0.5} flexShrink={0}>
                      <IconButton size="small" onClick={() => { setSelectedCoordinator(c); setEditModalOpen(true); }}
                        sx={{ borderRadius: '8px', color: 'text.secondary', transition: T, '&:active': { transform: 'scale(0.9)', color: 'primary.main' } }}>
                        <EditIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => { setCoordinatorToDelete(c); setDeleteDialogOpen(true); }}
                        sx={{ borderRadius: '8px', color: 'text.disabled', transition: T, '&:active': { transform: 'scale(0.9)', color: '#DC2626' } }}>
                        <DeleteIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: '#F1F5F9' }} />

                  {/* Metrics */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', px: 2, py: 1.5, gap: 1 }}>
                    {[
                      { label: 'Active', value: c.activeClassesCount },
                      { label: 'Total', value: c.totalClassesHandled },
                      { label: 'Cap', value: c.maxClassCapacity },
                      { label: 'Score', value: c.performanceScore },
                    ].map((stat) => (
                      <Box key={stat.label} textAlign="center">
                        <Typography sx={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{stat.value}</Typography>
                        <Typography fontSize={10} color="text.disabled" fontWeight={600} letterSpacing={0.3}>{stat.label.toUpperCase()}</Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Spec tags */}
                  {(c.specialization || []).length > 0 && (
                    <>
                      <Divider sx={{ borderColor: '#F1F5F9' }} />
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', px: 2, py: 1.25 }}>
                        {(c.specialization || []).map((s) => <SpecTag key={s} label={s} />)}
                      </Box>
                    </>
                  )}

                  <Divider sx={{ borderColor: '#F1F5F9' }} />

                  {/* Status row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25 }}>
                    <StatusPill active={c.isActive} />
                    <CapacityPill value={c.availableCapacity} />
                  </Box>
                </Paper>
              ))
            )}

            {/* Mobile pagination */}
            {coordinators.length > 0 && (
              <Box display="flex" justifyContent="space-between" alignItems="center" pt={1}>
                <Button size="small" disabled={page === 0}
                  onClick={() => { const p = page - 1; setPage(p); loadCoordinators(p, rowsPerPage); }}
                  sx={{ fontSize: 12, borderRadius: '8px', color: 'text.secondary', transition: T }}>
                  Previous
                </Button>
                <Typography fontSize={12} color="text.secondary">{page + 1} / {totalPages}</Typography>
                <Button size="small" disabled={page >= totalPages - 1}
                  onClick={() => { const p = page + 1; setPage(p); loadCoordinators(p, rowsPerPage); }}
                  sx={{ fontSize: 12, borderRadius: '8px', color: 'text.secondary', transition: T }}>
                  Next
                </Button>
              </Box>
            )}
          </Stack>
        )}
      </Box>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <CreateCoordinatorModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        users={users}
        usersLoading={usersLoading}
        onCreate={handleCreateCoordinator}
      />

      <EditCoordinatorModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedCoordinator(null); }}
        coordinator={selectedCoordinator}
        onUpdate={handleEditCoordinator}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setCoordinatorToDelete(null); }}
        onConfirm={async () => { if (coordinatorToDelete) await handleDeleteCoordinator(coordinatorToDelete.id); }}
        title="Delete Coordinator"
        message={`Delete ${coordinatorToDelete?.user?.name}'s coordinator profile? This cannot be undone.`}
        confirmText="Delete"
        severity="error"
        loading={confirmLoading}
      />

      <ConfirmDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Coordinators"
        message={`Delete ${selectedCoordinators.length} coordinator(s)? This cannot be undone.`}
        confirmText={bulkLoading ? 'Deleting...' : 'Delete'}
        severity="error"
        loading={bulkLoading}
      />

      <SnackbarNotification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
    </Box>
  );
};

export default CoordinatorsManagementPage;
