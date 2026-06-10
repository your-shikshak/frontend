import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Autocomplete,
  Chip,
  alpha,
  useTheme,
  InputAdornment,
  Checkbox,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import { registrationOtpAPI } from '@/api/client';
import { toast } from 'sonner';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import SchoolIcon from '@mui/icons-material/School';
import LockIcon from '@mui/icons-material/Lock';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import SportsIcon from '@mui/icons-material/Sports';
import TranslateIcon from '@mui/icons-material/Translate';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { TutorLeadFormData, TutorLeadFormProps } from '@/types/tutorLead';
import { Gender, TeachingMode } from '../../types/enums';
import { validateEmail, validatePhone } from '@/utils/leadValidation';
import { useOptions } from '@/hooks/useOptions';
import { motion } from 'framer-motion';
import { CurriculumTreeSelector } from './CurriculumTreeSelector';

export const TutorLeadForm = ({ onSubmit, isLoading, initialData, mode = 'create' }: TutorLeadFormProps) => {
  // Helper function to check if a field should be read-only
  // Only lock fields that have actual meaningful data in initialData
  const isFieldReadOnly = (fieldName: string) => {
    if (mode === 'create') return false;
    if (initialData?.verificationStatus !== 'VERIFIED') return false;

    const allowedFields = [
      'city',
      'preferredAreas',
      'preferredMode',
      'subjects',
      'bio',
      'languagesKnown',
      'skills',
      'alternatePhone'
    ];
    return !allowedFields.includes(fieldName);
  };
  const theme = useTheme();
  const [formData, setFormData] = useState<TutorLeadFormData>(initialData || {
    fullName: '',
    gender: Gender.MALE,
    phoneNumber: '',
    email: '',
    qualification: '',
    experience: '',
    subjects: [],
    extracurricularActivities: [],
    password: '',
    confirmPassword: '',
    city: '',
    preferredAreas: [],
    preferredMode: TeachingMode.OFFLINE,
    permanentAddress: '',
    residentialAddress: '',
    alternatePhone: '',
    bio: '',
    languagesKnown: [],
    skills: [],
  });

  useEffect(() => {
    if (!initialData) return;

    setFormData((prev) => ({
      ...prev,
      ...initialData,
      password: '',
      confirmPassword: '',
    }));
  }, [initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Email OTP
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  const handleSendOtp = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors((prev) => ({ ...prev, email: 'Enter a valid email first' }));
      return;
    }
    setOtpSending(true);
    setOtpError('');
    try {
      await registrationOtpAPI.send(formData.email);
      setOtpValue('');
      setOtpDialogOpen(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) { setOtpError('Enter the 6-digit OTP'); return; }
    setOtpVerifying(true);
    setOtpError('');
    try {
      await registrationOtpAPI.verify(formData.email, otpValue);
      setEmailVerified(true);
      setOtpDialogOpen(false);
      toast.success('Email verified!');
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubjectsChange = (newSubjectIds: string[]) => {
    setFormData(prev => ({ ...prev, subjects: newSubjectIds }));
  };

  const { options: extracurricularOptions } = useOptions('EXTRACURRICULAR_ACTIVITY');
  const extracurricularLabels = useMemo(
    () => extracurricularOptions.map((o) => o.label),
    [extracurricularOptions]
  );

  const { options: cityOptions } = useOptions('CITY');
  const areaType = formData.city
    ? `AREA_${formData.city.toUpperCase().replace(/\s+/g, '_')}`
    : '';
  const { options: areaOptions } = useOptions(areaType);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    } else if (mode === 'create' && !emailVerified) {
      newErrors.email = 'Please verify your email before submitting';
    }

    if (!formData.qualification.trim()) newErrors.qualification = 'Qualification is required';
    if (!formData.experience.trim()) newErrors.experience = 'Experience is required';
    if (formData.subjects.length === 0) newErrors.subjects = 'Please select at least one subject';
    // Extracurricular activities are now optional for better UX

    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be 6+ characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (formData.preferredMode === TeachingMode.OFFLINE || formData.preferredMode === TeachingMode.HYBRID) {
      if (!formData.city) newErrors.city = 'Please select a city';
      if (formData.preferredAreas.length === 0) newErrors.preferredAreas = 'Select at least one area';
    }
    if (!formData.preferredMode) newErrors.preferredMode = 'Preferred mode is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) await onSubmit(formData);
  };

  const handleCityChange = (city: string) => {
    setFormData((prev) => ({ ...prev, city, preferredAreas: [] }));
  };

  const handlePreferredModeChange = (preferredMode: TeachingMode) => {
    setFormData((prev) => ({
      ...prev,
      preferredMode,
      ...(preferredMode === TeachingMode.ONLINE ? { city: '', preferredAreas: [] } : null),
    }));
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        mb: 3,
        mt: title === 'Personal Information' ? 0 : 4,
        pb: 1,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      <Box
        sx={{
          display: 'flex',
          p: 1,
          borderRadius: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main'
        }}
      >
        <Icon fontSize="small" />
      </Box>
      <Typography variant="h6" fontWeight={700} color="text.primary">
        {title}
      </Typography>
    </Box>
  );

  return (
    <>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'visible',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          p: { xs: 1, md: 2 }
        }}
      >
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <SectionHeader icon={PersonIcon} title="Personal Information" />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  error={Boolean(errors.fullName)}
                  helperText={errors.fullName || (isFieldReadOnly('fullName') ? 'Cannot be changed' : '')}
                  disabled={isFieldReadOnly('fullName')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                    readOnly: isFieldReadOnly('fullName'),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(errors.gender)}>
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select
                    labelId="gender-label"
                    label="Gender"
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                    disabled={isFieldReadOnly('gender')}
                  >
                    <MenuItem value={Gender.MALE}>Male</MenuItem>
                    <MenuItem value={Gender.FEMALE}>Female</MenuItem>
                    <MenuItem value={Gender.OTHER}>Other</MenuItem>
                  </Select>
                  {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                  {isFieldReadOnly('gender') && !errors.gender && <FormHelperText>Cannot be changed</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  placeholder="9876543210"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '') }))}
                  inputProps={{ maxLength: 10 }}
                  error={Boolean(errors.phoneNumber)}
                  helperText={errors.phoneNumber || (isFieldReadOnly('phoneNumber') ? 'Cannot be changed' : '')}
                  disabled={isFieldReadOnly('phoneNumber')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                    readOnly: isFieldReadOnly('phoneNumber'),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Alternate Phone Number"
                  placeholder="9876543211"
                  value={formData.alternatePhone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, alternatePhone: e.target.value.replace(/\D/g, '') }))}
                  inputProps={{ maxLength: 10 }}
                  helperText={isFieldReadOnly('alternatePhone') ? "Cannot be changed" : 'Optional secondary contact'}
                  disabled={isFieldReadOnly('alternatePhone')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                    readOnly: isFieldReadOnly('alternatePhone'),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => { setFormData(prev => ({ ...prev, email: e.target.value })); setEmailVerified(false); }}
                  error={Boolean(errors.email)}
                  helperText={errors.email || (isFieldReadOnly('email') ? 'Cannot be changed' : '')}
                  disabled={isFieldReadOnly('email')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: emailVerified && mode === 'create' ? (
                      <InputAdornment position="end">
                        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      </InputAdornment>
                    ) : undefined,
                    readOnly: isFieldReadOnly('email'),
                  }}
                />
                {mode === 'create' && !isFieldReadOnly('email') && (
                  emailVerified ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <VerifiedIcon sx={{ color: 'success.main', fontSize: 16 }} />
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                        Email Verified
                      </Typography>
                    </Box>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleSendOtp}
                      disabled={otpSending}
                      startIcon={otpSending ? <CircularProgress size={14} /> : undefined}
                      sx={{ mt: 0.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      {otpSending ? 'Sending…' : 'Verify Email'}
                    </Button>
                  )
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tutor Bio"
                  placeholder="Tell us about yourself, your teaching philosophy, and accomplishments..."
                  value={formData.bio || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  multiline
                  rows={3}
                  disabled={isFieldReadOnly('bio')}
                  helperText={isFieldReadOnly('bio') ? "This field cannot be edited after verification" : 'A brief description that will be shown on your profile.'}
                  InputProps={{
                    readOnly: isFieldReadOnly('bio'),
                  }}
                />
              </Grid>
            </Grid>

            <SectionHeader icon={SchoolIcon} title="Education & Expertise" />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Highest Qualification"
                  placeholder="e.g., M.Sc Mathematics, B.Tech"
                  value={formData.qualification}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                  error={Boolean(errors.qualification)}
                  helperText={errors.qualification || (isFieldReadOnly('qualification') ? 'Cannot be changed' : '')}
                  disabled={isFieldReadOnly('qualification')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SchoolIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                    readOnly: isFieldReadOnly('qualification'),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(errors.experience)}>
                  <InputLabel id="experience-label">Teaching Experience</InputLabel>
                  <Select
                    labelId="experience-label"
                    label="Teaching Experience"
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    disabled={isFieldReadOnly('experience')}
                    startAdornment={
                      <InputAdornment position="start">
                        <WorkIcon color="action" fontSize="small" sx={{ ml: 0.5, mr: 1 }} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="Fresher">Fresher (less than 1 year)</MenuItem>
                    <MenuItem value="1-2 Years">1-2 Years</MenuItem>
                    <MenuItem value="3-5 Years">3-5 Years</MenuItem>
                    <MenuItem value="5-10 Years">5-10 Years</MenuItem>
                    <MenuItem value="10+ Years">10+ Years</MenuItem>
                  </Select>
                  {errors.experience && <FormHelperText>{errors.experience}</FormHelperText>}
                  {isFieldReadOnly('experience') && !errors.experience && <FormHelperText>Cannot be changed</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}` }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={700} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LibraryBooksIcon fontSize="inherit" /> Select Your Subjects
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Explore the curriculum hierarchy to find and select the subjects you teach.
                  </Typography>

                  <CurriculumTreeSelector
                    selectedSubjectIds={formData.subjects.map((s: any) => (typeof s === 'string' ? s : s?._id)).filter(Boolean)}
                    onChange={handleSubjectsChange}
                    error={errors.subjects}
                    disabled={isFieldReadOnly('subjects')}
                  />

                  {isFieldReadOnly('subjects') && <FormHelperText sx={{ mt: 1 }}>Subject selection is locked for verified tutors.</FormHelperText>}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={extracurricularLabels.length > 0 ? ['Select All', ...extracurricularLabels] : []}
                  value={formData.extracurricularActivities}
                  onChange={(_, value) => {
                    if (value.includes('Select All')) {
                      if (formData.extracurricularActivities.length === extracurricularLabels.length) {
                        setFormData((prev) => ({ ...prev, extracurricularActivities: [] }));
                      } else {
                        setFormData((prev) => ({ ...prev, extracurricularActivities: extracurricularLabels }));
                      }
                    } else {
                      setFormData((prev) => ({ ...prev, extracurricularActivities: value.filter((v) => v !== 'Select All') }));
                    }
                  }}
                  disabled={isFieldReadOnly('extracurricularActivities')}
                  renderTags={(value, getTagProps) =>
                    value.filter(v => v !== 'Select All').map((option, index) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} color="secondary" sx={{ borderRadius: 1.5 }} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Extracurricular Activities (Optional)"
                      placeholder="Select activities"
                      helperText={isFieldReadOnly('extracurricularActivities') ? 'Cannot be changed' : 'Select all activities you can teach or assist with'}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SportsIcon color="action" fontSize="small" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={['English', 'Hindi', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Gujarati', 'Punjabi']}
                  value={formData.languagesKnown || []}
                  onChange={(_, value) => setFormData(prev => ({ ...prev, languagesKnown: value }))}
                  disabled={isFieldReadOnly('languagesKnown')}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} key={index} size="small" />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Languages Known"
                      placeholder="Type and press enter"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <TranslateIcon color="action" fontSize="small" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={['Teaching', 'Communication', 'Online Tutoring', 'Lesson Planning', 'Subject Expertise', 'Mentoring']}
                  value={formData.skills || []}
                  onChange={(_, value) => setFormData(prev => ({ ...prev, skills: value }))}
                  disabled={isFieldReadOnly('skills')}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} key={index} size="small" />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Core Skills"
                      placeholder="Type and press enter"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <AutoAwesomeIcon color="action" fontSize="small" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <SectionHeader icon={LocationCityIcon} title="Location Details" />
            <Grid container spacing={3}>
              {/* Preferred Mode - Always visible, comes first */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(errors.preferredMode)}>
                  <InputLabel id="mode-label">Preferred Mode</InputLabel>
                  <Select
                    labelId="mode-label"
                    label="Preferred Mode"
                    value={formData.preferredMode}
                    onChange={(e) => handlePreferredModeChange(e.target.value as TeachingMode)}
                    disabled={isFieldReadOnly('preferredMode')}
                    startAdornment={
                      <InputAdornment position="start">
                        <SettingsRemoteIcon color="action" fontSize="small" sx={{ ml: 0.5, mr: 1 }} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value={TeachingMode.OFFLINE}>Offline (Home Tuition)</MenuItem>
                    <MenuItem value={TeachingMode.ONLINE}>Online (Video Classes)</MenuItem>
                    <MenuItem value={TeachingMode.HYBRID}>Hybrid (Both)</MenuItem>
                  </Select>
                  {errors.preferredMode && <FormHelperText>{errors.preferredMode}</FormHelperText>}
                  {isFieldReadOnly('preferredMode') && !errors.preferredMode && <FormHelperText>Cannot be changed</FormHelperText>}
                </FormControl>
              </Grid>

              {/* City - Only show for OFFLINE or HYBRID */}
              {(formData.preferredMode === TeachingMode.OFFLINE || formData.preferredMode === TeachingMode.HYBRID) && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={Boolean(errors.city)} disabled={isFieldReadOnly('city')}>
                    <InputLabel id="city-label">Current City</InputLabel>
                    <Select
                      labelId="city-label"
                      label="Current City"
                      value={formData.city}
                      onChange={(e) => handleCityChange(e.target.value as string)}
                      startAdornment={
                        <InputAdornment position="start">
                          <LocationCityIcon color="action" fontSize="small" sx={{ ml: 0.5, mr: 1 }} />
                        </InputAdornment>
                      }
                    >
                      {cityOptions.map((opt) => <MenuItem key={opt.value} value={opt.label}>{opt.label}</MenuItem>)}
                    </Select>
                    {errors.city && <FormHelperText>{errors.city}</FormHelperText>}
                    {isFieldReadOnly('city') && !errors.city && <FormHelperText>Cannot be changed</FormHelperText>}
                  </FormControl>
                </Grid>
              )}

              {/* Preferred Areas - Only show for OFFLINE or HYBRID */}
              {(formData.preferredMode === TeachingMode.OFFLINE || formData.preferredMode === TeachingMode.HYBRID) && (
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={areaOptions.length > 0 ? ['Select All', ...areaOptions.map((o) => o.label)] : []}
                    value={formData.preferredAreas}
                    onChange={(_, value) => {
                      const allLabels = areaOptions.map((o) => o.label);
                      if (value.includes('Select All')) {
                        if (formData.preferredAreas.length === allLabels.length) {
                          setFormData((prev) => ({ ...prev, preferredAreas: [] }));
                        } else {
                          setFormData((prev) => ({ ...prev, preferredAreas: allLabels }));
                        }
                      } else {
                        setFormData((prev) => ({ ...prev, preferredAreas: value }));
                      }
                    }}
                    disabled={!formData.city || isFieldReadOnly('preferredAreas')}
                    renderTags={(value, getTagProps) =>
                      value.filter(v => v !== 'Select All').map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} color="primary" sx={{ borderRadius: 1.5 }} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Preferred Areas"
                        placeholder={formData.city ? 'Select areas' : 'Select city first'}
                        error={Boolean(errors.preferredAreas)}
                        helperText={errors.preferredAreas || (isFieldReadOnly('preferredAreas') ? 'Cannot be changed' : 'Select areas where you prefer to teach')}
                      />
                    )}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Permanent Address"
                  placeholder="Enter your permanent address"
                  value={formData.permanentAddress || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, permanentAddress: e.target.value }))}
                  disabled={isFieldReadOnly('permanentAddress')}
                  multiline
                  rows={2}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationCityIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                    readOnly: isFieldReadOnly('permanentAddress'),
                  }}
                  helperText={isFieldReadOnly('permanentAddress') ? 'Cannot be changed' : ''}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Residential Address (if different)"
                  placeholder="Enter your current residential address"
                  value={formData.residentialAddress || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, residentialAddress: e.target.value }))}
                  disabled={isFieldReadOnly('residentialAddress')}
                  multiline
                  rows={2}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationCityIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                    readOnly: isFieldReadOnly('residentialAddress'),
                  }}
                  helperText={isFieldReadOnly('residentialAddress') ? 'Cannot be changed' : 'Leave blank if same as permanent address'}
                />
              </Grid>
            </Grid>

            {mode === 'create' && (
              <>
                <SectionHeader icon={LockIcon} title="Account Security" />
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Choose Password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      error={Boolean(errors.password)}
                      helperText={errors.password}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      error={Boolean(errors.confirmPassword)}
                      helperText={errors.confirmPassword}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </>
            )}

            <Box pt={5}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={isLoading}
                sx={{
                  py: 1.8,
                  borderRadius: 2,
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.5)}`,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {isLoading
                  ? (mode === 'edit' ? 'Updating Profile...' : 'Creating Your Profile...')
                  : (mode === 'edit' ? 'Update Profile' : 'Complete Teacher Registration')}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>

      {/* OTP Verification Dialog */}
      <Dialog open={otpDialogOpen} onClose={() => setOtpDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Verify Your Email</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We sent a 6-digit code to <strong>{formData.email}</strong>
          </Typography>
          <TextField
            fullWidth
            label="6-digit OTP"
            value={otpValue}
            onChange={(e) => { setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
            inputProps={{ maxLength: 6, style: { letterSpacing: 8, fontSize: 22, textAlign: 'center' } }}
            error={Boolean(otpError)}
            helperText={otpError}
            autoFocus
          />
          <Button
            size="small"
            variant="text"
            onClick={handleSendOtp}
            disabled={otpSending}
            sx={{ mt: 1, textTransform: 'none', color: 'text.secondary' }}
          >
            {otpSending ? 'Sending…' : 'Resend OTP'}
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOtpDialogOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleVerifyOtp}
            disabled={otpVerifying || otpValue.length !== 6}
            startIcon={otpVerifying ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {otpVerifying ? 'Verifying…' : 'Confirm OTP'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};


