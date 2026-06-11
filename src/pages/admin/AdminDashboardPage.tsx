import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Grid, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, Paper, Chip, Collapse, IconButton, alpha } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ClassIcon from '@mui/icons-material/Class';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { subDays, format } from 'date-fns';

// Placeholder hook import; will be implemented in a later phase
import useAdmin from '../../hooks/useAdmin';
import { getLeadFilterOptions } from '../../services/leadService'; // Import service to fetch cities

import MetricsCard from '../../components/dashboard/MetricsCard';
import DateRangePicker from '../../components/dashboard/DateRangePicker';
import ExportButtons from '../../components/dashboard/ExportButtons';
import RefreshButton from '../../components/dashboard/RefreshButton';
// import CumulativeGrowthChart from '../../components/dashboard/CumulativeGrowthChart'; // Removed
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import SnackbarNotification from '../../components/common/SnackbarNotification';
// import FinancialSummaryChart from '../../components/dashboard/FinancialSummaryChart'; // Removed as per request
import SystemHealthCard from '../../components/dashboard/SystemHealthCard';
import RolePerformanceTable from '../../components/dashboard/RolePerformanceTable';
import TeacherGrowthChart from '../../components/dashboard/TeacherGrowthChart';
import ClassGrowthChart from '../../components/dashboard/ClassGrowthChart';
import ClassLeadsChart from '../../components/dashboard/ClassLeadsChart';
import RevenueTrendsChart from '../../components/dashboard/RevenueTrendsChart';
// import { IAdminAnalytics } from '../../types'; // Removed

const AdminDashboardPage: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  // Default to last 365 days so user can see yearly/monthly trends
  const defaultFrom = format(subDays(new Date(), 365), 'yyyy-MM-dd');
  const defaultTo = format(new Date(), 'yyyy-MM-dd');

  // State for Filters
  const [dateRange, setDateRange] = useState<{ fromDate: string; toDate: string; city?: string }>({
    fromDate: defaultFrom, toDate: defaultTo
  });
  const [cities, setCities] = useState<string[]>([]);

  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>(
    { open: false, message: '', severity: 'success' }
  );

  // Fetch cities for filter
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await getLeadFilterOptions();
        if (res.data?.cities) {
          setCities(res.data.cities);
        }
      } catch (err) {
        console.error('Failed to fetch city filters', err);
      }
    };
    fetchCities();
  }, []);

  const {
    analytics: kpiAnalytics,
    loading: kpiLoading,
    error: kpiError,
    refetch: refetchKpi,
  } = useAdmin(dateRange, autoRefresh, 30000);

  // Separate hook for Charts/Graphs to keep them independent of top-level KPI filters
  // Using defaultFrom (365 days) and defaultTo (today) with NO city filter
  const {
    analytics: chartAnalytics,
    loading: chartLoading,
    error: chartError,
    refetch: refetchCharts,
    exportCSV,
    exportPDF,
  } = useAdmin({ fromDate: defaultFrom, toDate: defaultTo }, autoRefresh, 30000);

  const handleDateChange = (range: { fromDate?: string; toDate?: string }) => {
    setDateRange(prev => ({ ...prev, ...range }));
  };

  const handleCityChange = (event: SelectChangeEvent) => {
    const city = event.target.value;
    setDateRange(prev => ({ ...prev, city: city === 'all' ? undefined : city }));
  };

  const handleAutoRefreshToggle = (enabled: boolean) => {
    setAutoRefresh(enabled);
    setLastRefreshed(new Date());
  };

  const handleManualRefresh = async () => {
    await Promise.all([refetchKpi(), refetchCharts()]);
    setLastRefreshed(new Date());
  };

  const handleExportCSV = async (reportType: string) => {
    await exportCSV(reportType);
    setSnackbar({ open: true, message: 'CSV export started', severity: 'success' });
  };

  const handleExportPDF = async (reportType: string) => {
    await exportPDF(reportType);
    setSnackbar({ open: true, message: 'PDF export started', severity: 'success' });
  };

  const reportTypes = [
    { value: 'comprehensive', label: 'Comprehensive Report' },
    { value: 'users', label: 'User Analytics' },
    { value: 'financial', label: 'Financial Summary' },
    { value: 'performance', label: 'Role Performance' },
    { value: 'health', label: 'System Health' },
  ];

  return (
    <Container maxWidth="xl" disableGutters sx={{ px: { xs: 0, sm: 0 } }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)',
          color: 'white',
          py: { xs: 3.5, md: 5 },
          px: { xs: 2.5, md: 4 },
          borderRadius: { xs: 0, md: 3 },
          mb: { xs: 3, md: 4 },
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          /* 3D perspective entrance on mobile */
          '@keyframes heroSlideIn': {
            from: {
              opacity: 0,
              transform: 'perspective(900px) translateZ(-32px) translateY(14px)',
            },
            to: {
              opacity: 1,
              transform: 'perspective(900px) translateZ(0) translateY(0)',
            },
          },
          animation: { xs: 'heroSlideIn 480ms cubic-bezier(0.23,1,0.32,1) forwards', md: 'none' },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            fontWeight={800}
            gutterBottom
            sx={{
              fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.125rem' },
              letterSpacing: { xs: '-0.02em', md: '-0.03em' },
              lineHeight: 1.15,
            }}
          >
            Admin Dashboard
          </Typography>
          <Typography
            sx={{
              opacity: 0.88,
              maxWidth: 600,
              fontSize: { xs: '0.85rem', sm: '1rem' },
              lineHeight: 1.5,
            }}
          >
            Welcome back, {user?.name || 'Admin'}! Here's your system-wide overview.
          </Typography>
        </Box>

        {/* Depth orbs — subtle, not decorative clutter */}
        <Box sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -50,
          right: 20,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }} />
      </Box>

      {/* Action Toolbar */}
      <Paper
        elevation={0}
        sx={{
          mb: { xs: 3, md: 4 },
          borderRadius: { xs: '14px', sm: 2 },
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        {/* ── Collapsed summary row (mobile only) ── */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 1.25,
          }}
        >
          {/* Filters toggle chip */}
          <Chip
            icon={<TuneIcon sx={{ fontSize: '14px !important' }} />}
            label="Filters"
            size="small"
            onClick={() => setFiltersOpen((p) => !p)}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              bgcolor: filtersOpen ? alpha('#6366f1', 0.1) : 'transparent',
              border: '1px solid',
              borderColor: filtersOpen ? alpha('#6366f1', 0.3) : '#E2E8F0',
              color: filtersOpen ? '#6366f1' : 'text.secondary',
              transition: 'all 180ms cubic-bezier(0.23,1,0.32,1)',
              '& .MuiChip-icon': { color: 'inherit' },
            }}
            deleteIcon={
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: '16px !important',
                  transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 220ms cubic-bezier(0.23,1,0.32,1)',
                  color: 'inherit !important',
                }}
              />
            }
            onDelete={() => setFiltersOpen((p) => !p)}
          />

          {/* Active filter summary pill */}
          {dateRange.city && (
            <Chip
              label={dateRange.city}
              size="small"
              onDelete={() => setDateRange((p) => ({ ...p, city: undefined }))}
              sx={{ fontSize: '0.7rem', fontWeight: 600, maxWidth: 100 }}
            />
          )}

          {/* Push actions to right */}
          <Box sx={{ ml: 'auto', display: 'flex', gap: 0.75, alignItems: 'center' }}>
            <RefreshButton
              onRefresh={handleManualRefresh}
              autoRefresh={autoRefresh}
              onAutoRefreshToggle={handleAutoRefreshToggle}
              loading={kpiLoading || chartLoading}
              lastRefreshed={lastRefreshed}
            />
            <ExportButtons
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
              reportTypes={reportTypes as any}
            />
          </Box>
        </Box>

        {/* ── Expandable filter panel (mobile) ── */}
        <Collapse in={filtersOpen} timeout={240}>
          <Box
            sx={{
              px: 1.5,
              pb: 1.5,
              display: { xs: 'flex', sm: 'none' },
              flexDirection: 'column',
              gap: 1.5,
              borderTop: '1px solid #F1F5F9',
            }}
          >
            <Box sx={{ pt: 1.5 }}>
              <DateRangePicker
                fromDate={dateRange.fromDate}
                toDate={dateRange.toDate}
                onDateChange={handleDateChange}
                presets
              />
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel id="city-select-label-m">Filter by City</InputLabel>
              <Select
                labelId="city-select-label-m"
                value={dateRange.city || 'all'}
                label="Filter by City"
                onChange={handleCityChange}
              >
                <MenuItem value="all">All Cities</MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city} value={city}>{city}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Collapse>

        {/* ── Full toolbar (sm and above) ── */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
            p: 2,
          }}
        >
          <Box sx={{ flex: '0 1 240px' }}>
            <DateRangePicker fromDate={dateRange.fromDate} toDate={dateRange.toDate} onDateChange={handleDateChange} presets />
          </Box>
          <Box sx={{ flex: '0 1 200px' }}>
            <FormControl fullWidth size="small">
              <InputLabel id="city-select-label">Filter by City</InputLabel>
              <Select
                labelId="city-select-label"
                value={dateRange.city || 'all'}
                label="Filter by City"
                onChange={handleCityChange}
              >
                <MenuItem value="all">All Cities</MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city} value={city}>{city}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box display="flex" gap={1.5} alignItems="center" sx={{ ml: 'auto' }}>
            <RefreshButton onRefresh={handleManualRefresh} autoRefresh={autoRefresh} onAutoRefreshToggle={handleAutoRefreshToggle} loading={kpiLoading || chartLoading} lastRefreshed={lastRefreshed} />
            <ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} reportTypes={reportTypes as any} />
          </Box>
        </Box>
      </Paper>

      {(kpiError || chartError) && <ErrorAlert error={kpiError || chartError} />}

      {/* Key Metrics - Uses kpiAnalytics (Filtered) */}
      <Box mb={{ xs: 3, sm: 4 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          mb={{ xs: 2, sm: 2.5, md: 3 }}
          sx={{
            fontSize: { xs: '1.15rem', sm: '1.5rem' },
            '@keyframes sectionFadeUpMetrics': {
              from: { opacity: 0, transform: 'translateY(8px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
            animation: { xs: 'sectionFadeUpMetrics 350ms cubic-bezier(0.23,1,0.32,1) 80ms both', md: 'none' },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
          }}
        >
          Key Metrics
        </Typography>
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          <Grid item xs={6} sm={6} md={3} sx={{ minWidth: 0 }}>
            <MetricsCard
              title="Total Class Leads"
              value={kpiAnalytics?.base.kpi?.totalClassLeads?.toLocaleString() ?? '-'}
              subtitle="All time"
              icon={<ContactPhoneIcon />}
              color="secondary.main"
              loading={kpiLoading && !kpiAnalytics}
              animationDelay={0}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ minWidth: 0 }}>
            <MetricsCard
              title="Total Tutors"
              value={kpiAnalytics?.base.kpi?.totalTeachers?.toLocaleString() ?? '-'}
              subtitle={`${kpiAnalytics?.base.kpi?.verifiedTeachers?.toLocaleString() ?? 0} Verified • ${kpiAnalytics?.base.kpi?.activeTeachers?.toLocaleString() ?? 0} Active`}
              icon={<PeopleIcon />}
              color="primary.main"
              loading={kpiLoading && !kpiAnalytics}
              animationDelay={60}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ minWidth: 0 }}>
            <MetricsCard
              title="Active Classes"
              value={kpiAnalytics?.base.kpi?.activeClasses?.toLocaleString() ?? '-'}
              subtitle="Currently running"
              icon={<ClassIcon />}
              color="info.main"
              loading={kpiLoading && !kpiAnalytics}
              animationDelay={120}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ minWidth: 0 }}>
            <MetricsCard
              title="Monthly Revenue"
              value={`₹${kpiAnalytics?.base.kpi?.monthlyRevenue?.toLocaleString() ?? '-'}`}
              subtitle="Current Month"
              icon={<TrendingUpIcon />}
              color="success.main"
              loading={kpiLoading && !kpiAnalytics}
              animationDelay={180}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ minWidth: 0 }}>
            <MetricsCard
              title="Gross Revenue"
              value={`₹${kpiAnalytics?.base.kpi?.grossRevenue?.toLocaleString() ?? '-'}`}
              subtitle="Revenue in period"
              icon={<PaymentIcon />}
              color="success.dark"
              loading={kpiLoading && !kpiAnalytics}
              animationDelay={220}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ minWidth: 0 }}>
            <MetricsCard
              title="Student Churn"
              value={`${kpiAnalytics?.base.kpi?.studentChurn ?? 0}%`}
              subtitle="Cancelled Classes"
              icon={<TrendingDownIcon />}
              color="error.main"
              loading={kpiLoading && !kpiAnalytics}
              animationDelay={260}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ minWidth: 0 }}>
            <MetricsCard
              title="Teacher Churn"
              value={`${kpiAnalytics?.base.kpi?.teacherChurn ?? 0}%`}
              subtitle="Inactive Teachers"
              icon={<TrendingDownIcon />}
              color="error.main"
              loading={kpiLoading && !kpiAnalytics}
              animationDelay={280}
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3} sx={{ minWidth: 0 }}>
            <MetricsCard
              title="Pending Approvals"
              value={
                chartAnalytics?.health
                  ? ((chartAnalytics.health.pendingApprovals?.totalPending || 0) + (chartAnalytics.health.pendingTutorVerifications || 0)).toLocaleString()
                  : '-'
              }
              subtitle={`${chartAnalytics?.health?.pendingApprovals?.attendance?.total || 0} Attendance • ${chartAnalytics?.health?.pendingTutorVerifications || 0} Tutors`}
              icon={<AssignmentIndIcon />}
              color="warning.main"
              loading={chartLoading && !chartAnalytics}
              onClick={() => navigate('/admin/approvals')}
              animationDelay={280}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Analytics & Charts - Uses chartAnalytics (Unfiltered / Default Range) */}
      <Box mb={{ xs: 3, sm: 4 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          mb={{ xs: 2, sm: 2.5, md: 3 }}
          sx={{
            fontSize: { xs: '1.15rem', sm: '1.5rem' },
            '@keyframes sectionFadeUp': {
              from: { opacity: 0, transform: 'translateY(8px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
            animation: { xs: 'sectionFadeUp 350ms cubic-bezier(0.23,1,0.32,1) 200ms both', md: 'none' },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
          }}
        >
          Analytics &amp; Insights
        </Typography>

        {/* Charts — on mobile each chart is full-width with subtle scroll affordance */}
        <Box mb={3}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} md={6}>
              <TeacherGrowthChart data={chartAnalytics?.tutors.growth || []} />
            </Grid>
            <Grid item xs={12} md={6}>
              <ClassGrowthChart data={chartAnalytics?.classes.growth || []} />
            </Grid>
            <Grid item xs={12} md={6}>
              <ClassLeadsChart data={chartAnalytics?.classes.leadsGrowth || []} />
            </Grid>
            <Grid item xs={12} md={6}>
              <RevenueTrendsChart data={chartAnalytics?.finance?.revenueTrends || []} loading={chartLoading && !chartAnalytics} />
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={3}>
          {/* Growth & Health */}

          <Grid item xs={12} md={6} lg={4}>
            <SystemHealthCard data={chartAnalytics?.health} />
          </Grid>

          {/* Role Performance */}
          <Grid item xs={12}>
            <RolePerformanceTable
              managerData={chartAnalytics?.managers}
              coordinatorData={chartAnalytics?.coordinators}
              loading={chartLoading && !chartAnalytics}
            />
          </Grid>
        </Grid>
      </Box>

      {((kpiLoading && !kpiAnalytics) || (chartLoading && !chartAnalytics)) && (
        <LoadingSpinner message="Loading admin dashboard..." />
      )}

      <SnackbarNotification open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} />
    </Container>
  );
};

export default AdminDashboardPage;

