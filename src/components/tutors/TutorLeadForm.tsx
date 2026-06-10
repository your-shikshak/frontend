import { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, FormControl, InputLabel, Select,
  MenuItem, FormHelperText, Autocomplete, Chip, alpha, useTheme, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Paper,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import SchoolIcon from '@mui/icons-material/School';
import LockIcon from '@mui/icons-material/Lock';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SportsIcon from '@mui/icons-material/Sports';
import TranslateIcon from '@mui/icons-material/Translate';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { TutorLeadFormData, TutorLeadFormProps } from '@/types/tutorLead';
import { Gender, TeachingMode } from '../../types/enums';
import { validateEmail, validatePhone } from '@/utils/leadValidation';
import { useOptions } from '@/hooks/useOptions';
import { CurriculumTreeSelector } from './CurriculumTreeSelector';
import { registrationOtpAPI } from '@/api/client';
import { toast } from 'sonner';

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = ['Personal', 'Professional', 'Location', 'Security'];

// ── Field group helpers ───────────────────────────────────────────────────────
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#64748B', mb: 0.4, letterSpacing: 0.3, textTransform: 'uppercase' }}>
    {children}
  </Typography>
);

const SectionDivider = ({ title }: { title: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 1.5 }}>
    <Box sx={{ flex: 1, height: '1px', bgcolor: '#E2E8F0' }} />
    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {title}
    </Typography>
    <Box sx={{ flex: 1, height: '1px', bgcolor: '#E2E8F0' }} />
  </Box>
);

// ── Main component ────────────────────────────────────────────────────────────
export const TutorLeadForm = ({ onSubmit, isLoading, initialData, mode = 'create' }: TutorLeadFormProps) => {
  const theme = useTheme();

  const isFieldReadOnly = (fieldName: string) => {
    if (mode === 'create') return false;
    if (initialData?.verificationStatus !== 'VERIFIED') return false;
    const allowedFields = ['city', 'preferredAreas', 'preferredMode', 'subjects', 'bio', 'languagesKnown', 'skills', 'alternatePhone'];
    return !allowedFields.includes(fieldName);
  };

  const [formData, setFormData] = useState<TutorLeadFormData>(initialData || {
    fullName: '', gender: Gender.MALE, phoneNumber: '', email: '',
    qualification: '', experience: '', subjects: [], extracurricularActivities: [],
    password: '', confirmPassword: '', city: '', preferredAreas: [],
    preferredMode: TeachingMode.OFFLINE, permanentAddress: '', residentialAddress: '',
    alternatePhone: '', bio: '', languagesKnown: [], skills: [],
  });

  useEffect(() => {
    if (!initialData) return;
    setFormData((prev) => ({ ...prev, ...initialData, password: '', confirmPassword: '' }));
  }, [initialData]);

  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);

  // steps: for edit mode without password step
  const steps = mode === 'create' ? STEPS : STEPS.slice(0, 3);

  // ── Email OTP ──────────────────────────────────────────────────────────────
  const [emailVerified,  setEmailVerified]  = useState(false);
  const [otpDialogOpen,  setOtpDialogOpen]  = useState(false);
  const [otpValue,       setOtpValue]       = useState('');
  const [otpSending,     setOtpSending]     = useState(false);
  const [otpVerifying,   setOtpVerifying]   = useState(false);
  const [otpError,       setOtpError]       = useState('');

  const handleSendOtp = async () => {
    if (!formData.email || !validateEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: 'Enter a valid email first' }));
      return;
    }
    setOtpSending(true); setOtpError('');
    try {
      await registrationOtpAPI.send(formData.email);
      setOtpValue(''); setOtpDialogOpen(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally { setOtpSending(false); }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) { setOtpError('Enter the 6-digit OTP'); return; }
    setOtpVerifying(true); setOtpError('');
    try {
      await registrationOtpAPI.verify(formData.email, otpValue);
      setEmailVerified(true); setOtpDialogOpen(false);
      toast.success('Email verified!');
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || 'Invalid or expired OTP');
    } finally { setOtpVerifying(false); }
  };

  // ── Options ────────────────────────────────────────────────────────────────
  const { options: extracurricularOptions } = useOptions('EXTRACURRICULAR_ACTIVITY');
  const extracurricularLabels = useMemo(() => extracurricularOptions.map((o) => o.label), [extracurricularOptions]);
  const { options: cityOptions } = useOptions('CITY');
  const areaType = formData.city ? `AREA_${formData.city.toUpperCase().replace(/\s+/g, '_')}` : '';
  const { options: areaOptions } = useOptions(areaType);

  // ── Per-step validation ────────────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const e: Record<string, string> = {};

    if (step === 0) {
      if (!formData.fullName.trim())       e.fullName    = 'Full name is required';
      if (!validatePhone(formData.phoneNumber)) e.phoneNumber = 'Enter a valid 10-digit number';
      if (!formData.email)                 e.email = 'Email is required';
      else if (!validateEmail(formData.email)) e.email   = 'Invalid email format';
      else if (mode === 'create' && !emailVerified) e.email = 'Please verify your email before proceeding';
    }

    if (step === 1) {
      if (!formData.qualification.trim()) e.qualification = 'Qualification is required';
      if (!formData.experience.trim())    e.experience    = 'Experience is required';
      if (formData.subjects.length === 0) e.subjects      = 'Select at least one subject';
    }

    if (step === 2) {
      if (!formData.preferredMode) e.preferredMode = 'Preferred mode is required';
      if (formData.preferredMode !== TeachingMode.ONLINE) {
        if (!formData.city)                        e.city          = 'City is required';
        if (formData.preferredAreas.length === 0)  e.preferredAreas = 'Select at least one area';
      }
    }

    if (step === 3 && mode === 'create') {
      if (!formData.password)                        e.password        = 'Password is required';
      else if (formData.password.length < 6)         e.password        = 'Password must be 6+ characters';
      if (!formData.confirmPassword)                 e.confirmPassword = 'Confirm your password';
      else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => { setErrors({}); setCurrentStep((s) => s - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lastStep = steps.length - 1;
    if (validateStep(lastStep)) await onSubmit(formData);
  };

  const handleCityChange = (city: string) => setFormData((prev) => ({ ...prev, city, preferredAreas: [] }));
  const handleModeChange  = (preferredMode: TeachingMode) =>
    setFormData((prev) => ({ ...prev, preferredMode, ...(preferredMode === TeachingMode.ONLINE ? { city: '', preferredAreas: [] } : null) }));

  // ── Shared field sx ────────────────────────────────────────────────────────
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.5,
      bgcolor: '#FAFAFA',
      '&:hover fieldset': { borderColor: '#001F54' },
      '&.Mui-focused fieldset': { borderColor: '#001F54', borderWidth: 2 },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#001F54' },
  };

  const primaryBtn = {
    bgcolor: '#001F54', color: 'white', borderRadius: 1.5, textTransform: 'none',
    fontWeight: 700, py: 1.4, px: 3, fontSize: 15,
    '&:hover': { bgcolor: '#002a7a' },
    '&:disabled': { bgcolor: alpha('#001F54', 0.4), color: 'white' },
  };

  // ── Step content ───────────────────────────────────────────────────────────
  const renderStep0 = () => (
    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
      <Grid item xs={12} sm={6}>
        <FieldLabel>Full Name *</FieldLabel>
        <TextField fullWidth placeholder="John Doe" value={formData.fullName}
          onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
          error={Boolean(errors.fullName)} helperText={errors.fullName}
          disabled={isFieldReadOnly('fullName')} sx={fieldSx}
          InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment> }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FieldLabel>Gender *</FieldLabel>
        <FormControl fullWidth sx={fieldSx} error={Boolean(errors.gender)}>
          <Select value={formData.gender} onChange={(e) => setFormData(p => ({ ...p, gender: e.target.value as any }))}
            disabled={isFieldReadOnly('gender')} sx={{ borderRadius: 1.5, bgcolor: '#FAFAFA' }}>
            <MenuItem value={Gender.MALE}>Male</MenuItem>
            <MenuItem value={Gender.FEMALE}>Female</MenuItem>
            <MenuItem value={Gender.OTHER}>Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FieldLabel>Phone Number *</FieldLabel>
        <TextField fullWidth placeholder="9876543210" value={formData.phoneNumber}
          onChange={(e) => setFormData(p => ({ ...p, phoneNumber: e.target.value.replace(/\D/g, '') }))}
          inputProps={{ maxLength: 10 }} error={Boolean(errors.phoneNumber)} helperText={errors.phoneNumber}
          disabled={isFieldReadOnly('phoneNumber')} sx={fieldSx}
          InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment> }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FieldLabel>Alternate Phone</FieldLabel>
        <TextField fullWidth placeholder="9876543211" value={formData.alternatePhone || ''}
          onChange={(e) => setFormData(p => ({ ...p, alternatePhone: e.target.value.replace(/\D/g, '') }))}
          inputProps={{ maxLength: 10 }} disabled={isFieldReadOnly('alternatePhone')} sx={fieldSx}
          InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment> }}
        />
      </Grid>

      <Grid item xs={12}>
        <FieldLabel>Email Address *</FieldLabel>
        <TextField fullWidth placeholder="you@example.com" value={formData.email}
          onChange={(e) => { setFormData(p => ({ ...p, email: e.target.value })); setEmailVerified(false); }}
          error={Boolean(errors.email)} helperText={errors.email}
          disabled={isFieldReadOnly('email')} sx={fieldSx}
          InputProps={{
            startAdornment: <InputAdornment position="start"><EmailIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment>,
            endAdornment: emailVerified && mode === 'create'
              ? <InputAdornment position="end"><CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} /></InputAdornment>
              : undefined,
          }}
        />
        {mode === 'create' && !isFieldReadOnly('email') && (
          emailVerified ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
              <VerifiedIcon sx={{ color: 'success.main', fontSize: 15 }} />
              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>Email Verified</Typography>
            </Box>
          ) : (
            <Button size="small" onClick={handleSendOtp} disabled={otpSending}
              startIcon={otpSending ? <CircularProgress size={13} /> : undefined}
              sx={{ mt: 0.75, textTransform: 'none', fontWeight: 700, color: '#001F54', borderColor: '#001F54',
                border: '1px solid', borderRadius: 1.5, px: 2, '&:hover': { bgcolor: alpha('#001F54', 0.05) } }}
            >
              {otpSending ? 'Sending…' : 'Verify Email'}
            </Button>
          )
        )}
      </Grid>
    </Grid>
  );

  const renderStep1 = () => (
    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
      <Grid item xs={12} sm={6}>
        <FieldLabel>Highest Qualification *</FieldLabel>
        <TextField fullWidth placeholder="e.g., M.Sc Mathematics" value={formData.qualification}
          onChange={(e) => setFormData(p => ({ ...p, qualification: e.target.value }))}
          error={Boolean(errors.qualification)} helperText={errors.qualification}
          disabled={isFieldReadOnly('qualification')} sx={fieldSx}
          InputProps={{ startAdornment: <InputAdornment position="start"><SchoolIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment> }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FieldLabel>Teaching Experience *</FieldLabel>
        <FormControl fullWidth sx={fieldSx} error={Boolean(errors.experience)}>
          <Select value={formData.experience}
            onChange={(e) => setFormData(p => ({ ...p, experience: e.target.value }))}
            disabled={isFieldReadOnly('experience')} sx={{ borderRadius: 1.5, bgcolor: '#FAFAFA' }}
            displayEmpty renderValue={(v) => v || <span style={{ color: '#94A3B8' }}>Select experience</span>}
            startAdornment={<InputAdornment position="start"><WorkIcon sx={{ fontSize: 18, color: '#94A3B8', ml: 0.5, mr: 1 }} /></InputAdornment>}
          >
            <MenuItem value="Fresher">Fresher (less than 1 year)</MenuItem>
            <MenuItem value="1-2 Years">1–2 Years</MenuItem>
            <MenuItem value="3-5 Years">3–5 Years</MenuItem>
            <MenuItem value="5-10 Years">5–10 Years</MenuItem>
            <MenuItem value="10+ Years">10+ Years</MenuItem>
          </Select>
          {errors.experience && <FormHelperText>{errors.experience}</FormHelperText>}
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1.5px dashed #CBD5E1' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LibraryBooksIcon sx={{ fontSize: 16, color: '#001F54' }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#001F54' }}>Select Your Subjects *</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Browse the curriculum hierarchy and select subjects you teach.
          </Typography>
          <CurriculumTreeSelector
            selectedSubjectIds={formData.subjects.map((s: any) => (typeof s === 'string' ? s : s?._id)).filter(Boolean)}
            onChange={(ids) => setFormData(p => ({ ...p, subjects: ids }))}
            error={errors.subjects} disabled={isFieldReadOnly('subjects')}
          />
        </Box>
        {errors.subjects && <FormHelperText error sx={{ mt: 0.5 }}>{errors.subjects}</FormHelperText>}
      </Grid>

      <Grid item xs={12}>
        <SectionDivider title="Optional" />
      </Grid>

      <Grid item xs={12}>
        <FieldLabel>Extracurricular Activities</FieldLabel>
        <Autocomplete multiple
          options={extracurricularLabels.length > 0 ? ['Select All', ...extracurricularLabels] : []}
          value={formData.extracurricularActivities}
          onChange={(_, value) => {
            if (value.includes('Select All')) {
              setFormData(p => ({
                ...p, extracurricularActivities:
                  p.extracurricularActivities.length === extracurricularLabels.length ? [] : extracurricularLabels,
              }));
            } else {
              setFormData(p => ({ ...p, extracurricularActivities: value.filter(v => v !== 'Select All') }));
            }
          }}
          disabled={isFieldReadOnly('extracurricularActivities')}
          renderTags={(value, getTagProps) =>
            value.filter(v => v !== 'Select All').map((option, index) => (
              <Chip size="small" label={option} {...getTagProps({ index })} key={option}
                sx={{ borderRadius: 1, fontSize: 12, bgcolor: alpha('#001F54', 0.08), color: '#001F54', border: 'none' }} />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} placeholder="Select activities" sx={fieldSx}
              InputProps={{ ...params.InputProps, startAdornment: <><InputAdornment position="start"><SportsIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment>{params.InputProps.startAdornment}</> }}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FieldLabel>Languages Known</FieldLabel>
        <Autocomplete multiple freeSolo
          options={['English', 'Hindi', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Gujarati', 'Punjabi']}
          value={formData.languagesKnown || []}
          onChange={(_, value) => setFormData(p => ({ ...p, languagesKnown: value }))}
          disabled={isFieldReadOnly('languagesKnown')}
          renderTags={(value, getTagProps) => value.map((option, index) => (
            <Chip size="small" label={option} {...getTagProps({ index })} key={index}
              sx={{ borderRadius: 1, fontSize: 12, bgcolor: '#F1F5F9', border: 'none' }} />
          ))}
          renderInput={(params) => (
            <TextField {...params} placeholder="Type and press enter" sx={fieldSx}
              InputProps={{ ...params.InputProps, startAdornment: <><InputAdornment position="start"><TranslateIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment>{params.InputProps.startAdornment}</> }}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FieldLabel>Core Skills</FieldLabel>
        <Autocomplete multiple freeSolo
          options={['Teaching', 'Communication', 'Online Tutoring', 'Lesson Planning', 'Subject Expertise', 'Mentoring']}
          value={formData.skills || []}
          onChange={(_, value) => setFormData(p => ({ ...p, skills: value }))}
          disabled={isFieldReadOnly('skills')}
          renderTags={(value, getTagProps) => value.map((option, index) => (
            <Chip size="small" label={option} {...getTagProps({ index })} key={index}
              sx={{ borderRadius: 1, fontSize: 12, bgcolor: '#F1F5F9', border: 'none' }} />
          ))}
          renderInput={(params) => (
            <TextField {...params} placeholder="Type and press enter" sx={fieldSx}
              InputProps={{ ...params.InputProps, startAdornment: <><InputAdornment position="start"><AutoAwesomeIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment>{params.InputProps.startAdornment}</> }}
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <FieldLabel>Bio</FieldLabel>
        <TextField fullWidth multiline rows={3}
          placeholder="Tell us about yourself, your teaching philosophy, and accomplishments…"
          value={formData.bio || ''}
          onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
          disabled={isFieldReadOnly('bio')} sx={fieldSx}
        />
      </Grid>
    </Grid>
  );

  const renderStep2 = () => (
    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
      <Grid item xs={12} sm={6}>
        <FieldLabel>Preferred Teaching Mode *</FieldLabel>
        <FormControl fullWidth sx={fieldSx} error={Boolean(errors.preferredMode)}>
          <Select value={formData.preferredMode}
            onChange={(e) => handleModeChange(e.target.value as TeachingMode)}
            disabled={isFieldReadOnly('preferredMode')} sx={{ borderRadius: 1.5, bgcolor: '#FAFAFA' }}
            startAdornment={<InputAdornment position="start"><SettingsRemoteIcon sx={{ fontSize: 18, color: '#94A3B8', ml: 0.5, mr: 1 }} /></InputAdornment>}
          >
            <MenuItem value={TeachingMode.OFFLINE}>Offline (Home Tuition)</MenuItem>
            <MenuItem value={TeachingMode.ONLINE}>Online (Video Classes)</MenuItem>
            <MenuItem value={TeachingMode.HYBRID}>Hybrid (Both)</MenuItem>
          </Select>
          {errors.preferredMode && <FormHelperText>{errors.preferredMode}</FormHelperText>}
        </FormControl>
      </Grid>

      {formData.preferredMode !== TeachingMode.ONLINE && (
        <Grid item xs={12} sm={6}>
          <FieldLabel>Current City *</FieldLabel>
          <FormControl fullWidth sx={fieldSx} error={Boolean(errors.city)} disabled={isFieldReadOnly('city')}>
            <Select value={formData.city} onChange={(e) => handleCityChange(e.target.value as string)}
              sx={{ borderRadius: 1.5, bgcolor: '#FAFAFA' }} displayEmpty
              renderValue={(v) => v || <span style={{ color: '#94A3B8' }}>Select city</span>}
              startAdornment={<InputAdornment position="start"><LocationCityIcon sx={{ fontSize: 18, color: '#94A3B8', ml: 0.5, mr: 1 }} /></InputAdornment>}
            >
              {cityOptions.map((opt) => <MenuItem key={opt.value} value={opt.label}>{opt.label}</MenuItem>)}
            </Select>
            {errors.city && <FormHelperText>{errors.city}</FormHelperText>}
          </FormControl>
        </Grid>
      )}

      {formData.preferredMode !== TeachingMode.ONLINE && (
        <Grid item xs={12}>
          <FieldLabel>Preferred Areas *</FieldLabel>
          <Autocomplete multiple
            options={areaOptions.length > 0 ? ['Select All', ...areaOptions.map(o => o.label)] : []}
            value={formData.preferredAreas}
            onChange={(_, value) => {
              const allLabels = areaOptions.map(o => o.label);
              if (value.includes('Select All')) {
                setFormData(p => ({
                  ...p, preferredAreas: p.preferredAreas.length === allLabels.length ? [] : allLabels,
                }));
              } else {
                setFormData(p => ({ ...p, preferredAreas: value }));
              }
            }}
            disabled={!formData.city || isFieldReadOnly('preferredAreas')}
            renderTags={(value, getTagProps) =>
              value.filter(v => v !== 'Select All').map((option, index) => (
                <Chip size="small" label={option} {...getTagProps({ index })} key={option}
                  sx={{ borderRadius: 1, fontSize: 12, bgcolor: alpha('#001F54', 0.08), color: '#001F54', border: 'none' }} />
              ))
            }
            renderInput={(params) => (
              <TextField {...params}
                placeholder={formData.city ? 'Select areas' : 'Select city first'}
                error={Boolean(errors.preferredAreas)} helperText={errors.preferredAreas} sx={fieldSx}
              />
            )}
          />
        </Grid>
      )}

      <Grid item xs={12}>
        <SectionDivider title="Address" />
      </Grid>

      <Grid item xs={12}>
        <FieldLabel>Permanent Address</FieldLabel>
        <TextField fullWidth multiline rows={2} placeholder="Enter your permanent address"
          value={formData.permanentAddress || ''}
          onChange={(e) => setFormData(p => ({ ...p, permanentAddress: e.target.value }))}
          disabled={isFieldReadOnly('permanentAddress')} sx={fieldSx}
        />
      </Grid>
      <Grid item xs={12}>
        <FieldLabel>Residential Address <Typography component="span" sx={{ fontSize: 11, color: '#94A3B8', textTransform: 'none', letterSpacing: 0 }}>(if different)</Typography></FieldLabel>
        <TextField fullWidth multiline rows={2} placeholder="Leave blank if same as permanent"
          value={formData.residentialAddress || ''}
          onChange={(e) => setFormData(p => ({ ...p, residentialAddress: e.target.value }))}
          disabled={isFieldReadOnly('residentialAddress')} sx={fieldSx}
        />
      </Grid>
    </Grid>
  );

  const renderStep3 = () => (
    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
      <Grid item xs={12}>
        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#001F54', 0.04), border: `1px solid ${alpha('#001F54', 0.1)}`, mb: 1 }}>
          <Typography sx={{ fontSize: 13, color: '#475569' }}>
            Choose a strong password with at least 6 characters, including letters and numbers.
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FieldLabel>Password *</FieldLabel>
        <TextField fullWidth type="password" placeholder="Min. 6 characters"
          value={formData.password}
          onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
          error={Boolean(errors.password)} helperText={errors.password} sx={fieldSx}
          InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment> }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FieldLabel>Confirm Password *</FieldLabel>
        <TextField fullWidth type="password" placeholder="Repeat password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
          error={Boolean(errors.confirmPassword)} helperText={errors.confirmPassword} sx={fieldSx}
          InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment> }}
        />
      </Grid>
    </Grid>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, ...(mode === 'create' ? [renderStep3] : [])];

  // ── Stepper ────────────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
      {/* Circle + line row */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {steps.map((label, idx) => {
          const done   = idx < currentStep;
          const active = idx === currentStep;
          return (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', flex: idx < steps.length - 1 ? 1 : 'none' }}>
              <Box sx={{
                width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: done ? '#22c55e' : active ? '#001F54' : '#E2E8F0',
                color: done || active ? 'white' : '#94A3B8',
                fontSize: { xs: 12, sm: 13 }, fontWeight: 700,
                transition: 'all 0.25s',
              }}>
                {done ? <CheckCircleIcon sx={{ fontSize: { xs: 14, sm: 16 } }} /> : idx + 1}
              </Box>
              {idx < steps.length - 1 && (
                <Box sx={{ flex: 1, height: 2, mx: 0.75, bgcolor: done ? '#22c55e' : '#E2E8F0', transition: 'background-color 0.25s' }} />
              )}
            </Box>
          );
        })}
      </Box>
      {/* Labels row — hidden on xs */}
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'flex-start', mt: 0.75 }}>
        {steps.map((label, idx) => {
          const done   = idx < currentStep;
          const active = idx === currentStep;
          return (
            <Box key={label} sx={{ display: 'flex', flex: idx < steps.length - 1 ? 1 : 'none', justifyContent: 'flex-start' }}>
              <Typography sx={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? '#001F54' : done ? '#22c55e' : '#94A3B8',
                letterSpacing: 0.3, textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
      {/* Mobile: just show "Step X of Y — Label" */}
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 1, mt: 1 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#001F54', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Step {currentStep + 1} of {steps.length}
        </Typography>
        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {steps[currentStep]}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <Paper
        elevation={0}
        component="form"
        onSubmit={handleSubmit}
        sx={{
          borderRadius: 3,
          border: '1px solid #E2E8F0',
          bgcolor: 'white',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Step header */}
        <Box sx={{ px: { xs: 2, sm: 3.5 }, pt: { xs: 2, sm: 3 }, pb: 0 }}>
          <StepIndicator />
          <Typography sx={{ fontSize: { xs: 15, sm: 17 }, fontWeight: 800, color: '#0F172A', mb: 0.25 }}>
            {['Personal Information', 'Professional Background', 'Location & Availability', 'Account Security'][currentStep]}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#94A3B8', mb: 2 }}>
            {[
              'Basic details about you',
              'Your qualifications and what you teach',
              'Where and how you want to teach',
              'Set a secure password for your account',
            ][currentStep]}
          </Typography>
        </Box>

        {/* Step body */}
        <Box sx={{ px: { xs: 2, sm: 3.5 }, pb: { xs: 2.5, sm: 3.5 } }}>
          {stepContent[currentStep]?.()}

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2.5, pt: 2, borderTop: '1px solid #F1F5F9' }}>
            <Button
              onClick={handleBack}
              disabled={currentStep === 0}
              startIcon={<ArrowBackIcon />}
              sx={{
                textTransform: 'none', fontWeight: 600, color: '#64748B', borderRadius: 1.5,
                visibility: currentStep === 0 ? 'hidden' : 'visible',
                '&:hover': { bgcolor: '#F8FAFC' },
              }}
            >
              Back
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} endIcon={<ArrowForwardIcon />} sx={primaryBtn}>
                Continue
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} endIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined} sx={primaryBtn}>
                {isLoading
                  ? (mode === 'edit' ? 'Updating…' : 'Creating profile…')
                  : (mode === 'edit' ? 'Update Profile' : 'Complete Registration')}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* OTP Dialog */}
      <Dialog open={otpDialogOpen} onClose={() => setOtpDialogOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Verify Your Email</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            We sent a 6-digit code to <strong>{formData.email}</strong>
          </Typography>
          <TextField fullWidth value={otpValue}
            onChange={(e) => { setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
            inputProps={{ maxLength: 6, style: { letterSpacing: 10, fontSize: 24, textAlign: 'center', fontWeight: 700 } }}
            error={Boolean(otpError)} helperText={otpError} placeholder="••••••" autoFocus
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
          <Button size="small" onClick={handleSendOtp} disabled={otpSending}
            sx={{ mt: 1.5, textTransform: 'none', color: '#64748B', fontWeight: 600 }}>
            {otpSending ? 'Sending…' : 'Resend OTP'}
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOtpDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748B', borderRadius: 1.5 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleVerifyOtp}
            disabled={otpVerifying || otpValue.length !== 6}
            startIcon={otpVerifying ? <CircularProgress size={15} color="inherit" /> : undefined}
            sx={{ ...primaryBtn, px: 3, py: 1 }}>
            {otpVerifying ? 'Verifying…' : 'Confirm OTP'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
