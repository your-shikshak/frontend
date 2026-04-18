import React, { useState, useEffect } from "react";

import {
  Container,
  Box,
  Typography,
  Grid2,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  useMediaQuery,
  alpha,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/slices/authSlice";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorAlert from "../../components/common/ErrorAlert";
import TutorAdvancedAnalyticsCards from "../../components/tutors/TutorAdvancedAnalyticsCards";
import TodayScheduleCard from "../../components/tutors/TodayScheduleCard";
import ActiveClassesOverviewCard from "../../components/tutors/ActiveClassesOverviewCard";
import ClassLeadsFeedCard from "../../components/tutors/ClassLeadsFeedCard";
import DemoClassesCard from "../../components/tutors/DemoClassesCard";
import VerificationFeeModal from "../../components/tutors/VerificationFeeModal";
import VerificationRejectedModal from "../../components/tutors/VerificationRejectedModal";
import { ITutor } from "../../types";
import { getMyProfile, updateVerificationFeeStatus } from "../../services/tutorService";
import { toast } from "sonner";
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import { useTheme } from '@mui/material/styles';
import { XCircle, AlertCircle } from 'lucide-react';

const TutorDashboardPage: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileTab, setMobileTab] = useState<0 | 1>(0);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [showVerificationFeeModal, setShowVerificationFeeModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [tutorProfile, setTutorProfile] = useState<ITutor | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const checkProfileAndMaybeShow = async () => {
      try {
        const resp = await getMyProfile();
        const data: any = (resp as any)?.data ?? resp;
        const tutor: ITutor | null = (data as ITutor) || null;

        if (!tutor || cancelled) {
          return;
        }

        setTutorProfile(tutor);

        const subjectsEmpty = !tutor.subjects || tutor.subjects.length === 0;
        const qualificationsEmpty = !tutor.qualifications || tutor.qualifications.length === 0;
        const locationsEmpty = !tutor.preferredLocations || tutor.preferredLocations.length === 0;

        const isIncomplete = subjectsEmpty || qualificationsEmpty || locationsEmpty;

        const alreadyShown =
          typeof window !== 'undefined' &&
          window.sessionStorage.getItem('ys_tutor_complete_profile_prompt_shown') === 'true';

        if (isIncomplete && !cancelled && !alreadyShown) {
          setShowCompleteProfileModal(true);
          try {
            if (typeof window !== 'undefined') {
              window.sessionStorage.setItem('ys_tutor_complete_profile_prompt_shown', 'true');
            }
          } catch {
            // ignore storage errors
          }
        }

        // Check for rejection modal
        const rejectionShown =
          typeof window !== 'undefined' &&
          window.sessionStorage.getItem('ys_tutor_rejection_modal_shown') === 'true';

        if (tutor.verificationStatus === 'REJECTED' && !rejectionShown && !cancelled) {
          setShowRejectionModal(true);
          try {
            if (typeof window !== 'undefined') {
              window.sessionStorage.setItem('ys_tutor_rejection_modal_shown', 'true');
            }
          } catch {
            // ignore storage errors
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch profile info");
      }
    };

    checkProfileAndMaybeShow();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleVerificationFeeSubmit = async (data: { method: 'PAY_NOW' | 'DEDUCT_LATER'; file?: File }) => {
    if (!tutorProfile?.id) return;
    try {
      const nextStatus = data.method === 'PAY_NOW' ? 'PAID' : 'DEDUCT_FROM_FIRST_MONTH';

      // Optimistically update local state so the banner disappears immediately
      setTutorProfile((prev) => (prev ? ({ ...prev, verificationFeeStatus: nextStatus } as any) : prev));

      if (data.method === 'PAY_NOW') {
        await updateVerificationFeeStatus(tutorProfile.id, 'PAID', data.file, new Date());
        toast.success('Verification proof submitted successfully! Please wait for admin approval.');
      } else {
        await updateVerificationFeeStatus(tutorProfile.id, 'DEDUCT_FROM_FIRST_MONTH');
        toast.success('Verification method updated. Fee will be deducted from your first payout.');
      }
      const resp = await getMyProfile();
      const fresh: any = (resp as any)?.data ?? resp;
      setTutorProfile(fresh || null);
      setShowVerificationFeeModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit verification details.');
    }
  };

  const isProfileComplete = tutorProfile && ((tutorProfile.subjects?.length ?? 0) > 0);
  const showVerificationBanner = isProfileComplete && (!tutorProfile.verificationFeeStatus || tutorProfile.verificationFeeStatus === 'PENDING');

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <Container maxWidth="xl" disableGutters sx={{ position: "relative", px: { xs: 2.15, sm: 3.5 }, pb: { xs: 10, sm: 4 }, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* ─── Premium Header (Yourshikshak ) ──────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: 2,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
          p: { xs: 2.5, sm: 5 },
          mb: { xs: 2.5, sm: 5 },
          mt: { xs: 1.5, sm: 3 },
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-60%',
            right: '-10%',
            width: '80%',
            height: '240%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(60px)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-40%',
            left: '-15%',
            width: '50%',
            height: '180%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(40px)',
          },
        }}
      >
        <Box position="relative" zIndex={1} display="flex" alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" flexDirection={{ xs: 'column', sm: 'row' }} gap={{ xs: 2, sm: 3 }}>
          <Box>
            <Box display="flex" alignItems="center" gap={1.25} mb={1.5}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 0.75,
                  borderRadius: '50%',
                  bgcolor: alpha('#fbbf24', 0.15),
                }}
              >
                <WavingHandIcon sx={{ color: '#fbbf24', fontSize: { xs: 18, sm: 22 } }} />
              </Box>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.65), fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                {getGreeting()}
              </Typography>
            </Box>
            <Typography
              variant="h3"
              sx={{
                color: '#fff',
                fontWeight: 900,
                fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                mb: 1.5,
              }}
            >
              {user?.name || "Tutor"}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: alpha('#fff', 0.5),
                fontSize: { xs: '0.9rem', sm: '1.05rem' },
                maxWidth: 550,
                fontWeight: 500,
                lineHeight: 1.6,
              }}
            >
              Manage your teaching journey, track student progress, and discover new class opportunities in your personalized digital workspace.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 3,
              py: 1.25,
              borderRadius: 1.5,
              bgcolor: alpha('#fff', 0.05),
              backdropFilter: 'blur(16px)',
              border: `1px solid ${alpha('#fff', 0.12)}`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <Box sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: '#10b981',
              boxShadow: '0 0 12px #10b981',
              animation: 'pulse 2s infinite'
            }} />
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.9), fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              LIVE MONITOR
            </Typography>
            <style>
              {`
                @keyframes pulse {
                  0% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.6; transform: scale(1.1); }
                  100% { opacity: 1; transform: scale(1); }
                }
              `}
            </style>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          filter: showCompleteProfileModal ? "blur(8px)" : "none",
          transition: 'filter 0.3s ease',
          pointerEvents: showCompleteProfileModal ? "none" : "auto",
          userSelect: showCompleteProfileModal ? "none" : "auto",
        }}
      >
        {loading && (
          <Box display="flex" justifyContent="center" py={12}>
            <LoadingSpinner size={56} message="Curating your dashboard..." />
          </Box>
        )}

        {error && <ErrorAlert error={error} />}

        {!loading && !error && (
          <>
            {showVerificationBanner && (
              <Card
                sx={{
                  mb: 4.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  color: '#fff',
                  overflow: 'hidden',
                  position: 'relative',
                  border: 'none',
                  boxShadow: '0 12px 24px rgba(79, 70, 229, 0.2)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '40%',
                    height: '100%',
                    background: 'radial-gradient(circle at 100% 50%, rgba(255,255,255,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  },
                }}
              >
                {/* Banner content remains functional */}
              </Card>
            )}
            {tutorProfile?.verificationStatus === 'REJECTED' && (
              <Box mb={4}>
                <Alert 
                  severity="error" 
                  variant="filled"
                  icon={<XCircle size={24} />}
                  action={
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={() => navigate('/tutor-verification-form')}
                      sx={{ fontWeight: 800, textTransform: 'none', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}
                    >
                      Fix Verification Errors
                    </Button>
                  }
                  sx={{ 
                    borderRadius: '16px', 
                    boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)',
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Verification Rejected
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {tutorProfile.verificationRejectionReason || "Please review your documents and re-submit for verification."}
                    </Typography>
                  </Box>
                </Alert>
              </Box>
            )}
            <TutorAdvancedAnalyticsCards />

            {isMobile && (
              <Box
                sx={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 100,
                  mb: { xs: 2, sm: 3.5 },
                  bgcolor: alpha('#f8fafc', 0.95),
                  backdropFilter: 'blur(16px)',
                  pt: 1,
                  pb: 1,
                  mx: -2.15,
                  px: 2.15,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Tabs
                  value={mobileTab}
                  onChange={(_, v) => setMobileTab(v)}
                  variant="fullWidth"
                  TabIndicatorProps={{
                    style: {
                      height: '100%',
                      borderRadius: 1.5,
                      backgroundColor: '#fff',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                      transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      width: '48%',
                      margin: '0 1%',
                      left: mobileTab === 0 ? '0%' : '50%',
                    },
                  }}
                  sx={{
                    borderRadius: 1.5,
                    minHeight: 44,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    p: 0.5,
                    '& .MuiTab-root': {
                      minHeight: 44,
                      fontWeight: 800,
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      color: alpha(theme.palette.text.secondary, 0.7),
                      transition: 'all 0.3s ease',
                      zIndex: 1,
                    },
                    '& .MuiTab-root.Mui-selected': {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <Tab label="Opportunities" />
                  <Tab label="My Schedule" />
                </Tabs>
              </Box>
            )}
          </>
        )}

        {isMobile ? (
          <Box mb={4}>
            {mobileTab === 0 ? (
              <Box display="flex" flexDirection="column" gap={2}>
                <ClassLeadsFeedCard />
                <DemoClassesCard />
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                <TodayScheduleCard />
                <ActiveClassesOverviewCard />
              </Box>
            )}
          </Box>
        ) : (
          <>
            <Box mb={6}>
              <Box display="flex" alignItems="center" gap={2} mb={3.5}>
                <Box sx={{ width: 6, height: 32, borderRadius: 1, background: 'linear-gradient(to bottom, #6366f1, #3b82f6)' }} />
                <Typography
                  variant="h5"
                  fontWeight={900}
                  sx={{
                    fontSize: "1.65rem",
                    letterSpacing: '-0.02em',
                    color: '#0f172a',
                  }}
                >
                  Priority Actions & Opportunities
                </Typography>
              </Box>
              <Grid2 container spacing={4}>
                <Grid2 size={{ xs: 12, md: 7.5 }}>
                  <Box display="flex" flexDirection="column" gap={4}>
                    <DemoClassesCard />
                    <TodayScheduleCard />
                  </Box>
                </Grid2>
                <Grid2 size={{ xs: 12, md: 4.5 }}>
                  <ClassLeadsFeedCard />
                </Grid2>
              </Grid2>
            </Box>

            <Box mt={6} mb={8}>
              <Box display="flex" alignItems="center" gap={2} mb={3.5}>
                <Box sx={{ width: 6, height: 32, borderRadius: 1, background: 'linear-gradient(to bottom, #10b981, #059669)' }} />
                <Typography
                  variant="h5"
                  fontWeight={900}
                  sx={{
                    fontSize: "1.65rem",
                    letterSpacing: '-0.02em',
                    color: '#0f172a',
                  }}
                >
                  Active Teaching Portfolio
                </Typography>
              </Box>
              <ActiveClassesOverviewCard />
            </Box>
          </>
        )}
      </Box>

      {showCompleteProfileModal && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 3000,
            bgcolor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: 'blur(12px)',
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <Card
            sx={{
              maxWidth: 460,
              width: "100%",
              borderRadius: 2,
              boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
              border: 'none',
              overflow: 'visible',
              position: 'relative',
            }}
          >
            <CardContent sx={{ p: { xs: 4, sm: 6 } }}>
              <Box textAlign="center" mb={3.5}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    transform: 'rotate(-5deg)',
                    boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                  }}
                >
                  <VerifiedUserIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                </Box>
              </Box>
              <Typography
                variant="h5"
                fontWeight={900}
                gutterBottom
                align="center"
                sx={{ letterSpacing: '-0.02em', color: '#0f172a' }}
              >
                Let's Unlock Your Potential
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                align="center"
                sx={{ mb: 4.5, fontWeight: 500, lineHeight: 1.6 }}
              >
                Complete your profile to help our team match you with the best teaching opportunities that fit your expertise and preferences.
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setShowCompleteProfileModal(false);
                  navigate("/tutor-register?mode=edit");
                }}
                sx={{
                  py: 2,
                  borderRadius: 1.5,
                  fontWeight: 800,
                  textTransform: 'none',
                  fontSize: '1.05rem',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 15px 35px rgba(79, 70, 229, 0.4)',
                  },
                }}
                fullWidth
              >
                Ignite My Profile
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Verification Fee Modal */}
      <VerificationFeeModal
        open={showVerificationFeeModal}
        onClose={() => setShowVerificationFeeModal(false)}
        onSubmit={handleVerificationFeeSubmit}
      />

      {/* Verification Rejected Modal */}
      <VerificationRejectedModal
        open={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        reason={tutorProfile?.verificationRejectionReason}
      />

    </Container>

  );
};

export default TutorDashboardPage;

