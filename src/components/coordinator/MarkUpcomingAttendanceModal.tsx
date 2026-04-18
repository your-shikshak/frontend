import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { createAttendance } from '../../services/attendanceService';
import { STUDENT_ATTENDANCE_STATUS } from '../../constants';

interface MarkUpcomingAttendanceModalProps {
  open: boolean;
  onClose: () => void;
  finalClassId: string;
  studentName: string;
  sessionDate: string; // ISO or YYYY-MM-DD
  initialDuration?: number;
  onSuccess?: () => void;
}

const MarkUpcomingAttendanceModal: React.FC<MarkUpcomingAttendanceModalProps> = ({
  open,
  onClose,
  finalClassId,
  studentName,
  sessionDate,
  initialDuration = 1,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [topicCovered, setTopicCovered] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(initialDuration);
  const [notes, setNotes] = useState<string>('');
  const [studentAttendanceStatus, setStudentAttendanceStatus] = useState<string>(
    STUDENT_ATTENDANCE_STATUS.PRESENT
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setTopicCovered('');
      setNotes('');
      setDurationHours(initialDuration);
      setStudentAttendanceStatus(STUDENT_ATTENDANCE_STATUS.PRESENT);
      setSuccess(false);
      setError(null);
    }
  }, [open, initialDuration]);

  const handleSubmit = async () => {
    if (!topicCovered.trim()) {
      setError('Topic covered is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        finalClassId,
        sessionDate: new Date(sessionDate).toISOString(),
        durationHours,
        topicCovered,
        notes: notes || undefined,
        studentAttendanceStatus,
      };

      await createAttendance(payload);
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Mark Upcoming Attendance
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Student: {studentName}</Typography>
          <Typography variant="body2" color="text.secondary">
            Date: {new Date(sessionDate).toLocaleDateString()}
          </Typography>
        </Box>

        <TextField
          label="Topic Covered"
          fullWidth
          required
          autoFocus
          placeholder="e.g., Introduction to Algebra"
          value={topicCovered}
          onChange={(e) => setTopicCovered(e.target.value)}
          sx={{ mb: 2 }}
          error={!!error && !topicCovered}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Duration (Hours)"
            type="number"
            fullWidth
            value={durationHours}
            onChange={(e) => setDurationHours(Number(e.target.value))}
            inputProps={{ step: 0.5, min: 0.5 }}
          />
          <TextField
            select
            label="Status"
            fullWidth
            value={studentAttendanceStatus}
            onChange={(e) => setStudentAttendanceStatus(e.target.value)}
          >
            <MenuItem value={STUDENT_ATTENDANCE_STATUS.PRESENT}>Present</MenuItem>
            <MenuItem value={STUDENT_ATTENDANCE_STATUS.ABSENT}>Absent</MenuItem>
            <MenuItem value={STUDENT_ATTENDANCE_STATUS.LATE}>Late</MenuItem>
          </TextField>
        </Box>

        <TextField
          multiline
          rows={3}
          label="Notes (Optional)"
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Attendance marked successfully!
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || success}
          startIcon={loading ? <CircularProgress size={18} /> : <CheckCircleIcon />}
        >
          {loading ? 'Submitting...' : 'Mark Attendance'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MarkUpcomingAttendanceModal;
