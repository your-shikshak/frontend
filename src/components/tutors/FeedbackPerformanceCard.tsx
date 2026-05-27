import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  CardContent,
  Grid,
  Divider,
  Chip,
  LinearProgress,
  Rating,
  Stack,
  Tooltip,
  Button,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { StyledCard } from '../common/StyledCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import EmptyState from '../common/EmptyState';
import MetricsCard from '../dashboard/MetricsCard';
import { getMyProfile, getTutorPerformanceMetrics } from '../../services/tutorService';
import { ITutor, ITutorPerformanceMetrics } from '../../types';

const clamp = (val: number, min: number, max: number) => {
  if (Number.isNaN(val as any)) return min;
  return Math.max(min, Math.min(max, val));
};

const formatPercentage = (value: number) => `${(value ?? 0).toFixed(1)}%`;

const getTierColor = (tier?: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch ((tier || '').toUpperCase()) {
    case 'BRONZE':
      return 'warning';
    case 'SILVER':
      return 'default';
    case 'GOLD':
      return 'success';
    case 'PLATINUM':
      return 'info';
    default:
      return 'default';
  }
};

const getTierLabel = (tier?: string) => {
  const t = (tier || '').toLowerCase();
  return t ? `${t.charAt(0).toUpperCase()}${t.slice(1)} Tier` : 'Tier';
};

const FeedbackPerformanceCard: React.FC = () => {
  const [tutorProfile, setTutorProfile] = useState<ITutor | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<ITutorPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await getMyProfile();
      const profile = profileRes.data;
      setTutorProfile(profile || null);

      const tutorId = (profile as any)?.id || (profile as any)?._id;
      if (tutorId) {
        const perfRes = await getTutorPerformanceMetrics(tutorId);
        setPerformanceMetrics(perfRes.data || null);
      } else {
        setPerformanceMetrics(null);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load performance metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchPerformanceData();
  }, []);

  const ratingColor = (value: number) => {
    if (value >= 4.5) return 'success' as const;
    if (value >= 3.5) return 'info' as const;
    if (value >= 2.5) return 'warning' as const;
    return 'error' as const;
  };

  const ratings = performanceMetrics?.feedbackRatings;

  const ratingItems = useMemo(() => [
    { key: 'overall', label: 'Overall Rating', value: clamp(ratings?.overall ?? 0, 0, 5) },
    { key: 'teachingQuality', label: 'Teaching Quality', value: clamp(ratings?.teachingQuality ?? 0, 0, 5) },
    { key: 'punctuality', label: 'Punctuality', value: clamp(ratings?.punctuality ?? 0, 0, 5) },
    { key: 'communication', label: 'Communication', value: clamp(ratings?.communication ?? 0, 0, 5) },
    { key: 'subjectKnowledge', label: 'Subject Knowledge', value: clamp(ratings?.subjectKnowledge ?? 0, 0, 5) },
  ], [ratings]);

  const lowestRating = useMemo(() => {
    const nonZero = ratingItems.filter(r => r.value > 0);
    if (!nonZero.length) return null;
    return nonZero.reduce((min, cur) => (cur.value < min.value ? cur : min));
  }, [ratingItems]);

  if (loading) {
    return (
      <StyledCard>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" py={6} aria-busy>
            <LoadingSpinner message="Loading performance metrics..." />
          </Box>
        </CardContent>
      </StyledCard>
    );
  }

  if (error && !performanceMetrics) {
    return (
      <StyledCard>
        <CardContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <ErrorAlert error={error} />
            <Box>
              <Button variant="outlined" onClick={fetchPerformanceData}>Retry</Button>
            </Box>
          </Box>
        </CardContent>
      </StyledCard>
    );
  }

  if (!loading && !performanceMetrics) {
    return (
      <StyledCard>
        <CardContent>
          <EmptyState
            icon={<AssessmentIcon color="primary" />}
            title="No Performance Data"
            description="Performance metrics will be available once you receive feedback from students and parents."
          />
        </CardContent>
      </StyledCard>
    );
  }

  const totalFeedback = performanceMetrics?.totalFeedback || 0;
  const overall = clamp(performanceMetrics?.feedbackRatings?.overall ?? 0, 0, 5);
  const totalClassHours = performanceMetrics?.totalClassHours || 0;
  const attendanceApprovalRate = clamp(performanceMetrics?.attendanceApprovalRate ?? 0, 0, 100);
  const recommendationRate = clamp(performanceMetrics?.recommendationRate ?? 0, 0, 100);
  const avgTestScore = clamp(performanceMetrics?.averageTestScore ?? 0, 0, 100);

  const demosTaken = tutorProfile?.demosTaken || 0;
  const demosApproved = tutorProfile?.demosApproved || 0;
  const approvalRatioRaw = tutorProfile?.approvalRatio || 0;
  const approvalRatio = clamp(approvalRatioRaw, 0, 100);

  const conversionDisplay = demosTaken > 0 ? formatPercentage(approvalRatio) : 'N/A';
  const conversionSubtitle = `${demosApproved}/${demosTaken} demos`;

  return (
    <StyledCard>
      <CardContent>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <AssessmentIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>Feedback & Performance</Typography>
          </Box>
          <Tooltip title="Your current performance tier based on ratings and metrics">
            <Chip
              icon={<EmojiEventsIcon />}
              label={getTierLabel(tutorProfile?.tier)}
              color={getTierColor(tutorProfile?.tier)}
              variant="filled"
              size="medium"
              aria-label="tutor tier badge"
            />
          </Tooltip>
          </Box>

          <Box
            sx={{
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 2,
              p: { xs: 2, sm: 2.5 },
              mb: 3,
              bgcolor: 'background.paper',
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={6}>
                <MetricsCard
                  title="Overall Rating"
                  value={`${overall.toFixed(1)}/5.0`}
                  subtitle={`${totalFeedback} review${totalFeedback === 1 ? '' : 's'}`}
                  icon={<StarIcon color="warning" />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <MetricsCard
                  title="Class Hours Completed"
                  value={totalClassHours}
                  subtitle="Total hours of class taken"
                  icon={<CheckCircleIcon color="success" />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <MetricsCard
                  title="Demo Conversion"
                  value={conversionDisplay}
                  subtitle={conversionSubtitle}
                  icon={<TrendingUpIcon color="primary" />}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <StarIcon fontSize="small" />
            <Typography variant="h6" fontWeight={600}>Rating Breakdown</Typography>
          </Box>

          <Stack spacing={2.5}>
            {ratingItems.map((item) => (
              <Box key={item.key}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.value.toFixed(1)}/5.0</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Rating
                    name={`${item.key}-rating`}
                    value={item.value}
                    precision={0.1}
                    readOnly
                    aria-label={`${item.label} rating`}
                    icon={<StarIcon fontSize="inherit" />}
                    emptyIcon={<StarIcon fontSize="inherit" />}
                  />
                  <LinearProgress
                    variant="determinate"
                    value={clamp((item.value / 5) * 100, 0, 100)}
                    color={ratingColor(item.value)}
                    sx={{ height: 8, borderRadius: 1, width: 100 }}
                    aria-label={`${item.label} progress`}
                  />
                </Box>
              </Box>
            ))}
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight={600} mb={2}>Performance Insights</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">Recommendation Rate</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h5" fontWeight={700}>{formatPercentage(recommendationRate)}</Typography>
                  <ThumbUpIcon color="success" fontSize="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">{Math.round((recommendationRate / 100) * totalFeedback)} would recommend</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">Average Test Score</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h5" fontWeight={700}>{`${avgTestScore.toFixed(1)}/100`}</Typography>
                  <SchoolIcon color="info" fontSize="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">Student performance</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2.5, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary">Total Feedback Received</Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: 'primary.main' }}>{totalFeedback}</Typography>
                <Typography variant="body2" color="text.secondary">Thank you for your dedication! Keep up the great work.</Typography>
              </Box>
            </Grid>
          </Grid>

          {lowestRating && lowestRating.value < 4 && (
            <Box sx={{ bgcolor: 'info.lighter', p: 2, borderRadius: 2, mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                💡 Tip: Focus on improving {lowestRating.label.toLowerCase()} to enhance your overall rating and tier level.
              </Typography>
            </Box>
          )}
      </Box>
    </CardContent>
  </StyledCard>
  );
};

export default React.memo(FeedbackPerformanceCard);

