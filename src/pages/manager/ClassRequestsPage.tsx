import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Chip, Button, Avatar, Stack, Select, MenuItem,
  IconButton, Tooltip, Skeleton, alpha,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WifiIcon from '@mui/icons-material/Wifi';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import SnackbarNotification from '../../components/common/SnackbarNotification';
import {
  getAllTeacherRequests,
  updateTeacherRequestStatus,
  ITeacherRequest,
  TeacherRequestStatus,
} from '../../services/teacherRequestService';

// ── constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<TeacherRequestStatus, { label: string; color: string; bg: string; dot: string }> = {
  NEW:            { label: 'New',            color: '#1d4ed8', bg: '#eff6ff', dot: '#3b82f6' },
  CONTACTED:      { label: 'Contacted',      color: '#c2410c', bg: '#fff7ed', dot: '#f97316' },
  DEMO_SCHEDULED: { label: 'Demo Scheduled', color: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6' },
  DEMO_COMPLETED: { label: 'Demo Done',      color: '#0f766e', bg: '#f0fdfa', dot: '#14b8a6' },
  CONVERTED:      { label: 'Converted',      color: '#15803d', bg: '#f0fdf4', dot: '#22c55e' },
  CLOSED:         { label: 'Closed',         color: '#64748b', bg: '#f8fafc', dot: '#94a3b8' },
};

const STATUS_KEYS = Object.keys(STATUS_META) as TeacherRequestStatus[];

const MODE_META: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  ONLINE:  { icon: <WifiIcon sx={{ fontSize: 11 }} />,                  label: 'Online',  color: '#0284c7', bg: '#e0f2fe' },
  OFFLINE: { icon: <LocationOnIcon sx={{ fontSize: 11 }} />,            label: 'Offline', color: '#c2410c', bg: '#fff7ed' },
  HYBRID:  { icon: <CheckCircleOutlineIcon sx={{ fontSize: 11 }} />,   label: 'Hybrid',  color: '#7c3aed', bg: '#f5f3ff' },
};

const AVATAR_PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── sub-components ────────────────────────────────────────────────────────────

function InfoPill({ icon, text, color = '#64748b' }: { icon: React.ReactNode; text: string; color?: string }) {
  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>{text}</Typography>
    </Box>
  );
}

function SkeletonCard() {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        p: 2.5,
        mb: 2,
      }}
    >
      <Box display="flex" gap={2} alignItems="flex-start">
        <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: '12px', flexShrink: 0 }} />
        <Box flex={1}>
          <Skeleton width="45%" height={22} />
          <Skeleton width="28%" height={16} sx={{ mt: 0.5 }} />
          <Box display="flex" gap={1} mt={1.5}>
            <Skeleton width={80} height={24} sx={{ borderRadius: 8 }} />
            <Skeleton width={60} height={24} sx={{ borderRadius: 8 }} />
            <Skeleton width={90} height={24} sx={{ borderRadius: 8 }} />
          </Box>
        </Box>
        <Box>
          <Skeleton width={100} height={36} sx={{ borderRadius: '10px' }} />
        </Box>
      </Box>
    </Box>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

const ClassRequestsPage: React.FC = () => {
  const navigate = useNavigate();

  const [requests, setRequests]         = useState<ITeacherRequest[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [updatingId, setUpdatingId]     = useState<string | null>(null);
  const [snackbar, setSnackbar]         = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'success',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getAllTeacherRequests({ status: statusFilter || undefined, limit: 50 });
      setRequests(res.data || []);
    } catch (e: any) {
      setFetchError(e?.message || 'Failed to load class requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleCreateLead = (req: ITeacherRequest) => {
    // Map abbreviated day names from the app to full uppercase names expected by ClassLeadForm
    const DAY_MAP: Record<string, string> = {
      Mon: 'MONDAY', Tue: 'TUESDAY', Wed: 'WEDNESDAY',
      Thu: 'THURSDAY', Fri: 'FRIDAY', Sat: 'SATURDAY', Sun: 'SUNDAY',
    };
    const mapDays = (days?: string[]) =>
      (days || []).map((d) => DAY_MAP[d] ?? d.toUpperCase());

    // Parse the first rupee-prefixed number from budgetRange (e.g. "8 classes – ₹2,000/mo" → 2000)
    const parseBudget = (range?: string): number | undefined => {
      if (!range) return undefined;
      const match = range.replace(/,/g, '').match(/₹\s*(\d+)/);
      return match ? Number(match[1]) : undefined;
    };

    const prefill = {
      studentName:  req.studentName,
      parentName:   req.parent?.name  || '',
      parentEmail:  req.parent?.email || '',
      parentPhone:  req.parent?.phone || '',
      board:        req.board?.value  || '',
      grade:        req.grade?.value  || '',
      subject:      req.subjects?.map((s) => s.value) ?? [],
      mode:         req.mode,
      city:         req.city || '',
      // Mobile stores "AreaLabel, detailed address" combined — split to recover each part
      area:         req.address?.includes(', ')
                      ? req.address.substring(0, req.address.indexOf(', '))
                      : '',
      address:      req.address?.includes(', ')
                      ? req.address.substring(req.address.indexOf(', ') + 2)
                      : req.address || '',
      // timing is required in the form — use time slot, fall back to joined days
      timing:       req.preferredTimeSlot
                      || (req.preferredDays?.length ? req.preferredDays.join(', ') : ''),
      weekdays:     mapDays(req.preferredDays),
      // parse budgetRange string into student fee (tutor fees left for manager to fill)
      paymentAmount: parseBudget(req.budgetRange),
      notes:        req.notes ? `Note: ${req.notes}` : '',
    };
    navigate('/class-leads/new', { state: { prefill } });
  };

  const handleStatusChange = async (id: string, status: TeacherRequestStatus) => {
    setUpdatingId(id);
    try {
      await updateTeacherRequestStatus(id, status);
      setRequests((prev) => prev.map((r) => r._id === id ? { ...r, status } : r));
      setSnackbar({ open: true, message: `Status updated to "${STATUS_META[status].label}"`, severity: 'success' });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed to update status', severity: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  // count by status for the filter strip
  const countByStatus = (key: string) => requests.filter((r) => r.status === key).length;
  const totalCount    = requests.length;
  const newCount      = countByStatus('NEW');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F8FAFC',
        '@keyframes cardIn': {
          from: {
            opacity: 0,
            transform: 'perspective(600px) translateZ(-14px) translateY(10px)',
          },
          to: {
            opacity: 1,
            transform: 'perspective(600px) translateZ(0) translateY(0)',
          },
        },
        '@keyframes heroIn': {
          from: { opacity: 0, transform: 'translateY(-8px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes orbFloat': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      }}
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4338CA 0%, #312E81 100%)',
          px: { xs: 2.5, sm: 4 },
          pt: { xs: 2, sm: 3 },
          pb: { xs: 2.5, sm: 3.5 },
          position: 'relative',
          overflow: 'hidden',
          animation: 'heroIn 380ms cubic-bezier(0.23,1,0.32,1) both',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        {/* decorative orbs */}
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', animation: 'orbFloat 6s ease-in-out infinite' }} />
        <Box sx={{ position: 'absolute', bottom: -50, left: '35%', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', pointerEvents: 'none', animation: 'orbFloat 8s ease-in-out infinite 2s' }} />
        <Box sx={{ position: 'absolute', top: '20%', right: '15%', width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1100, mx: 'auto' }}>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap">
            {/* left: title block */}
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 50, height: 50, borderRadius: '14px',
                  bgcolor: 'rgba(255,255,255,0.15)',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AssignmentIcon sx={{ color: '#fff', fontSize: 26 }} />
              </Box>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography
                    sx={{
                      color: '#fff', fontWeight: 800, fontSize: { xs: '1.3rem', sm: '1.65rem' },
                      lineHeight: 1.15, letterSpacing: '-0.02em',
                    }}
                  >
                    Class Requests
                  </Typography>
                  {!loading && newCount > 0 && (
                    <Box
                      sx={{
                        bgcolor: '#f59e0b', color: '#fff', fontWeight: 800,
                        fontSize: '0.7rem', borderRadius: '8px', px: 0.9, py: 0.2,
                        lineHeight: 1.5, letterSpacing: 0.3,
                      }}
                    >
                      {newCount} NEW
                    </Box>
                  )}
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.68)', fontSize: '0.87rem', mt: 0.3 }}>
                  Tutor requests submitted by parents via the app
                </Typography>
              </Box>
            </Box>

            {/* right: refresh */}
            <Tooltip title="Refresh">
              <IconButton
                onClick={load}
                disabled={loading}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  borderRadius: '10px',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  '&:active': { transform: 'scale(0.94)' },
                  transition: 'transform 140ms ease-out, background-color 160ms ease-out',
                }}
              >
                <RefreshIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* ── Warning strip inside hero ── */}
          <Box
            sx={{
              mt: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              bgcolor: 'rgba(251,191,36,0.12)',
              border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: '12px',
              px: 2,
              py: 1.2,
            }}
          >
            <WarningAmberIcon sx={{ color: '#fbbf24', fontSize: 18, flexShrink: 0 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', lineHeight: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 700, color: '#fbbf24' }}>
                Confirm details before creating a lead.&nbsp;
              </Box>
              These details come directly from the parent's submission. Review and edit as needed in the lead form.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Filter / stats strip ─────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: '#fff',
          borderBottom: '1px solid #E2E8F0',
          px: { xs: 2.5, sm: 4 },
          py: 1.5,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: 'auto', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {/* All pill */}
          <Box
            component="button"
            onClick={() => setStatusFilter('')}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.75,
              px: 1.5, py: 0.6,
              borderRadius: '20px',
              border: statusFilter === '' ? '1.5px solid #6366f1' : '1.5px solid #E2E8F0',
              bgcolor: statusFilter === '' ? '#ede9fe' : 'transparent',
              color: statusFilter === '' ? '#6366f1' : '#64748b',
              fontWeight: 600, fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 160ms cubic-bezier(0.23,1,0.32,1)',
              '&:hover': { borderColor: '#6366f1', color: '#6366f1' },
              '&:active': { transform: 'scale(0.96)' },
            }}
          >
            All
            {!loading && (
              <Box sx={{ bgcolor: statusFilter === '' ? '#6366f1' : '#e2e8f0', color: statusFilter === '' ? '#fff' : '#64748b', borderRadius: '10px', px: 0.65, fontSize: '0.68rem', fontWeight: 700, lineHeight: '16px' }}>
                {totalCount}
              </Box>
            )}
          </Box>

          {STATUS_KEYS.map((key) => {
            const m = STATUS_META[key];
            const cnt = !loading ? countByStatus(key) : null;
            const active = statusFilter === key;
            return (
              <Box
                key={key}
                component="button"
                onClick={() => setStatusFilter(active ? '' : key)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75,
                  px: 1.5, py: 0.6,
                  borderRadius: '20px',
                  border: active ? `1.5px solid ${m.color}` : '1.5px solid #E2E8F0',
                  bgcolor: active ? m.bg : 'transparent',
                  color: active ? m.color : '#64748b',
                  fontWeight: 600, fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 160ms cubic-bezier(0.23,1,0.32,1)',
                  '&:hover': { borderColor: m.color, color: m.color },
                  '&:active': { transform: 'scale(0.96)' },
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: m.dot, flexShrink: 0 }} />
                {m.label}
                {cnt !== null && (
                  <Box sx={{ bgcolor: active ? m.color : '#e2e8f0', color: active ? '#fff' : '#64748b', borderRadius: '10px', px: 0.65, fontSize: '0.68rem', fontWeight: 700, lineHeight: '16px' }}>
                    {cnt}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 4 }, py: 3 }}>

        {/* Loading skeletons */}
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {/* Error */}
        {!loading && fetchError && (
          <Box
            sx={{
              bgcolor: '#fff',
              border: '1px solid #fecaca',
              borderRadius: '16px',
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography color="error.main" fontWeight={600} gutterBottom>{fetchError}</Typography>
            <Button size="small" onClick={load} sx={{ mt: 1, borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}>
              Retry
            </Button>
          </Box>
        )}

        {/* Empty */}
        {!loading && !fetchError && requests.length === 0 && (
          <Box
            sx={{
              bgcolor: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: '20px',
              py: 10,
              px: 4,
              textAlign: 'center',
              animation: 'cardIn 400ms cubic-bezier(0.23,1,0.32,1) both',
            }}
          >
            <Box
              sx={{
                width: 64, height: 64, borderRadius: '18px',
                bgcolor: alpha('#6366f1', 0.08),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}
            >
              <AssignmentIcon sx={{ color: '#6366f1', fontSize: 30 }} />
            </Box>
            <Typography fontWeight={800} fontSize="1.1rem" gutterBottom>No requests found</Typography>
            <Typography color="text.secondary" fontSize="0.87rem" maxWidth={340} mx="auto">
              {statusFilter
                ? `No requests with status "${STATUS_META[statusFilter as TeacherRequestStatus]?.label}". Try a different filter.`
                : "No class requests from the app yet. They'll appear here once parents submit them."}
            </Typography>
          </Box>
        )}

        {/* Cards */}
        {!loading && !fetchError && requests.length > 0 && (
          <Stack spacing={2}>
            {requests.map((req, i) => {
              const meta     = STATUS_META[req.status] ?? STATUS_META.NEW;
              const modeMeta = MODE_META[req.mode]     ?? MODE_META.ONLINE;
              const busy     = updatingId === req._id;
              const avatarColor = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
              const delay    = Math.min(i * 55, 280);

              return (
                <Box
                  key={req._id}
                  sx={{
                    bgcolor: '#fff',
                    border: '1px solid',
                    borderColor: req.status === 'NEW' ? alpha('#6366f1', 0.3) : '#E2E8F0',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    animation: `cardIn 420ms cubic-bezier(0.23,1,0.32,1) ${delay}ms both`,
                    transition: 'border-color 200ms cubic-bezier(0.23,1,0.32,1)',
                    '&:hover': {
                      borderColor: alpha('#6366f1', 0.4),
                    },
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                  }}
                >
                  {/* top accent line for NEW */}
                  {req.status === 'NEW' && (
                    <Box sx={{ height: 3, background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: '16px 16px 0 0' }} />
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      gap: 0,
                      flexDirection: { xs: 'column', md: 'row' },
                    }}
                  >
                    {/* ── Zone 1: Identity ──────────────────────────────── */}
                    <Box
                      sx={{
                        p: 2.5,
                        bgcolor: '#F8FAFF',
                        borderRight: { md: '1px solid #DDE3EE' },
                        borderBottom: { xs: '1px solid #DDE3EE', md: 'none' },
                        minWidth: { md: 220 },
                        maxWidth: { md: 260 },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                      }}
                    >
                      {/* Avatar + name */}
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar
                          sx={{
                            width: 46, height: 46,
                            borderRadius: '13px',
                            bgcolor: alpha(avatarColor, 0.18),
                            color: avatarColor,
                            fontWeight: 800,
                            fontSize: '1.15rem',
                            flexShrink: 0,
                            border: `1.5px solid ${alpha(avatarColor, 0.25)}`,
                          }}
                        >
                          {req.studentName?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={800} fontSize="1rem" lineHeight={1.2} color="#0f172a">
                            {req.studentName}
                          </Typography>
                          <Typography
                            fontSize="0.73rem"
                            sx={{ color: '#6366f1', fontWeight: 700, letterSpacing: 0.4, fontFamily: 'monospace' }}
                          >
                            {req.requestId}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Status badge */}
                      <Box
                        sx={{
                          display: 'inline-flex', alignItems: 'center', gap: 0.7,
                          px: 1.4, py: 0.55,
                          borderRadius: '20px',
                          bgcolor: meta.bg,
                          border: `1.5px solid ${alpha(meta.color, 0.3)}`,
                          width: 'fit-content',
                        }}
                      >
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: meta.dot, flexShrink: 0 }} />
                        <Typography fontSize="0.75rem" fontWeight={800} sx={{ color: meta.color }}>
                          {meta.label}
                        </Typography>
                      </Box>

                      {/* Parent info */}
                      {req.parent?.name && (
                        <Box
                          sx={{
                            bgcolor: '#fff',
                            borderRadius: '10px',
                            p: 1.4,
                            border: '1px solid #DDE3EE',
                          }}
                        >
                          <Typography fontSize="0.67rem" fontWeight={800} sx={{ color: '#475569', textTransform: 'uppercase', letterSpacing: 0.7, mb: 0.75 }}>
                            Parent
                          </Typography>
                          <Typography fontSize="0.85rem" fontWeight={700} lineHeight={1.3} color="#0f172a">{req.parent.name}</Typography>
                          {req.parent.phone && (
                            <Box display="flex" alignItems="center" gap={0.5} mt={0.6}>
                              <PhoneIcon sx={{ fontSize: 12, color: '#64748b' }} />
                              <Typography fontSize="0.77rem" color="#334155" fontWeight={500}>{req.parent.phone}</Typography>
                            </Box>
                          )}
                          {req.parent.email && (
                            <Box display="flex" alignItems="center" gap={0.5} mt={0.4}>
                              <EmailIcon sx={{ fontSize: 12, color: '#64748b' }} />
                              <Typography fontSize="0.73rem" color="#475569" sx={{ wordBreak: 'break-all' }}>{req.parent.email}</Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Date */}
                      <Box display="flex" alignItems="center" gap={0.6} mt="auto">
                        <CalendarTodayIcon sx={{ fontSize: 12, color: '#64748b' }} />
                        <Typography fontSize="0.75rem" color="#64748b" fontWeight={500}>{fmtDate(req.createdAt)}</Typography>
                      </Box>
                    </Box>

                    {/* ── Zone 2: Academic details ──────────────────────── */}
                    <Box
                      sx={{
                        p: 2.5,
                        flex: 1,
                        bgcolor: '#fff',
                        borderRight: { md: '1px solid #DDE3EE' },
                        borderBottom: { xs: '1px solid #DDE3EE', md: 'none' },
                      }}
                    >
                      {/* Board + grade row */}
                      <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                        <Box
                          sx={{
                            width: 34, height: 34, borderRadius: '10px',
                            bgcolor: alpha('#6366f1', 0.1),
                            border: `1px solid ${alpha('#6366f1', 0.2)}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <SchoolIcon sx={{ fontSize: 16, color: '#6366f1' }} />
                        </Box>
                        <Box>
                          <Typography fontSize="0.67rem" fontWeight={800} sx={{ color: '#475569', textTransform: 'uppercase', letterSpacing: 0.7 }}>
                            Board / Grade
                          </Typography>
                          <Typography fontSize="0.92rem" fontWeight={800} lineHeight={1.3} color="#0f172a">
                            {req.board?.label || '—'} &nbsp;·&nbsp; {req.grade?.label || '—'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Subjects */}
                      {req.subjects?.length > 0 && (
                        <Box mb={2}>
                          <Typography fontSize="0.67rem" fontWeight={800} sx={{ color: '#475569', textTransform: 'uppercase', letterSpacing: 0.7, mb: 0.7 }}>
                            Subjects
                          </Typography>
                          <Box display="flex" gap={0.7} flexWrap="wrap">
                            {req.subjects.map((s) => (
                              <Box
                                key={s._id}
                                sx={{
                                  px: 1.2, py: 0.4,
                                  bgcolor: alpha('#6366f1', 0.08),
                                  border: `1.5px solid ${alpha('#6366f1', 0.2)}`,
                                  borderRadius: '7px',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  color: '#4f46e5',
                                }}
                              >
                                {s.label}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Mode + city + budget */}
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {/* Mode */}
                        <Box
                          sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.7,
                            px: 1.25, py: 0.5,
                            bgcolor: modeMeta.bg,
                            borderRadius: '8px',
                            border: `1.5px solid ${alpha(modeMeta.color, 0.3)}`,
                          }}
                        >
                          <Box sx={{ color: modeMeta.color, display: 'flex' }}>{modeMeta.icon}</Box>
                          <Typography fontSize="0.76rem" fontWeight={700} sx={{ color: modeMeta.color }}>{modeMeta.label}</Typography>
                        </Box>

                        {req.city && (
                          <InfoPill icon={<LocationCityIcon sx={{ fontSize: 13 }} />} text={req.city} color="#475569" />
                        )}
                        {req.budgetRange && (
                          <InfoPill icon={<AttachMoneyIcon sx={{ fontSize: 13 }} />} text={req.budgetRange} color="#475569" />
                        )}
                      </Box>

                      {/* Notes */}
                      {req.notes && (
                        <Box
                          sx={{
                            mt: 2,
                            bgcolor: '#FFFBEB',
                            border: '1px solid #FDE68A',
                            borderRadius: '10px',
                            p: 1.4,
                          }}
                        >
                          <Typography fontSize="0.67rem" fontWeight={800} sx={{ color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.7, mb: 0.5 }}>
                            Note from parent
                          </Typography>
                          <Typography fontSize="0.82rem" color="#1e293b" lineHeight={1.6} fontWeight={500}>{req.notes}</Typography>
                        </Box>
                      )}

                      {/* Preferred schedule */}
                      {(req.preferredDays?.length || req.preferredTimeSlot) && (
                        <Box display="flex" gap={1} flexWrap="wrap" mt={1.5}>
                          {req.preferredTimeSlot && (
                            <InfoPill icon={<CalendarTodayIcon sx={{ fontSize: 12 }} />} text={req.preferredTimeSlot} color="#334155" />
                          )}
                          {req.preferredDays?.length > 0 && (
                            <InfoPill icon={<PersonIcon sx={{ fontSize: 12 }} />} text={req.preferredDays.join(', ')} color="#334155" />
                          )}
                        </Box>
                      )}
                    </Box>

                    {/* ── Zone 3: Actions ──────────────────────────────── */}
                    <Box
                      sx={{
                        p: 2.5,
                        minWidth: { md: 200 },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        justifyContent: 'center',
                        alignItems: 'stretch',
                        bgcolor: '#F5F3FF',
                        borderLeft: { md: '1px solid #DDD6FE' },
                      }}
                    >
                      {/* Status selector */}
                      <Box>
                        <Typography fontSize="0.67rem" fontWeight={800} sx={{ color: '#475569', textTransform: 'uppercase', letterSpacing: 0.7, mb: 0.7 }}>
                          Update Status
                        </Typography>
                        <Select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req._id, e.target.value as TeacherRequestStatus)}
                          disabled={busy}
                          size="small"
                          fullWidth
                          sx={{
                            borderRadius: '10px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: meta.color,
                            bgcolor: meta.bg,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: alpha(meta.color, 0.25),
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: meta.color,
                            },
                          }}
                          renderValue={(v) => (
                            <Box display="flex" alignItems="center" gap={0.75}>
                              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: STATUS_META[v as TeacherRequestStatus]?.dot }} />
                              {STATUS_META[v as TeacherRequestStatus]?.label ?? v}
                            </Box>
                          )}
                        >
                          {STATUS_KEYS.map((key) => (
                            <MenuItem key={key} value={key} sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_META[key].dot }} />
                                {STATUS_META[key].label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </Box>

                      {/* Create Lead CTA */}
                      <Tooltip title="Prefill the lead form with this request's details" placement="top">
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={
                            busy
                              ? <CircularProgress size={14} color="inherit" />
                              : <AddCircleOutlineIcon sx={{ fontSize: 17 }} />
                          }
                          onClick={() => handleCreateLead(req)}
                          disabled={busy}
                          sx={{
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            textTransform: 'none',
                            py: 1.15,
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                            transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), box-shadow 160ms ease-out',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                            },
                            '&:active': {
                              transform: 'scale(0.97)',
                              boxShadow: '0 1px 4px rgba(99,102,241,0.2)',
                            },
                          }}
                        >
                          Create Lead
                        </Button>
                      </Tooltip>

                      <Typography
                        fontSize="0.71rem"
                        color="#6d28d9"
                        textAlign="center"
                        lineHeight={1.4}
                        px={0.5}
                        fontWeight={500}
                      >
                        Form will be prefilled — you can edit before saving
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      <SnackbarNotification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
    </Box>
  );
};

export default ClassRequestsPage;
