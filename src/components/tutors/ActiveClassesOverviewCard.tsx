import React, { useEffect, useState } from 'react';
import { Card, CardContent, Box, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress, alpha, Stack, IconButton } from '@mui/material';
import ClassIcon from '@mui/icons-material/Class';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getMyClasses } from '../../services/finalClassService';
import { FINAL_CLASS_STATUS } from '../../constants';
import { IFinalClass } from '../../types';
import { getLeafSubjectList } from '../../utils/subjectUtils';
import { useDemoMode } from '../../hooks/useDemoMode';


const ActiveClassesOverviewCard: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const { isDemoMode, getDemoClasses } = useDemoMode();
  const [classes, setClasses] = useState<IFinalClass[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadClasses = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const tutorId = (user as any).id || (user as any)._id;
      const resp = await getMyClasses(tutorId, FINAL_CLASS_STATUS.ACTIVE, 1, 50);
      setClasses(getDemoClasses(resp.data || []));

    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load active classes.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getProgress = (cls: IFinalClass) => {
    if ((cls as any).progressPercentage != null) {
      return Math.round((cls as any).progressPercentage as number);
    }
    const monthlyTotalSessions = Number(
      (cls as any)?.classLead?.classesPerMonth ?? (cls as any)?.classesPerMonth ?? (cls as any)?.totalSessions ?? 0
    );
    if (!monthlyTotalSessions) return 0;
    const completedForMonth = Math.min(Number(cls.completedSessions || 0), monthlyTotalSessions || Number(cls.completedSessions || 0));
    return Math.round((completedForMonth / monthlyTotalSessions) * 100);
  };

  const getProgressColor = (p: number) => {
    if (p >= 75) return '#10b981';
    if (p >= 40) return '#6366f1';
    return '#f59e0b';
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
            <CircularProgress size={32} thickness={5} sx={{ color: '#10b981' }} />
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
              RETRIVING PORTFOLIO...
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

  return (
    <Card sx={cardSx} id="tour-portfolio-list">

      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Box mb={4} display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: alpha('#10b981', 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <ClassIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.03em' }}>
                Course Portfolio
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.02em' }}>
                OVERVIEW OF ACTIVE ENGAGEMENTS
              </Typography>
            </Box>
          </Box>

          {totalPages > 1 && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>
                {currentPage} of {totalPages}
              </Typography>
              <Stack direction="row" spacing={1}>
                {/* Manual Navigation Arrows */}
                <Box
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  sx={{ 
                    cursor: currentPage === 1 ? 'default' : 'pointer',
                    opacity: currentPage === 1 ? 0.3 : 1,
                    bgcolor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    px: 1,
                    borderRadius: 1,
                    fontWeight: 900
                  }}
                >
                  ←
                </Box>
                <Box
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  sx={{ 
                    cursor: currentPage === totalPages ? 'default' : 'pointer',
                    opacity: currentPage === totalPages ? 0.3 : 1,
                    bgcolor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    px: 1,
                    borderRadius: 1,
                    fontWeight: 900
                  }}
                >
                  →
                </Box>
              </Stack>
            </Box>
          )}
        </Box>

        {/* Mobile view */}
        <Box 
          sx={{ 
            display: { xs: 'block', sm: 'none' }, 
            minHeight: 300 
          }}
        >
          {totalItems === 0 ? (
            <Box textAlign="center" py={6}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 1.5,
                  bgcolor: alpha('#10b981', 0.05),
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <MenuBookIcon sx={{ fontSize: 28, color: '#10b981' }} />
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                No active courses at the moment
              </Typography>
            </Box>
          ) : (
            currentItem && (() => {
              const cls = currentItem;
              const progress = getProgress(cls);
              const pColor = getProgressColor(progress);
              const coordinatorName = (cls.coordinator as any)?.name || 'Not Assigned';
              const subjects = getLeafSubjectList(cls.subject).join(', ');
              const monthlyTotalSessions = Number(
                (cls as any)?.classLead?.classesPerMonth ?? (cls as any)?.classesPerMonth ?? (cls as any)?.totalSessions ?? 0
              );
              const completedForMonth = Math.min(Number(cls.completedSessions || 0), monthlyTotalSessions || Number(cls.completedSessions || 0));
              return (
                <Box
                  key={cls.id}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha('#e2e8f0', 0.6),
                    bgcolor: '#ffffff',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: alpha(pColor, 0.2),
                      boxShadow: '0 8px 16px rgba(15, 23, 42, 0.04)',
                    },
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{cls.studentName}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {subjects} • GRADE {cls.grade}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 1.25,
                        py: 0.5,
                        borderRadius: 1.5,
                        bgcolor: alpha('#10b981', 0.08),
                        color: '#10b981',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {cls.status}
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Completion</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: pColor }}>{progress}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{
                        height: 6,
                        borderRadius: 1.5,
                      }}
                    />
                  </Box>

                  <Box 
                    display="flex" 
                    flexDirection={{ xs: 'column', sm: 'row' }} 
                    justifyContent="space-between" 
                    alignItems={{ xs: 'flex-start', sm: 'center' }} 
                    gap={2}
                    pt={1.5} 
                    borderTop="1px dashed" 
                    borderColor="#f1f5f9"
                  >
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block' }}>COORDINATOR</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>{coordinatorName}</Typography>
                    </Box>
                    <Box textAlign={{ xs: 'left', sm: 'right' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block' }}>SESSIONS</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>{completedForMonth} / {monthlyTotalSessions}</Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })()
          )}
        </Box>

        {/* Desktop table view */}
        <TableContainer sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {['Student & Subject', 'Status', 'Performance', 'Account Manager', 'Progress'].map((h, i) => (
                  <TableCell
                    key={h}
                    align={i === 4 ? 'right' : 'left'}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      color: '#64748b',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid',
                      borderColor: '#f1f5f9',
                      py: 2,
                      px: 0,
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8, border: 'none' }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>No active teaching portfolio matches found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => {
                  const progress = getProgress(cls);
                  const pColor = getProgressColor(progress);
                  const coordinatorName = (cls.coordinator as any)?.name || 'Not Assigned';
                  const monthlyTotalSessions = Number(
                    (cls as any)?.classLead?.classesPerMonth ?? (cls as any)?.classesPerMonth ?? (cls as any)?.totalSessions ?? 0
                  );
                  const completedForMonth = Math.min(Number(cls.completedSessions || 0), monthlyTotalSessions || Number(cls.completedSessions || 0));
                  return (
                    <TableRow
                      key={cls.id}
                      sx={{
                        '&:hover': { bgcolor: alpha('#f8fafc', 0.8) },
                        transition: 'background 0.2s',
                        '& td': { borderBottom: '1px solid', borderColor: '#f8fafc', py: 2.5, px: 0 },
                        '&:last-child td': { borderBottom: 'none' },
                      }}
                    >
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{cls.studentName}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          {getLeafSubjectList(cls.subject).join(', ')} • GRADE {cls.grade}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1.5,
                            bgcolor: alpha('#10b981', 0.08),
                            color: '#10b981',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {cls.status}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Box sx={{ pr: 4 }}>
                          <Box display="flex" justifyContent="space-between" mb={0.75}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: pColor }}>{progress}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              height: 6,
                              borderRadius: 1.5,
                              bgcolor: alpha(pColor, 0.1),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: pColor,
                                borderRadius: 1.5,
                              },
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{coordinatorName}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem' }}>
                          {completedForMonth} <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.75rem' }}>/ {monthlyTotalSessions}</span>
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>

  );
};

export default React.memo(ActiveClassesOverviewCard);

