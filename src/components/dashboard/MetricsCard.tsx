import React from 'react';
import { Card, CardContent, Typography, Box, Avatar, Skeleton, alpha, useTheme, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

type Props = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  gradient?: string;
  trend?: number;
  loading?: boolean;
  onClick?: () => void;
  animationDelay?: number;
};

const MetricsCard: React.FC<Props> = ({ title, value, subtitle, icon, color = 'primary.main', gradient, trend, loading = false, onClick, animationDelay = 0 }) => {
  const theme = useTheme();

  const resolveColor = (c: string): string => {
    if (typeof c === 'string' && c.includes('.')) {
      const [k1, k2] = c.split('.');
      const paletteAny: any = theme.palette as any;
      const varsAny: any = (theme as any).vars?.palette;
      const fromPalette = paletteAny?.[k1]?.[k2];
      if (typeof fromPalette === 'string') return fromPalette;
      const fromVars = varsAny?.[k1]?.[k2];
      if (typeof fromVars === 'string') return fromVars;
      return paletteAny?.primary?.main || '#1976d2';
    }
    return c;
  };

  const resolvedColor = resolveColor(color);

  if (loading) {
    return (
      <Card
        elevation={0}
        sx={{
          height: '100%',
          border: '1px solid #E2E8F0',
          borderRadius: { xs: '16px', sm: '20px' },
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Skeleton variant="rounded" width={36} height={36} sx={{ mb: 1.5, borderRadius: '10px' }} />
          <Skeleton variant="text" width="60%" height={28} />
          <Skeleton variant="text" width="80%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: { xs: '16px', sm: '20px' },
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        background: theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.8)
          : '#fff',
        /* 3D layered depth shadow — color-tinted bottom layer for dimension */
        boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(0,0,0,0.04), 0 4px 10px ${alpha(resolvedColor, 0.06)}`,
        transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1), box-shadow 200ms cubic-bezier(0.23,1,0.32,1)',
        /* Entrance animation — starts from slight 3D depth push */
        '@keyframes cardEntrance': {
          from: {
            opacity: 0,
            transform: 'perspective(600px) translateZ(-12px) translateY(8px)',
          },
          to: {
            opacity: 1,
            transform: 'perspective(600px) translateZ(0) translateY(0)',
          },
        },
        animation: { xs: `cardEntrance 320ms cubic-bezier(0.23,1,0.32,1) ${animationDelay}ms both`, md: 'none' },
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
          opacity: 1,
        },
        /* Tap feedback — mobile */
        '@media (hover: none)': {
          '&:active': {
            transform: 'scale(0.97)',
            transition: 'transform 100ms cubic-bezier(0.23,1,0.32,1)',
          },
        },
        /* Hover — desktop only */
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': onClick ? {
            transform: 'perspective(600px) translateZ(8px) translateY(-4px)',
            boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 8px 20px rgba(0,0,0,0.07), 0 16px 32px ${alpha(resolvedColor, 0.08)}`,
            borderColor: alpha(resolvedColor, 0.25),
          } : {},
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: `radial-gradient(circle at top right, ${alpha(resolvedColor, 0.09)}, transparent 70%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={{ xs: 1.5, sm: 2.5 }}>
          <Avatar
            sx={{
              bgcolor: alpha(resolvedColor, 0.1),
              color: resolvedColor,
              width: { xs: 38, sm: 52 },
              height: { xs: 38, sm: 52 },
              borderRadius: { xs: '10px', sm: '14px' },
              transition: 'transform 200ms cubic-bezier(0.23,1,0.32,1)',
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: { xs: 19, sm: 26 } } })}
          </Avatar>
          {typeof trend === 'number' && (
            <Chip
              icon={trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${Math.abs(trend)}%`}
              size="small"
              sx={{
                bgcolor: trend > 0 ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                color: trend > 0 ? 'success.main' : 'error.main',
                fontWeight: 700,
                borderRadius: '8px',
                '& .MuiChip-icon': { fontSize: 14, color: 'inherit' },
              }}
            />
          )}
        </Box>

        <Typography
          fontWeight={800}
          sx={{
            color: 'text.primary',
            mb: 0.5,
            letterSpacing: '-0.02em',
            fontSize: { xs: '1.35rem', sm: '2.125rem' },
            lineHeight: { xs: 1.2, sm: 1.235 },
          }}
        >
          {value}
        </Typography>

        <Typography
          color="text.secondary"
          fontWeight={600}
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: { xs: 'none', sm: 'block' },
              mt: 1,
              opacity: 0.8,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricsCard;
