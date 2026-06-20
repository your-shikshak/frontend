import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CategoryIcon from '@mui/icons-material/Category';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { OptionItem, getOptionTypes, getOptions, createOrUpdateOption } from '@/services/optionsService';
import { useOptions } from '@/hooks/useOptions';
import SnackbarNotification from '@/components/common/SnackbarNotification';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SaveIcon from '@mui/icons-material/Save';
import { TextField as MuiTextField, CircularProgress as MuiCircularProgress } from '@mui/material';

// ─── Design tokens ────────────────────────────────────────────────────────────
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const T = `all 150ms ${EASE}`;

const TUTORIAL_TYPE = 'TEACHER_TUTORIAL';
const FAQ_TYPE = 'FAQ';

const extractYouTubeId = (url: string): string | null => {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
};

const OPTION_TYPES = [
  { value: 'CURRICULUM', label: 'Curriculum' },
  { value: 'CITY', label: 'Cities' },
  { value: 'EXTRACURRICULAR_ACTIVITY', label: 'Extracurricular' },
];

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// ─── OptionColumn ─────────────────────────────────────────────────────────────
interface OptionColumnProps {
  title: string;
  type: string;
  parentId?: string;
  selectedId?: string;
  onSelect: (item: OptionItem) => void;
  disabled?: boolean;
  onSaveError: (msg: string) => void;
  onSaveSuccess: (msg: string) => void;
}

const OptionColumn: React.FC<OptionColumnProps> = ({
  title, type, parentId, selectedId, onSelect, disabled, onSaveError, onSaveSuccess
}) => {
  const { options: fetchedOptions, loading: fetchedLoading, refetch } = useOptions(type, parentId);
  const options = disabled ? [] : fetchedOptions;
  const loading = disabled ? false : fetchedLoading;

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [extraValue, setExtraValue] = useState('');
  const [cityCodeValue, setCityCodeValue] = useState('');
  const [sortOrderValue, setSortOrderValue] = useState<number | string>('');
  const [saving, setSaving] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletionStep, setDeletionStep] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  useEffect(() => {
    if (disabled) { setIsAdding(false); setEditingId(null); }
  }, [disabled]);

  const resetForm = () => {
    setIsAdding(false); setEditingId(null);
    setInputValue(''); setExtraValue(''); setCityCodeValue(''); setSortOrderValue('');
  };

  const handleSave = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (editingId && !confirmSaveOpen) { setConfirmSaveOpen(true); return; }
    try {
      setSaving(true);
      const svc = await import('@/services/optionsService');
      const payload: any = {
        type,
        label: trimmed,
        value: trimmed.toUpperCase().replace(/\s+/g, '_'),
        sortOrder: sortOrderValue === '' ? 0 : Number(sortOrderValue),
        parent: parentId,
        metadata: type === 'CITY'
          ? { whatsappLink: extraValue.trim(), cityCode: cityCodeValue.trim().toUpperCase() }
          : {}
      };
      await svc.createOrUpdateOption(editingId || undefined, payload);
      onSaveSuccess(editingId ? 'Updated' : 'Created');
      resetForm();
      setConfirmSaveOpen(false);
      refetch();
    } catch (err: any) {
      onSaveError(err?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleStartEdit = (e: React.MouseEvent, item: OptionItem) => {
    e.stopPropagation();
    setEditingId(item._id);
    setInputValue(item.label);
    setExtraValue(item.metadata?.whatsappLink || '');
    setCityCodeValue(item.metadata?.cityCode || '');
    setSortOrderValue(item.sortOrder ?? 0);
    setIsAdding(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id); setDeletionStep(1); setConfirmDeleteOpen(true);
  };

  const performDeleteAction = async () => {
    if (deletionStep < 3) { setDeletionStep((p) => p + 1); return; }
    if (!deletingId) return;
    try {
      setDeletingLoading(true);
      const svc = await import('@/services/optionsService');
      await svc.deleteOption(deletingId);
      onSaveSuccess('Deleted');
      setConfirmDeleteOpen(false); setDeletingId(null); setDeletionStep(1);
      refetch();
    } catch (err: any) {
      onSaveError(err?.message || 'Failed to delete');
    } finally { setDeletingLoading(false); }
  };

  const isFormOpen = isAdding || !!editingId;

  return (
    <Paper
      elevation={0}
      sx={{
        height: '62vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: disabled ? '#F1F5F9' : '#E2E8F0',
        borderRadius: '12px',
        overflow: 'hidden',
        bgcolor: disabled ? '#FAFAFA' : '#fff',
        opacity: disabled ? 0.55 : 1,
        transition: T,
      }}
    >
      {/* Column header */}
      <Box
        sx={{
          px: 2, py: 1.5,
          borderBottom: '1px solid #F1F5F9',
          bgcolor: '#F8FAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: '#64748B', textTransform: 'uppercase' }}>
          {title}
        </Typography>
        <IconButton
          size="small"
          disabled={disabled || isFormOpen}
          onClick={() => { setIsAdding(true); setInputValue(''); setExtraValue(''); setCityCodeValue(''); setSortOrderValue(''); }}
          sx={{
            width: 26, height: 26, borderRadius: '7px',
            color: disabled || isFormOpen ? 'text.disabled' : 'primary.main',
            transition: T,
            '@media (hover: hover) and (pointer: fine)': {
              '&:hover:not(:disabled)': { bgcolor: '#EFF6FF' },
            },
            '&:active': { transform: 'scale(0.9)' },
          }}
        >
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Inline form */}
      {isFormOpen && (
        <Box sx={{ px: 2, py: 1.75, borderBottom: '1px solid #F1F5F9', bgcolor: '#F8FAFC', flexShrink: 0 }}>
          <Stack spacing={1.25}>
            <TextField
              autoFocus
              size="small"
              placeholder="Name"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') resetForm(); }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px', fontSize: 13, bgcolor: '#fff',
                  '& fieldset': { borderColor: '#E2E8F0' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1.5 },
                },
              }}
            />
            <TextField
              size="small" type="number" placeholder="Sort order (optional)"
              value={sortOrderValue}
              onChange={(e) => setSortOrderValue(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px', fontSize: 13, bgcolor: '#fff',
                  '& fieldset': { borderColor: '#E2E8F0' },
                },
              }}
            />
            {type.toUpperCase() === 'CITY' && (
              <>
                <TextField
                  size="small" placeholder="WhatsApp group link"
                  value={extraValue}
                  onChange={(e) => setExtraValue(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 13, bgcolor: '#fff', '& fieldset': { borderColor: '#E2E8F0' } } }}
                />
                <TextField
                  size="small" placeholder="City code (e.g. BPL)"
                  value={cityCodeValue}
                  onChange={(e) => setCityCodeValue(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 13, bgcolor: '#fff', '& fieldset': { borderColor: '#E2E8F0' } } }}
                />
              </>
            )}
            <Box display="flex" justifyContent="flex-end" gap={0.75}>
              <Button
                size="small" onClick={resetForm}
                sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', borderRadius: '7px', px: 1.5, transition: T }}
              >
                Cancel
              </Button>
              <Button
                size="small" variant="contained"
                disabled={saving || !inputValue.trim()}
                onClick={handleSave}
                sx={{ fontSize: 12, fontWeight: 700, borderRadius: '7px', px: 1.75, boxShadow: 'none', transition: T, '&:active': { transform: 'scale(0.97)' } }}
              >
                {saving ? <CircularProgress size={12} color="inherit" /> : (editingId ? 'Update' : 'Add')}
              </Button>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Item list */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" pt={4}>
            <CircularProgress size={20} thickness={4} />
          </Box>
        ) : options.length === 0 ? (
          <Box px={2} py={3} textAlign="center">
            <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
              {disabled ? 'Select parent first' : 'No items yet'}
            </Typography>
          </Box>
        ) : (
          options.map((opt) => {
            const isSelected = selectedId === opt._id;
            return (
              <Box
                key={opt._id}
                onClick={() => !disabled && onSelect(opt)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2, py: 1.1,
                  cursor: disabled ? 'default' : 'pointer',
                  borderBottom: '1px solid #F8FAFC',
                  bgcolor: isSelected ? '#EFF6FF' : 'transparent',
                  transition: T,
                  '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': { bgcolor: isSelected ? '#DBEAFE' : '#F8FAFC' },
                  },
                }}
              >
                {/* Item content */}
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'primary.main' : 'text.primary',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {opt.label}
                    </Typography>
                    {opt.sortOrder !== undefined && opt.sortOrder !== 0 && (
                      <Box component="span" sx={{ fontSize: 10, fontWeight: 600, px: 0.75, py: 0.2, borderRadius: '4px', bgcolor: '#F1F5F9', color: '#64748B', flexShrink: 0 }}>
                        #{opt.sortOrder}
                      </Box>
                    )}
                  </Box>
                  {type.toUpperCase() === 'CITY' && (opt.metadata?.cityCode || opt.metadata?.whatsappLink) && (
                    <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.metadata?.cityCode && `${opt.metadata.cityCode}`}
                      {opt.metadata?.cityCode && opt.metadata?.whatsappLink && ' · '}
                      {opt.metadata?.whatsappLink && 'WhatsApp linked'}
                    </Typography>
                  )}
                </Box>

                {/* Actions */}
                <Box display="flex" alignItems="center" gap={0.25} flexShrink={0} ml={0.5}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleStartEdit(e, opt)}
                    sx={{
                      width: 24, height: 24, borderRadius: '6px', color: 'text.disabled', transition: T,
                      '@media (hover: hover) and (pointer: fine)': { '&:hover': { color: 'primary.main', bgcolor: '#EFF6FF' } },
                      '&:active': { transform: 'scale(0.9)' },
                    }}
                  >
                    <EditIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => handleDelete(e, opt._id)}
                    sx={{
                      width: 24, height: 24, borderRadius: '6px', color: 'text.disabled', transition: T,
                      '@media (hover: hover) and (pointer: fine)': { '&:hover': { color: '#DC2626', bgcolor: '#FEF2F2' } },
                      '&:active': { transform: 'scale(0.9)' },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                  {isSelected && (
                    <ChevronRightIcon sx={{ fontSize: 14, color: 'primary.main', ml: 0.25 }} />
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => { setConfirmDeleteOpen(false); setDeletionStep(1); }}
        onConfirm={performDeleteAction}
        title={deletionStep === 1 ? 'Confirm Delete' : deletionStep === 2 ? 'Second Confirmation' : 'FINAL CONFIRMATION'}
        message={
          deletionStep === 1
            ? `Delete this ${title.toLowerCase()}?`
            : deletionStep === 2
            ? 'Warning: this will also remove all child items. Continue?'
            : 'FINAL WARNING: This data cannot be recovered. Confirm to proceed.'
        }
        severity={deletionStep === 3 ? 'error' : 'warning'}
        loading={deletingLoading}
        confirmText={deletionStep === 3 ? 'DELETE FOREVER' : `Confirm (${deletionStep}/3)`}
      />

      <ConfirmDialog
        open={confirmSaveOpen}
        onClose={() => setConfirmSaveOpen(false)}
        onConfirm={handleSave}
        title="Confirm Update"
        message="Updating this item may affect existing class records."
        severity="warning"
        loading={saving}
      />
    </Paper>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const OptionsManagementPage: React.FC = () => {
  const [currentType, setCurrentType] = useState('CURRICULUM');
  const [knownTypes, setKnownTypes] = useState(OPTION_TYPES);
  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeInput, setNewTypeInput] = useState('');
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'info' });

  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedCityValue, setSelectedCityValue] = useState('');

  const { options: flatOptions, refetch: flatRefetch } = useOptions(
    (currentType === 'CURRICULUM' || currentType === 'CITY') ? '' : currentType
  );

  const [editingOption, setEditingOption] = useState<OptionItem | null>(null);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [savingFlat, setSavingFlat] = useState(false);
  const [confirmDeleteFlatOpen, setConfirmDeleteFlatOpen] = useState(false);
  const [deletingFlatId, setDeletingFlatId] = useState<string | null>(null);
  const [deletingFlatLoading, setDeletingFlatLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const remoteTypes = await getOptionTypes();
        setKnownTypes((prev) => {
          const existing = new Set(prev.map((t) => t.value));
          const hidden = new Set(['BOARD', 'GRADE', 'CLASS', 'SUBJECT', 'CHAPTER']);
          const merged = [...prev];
          remoteTypes
            .filter((t) => !String(t.value || '').toUpperCase().startsWith('AREA_'))
            .forEach((t) => { if (!existing.has(t.value) && !hidden.has(t.value)) merged.push(t); });
          return merged;
        });
      } catch { /* ignore */ }
    })();
  }, []);

  const handleTabChange = (val: string) => {
    setCurrentType(val);
    resetFlatForm();
    resetFaqForm();
    setSelectedCityId(''); setSelectedCityValue('');
  };

  const resetFlatForm = () => { setEditingOption(null); setLabel(''); setValue(''); setSortOrder(0); };

  const addType = () => {
    const trimmed = newTypeInput.trim();
    if (!trimmed) return;
    const upper = trimmed.toUpperCase().replace(/\s+/g, '_');
    if (upper.startsWith('AREA_')) {
      setSnackbar({ open: true, message: 'AREA_* types are managed under the Cities section.', severity: 'info' });
      return;
    }
    if (!knownTypes.some((t) => t.value === upper))
      setKnownTypes((prev) => [...prev, { value: upper, label: trimmed }]);
    setCurrentType(upper); setIsAddingType(false); setNewTypeInput('');
  };

  const handleSaveFlat = async () => {
    if (!label.trim()) return;
    try {
      setSavingFlat(true);
      const svc = await import('@/services/optionsService');
      await svc.createOrUpdateOption(editingOption?._id, {
        type: currentType,
        label: label.trim(),
        value: value.trim() || label.trim().toUpperCase().replace(/\s+/g, '_'),
        sortOrder,
      });
      setSnackbar({ open: true, message: 'Saved', severity: 'success' });
      resetFlatForm(); flatRefetch();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally { setSavingFlat(false); }
  };

  const performDeleteFlat = async () => {
    if (!deletingFlatId) return;
    try {
      setDeletingFlatLoading(true);
      const svc = await import('@/services/optionsService');
      await svc.deleteOption(deletingFlatId);
      setConfirmDeleteFlatOpen(false); setDeletingFlatId(null);
      flatRefetch();
      setSnackbar({ open: true, message: 'Deleted', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally { setDeletingFlatLoading(false); }
  };

  const showSnackbar = (msg: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message: msg, severity });

  const isTutorial = currentType === TUTORIAL_TYPE;
  const isFaq = currentType === FAQ_TYPE;
  const isMiller = currentType === 'CURRICULUM' || currentType === 'CITY';

  // Teacher Tutorial Video
  const [tutorialRecord, setTutorialRecord] = useState<OptionItem | null>(null);
  const [tutorialVideoUrl, setTutorialVideoUrl] = useState('');
  const [tutorialDescription, setTutorialDescription] = useState('');
  const [tutorialSaving, setTutorialSaving] = useState(false);

  useEffect(() => {
    getOptions('TEACHER_TUTORIAL').then((opts) => {
      const rec = opts[0] ?? null;
      setTutorialRecord(rec);
      setTutorialVideoUrl(rec?.metadata?.videoUrl ?? '');
      setTutorialDescription(rec?.metadata?.description ?? '');
    }).catch(() => {});
  }, []);

  const saveTutorial = async () => {
    setTutorialSaving(true);
    try {
      const saved = await createOrUpdateOption(tutorialRecord?._id, {
        type: 'TEACHER_TUTORIAL',
        label: 'Teacher Tutorial Video',
        value: 'tutorial',
        metadata: { videoUrl: tutorialVideoUrl.trim(), description: tutorialDescription.trim() },
      });
      setTutorialRecord(saved);
      showSnackbar('Tutorial video saved successfully');
    } catch {
      showSnackbar('Failed to save tutorial video', 'error');
    } finally {
      setTutorialSaving(false);
    }
  };

  // FAQ — each FAQ is an Option of type FAQ (label = question, metadata.answer = answer).
  // Reuses flatOptions / flatRefetch (useOptions(currentType)) for the list.
  const [faqEditingId, setFaqEditingId] = useState<string | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswerType, setFaqAnswerType] = useState<'text' | 'video'>('text');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqVideoUrl, setFaqVideoUrl] = useState('');
  const [faqSort, setFaqSort] = useState<number | string>('');
  const [faqSaving, setFaqSaving] = useState(false);

  const resetFaqForm = () => {
    setFaqEditingId(null); setFaqQuestion(''); setFaqAnswerType('text');
    setFaqAnswer(''); setFaqVideoUrl(''); setFaqSort('');
  };

  const startEditFaq = (o: OptionItem) => {
    setFaqEditingId(o._id);
    setFaqQuestion(o.label);
    setFaqAnswerType(o.metadata?.answerType === 'video' ? 'video' : 'text');
    setFaqAnswer(o.metadata?.answer ?? '');
    setFaqVideoUrl(o.metadata?.videoUrl ?? '');
    setFaqSort(o.sortOrder ?? '');
  };

  // Video answers require a valid YouTube link; description (answer) stays optional.
  // Text answers require the answer body.
  const faqIsVideo = faqAnswerType === 'video';
  const faqValid = !!faqQuestion.trim() && (
    faqIsVideo ? !!extractYouTubeId(faqVideoUrl.trim()) : !!faqAnswer.trim()
  );

  const saveFaq = async () => {
    const q = faqQuestion.trim();
    if (!faqValid) return;
    setFaqSaving(true);
    try {
      const metadata = faqIsVideo
        ? { answerType: 'video', videoUrl: faqVideoUrl.trim(), answer: faqAnswer.trim() }
        : { answerType: 'text', answer: faqAnswer.trim() };
      await createOrUpdateOption(faqEditingId || undefined, {
        type: FAQ_TYPE,
        label: q,
        value: q.toUpperCase().replace(/\s+/g, '_').slice(0, 60),
        sortOrder: faqSort === '' ? 0 : Number(faqSort),
        metadata,
      });
      showSnackbar(faqEditingId ? 'FAQ updated' : 'FAQ added');
      resetFaqForm();
      flatRefetch();
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to save FAQ', 'error');
    } finally {
      setFaqSaving(false);
    }
  };

  // FAQ list panel — reused as the grid's second column (text mode) or
  // rendered full-width below the form+preview split (video mode).
  const faqListPanel = (
    <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #F1F5F9', bgcolor: '#F8FAFC' }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: '#64748B', textTransform: 'uppercase' }}>
          {flatOptions.length} question{flatOptions.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {flatOptions.length === 0 ? (
        <Box px={3} py={5} textAlign="center">
          <HelpOutlineIcon sx={{ fontSize: 30, color: '#CBD5E1', mb: 1 }} />
          <Typography color="text.disabled" fontSize={14}>No FAQs yet — add your first question</Typography>
        </Box>
      ) : (
        [...flatOptions]
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((o, i, arr) => (
            <Box
              key={o._id}
              sx={{
                px: 2.5, py: 1.75,
                borderBottom: i < arr.length - 1 ? '1px solid #F8FAFC' : 'none',
                bgcolor: faqEditingId === o._id ? '#EFF6FF' : 'transparent',
                transition: T,
                '@media (hover: hover) and (pointer: fine)': {
                  '&:hover': { bgcolor: faqEditingId === o._id ? '#DBEAFE' : '#F8FAFC' },
                },
              }}
            >
              <Box display="flex" alignItems="flex-start" gap={1}>
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    {o.sortOrder !== undefined && o.sortOrder !== 0 && (
                      <Box component="span" sx={{ fontSize: 10, fontWeight: 600, px: 0.75, py: 0.2, borderRadius: '4px', bgcolor: '#F1F5F9', color: '#64748B', flexShrink: 0 }}>
                        #{o.sortOrder}
                      </Box>
                    )}
                    {o.metadata?.answerType === 'video' && (
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, fontSize: 10, fontWeight: 700, px: 0.75, py: 0.2, borderRadius: '4px', bgcolor: '#EFF6FF', color: '#1C3556', flexShrink: 0 }}>
                        <OndemandVideoIcon sx={{ fontSize: 12 }} /> VIDEO
                      </Box>
                    )}
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: faqEditingId === o._id ? 'primary.main' : 'text.primary', letterSpacing: -0.2 }}>
                      {o.label}
                    </Typography>
                  </Box>
                  {o.metadata?.answerType === 'video' ? (
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.metadata?.videoUrl
                        ? <>🎬 {o.metadata.videoUrl}{o.metadata?.answer ? ` — ${o.metadata.answer}` : ''}</>
                        : <Box component="span" sx={{ color: 'warning.main', fontStyle: 'italic' }}>No video set</Box>}
                    </Typography>
                  ) : (
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.55 }}>
                      {o.metadata?.answer || <Box component="span" sx={{ color: 'warning.main', fontStyle: 'italic' }}>No answer set</Box>}
                    </Typography>
                  )}
                </Box>
                <Box display="flex" gap={0.5} flexShrink={0}>
                  <IconButton
                    size="small"
                    onClick={() => startEditFaq(o)}
                    sx={{
                      borderRadius: '7px', color: 'text.disabled', transition: T,
                      '@media (hover: hover) and (pointer: fine)': { '&:hover': { color: 'primary.main', bgcolor: '#EFF6FF' } },
                      '&:active': { transform: 'scale(0.9)' },
                    }}
                  >
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => { setDeletingFlatId(o._id); setConfirmDeleteFlatOpen(true); }}
                    sx={{
                      borderRadius: '7px', color: 'text.disabled', transition: T,
                      '@media (hover: hover) and (pointer: fine)': { '&:hover': { color: '#DC2626', bgcolor: '#FEF2F2' } },
                      '&:active': { transform: 'scale(0.9)' },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          ))
      )}
    </Paper>
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: '#1C3556',
          px: { xs: 2.5, md: 4 },
          py: { xs: 2.5, md: 3 },
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 800, letterSpacing: -0.6, color: '#fff', lineHeight: 1.2 }}>
            Options
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', mt: 0.4, fontWeight: 500 }}>
            Manage curriculum hierarchy, cities, and dropdown lists
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<CategoryIcon sx={{ fontSize: '15px !important' }} />}
          onClick={() => setIsAddingType(true)}
          sx={{
            fontSize: 13, fontWeight: 700, px: 2, py: 0.85, borderRadius: '10px',
            color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.25)',
            transition: T,
            '@media (hover: hover) and (pointer: fine)': {
              '&:hover': { borderColor: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.06)' },
            },
            '&:active': { transform: 'scale(0.97)' },
          }}
        >
          Add Type
        </Button>
      </Box>

      {/* ── Content area ────────────────────────────────────────────────────── */}
      <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 2.5 } }}>

        {/* ── Type pill switcher ────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2.5, alignItems: 'center' }}>
          {knownTypes.map((tab) => {
            const active = currentType === tab.value;
            return (
              <Box
                key={tab.value}
                component="button"
                onClick={() => handleTabChange(tab.value)}
                sx={{
                  px: 1.75, py: 0.55, border: 'none', cursor: 'pointer', borderRadius: '8px',
                  fontSize: 12, fontWeight: 700, transition: T,
                  bgcolor: active ? '#1C3556' : '#F1F5F9',
                  color: active ? '#fff' : '#64748B',
                  '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': { bgcolor: active ? '#1C3556' : '#E2E8F0' },
                  },
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                {tab.label}
              </Box>
            );
          })}

          {/* Divider — separates content-type tabs from the app-content tab */}
          <Box sx={{ width: '1px', height: 20, bgcolor: '#E2E8F0', mx: 0.5, flexShrink: 0 }} />

          {/* Teacher Tutorial lives as its own tab, not a floating card */}
          {(() => {
            const active = currentType === TUTORIAL_TYPE;
            return (
              <Box
                component="button"
                onClick={() => handleTabChange(TUTORIAL_TYPE)}
                sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 0.6,
                  px: 1.5, py: 0.55, border: 'none', cursor: 'pointer', borderRadius: '8px',
                  fontSize: 12, fontWeight: 700, transition: T,
                  bgcolor: active ? '#1C3556' : '#F1F5F9',
                  color: active ? '#fff' : '#64748B',
                  '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': { bgcolor: active ? '#1C3556' : '#E2E8F0' },
                  },
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                <OndemandVideoIcon sx={{ fontSize: 15 }} />
                Tutorial Video
              </Box>
            );
          })()}

          {/* FAQ — managed as a list of FAQ-type options */}
          {(() => {
            const active = currentType === FAQ_TYPE;
            return (
              <Box
                component="button"
                onClick={() => handleTabChange(FAQ_TYPE)}
                sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 0.6,
                  px: 1.5, py: 0.55, border: 'none', cursor: 'pointer', borderRadius: '8px',
                  fontSize: 12, fontWeight: 700, transition: T,
                  bgcolor: active ? '#1C3556' : '#F1F5F9',
                  color: active ? '#fff' : '#64748B',
                  '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': { bgcolor: active ? '#1C3556' : '#E2E8F0' },
                  },
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                <HelpOutlineIcon sx={{ fontSize: 15 }} />
                FAQ
              </Box>
            );
          })()}
        </Box>

        {/* ── Teacher Tutorial editor (form + live preview) ─────────────────── */}
        {isTutorial ? (
          (() => {
            const previewId = extractYouTubeId(tutorialVideoUrl);
            return (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, alignItems: 'start' }}>

                {/* Form panel */}
                <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #F1F5F9', bgcolor: '#F8FAFC' }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: '#64748B', textTransform: 'uppercase' }}>
                      Video Source
                    </Typography>
                  </Box>
                  <Box sx={{ px: 2.5, py: 2.5 }}>
                    <Stack spacing={1.75}>
                      <MuiTextField
                        fullWidth size="small" label="YouTube Video URL"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={tutorialVideoUrl}
                        onChange={(e) => setTutorialVideoUrl(e.target.value)}
                        helperText="Tutors see this on the Get Started screen."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: 13, '& fieldset': { borderColor: '#E2E8F0' }, '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1.5 } } }}
                      />
                      <MuiTextField
                        fullWidth size="small" label="Description"
                        placeholder="Brief description shown below the video…"
                        value={tutorialDescription}
                        onChange={(e) => setTutorialDescription(e.target.value)}
                        multiline rows={4}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: 13, '& fieldset': { borderColor: '#E2E8F0' } } }}
                      />
                      <Box display="flex" justifyContent="flex-end">
                        <Button
                          variant="contained" startIcon={tutorialSaving ? <MuiCircularProgress size={14} color="inherit" /> : <SaveIcon />}
                          onClick={saveTutorial} disabled={tutorialSaving}
                          sx={{ fontWeight: 700, fontSize: 13, borderRadius: '9px', px: 2.25, boxShadow: 'none', bgcolor: '#1C3556', '&:hover': { bgcolor: '#152943' }, transition: T, '&:active': { transform: 'scale(0.97)' } }}
                        >
                          {tutorialSaving ? 'Saving…' : 'Save Tutorial'}
                        </Button>
                      </Box>
                    </Stack>
                  </Box>
                </Paper>

                {/* Live preview panel */}
                <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #F1F5F9', bgcolor: '#F8FAFC' }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: '#64748B', textTransform: 'uppercase' }}>
                      Preview
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2.5 }}>
                    {previewId ? (
                      <>
                        <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', borderRadius: '10px', overflow: 'hidden', bgcolor: '#000' }}>
                          <Box
                            component="iframe"
                            src={`https://www.youtube.com/embed/${previewId}`}
                            title="Tutorial preview"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                          />
                        </Box>
                        {tutorialDescription.trim() ? (
                          <Typography sx={{ mt: 1.75, fontSize: 13, lineHeight: 1.6, color: 'text.secondary' }}>
                            {tutorialDescription}
                          </Typography>
                        ) : null}
                      </>
                    ) : (
                      <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', borderRadius: '10px', overflow: 'hidden', bgcolor: '#F8FAFC', border: '1px dashed #E2E8F0' }}>
                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, px: 3, textAlign: 'center' }}>
                          <OndemandVideoIcon sx={{ fontSize: 32, color: '#CBD5E1' }} />
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>
                            {tutorialVideoUrl.trim() ? 'Not a valid YouTube link' : 'Paste a YouTube URL to preview'}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>
            );
          })()
        ) : isFaq ? (
          /* ── FAQ editor — text: form + list; video: form + live preview (Tutorial style), list below ── */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: faqIsVideo ? '1fr 1fr' : '360px 1fr' }, gap: 2.5, alignItems: 'start' }}>

            {/* Form panel */}
            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #F1F5F9', bgcolor: '#F8FAFC' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: '#64748B', textTransform: 'uppercase' }}>
                  {faqEditingId ? 'Edit FAQ' : 'Add FAQ'}
                </Typography>
              </Box>
              <Box sx={{ px: 2.5, py: 2.5 }}>
                <Stack spacing={1.75}>
                  <MuiTextField
                    size="small" label="Question" fullWidth value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: 13, '& fieldset': { borderColor: '#E2E8F0' }, '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1.5 } } }}
                  />

                  {/* Answer type toggle */}
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#94A3B8', textTransform: 'uppercase', mb: 0.75 }}>
                      Answer Type
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                      {([
                        { v: 'text' as const, label: 'Text', icon: <HelpOutlineIcon sx={{ fontSize: 15 }} /> },
                        { v: 'video' as const, label: 'Video', icon: <OndemandVideoIcon sx={{ fontSize: 15 }} /> },
                      ]).map((opt) => {
                        const active = faqAnswerType === opt.v;
                        return (
                          <Box
                            key={opt.v}
                            component="button"
                            type="button"
                            onClick={() => setFaqAnswerType(opt.v)}
                            sx={{
                              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0.6,
                              px: 1.5, py: 0.85, border: '1px solid', cursor: 'pointer', borderRadius: '9px',
                              fontSize: 12.5, fontWeight: 700, transition: T,
                              bgcolor: active ? '#1C3556' : '#F8FAFC',
                              color: active ? '#fff' : '#64748B',
                              borderColor: active ? '#1C3556' : '#E2E8F0',
                              '&:active': { transform: 'scale(0.97)' },
                            }}
                          >
                            {opt.icon}
                            {opt.label}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>

                  {faqIsVideo && (
                    <MuiTextField
                      size="small" label="YouTube Video URL" fullWidth value={faqVideoUrl}
                      placeholder="https://www.youtube.com/watch?v=..."
                      onChange={(e) => setFaqVideoUrl(e.target.value)}
                      error={!!faqVideoUrl.trim() && !extractYouTubeId(faqVideoUrl.trim())}
                      helperText={!!faqVideoUrl.trim() && !extractYouTubeId(faqVideoUrl.trim()) ? 'Not a valid YouTube link' : 'Shown as the video answer in the app'}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: 13, '& fieldset': { borderColor: '#E2E8F0' }, '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1.5 } } }}
                    />
                  )}

                  <MuiTextField
                    size="small" label={faqIsVideo ? 'Description (optional)' : 'Answer'} fullWidth multiline rows={faqIsVideo ? 3 : 5} value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    placeholder={faqIsVideo ? 'Short text shown below the video…' : ''}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: 13, '& fieldset': { borderColor: '#E2E8F0' } } }}
                  />

                  <MuiTextField
                    size="small" label="Sort Order" type="number" fullWidth value={faqSort}
                    onChange={(e) => setFaqSort(e.target.value)}
                    helperText="Lower numbers appear first"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: 13, '& fieldset': { borderColor: '#E2E8F0' } } }}
                  />
                  <Box display="flex" gap={1} justifyContent="flex-end">
                    {faqEditingId && (
                      <Button
                        onClick={resetFaqForm}
                        sx={{ fontWeight: 700, fontSize: 13, borderRadius: '9px', color: 'text.secondary', transition: T }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      variant="contained" onClick={saveFaq}
                      disabled={faqSaving || !faqValid}
                      startIcon={faqSaving ? <MuiCircularProgress size={14} color="inherit" /> : <SaveIcon />}
                      sx={{ fontWeight: 700, fontSize: 13, borderRadius: '9px', px: 2.25, boxShadow: 'none', bgcolor: '#1C3556', '&:hover': { bgcolor: '#152943' }, transition: T, '&:active': { transform: 'scale(0.97)' } }}
                    >
                      {faqSaving ? 'Saving…' : (faqEditingId ? 'Update FAQ' : 'Add FAQ')}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Paper>

            {/* Second column — live video preview (Tutorial style) when video, else the FAQ list */}
            {faqIsVideo ? (
              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #F1F5F9', bgcolor: '#F8FAFC' }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: '#64748B', textTransform: 'uppercase' }}>
                    Preview
                  </Typography>
                </Box>
                <Box sx={{ p: 2.5 }}>
                  {(() => {
                    const vid = extractYouTubeId(faqVideoUrl.trim());
                    return vid ? (
                      <>
                        <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', borderRadius: '10px', overflow: 'hidden', bgcolor: '#000' }}>
                          <Box
                            component="iframe"
                            src={`https://www.youtube.com/embed/${vid}`}
                            title="FAQ video preview"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                          />
                        </Box>
                        {faqAnswer.trim() ? (
                          <Typography sx={{ mt: 1.75, fontSize: 13, lineHeight: 1.6, color: 'text.secondary' }}>
                            {faqAnswer}
                          </Typography>
                        ) : null}
                      </>
                    ) : (
                      <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', borderRadius: '10px', overflow: 'hidden', bgcolor: '#F8FAFC', border: '1px dashed #E2E8F0' }}>
                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, px: 3, textAlign: 'center' }}>
                          <OndemandVideoIcon sx={{ fontSize: 32, color: '#CBD5E1' }} />
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>
                            {faqVideoUrl.trim() ? 'Not a valid YouTube link' : 'Paste a YouTube URL to preview'}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })()}
                </Box>
              </Paper>
            ) : faqListPanel}
          </Box>

          {/* In video mode the list moves to a full-width row below the split */}
          {faqIsVideo && faqListPanel}
          </Box>
        ) : isMiller ? (
          <Box sx={{ overflowX: 'auto', pb: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: currentType === 'CURRICULUM' ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
                gap: 2,
                minWidth: currentType === 'CURRICULUM' ? 900 : 560,
              }}
            >
              {currentType === 'CURRICULUM' ? (
                <>
                  <OptionColumn title="Boards" type="BOARD" selectedId={selectedBoardId}
                    onSelect={(item) => { setSelectedBoardId(item._id); setSelectedClassId(''); setSelectedSubjectId(''); }}
                    onSaveError={(m) => showSnackbar(m, 'error')} onSaveSuccess={(m) => showSnackbar(m)} />
                  <OptionColumn title="Classes" type="GRADE" parentId={selectedBoardId}
                    selectedId={selectedClassId} disabled={!selectedBoardId}
                    onSelect={(item) => { setSelectedClassId(item._id); setSelectedSubjectId(''); }}
                    onSaveError={(m) => showSnackbar(m, 'error')} onSaveSuccess={(m) => showSnackbar(m)} />
                  <OptionColumn title="Subjects" type="SUBJECT" parentId={selectedClassId}
                    selectedId={selectedSubjectId} disabled={!selectedClassId}
                    onSelect={(item) => setSelectedSubjectId(item._id)}
                    onSaveError={(m) => showSnackbar(m, 'error')} onSaveSuccess={(m) => showSnackbar(m)} />
                  <OptionColumn title="Chapters" type="CHAPTER" parentId={selectedSubjectId}
                    disabled={!selectedSubjectId} onSelect={() => {}}
                    onSaveError={(m) => showSnackbar(m, 'error')} onSaveSuccess={(m) => showSnackbar(m)} />
                </>
              ) : (
                <>
                  <OptionColumn title="Cities" type="CITY" selectedId={selectedCityId}
                    onSelect={(item) => { setSelectedCityId(item._id); setSelectedCityValue(item.value); }}
                    onSaveError={(m) => showSnackbar(m, 'error')} onSaveSuccess={(m) => showSnackbar(m)} />
                  <OptionColumn title="Areas" type={selectedCityValue ? `AREA_${selectedCityValue}` : 'NONE'}
                    parentId={selectedCityId} disabled={!selectedCityId} onSelect={() => {}}
                    onSaveError={(m) => showSnackbar(m, 'error')} onSaveSuccess={(m) => showSnackbar(m)} />
                </>
              )}
            </Box>
          </Box>
        ) : (
          /* ── Flat list editor ──────────────────────────────────────────────── */
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px 1fr' }, gap: 2.5, alignItems: 'start' }}>

            {/* Form panel */}
            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #F1F5F9', bgcolor: '#F8FAFC' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: '#64748B', textTransform: 'uppercase' }}>
                  {editingOption ? 'Edit Item' : 'Add Item'}
                </Typography>
              </Box>
              <Box sx={{ px: 2.5, py: 2.5 }}>
                <Stack spacing={1.75}>
                  <TextField
                    size="small" label="Label" fullWidth value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: 13, '& fieldset': { borderColor: '#E2E8F0' }, '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1.5 } } }}
                  />
                  <TextField
                    size="small" label="Code" fullWidth value={value}
                    onChange={(e) => setValue(e.target.value)}
                    helperText="Auto-generated from label if blank"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: 13, '& fieldset': { borderColor: '#E2E8F0' } } }}
                  />
                  <TextField
                    size="small" label="Sort Order" type="number" fullWidth value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: 13, '& fieldset': { borderColor: '#E2E8F0' } } }}
                  />
                  <Box display="flex" gap={1}>
                    {editingOption && (
                      <Button
                        fullWidth onClick={resetFlatForm}
                        sx={{ fontWeight: 700, fontSize: 13, borderRadius: '9px', color: 'text.secondary', transition: T }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      fullWidth variant="contained" onClick={handleSaveFlat}
                      disabled={savingFlat || !label.trim()}
                      sx={{ fontWeight: 700, fontSize: 13, borderRadius: '9px', boxShadow: 'none', transition: T, '&:active': { transform: 'scale(0.97)' } }}
                    >
                      {savingFlat ? <CircularProgress size={14} color="inherit" /> : (editingOption ? 'Update' : 'Add')}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Paper>

            {/* List panel */}
            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #F1F5F9', bgcolor: '#F8FAFC' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: '#64748B', textTransform: 'uppercase' }}>
                  {flatOptions.length} item{flatOptions.length !== 1 ? 's' : ''}
                </Typography>
              </Box>

              {flatOptions.length === 0 ? (
                <Box px={3} py={5} textAlign="center">
                  <Typography color="text.disabled" fontSize={14}>No items yet</Typography>
                </Box>
              ) : (
                flatOptions.map((o, i) => (
                  <Box
                    key={o._id}
                    sx={{
                      display: 'flex', alignItems: 'center', px: 2.5, py: 1.25,
                      borderBottom: i < flatOptions.length - 1 ? '1px solid #F8FAFC' : 'none',
                      bgcolor: editingOption?._id === o._id ? '#EFF6FF' : 'transparent',
                      transition: T,
                      '@media (hover: hover) and (pointer: fine)': {
                        '&:hover': { bgcolor: editingOption?._id === o._id ? '#DBEAFE' : '#F8FAFC' },
                      },
                    }}
                  >
                    <Box flex={1} minWidth={0}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: editingOption?._id === o._id ? 'primary.main' : 'text.primary' }}>
                          {o.label}
                        </Typography>
                        {o.sortOrder !== undefined && o.sortOrder !== 0 && (
                          <Box component="span" sx={{ fontSize: 10, fontWeight: 600, px: 0.75, py: 0.2, borderRadius: '4px', bgcolor: '#F1F5F9', color: '#64748B' }}>
                            #{o.sortOrder}
                          </Box>
                        )}
                      </Box>
                      <Typography sx={{ fontSize: 11, color: 'text.disabled', fontFamily: 'monospace' }}>{o.value}</Typography>
                    </Box>

                    <Box display="flex" gap={0.5} flexShrink={0}>
                      <IconButton
                        size="small"
                        onClick={() => { setEditingOption(o); setLabel(o.label); setValue(o.value); setSortOrder(o.sortOrder ?? 0); }}
                        sx={{
                          borderRadius: '7px', color: 'text.disabled', transition: T,
                          '@media (hover: hover) and (pointer: fine)': { '&:hover': { color: 'primary.main', bgcolor: '#EFF6FF' } },
                          '&:active': { transform: 'scale(0.9)' },
                        }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => { setDeletingFlatId(o._id); setConfirmDeleteFlatOpen(true); }}
                        sx={{
                          borderRadius: '7px', color: 'text.disabled', transition: T,
                          '@media (hover: hover) and (pointer: fine)': { '&:hover': { color: '#DC2626', bgcolor: '#FEF2F2' } },
                          '&:active': { transform: 'scale(0.9)' },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ))
              )}
            </Paper>
          </Box>
        )}
      </Box>

      {/* ── Add Type Dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={isAddingType}
        onClose={() => { setIsAddingType(false); setNewTypeInput(''); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', border: '1px solid #E2E8F0' } }}
      >
        <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={800} fontSize={16} letterSpacing={-0.3}>Add Option Type</Typography>
          <IconButton size="small" onClick={() => setIsAddingType(false)} sx={{ borderRadius: '8px', color: 'text.secondary' }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 0 }}>
          <TextField
            autoFocus fullWidth size="small"
            placeholder="e.g. LANGUAGES"
            value={newTypeInput}
            onChange={(e) => setNewTypeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addType(); }}
            helperText="Will be converted to UPPER_SNAKE_CASE"
            sx={{
              mt: 0.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: '9px', fontSize: 13,
                '& fieldset': { borderColor: '#E2E8F0' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1.5 },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button
            onClick={() => { setIsAddingType(false); setNewTypeInput(''); }}
            sx={{ fontWeight: 700, fontSize: 13, borderRadius: '9px', color: 'text.secondary', transition: T }}
          >
            Cancel
          </Button>
          <Button
            variant="contained" onClick={addType} disabled={!newTypeInput.trim()}
            sx={{ fontWeight: 700, fontSize: 13, borderRadius: '9px', boxShadow: 'none', px: 2.5, transition: T, '&:active': { transform: 'scale(0.97)' } }}
          >
            Add & Switch
          </Button>
        </DialogActions>
      </Dialog>

      <SnackbarNotification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />

      <ConfirmDialog
        open={confirmDeleteFlatOpen}
        onClose={() => setConfirmDeleteFlatOpen(false)}
        onConfirm={performDeleteFlat}
        title="Delete Option"
        message="Delete this option? This cannot be undone."
        severity="error"
        loading={deletingFlatLoading}
      />
    </Box>
  );
};

export default OptionsManagementPage;
