import { useState, useEffect } from 'react';
import { TutorLeadNavbar } from '@/components/tutors/TutorLeadNavbar';
import { TutorLeadForm } from '@/components/tutors/TutorLeadForm';
import type { TutorLeadFormData } from '@/types/tutorLead';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { tutorLeadAPI } from '@/api/client';
import { tutorLeadRegistrationSchema } from '@/schemas/applicationschema';
import {
  Box, Container, Typography, Grid,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import { getMyProfileForEdit, updateMyProfile } from '@/services/tutorService';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import GroupsIcon from '@mui/icons-material/Groups';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const font = `'Inter', -apple-system, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

// Primary brand palette — deep indigo + vibrant accent
const C = {
  // Brand
  primary:       '#4F46E5',   // indigo-600
  primaryDark:   '#3730A3',   // indigo-800
  primaryLight:  '#818CF8',   // indigo-400
  primaryTint:   '#EEF2FF',   // indigo-50

  accent:        '#06B6D4',   // cyan-500
  accentDark:    '#0891B2',   // cyan-600
  accentTint:    '#ECFEFF',   // cyan-50

  emerald:       '#10B981',
  emeraldTint:   '#ECFDF5',
  amber:         '#F59E0B',
  amberTint:     '#FFFBEB',
  rose:          '#F43F5E',
  roseTint:      '#FFF1F2',
  violet:        '#8B5CF6',
  violetTint:    '#F5F3FF',

  // Surfaces
  canvas:        '#ffffff',
  surfaceGray:   '#F8FAFC',
  surfaceMid:    '#F1F5F9',
  border:        '#E2E8F0',
  borderStrong:  '#CBD5E1',

  // Text
  ink:           '#0F172A',   // slate-900
  body:          '#475569',   // slate-600
  muted:         '#94A3B8',   // slate-400
  onDark:        '#ffffff',
  onDarkSoft:    '#CBD5E1',

  // Semantic
  error:         '#EF4444',
  success:       '#10B981',
} as const;

const R = {
  sm:   '8px',
  md:   '12px',
  lg:   '16px',
  xl:   '24px',
  pill: '9999px',
} as const;
// ─────────────────────────────────────────────────────────────────────────────

const stats = [
  { icon: GroupsIcon,      value: '12,000+', label: 'Active Tutors',     color: C.primary,  tint: C.primaryTint },
  { icon: SchoolIcon,      value: '50,000+', label: 'Students Taught',   color: C.accent,   tint: C.accentTint  },
  { icon: VerifiedIcon,    value: '98%',     label: 'Satisfaction Rate', color: C.emerald,  tint: C.emeraldTint },
  { icon: CurrencyRupeeIcon,value: '₹800+', label: 'Avg. Hourly Rate',  color: C.amber,    tint: C.amberTint   },
];

const TutorLeadRegistration = () => {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [initialData, setInitialData] = useState<TutorLeadFormData | null>(null);
  const [errorPopupOpen, setErrorPopupOpen] = useState(false);
  const [errorMessage, setErrorMessage]     = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'edit' ? 'edit' : 'create';

  useEffect(() => {
    if (mode === 'edit') {
      const fetchProfileData = async () => {
        setLoading(true);
        try {
          const resp = await getMyProfileForEdit();
          const data = resp.data || resp;
          setInitialData(data as TutorLeadFormData);
        } catch (error: any) {
          console.error('Failed to fetch profile data:', error);
          toast.error('Failed to load profile data');
        } finally {
          setLoading(false);
        }
      };
      fetchProfileData();
    }
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
        toast.success(
          returnedTeacherId
            ? `Registration successful! Your Teacher ID: ${returnedTeacherId}`
            : 'Registration successful!',
        );
        navigate(
          returnedTeacherId
            ? `/login?email=${encodeURIComponent(data.email)}&teacherId=${encodeURIComponent(returnedTeacherId)}`
            : `/login?email=${encodeURIComponent(data.email)}`,
        );
      }
    } catch (error: any) {
      console.error('Operation failed:', error);
      let msg = 'Registration failed. Please try again.';
      if (error.response?.data?.message) msg = error.response.data.message;
      else if (error.message) msg = error.message;
      setErrorMessage(msg);
      setErrorPopupOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (mode === 'edit' && loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: font,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <LoadingSpinner size={40} message="" />
          <Typography sx={{ mt: 2, fontFamily: font, fontSize: 14, color: C.onDarkSoft }}>
            Loading your profile…
          </Typography>
        </Box>
      </Box>
    );
  }

  // ── Page ───────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: C.surfaceGray, fontFamily: font, overflowX: 'hidden' }}>
      <TutorLeadNavbar />

      {/* ─────────────────────────────────────────────────────────────────────
          HERO — dark gradient split with floating stat cards
      ───────────────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 60%, ${C.accent} 100%)`,
          pt: { xs: '96px', md: '112px' },
          pb: { xs: '80px', md: '120px' },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', top: '30%', right: '15%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(6,182,212,0.12)', pointerEvents: 'none' }} />

        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            {/* Left — headline */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {/* Eyebrow badge */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    px: '12px',
                    py: '5px',
                    mb: '20px',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: R.pill,
                    fontFamily: font,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '1px',
                    color: C.onDark,
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.accent }} />
                  {mode === 'edit' ? 'Update Your Profile' : 'Educator Network'}
                </Box>

                <Typography
                  component="h1"
                  sx={{
                    fontFamily: font,
                    fontSize: { xs: '32px', sm: '44px', md: '52px' },
                    fontWeight: 700,
                    lineHeight: 1.1,
                    letterSpacing: '-1.5px',
                    color: C.onDark,
                    mb: '16px',
                  }}
                >
                  {mode === 'edit' ? (
                    'Update Your Information'
                  ) : (
                    <>
                      Shape the Future
                      <Box component="span" sx={{ color: C.accent, display: 'block' }}>
                        with Your Shikshak
                      </Box>
                    </>
                  )}
                </Typography>

                <Typography
                  sx={{
                    fontFamily: font,
                    fontSize: { xs: 15, md: 17 },
                    fontWeight: 400,
                    lineHeight: 1.6,
                    color: C.onDarkSoft,
                    maxWidth: '480px',
                    mb: '32px',
                  }}
                >
                  {mode === 'edit'
                    ? 'Fill in the remaining details to complete your profile and start receiving class opportunities.'
                    : "Join India's most trusted network of expert home tutors. Share your passion for teaching and earn while making a difference."}
                </Typography>

                {/* Trust pills */}
                {mode === 'create' && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {['✓ Free to Join', '✓ Verified Students', '✓ Guaranteed Payments'].map((t) => (
                      <Box
                        key={t}
                        sx={{
                          px: '14px', py: '7px',
                          bgcolor: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: R.pill,
                          fontFamily: font,
                          fontSize: 13, fontWeight: 500,
                          color: C.onDark,
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {t}
                      </Box>
                    ))}
                  </Box>
                )}
              </motion.div>
            </Grid>

            {/* Right — stat cards */}
            {mode === 'create' && (
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <Grid container spacing={2}>
                    {stats.map(({ icon: Icon, value, label, color, tint }, i) => (
                      <Grid item xs={6} key={label}>
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.08 }}
                        >
                          <Box
                            sx={{
                              p: '20px',
                              bgcolor: 'rgba(255,255,255,0.1)',
                              border: '1px solid rgba(255,255,255,0.18)',
                              borderRadius: R.xl,
                              backdropFilter: 'blur(12px)',
                              textAlign: 'center',
                            }}
                          >
                            <Box
                              sx={{
                                width: 44, height: 44,
                                borderRadius: R.lg,
                                bgcolor: tint,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: '12px',
                              }}
                            >
                              <Icon sx={{ fontSize: 22, color }} />
                            </Box>
                            <Typography sx={{ fontFamily: font, fontSize: { xs: 20, md: 24 }, fontWeight: 700, color: C.onDark, lineHeight: 1 }}>
                              {value}
                            </Typography>
                            <Typography sx={{ fontFamily: font, fontSize: 12, color: C.onDarkSoft, mt: '4px', fontWeight: 400 }}>
                              {label}
                            </Typography>
                          </Box>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </motion.div>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────────────
          FORM — lifted card, negative top margin to overlap hero
      ───────────────────────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: { xs: '-32px', md: '-48px' }, pb: '64px', position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Box
            sx={{
              bgcolor: C.canvas,
              border: `1px solid ${C.border}`,
              borderRadius: R.xl,
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 40px -8px rgba(0,0,0,0.1)',

              // ── Section header overrides ────────────────────────────────
              '& .MuiBox-root[data-section-header]': {
                background: `linear-gradient(90deg, ${C.primaryTint}, transparent)`,
              },

              // ── MUI input overrides ──────────────────────────────────────
              '& .MuiInputBase-root': {
                bgcolor: C.surfaceGray,
                borderRadius: R.md,
                fontFamily: font,
                fontSize: 15,
                color: C.ink,
              },
              '& .MuiInputBase-multiline': { height: 'auto !important' },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: C.border,
                borderRadius: R.md,
              },
              '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: C.borderStrong,
              },
              '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: C.primary,
                borderWidth: '2px',
              },
              '& .MuiInputLabel-root': {
                fontFamily: font,
                fontSize: 14,
                color: C.muted,
              },
              '& .MuiInputLabel-root.Mui-focused': { color: C.primary },
              '& .MuiFormHelperText-root': {
                fontFamily: font,
                fontSize: 12,
                color: C.muted,
              },
              '& .MuiTypography-root': { fontFamily: font },
              '& .MuiFormLabel-root': { fontFamily: font, color: C.muted },
              '& .MuiCheckbox-root': {
                color: C.border,
                '&.Mui-checked': { color: C.primary },
              },
              '& .MuiRadio-root': {
                color: C.border,
                '&.Mui-checked': { color: C.primary },
              },
              '& .MuiChip-root': {
                bgcolor: C.primaryTint,
                color: C.primary,
                fontFamily: font,
                fontSize: 12,
                fontWeight: 500,
                border: `1px solid ${C.primaryLight}44`,
                borderRadius: R.pill,
              },
              '& .MuiButton-contained': {
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%) !important`,
                color: `${C.onDark} !important`,
                fontFamily: font,
                fontWeight: 600,
                fontSize: 16,
                borderRadius: `${R.pill} !important`,
                boxShadow: `0 4px 14px 0 ${C.primary}55 !important`,
                textTransform: 'none',
                letterSpacing: 0,
                height: '52px',
                '&:hover': {
                  boxShadow: `0 6px 20px 0 ${C.primary}77 !important`,
                  transform: 'translateY(-1px)',
                },
                '&:active': { transform: 'none' },
              },
              '& .MuiButton-outlined': {
                borderColor: C.border,
                color: C.ink,
                fontFamily: font,
                fontWeight: 600,
                fontSize: 14,
                borderRadius: `${R.pill} !important`,
                textTransform: 'none',
                bgcolor: C.canvas,
                height: '44px',
                '&:hover': { borderColor: C.primary, bgcolor: C.primaryTint, transform: 'none' },
              },
              '& .MuiButton-text': {
                color: C.primary,
                fontFamily: font,
                fontWeight: 600,
                fontSize: 14,
                textTransform: 'none',
                borderRadius: R.md,
                '&:hover': { bgcolor: C.primaryTint, transform: 'none', boxShadow: 'none' },
              },
              '& .MuiCard-root, & .MuiPaper-root:not(.MuiDialog-paper)': {
                bgcolor: C.canvas,
                border: `1px solid ${C.border}`,
                boxShadow: 'none',
                borderRadius: R.lg,
              },
              '& .MuiDivider-root': { borderColor: C.border },
              '& .MuiSelect-select': { color: C.ink, fontFamily: font },
              '& .MuiMenuItem-root': {
                fontFamily: font,
                fontSize: 14,
                color: C.ink,
                '&:hover': { bgcolor: C.surfaceGray },
                '&.Mui-selected': {
                  bgcolor: C.primaryTint,
                  color: C.primary,
                  '&:hover': { bgcolor: C.primaryTint },
                },
              },
              '& .MuiAutocomplete-paper': {
                bgcolor: C.canvas,
                border: `1px solid ${C.border}`,
                borderRadius: R.lg,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              },
              '& .MuiAutocomplete-option': {
                fontFamily: font,
                fontSize: 14,
                color: C.ink,
                '&:hover': { bgcolor: C.surfaceGray },
                '&[aria-selected="true"]': { bgcolor: C.primaryTint, color: C.primary },
              },
              '& .MuiStepLabel-label': {
                fontFamily: font,
                fontSize: 14,
                color: C.muted,
                '&.Mui-active': { color: C.ink, fontWeight: 600 },
                '&.Mui-completed': { color: C.success },
              },
              '& .MuiStepIcon-root': {
                color: C.border,
                '&.Mui-active': { color: C.primary },
                '&.Mui-completed': { color: C.success },
              },
              '& .MuiSwitch-switchBase.Mui-checked': { color: C.primary },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: C.primary },
              '& input:-webkit-autofill': {
                WebkitBoxShadow: `0 0 0 1000px ${C.surfaceGray} inset`,
                WebkitTextFillColor: C.ink,
              },
            }}
          >
            <TutorLeadForm
              onSubmit={handleSubmit}
              isLoading={submitting}
              initialData={initialData || undefined}
              mode={mode}
            />
          </Box>
        </motion.div>

        {/* Sign-in nudge */}
        {mode === 'create' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <Box textAlign="center" mt="24px">
              <Typography sx={{ fontFamily: font, fontSize: 14, color: C.muted }}>
                Already have an account?{' '}
                <Box
                  component="span"
                  onClick={() => navigate('/login')}
                  sx={{
                    color: C.primary,
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': { color: C.primaryDark },
                    transition: 'color 0.15s ease',
                  }}
                >
                  Sign in
                </Box>
              </Typography>
            </Box>
          </motion.div>
        )}
      </Container>

      {/* ── Error dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={errorPopupOpen}
        onClose={() => setErrorPopupOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: C.canvas,
            border: `1px solid ${C.border}`,
            borderRadius: R.xl,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            fontFamily: font,
            minWidth: { xs: '88vw', sm: 420 },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: font,
            fontSize: 18,
            fontWeight: 700,
            color: C.error,
            pb: '8px',
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          Registration Error
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important', pb: '12px' }}>
          <DialogContentText
            sx={{ fontFamily: font, fontSize: 15, color: C.body, lineHeight: 1.6 }}
          >
            {errorMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: '24px', pb: '20px', pt: '16px', borderTop: `1px solid ${C.border}` }}>
          <Button
            onClick={() => setErrorPopupOpen(false)}
            autoFocus
            sx={{
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
              color: C.onDark,
              fontFamily: font,
              fontWeight: 600,
              fontSize: 14,
              borderRadius: R.pill,
              px: '20px',
              py: '9px',
              height: '44px',
              textTransform: 'none',
              boxShadow: `0 4px 14px 0 ${C.primary}44`,
              '&:hover': { boxShadow: `0 6px 20px 0 ${C.primary}66`, transform: 'none' },
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TutorLeadRegistration;
