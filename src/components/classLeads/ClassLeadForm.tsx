import { useEffect, useMemo } from 'react';
import { useForm, SubmitHandler, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, TextField, Button, MenuItem, Chip, Autocomplete,
  FormControl, Typography, IconButton, Grid, InputAdornment,
  Checkbox, Divider, alpha, Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import ClassIcon from '@mui/icons-material/Class';
import NoteIcon from '@mui/icons-material/Note';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import GroupsIcon from '@mui/icons-material/Groups';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TimerIcon from '@mui/icons-material/Timer';
import WifiIcon from '@mui/icons-material/Wifi';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SyncAltIcon from '@mui/icons-material/SyncAlt';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;
import { BOARD_TYPE, TEACHING_MODE } from '../../constants';
import { useOptions } from '@/hooks/useOptions';
import { IClassLead, IClassLeadFormData, StudentType } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import useAuth from '../../hooks/useAuth';

type Props = {
  initialData?: IClassLead;
  onSubmit: SubmitHandler<IClassLeadFormData>;
  loading?: boolean;
  error?: string | null;
  submitButtonText?: string;
};

// ── Section card — no ghost-card ────────────────────────────────────────────
function SectionCard({ children, animDelay = 0 }: { children: React.ReactNode; animDelay?: number }) {
  return (
    <Box
      sx={{
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        bgcolor: '#fff',
        overflow: 'hidden',
        p: { xs: 1.5, sm: 2 },
        '@keyframes secIn': {
          from: { opacity: 0, transform: 'perspective(600px) translateZ(-10px) translateY(8px)' },
          to: { opacity: 1, transform: 'perspective(600px) translateZ(0) translateY(0)' },
        },
        animation: `secIn 320ms cubic-bezier(0.23,1,0.32,1) ${animDelay}ms both`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
      }}
    >
      {children}
    </Box>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ step, icon, title, subtitle }: { step: number; icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <Box display="flex" alignItems="center" gap={1.25} mb={1.5}>
      <Box
        sx={{
          width: 26,
          height: 26,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#2E7D32',
          color: '#fff',
          fontWeight: 800,
          fontSize: '0.72rem',
          flexShrink: 0,
        }}
      >
        {step}
      </Box>
      <Box flex={1} minWidth={0}>
        <Box display="flex" alignItems="center" gap={0.75}>
          <Box sx={{ color: '#2E7D32', display: 'flex' }}>{icon}</Box>
          <Typography fontWeight={800} sx={{ fontSize: { xs: '0.85rem', sm: '0.92rem' } }}>{title}</Typography>
        </Box>
        {subtitle && (
          <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.3 }}>{subtitle}</Typography>
        )}
      </Box>
    </Box>
  );
}

// ── Type/Mode selector card ──────────────────────────────────────────────────
function SelectCard({
  icon, label, description, selected, onClick,
}: {
  icon: React.ReactNode; label: string; description?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: '1 1 120px',
        p: { xs: 1, sm: 1.25 },
        borderRadius: '10px',
        border: '1.5px solid',
        borderColor: selected ? '#2E7D32' : '#E2E8F0',
        bgcolor: selected ? alpha('#2E7D32', 0.05) : '#FAFAFA',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        transition: 'all 160ms cubic-bezier(0.23,1,0.32,1)',
        userSelect: 'none',
        '@media (hover: none)': { '&:active': { transform: 'scale(0.97)' } },
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': { borderColor: selected ? '#2E7D32' : '#94a3b8', bgcolor: selected ? alpha('#2E7D32', 0.06) : '#F8FAFC' },
        },
      }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: '8px',
          bgcolor: selected ? alpha('#2E7D32', 0.1) : '#F1F5F9',
          color: selected ? '#2E7D32' : '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 160ms',
        }}
      >
        {icon}
      </Box>
      <Box minWidth={0}>
        <Typography fontWeight={selected ? 800 : 600} sx={{ fontSize: '0.85rem', color: selected ? '#1e293b' : '#475569', lineHeight: 1.2 }}>
          {label}
        </Typography>
        {description && (
          <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', mt: 0.15, lineHeight: 1.2 }} noWrap>{description}</Typography>
        )}
      </Box>
      <Box
        sx={{
          ml: 'auto',
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid',
          borderColor: selected ? '#2E7D32' : '#CBD5E1',
          bgcolor: selected ? '#2E7D32' : 'transparent',
          flexShrink: 0,
          transition: 'all 160ms',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#fff' }} />}
      </Box>
    </Box>
  );
}

const schema = yup.object({
  studentType: yup.string().oneOf(['SINGLE', 'GROUP']).required('Please select student type'),
  studentName: yup.string().when('studentType', {
    is: 'SINGLE',
    then: (schema) => schema.required('Student name is required').min(2).max(100),
    otherwise: (schema) => schema.optional()
  }),
  studentGender: yup.string().when('studentType', {
    is: 'SINGLE',
    then: (schema) => schema.required('Student gender is required').oneOf(['M', 'F', 'OTHER'], 'Please select gender'),
    otherwise: (schema) => schema.optional()
  }),
  parentName: yup.string().optional().min(3, 'Name must be at least 3 characters'),
  parentEmail: yup.string().optional().email('Invalid email address'),
  parentPhone: yup
    .string()
    .optional()
    .transform((v) => (typeof v === 'string' ? v.replace(/\D/g, '') : v))
    .test('phone-10-digits', 'Phone number must be 10 digits', (v) => !v || v.length === 10),
  grade: yup.string().when('studentType', {
    is: 'SINGLE',
    then: (schema) => schema.required('Grade is required'),
    otherwise: (schema) => schema.optional()
  }),
  subject: yup.array().when('studentType', {
    is: 'SINGLE',
    then: (schema) => schema.of(yup.string().required()).min(1, 'At least one subject is required').required(),
    otherwise: (schema) => schema.optional()
  }),
  board: yup.string().when('studentType', {
    is: 'SINGLE',
    then: (schema) => schema.required('Board is required'),
    otherwise: (schema) => schema.optional()
  }),
  mode: yup.string().oneOf(Object.values(TEACHING_MODE)).required(),
  numberOfStudents: yup.number().when('studentType', {
    is: 'GROUP',
    then: (schema) => schema.required('Number of students is required').min(1).max(10),
    otherwise: (schema) => schema.optional()
  }),
  studentDetails: yup.array().when('studentType', {
    is: 'GROUP',
    then: (schema) => schema.of(
      yup.object({
        name: yup.string().required('Student name is required'),
        gender: yup.string().required('Student gender is required').oneOf(['M', 'F', 'OTHER']),
        fees: yup.number().required('Fees are required').min(0),
        tutorFees: yup.number().required('Tutor fees are required').min(0),
        parentName: yup.string().optional(),
        parentEmail: yup.string().email('Invalid email address').optional(),
        parentPhone: yup.string().optional().transform((v) => (typeof v === 'string' ? v.replace(/\D/g, '') : v)).test('phone-10-digits', 'Phone number must be 10 digits', (v) => !v || v.length === 10),
        board: yup.string().required('Board is required for student'),
        grade: yup.string().required('Grade is required for student'),
        subject: yup.array().of(yup.string().required()).min(1, 'At least one subject is required')
      })
    ).min(1, 'At least one student is required'),
    otherwise: (schema) => schema.optional()
  }),
  location: yup.string().when('mode', {
    is: (mode: string) => mode === TEACHING_MODE.HYBRID,
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.optional(),
  }),
  city: yup.string().when('mode', {
    is: (mode: string) => mode === TEACHING_MODE.OFFLINE,
    then: (schema) => schema.required('City is required for offline mode'),
    otherwise: (schema) => schema.optional(),
  }),
  area: yup.string().when('mode', {
    is: (mode: string) => mode === TEACHING_MODE.OFFLINE,
    then: (schema) => schema.required('Area is required for offline mode'),
    otherwise: (schema) => schema.optional(),
  }),
  address: yup.string().when('mode', {
    is: (mode: string) => mode === TEACHING_MODE.OFFLINE,
    then: (schema) => schema.required('Address is required for offline mode').min(5).max(200),
    otherwise: (schema) => schema.optional(),
  }),
  classesPerMonth: yup.number().optional().typeError('Must be a number').min(1),
  classDurationHours: yup.number().optional().typeError('Must be a number').min(0.5),
  paymentAmount: yup.number().when('studentType', {
    is: 'SINGLE',
    then: (schema) => schema.typeError('Fees must be a number').min(0).required('Fees are required'),
    otherwise: (schema) => schema.optional()
  }),
  tutorFees: yup.number().when('studentType', {
    is: 'SINGLE',
    then: (schema) => schema.typeError('Tutor fees must be a number').min(0).required('Tutor fees are required'),
    otherwise: (schema) => schema.optional()
  }),
  leadSource: yup.string().optional(),
  timing: yup.string().required().min(2).max(100),
  weekdays: yup.array().of(yup.string()).optional(),
  notes: yup.string().max(500).optional(),
  internalNotes: yup.string().max(2000).optional(),
});

// ── Group student row ─────────────────────────────────────────────────────────
function GroupStudentRow({ index, control, register, setValue, watch, errors, remove, numberOfStudents }: any) {
  const selectedBoard = watch(`studentDetails.${index}.board`);
  const selectedGrade = watch(`studentDetails.${index}.grade`);

  const { options: boardOptions } = useOptions('BOARD');
  const selectedBoardOption = useMemo(() => boardOptions.find((b) => b.value === selectedBoard), [boardOptions, selectedBoard]);
  const { options: gradeOptions } = useOptions('GRADE', selectedBoardOption ? selectedBoardOption._id : null);
  const selectedGradeOption = useMemo(() => gradeOptions.find((g) => g.value === selectedGrade), [gradeOptions, selectedGrade]);
  const { options: subjectOptions } = useOptions('SUBJECT', selectedGradeOption ? selectedGradeOption._id : null);

  const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#2E7D32', '#06b6d4'];
  const color = colors[index % colors.length];

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 2,
        bgcolor: '#FAFAFA',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        transition: 'border-color 160ms ease',
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': { borderColor: '#CBD5E1' },
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar
            sx={{
              width: 26,
              height: 26,
              borderRadius: '7px',
              bgcolor: alpha(color, 0.12),
              color,
              fontSize: '0.68rem',
              fontWeight: 800,
            }}
          >
            {index + 1}
          </Avatar>
          <Typography fontWeight={700} sx={{ fontSize: '0.85rem' }}>Student {index + 1}</Typography>
        </Box>
        {index > 0 && (
          <IconButton
            size="small"
            onClick={() => {
              remove(index);
              setValue('numberOfStudents', (numberOfStudents || 1) - 1);
            }}
            sx={{
              color: '#ef4444',
              bgcolor: alpha('#ef4444', 0.06),
              borderRadius: '8px',
              width: 28,
              height: 28,
              '&:active': { transform: 'scale(0.93)' },
            }}
          >
            <DeleteIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Box>
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Student Name"
            fullWidth
            size="small"
            {...register(`studentDetails.${index}.name` as const)}
            error={!!errors.studentDetails?.[index]?.name}
            helperText={errors.studentDetails?.[index]?.name?.message}
            InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }}
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <TextField select label="Gender" fullWidth size="small" defaultValue="M" {...register(`studentDetails.${index}.gender` as const)} error={!!errors.studentDetails?.[index]?.gender}>
            <MenuItem value="M">Male</MenuItem>
            <MenuItem value="F">Female</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6} md={4}>
          <Controller
            name={`studentDetails.${index}.board`}
            control={control}
            render={({ field: { value, onChange } }) => (
              <TextField select label="Board" fullWidth size="small" value={value || ''} onChange={(e) => { onChange(e.target.value); setValue(`studentDetails.${index}.grade`, '', { shouldValidate: true }); setValue(`studentDetails.${index}.subject`, [], { shouldValidate: true }); }} error={!!errors.studentDetails?.[index]?.board}>
                {boardOptions.length > 0 ? boardOptions.map((b) => <MenuItem key={b.value} value={b.value}>{b.label}</MenuItem>) : Object.values(BOARD_TYPE).map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <Controller
            name={`studentDetails.${index}.grade`}
            control={control}
            render={({ field: { value, onChange } }) => (
              <TextField select label="Grade" fullWidth size="small" value={value || ''} onChange={(e) => { onChange(e.target.value); setValue(`studentDetails.${index}.subject`, [], { shouldValidate: true }); }} error={!!errors.studentDetails?.[index]?.grade} disabled={!selectedBoard}>
                {gradeOptions.map((g) => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={6} md={8}>
          <Controller
            name={`studentDetails.${index}.subject`}
            control={control}
            render={({ field: { value = [], onChange } }) => (
              <Autocomplete
                multiple size="small"
                options={subjectOptions.length > 0 ? [{ label: 'Select All', value: 'SELECT_ALL' }, ...subjectOptions] : []}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                value={(value || []).map((val: any) => { const v = typeof val === 'object' ? (val.value || val.label || val._id) : val; const opt = subjectOptions.find(o => o.value === v); return opt ? opt : { label: String(v), value: String(v) }; })}
                onChange={(_, newValue) => {
                  if (newValue.some(v => (typeof v === 'string' ? v : v.value) === 'SELECT_ALL')) {
                    if ((value || []).length === subjectOptions.length) { onChange([]); } else { onChange(subjectOptions.map(o => o.value)); }
                  } else { onChange(newValue.map(v => typeof v === 'string' ? v : v.value)); }
                }}
                disabled={!selectedGrade}
                renderOption={(props, option, { selected }) => {
                  const { key, ...rest } = props as any;
                  const isSelectAll = (typeof option === 'string' ? option : option.label) === 'Select All';
                  const allSelected = (value || []).length === subjectOptions.length && subjectOptions.length > 0;
                  return <li key={key} {...rest}><Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={isSelectAll ? allSelected : selected} />{typeof option === 'string' ? option : option.label}</li>;
                }}
                renderTags={(val, getTagProps) => val.map((option: any, i: number) => <Chip size="small" label={typeof option === 'string' ? option : option.label} {...getTagProps({ index: i })} key={i} sx={{ borderRadius: '7px', fontWeight: 600, fontSize: '0.7rem' }} />)}
                renderInput={(params) => <TextField {...params} label="Subjects" error={!!errors.studentDetails?.[index]?.subject} />}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField label="Parent Name" fullWidth size="small" {...register(`studentDetails.${index}.parentName`)} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField label="Parent Email" fullWidth size="small" {...register(`studentDetails.${index}.parentEmail`)} InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField label="Parent Phone" fullWidth size="small" {...register(`studentDetails.${index}.parentPhone`)} inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Fees" type="number" fullWidth size="small" {...register(`studentDetails.${index}.fees` as const, { valueAsNumber: true })} InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.9rem', color: '#94a3b8' }}>₹</Typography></InputAdornment> }} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Tutor Fees" type="number" fullWidth size="small" {...register(`studentDetails.${index}.tutorFees` as const, { valueAsNumber: true })} InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.9rem', color: '#94a3b8' }}>₹</Typography></InputAdornment> }} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default function ClassLeadForm({ initialData, onSubmit, loading, error, submitButtonText = 'Create Lead' }: Props) {
  const defaultValues: IClassLeadFormData = useMemo(() => {
    const initialStudentType = (initialData as any)?.studentType || 'SINGLE';
    return {
      studentType: initialStudentType,
      studentName: initialData?.studentName || '',
      studentGender: (initialData as any)?.studentGender || 'M',
      parentName: (initialData as any)?.parentName || '',
      parentEmail: (initialData as any)?.parentEmail || '',
      parentPhone: (initialData as any)?.parentPhone || '',
      grade: initialData?.grade || '',
      subject: Array.isArray(initialData?.subject)
        ? (initialData?.subject as any[]).map((s: any) => typeof s === 'object' ? (s.value || s.label || s._id) : String(s))
        : initialData?.subject ? String(initialData.subject).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      board: initialData?.board || '',
      mode: initialData?.mode || TEACHING_MODE.ONLINE,
      location: initialData?.location || '',
      city: (initialData as any)?.city || '',
      area: (initialData as any)?.area || '',
      address: (initialData as any)?.address || '',
      timing: initialData?.timing || '',
      weekdays: (initialData as any)?.weekdays || [],
      paymentAmount: initialStudentType === 'SINGLE' ? ((initialData as any)?.paymentAmount ?? undefined) : undefined,
      tutorFees: initialStudentType === 'SINGLE' ? ((initialData as any)?.tutorFees ?? undefined) : undefined,
      classesPerMonth: (initialData as any)?.classesPerMonth ?? undefined,
      classDurationHours: (initialData as any)?.classDurationHours ?? undefined,
      preferredTutorGender: (initialData as any)?.preferredTutorGender || 'NO_PREFERENCE',
      leadSource: (initialData as any)?.leadSource || '',
      notes: (initialData as any)?.notes || '',
      internalNotes: (initialData as any)?.internalNotes || '',
      numberOfStudents: (initialData as any)?.numberOfStudents ?? 1,
      studentDetails: (initialData as any)?.studentDetails?.length > 0
        ? (initialData as any).studentDetails.map((sd: any) => ({ ...sd, subject: Array.isArray(sd.subject) ? sd.subject.map((s: any) => typeof s === 'object' ? (s.value || s.label || s._id) : String(s)) : sd.subject ? String(sd.subject).split(',').map((s: string) => s.trim()).filter(Boolean) : [] }))
        : (initialData as any)?.groupClass?.students?.map((sd: any) => ({ ...sd, subject: Array.isArray(sd.subject) ? sd.subject.map((s: any) => typeof s === 'object' ? (s.value || s.label || s._id) : String(s)) : sd.subject ? String(sd.subject).split(',').map((s: string) => s.trim()).filter(Boolean) : [] })) || [
          { name: '', gender: 'M' as 'M' | 'F', fees: 0, tutorFees: 0, board: '', grade: '', subject: [], parentName: '', parentEmail: '', parentPhone: '' }
        ],
    };
  }, [initialData]);

  const { control, register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<IClassLeadFormData>({
    resolver: yupResolver(schema as any),
    defaultValues,
  });

  const { user } = useAuth();
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const selectedBoard = watch('board');
  const selectedGrade = watch('grade');

  const { options: boardOptions } = useOptions('BOARD');
  const selectedBoardOption = useMemo(() => boardOptions.find(b => b.value === selectedBoard), [boardOptions, selectedBoard]);
  const { options: gradeOptions } = useOptions('GRADE', selectedBoardOption ? selectedBoardOption._id : null);
  const selectedGradeOption = useMemo(() => gradeOptions.find(g => g.value === selectedGrade), [gradeOptions, selectedGrade]);
  const { options: subjectOptions } = useOptions('SUBJECT', selectedGradeOption ? selectedGradeOption._id : null);
  const { options: leadSourceOptions } = useOptions('LEAD_SOURCE');
  const { options: cityOptionItems } = useOptions('CITY');
  const cityLabels = useMemo(() => cityOptionItems.map((o) => o.label), [cityOptionItems]);

  useEffect(() => { if (initialData) reset(defaultValues); }, [initialData, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: 'studentDetails' });

  const studentType = watch('studentType');
  const watchStudentDetails = watch('studentDetails');
  const numberOfStudents = watch('numberOfStudents');

  useEffect(() => {
    if (studentType === 'GROUP') {
      const currentLength = watchStudentDetails?.length || 0;
      const diff = (numberOfStudents || 1) - currentLength;
      if (diff > 0) { for (let i = 0; i < diff; i++) append({ name: '', gender: 'M' as 'M' | 'F', fees: 0, tutorFees: 0, board: '', grade: '', subject: [], parentName: '', parentEmail: '', parentPhone: '' }); }
      else if (diff < 0) { for (let i = 0; i < -diff; i++) remove(currentLength - i - 1); }
    }
  }, [numberOfStudents, studentType, append, remove, watchStudentDetails?.length]);

  const totalFees = useMemo(() => { if (studentType !== 'GROUP' || !watchStudentDetails?.length) return 0; return watchStudentDetails.reduce((s, sd) => s + (Number(sd.fees) || 0), 0); }, [watchStudentDetails, studentType]);
  const totalTutorFees = useMemo(() => { if (studentType !== 'GROUP' || !watchStudentDetails?.length) return 0; return watchStudentDetails.reduce((s, sd) => s + (Number(sd.tutorFees) || 0), 0); }, [watchStudentDetails, studentType]);

  useEffect(() => {
    if (studentType === 'GROUP') {
      setValue('paymentAmount', undefined, { shouldValidate: true });
      setValue('tutorFees', undefined, { shouldValidate: true });
    }
  }, [studentType, setValue]);

  const mode = watch('mode');
  const selectedCity = watch('city') || '';
  const areaType = selectedCity ? `AREA_${selectedCity.toUpperCase().replace(/\s+/g, '_')}` : '';
  const { options: areaOptionItems } = useOptions(areaType);
  const areaLabels = useMemo(() => areaOptionItems.map((o) => o.label), [areaOptionItems]);

  const handleFormSubmit: SubmitHandler<IClassLeadFormData> = (formData) => {
    const payload: IClassLeadFormData = { ...formData };
    if (!(payload as any).preferredTutorGender || (payload as any).preferredTutorGender === '') {
      (payload as any).preferredTutorGender = 'NO_PREFERENCE';
    }
    if (payload.studentType === 'SINGLE') {
      delete (payload as any).studentDetails;
      delete (payload as any).numberOfStudents;
    } else {
      if (payload.studentDetails && payload.studentDetails.length > 0) {
        const firstStudent = payload.studentDetails[0];
        payload.grade = firstStudent.grade || payload.grade;
        payload.subject = firstStudent.subject || payload.subject;
        payload.board = firstStudent.board || payload.board;
        payload.paymentAmount = totalFees;
        payload.tutorFees = totalTutorFees;
      }
    }
    onSubmit(payload);
  };

  let stepCounter = 0;
  const nextStep = () => ++stepCounter;

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} display="flex" flexDirection="column" gap={1.5}>

      {/* ── 1. Student Type ───────────────────────────────────────────── */}
      <SectionCard animDelay={0}>
        <SectionHeader step={nextStep()} icon={<PersonIcon sx={{ fontSize: 17 }} />} title="Student Type" subtitle="Single student or a group class?" />
        <Box display="flex" gap={1.5} flexWrap="wrap">
          <SelectCard
            icon={<PersonIcon sx={{ fontSize: 20 }} />}
            label="Single Student"
            description="One-on-one tuition"
            selected={studentType === 'SINGLE'}
            onClick={() => { setValue('studentType', 'SINGLE'); setValue('studentDetails', []); }}
          />
          <SelectCard
            icon={<GroupsIcon sx={{ fontSize: 20 }} />}
            label="Group of Students"
            description="Multiple students"
            selected={studentType === 'GROUP'}
            onClick={() => { setValue('studentType', 'GROUP'); setValue('studentName', ''); setValue('grade', ''); setValue('subject', []); setValue('numberOfStudents', 1); }}
          />
        </Box>
        {errors.studentType && <Typography color="error" sx={{ fontSize: '0.75rem', mt: 1 }}>{errors.studentType.message}</Typography>}
      </SectionCard>

      {/* ── 2. Student Details (SINGLE) — Board + Grade + Name in one card ── */}
      {studentType === 'SINGLE' && (
        <SectionCard animDelay={60}>
          <SectionHeader step={nextStep()} icon={<PersonIcon sx={{ fontSize: 17 }} />} title="Student Details" subtitle="Name, curriculum, and subjects" />
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={4}>
              <TextField label="Student Name" fullWidth size="small" {...register('studentName')} error={!!errors.studentName} helperText={errors.studentName?.message} InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 15, color: '#94a3b8' }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField select label="Gender" fullWidth size="small" value={watch('studentGender') || 'M'} {...register('studentGender')} error={!!errors.studentGender}>
                <MenuItem value="M">Male</MenuItem>
                <MenuItem value="F">Female</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={8} sm={3}>
              <TextField
                select label="Board" fullWidth size="small"
                value={watch('board')}
                onChange={(e) => { setValue('board', e.target.value, { shouldValidate: true }); setValue('grade', '', { shouldValidate: true }); setValue('subject', [], { shouldValidate: true }); }}
                error={!!errors.board} helperText={errors.board?.message}
              >
                {boardOptions.length > 0 ? boardOptions.map((b) => <MenuItem key={b.value} value={b.value}>{b.label}</MenuItem>) : Object.values(BOARD_TYPE).map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select label="Grade" fullWidth size="small"
                value={watch('grade')}
                onChange={(e) => { setValue('grade', e.target.value, { shouldValidate: true }); setValue('subject', [], { shouldValidate: true }); }}
                error={!!errors.grade} helperText={errors.grade?.message} disabled={!selectedBoard}
              >
                {gradeOptions.map((g) => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple disableCloseOnSelect size="small"
                options={subjectOptions.length > 0 ? [{ label: 'Select All', value: 'SELECT_ALL' }, ...subjectOptions] : []}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                value={(watch('subject') || []).map((val: any) => { const v = typeof val === 'object' ? (val.value || val.label || val._id) : val; const opt = subjectOptions.find(o => o.value === v); return opt ? opt : { label: String(v), value: String(v) }; })}
                onChange={(_, newValue) => {
                  if (newValue.some(v => (typeof v === 'string' ? v : v.value) === 'SELECT_ALL')) {
                    const curr = watch('subject') || [];
                    if (curr.length === subjectOptions.length) setValue('subject', [], { shouldValidate: true });
                    else setValue('subject', subjectOptions.map(o => o.value), { shouldValidate: true });
                  } else {
                    setValue('subject', newValue.map(v => typeof v === 'string' ? v : v.value), { shouldValidate: true });
                  }
                }}
                disabled={!selectedGrade}
                renderOption={(props, option, { selected }) => {
                  const { key, ...rest } = props as any;
                  const isSelectAll = (typeof option === 'string' ? option : option.label) === 'Select All';
                  const allSelected = (watch('subject') || []).length === subjectOptions.length && subjectOptions.length > 0;
                  return <li key={key} {...rest}><Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={isSelectAll ? allSelected : selected} />{typeof option === 'string' ? option : option.label}</li>;
                }}
                renderTags={(value: readonly any[], getTagProps) => value.map((option: any, index: number) => <Chip label={typeof option === 'string' ? option : option.label} {...getTagProps({ index })} key={index} size="small" sx={{ borderRadius: '7px', fontWeight: 600, fontSize: '0.7rem' }} />)}
                renderInput={(params) => <TextField {...params} label="Subjects" error={!!errors.subject} helperText={errors.subject?.message as string} />}
              />
            </Grid>
          </Grid>
        </SectionCard>
      )}

      {studentType === 'GROUP' && (
        <SectionCard animDelay={120}>
          <SectionHeader step={nextStep()} icon={<GroupsIcon sx={{ fontSize: 17 }} />} title="Group Information" subtitle="Add each student's details" />
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Number of Students" type="number" fullWidth
                {...register('numberOfStudents', { valueAsNumber: true })}
                error={!!errors.numberOfStudents} helperText={errors.numberOfStudents?.message}
                inputProps={{ min: 1, max: 10 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><GroupsIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2.5 }} />
          <Typography fontWeight={700} sx={{ fontSize: '0.83rem', color: '#475569', mb: 2 }}>Student Details</Typography>

          {fields.map((field, index) => (
            <GroupStudentRow key={field.id} index={index} control={control} register={register} setValue={setValue} watch={watch} errors={errors} remove={remove} numberOfStudents={numberOfStudents} />
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => { append({ name: '', gender: 'M', fees: 0, tutorFees: 0, board: '', grade: '', subject: [], parentName: '', parentEmail: '', parentPhone: '' }); setValue('numberOfStudents', (numberOfStudents || 0) + 1); }}
            disabled={(numberOfStudents || 0) >= 10}
            sx={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem', textTransform: 'none', mb: 2.5, borderColor: '#CBD5E1', color: '#64748b', '&:active': { transform: 'scale(0.97)' } }}
          >
            Add Student (max 10)
          </Button>

          {/* Totals */}
          <Box sx={{ p: 2, borderRadius: '12px', border: '1px solid', borderColor: alpha('#2E7D32', 0.15), bgcolor: alpha('#2E7D32', 0.04) }}>
            <Box display="flex" flexWrap="wrap" gap={2.5}>
              {[{ l: 'Total Fees', v: totalFees, c: '#6366f1' }, { l: 'Tutor Payout', v: totalTutorFees, c: '#0ea5e9' }, { l: 'Service Charge', v: totalFees - totalTutorFees, c: '#10b981' }].map(({ l, v, c }) => (
                <Box key={l}>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', mb: 0.25 }}>{l}</Typography>
                  <Typography fontWeight={800} sx={{ fontSize: '1.1rem', color: c }}>₹{v.toLocaleString()}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </SectionCard>
      )}

      {/* ── 4. Class Requirements ─────────────────────────────────────── */}
      <SectionCard animDelay={180}>
        <SectionHeader step={nextStep()} icon={<ClassIcon sx={{ fontSize: 17 }} />} title="Class Requirements" subtitle="Mode, schedule, duration, and frequency" />

        {/* Teaching mode — card selector */}
        <Box mb={1.5}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', mb: 1 }}>Teaching Mode</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <SelectCard
              icon={<WifiIcon sx={{ fontSize: 18 }} />}
              label="Online"
              selected={mode === TEACHING_MODE.ONLINE}
              onClick={() => setValue('mode', TEACHING_MODE.ONLINE, { shouldValidate: true })}
            />
            <SelectCard
              icon={<LocationOnIcon sx={{ fontSize: 18 }} />}
              label="Offline"
              selected={mode === TEACHING_MODE.OFFLINE}
              onClick={() => setValue('mode', TEACHING_MODE.OFFLINE, { shouldValidate: true })}
            />
            <SelectCard
              icon={<SyncAltIcon sx={{ fontSize: 18 }} />}
              label="Hybrid"
              selected={mode === TEACHING_MODE.HYBRID}
              onClick={() => setValue('mode', TEACHING_MODE.HYBRID, { shouldValidate: true })}
            />
          </Box>
        </Box>

        <Grid container spacing={1.5}>
          <Grid item xs={6}>
            <TextField
              label="Classes per Month" type="number" fullWidth
              {...register('classesPerMonth', { valueAsNumber: true })}
              error={!!errors.classesPerMonth} helperText={errors.classesPerMonth?.message}
              InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Duration (hours)" type="number" fullWidth
              {...register('classDurationHours', { valueAsNumber: true })}
              inputProps={{ step: 0.5 }}
              error={!!errors.classDurationHours} helperText={errors.classDurationHours?.message}
              InputProps={{ startAdornment: <InputAdornment position="start"><TimerIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }}
            />
          </Grid>
        </Grid>

        {/* Timing */}
        <Box mt={1.5} p={1.5} sx={{ bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Box display="flex" alignItems="center" gap={1} mb={1.25}>
            <AccessTimeIcon sx={{ fontSize: 16, color: '#2E7D32' }} />
            <Typography fontWeight={700} sx={{ fontSize: '0.83rem' }}>Preferred Timing</Typography>
          </Box>

          <Box mb={1}>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', mb: 0.75 }}>Days of Week</Typography>
            <Box display="flex" flexWrap="wrap" gap={0.75}>
              {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => {
                const currentWeekdays = ((watch as any)('weekdays') as string[] | undefined) || [];
                const isSelected = (currentWeekdays || []).includes(day);
                const displayLabel = day.charAt(0) + day.slice(1).toLowerCase().substring(0, 2);
                return (
                  <Chip
                    key={day}
                    label={displayLabel}
                    size="small"
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => {
                      let newWeekdays = [...currentWeekdays];
                      if (isSelected) { newWeekdays = newWeekdays.filter(d => d !== day); }
                      else {
                        newWeekdays.push(day);
                        const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
                        (newWeekdays as string[]).sort((a, b) => dayOrder.indexOf(a as string) - dayOrder.indexOf(b as string));
                      }
                      (setValue as any)('weekdays', newWeekdays, { shouldValidate: true });
                    }}
                    clickable
                    sx={{
                      fontWeight: isSelected ? 700 : 500,
                      borderRadius: '8px',
                      minWidth: 38,
                      fontSize: '0.72rem',
                      transition: 'all 120ms cubic-bezier(0.23,1,0.32,1)',
                      '&:active': { transform: 'scale(0.95)' },
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          <TextField
            label="Start Time"
            type="time"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            defaultValue=""
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              const [hStr, mStr] = val.split(':');
              let h = parseInt(hStr);
              const m = parseInt(mStr);
              const duration = watch('classDurationHours') || 1;
              const startDate = new Date();
              startDate.setHours(h, m, 0);
              const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);
              const formatTime = (date: Date) => {
                let hours = date.getHours();
                const minutes = date.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;
                return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
              };
              setValue('timing', `${formatTime(startDate)} - ${formatTime(endDate)}`, { shouldValidate: true });
            }}
          />
          <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', mt: 0.75 }}>
            End time auto-calculated from duration ({watch('classDurationHours') || 1} hr)
          </Typography>
          {errors.timing && <Typography sx={{ fontSize: '0.72rem', color: 'error.main', mt: 0.5 }}>{errors.timing.message}</Typography>}
        </Box>
      </SectionCard>

      {/* ── 5. Location ───────────────────────────────────────────────── */}
      {(mode === TEACHING_MODE.OFFLINE || mode === TEACHING_MODE.HYBRID) && (
        <SectionCard animDelay={240}>
          <SectionHeader step={nextStep()} icon={<PlaceIcon sx={{ fontSize: 17 }} />} title="Location Details" subtitle={mode === TEACHING_MODE.OFFLINE ? 'Offline tuition location' : 'Hybrid mode location'} />
          <Grid container spacing={1.5}>
            {mode === TEACHING_MODE.HYBRID && (
              <Grid item xs={12}>
                <TextField label="Location" fullWidth {...register('location')} error={!!errors.location} helperText={errors.location?.message} InputProps={{ startAdornment: <InputAdornment position="start"><PlaceIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }} />
              </Grid>
            )}
            {mode === TEACHING_MODE.OFFLINE && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField select label="City" fullWidth defaultValue={defaultValues.city} {...register('city')} error={!!errors.city} helperText={errors.city?.message}>
                    {cityLabels.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={selectedCity ? areaLabels : []}
                    value={watch('area') || ''}
                    onChange={(_, value) => setValue('area', value || '', { shouldValidate: true })}
                    renderInput={(params) => <TextField {...params} label="Area" error={!!errors.area} helperText={errors.area?.message} />}
                    freeSolo={false}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Full Address / Google Map Link" multiline rows={2} fullWidth {...register('address')} error={!!errors.address} helperText={errors.address?.message} />
                </Grid>
              </>
            )}
          </Grid>
        </SectionCard>
      )}

      {/* ── 6. Financials (SINGLE only) ──────────────────────────────── */}
      {studentType === 'SINGLE' && (
        <SectionCard animDelay={300}>
          <SectionHeader step={nextStep()} icon={<CurrencyRupeeIcon sx={{ fontSize: 17 }} />} title="Financials" subtitle="Student fees and tutor payout" />
          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <TextField label="Student Fees" type="number" fullWidth {...register('paymentAmount', { valueAsNumber: true })} error={!!errors.paymentAmount} helperText={errors.paymentAmount?.message} InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.9rem', color: '#94a3b8' }}>₹</Typography></InputAdornment> }} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Tutor Payout" type="number" fullWidth {...register('tutorFees', { valueAsNumber: true })} error={!!errors.tutorFees} helperText={errors.tutorFees?.message} InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.9rem', color: '#94a3b8' }}>₹</Typography></InputAdornment> }} />
            </Grid>
          </Grid>
        </SectionCard>
      )}

      {/* ── 7. Contact Information ───────────────────────────────────── */}
      <SectionCard animDelay={360}>
        <SectionHeader step={nextStep()} icon={<ContactPhoneIcon sx={{ fontSize: 17 }} />} title="Contact Information" subtitle={studentType === 'SINGLE' ? 'Parent or guardian contact details' : 'Primary contact details'} />
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={4}>
            <TextField label={studentType === 'SINGLE' ? 'Parent Name' : 'Primary Name'} fullWidth {...register('parentName')} error={!!errors.parentName} helperText={errors.parentName?.message} InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Email" type="email" fullWidth {...register('parentEmail')} error={!!errors.parentEmail} helperText={errors.parentEmail?.message} InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Phone" fullWidth {...register('parentPhone')} error={!!errors.parentPhone} helperText={errors.parentPhone?.message} inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }} />
          </Grid>
        </Grid>
      </SectionCard>

      {/* ── 8. Additional Information ────────────────────────────────── */}
      <SectionCard animDelay={420}>
        <SectionHeader step={nextStep()} icon={<NoteIcon sx={{ fontSize: 17 }} />} title="Additional Information" subtitle="Source, tutor preferences, and notes" />
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Lead Source" fullWidth defaultValue={defaultValues.leadSource || ''} {...register('leadSource')}>
              <MenuItem value="">Select source</MenuItem>
              {(leadSourceOptions && leadSourceOptions.length > 0 ? leadSourceOptions : [{ value: 'GOOGLE_PROFILE', label: 'Google Profile' }, { value: 'WHATSAPP', label: 'WhatsApp' }, { value: 'REFERRED', label: 'Referred' }, { value: 'OTHER', label: 'Other' }]).map((o: any) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Preferred Tutor Gender" fullWidth defaultValue={(defaultValues as any).preferredTutorGender || 'NO_PREFERENCE'} {...register('preferredTutorGender')}>
              <MenuItem value="NO_PREFERENCE">No preference</MenuItem>
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Notes" multiline rows={3} fullWidth {...register('notes')} error={!!(errors as any).notes} helperText={(errors as any).notes?.message} placeholder="Add notes for the tutor..." />
          </Grid>
          {isAdminOrManager && (
            <Grid item xs={12}>
              <TextField
                label="Internal Notes / Remarks"
                multiline rows={3} fullWidth
                {...register('internalNotes')}
                error={!!(errors as any).internalNotes}
                helperText={(errors as any).internalNotes?.message}
                placeholder="Add any special requirements or internal notes..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: alpha('#f59e0b', 0.03),
                    '& fieldset': { borderColor: alpha('#f59e0b', 0.3) },
                    '&:hover fieldset': { borderColor: '#f59e0b' },
                  },
                }}
              />
            </Grid>
          )}
        </Grid>
      </SectionCard>

      {error && <ErrorAlert error={error} />}

      {/* ── Sticky submit bar ─────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          bgcolor: alpha('#fff', 0.92),
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          px: 2,
          pt: 1.25,
          pb: `calc(1.25rem + env(safe-area-inset-bottom))`,
          zIndex: 10,
          boxShadow: '0 -1px 0 rgba(15,23,42,0.06), 0 -8px 24px rgba(15,23,42,0.04)',
          mx: -2,
        }}
      >
        <Button
          size="large"
          type="submit"
          variant="contained"
          fullWidth
          disabled={!!loading}
          disableElevation
          startIcon={!loading && <SaveIcon />}
          sx={{
            py: 1.375,
            fontWeight: 800,
            fontSize: '0.92rem',
            borderRadius: '12px',
            textTransform: 'none',
            bgcolor: '#2E7D32',
            boxShadow: `0 4px 14px ${alpha('#2E7D32', 0.35)}`,
            transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)',
            '@media (hover: none)': { '&:active': { transform: 'scale(0.97)' } },
            '@media (hover: hover) and (pointer: fine)': { '&:hover': { bgcolor: '#256428', transform: 'translateY(-1px)', boxShadow: `0 6px 18px ${alpha('#2E7D32', 0.4)}` } },
            '&.Mui-disabled': { opacity: 0.6 },
          }}
        >
          {loading ? <LoadingSpinner /> : submitButtonText}
        </Button>
      </Box>
    </Box>
  );
}
