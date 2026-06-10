import { useState, useEffect } from 'react';
import logo from '@/assets/1.jpg';
import { TutorLeadForm } from '@/components/tutors/TutorLeadForm';
import type { TutorLeadFormData } from '@/types/tutorLead';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { tutorLeadAPI } from '@/api/client';
import { tutorLeadRegistrationSchema } from '@/schemas/applicationschema';
import { Box, Container, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, alpha } from '@mui/material';
import { getMyProfileForEdit, updateMyProfile } from '@/services/tutorService';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// ── Left panel stats ──────────────────────────────────────────────────────────
const STATS = [
  { value: '5,000+', label: 'Active Tutors' },
  { value: '₹40k+', label: 'Avg. Monthly Earning' },
  { value: '50,000+', label: 'Students Taught' },
  { value: '4.8★', label: 'Tutor Rating' },
];

const BENEFITS = [
  { icon: '📚', text: 'Get matched with students in your area instantly' },
  { icon: '💰', text: 'Earn ₹25,000–₹80,000 per month teaching what you love' },
  { icon: '🗓️', text: 'Flexible schedule — you decide when you teach' },
  { icon: '🎓', text: 'Free profile, no subscription fees ever' },
  { icon: '🔒', text: 'Verified students, safe & secure platform' },
];

const TutorLeadRegistration = () => {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<TutorLeadFormData | null>(null);
  const [errorPopupOpen, setErrorPopupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'edit' ? 'edit' : 'create';

  useEffect(() => {
    if (mode !== 'edit') return;
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const resp = await getMyProfileForEdit();
        setInitialData((resp.data || resp) as TutorLeadFormData);
      } catch {
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [mode]);

  const handleSubmit = async (data: TutorLeadFormData) => {
    setSubmitting(true);
    try {
      const finalSubjects = data.subjects
        .map((s: any) => (typeof s === 'string' ? s : s?._id || s?.id))
        .filter(Boolean);
      const transformedData = { ...data, subjects: finalSubjects };

      if (mode === 'edit') {
        await updateMyProfile(transformedData);
        toast.success('Profile updated successfully!');
        navigate('/');
      } else {
        const payload = tutorLeadRegistrationSchema.parse(transformedData);
        const resp = await tutorLeadAPI.create(payload as any);
        const returnedTeacherId = resp?.teacherId;
        toast.success(returnedTeacherId ? `Registration successful! Your Teacher ID: ${returnedTeacherId}` : 'Registration successful!');
        navigate(
          returnedTeacherId
            ? `/login?email=${encodeURIComponent(data.email)}&teacherId=${encodeURIComponent(returnedTeacherId)}`
            : `/login?email=${encodeURIComponent(data.email)}`
        );
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      setErrorPopupOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'edit' && loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={48} message="Loading your profile..." />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: { xs: 'column', lg: 'row' } }}>

      {/* ── Left panel ──────────────────────────────────────────────────────── */}
      <Box
        sx={{
          width: { xs: '100%', lg: '42%' },
          minHeight: { lg: '100vh' },
          bgcolor: '#001F54',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: { xs: 'flex-start', lg: 'center' },
          px: { xs: 3, sm: 5, lg: 7 },
          py: { xs: 2.5, sm: 4, lg: 10 },
          position: { lg: 'sticky' },
          top: 0,
          alignSelf: { lg: 'flex-start' },
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: { xs: 2, lg: 6 } }}>
          <Box
            component="img"
            src={logo}
            alt="YourShikshak"
            sx={{
              width: { xs: 44, lg: 56 }, height: { xs: 44, lg: 56 },
              borderRadius: 2, objectFit: 'cover',
              border: '3px solid white',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.2)',
              flexShrink: 0,
            }}
          />
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 20, lg: 24 }, color: 'white', letterSpacing: '-0.5px' }}>
            Your Shikshak
          </Typography>
        </Box>

        {/* Headline */}
        <Typography
          sx={{
            fontSize: { xs: 18, sm: 26, lg: 36 },
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.2,
            letterSpacing: '-0.5px',
            mb: 1.5,
            whiteSpace: 'pre-line',
          }}
        >
          {mode === 'edit' ? 'Update Your\nTeacher Profile' : 'Start Teaching.\nStart Earning.'}
        </Typography>
        {/* Subtitle — hidden on mobile */}
        <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: alpha('#fff', 0.65), fontSize: { sm: 13, lg: 15 }, lineHeight: 1.7, mb: { sm: 3, lg: 5 } }}>
          {mode === 'edit'
            ? 'Keep your profile current to get better student matches.'
            : "Join India's fastest-growing home tuition network. Free to join, no hidden charges."}
        </Typography>

        {/* Stats grid — sm+ only */}
        {mode === 'create' && (
          <Box sx={{ display: { xs: 'none', sm: 'grid' }, gridTemplateColumns: '1fr 1fr', gap: 2, mb: 5 }}>
            {STATS.map((s) => (
              <Box key={s.value} sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#fff', 0.07), border: `1px solid ${alpha('#fff', 0.1)}` }}>
                <Typography sx={{ fontWeight: 800, fontSize: { sm: 18, lg: 22 }, color: '#60A5FA', lineHeight: 1 }}>{s.value}</Typography>
                <Typography sx={{ fontSize: 12, color: alpha('#fff', 0.55), mt: 0.5 }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Benefits list — desktop only */}
        {mode === 'create' && (
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', gap: 2 }}>
            {BENEFITS.map((b) => (
              <Box key={b.text} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, flexShrink: 0, bgcolor: alpha('#fff', 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {b.icon}
                </Box>
                <Typography sx={{ color: alpha('#fff', 0.75), fontSize: 13.5, lineHeight: 1.6, pt: 0.5 }}>
                  {b.text}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Already have account */}
        {mode === 'create' && (
          <Typography sx={{ mt: { xs: 2, lg: 6 }, color: alpha('#fff', 0.4), fontSize: 12 }}>
            Already have an account?{' '}
            <Box component={Link} to="/login" sx={{ color: '#60A5FA', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              Sign in
            </Box>
          </Typography>
        )}
      </Box>

      {/* ── Right panel — form ───────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          bgcolor: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          minHeight: { lg: '100vh' },
          overflowY: 'auto',
        }}
      >
        <Container maxWidth="sm" sx={{ py: { xs: 2.5, sm: 5, lg: 8 }, px: { xs: 2, sm: 3 } }}>

          {/* Top label */}
          <Box sx={{ mb: { xs: 2, lg: 4 } }}>
            <Typography
              sx={{
                display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1,
                bgcolor: alpha('#001F54', 0.07), color: '#001F54',
                fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', mb: 1.5,
              }}
            >
              {mode === 'edit' ? 'Edit Profile' : 'Tutor Registration'}
            </Typography>
            <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
              {mode === 'edit' ? 'Update your information' : 'Create your tutor profile'}
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: 13, mt: 0.5 }}>
              {mode === 'edit'
                ? 'Some fields are locked once verified.'
                : 'Takes about 5 minutes. Your profile goes live after review.'}
            </Typography>
          </Box>

          <TutorLeadForm
            onSubmit={handleSubmit}
            isLoading={submitting}
            initialData={initialData || undefined}
            mode={mode}
          />
        </Container>
      </Box>

      {/* Error dialog */}
      <Dialog open={errorPopupOpen} onClose={() => setErrorPopupOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 700 }}>Registration Error</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary' }}>{errorMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorPopupOpen(false)} variant="contained" color="primary" autoFocus>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TutorLeadRegistration;
