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
import ErrorIcon from '@mui/icons-material/Error';
import { createAttendance } from '../../services/attendanceService';
import { STUDENT_ATTENDANCE_STATUS } from '../../constants';
import { IFinalClass } from '../../types';
import { useDemoMode } from '../../hooks/useDemoMode';


interface SubmitAttendanceModalProps {
  open: boolean;
  onClose: () => void;
  finalClass: IFinalClass;
  onSuccess?: () => void;
}

const todayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const SubmitAttendanceModal: React.FC<SubmitAttendanceModalProps> = ({ open, onClose, finalClass, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isDemoMode } = useDemoMode();
  const [sessionDate, setSessionDate] = useState<string>(todayStr());

  const [topicCovered, setTopicCovered] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [studentAttendanceStatus, setStudentAttendanceStatus] = useState<string>(
    STUDENT_ATTENDANCE_STATUS.PRESENT
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [alreadyMarked, setAlreadyMarked] = useState<boolean>(false);

  // Determine if today is a scheduled class day for this final class
  const isTodayClassDay = (() => {
    const schedule: any = (finalClass as any)?.schedule;
    if (!schedule || !Array.isArray(schedule.daysOfWeek) || schedule.daysOfWeek.length === 0) return true;
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayName = dayNames[new Date().getDay()];
    return schedule.daysOfWeek.includes(todayName);
  })();

  useEffect(() => {
    checkExistingAttendance();
  }, [finalClass.id, sessionDate, open]);

  const checkExistingAttendance = async () => {
    if (!open || !finalClass.id || !sessionDate) return;
    try {
      setChecking(true);
      if (isDemoMode) {
        setAlreadyMarked(false);
        setChecking(false);
        return;
      }
      // We could optimize this with a specific API, but fetching class attendance is reusing existing endpoint

      // Adjust import if needed: getAttendanceByClass is in services/attendanceService
      const { getAttendanceByClass } = await import('../../services/attendanceService');
      const res = await getAttendanceByClass(finalClass.id);
      const list = res.data || [];

      const exists = list.some((a: any) => {
        const d = new Date(a.sessionDate);
        const target = new Date(sessionDate);
        return d.toDateString() === target.toDateString();
      });

      setAlreadyMarked(exists);
    } catch (err) {
      console.error('Failed to check existing attendance', err);
    } finally {
      setChecking(false);
    }
  };

  const resetState = () => {
    setSessionDate(todayStr());
    setTopicCovered('');
    setNotes('');
    setStudentAttendanceStatus(STUDENT_ATTENDANCE_STATUS.PRESENT);
    setLoading(false);
    setError(null);
    setShowErrorDialog(false);
    setSuccess(false);
    setAlreadyMarked(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowErrorDialog(false);
      setSuccess(false);

      // Always submit attendance for today's date to align with backend rules
      const todayIso = new Date();

      const payload = {
        finalClassId: finalClass.id,
        sessionDate: todayIso.toISOString(),
        topicCovered: topicCovered || undefined,
        notes: notes || undefined,
        studentAttendanceStatus,
      };

      await createAttendance(payload);
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 2000);
    } catch (e: any) {
      // Extract error message - prioritize specific field errors
      let errorMsg = 'An unexpected error occurred';

      if (e?.response?.data?.error) {
        errorMsg = e.response.data.error;
      } else if (e?.response?.data?.message) {
        errorMsg = e.response.data.message;
      } else if (e?.message) {
        errorMsg = e.message;
      } else if (typeof e === 'string') {
        errorMsg = e;
      }

      setError(errorMsg);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Submit Attendance
          <IconButton aria-label="Close" onClick={handleClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>

          {!isTodayClassDay && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Today is not a scheduled day for this class. You cannot submit attendance today.
            </Alert>
          )}

          {alreadyMarked && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Attendance for today has already been marked.
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Class: {finalClass.studentName}</Typography>
            <Typography variant="body2" color="text.secondary">
              Subject: {Array.isArray(finalClass.subject) ? finalClass.subject.map((s: any) => typeof s === 'string' ? s : s?.label || s?.name || 'N/A').join(', ') : (typeof finalClass.subject === 'object' && finalClass.subject !== null ? (finalClass.subject as any).label || (finalClass.subject as any).name || 'N/A' : String(finalClass.subject || ''))}
              {' '}• Grade: {finalClass.grade}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Progress: {finalClass.completedSessions}/{finalClass.classesPerMonth || finalClass.totalSessions} sessions completed
            </Typography>
          </Box>

          <TextField
            type="date"
            label="Session Date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={sessionDate}
            disabled
            sx={{ mb: 2 }}
          />

          <TextField
            label="Topic Covered"
            fullWidth
            placeholder="e.g., Trigonometry - Heights and Distances"
            helperText="Briefly describe what was taught in this session"
            value={topicCovered}
            onChange={(e) => { setTopicCovered(e.target.value); setError(null); }}
            sx={{ mb: 2 }}
            disabled={alreadyMarked}
          />

          <TextField
            select
            label="Student Attendance Status"
            required
            fullWidth
            value={studentAttendanceStatus}
            onChange={(e) => { setStudentAttendanceStatus(e.target.value); setError(null); }}
            helperText="Mark whether the student attended this session"
            sx={{ mb: 2 }}
            disabled={alreadyMarked}
          >
            <MenuItem value={STUDENT_ATTENDANCE_STATUS.PRESENT}>Present</MenuItem>
            <MenuItem value={STUDENT_ATTENDANCE_STATUS.ABSENT}>Absent</MenuItem>
            <MenuItem value={STUDENT_ATTENDANCE_STATUS.LATE}>Late</MenuItem>
          </TextField>

          <TextField
            multiline
            rows={3}
            label="Notes (Optional)"
            fullWidth
            placeholder="Any additional information about this session"
            value={notes}
            onChange={(e) => { setNotes(e.target.value); }}
            disabled={alreadyMarked}
          />

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Attendance submitted successfully!
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: isMobile ? 'column' : 'row', gap: 1 }}>
          <Button variant="outlined" onClick={handleClose} disabled={loading} fullWidth={isMobile}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || checking || !sessionDate || !isTodayClassDay || alreadyMarked}
            startIcon={loading ? <CircularProgress size={18} /> : <CheckCircleIcon />}
            fullWidth={isMobile}
            sx={{ ml: isMobile ? '0 !important' : undefined }}
          >
            {loading ? 'Submitting...' : checking ? 'Checking...' : alreadyMarked ? 'Already Marked' : 'Submit Attendance'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
          <ErrorIcon />
          Error Submitting Attendance
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              <strong>Error Details:</strong>
            </Typography>
            <Box
              sx={{
                backgroundColor: '#ffebee',
                border: '1px solid #ef5350',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
              }}
            >
              <Typography variant="body2" color="#c62828" sx={{ fontFamily: 'monospace' }}>
                {error}
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>What to do:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              If you think this is a mistake, please contact your{' '}
              <strong>Coordinator or Manager</strong> to resolve this issue.
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Please share the error details above when contacting support.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowErrorDialog(false)}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SubmitAttendanceModal;

