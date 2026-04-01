import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  Autocomplete,
  Checkbox,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, setProfileComplete } from '../../store/slices/authSlice';
import managerService from '../../services/managerService';
import coordinatorService from '../../services/coordinatorService';
import { toast } from 'sonner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { USER_ROLES } from '../../constants';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

interface ProfileCompletionModalProps {
  open: boolean;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ open }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Form state
  const [bio, setBio] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [languagesKnown, setLanguagesKnown] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  const isManager = user?.role === USER_ROLES.MANAGER;
  const service = isManager ? managerService : coordinatorService;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!open || !user) return;
      try {
        const res = await service.getMyProfile();
        if (res.success && res.data) {
          setProfileId(res.data.id);
          setBio(res.data.bio || '');
          setPermanentAddress(res.data.permanentAddress || '');
          setResidentialAddress(res.data.residentialAddress || '');
          setLanguagesKnown(res.data.languagesKnown || []);
          setSkills(res.data.skills || []);
        }
      } catch (err) {
        console.error('Failed to fetch profile for completion', err);
      }
    };
    fetchProfile();
  }, [open, user, service]);

  const handleSubmit = async () => {
    if (!profileId) return;

    if (bio.length < 20) {
      toast.error('Please provide a bio of at least 20 characters.');
      return;
    }

    if (!residentialAddress) {
      toast.error('Residential address is required.');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        bio,
        permanentAddress,
        residentialAddress,
        languagesKnown,
        skills,
      };

      let res;
      if (isManager) {
        res = await managerService.updateManagerProfile(profileId, updateData);
      } else {
        res = await coordinatorService.updateCoordinator(profileId, updateData);
      }

      if (res.success) {
        dispatch(setProfileComplete());
        toast.success('Profile completed successfully! Welcome aboard.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      maxWidth="md" 
      fullWidth 
      disableEscapeKeyDown
      PaperProps={{
        sx: { borderRadius: 2, p: 1 }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" fontWeight={700} component="div">Complete Your Professional Profile</Typography>
        <Typography variant="body2" color="text.secondary">
          Help us know you better. These details are required for identification and role-matching.
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              label="Professional Bio"
              multiline
              rows={4}
              fullWidth
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your professional experience, expertise, and goals..."
              helperText={`${bio.length}/20 characters minimum`}
              error={bio.length > 0 && bio.length < 20}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Residential Address"
              fullWidth
              value={residentialAddress}
              onChange={(e) => setResidentialAddress(e.target.value)}
              placeholder="Current city and area"
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Permanent Address"
              fullWidth
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
              placeholder="As per records"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Autocomplete
              multiple
              options={['Select All', 'English', 'Hindi', 'Marathi', 'Gujarati', 'Bengali', 'Tamil', 'Telugu', 'Kannada']}
              freeSolo
              value={languagesKnown}
              onChange={(_, newValue) => {
                const allLanguages = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Bengali', 'Tamil', 'Telugu', 'Kannada'];
                if (newValue.includes('Select All')) {
                  if (languagesKnown.length === allLanguages.length) {
                    setLanguagesKnown([]);
                  } else {
                    setLanguagesKnown(allLanguages);
                  }
                } else {
                  setLanguagesKnown(newValue);
                }
              }}
              renderOption={(props, option, { selected }) => {
                const isSelectAll = option === 'Select All';
                const allLanguages = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Bengali', 'Tamil', 'Telugu', 'Kannada'];
                const allSelected = languagesKnown.length === allLanguages.length && allLanguages.length > 0;
                const { key, ...otherProps } = props;
                return (
                  <li key={key} {...otherProps}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={isSelectAll ? allSelected : selected}
                    />
                    {option}
                  </li>
                );
              }}
              renderTags={(value, getTagProps) =>
                value.filter(v => v !== 'Select All').map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return <Chip key={key} variant="outlined" label={option} {...tagProps} />;
                })
              }
              renderInput={(params) => <TextField {...params} label="Languages Known" placeholder="Add languages" />}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Autocomplete
              multiple
              options={['Select All', 'Team Management', 'Operations', 'Sales', 'CRM', 'Communication', 'Problem Solving']}
              freeSolo
              value={skills}
              onChange={(_, newValue) => {
                const allSkills = ['Team Management', 'Operations', 'Sales', 'CRM', 'Communication', 'Problem Solving'];
                if (newValue.includes('Select All')) {
                  if (skills.length === allSkills.length) {
                    setSkills([]);
                  } else {
                    setSkills(allSkills);
                  }
                } else {
                  setSkills(newValue);
                }
              }}
              renderOption={(props, option, { selected }) => {
                const isSelectAll = option === 'Select All';
                const allSkills = ['Team Management', 'Operations', 'Sales', 'CRM', 'Communication', 'Problem Solving'];
                const allSelected = skills.length === allSkills.length && allSkills.length > 0;
                const { key, ...otherProps } = props;
                return (
                  <li key={key} {...otherProps}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={isSelectAll ? allSelected : selected}
                    />
                    {option}
                  </li>
                );
              }}
              renderTags={(value, getTagProps) =>
                value.filter(v => v !== 'Select All').map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return <Chip key={key} variant="outlined" label={option} {...tagProps} />;
                })
              }
              renderInput={(params) => <TextField {...params} label="Professional Skills" placeholder="Add skills" />}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>Identity Verification</Typography>
            <Typography variant="body2" color="text.secondary">
              Aadhaar and identity documents are collected during the verification step and reviewed by our team. You can complete your professional profile now — upload/verify documents in the verification flow.
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          * All fields marked with address are mandatory.
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={loading || bio.length < 20 || !residentialAddress}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          sx={{ borderRadius: 2, px: 4 }}
        >
          {loading ? 'Saving...' : 'Complete Profile'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileCompletionModal;
