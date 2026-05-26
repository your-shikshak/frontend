import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Container, Box, Typography, Button, useScrollTrigger } from '@mui/material';

const font = `'Inter', -apple-system, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

const C = {
  primary:      '#4F46E5',
  primaryDark:  '#3730A3',
  primaryLight: '#818CF8',
  primaryTint:  '#EEF2FF',
  canvas:       '#ffffff',
  surfaceGray:  '#F8FAFC',
  border:       '#E2E8F0',
  ink:          '#0F172A',
  muted:        '#64748B',
  onDark:       '#ffffff',
  accent:       '#06B6D4',
} as const;

export const TutorLeadNavbar = () => {
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 32 });

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: scrolled ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
        transition: 'all 0.2s ease',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: '16px', sm: '32px' } }}>
        <Toolbar
          disableGutters
          sx={{ height: '64px', minHeight: '64px !important', display: 'flex', alignItems: 'center' }}
        >
          {/* Brand */}
          <Box
            component={RouterLink}
            to="/"
            sx={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: `0 4px 12px ${C.primary}44`,
                flexShrink: 0,
              }}
            >
              <Box
                component="img"
                src="/1.jpg"
                alt="Your Shikshak"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
              />
            </Box>

            <Box>
              <Typography
                component="span"
                sx={{
                  fontFamily: font,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '-0.3px',
                  color: C.ink,
                  display: 'block',
                  lineHeight: 1.1,
                }}
              >
                Your Shikshak
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontFamily: font,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '1px',
                  color: C.primary,
                  textTransform: 'uppercase',
                  display: { xs: 'none', sm: 'block' },
                  lineHeight: 1,
                  mt: '1px',
                }}
              >
                Tutor Registration
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              component={RouterLink}
              to="/login"
              disableRipple
              sx={{
                fontFamily: font,
                fontSize: 14,
                fontWeight: 500,
                color: C.muted,
                bgcolor: 'transparent',
                borderRadius: '8px',
                px: '14px',
                height: '38px',
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': { bgcolor: C.surfaceGray, color: C.ink, boxShadow: 'none' },
              }}
            >
              Sign in
            </Button>

            <Button
              component={RouterLink}
              to="/tutor-register"
              disableRipple
              sx={{
                display: { xs: 'none', sm: 'flex' },
                fontFamily: font,
                fontSize: 14,
                fontWeight: 600,
                color: C.onDark,
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                borderRadius: '9999px',
                px: '16px',
                height: '38px',
                textTransform: 'none',
                boxShadow: `0 2px 8px ${C.primary}44`,
                '&:hover': { boxShadow: `0 4px 16px ${C.primary}66` },
              }}
            >
              Get started
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default TutorLeadNavbar;
