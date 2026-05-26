import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { useOptions } from '../../hooks/useOptions';
import { CurriculumSelectorDialog } from './CurriculumSelectorDialog';

// ── Design tokens (shared with registration page) ────────────────────────────
const font = `'Inter', -apple-system, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
const C = {
  primary:      '#4F46E5',
  primaryDark:  '#3730A3',
  primaryLight: '#818CF8',
  primaryTint:  '#EEF2FF',
  canvas:       '#ffffff',
  surfaceGray:  '#F8FAFC',
  border:       '#E2E8F0',
  ink:          '#0F172A',
  body:         '#475569',
  muted:        '#94A3B8',
  accent:       '#06B6D4',
  accentTint:   '#ECFEFF',
  emerald:      '#10B981',
  emeraldTint:  '#ECFDF5',
};
// ─────────────────────────────────────────────────────────────────────────────

interface CurriculumTreeSelectorProps {
  selectedSubjectIds: string[];
  onChange: (ids: string[]) => void;
  error?: string;
  disabled?: boolean;
}

export const CurriculumTreeSelector: React.FC<CurriculumTreeSelectorProps> = ({
  selectedSubjectIds,
  onChange,
  error,
  disabled = false,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { options: boards, loading: loadingBoards } = useOptions('BOARD');
  const { options: grades, loading: loadingGrades } = useOptions('GRADE');
  const { options: subjects, loading: loadingSubjects } = useOptions('SUBJECT');
  const isLoading = loadingBoards || loadingGrades || loadingSubjects;

  const handleSave = (newIds: string[]) => {
    onChange(newIds);
    setDialogOpen(false);
  };

  const groupedSelections = useMemo(() => {
    interface Group { label: string; ids: string[] }
    const groups: Record<string, Group> = {};
    selectedSubjectIds.forEach(id => {
      const subject = subjects.find(s => s._id === id);
      if (!subject) return;
      const gradeId = typeof subject.parent === 'object' ? subject.parent?._id : subject.parent;
      const grade = grades.find(g => g._id === gradeId);
      const boardId = grade ? (typeof grade.parent === 'object' ? grade.parent?._id : grade.parent) : null;
      const board = boards.find(b => b._id === boardId);
      const parentLabel = board && grade ? `${board.label} · ${grade.label}` : grade ? grade.label : 'Other';
      if (!groups[parentLabel]) groups[parentLabel] = { label: parentLabel, ids: [] };
      groups[parentLabel].ids.push(id);
    });
    return Object.values(groups) as Group[];
  }, [selectedSubjectIds, subjects, grades, boards]);

  const hasSubjects = selectedSubjectIds.length > 0;

  return (
    <Box sx={{ width: '100%', fontFamily: font }}>
      {/* Container card */}
      <Box
        sx={{
          borderRadius: '12px',
          border: error
            ? '1.5px solid #EF4444'
            : `1.5px solid ${hasSubjects ? C.primaryLight + '80' : C.border}`,
          bgcolor: C.canvas,
          overflow: 'hidden',
          transition: 'border-color 0.2s ease',
        }}
      >
        {/* Header bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: '16px',
            py: '12px',
            bgcolor: hasSubjects ? C.primaryTint : C.surfaceGray,
            borderBottom: `1px solid ${hasSubjects ? C.primaryLight + '40' : C.border}`,
            transition: 'background-color 0.2s ease',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LibraryBooksIcon sx={{ fontSize: 16, color: hasSubjects ? C.primary : C.muted }} />
            <Typography
              sx={{
                fontFamily: font,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: hasSubjects ? C.primary : C.muted,
              }}
            >
              Teaching Portfolio
            </Typography>
            {hasSubjects && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 20,
                  px: '6px',
                  borderRadius: '9999px',
                  bgcolor: C.primary,
                  fontFamily: font,
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {selectedSubjectIds.length}
              </Box>
            )}
          </Box>

          <Button
            size="small"
            variant={hasSubjects ? 'outlined' : 'contained'}
            startIcon={
              hasSubjects
                ? <EditIcon sx={{ fontSize: '13px !important' }} />
                : <AddCircleOutlineIcon sx={{ fontSize: '13px !important' }} />
            }
            onClick={() => setDialogOpen(true)}
            disabled={disabled}
            sx={{
              fontFamily: font,
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '9999px',
              px: '12px',
              height: '30px',
              boxShadow: 'none',
              letterSpacing: 0,
              ...(hasSubjects
                ? {
                    borderColor: C.primaryLight,
                    color: C.primary,
                    bgcolor: C.canvas,
                    '&:hover': { borderColor: C.primary, bgcolor: C.primaryTint, boxShadow: 'none', transform: 'none' },
                  }
                : {
                    background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                    color: '#fff',
                    border: 'none',
                    '&:hover': { boxShadow: `0 4px 12px ${C.primary}44`, transform: 'none' },
                  }),
            }}
          >
            {hasSubjects ? 'Modify' : 'Choose Subjects'}
          </Button>
        </Box>

        {/* Content area */}
        <Box sx={{ p: '16px', minHeight: 80 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', py: '16px' }}>
              <CircularProgress size={18} sx={{ color: C.primary }} />
              <Typography sx={{ fontFamily: font, fontSize: 13, color: C.muted }}>
                Loading curriculum…
              </Typography>
            </Box>
          ) : hasSubjects ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {groupedSelections.map((group, idx) => (
                <Box key={idx}>
                  {/* Group label — Board · Grade */}
                  <Typography
                    sx={{
                      fontFamily: font,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      color: C.accent,
                      mb: '6px',
                    }}
                  >
                    {group.label}
                  </Typography>
                  {/* Subject chips */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {group.ids.map((id: string) => {
                      const label = subjects.find(s => s._id === id)?.label || id;
                      return (
                        <Box
                          key={id}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            px: '10px',
                            py: '4px',
                            borderRadius: '9999px',
                            bgcolor: C.primaryTint,
                            border: `1px solid ${C.primaryLight}55`,
                            fontFamily: font,
                            fontSize: 12,
                            fontWeight: 500,
                            color: C.primary,
                          }}
                        >
                          {label}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: '16px',
                gap: '8px',
              }}
            >
              <Box
                sx={{
                  width: 40, height: 40,
                  borderRadius: '12px',
                  bgcolor: C.surfaceGray,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <LibraryBooksIcon sx={{ fontSize: 20, color: C.muted }} />
              </Box>
              <Typography sx={{ fontFamily: font, fontSize: 13, color: C.muted, textAlign: 'center' }}>
                No subjects selected yet.
              </Typography>
              <Typography sx={{ fontFamily: font, fontSize: 12, color: C.muted + 'aa', textAlign: 'center' }}>
                Click <strong style={{ color: C.primary }}>Choose Subjects</strong> to build your teaching portfolio.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {error && (
        <Typography sx={{ fontFamily: font, fontSize: 12, color: '#EF4444', mt: '6px', fontWeight: 500, display: 'block' }}>
          {error}
        </Typography>
      )}

      <CurriculumSelectorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialSelectedIds={selectedSubjectIds}
        onSave={handleSave}
      />
    </Box>
  );
};
