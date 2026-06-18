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
  Paper,
  Chip,
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
import VerifiedIcon from '@mui/icons-material/Verified';
import FilterListIcon from '@mui/icons-material/FilterList';
import ErrorAlert from '../../components/common/ErrorAlert';
import SnackbarNotification from '../../components/common/SnackbarNotification';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CreateManagerModal from '../../components/admin/CreateManagerModal';
import EditManagerModal from '../../components/admin/EditManagerModal';
import managerService from '../../services/managerService';
import { IManager, IUser } from '../../types';

// ─── Shared transition ────────────────────────────────────────────────────────
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const TRANSITION = `all 150ms ${EASE}`;

// ─── Avatar colour from name ──────────────────────────────────────────────────
const AVATAR_COLORS = ['#2D68C4', '#0E7490', '#059669', '#D97706', '#9333EA', '#E11D48'];
const avatarColor = (name = '') =>
  AVATAR_COLORS[(name.charCodeAt(0) || 65) % AVATAR_COLORS.length];

const initials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

// ─── Status chip ──────────────────────────────────────────────────────────────
const StatusChip: React.FC<{ active: boolean }> = ({ active }) => (
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
      sx={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        bgcolor: active ? '#16A34A' : '#94A3B8',
      }}
    />
    {active ? 'Active' : 'Inactive'}
  </Box>
);

// ─── Verification chip ────────────────────────────────────────────────────────
const VerifChip: React.FC<{ status?: string }> = ({ status }) => {
  const s = status || 'PENDING';
  const map: Record<string, { bg: string; color: string }> = {
    VERIFIED: { bg: '#DCFCE7', color: '#15803D' },
    REJECTED: { bg: '#FEE2E2', color: '#DC2626' },
    PENDING: { bg: '#FEF9C3', color: '#A16207' },
  };
  const style = map[s] || map.PENDING;
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
        letterSpacing: 0.3,
        bgcolor: style.bg,
        color: style.color,
      }}
    >
      {s}
    </Box>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const ManagersManagementPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [managers, setManagers] = useState<IManager[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [selectedManager, setSelectedManager] = useState<IManager | null>(null);
  const [managerToDelete, setManagerToDelete] = useState<IManager | null>(null);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const debouncedSearch = useMemo(() => {
    let timer: any;
    return (q: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => setSearchQuery(q), 500);
    };
  }, []);

  const loadManagers = useCallback(
    async (p = page, l = rowsPerPage) => {
      setLoading(true);
      try {
        const filters: any = {};
        if (isActiveFilter !== 'all') filters.isActive = isActiveFilter === 'active';
        if (searchQuery) filters.search = searchQuery;
        const res = await managerService.getAllManagers(p + 1, l, filters.isActive);
        setManagers(res.data as unknown as IManager[]);
        setTotal(res.pagination.total);
      } catch (e: any) {
        setError(e?.response?.data?.error || e?.message || 'Failed to load managers');
      } finally {
        setLoading(false);
      }
    },
    [page, rowsPerPage, isActiveFilter, searchQuery],
  );

  const loadEligibleUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data } = await managerService.getEligibleManagerUsers();
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

  useEffect(() => {
    loadEligibleUsers();
    loadManagers(0, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(0);
    loadManagers(0, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActiveFilter, searchQuery, rowsPerPage]);

  const handleCreateManager = useCallback(
    async (payload: {
      userId: string;
      permissions: {
        canViewSiteLeads?: boolean;
        canVerifyTutors?: boolean;
        canCreateLeads?: boolean;
      };
    }) => {
      try {
        await managerService.createManagerProfile(payload);
        setSnackbar({ open: true, message: 'Manager profile created', severity: 'success' });
        setCreateModalOpen(false);
        loadManagers();
      } catch (e: any) {
        const msg = e?.response?.data?.error || e?.message || 'Failed to create manager';
        setSnackbar({ open: true, message: msg, severity: 'error' });
        throw e;
      }
    },
    [loadManagers],
  );

  const handleEditManager = useCallback(
    async (
      managerId: string,
      updateData: {
        isActive?: boolean;
        permissions?: {
          canViewSiteLeads?: boolean;
          canVerifyTutors?: boolean;
          canCreateLeads?: boolean;
        };
      },
    ) => {
      try {
        await managerService.updateManagerProfile(managerId, updateData);
        setSnackbar({ open: true, message: 'Manager updated', severity: 'success' });
        setEditModalOpen(false);
        setSelectedManager(null);
        loadManagers();
      } catch (e: any) {
        const msg = e?.response?.data?.error || e?.message || 'Failed to update manager';
        setSnackbar({ open: true, message: msg, severity: 'error' });
        throw e;
      }
    },
    [loadManagers],
  );

  const handleDeleteManager = useCallback(
    async (managerId: string) => {
      try {
        setConfirmLoading(true);
        await managerService.deleteManagerProfile(managerId);
        setSnackbar({ open: true, message: 'Manager deleted', severity: 'success' });
        setDeleteDialogOpen(false);
        setManagerToDelete(null);
        const nextPage = managers.length === 1 && page > 0 ? page - 1 : page;
        await loadManagers(nextPage, rowsPerPage);
        setPage(nextPage);
      } catch (e: any) {
        const msg = e?.response?.data?.error || e?.message || 'Cannot delete manager with existing records';
        setSnackbar({ open: true, message: msg, severity: 'error' });
      } finally {
        setConfirmLoading(false);
      }
    },
    [loadManagers, managers.length, page, rowsPerPage],
  );

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedManagers(event.target.checked ? managers.map((m) => m.id) : []);
  };

  const handleSelectOne = (id: string) => {
    setSelectedManagers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    let success = 0;
    let failed = 0;
    for (const id of selectedManagers) {
      try {
        await managerService.deleteManagerProfile(id);
        success++;
      } catch {
        failed++;
      }
    }
    setBulkLoading(false);
    setBulkDialogOpen(false);
    setSelectedManagers([]);
    await loadManagers(page, rowsPerPage);
    setSnackbar({
      open: true,
      message: `Deleted ${success} manager(s).${failed ? ` ${failed} failed.` : ''}`,
      severity: failed ? 'info' : 'success',
    });
  };

  const totalPages = Math.ceil(total / rowsPerPage) || 1;

  // Derived KPIs from current loaded data
  const activeCount = useMemo(() => managers.filter((m) => m.isActive).length, [managers]);
  const verifiedCount = useMemo(() => managers.filter((m) => m.verificationStatus === 'VERIFIED').length, [managers]);
  const totalRevenue = useMemo(
    () => managers.reduce((sum, m) => sum + Number(m.revenueGenerated || 0), 0),
    [managers],
  );

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
        {/* Top row: title + CTA */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: { xs: 22, md: 26 },
                fontWeight: 800,
                letterSpacing: -0.6,
                color: '#fff',
                lineHeight: 1.15,
              }}
            >
              Managers
            </Typography>
            <Typography
              sx={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', mt: 0.4, fontWeight: 500 }}
            >
              Assign permissions and track team performance
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
            onClick={() => navigate('/register?role=MANAGER')}
            sx={{
              bgcolor: '#2D68C4',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              px: 2.25,
              py: 0.9,
              borderRadius: '10px',
              boxShadow: 'none',
              flexShrink: 0,
              transition: TRANSITION,
              '@media (hover: hover) and (pointer: fine)': {
                '&:hover': { bgcolor: '#2560B0', boxShadow: 'none' },
              },
              '&:active': { transform: 'scale(0.97)', boxShadow: 'none' },
            }}
          >
            Add Manager
          </Button>
        </Box>

        {/* KPI strip */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          }}
        >
          {[
            { label: 'Total', value: loading ? '-' : total, sub: 'managers' },
            {
              label: 'Active',
              value: loading ? '-' : activeCount,
              sub: `of ${managers.length} loaded`,
            },
            {
              label: 'Verified',
              value: loading ? '-' : verifiedCount,
              sub: `of ${managers.length} loaded`,
            },
            {
              label: 'Revenue',
              value: loading ? '-' : `₹${totalRevenue >= 100000
                ? `${(totalRevenue / 100000).toFixed(1)}L`
                : totalRevenue.toLocaleString()}`,
              sub: 'generated',
            },
          ].map((kpi, i) => (
            <Box
              key={kpi.label}
              sx={{
                px: { xs: 2, md: 2.5 },
                py: 1.75,
                borderTop: '1px solid rgba(255,255,255,0.07)',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                '&:nth-of-type(odd)': {
                  borderLeft: { xs: 'none', sm: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none' },
                },
                '&:nth-of-type(3)': {
                  borderLeft: { xs: '1px solid rgba(255,255,255,0.07)', sm: '1px solid rgba(255,255,255,0.07)' },
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  color: 'rgba(255,255,255,0.38)',
                  textTransform: 'uppercase',
                  mb: 0.5,
                }}
              >
                {kpi.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: 22, md: 26 },
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: -0.5,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {kpi.value}
              </Typography>
              <Typography
                sx={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', mt: 0.35, fontWeight: 500 }}
              >
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
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.25,
            mb: selectedManagers.length > 0 ? 1.5 : 2.5,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search name or email..."
            onChange={(e) => debouncedSearch(e.target.value)}
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
                borderRadius: '9px',
                fontSize: 13,
                bgcolor: '#fff',
                transition: TRANSITION,
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#94A3B8' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1.5 },
              },
            }}
          />

          <TextField
            select
            size="small"
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value as any)}
            sx={{
              minWidth: 130,
              '& .MuiOutlinedInput-root': {
                borderRadius: '9px',
                fontSize: 13,
                bgcolor: '#fff',
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#94A3B8' },
              },
            }}
          >
            <MenuItem value="all">All status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>

          {(isActiveFilter !== 'all' || searchQuery) && (
            <Button
              size="small"
              variant="text"
              onClick={() => { setIsActiveFilter('all'); setSearchQuery(''); }}
              sx={{
                color: 'text.secondary',
                fontSize: 13,
                fontWeight: 500,
                px: 1.5,
                borderRadius: '8px',
                transition: TRANSITION,
                '&:hover': { bgcolor: '#F1F5F9', color: 'text.primary' },
              }}
            >
              Clear
            </Button>
          )}
        </Box>

      {/* ── Bulk action bar ─────────────────────────────────────────────────── */}
      {selectedManagers.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.25,
            mb: 2,
            borderRadius: '10px',
            bgcolor: '#EFF6FF',
            border: '1px solid #BFDBFE',
          }}
        >
          <Typography fontSize={13} fontWeight={600} color="primary.main">
            {selectedManagers.length} selected
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              color="error"
              variant="contained"
              onClick={() => setBulkDialogOpen(true)}
              sx={{
                fontWeight: 700,
                fontSize: 12,
                px: 2,
                borderRadius: '8px',
                boxShadow: 'none',
                transition: TRANSITION,
                '&:active': { transform: 'scale(0.97)' },
              }}
            >
              Delete
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => setSelectedManagers([])}
              sx={{
                fontWeight: 600,
                fontSize: 12,
                color: 'text.secondary',
                borderRadius: '8px',
                transition: TRANSITION,
              }}
            >
              Deselect
            </Button>
          </Box>
        </Box>
      )}

      {/* ── Desktop table ────────────────────────────────────────────────────── */}
      {!isMobile ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table size="small" sx={{ minWidth: 780 }}>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: '#F8FAFC',
                    '& .MuiTableCell-root': {
                      color: '#64748B',
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      py: 1.25,
                      borderBottom: '1px solid #E2E8F0',
                    },
                  }}
                >
                  <TableCell padding="checkbox" sx={{ pl: 2 }}>
                    <Checkbox
                      size="small"
                      indeterminate={
                        selectedManagers.length > 0 &&
                        selectedManagers.length < managers.length
                      }
                      checked={
                        managers.length > 0 &&
                        selectedManagers.length === managers.length
                      }
                      onChange={handleSelectAll}
                      sx={{ color: '#CBD5E1' }}
                    />
                  </TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="right">Leads</TableCell>
                  <TableCell align="right">Converted</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Verification</TableCell>
                  <TableCell align="right" sx={{ pr: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={22} thickness={4} />
                    </TableCell>
                  </TableRow>
                ) : managers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.disabled', fontSize: 14 }}>
                      No managers found
                    </TableCell>
                  </TableRow>
                ) : (
                  managers.map((m) => (
                    <TableRow
                      key={m.id}
                      sx={{
                        transition: TRANSITION,
                        '& .MuiTableCell-root': {
                          py: 1.25,
                          borderBottom: '1px solid #F1F5F9',
                          fontSize: 13,
                        },
                        '@media (hover: hover) and (pointer: fine)': {
                          '&:hover': { bgcolor: '#F8FAFC' },
                        },
                      }}
                    >
                      <TableCell padding="checkbox" sx={{ pl: 2 }}>
                        <Checkbox
                          size="small"
                          checked={selectedManagers.includes(m.id)}
                          onChange={() => handleSelectOne(m.id)}
                          sx={{ color: '#CBD5E1' }}
                        />
                      </TableCell>

                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.25}>
                          <Avatar
                            sx={{
                              width: 30,
                              height: 30,
                              fontSize: 11,
                              fontWeight: 700,
                              bgcolor: avatarColor(m.user?.name),
                              flexShrink: 0,
                            }}
                          >
                            {initials(m.user?.name)}
                          </Avatar>
                          <Link
                            component={RouterLink}
                            to={`/manager-profile/${m.id || (m as any)._id}`}
                            sx={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: 'text.primary',
                              textDecoration: 'none',
                              transition: TRANSITION,
                              '@media (hover: hover) and (pointer: fine)': {
                                '&:hover': { color: 'primary.main' },
                              },
                            }}
                          >
                            {m.user?.name}
                          </Link>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ color: 'text.secondary' }}>
                        {m.user?.email}
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {m.classLeadsCreated}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {m.classesConverted}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        ₹{Number(m.revenueGenerated || 0).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        <StatusChip active={m.isActive} />
                      </TableCell>

                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <VerifChip status={m.verificationStatus} />
                          {m.verificationStatus !== 'VERIFIED' && (
                            <Button
                              size="small"
                              component={RouterLink}
                              to={`/admin/verify-manager/${m.id}`}
                              startIcon={<VerifiedIcon sx={{ fontSize: '14px !important' }} />}
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                px: 1.25,
                                py: 0.4,
                                borderRadius: '7px',
                                color: 'primary.main',
                                border: '1px solid #BFDBFE',
                                bgcolor: '#EFF6FF',
                                transition: TRANSITION,
                                minWidth: 0,
                                '@media (hover: hover) and (pointer: fine)': {
                                  '&:hover': { bgcolor: '#DBEAFE' },
                                },
                                '&:active': { transform: 'scale(0.97)' },
                              }}
                            >
                              Verify
                            </Button>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell align="right" sx={{ pr: 1.5 }}>
                        <Box display="flex" justifyContent="flex-end" gap={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => { setSelectedManager(m); setEditModalOpen(true); }}
                            aria-label="Edit manager"
                            sx={{
                              color: 'text.secondary',
                              borderRadius: '8px',
                              transition: TRANSITION,
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
                            onClick={() => { setManagerToDelete(m); setDeleteDialogOpen(true); }}
                            aria-label="Delete manager"
                            sx={{
                              color: 'text.disabled',
                              borderRadius: '8px',
                              transition: TRANSITION,
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
            onPageChange={(_e, newPage) => { setPage(newPage); loadManagers(newPage, rowsPerPage); }}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setRowsPerPage(v);
              setPage(0);
              loadManagers(0, v);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              borderTop: '1px solid #F1F5F9',
              '& .MuiTablePagination-toolbar': { fontSize: 13 },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: 13,
                color: 'text.secondary',
              },
            }}
          />
        </Paper>
      ) : (
        /* ── Mobile card stack ─────────────────────────────────────────────── */
        <Stack spacing={1.5}>
          {loading ? (
            <Box textAlign="center" py={5}>
              <CircularProgress size={22} thickness={4} />
            </Box>
          ) : managers.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Typography color="text.disabled" fontSize={14}>No managers found</Typography>
            </Box>
          ) : (
            managers.map((m) => (
              <Paper
                key={m.id}
                elevation={0}
                sx={{
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  transition: TRANSITION,
                }}
              >
                {/* Card header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    pt: 2,
                    pb: 1.5,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={selectedManagers.includes(m.id)}
                    onChange={() => handleSelectOne(m.id)}
                    sx={{ color: '#CBD5E1', p: 0 }}
                  />
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      fontSize: 12,
                      fontWeight: 700,
                      bgcolor: avatarColor(m.user?.name),
                      flexShrink: 0,
                    }}
                  >
                    {initials(m.user?.name)}
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Link
                      component={RouterLink}
                      to={`/manager-profile/${m.id || (m as any)._id}`}
                      sx={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: 'text.primary',
                        textDecoration: 'none',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.user?.name}
                    </Link>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontSize={12}
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {m.user?.email}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={0.5} flexShrink={0}>
                    <IconButton
                      size="small"
                      onClick={() => { setSelectedManager(m); setEditModalOpen(true); }}
                      sx={{
                        borderRadius: '8px',
                        color: 'text.secondary',
                        transition: TRANSITION,
                        '&:active': { transform: 'scale(0.9)', color: 'primary.main' },
                      }}
                    >
                      <EditIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => { setManagerToDelete(m); setDeleteDialogOpen(true); }}
                      sx={{
                        borderRadius: '8px',
                        color: 'text.disabled',
                        transition: TRANSITION,
                        '&:active': { transform: 'scale(0.9)', color: '#DC2626' },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: '#F1F5F9' }} />

                {/* Metrics row */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    px: 2,
                    py: 1.5,
                    gap: 1,
                  }}
                >
                  {[
                    { label: 'Leads', value: m.classLeadsCreated },
                    { label: 'Converted', value: m.classesConverted },
                    { label: 'Revenue', value: `₹${Number(m.revenueGenerated || 0).toLocaleString()}` },
                  ].map((stat) => (
                    <Box key={stat.label} textAlign="center">
                      <Typography sx={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
                        {stat.value}
                      </Typography>
                      <Typography fontSize={10} color="text.disabled" fontWeight={600} letterSpacing={0.3}>
                        {stat.label.toUpperCase()}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ borderColor: '#F1F5F9' }} />

                {/* Status + verify row */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.25,
                    gap: 1,
                  }}
                >
                  <Box display="flex" gap={1} alignItems="center">
                    <StatusChip active={m.isActive} />
                    <VerifChip status={m.verificationStatus} />
                  </Box>
                  {m.verificationStatus !== 'VERIFIED' && (
                    <Button
                      size="small"
                      component={RouterLink}
                      to={`/admin/verify-manager/${m.id}`}
                      startIcon={<VerifiedIcon sx={{ fontSize: '14px !important' }} />}
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '8px',
                        color: 'primary.main',
                        border: '1px solid #BFDBFE',
                        bgcolor: '#EFF6FF',
                        transition: TRANSITION,
                        '&:active': { transform: 'scale(0.97)' },
                      }}
                    >
                      Verify
                    </Button>
                  )}
                </Box>
              </Paper>
            ))
          )}

          {/* Mobile pagination */}
          {managers.length > 0 && (
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              pt={1}
            >
              <Button
                size="small"
                disabled={page === 0}
                onClick={() => { const p = page - 1; setPage(p); loadManagers(p, rowsPerPage); }}
                sx={{ fontSize: 12, borderRadius: '8px', color: 'text.secondary', transition: TRANSITION }}
              >
                Previous
              </Button>
              <Typography fontSize={12} color="text.secondary">
                {page + 1} / {totalPages}
              </Typography>
              <Button
                size="small"
                disabled={page >= totalPages - 1}
                onClick={() => { const p = page + 1; setPage(p); loadManagers(p, rowsPerPage); }}
                sx={{ fontSize: 12, borderRadius: '8px', color: 'text.secondary', transition: TRANSITION }}
              >
                Next
              </Button>
            </Box>
          )}
        </Stack>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      </Box>{/* end content area */}

      <CreateManagerModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        users={users}
        usersLoading={usersLoading}
        onCreate={handleCreateManager}
      />

      <EditManagerModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedManager(null); }}
        manager={selectedManager}
        onUpdate={handleEditManager}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setManagerToDelete(null); }}
        onConfirm={async () => { if (managerToDelete) await handleDeleteManager(managerToDelete.id); }}
        title="Delete Manager"
        message={`Delete ${managerToDelete?.user?.name}'s manager profile? This cannot be undone.`}
        confirmText="Delete"
        severity="error"
        loading={confirmLoading}
      />

      <ConfirmDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Managers"
        message={`Delete ${selectedManagers.length} manager(s)? This cannot be undone.`}
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

export default ManagersManagementPage;
