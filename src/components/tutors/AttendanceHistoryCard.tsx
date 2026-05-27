import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Divider,
  Chip,
  CardContent,
  TextField,
  MenuItem,
  Pagination,
  Tooltip,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import FilterListIcon from '@mui/icons-material/FilterList';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useSelector } from 'react-redux';
import { StyledCard } from '../common/StyledCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import EmptyState from '../common/EmptyState';
import MetricsCard from '../dashboard/MetricsCard';
import AttendanceStatusChip from '../attendance/AttendanceStatusChip';
import DateRangePicker from '../dashboard/DateRangePicker';
import { getAttendances } from '../../services/attendanceService';
import { IAttendance } from '../../types';
import { ATTENDANCE_STATUS, STUDENT_ATTENDANCE_STATUS } from '../../constants';
import { selectCurrentUser } from '../../store/slices/authSlice';

const formatDate = (date?: Date | string) => {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (date?: Date | string) => {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};


const getStatusColor = (
  status?: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  const value = (status || '').toUpperCase();
  switch (value) {
    case STUDENT_ATTENDANCE_STATUS.PRESENT:
      return 'success';
    case STUDENT_ATTENDANCE_STATUS.ABSENT:
      return 'error';
    case STUDENT_ATTENDANCE_STATUS.LATE:
      return 'warning';
    default:
      return 'info';
  }
};

const StudentAttendanceStatusChip: React.FC<{ studentAttendanceStatus?: string | null }> = ({
  studentAttendanceStatus,
}) => {
  const value = (studentAttendanceStatus || '').toUpperCase();
  const color = getStatusColor(value);

  let label = 'Status';
  let icon: React.ReactNode = <AccessTimeIcon fontSize="small" />;

  if (value === STUDENT_ATTENDANCE_STATUS.PRESENT) {
    label = 'Present';
    icon = <CheckCircleIcon fontSize="small" />;
  } else if (value === STUDENT_ATTENDANCE_STATUS.ABSENT) {
    label = 'Absent';
    icon = <CancelIcon fontSize="small" />;
  } else if (value === STUDENT_ATTENDANCE_STATUS.LATE) {
    label = 'Late';
    icon = <AccessTimeIcon fontSize="small" />;
  } else if (!value) {
    label = 'Not recorded';
  } else {
    label = value;
  }

  return (
    <Chip
      size="small"
      label={label}
      color={color}
      icon={icon}
      sx={{
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: '8px',
        height: 28,
        '& .MuiChip-icon': {
          ml: 1,
        },
      }}
    />
  );
};

const AttendanceHistoryCard: React.FC = () => {
  const user = useSelector(selectCurrentUser);

  const [attendances, setAttendances] = useState<IAttendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    status?: string;
    fromDate?: string;
    toDate?: string;
    page: number;
    limit: number;
  }>({
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  }>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const fetchAttendances = async () => {
    const tutorId = (user as any)?._id || (user as any)?.id;
    if (!tutorId) {
      setAttendances([]);
      setPagination((prev) => ({ ...prev, total: 0, pages: 1, page: 1 }));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await getAttendances({
        tutorId,
        status: filters.status,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        page: filters.page,
        limit: filters.limit,
      });

      const data = (res as any)?.data || [];
      const paginationInfo = (res as any)?.pagination || {
        page: filters.page,
        limit: filters.limit,
        total: Array.isArray(data) ? data.length : 0,
        pages: 1,
      };

      setAttendances(data as IAttendance[]);
      setPagination({
        page: paginationInfo.page || filters.page,
        limit: paginationInfo.limit || filters.limit,
        total: paginationInfo.total || 0,
        pages: paginationInfo.pages || 1,
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load attendance history.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.fromDate, filters.toDate, filters.page, filters.limit]);

  const statistics = useMemo(() => {
    const totalSessions = attendances.length;
    const approvedCount = attendances.filter((a) =>
      [ATTENDANCE_STATUS.COORDINATOR_APPROVED, ATTENDANCE_STATUS.PARENT_APPROVED,ATTENDANCE_STATUS.APPROVED].includes(
        a.status as any
      )
    ).length;
    const pendingCount = attendances.filter((a) => a.status === ATTENDANCE_STATUS.PENDING).length;
    const rejectedCount = attendances.filter((a) => a.status === ATTENDANCE_STATUS.REJECTED).length;
    const approvalRate = totalSessions > 0 ? (approvedCount / totalSessions) * 100 : 0;

    return {
      totalSessions,
      approvedCount,
      pendingCount,
      rejectedCount,
      approvalRate,
    };
  }, [attendances]);

  const handleDateChange = (range: { fromDate?: string; toDate?: string }) => {
    setFilters((prev) => ({
      ...prev,
      fromDate: range.fromDate,
      toDate: range.toDate,
      page: 1,
    }));
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value || undefined;
    setFilters((prev) => ({
      ...prev,
      status: value,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 10 });
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  if (loading) {
    return (
      <StyledCard>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" py={6} aria-busy>
            <LoadingSpinner message="Loading attendance history..." />
          </Box>
        </CardContent>
      </StyledCard>
    );
  }

  if (error && attendances.length === 0) {
    return (
      <StyledCard>
        <CardContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <ErrorAlert error={error} />
            <Box>
              <Button variant="outlined" onClick={fetchAttendances}>
                Retry
              </Button>
            </Box>
          </Box>
        </CardContent>
      </StyledCard>
    );
  }

  if (!loading && attendances.length === 0) {
    return (
      <StyledCard>
        <CardContent>
          <EmptyState
            icon={<HistoryIcon color="primary" />}
            title="No Attendance Records"
            description="You haven't submitted any attendance yet. Submit attendance for your classes to see them here."
          />
        </CardContent>
      </StyledCard>
    );
  }

  return (
    <StyledCard>
      <CardContent>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={{ xs: 2, sm: 3 }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <HistoryIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              Attendance History
            </Typography>
          </Box>
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={`${pagination.total || attendances.length} record(s)`}
          />
        </Box>

        <Grid container spacing={2} mb={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} sm={6} md={2.4 as any}>
            <MetricsCard
              title="Total Sessions"
              value={statistics.totalSessions}
              subtitle="Submitted"
              icon={<HistoryIcon />}
              color="primary.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4 as any}>
            <MetricsCard
              title="Approved"
              value={statistics.approvedCount}
              subtitle="Fully approved"
              icon={<CheckCircleIcon />}
              color="success.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4 as any}>
            <MetricsCard
              title="Pending"
              value={statistics.pendingCount}
              subtitle="Awaiting approval"
              icon={<PendingActionsIcon />}
              color="warning.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4 as any}>
            <MetricsCard
              title="Rejected"
              value={statistics.rejectedCount}
              subtitle="Rejected sessions"
              icon={<CancelIcon />}
              color="error.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4 as any}>
            <MetricsCard
              title="Approval Rate"
              value={`${statistics.approvalRate.toFixed(1)}%`}
              subtitle="Success rate"
              icon={<TrendingUpIcon />}
              color="info.main"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: { xs: 2, sm: 3 } }} />

        <Box
          mb={{ xs: 2, sm: 3 }}
          display="flex"
          gap={2}
          alignItems="center"
          flexWrap="wrap"
        >
          <Box display="flex" alignItems="center" gap={1}>
            <FilterListIcon color="action" />
            <Typography variant="subtitle2" fontWeight={600}>
              Filters:
            </Typography>
          </Box>

          <DateRangePicker
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onDateChange={handleDateChange}
          />

          <TextField
            select
            size="small"
            label="Status"
            value={filters.status || ''}
            onChange={handleStatusChange}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value={ATTENDANCE_STATUS.PENDING}>Pending</MenuItem>
            <MenuItem value={ATTENDANCE_STATUS.COORDINATOR_APPROVED}>Coordinator Approved</MenuItem>
            <MenuItem value={ATTENDANCE_STATUS.PARENT_APPROVED}>Parent Approved</MenuItem>
            <MenuItem value={ATTENDANCE_STATUS.REJECTED}>Rejected</MenuItem>
          </TextField>

          <Button variant="text" onClick={clearFilters}>
            Clear Filters
          </Button>
        </Box>

        <Divider sx={{ my: { xs: 2, sm: 3 } }} />

        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <HistoryIcon fontSize="small" />
          <Typography variant="h6" fontWeight={600}>
            Attendance Records
          </Typography>
          <Chip
            size="small"
            label={`${pagination.total || attendances.length} record(s)`}
            color="default"
          />
        </Box>

        <Box
          sx={{
            maxHeight: 600,
            overflow: 'auto',
            pr: 1,
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 2,
            },
            '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0,0,0,0.06)' },
          }}
        >
          {attendances.map((a) => {
            const id = (a as any).id || (a as any)._id;
            const studentName = a.finalClass?.studentName;
            const subjects = Array.isArray(a.finalClass?.subject)
              ? a.finalClass.subject.map((s: any) => typeof s === 'string' ? s : s?.label || s?.name || 'N/A').join(', ')
              : (typeof a.finalClass?.subject === 'object' && a.finalClass?.subject !== null ? (a.finalClass.subject as any).label || (a.finalClass.subject as any).name || 'N/A' : String(a.finalClass?.subject || ''));
            const gradeBoard = `${a.finalClass?.grade || '-'} • ${a.finalClass?.board || '-'}`;
            const sessionDate = a.sessionDate ? formatDate(a.sessionDate as any) : '-';
            const topicCovered = (a as any).topicCovered as string | undefined;
            const notes = a.notes;
            const submittedByName = a.submittedBy?.name || (a.submittedBy as any)?.user?.name;
            const submittedAt = a.submittedAt ? formatDateTime(a.submittedAt as any) : '';
            const coordinatorApprovedBy =
              a.coordinatorApprovedBy?.name || (a.coordinatorApprovedBy as any)?.user?.name;
            const coordinatorApprovedAt = a.coordinatorApprovedAt
              ? formatDateTime(a.coordinatorApprovedAt as any)
              : '';
            const parentApprovedBy = a.parentApprovedBy?.name || (a.parentApprovedBy as any)?.user?.name;
            const parentApprovedAt = a.parentApprovedAt ? formatDateTime(a.parentApprovedAt as any) : '';
            const rejectedBy = a.rejectedBy?.name || (a.rejectedBy as any)?.user?.name;
            const rejectedAt = a.rejectedAt ? formatDateTime(a.rejectedAt as any) : '';
            const rejectionReason = a.rejectionReason;
            const studentAttendanceStatus = (a as any).studentAttendanceStatus as string | undefined;

            return (
              <Box
                key={id}
                sx={{
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  p: 2.5,
                  mb: 2,
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'grey.50',
                    borderColor: 'primary.light',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarTodayIcon fontSize="small" color="action" />
                      <Typography variant="subtitle1" fontWeight={600}>
                        {sessionDate}
                      </Typography>
                    </Box>
                    {topicCovered && (
                      <Typography variant="body2" color="text.secondary">
                        Topic: {topicCovered}
                      </Typography>
                    )}
                  </Box>
                  <AttendanceStatusChip status={a.status} />
                </Box>

                <Grid container spacing={2} mb={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight={600}>
                        {studentName || 'Student'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <SchoolIcon fontSize="small" color="action" />
                      <Typography variant="body2">{subjects || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      {gradeBoard}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EventIcon fontSize="small" color="action" />
                      <Typography variant="body2">{sessionDate}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Tooltip title="Student attendance status">
                        <Box>
                          <StudentAttendanceStatusChip studentAttendanceStatus={studentAttendanceStatus} />
                        </Box>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>

                {notes && (
                  <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 2, mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Notes:
                    </Typography>
                    <Typography variant="body2">{notes}</Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      Submitted by
                    </Typography>
                    <Typography variant="body2">{submittedByName || '-'}</Typography>
                    {submittedAt && (
                      <Typography variant="caption" color="text.secondary">
                        {submittedAt}
                      </Typography>
                    )}
                  </Grid>

                  {coordinatorApprovedBy && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Coordinator approved
                      </Typography>
                      <Typography variant="body2">{coordinatorApprovedBy}</Typography>
                      {coordinatorApprovedAt && (
                        <Typography variant="caption" color="text.secondary">
                          {coordinatorApprovedAt}
                        </Typography>
                      )}
                    </Grid>
                  )}

                  {parentApprovedBy && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Parent approved
                      </Typography>
                      <Typography variant="body2">{parentApprovedBy}</Typography>
                      {parentApprovedAt && (
                        <Typography variant="caption" color="text.secondary">
                          {parentApprovedAt}
                        </Typography>
                      )}
                    </Grid>
                  )}

                  {rejectedBy && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Rejected by
                      </Typography>
                      <Typography variant="body2">{rejectedBy}</Typography>
                      {rejectedAt && (
                        <Typography variant="caption" color="text.secondary">
                          {rejectedAt}
                        </Typography>
                      )}
                      {rejectionReason && (
                        <Typography variant="caption" color="error.main">
                          Reason: {rejectionReason}
                        </Typography>
                      )}
                    </Grid>
                  )}
                </Grid>
              </Box>
            );
          })}
        </Box>

        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={pagination.pages || 1}
            page={pagination.page || 1}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default React.memo(AttendanceHistoryCard);

