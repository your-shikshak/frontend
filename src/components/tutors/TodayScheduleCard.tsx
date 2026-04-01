import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, CircularProgress, alpha, Stack, IconButton } from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getMyClasses } from '../../services/finalClassService';
import { getAttendances } from '../../services/attendanceService';
import { FINAL_CLASS_STATUS } from '../../constants';
import { IFinalClass } from '../../types';
import SubmitAttendanceModal from './SubmitAttendanceModal';
import { useDemoMode } from '../../hooks/useDemoMode';
import ClassCard from '../parents/ClassCard';

import { getSubjectList, getOptionLabel } from '../../utils/subjectUtils';

const TodayScheduleCard: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { isDemoMode, getDemoClasses } = useDemoMode();
  const [classes, setClasses] = useState<IFinalClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<IFinalClass | null>(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  const loadClasses = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const tutorId = (user as any).id || (user as any)._id;
      const resp = await getMyClasses(tutorId, FINAL_CLASS_STATUS.ACTIVE, 1, 50);
      const all = getDemoClasses(resp.data || []);


      const todayIndex = new Date().getDay();
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const todayName = dayNames[todayIndex];
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const tomorrowDate = new Date(todayDate);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);

      // Fetch today's attendance to filter out already marked classes
      const attendanceResp = await getAttendances({
        tutorId,
        fromDate: todayDate.toISOString(),
        toDate: tomorrowDate.toISOString(),
      });
      const markedClassIds = new Set(
        (attendanceResp.data || []).map((att: any) => {
          if (typeof att.finalClass === 'string') return att.finalClass;
          return att.finalClass?.id || att.finalClass?._id;
        })
      );

      const todayClasses = all.filter((cls: any) => {
        // Exclude if attendance already marked
        if (markedClassIds.has(cls.id || cls._id)) {
          return false;
        }

        const schedule = cls.schedule || (cls as any).schedule;
        if (!schedule || !Array.isArray(schedule.daysOfWeek) || schedule.daysOfWeek.length === 0) {
          return true;
        }
        return schedule.daysOfWeek.includes(todayName);
      });

      setClasses(todayClasses);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load today\'s classes.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleMarkClick = (cls: IFinalClass) => {
    setSelectedClass(cls);
    setAttendanceModalOpen(true);
  };

  const handleModalClose = () => {
    setAttendanceModalOpen(false);
    setSelectedClass(null);
  };

  const handleActionSuccess = () => {
    loadClasses();
    setAttendanceModalOpen(false);
    setSelectedClass(null);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 1;
  const totalItems = classes.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentItem = classes[currentPage - 1];

  // Reset page when classes change
  useEffect(() => {
    setCurrentPage(1);
  }, [classes.length]);

  const cardSx = {
    borderRadius: 2,
    bgcolor: '#ffffff',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
    border: 'none',
    transition: 'all 0.3s ease',
  };

  if (loading) {
    return (
      <Card sx={cardSx}>
        <CardContent sx={{ py: 6 }}>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2}>
            <CircularProgress size={32} thickness={5} sx={{ color: '#6366f1' }} />
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
              SYNCING SCHEDULE...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={cardSx}>
        <CardContent sx={{ py: 4 }}>
          <Box display="flex" alignItems="center" gap={2} sx={{ bgcolor: alpha('#ef4444', 0.05), p: 2, borderRadius: 2 }}>
            <ErrorOutlineIcon sx={{ color: '#ef4444' }} />
            <Typography variant="body2" sx={{ color: '#b91c1c', fontWeight: 600 }}>
              {error}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!classes.length) {
    return (
      <Card sx={cardSx}>
        <CardContent sx={{ py: 8 }}>
          <Box textAlign="center">
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 2,
                bgcolor: alpha('#6366f1', 0.06),
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                transform: 'rotate(-5deg)',
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 32, color: '#6366f1' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, letterSpacing: '-0.02em' }}>
              Clear Horizon
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, maxWidth: 280, mx: 'auto' }}>
              No classes scheduled for today. Take this time to refine your lesson plans or explore new opportunities.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Box id="tour-today">
      <Card sx={{ ...cardSx, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'visible' }}>

        <CardContent sx={{ display: 'flex', flexDirection: 'column', p: { xs: 3, sm: 4 }, height: '100%' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: alpha('#6366f1', 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6366f1',
                }}
              >
                <ScheduleIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.03em' }}>
                  Today's Agenda
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.02em' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </Typography>
              </Box>
            </Box>

            {totalPages > 1 && (
              <Box display="flex" alignItems="center" gap={1.5}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>
                  {currentPage} of {totalPages}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton 
                    size="small" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>←</Typography>
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>→</Typography>
                  </IconButton>
                </Stack>
              </Box>
            )}
          </Box>

          <Box sx={{ minHeight: 400 }}>
            {currentItem && (() => {
              const cls = currentItem;
              const subjects = getSubjectList(cls.subject).join(', ');
              const timeSlot = (cls as any)?.schedule?.timeSlot || '';
              const monthlyClasses =
                (cls as any)?.classLead?.classesPerMonth ??
                (cls as any)?.classesPerMonth ??
                0;

              return (
                <Box key={cls.id}>
                  <ClassCard
                    classId={cls.id}
                    subject={subjects}
                    grade={getOptionLabel(cls.grade) || 'N/A'}
                    board={getOptionLabel(cls.board)}
                    studentName={cls.studentName}
                    topic={(cls as any).topic || 'N/A'}
                    schedule={timeSlot}
                    completedSessions={cls.completedSessions}
                    totalSessions={cls.totalSessions}
                    classesPerMonth={monthlyClasses}
                    onMarkClick={() => handleMarkClick(cls)}
                  />
                </Box>
              );
            })()}
          </Box>
        </CardContent>
      </Card>
    </Box>



      {selectedClass && attendanceModalOpen && (
        <SubmitAttendanceModal
          open={attendanceModalOpen}
          onClose={handleModalClose}
          finalClass={selectedClass}
          onSuccess={handleActionSuccess}
        />
      )}
    </>
  );
};

export default React.memo(TodayScheduleCard);

