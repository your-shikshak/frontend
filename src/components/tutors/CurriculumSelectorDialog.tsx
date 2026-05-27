import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Tabs,
  Tab,
  alpha,
  useTheme,
  CircularProgress,
  Grid,
  Divider,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SchoolIcon from '@mui/icons-material/School';
import CloseIcon from '@mui/icons-material/Close';
import { useOptions } from '../../hooks/useOptions';
import { OptionItem } from '../../services/optionsService';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const font = `'Inter', -apple-system, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

const C = {
  primary:       '#4F46E5',   // indigo-600
  primaryDark:   '#3730A3',   // indigo-800
  primaryLight:  '#818CF8',   // indigo-400
  primaryTint:   '#EEF2FF',   // indigo-50
  accent:        '#06B6D4',   // cyan-500
  accentDark:    '#0891B2',   // cyan-600
  accentTint:    '#ECFEFF',   // cyan-50
  emerald:       '#10B981',
  emeraldTint:   '#ECFDF5',
  amber:         '#F59E0B',
  amberTint:     '#FFFBEB',
  violet:        '#8B5CF6',
  violetTint:    '#F5F3FF',
  canvas:        '#ffffff',
  surfaceGray:   '#F8FAFC',
  surfaceMid:    '#F1F5F9',
  border:        '#E2E8F0',
  borderStrong:  '#CBD5E1',
  ink:           '#0F172A',   // slate-900
  body:          '#475569',   // slate-600
  muted:         '#94A3B8',   // slate-400
  onDark:        '#ffffff',
  error:         '#EF4444',
};

const R = { sm: '8px', md: '12px', lg: '16px', xl: '24px', pill: '9999px' };

interface CurriculumSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  initialSelectedIds: string[];
  onSave: (ids: string[]) => void;
}

interface TreeItem extends OptionItem {
  children?: TreeItem[];
}

export const CurriculumSelectorDialog: React.FC<CurriculumSelectorDialogProps> = ({
  open,
  onClose,
  initialSelectedIds,
  onSave,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeBoardTab, setActiveBoardTab] = useState(0);

  // Sync initial selection
  useEffect(() => {
    if (open) {
      setSelectedIds(initialSelectedIds);
    }
  }, [open, initialSelectedIds]);

  // Fetch all options
  const { options: boards, loading: loadingBoards } = useOptions('BOARD');
  const { options: grades, loading: loadingGrades } = useOptions('GRADE');
  const { options: subjects, loading: loadingSubjects } = useOptions('SUBJECT');

  const isLoading = loadingBoards || loadingGrades || loadingSubjects;

  // Build the tree structure
  const tree = useMemo(() => {
    if (isLoading) return [];

    const treeData: TreeItem[] = boards.map((board) => ({
      ...board,
      children: grades
        .filter((grade) => {
          const parentId = typeof grade.parent === 'object' ? grade.parent?._id : grade.parent;
          return parentId === board._id;
        })
        .map((grade) => ({
          ...grade,
          children: subjects.filter((subject) => {
            const parentId = typeof subject.parent === 'object' ? subject.parent?._id : subject.parent;
            return parentId === grade._id;
          }),
        })),
    }));

    if (!searchTerm.trim()) return treeData;

    const term = searchTerm.toLowerCase();
    return treeData
      .map((board) => {
        const filteredGrades = board.children?.map((grade) => {
          const filteredSubjects = grade.children?.filter((subject) =>
            subject.label.toLowerCase().includes(term)
          );

          if (grade.label.toLowerCase().includes(term) || (filteredSubjects && filteredSubjects.length > 0)) {
            return { ...grade, children: filteredSubjects };
          }
          return null;
        }).filter(Boolean) as TreeItem[];

        if (board.label.toLowerCase().includes(term) || filteredGrades.length > 0) {
          return { ...board, children: filteredGrades };
        }
        return null;
      })
      .filter(Boolean) as TreeItem[];
  }, [boards, grades, subjects, isLoading, searchTerm]);

  const handleToggleSubject = (subjectId: string) => {
    setSelectedIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleToggleGrade = (grade: TreeItem) => {
    const gradeSubjectIds = grade.children?.map((s) => s._id) || [];
    const allSelected = gradeSubjectIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !gradeSubjectIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...gradeSubjectIds])));
    }
  };

  const getSelectedCountInGrade = (grade: TreeItem) => {
    return grade.children?.filter((s) => selectedIds.includes(s._id)).length || 0;
  };

  const currentBoard = tree[activeBoardTab];

  const getInputStyles = (color: string = C.primary) => ({
    '& .MuiOutlinedInput-root': {
      borderRadius: R.md,
      backgroundColor: C.canvas,
      transition: 'all 0.2s ease-in-out',
      '& fieldset': {
        borderColor: C.border,
        borderWidth: '1px',
        transition: 'all 0.2s',
      },
      '&:hover fieldset': {
        borderColor: C.borderStrong,
      },
      '&.Mui-focused fieldset': {
        borderColor: color,
        borderWidth: '2px',
      },
      '&.Mui-disabled': {
        backgroundColor: C.surfaceGray,
      },
    },
    '& .MuiInputLabel-root': {
      color: C.body,
      fontFamily: font,
      fontWeight: 500,
      '&.Mui-focused': {
        color: color,
      },
    },
    '& input': {
      fontFamily: font,
      color: C.ink,
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={isMobile}
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : R.lg,
          height: isMobile ? '100%' : '80vh',
          maxHeight: isMobile ? 'none' : 800,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: isMobile ? 'none' : `1px solid ${C.border}`,
          boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
        },
      }}
    >
      <DialogTitle sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: C.primaryTint, color: C.primary, borderRadius: R.sm, display: 'flex' }}>
            <SchoolIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle1" fontWeight={800} color={C.ink} sx={{ fontFamily: font }}>Curriculum Selector</Typography>
          <Chip
            label={`${selectedIds.length} Selected`}
            size="small"
            sx={{ fontWeight: 700, height: 24, fontSize: '0.7rem', fontFamily: font, bgcolor: C.accentTint, color: C.accentDark }}
          />
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: C.muted, '&:hover': { color: C.ink } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box sx={{ p: 2.5, borderBottom: `1px solid ${C.border}`, bgcolor: C.surfaceGray }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search subjects, classes or boards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={getInputStyles(C.primary)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <DialogContent sx={{ p: 0, display: 'flex', flex: 1, overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
            <CircularProgress size={32} sx={{ color: C.primary }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: font }}>Loading curriculum...</Typography>
          </Box>
        ) : tree.length === 0 ? (
          <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: font }}>No options matching your search.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Left Rail / Top Bar: Boards */}
            <Box sx={{ 
              width: isMobile ? '100%' : 220, 
              borderRight: isMobile ? 0 : `1px solid ${C.border}`, 
              borderBottom: isMobile ? `1px solid ${C.border}` : 0,
              bgcolor: C.surfaceGray, 
              display: 'flex', 
              flexDirection: isMobile ? 'row' : 'column' 
            }}>
              <Tabs
                orientation={isMobile ? "horizontal" : "vertical"}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : false}
                value={activeBoardTab}
                onChange={(_, v) => setActiveBoardTab(v)}
                sx={{
                  '& .MuiTabs-indicator': { 
                    left: isMobile ? 'auto' : 0, 
                    bottom: isMobile ? 0 : 'auto',
                    width: isMobile ? 'auto' : 4, 
                    height: isMobile ? 4 : 'auto',
                    borderRadius: isMobile ? '4px 4px 0 0' : '0 4px 4px 0',
                    backgroundColor: C.primary,
                  },
                  '& .MuiTab-root': {
                    alignItems: isMobile ? 'center' : 'flex-start',
                    textAlign: isMobile ? 'center' : 'left',
                    textTransform: 'none',
                    fontFamily: font,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    py: isMobile ? 1.5 : 2.5,
                    px: 3,
                    minHeight: 0,
                    minWidth: isMobile ? 'auto' : 220,
                    color: C.body,
                    transition: 'all 0.2s',
                    '&.Mui-selected': { color: C.primary, bgcolor: C.primaryTint }
                  }
                }}
              >
                {tree.map((board, idx) => {
                  const totalSelectedInBoard = board.children?.reduce((acc, grade) => acc + getSelectedCountInGrade(grade), 0) || 0;
                  return (
                    <Tab
                      key={board._id}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1.5 }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{board.label}</span>
                          {totalSelectedInBoard > 0 && (
                            <Box sx={{ 
                              width: 20, 
                              height: 20, 
                              borderRadius: '50%', 
                              bgcolor: C.primary, 
                              color: C.onDark, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: '10px',
                              fontWeight: 800,
                              flexShrink: 0
                            }}>
                              {totalSelectedInBoard}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  );
                })}
              </Tabs>
            </Box>

            {/* Right Pane: Grades & Subjects */}
            <Box sx={{ flex: 1, p: isMobile ? 2.5 : 4, overflowY: 'auto', bgcolor: C.canvas }}>
              {currentBoard && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} color={C.primary} gutterBottom sx={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 1, mb: 4, fontFamily: font }}>
                    <SchoolIcon fontSize="small" /> {currentBoard.label}
                  </Typography>
                  
                  {currentBoard.children?.map((grade) => {
                    const selectedInGrade = getSelectedCountInGrade(grade);
                    const totalInGrade = grade.children?.length || 0;
                    const allSelected = totalInGrade > 0 && selectedInGrade === totalInGrade;

                    return (
                      <Box key={grade._id} sx={{ mb: 4.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, pb: 1, borderBottom: `1px solid ${C.border}` }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={allSelected}
                                indeterminate={selectedInGrade > 0 && !allSelected}
                                onChange={() => handleToggleGrade(grade)}
                                sx={{
                                  color: C.borderStrong,
                                  '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                                    color: C.primary,
                                  }
                                }}
                              />
                            }
                            label={<Typography variant="subtitle2" fontWeight={800} color={C.ink} sx={{ fontFamily: font }}>{grade.label}</Typography>}
                          />
                          {selectedInGrade > 0 && (
                            <Typography variant="caption" fontWeight={700} color={C.primary} sx={{ fontFamily: font }}>
                              {selectedInGrade} of {totalInGrade} selected
                            </Typography>
                          )}
                        </Box>

                        <Grid container spacing={1.5}>
                          {grade.children?.map((subject) => (
                            <Grid item key={subject._id}>
                              <Chip
                                label={subject.label}
                                size="small"
                                onClick={() => handleToggleSubject(subject._id)}
                                variant={selectedIds.includes(subject._id) ? 'filled' : 'outlined'}
                                sx={{
                                  borderRadius: R.sm,
                                  px: 1.5,
                                  height: 34,
                                  fontWeight: 600,
                                  fontFamily: font,
                                  fontSize: '0.8rem',
                                  transition: 'all 0.2s',
                                  borderColor: selectedIds.includes(subject._id) ? C.primary : C.border,
                                  color: selectedIds.includes(subject._id) ? C.onDark : C.body,
                                  bgcolor: selectedIds.includes(subject._id) ? C.primary : C.canvas,
                                  '&:hover': {
                                    bgcolor: selectedIds.includes(subject._id) ? C.primaryDark : C.primaryTint,
                                    borderColor: C.primary,
                                    color: selectedIds.includes(subject._id) ? C.onDark : C.primary,
                                  }
                                }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <Divider sx={{ borderColor: C.border }} />
      
      <DialogActions sx={{ 
        p: 2.5, 
        px: isMobile ? 2.5 : 3.5, 
        bgcolor: C.surfaceGray,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1.5 : 0
      }}>
        {!isMobile && (
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontFamily: font }}>
              {selectedIds.length} subjects will be added to your profile across {tree.filter(b => b.children?.some(g => getSelectedCountInGrade(g) > 0)).length} boards.
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1.5, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            sx={{ 
              borderRadius: R.md, 
              fontWeight: 700, 
              fontFamily: font,
              textTransform: 'none', 
              px: 3, 
              borderColor: C.borderStrong,
              color: C.body,
              '&:hover': {
                borderColor: C.ink,
                bgcolor: C.canvas,
                color: C.ink
              },
              flex: isMobile ? 1 : 'none' 
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSave(selectedIds)}
            variant="contained"
            sx={{ 
              borderRadius: R.md, 
              fontWeight: 800, 
              fontFamily: font,
              textTransform: 'none', 
              px: 4, 
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accentDark} 100%)`,
              color: C.onDark,
              boxShadow: `0 4px 12px ${alpha(C.primary, 0.2)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${C.primaryDark} 0%, ${C.accent} 100%)`,
                boxShadow: `0 6px 18px ${alpha(C.primary, 0.3)}`,
              },
              flex: isMobile ? 2 : 'none' 
            }}
          >
            Save Changes
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
