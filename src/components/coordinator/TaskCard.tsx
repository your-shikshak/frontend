import React from 'react';
import { Card, CardContent, CardActions, Box, Typography, Chip, Button, Divider, alpha, useTheme, Grow, Avatar } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningIcon from '@mui/icons-material/Warning';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from 'react-router-dom';
import { IAttendance, IPaymentReminder, TaskPriority } from '../../types';
import { ATTENDANCE_STATUS, PAYMENT_STATUS } from '../../constants';

interface TaskCardBaseProps {
  priority: TaskPriority;
  onAction?: (taskId: string, actionType: string) => void;
  loading?: boolean;
}

interface AttendanceTaskProps extends TaskCardBaseProps {
  taskType: 'attendance';
  task: IAttendance;
}

interface PaymentTaskProps extends TaskCardBaseProps {
  taskType: 'payment';
  task: IPaymentReminder;
}

interface TestTaskProps extends TaskCardBaseProps {
  taskType: 'test';
  task: any;
}

interface ComplaintTaskProps extends TaskCardBaseProps {
  taskType: 'complaint';
  task: any;
}

type TaskCardProps = AttendanceTaskProps | PaymentTaskProps | TestTaskProps | ComplaintTaskProps;

const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'overdue':
      return 'error.main';
    case 'today':
      return 'warning.main';
    default:
      return 'info.main';
  }
};

const getPriorityLabel = (priority: TaskPriority): string => {
  switch (priority) {
    case 'overdue':
      return 'Overdue';
    case 'today':
      return 'Due Today';
    default:
      return 'Upcoming';
  }
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  const diff = (dd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString();
};

const formatCurrency = (amount: number): string => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `₹${amount}`;
  }
};

const TaskCard: React.FC<TaskCardProps> = (props) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { priority, onAction } = props;

  const priorityColor = getPriorityColor(priority);
  const resolvedPriorityColor = priorityColor.includes('.') 
    ? (theme.palette as any)[priorityColor.split('.')[0]][priorityColor.split('.')[1]] 
    : priorityColor;

  const PriorityChip = (
    <Chip
      size="small"
      label={getPriorityLabel(priority)}
      sx={{ 
        bgcolor: alpha(resolvedPriorityColor, 0.1), 
        color: resolvedPriorityColor,
        fontWeight: 700,
        borderRadius: '6px',
        fontSize: '0.7rem'
      }}
      aria-label={`Priority ${getPriorityLabel(priority)}`}
    />
  );

  return (
    <Grow in timeout={500}>
      <Card 
        elevation={0}
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
          '&:hover': { 
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)',
            borderColor: alpha(resolvedPriorityColor, 0.3),
          },
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.8),
          borderRadius: '20px',
          background: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            bgcolor: resolvedPriorityColor
          }
        }}
      >
        <CardContent sx={{ p: 3, flexGrow: 1 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar 
                sx={{ 
                  bgcolor: alpha(resolvedPriorityColor, 0.1), 
                  color: resolvedPriorityColor,
                  width: 40,
                  height: 40
                }}
              >
                {props.taskType === 'attendance' && <CheckCircleIcon fontSize="small" />}
                {props.taskType === 'payment' && <PaymentIcon fontSize="small" />}
                {props.taskType === 'test' && <AssignmentIcon fontSize="small" />}
                {props.taskType === 'complaint' && <WarningIcon fontSize="small" />}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                  {props.taskType === 'attendance' && 'Attendance'}
                  {props.taskType === 'payment' && 'Payment'}
                  {props.taskType === 'test' && 'Test'}
                  {props.taskType === 'complaint' && 'Complaint'}
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {props.taskType === 'attendance' && 'Review Approval'}
                  {props.taskType === 'payment' && 'Send Reminder'}
                  {props.taskType === 'test' && 'Schedule Required'}
                  {props.taskType === 'complaint' && 'Parent Issue'}
                </Typography>
              </Box>
            </Box>
            {PriorityChip}
          </Box>

          <Divider sx={{ mb: 2.5, opacity: 0.6 }} />

          {/* Content per type */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {props.taskType === 'attendance' && (
              <>
                <Box display="flex" alignItems="flex-start" gap={1.5}>
                  <SchoolIcon sx={{ color: 'text.secondary', fontSize: 18, mt: 0.3 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {(props.task as IAttendance).finalClass?.studentName || 'Student'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {Array.isArray((props.task as IAttendance).finalClass?.subject)
                        ? (props.task as IAttendance).finalClass?.subject.map((s: any) => typeof s === 'string' ? s : s?.label || s?.name || 'N/A').join(', ')
                        : (typeof (props.task as IAttendance).finalClass?.subject === 'object' && (props.task as IAttendance).finalClass?.subject !== null
                          ? ((props.task as IAttendance).finalClass?.subject as any).label || ((props.task as IAttendance).finalClass?.subject as any).name || 'N/A'
                          : String((props.task as IAttendance).finalClass?.subject || ''))}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary">{formatDate((props.task as IAttendance).sessionDate)}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <PersonIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary">{(props.task as IAttendance).tutor?.name || 'Tutor'}</Typography>
                </Box>
                {(props.task as IAttendance).notes && (
                  <Box sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5), p: 1.5, borderRadius: '12px', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', lineHeight: 1.4 }}>
                      "{(props.task as IAttendance).notes}"
                    </Typography>
                  </Box>
                )}
              </>
            )}

            {props.taskType === 'payment' && (
              <>
                <Box display="flex" alignItems="flex-start" gap={1.5}>
                  <SchoolIcon sx={{ color: 'text.secondary', fontSize: 18, mt: 0.3 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {(props.task as IPaymentReminder).finalClass?.studentName || 'Student'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {Array.isArray((props.task as IPaymentReminder).finalClass?.subject)
                        ? (props.task as IPaymentReminder).finalClass?.subject.map((s: any) => typeof s === 'string' ? s : s?.label || s?.name || 'N/A').join(', ')
                        : (typeof (props.task as IPaymentReminder).finalClass?.subject === 'object' && (props.task as IPaymentReminder).finalClass?.subject !== null
                          ? ((props.task as IPaymentReminder).finalClass?.subject as any).label || ((props.task as IPaymentReminder).finalClass?.subject as any).name || 'N/A'
                          : String((props.task as IPaymentReminder).finalClass?.subject || ''))}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={800} color="primary" sx={{ my: 0.5 }}>
                    {formatCurrency((props.task as IPaymentReminder).amount)}
                  </Typography>
                  <Chip
                    size="small"
                    label={(props.task as IPaymentReminder).status}
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: (props.task as IPaymentReminder).status === PAYMENT_STATUS.OVERDUE ? alpha(theme.palette.error.main, 0.1) : (props.task as IPaymentReminder).status === PAYMENT_STATUS.PENDING ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.success.main, 0.1),
                      color: (props.task as IPaymentReminder).status === PAYMENT_STATUS.OVERDUE ? 'error.main' : (props.task as IPaymentReminder).status === PAYMENT_STATUS.PENDING ? 'warning.main' : 'success.main',
                    }}
                  />
                </Box>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                  <Typography variant="caption" color="text.secondary">Due {formatDate((props.task as IPaymentReminder).dueDate)}</Typography>
                </Box>
              </>
            )}

            {props.taskType === 'test' && (
              <>
                <Box display="flex" alignItems="flex-start" gap={1.5}>
                  <SchoolIcon sx={{ color: 'text.secondary', fontSize: 18, mt: 0.3 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {props.task?.finalClass?.studentName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Array.isArray(props.task?.finalClass?.subject) ? props.task.finalClass.subject.map((s: any) => typeof s === 'string' ? s : s?.label || s?.name || 'N/A').join(', ') : (typeof props.task?.finalClass?.subject === 'object' && props.task?.finalClass?.subject !== null ? (props.task.finalClass.subject as any).label || (props.task.finalClass.subject as any).name || 'N/A' : String(props.task?.finalClass?.subject || ''))}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ p: 1.5, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: '12px', border: `1px dashed ${alpha(theme.palette.info.main, 0.2)}` }}>
                  Periodic assessment is due for this student.
                </Typography>
                {props.task?.lastTestDate && (
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                    <Typography variant="caption" color="text.secondary">Last test: {formatDate(props.task.lastTestDate)}</Typography>
                  </Box>
                )}
              </>
            )}

            {props.taskType === 'complaint' && (
              <>
                <Box display="flex" alignItems="flex-start" gap={1.5}>
                  <SchoolIcon sx={{ color: 'text.secondary', fontSize: 18, mt: 0.3 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{props.task?.finalClass?.studentName}</Typography>
                    <Typography variant="caption" color="text.secondary">{props.task?.parentName}</Typography>
                  </Box>
                </Box>
                {props.task?.summary && (
                  <Box sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), p: 1.5, borderRadius: '12px', borderLeft: `3px solid ${theme.palette.error.main}` }}>
                    <Typography variant="caption" color="text.error" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>ISSUE SUMMARY:</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{props.task.summary}</Typography>
                  </Box>
                )}
                <Box display="flex" alignItems="center" gap={1.5}>
                  <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                  <Typography variant="caption" color="text.secondary">Received {formatDate(props.task.createdAt)}</Typography>
                </Box>
              </>
            )}
          </Box>
        </CardContent>

        <CardActions sx={{ px: 3, pb: 2.5, pt: 0, mt: 'auto' }}>
          {props.taskType === 'attendance' && (
            <>
              <Button fullWidth variant="contained" color="success" size="small" disableElevation onClick={() => navigate('/attendance-sheet-approvals')} sx={{ borderRadius: '10px', fontWeight: 700, py: 1 }}>
                Review
              </Button>
              <Button variant="outlined" size="small" color="inherit" onClick={() => onAction?.((props.task as IAttendance).id, 'view')} sx={{ borderRadius: '10px', minWidth: 44, width: 44, borderColor: 'divider' }}>
                <ArrowForwardIcon fontSize="small" />
              </Button>
            </>
          )}
          {props.taskType === 'payment' && (
            <>
              <Button fullWidth variant="contained" color="primary" size="small" disableElevation onClick={() => navigate(`/payment-tracking`)} sx={{ borderRadius: '10px', fontWeight: 700, py: 1 }}>
                Track
              </Button>
              <Button variant="outlined" size="small" color="inherit" onClick={() => navigate('/assigned-classes')} sx={{ borderRadius: '10px', minWidth: 44, width: 44, borderColor: 'divider' }}>
                <ArrowForwardIcon fontSize="small" />
              </Button>
            </>
          )}
          {(props.taskType === 'test' || props.taskType === 'complaint') && (
            <Button fullWidth variant="contained" color="primary" size="small" disableElevation onClick={() => navigate(props.taskType === 'test' ? '/test-scheduling' : '/assigned-classes')} sx={{ borderRadius: '10px', fontWeight: 700, py: 1 }}>
              Take Action
            </Button>
          )}
        </CardActions>
      </Card>
    </Grow>
  );
};

export default TaskCard;

