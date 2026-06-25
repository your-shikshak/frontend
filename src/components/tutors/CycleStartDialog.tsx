import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  TextField,
  Alert,
  Chip,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { PendingCycleClass, setCycleStartDate } from '../../services/finalClassService';

interface Props {
  classes: PendingCycleClass[];
  onDone: () => void;
}

export default function CycleStartDialog({ classes, onDone }: Props) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cls = classes[index];
  if (!cls) return null;

  const days = cls.schedule?.daysOfWeek?.join(', ') || '—';

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!date) { setError('Please select a start date.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await setCycleStartDate(cls._id, new Date(date).toISOString());
      if (index + 1 < classes.length) {
        setIndex((i) => i + 1);
        setDate('');
      } else {
        onDone();
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to set start date');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CalendarTodayIcon fontSize="small" color="primary" />
          </Box>
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              Set Your First Class Date
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {cls.studentName}
            </Typography>
          </Box>
          {classes.length > 1 && (
            <Chip
              label={`${index + 1}/${classes.length}`}
              size="small"
              color="primary"
              sx={{ fontWeight: 700 }}
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Box
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            borderRadius: 2,
            p: 1.5,
            mb: 2,
          }}
        >
          <Stack spacing={0.75}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Cycle</Typography>
              <Typography variant="caption" fontWeight={700}>#{cls.currentCycleNumber}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Sessions</Typography>
              <Typography variant="caption" fontWeight={700}>{cls.classesPerMonth} classes</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Schedule</Typography>
              <Typography variant="caption" fontWeight={700} textAlign="right" sx={{ maxWidth: '60%' }}>{days}</Typography>
            </Stack>
            {cls.schedule?.timeSlot && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Time</Typography>
                <Typography variant="caption" fontWeight={700}>{cls.schedule.timeSlot}</Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', mb: 1 }}>
          First class date
        </Typography>

        <TextField
          type="date"
          fullWidth
          size="small"
          value={date}
          inputProps={{ min: today }}
          onChange={(e) => setDate(e.target.value)}
          sx={{ mb: 1.5 }}
        />

        <Typography variant="caption" color="text.secondary">
          We'll generate all {cls.classesPerMonth} sessions for Cycle #{cls.currentCycleNumber} starting from this date, following your {days} schedule.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={submitting || !date}
          onClick={handleSubmit}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          {submitting ? 'Saving…' : 'Confirm & Generate Timetable'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
