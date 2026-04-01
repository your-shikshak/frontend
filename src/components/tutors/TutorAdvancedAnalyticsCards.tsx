import React, { useEffect, useState } from 'react';
import { Box, Grid2, Typography, CircularProgress, alpha, useTheme, useMediaQuery } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { getTutorAdvancedAnalytics } from '../../services/tutorService';
import { ITutorAdvancedAnalytics } from '../../types';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useDemoMode } from '../../hooks/useDemoMode';


const TutorAdvancedAnalyticsCards: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const user = useSelector(selectCurrentUser);
  const { isDemoMode, getDemoAnalytics } = useDemoMode();
  const [loading, setLoading] = useState(true);

  const [analytics, setAnalytics] = useState<ITutorAdvancedAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const tutorId = (user as any).id || (user as any)._id;
        const res = await getTutorAdvancedAnalytics(tutorId);
        setAnalytics(getDemoAnalytics(res.data));

      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error || !analytics) return null;

  const cards = [
    {
      title: 'Tutor Earnings',
      value: `₹${analytics.earnings.total.toLocaleString()}`,
      subValue: `₹${analytics.earnings.thisMonth.toLocaleString()} this month`,
      icon: <TrendingUpIcon />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
      lightBg: alpha('#10b981', 0.1),
    },
    {
      title: 'Sessions This Week',
      value: analytics.sessions.completedThisWeek,
      subValue: `${analytics.sessions.completedThisMonth} this month`,
      icon: <TimelineIcon />,
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
      lightBg: alpha('#6366f1', 0.1),
    },
    {
      title: 'Teaching Hours',
      value: analytics.totalTeachingHours,
      subValue: 'Total hours this month',
      icon: <CheckCircleOutlineIcon />,
      color: '#1e293b',
      gradient: 'linear-gradient(135deg, #1e293b 0%, #6366f1 100%)',
      lightBg: alpha('#1e293b', 0.1),
    },
    {
      title: 'Demo Approval Rate',
      value: `${Number(analytics.demos.approvalRate || 0).toFixed(2)}%`,
      subValue: `${analytics.demos.approved || 0}/${analytics.demos.total || 0} approved`,
      icon: <RemoveCircleOutlineIcon />,
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
      lightBg: alpha('#6366f1', 0.1),
    },
  ];

  return (
    <Grid2 container spacing={{ xs: 1.5, sm: 3 }} mb={{ xs: 3, sm: 6 }} id="tour-analytics">

      {cards.map((card, index) => (
        <Grid2 key={index} size={{ xs: 6, sm: 6, md: 3 }}>
          <Box
            sx={{
              height: '100%',
              borderRadius: 2,
              bgcolor: '#ffffff',
              p: { xs: 2.25, sm: 3.5 },
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'default',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: `0 24px 48px ${alpha(card.color, 0.12)}`,
                '& .card-icon-container': {
                  transform: 'scale(1.1) rotate(-5deg)',
                  bgcolor: card.color,
                  color: '#fff',
                },
                '& .card-gradient-bar': {
                  height: 8,
                }
              },
            }}
          >
            {/* Top Gradient Bar */}
            <Box 
              className="card-gradient-bar"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 0,
                background: card.gradient,
                transition: 'height 0.3s ease',
              }}
            />

            <Box>
              <Box 
                display="flex" 
                alignItems="center" 
                flexDirection="row"
                gap={1.75} 
                mb={{ xs: 1.5, sm: 3 }}
              >
                <Box
                  className="card-icon-container"
                  sx={{
                    width: { xs: 36, sm: 44 },
                    height: { xs: 36, sm: 44 },
                    borderRadius: 2,
                    bgcolor: alpha(card.color, 0.08),
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.4s ease',
                    boxShadow: `inset 0 0 0 1px ${alpha(card.color, 0.1)}`,
                  }}
                >
                  {React.cloneElement(card.icon as React.ReactElement, { sx: { fontSize: { xs: 18, sm: 22 } } })}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    fontWeight: 900,
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    lineHeight: 1.2,
                  }}
                >
                  {card.title}
                </Typography>
              </Box>
              
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: '#0f172a',
                  fontSize: { xs: '1.4rem', sm: '2.25rem' },
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  mb: { xs: 1, sm: 1.5 },
                }}
              >
                {card.value}
              </Typography>
            </Box>

            <Box 
              sx={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 1,
                mt: 'auto',
                pt: { xs: 1, sm: 1.5 }
              }}
            >
              <Box 
                sx={{ 
                  width: 5, 
                  height: 5, 
                  borderRadius: '50%', 
                  bgcolor: card.color,
                  opacity: 0.6
                }} 
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '0.72rem', sm: '0.85rem' },
                  fontWeight: 700,
                  color: '#64748b',
                  letterSpacing: '0.01em',
                }}
              >
                {card.subValue}
              </Typography>
            </Box>
          </Box>
        </Grid2>
      ))}
    </Grid2>
  );
};

export default TutorAdvancedAnalyticsCards;

