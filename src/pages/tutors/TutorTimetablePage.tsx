import { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Paper,
  Avatar,
  Divider,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  useMediaQuery,
  useTheme,
  alpha
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TodayIcon from '@mui/icons-material/Today';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SchoolIcon from '@mui/icons-material/School';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { getMyClasses, updateFinalClassSchedule, getPendingCycleStarts, PendingCycleClass } from '../../services/finalClassService';
import { IFinalClass, IClassSession } from '../../types';
import { getMyTutorSessionsForCycle } from '../../services/classSessionService';
import { requestTutorReschedule } from '../../services/rescheduleRequestService';
import ScheduleTestModal from '../../components/tutors/ScheduleTestModal';
import CycleStartDialog from '../../components/tutors/CycleStartDialog';
import { FINAL_CLASS_STATUS } from '../../constants';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';

const DAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CalendarDayCellProps {
  date: Date;
  classesForDate: IFinalClass[];
  onClick: (date: Date, classesForDate: IFinalClass[]) => void;
}

const CalendarDayCell: React.FC<CalendarDayCellProps> = ({ date, classesForDate, onClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dayNumber = date.getDate();
  const dateClasses = classesForDate;

  const isRescheduledDay = dateClasses.some((cls: any) => cls && (cls as any).__isRescheduledForDate);

  const isToday = (() => {
    const now = new Date();
    return (
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate()
    );
  })();

  const hasClasses = dateClasses.length > 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1, sm: 1.25, md: 1.75 },
        minHeight: { xs: 70, sm: 95, md: 115 },
        height: '100%',
        bgcolor: isToday
          ? alpha('#6366f1', 0.03)
          : isRescheduledDay
            ? alpha('#f59e0b', 0.03)
            : '#ffffff',
        border: 'none',
        boxShadow: isToday 
          ? `inset 0 0 0 1.5px ${alpha('#6366f1', 0.15)}, 0 4px 12px ${alpha('#6366f1', 0.04)}`
          : '0 2px 8px rgba(15, 23, 42, 0.02)',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: hasClasses ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        '&::after': hasClasses ? {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: isRescheduledDay ? '#f59e0b' : '#6366f1',
          opacity: 0.8,
        } : {},
        '&:hover': hasClasses ? {
          bgcolor: isToday ? alpha('#6366f1', 0.05) : '#ffffff',
          transform: { xs: 'none', sm: 'translateY(-2px)' },
          boxShadow: `0 12px 24px ${alpha('#0f172a', 0.06)}`,
        } : {},
      }}
      onClick={() => hasClasses && onClick(date, dateClasses)}
    >
      {/* Day Number Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={{ xs: 0.5, sm: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.9rem' },
            fontWeight: isToday ? 900 : 700,
            color: isToday ? '#6366f1' : '#1e293b',
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          {dayNumber}
        </Typography>
        {isToday && !isMobile && (
          <Chip
            label="TODAY"
            size="small"
            sx={{
              height: 18,
              fontSize: '0.55rem',
              fontWeight: 900,
              letterSpacing: '0.05em',
              bgcolor: alpha('#6366f1', 0.1),
              color: '#4f46e5',
              backdropFilter: 'blur(4px)',
              border: 'none',
            }}
          />
        )}
        {!isToday && isRescheduledDay && !isMobile && (
          <Chip
            label="MOVED"
            size="small"
            sx={{
              height: 18,
              fontSize: '0.55rem',
              fontWeight: 900,
              letterSpacing: '0.05em',
              bgcolor: alpha('#f59e0b', 0.1),
              color: '#d97706',
              backdropFilter: 'blur(4px)',
            }}
          />
        )}
      </Box>

      {/* Class Information */}
      <Box flexGrow={1} display="flex" flexDirection="column" gap={{ xs: 0.5, sm: 0.75 }}>
        {hasClasses ? (
          (() => {
            const first = dateClasses[0];
            const sched: any = (first as any).schedule || {};
            const timeSlot: string = sched.timeSlot || '';
            const extraCount = dateClasses.length - 1;
            return (
              <>
                {!isMobile ? (
                  <>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                      <Box
                        sx={{
                          width: { xs: 18, sm: 20, md: 22 },
                          height: { xs: 18, sm: 20, md: 22 },
                          bgcolor: alpha('#6366f1', 0.1),
                          color: '#6366f1',
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.72rem' },
                          fontWeight: 800,
                        }}
                      >
                        {first.studentName?.charAt(0) || 'S'}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          color: '#334155',
                          fontSize: { xs: '0.7rem', sm: '0.78rem', md: '0.85rem' },
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}
                        noWrap
                      >
                        {first.studentName}
                      </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ opacity: 0.8 }}>
                      <AccessTimeIcon sx={{ fontSize: { xs: 11, sm: 12, md: 14 }, color: '#64748b' }} />
                      <Typography
                        variant="caption"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                          color: '#64748b',
                          fontWeight: 600,
                          letterSpacing: '0.01em',
                        }}
                        noWrap
                      >
                        {timeSlot || 'TIME N/A'}
                      </Typography>
                    </Stack>

                    {extraCount > 0 && (
                      <Box
                        sx={{
                          mt: 0.5,
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: alpha('#6366f1', 0.05),
                          width: 'fit-content',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ 
                            fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.68rem' }, 
                            color: '#6366f1',
                            fontWeight: 800,
                            letterSpacing: '0.03em',
                          }}
                        >
                          +{extraCount} OTHERS
                        </Typography>
                      </Box>
                    )}
                  </>
                ) : (
                  <Box 
                    sx={{ 
                      textAlign: 'center',
                      bgcolor: alpha('#6366f1', 0.08),
                      borderRadius: 1.5,
                      py: 0.5,
                      mt: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 900 }}
                    >
                      {dateClasses.length}
                    </Typography>
                  </Box>
                )}
              </>
            );
          })()
        ) : (
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              opacity: 0.2,
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '1rem', fontWeight: 300 }}>
              —
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

const TutorTimetablePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDialogFullScreen = isMobile;
  const user = useSelector(selectCurrentUser);
  const [classes, setClasses] = useState<IFinalClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<IFinalClass[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleModalClass, setScheduleModalClass] = useState<IFinalClass | null>(null);
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [scheduleStartTime, setScheduleStartTime] = useState('');
  const [scheduleStartDate, setScheduleStartDate] = useState('');
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [cycleSessions, setCycleSessions] = useState<any[]>([]);

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testModalClass, setTestModalClass] = useState<IFinalClass | null>(null);

  // ─── Pending cycle starts ────────────────────────────
  const [pendingCycles, setPendingCycles] = useState<PendingCycleClass[]>([]);

  // ─── Reschedule state ────────────────────────────────
  const [rescheduleSession_, setRescheduleSession] = useState<IClassSession | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSaving, setRescheduleSaving] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleSubmitted, setRescheduleSubmitted] = useState(false);

  // ─── Mobile week state ───────────────────────
  const [mobileWeekStart, setMobileWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday-based
    const mon = new Date(now);
    mon.setDate(now.getDate() - diff);
    mon.setHours(0, 0, 0, 0);
    return mon;
  });
  const [mobileSelectedDay, setMobileSelectedDay] = useState<Date>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  const mobileWeekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mobileWeekStart);
      d.setDate(mobileWeekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [mobileWeekStart]);

  const handleMobilePrevWeek = () => {
    setMobileWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleMobileNextWeek = () => {
    setMobileWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isDateToday = (d: Date) => isSameDay(d, new Date());

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!user) {
          setError('User not found');
          setLoading(false);
          return;
        }
        const tutorId = (user as any).id || (user as any)._id;
        const [res, pendingRes] = await Promise.all([
          getMyClasses(tutorId, FINAL_CLASS_STATUS.ACTIVE),
          getPendingCycleStarts().catch(() => ({ data: [] as PendingCycleClass[] })),
        ]);
        setClasses(res.data || []);
        if (pendingRes.data?.length) setPendingCycles(pendingRes.data);
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'Failed to load timetable';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      try {
        setSessionsLoading(true);
        setSessionsError(null);
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();
        const resp = await getMyTutorSessionsForCycle({ month, year, ensure: true });
        setCycleSessions(Array.isArray(resp.data) ? resp.data : []);
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'Failed to load sessions';
        setSessionsError(msg);
        setCycleSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    void fetchSessions();
  }, [user, currentMonth]);

  const isClassOnDate = (cls: IFinalClass, date: Date): boolean => {
    const normalize = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(0, 0, 0, 0);
      return nd.getTime();
    };

    const reschedules: any[] = ((cls as any).oneTimeReschedules || []).map((r: any) => ({ ...r }));

    const isRescheduleTarget = reschedules.some((r) => normalize(new Date(r.toDate)) === normalize(date));
    if (isRescheduleTarget) {
      return true;
    }

    const isMovedFromDate = reschedules.some(
      (r) => normalize(new Date(r.fromDate)) === normalize(date) && normalize(new Date(r.toDate)) !== normalize(new Date(r.fromDate))
    );
    if (isMovedFromDate) {
      return false;
    }

    const sched: any = (cls as any).schedule || {};
    const daysOfWeek: string[] = Array.isArray(sched.daysOfWeek) ? sched.daysOfWeek : [];
    if (!daysOfWeek.length) return false;

    const classStart = cls.startDate ? new Date(cls.startDate) : null;
    const classEnd = (cls as any).endDate ? new Date((cls as any).endDate) : null;

    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    if (classStart) {
      const start = new Date(classStart);
      start.setHours(0, 0, 0, 0);
      if (day < start) return false;
    }
    if (classEnd) {
      const end = new Date(classEnd);
      end.setHours(0, 0, 0, 0);
      if (day > end) return false;
    }

    const weekdayIndex = (day.getDay() + 6) % 7;
    const weekdayName = DAYS_ORDER[weekdayIndex];
    return daysOfWeek.includes(weekdayName);
  };

  const sessionsByDay = useMemo(() => {
    const normalize = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(0, 0, 0, 0);
      return nd.getTime();
    };

    const map = new Map<number, any[]>();
    (cycleSessions || []).forEach((s: any) => {
      const dt = new Date(s.sessionDate);
      if (Number.isNaN(dt.getTime())) return;
      const key = normalize(dt);
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });

    return map;
  }, [cycleSessions]);

  const getClassesForDate = (date: Date) => {
    const normalize = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(0, 0, 0, 0);
      return nd.getTime();
    };

    const key = normalize(date);
    const sessions = sessionsByDay.get(key) || [];

    const classesFromSessions = sessions
      .map((s: any) => {
        const cls = (s.finalClass || null) as any;
        if (!cls) return null;

        // Respect legacy one-time reschedule behavior for display.
        const reschedules: any[] = ((cls as any).oneTimeReschedules || []).map((r: any) => ({ ...r }));

        const isMovedFromDate = reschedules.some(
          (r) => normalize(new Date(r.fromDate)) === key && normalize(new Date(r.toDate)) !== normalize(new Date(r.fromDate))
        );
        if (isMovedFromDate) return null;

        const anyCls: any = { ...cls };
        const sched = anyCls.schedule || {};
        anyCls.schedule = { ...sched, timeSlot: String(s.timeSlot || sched.timeSlot || '') };

        const match = reschedules.find((r) => normalize(new Date(r.toDate)) === key);
        if (match) {
          anyCls.schedule = { ...anyCls.schedule, timeSlot: match.timeSlot };
          anyCls.__isRescheduledForDate = true;
        }

        return anyCls as IFinalClass;
      })
      .filter(Boolean) as IFinalClass[];

    return classesFromSessions;
  };

  const mobileSelectedDayClasses = useMemo(() => {
    return getClassesForDate(mobileSelectedDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileSelectedDay, sessionsByDay]);

  const mobileSelectedDayClassCount = mobileSelectedDayClasses.length;

  const mobileWeekLabel = useMemo(() => {
    const start = mobileWeekDays[0];
    const end = mobileWeekDays[6];
    const sameMonth = start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${start.toLocaleDateString(undefined, { month: 'short' })} ${start.getDate()} – ${end.getDate()}`;
    }
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }, [mobileWeekDays]);


  const unscheduledClasses = useMemo(() => {
    return classes.filter((cls) => {
      const sched: any = (cls as any).schedule || {};
      const days: string[] = Array.isArray(sched.daysOfWeek) ? sched.daysOfWeek : [];
      const hasDays = days.length > 0;
      const hasTime = !!sched.timeSlot;
      return !hasDays || !hasTime;
    });
  }, [classes]);

  const parseTimeToMinutes = (t: string): number | null => {
    if (!t || !t.includes(':')) return null;
    const [hh, mm] = t.split(':').map((x) => x.trim());
    const h = Number(hh);
    const m = Number(mm);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  };

  const minutesToTime = (mins: number): string => {
    const safe = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const getComputedEndTime = (cls: IFinalClass | null, start: string): string => {
    const durationHoursRaw = (cls as any)?.classLead?.classDurationHours;
    const durationHours = typeof durationHoursRaw === 'number' && durationHoursRaw > 0 ? durationHoursRaw : 1;
    const startMinutes = parseTimeToMinutes(start);
    if (startMinutes == null) return '';
    const endMinutes = startMinutes + Math.round(durationHours * 60);
    return minutesToTime(endMinutes);
  };

  const openScheduleModal = (cls: IFinalClass) => {
    const sched: any = (cls as any).schedule || {};
    const days: string[] = Array.isArray(sched.daysOfWeek) ? sched.daysOfWeek : [];
    const timeSlot: string = sched.timeSlot || '';
    const rawStartDate = sched.startDate;
    const startDateIso = rawStartDate ? new Date(rawStartDate).toISOString().slice(0, 10) : '';
    let start = '';
    if (timeSlot && timeSlot.includes('-')) {
      const parts = timeSlot.split('-');
      if (parts[0]) start = parts[0].trim();
    }
    setScheduleModalClass(cls);
    setScheduleDays(days);
    setScheduleStartTime(start);
    setScheduleStartDate(startDateIso);
    setScheduleError(null);
    setScheduleSuccess(null);
    setScheduleModalOpen(true);
  };

  const closeScheduleModal = () => {
    setScheduleModalOpen(false);
    setScheduleModalClass(null);
  };

  const toggleDay = (day: string) => {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveSchedule = async () => {
    if (!scheduleModalClass) return;
    if (!scheduleStartDate) {
      setScheduleError('Please select a start date.');
      return;
    }
    if (!scheduleDays.length) {
      setScheduleError('Please select at least one day.');
      return;
    }
    if (!scheduleStartTime) {
      setScheduleError('Please select a start time.');
      return;
    }

    const computedEndTime = getComputedEndTime(scheduleModalClass, scheduleStartTime);
    const startMinutes = parseTimeToMinutes(scheduleStartTime);
    const endMinutes = parseTimeToMinutes(computedEndTime);
    if (startMinutes == null || endMinutes == null) {
      setScheduleError('Invalid time format.');
      return;
    }
    if (endMinutes <= startMinutes) {
      setScheduleError('Computed end time must be after start time.');
      return;
    }

    const hasClash = classes.some((c) => {
      if (c.id === scheduleModalClass.id) return false;
      const sched: any = (c as any).schedule || {};
      const days: string[] = Array.isArray(sched.daysOfWeek) ? sched.daysOfWeek : [];
      if (!days.length) return false;
      const intersects = days.some((d) => scheduleDays.includes(d));
      if (!intersects) return false;
      const slot: string = sched.timeSlot || '';
      if (!slot || !slot.includes('-')) return false;
      const parts = slot.split('-');
      const cStart = parseTimeToMinutes(parts[0].trim());
      const cEnd = parseTimeToMinutes((parts[1] || '').trim());
      if (cStart == null || cEnd == null) return false;
      return startMinutes < cEnd && endMinutes > cStart;
    });

    if (hasClash) {
      setScheduleError('This time range clashes with another class on one or more selected days.');
      return;
    }
    try {
      setScheduleSaving(true);
      setScheduleError(null);
      setScheduleSuccess(null);
      const timeSlot = `${scheduleStartTime} - ${computedEndTime}`;
      const resp = await updateFinalClassSchedule(scheduleModalClass.id, {
        startDate: scheduleStartDate,
        daysOfWeek: scheduleDays,
        timeSlot,
      });
      const updated = resp.data;
      setClasses((prev) => prev.map((c) => (c.id === updated.id ? (updated as any) : c)));
      setScheduleSuccess('Timetable updated successfully.');

      // Refresh sessions for this cycle (best-effort)
      try {
        const anchor = new Date(scheduleStartDate);
        anchor.setHours(0, 0, 0, 0);
        setCurrentMonth(() => {
          const d = new Date(anchor);
          d.setDate(1);
          d.setHours(0, 0, 0, 0);
          return d;
        });
        const month = anchor.getMonth() + 1;
        const year = anchor.getFullYear();
        const sResp = await getMyTutorSessionsForCycle({ month, year, ensure: true });
        setCycleSessions(Array.isArray(sResp.data) ? sResp.data : []);
      } catch {
        // ignore
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to update timetable.';
      setScheduleError(msg);
    } finally {
      setScheduleSaving(false);
    }
  };

  const openReschedule = (session: IClassSession) => {
    const d = new Date(session.sessionDate);
    setRescheduleDate(d.toISOString().slice(0, 10));
    const slotParts = session.timeSlot?.split(' - ');
    setRescheduleTime(slotParts?.[0]?.trim() || '');
    setRescheduleError(null);
    setRescheduleSession(session);
  };

  const handleRescheduleConfirm = async () => {
    if (!rescheduleSession_ || !rescheduleDate) return;
    setRescheduleSaving(true);
    setRescheduleError(null);
    try {
      await requestTutorReschedule(rescheduleSession_.id, new Date(rescheduleDate).toISOString());
      setRescheduleSubmitted(true);
    } catch (e: any) {
      setRescheduleError(e?.response?.data?.message || 'Failed to submit reschedule request.');
    } finally {
      setRescheduleSaving(false);
    }
  };

  const handleRescheduleClose = () => {
    setRescheduleSession(null);
    setRescheduleDate('');
    setRescheduleError(null);
    setRescheduleSubmitted(false);
  };

  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    const firstWeekdayIndex = (firstOfMonth.getDay() + 6) % 7;

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstWeekdayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= lastOfMonth.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };





  const formatMonthYear = (date: Date) =>
    date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const handleDayClick = (date: Date, dayClasses: IFinalClass[]) => {
    setSelectedDate(date);
    setSelectedClasses(dayClasses);
  };

  const handleCloseDialog = () => {
    setSelectedDate(null);
    setSelectedClasses([]);
  };

  const openTestModalForClass = (cls: IFinalClass) => {
    setTestModalClass(cls);
    setTestModalOpen(true);
  };

  const closeTestModal = () => {
    setTestModalOpen(false);
    setTestModalClass(null);
  };

  if (loading || sessionsLoading) {
    return (
      <Container maxWidth="xl" disableGutters>
        <Box display="flex" justifyContent="center" py={8}>
          <LoadingSpinner size={48} message="Loading timetable..." />
        </Box>
      </Container>
    );
  }

  if (error || sessionsError) {
    return (
      <Container maxWidth="xl" disableGutters>
        <ErrorAlert error={error || sessionsError} />
      </Container>
    );
  }

  return (
    <>
    {pendingCycles.length > 0 && (
      <CycleStartDialog
        classes={pendingCycles}
        onDone={() => {
          setPendingCycles([]);
          // Refresh sessions after cycle start dates are set
          const month = currentMonth.getMonth() + 1;
          const year = currentMonth.getFullYear();
          getMyTutorSessionsForCycle({ month, year, ensure: true })
            .then((r) => setCycleSessions(Array.isArray(r.data) ? r.data : []))
            .catch(() => {});
        }}
      />
    )}
    <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, sm: 0 }, pb: { xs: 10, sm: 0 } }}>
      {/* ─── Premium Header ──────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: { xs: 3, sm: 4 },
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          p: { xs: 2.5, sm: 3.5 },
          mb: { xs: 2.5, sm: 4 },
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '50%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box position="relative" zIndex={1} display="flex" alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: '#fff',
                fontWeight: 800,
                fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2rem' },
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              My Timetable
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: alpha('#fff', 0.6),
                mt: 0.5,
                fontSize: { xs: '0.8rem', sm: '0.88rem' },
                maxWidth: 500,
              }}
            >
              View and manage your class schedule
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Chip
              label={`${classes.length} Active`}
              size="small"
              sx={{
                bgcolor: alpha('#fff', 0.1),
                color: alpha('#fff', 0.8),
                fontWeight: 700,
                fontSize: '0.72rem',
                height: 28,
                backdropFilter: 'blur(8px)',
                border: `1px solid ${alpha('#fff', 0.1)}`,
              }}
            />
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                p: 1.25,
                borderRadius: 1.5,
                bgcolor: alpha('#fff', 0.08),
                backdropFilter: 'blur(8px)',
                border: `1px solid ${alpha('#fff', 0.1)}`,
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 22, color: alpha('#fff', 0.7) }} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ─── Unscheduled Classes Warning ──────────────── */}
      {unscheduledClasses.length > 0 && (
        <Box
          sx={{
            mb: { xs: 3, sm: 4 },
            bgcolor: alpha('#f59e0b', 0.03),
            borderRadius: 2,
            p: { xs: 2.5, sm: 3 },
            border: `1px solid ${alpha('#f59e0b', 0.1)}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: alpha('#f59e0b', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <EventNoteIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ 
                  fontWeight: 800, 
                  fontSize: { xs: '0.85rem', sm: '0.95rem' }, 
                  color: '#9a3412',
                  fontFamily: "'Manrope', sans-serif"
                }}
              >
                Pending Schedules
              </Typography>
              <Typography
                variant="caption"
                sx={{ 
                  display: 'block', 
                  color: alpha('#9a3412', 0.7), 
                  fontWeight: 600,
                  letterSpacing: '0.01em'
                }}
              >
                {unscheduledClasses.length} {unscheduledClasses.length === 1 ? 'class requires' : 'classes require'} a fixed timetable
              </Typography>
            </Box>
          </Box>
          
          <Stack spacing={1.5}>
            {unscheduledClasses.map((cls) => {
              const className: string = (cls as any).className || '-';
              const sched: any = (cls as any).schedule || {};
              const timeSlot: string = sched.timeSlot || 'Time not set';
              return (
                <Box
                  key={cls.id}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#ffffff',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: alpha('#f59e0b', 0.1),
                        color: '#d97706',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                      }}
                    >
                      {cls.studentName?.charAt(0) || 'S'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        {cls.studentName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {className !== '-' ? `${className} • ` : ''}{timeSlot}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => openScheduleModal(cls)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      bgcolor: '#f59e0b',
                      color: '#fff',
                      boxShadow: 'none',
                      px: 2,
                      '&:hover': { 
                        bgcolor: '#d97706',
                        boxShadow: `0 4px 12px ${alpha('#d97706', 0.2)}`
                      },
                    }}
                  >
                    Set Timetable
                  </Button>
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── MOBILE: Week Agenda View ─────────────────── */}
      {/* ═══════════════════════════════════════════════ */}
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        {/* Week Navigation */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            p: 1.5,
            bgcolor: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          }}
        >
          <IconButton
            onClick={handleMobilePrevWeek}
            size="small"
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: alpha('#6366f1', 0.04),
              color: '#6366f1',
              '&:hover': { bgcolor: alpha('#6366f1', 0.08) }
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 900, 
              fontSize: '0.95rem', 
              letterSpacing: '-0.02em',
              color: '#1e293b',
              fontFamily: "'Manrope', sans-serif"
            }}
          >
            {mobileWeekLabel}
          </Typography>
          <IconButton
            onClick={handleMobileNextWeek}
            size="small"
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: alpha('#6366f1', 0.04),
              color: '#6366f1',
              '&:hover': { bgcolor: alpha('#6366f1', 0.08) }
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Day Selector Pills */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mb: 3,
            overflowX: 'auto',
            pb: 1,
            mx: -1,
            px: 1,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {mobileWeekDays.map((day, i) => {
            const isSelected = isSameDay(day, mobileSelectedDay);
            const today = isDateToday(day);
            const dayClasses = getClassesForDate(day);
            const hasClass = dayClasses.length > 0;
            return (
              <Box
                key={i}
                onClick={() => setMobileSelectedDay(day)}
                sx={{
                  flex: '0 0 auto',
                  minWidth: 50,
                  textAlign: 'center',
                  py: 1.5,
                  px: 1,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  bgcolor: isSelected
                    ? '#6366f1'
                    : today
                      ? alpha('#6366f1', 0.05)
                      : '#ffffff',
                  boxShadow: isSelected 
                    ? `0 8px 16px ${alpha('#6366f1', 0.25)}` 
                    : today
                      ? 'none'
                      : '0 2px 6px rgba(15, 23, 42, 0.02)',
                  border: isSelected ? 'none' : `1px solid ${alpha('#6366f1', today ? 0.2 : 0.05)}`,
                  position: 'relative',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <Typography
                  variant="caption"
                  display="block"
                  sx={{
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    color: isSelected ? alpha('#fff', 0.7) : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    mb: 0.5,
                  }}
                >
                  {WEEKDAY_LABELS[i]}
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 900,
                    fontFamily: "'Manrope', sans-serif",
                    color: isSelected ? '#fff' : today ? '#6366f1' : '#1e293b',
                  }}
                >
                  {day.getDate()}
                </Typography>
                {hasClass && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: isSelected ? '#fff' : '#6366f1',
                      mx: 'auto',
                      mt: 0.75,
                      boxShadow: isSelected ? 'none' : `0 0 8px ${alpha('#6366f1', 0.4)}`,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>

        {/* Selected Day Classes */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 2,
              fontWeight: 900,
              fontSize: '0.7rem',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {mobileSelectedDay.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </Typography>

          {mobileSelectedDayClassCount === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                borderRadius: 2,
                bgcolor: alpha('#6366f1', 0.02),
                border: `1px dashed ${alpha('#6366f1', 0.15)}`,
              }}
            >
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: 2,
                  bgcolor: alpha('#6366f1', 0.06),
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  color: '#6366f1',
                  transform: 'rotate(-5deg)',
                }}
              >
                <EventNoteIcon sx={{ fontSize: 26 }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5 }}>
                Clear Horizon
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                No sessions scheduled for this day
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {mobileSelectedDayClasses.map((cls, idx) => {
                const sched: any = (cls as any).schedule || {};
                const timeSlot: string = sched.timeSlot || '';
                const address: string = (cls as any).location || (sched.address as string) || '';
                const isRescheduled = Boolean((cls as any).__isRescheduledForDate);
                const subjects = Array.isArray(cls.subject) ? cls.subject.map((s: any) => typeof s === 'string' ? s : s?.label || s?.name || 'N/A').join(', ') : String(cls.subject || '');

                return (
                  <Box
                    key={cls.id || idx}
                    sx={{
                      borderRadius: 2,
                      bgcolor: '#ffffff',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                      overflow: 'hidden',
                      position: 'relative',
                      border: isRescheduled ? `1px solid ${alpha('#f59e0b', 0.2)}` : 'none',
                    }}
                  >
                    <Box sx={{ p: 2.5 }}>
                      {/* Top Bar with Status and Mode */}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" gap={1}>
                          {isRescheduled && (
                            <Chip
                              label="MOVED"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.55rem',
                                fontWeight: 900,
                                letterSpacing: '0.04em',
                                bgcolor: alpha('#f59e0b', 0.1),
                                color: '#d97706',
                              }}
                            />
                          )}
                          <Chip
                            label={cls.mode || 'N/A'}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.55rem',
                              fontWeight: 900,
                              letterSpacing: '0.04em',
                              bgcolor: alpha('#6366f1', 0.06),
                              color: '#6366f1',
                            }}
                          />
                        </Box>
                        <Box
                          sx={{
                            px: 1.25,
                            py: 0.5,
                            borderRadius: 1.5,
                            bgcolor: alpha('#10b981', 0.06),
                            color: '#059669',
                            fontSize: '0.6rem',
                            fontWeight: 900,
                            letterSpacing: '0.04em',
                          }}
                        >
                          ACTIVE
                        </Box>
                      </Box>

                      {/* Content Section */}
                      <Stack direction="row" spacing={2} alignItems="center" mb={2.5}>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: alpha('#6366f1', 0.08),
                            color: '#6366f1',
                            fontWeight: 900,
                            fontSize: '1rem',
                            fontFamily: "'Manrope', sans-serif"
                          }}
                        >
                          {cls.studentName?.charAt(0) || 'S'}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2, mb: 0.25 }}>
                            {cls.studentName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
                            {subjects} • Grade {cls.grade}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Info Row */}
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha('#f8fafc', 0.8),
                          mb: 2,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} flex={1}>
                          <Box sx={{ color: '#6366f1', display: 'flex' }}><AccessTimeIcon sx={{ fontSize: 16 }} /></Box>
                          <Typography variant="caption" sx={{ color: '#334155', fontWeight: 800, fontSize: '0.72rem' }}>
                            {timeSlot || 'TIME N/A'}
                          </Typography>
                        </Box>
                        {address && (
                          <Box display="flex" alignItems="center" gap={1} flex={1} sx={{ minWidth: 0 }}>
                            <Box sx={{ color: '#6366f1', display: 'flex' }}><LocationOnIcon sx={{ fontSize: 16 }} /></Box>
                            <Typography variant="caption" sx={{ color: '#334155', fontWeight: 800, fontSize: '0.72rem' }} noWrap>
                              {address}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Action Row */}
                      <Box display="flex" gap={1.5}>
                        {Boolean((cls as any).coordinator) && (
                          <Button
                            fullWidth
                            size="medium"
                            variant="outlined"
                            onClick={() => openTestModalForClass(cls)}
                            sx={{
                              borderRadius: 1.5,
                              textTransform: 'none',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              borderColor: alpha('#6366f1', 0.2),
                              color: '#6366f1',
                              py: 1,
                              '&:hover': { borderColor: '#6366f1', bgcolor: alpha('#6366f1', 0.04) }
                            }}
                          >
                            Schedule Test
                          </Button>
                        )}
                        <Button
                          fullWidth
                          size="medium"
                          variant="contained"
                          onClick={() => {
                            setSelectedDate(mobileSelectedDay);
                            setSelectedClasses(mobileSelectedDayClasses);
                          }}
                          sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            bgcolor: '#6366f1',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                            py: 1,
                            '&:hover': { bgcolor: '#4f46e5', boxShadow: '0 6px 16px rgba(99, 102, 241, 0.3)' },
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>

      {/* ═══════════════════════════════════════════════ */}
      {/* ─── DESKTOP: Calendar Month View ─────────────── */}
      {/* ═══════════════════════════════════════════════ */}
      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        {/* Calendar Navigation */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4,
            p: 2.5,
            bgcolor: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
          }}
        >
          <IconButton
            onClick={handlePrevMonth}
            size="small"
            sx={{
              width: 40,
              height: 40,
              bgcolor: alpha('#6366f1', 0.04),
              color: '#6366f1',
              '&:hover': { bgcolor: '#6366f1', color: 'white' },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 24 }} />
          </IconButton>

          <Box textAlign="center">
            <Typography
              variant="h5"
              sx={{ 
                fontWeight: 900, 
                color: '#0f172a',
                fontSize: { sm: '1.25rem', md: '1.5rem' }, 
                letterSpacing: '-0.03em',
                fontFamily: "'Manrope', sans-serif"
              }}
            >
              {formatMonthYear(currentMonth)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
              ACADEMIC CALENDAR
            </Typography>
          </Box>

          <IconButton
            onClick={handleNextMonth}
            size="small"
            sx={{
              width: 40,
              height: 40,
              bgcolor: alpha('#6366f1', 0.04),
              color: '#6366f1',
              '&:hover': { bgcolor: '#6366f1', color: 'white' },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 24 }} />
          </IconButton>
        </Box>

        {/* Calendar Grid */}
        <Card
          elevation={0}
          sx={{
            bgcolor: 'transparent',
            borderRadius: 2,
            border: 'none',
          }}
        >
          <Box sx={{ p: 0 }}>
            {/* Weekday Headers */}
            <Grid container spacing={1.5} mb={2}>
              {WEEKDAY_LABELS.map((label) => (
                <Grid item xs={12 / 7} key={label}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 1.5,
                      bgcolor: alpha('#6366f1', 0.04),
                      color: '#4f46e5',
                      borderRadius: 1.5,
                      fontWeight: 900,
                      fontSize: '0.75rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {label}
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Calendar Days */}
            <Grid container spacing={1.5}>
              {monthDays.map((date, idx) => {
                if (!date) {
                  return (
                    <Grid item xs={12 / 7} key={idx}>
                      <Box minHeight={{ sm: 95, md: 115 }} sx={{ bgcolor: alpha('#f8fafc', 0.4), borderRadius: 2 }} />
                    </Grid>
                  );
                }

                const dateClasses = getClassesForDate(date);

                return (
                  <Grid item xs={12 / 7} key={idx}>
                    <CalendarDayCell date={date} classesForDate={dateClasses} onClick={handleDayClick} />
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Card>
      </Box>

      {/* ─── Class Details Dialog ────────────────────── */}
      <Dialog
        open={!!selectedDate}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
        fullScreen={isDialogFullScreen}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 5 },
            m: { xs: 0, sm: 2 },
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 4,
            pt: { xs: 3, sm: 5 },
            px: { xs: 2.5, sm: 4 },
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '40%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <Stack direction="row" alignItems="center" spacing={2.5} sx={{ position: 'relative', zIndex: 1 }}>
            <Box 
              sx={{ 
                p: 1.25, 
                borderRadius: 1.5, 
                bgcolor: alpha('#fff', 0.1), 
                display: 'flex',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha('#fff', 0.1)}`,
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: { xs: 22, sm: 26 }, color: '#fff' }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                fontWeight={900}
                sx={{ 
                  fontSize: { xs: '1.2rem', sm: '1.5rem' }, 
                  color: '#fff',
                  fontFamily: "'Manrope', sans-serif",
                  letterSpacing: '-0.02em',
                }}
              >
                Class Sessions
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, color: alpha('#fff', 0.6), fontWeight: 600 }}>
                {selectedDate
                  ? selectedDate.toLocaleDateString(undefined, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                  : 'Select a date'}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 4 }, bgcolor: '#f8fafc' }}>
          {selectedClasses.length === 0 ? (
            <Box sx={{ py: { xs: 6, sm: 10 }, textAlign: 'center' }}>
              <Box sx={{ width: 72, height: 72, borderRadius: 2, bgcolor: alpha('#6366f1', 0.05), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 3, color: alpha('#6366f1', 0.3), transform: 'rotate(-5deg)' }}>
                <EventNoteIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" gutterBottom fontWeight={800} sx={{ color: '#1e293b' }}>Agenda Clear</Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, maxWidth: 300, mx: 'auto' }}>
                No active teaching sessions are scheduled for this date.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              {selectedClasses.map((cls, index) => {
                const sched: any = (cls as any).schedule || {};
                const timeSlot: string = sched.timeSlot || '';
                const className: string = (cls as any).className || '-';
                const address: string = (cls as any).location || (sched.address as string) || '-';
                const isRescheduled = Boolean((cls as any).__isRescheduledForDate);

                // Find the matching ClassSession record for this class on this date
                const normalize = (d: Date) => { const nd = new Date(d); nd.setHours(0,0,0,0); return nd.getTime(); };
                const dateKey = selectedDate ? normalize(selectedDate) : 0;
                const matchedSession = cycleSessions.find((s: any) => {
                  const sd = normalize(new Date(s.sessionDate));
                  const clsId = s.finalClass?._id || s.finalClass?.id || s.finalClass;
                  return sd === dateKey && String(clsId) === String((cls as any)._id || cls.id);
                }) as IClassSession | undefined;

                const sessionStatus: string = matchedSession?.status || 'PLANNED';
                const sessionNumber: number | undefined = matchedSession?.sessionNumber;
                const canReschedule = sessionStatus === 'PLANNED' && selectedDate && selectedDate > new Date();

                const statusColor = sessionStatus === 'COMPLETED' ? '#10b981' : sessionStatus === 'CANCELLED' ? '#ef4444' : '#6366f1';
                const statusBg = sessionStatus === 'COMPLETED' ? alpha('#10b981', 0.08) : sessionStatus === 'CANCELLED' ? alpha('#ef4444', 0.08) : alpha('#6366f1', 0.08);
                const statusLabel = sessionStatus === 'COMPLETED' ? 'Completed' : sessionStatus === 'CANCELLED' ? 'Cancelled' : 'Scheduled';

                return (
                  <Box
                    key={cls.id || index}
                    sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2, bgcolor: '#ffffff', boxShadow: '0 4px 15px rgba(15, 23, 42, 0.04)', border: isRescheduled ? `1px solid ${alpha('#f59e0b', 0.2)}` : 'none', position: 'relative' }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ width: 52, height: 52, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', fontWeight: 900, fontSize: '1.2rem' }}>
                          {cls.studentName?.charAt(0) || 'S'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2, mb: 0.5 }}>{cls.studentName}</Typography>
                          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700 }}>{className || 'N/A'}</Typography>
                        </Box>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                        {isRescheduled && (
                          <Chip label="RESCHEDULED" size="small" sx={{ height: 22, fontSize: '0.6rem', fontWeight: 900, bgcolor: alpha('#f59e0b', 0.1), color: '#d97706' }} />
                        )}
                        {sessionNumber != null && (
                          <Chip label={`#${sessionNumber}`} size="small" sx={{ height: 22, fontSize: '0.6rem', fontWeight: 900, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1' }} />
                        )}
                        <Chip label={statusLabel.toUpperCase()} size="small" sx={{ height: 22, fontSize: '0.6rem', fontWeight: 900, bgcolor: statusBg, color: statusColor }} />
                      </Stack>
                    </Box>

                    <Grid container spacing={2} mb={3}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#f8fafc', 0.8), display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ color: '#6366f1', display: 'flex' }}><AccessTimeIcon sx={{ fontSize: 20 }} /></Box>
                          <Box>
                            <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 800, letterSpacing: '0.02em', mb: 0.25 }}>TIME SLOT</Typography>
                            <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 800 }}>{timeSlot || 'NOT SPECIFIED'}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#f8fafc', 0.8), display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ color: '#6366f1', display: 'flex' }}><LocationOnIcon sx={{ fontSize: 20 }} /></Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 800, letterSpacing: '0.02em', mb: 0.25 }}>LOCATION</Typography>
                            <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 800 }} noWrap>{address || 'LOCATION N/A'}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box display="flex" gap={2} pt={2.5} borderTop={`1px solid ${alpha('#e2e8f0', 0.8)}`} flexWrap="wrap">
                      <Button variant="outlined" onClick={() => openScheduleModal(cls)}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '0.75rem', borderColor: alpha('#6366f1', 0.2), color: '#6366f1', py: 1.25, flex: 1, minWidth: 120, '&:hover': { borderColor: '#6366f1', bgcolor: alpha('#6366f1', 0.04) } }}>
                        Permanent Shift
                      </Button>
                      {canReschedule && matchedSession && (
                        <Button variant="outlined" onClick={() => openReschedule(matchedSession)}
                          sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '0.75rem', borderColor: alpha('#f59e0b', 0.3), color: '#d97706', py: 1.25, flex: 1, minWidth: 120, '&:hover': { borderColor: '#f59e0b', bgcolor: alpha('#f59e0b', 0.04) } }}>
                          Reschedule
                        </Button>
                      )}
                      {Boolean((cls as any).coordinator) && (
                        <Button variant="contained" onClick={() => openTestModalForClass(cls)}
                          sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '0.75rem', bgcolor: '#6366f1', boxShadow: '0 4px 12px rgba(99,102,241,0.2)', py: 1.25, flex: 1, minWidth: 120, '&:hover': { bgcolor: '#4f46e5' } }}>
                          Schedule Test
                        </Button>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {testModalClass && (
        <ScheduleTestModal
          open={testModalOpen}
          onClose={closeTestModal}
          finalClass={testModalClass}
        />
      )}

      {/* ─── Reschedule Session Dialog ──────────────────── */}
      <Dialog
        open={!!rescheduleSession_}
        onClose={() => !rescheduleSaving && handleRescheduleClose()}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', pb: 3, pt: 3.5, px: 3.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha('#f59e0b', 0.15), display: 'flex' }}>
              <TodayIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
            </Box>
            <Box>
              <Typography fontWeight={900} sx={{ fontSize: '1.1rem' }}>
                {rescheduleSubmitted ? 'Request Sent' : 'Request Reschedule'}
              </Typography>
              {rescheduleSession_ && (
                <Typography variant="caption" sx={{ color: alpha('#fff', 0.55), fontWeight: 600 }}>
                  {rescheduleSession_.finalClass?.studentName} · #{rescheduleSession_.sessionNumber}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, px: 3.5, bgcolor: '#fff' }}>
          {rescheduleSubmitted ? (
            <Box textAlign="center" py={1}>
              <Typography fontSize={40} mb={1}>✅</Typography>
              <Typography fontWeight={800} mb={0.5}>Request submitted</Typography>
              <Typography variant="body2" color="text.secondary">
                Your reschedule request is pending coordinator approval. The session date will only change once approved.
              </Typography>
            </Box>
          ) : (
            <>
              {rescheduleError && (
                <Box mb={2} p={1.5} borderRadius={1.5} bgcolor={alpha('#ef4444', 0.05)}>
                  <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 800 }}>{rescheduleError}</Typography>
                </Box>
              )}
              {rescheduleSession_ && (
                <Box mb={2.5} p={1.5} borderRadius={1.5} bgcolor={alpha('#f8fafc', 1)} display="flex" alignItems="center" gap={1}>
                  <SchoolIcon sx={{ fontSize: 16, color: '#64748b' }} />
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                    Current:{' '}
                    <strong style={{ color: '#1e293b' }}>
                      {new Date(rescheduleSession_.sessionDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      {rescheduleSession_.timeSlot ? ` · ${rescheduleSession_.timeSlot}` : ''}
                    </strong>
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>NEW DATE</Typography>
                <TextField
                  fullWidth size="small" type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  inputProps={{ min: new Date().toISOString().slice(0, 10) }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#f8fafc', '& fieldset': { borderColor: alpha('#e2e8f0', 1) } } }}
                />
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3.5, pb: 3.5, pt: 1.5, bgcolor: '#fff' }}>
          <Button onClick={handleRescheduleClose} disabled={rescheduleSaving}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800, color: '#64748b', px: 2.5 }}>
            {rescheduleSubmitted ? 'Close' : 'Cancel'}
          </Button>
          {!rescheduleSubmitted && (
            <Button variant="contained" onClick={handleRescheduleConfirm} disabled={rescheduleSaving || !rescheduleDate}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 900, bgcolor: '#f59e0b', boxShadow: 'none', px: 4, py: 1.1, '&:hover': { bgcolor: '#d97706' }, '&.Mui-disabled': { bgcolor: alpha('#f59e0b', 0.3) } }}>
              {rescheduleSaving ? 'Sending…' : 'Send Request'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ─── Set Timetable Modal ─────────────────────── */}
      <Dialog
        open={scheduleModalOpen}
        onClose={scheduleSaving ? undefined : closeScheduleModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { 
            borderRadius: 2, 
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#fff',
            pb: 4,
            pt: 4,
            px: 4,
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '-20%',
              right: '-10%',
              width: '40%',
              height: '140%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#fff', 0.1), display: 'flex', border: `1px solid ${alpha('#fff', 0.1)}` }}>
              <EventNoteIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900} sx={{ fontSize: '1.25rem', fontFamily: "'Manrope', sans-serif" }}>
                {scheduleModalClass?.schedule?.isFixed ? 'Modify Timetable' : 'Fix Timetable'}
              </Typography>
              {scheduleModalClass && (
                <Typography variant="body2" sx={{ color: alpha('#fff', 0.6), fontWeight: 700 }}>
                  {scheduleModalClass.studentName} • Grade {scheduleModalClass.grade}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 4, px: 4, bgcolor: '#ffffff' }}>
          {(scheduleError || scheduleSuccess) && (
            <Box mb={3} p={1.5} borderRadius={2} bgcolor={scheduleError ? alpha('#ef4444', 0.05) : alpha('#10b981', 0.05)}>
              {scheduleError && (
                <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 800 }}>
                  {scheduleError}
                </Typography>
              )}
              {scheduleSuccess && (
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800 }}>
                  {scheduleSuccess}
                </Typography>
              )}
            </Box>
          )}

          <Box mb={3}>
            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>
              EFFECTIVE FROM
            </Typography>
            <TextField
              fullWidth
              size="medium"
              type="date"
              value={scheduleStartDate}
              onChange={(e) => setScheduleStartDate(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  '& fieldset': { borderColor: alpha('#e2e8f0', 1) },
                } 
              }}
            />
          </Box>

          <Box mb={3}>
            <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>
              RECURRING DAYS
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {DAYS_ORDER.map((day) => {
                const isSelected = scheduleDays.includes(day);
                return (
                  <Chip
                    key={day}
                    label={day.slice(0, 3)}
                    onClick={() => toggleDay(day)}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 800,
                      bgcolor: isSelected ? '#6366f1' : alpha('#6366f1', 0.04),
                      color: isSelected ? '#fff' : '#6366f1',
                      border: `1px solid ${isSelected ? '#6366f1' : alpha('#6366f1', 0.1)}`,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { bgcolor: isSelected ? '#4f46e5' : alpha('#6366f1', 0.08) }
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          <Box mb={1}>
            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>
              SESSION TIMING
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="medium"
                  label="Start time"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                  value={scheduleStartTime}
                  onChange={(e) => setScheduleStartTime(e.target.value)}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      '& fieldset': { borderColor: alpha('#e2e8f0', 1) },
                    } 
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: alpha('#6366f1', 0.04),
                    border: `1px solid ${alpha('#6366f1', 0.1)}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 800, letterSpacing: '0.02em' }}>
                    END TIME
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ color: '#1e293b' }}>
                    {getComputedEndTime(scheduleModalClass, scheduleStartTime) || '--:--'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 4, pb: 4, pt: 2, bgcolor: '#ffffff' }}>
          <Button
            onClick={closeScheduleModal}
            disabled={scheduleSaving}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800, color: '#64748b', px: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSchedule}
            disabled={scheduleSaving || scheduleDays.length === 0}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 900,
              bgcolor: '#6366f1',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
              px: 5,
              py: 1.25,
              '&:hover': { bgcolor: '#4f46e5', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)' },
              '&.Mui-disabled': { bgcolor: alpha('#6366f1', 0.3) }
            }}
          >
            {scheduleSaving ? 'Saving...' : 'Deploy Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </>
  );
};

export default TutorTimetablePage;
