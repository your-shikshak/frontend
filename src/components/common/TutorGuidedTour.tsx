import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Sparkles, CheckCircle, Info } from 'lucide-react';
import { Button, Box, Typography, alpha, useTheme, IconButton } from '@mui/material';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-hero',
    title: 'Professional Identity',
    content: 'This is where your professional brand lives. A verified profile and premium tier (Gold/Silver) significantly increase your visibility to parents.',
    position: 'bottom',
  },
  {
    targetId: 'tour-tier',
    title: 'Tier Progression',
    content: 'Track your growth from Bronze to Gold. Higher tiers unlock lower system fees and priority lead assignments.',
    position: 'bottom',
  },
  {
    targetId: 'tour-analytics',
    title: 'Data-Driven Insights',
    content: 'Monitor your earnings and session metrics in real-time. This helps you track your monthly goals and teaching consistency.',
    position: 'bottom',
  },
  {
    targetId: 'tour-today',
    title: 'Daily Agenda',
    content: 'Your live mission control. View today\'s classes and mark attendance effortlessly to ensure timely payouts.',
    position: 'bottom',
  },
  {
    targetId: 'tour-portfolio-list',
    title: 'Student Portfolio',
    content: 'Manage all your active learning journeys in one place. Keep track of current student progress and session balances.',
    position: 'top',
  },
  {
    targetId: 'tour-payments',
    title: 'Financial Ledger',
    content: 'Total transparency on your earnings. Track successfully processed payouts and view upcoming scheduled transfers.',
    position: 'top',
  }
];

interface TutorGuidedTourProps {
  onClose: () => void;
  isActive: boolean;
}

export const TutorGuidedTour: React.FC<TutorGuidedTourProps> = ({ onClose, isActive }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const theme = useTheme();

  const updateCoords = () => {
    const step = TOUR_STEPS[currentStep];
    const element = document.getElementById(step.targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    if (!isActive) return;
    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [currentStep, isActive]);

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Backdrop with hole */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-all duration-500"
        style={{
          clipPath: `polygon(0% 0%, 0% 100%, ${coords.left}px 100%, ${coords.left}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top + coords.height}px, ${coords.left}px ${coords.top + coords.height}px, ${coords.left}px 100%, 100% 100%, 100% 0%)`
        }}
      />

      {/* Target Highlight Pulse */}
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute border-2 border-white/50 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.3)] pointer-events-none"
        style={{
          top: coords.top - 8,
          left: coords.left - 8,
          width: coords.width + 16,
          height: coords.height + 16,
        }}
      />

      {/* Tooltip Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute pointer-events-auto"
          style={{
            top: step.position === 'bottom' ? coords.top + coords.height + 24 : step.position === 'top' ? coords.top - 280 : coords.top + (coords.height / 2) - 100,
            left: step.position === 'right' ? coords.left + coords.width + 24 : step.position === 'left' ? coords.left - 344 : Math.max(20, coords.left + (coords.width / 2) - 160),
            width: 320,
          }}
        >
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
              borderRadius: '24px',
              p: 3,
              boxShadow: '0 20px 50px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Glossy Header */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Sparkles size={16} />
              </div>
              <Typography variant="subtitle1" fontWeight={900} color="#1e293b" sx={{ fontSize: '0.95rem' }}>
                {step.title}
              </Typography>
            </div>

            <Typography variant="body2" color="#475569" sx={{ mb: 4, lineHeight: 1.6, fontWeight: 500 }}>
              {step.content}
            </Typography>

            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-4 bg-blue-600' : 'w-1.5 bg-slate-200'}`}
                  />
                ))}
              </div>
              
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <IconButton 
                    size="small" 
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    sx={{ bgcolor: 'slate.50', color: 'slate.400' }}
                  >
                    <ChevronLeft size={18} />
                  </IconButton>
                )}
                {currentStep < TOUR_STEPS.length - 1 ? (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    endIcon={<ChevronRight size={16} />}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 800,
                      bgcolor: '#2563eb',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={onClose}
                    startIcon={<CheckCircle size={16} />}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 800,
                      bgcolor: '#059669',
                      '&:hover': { bgcolor: '#047857' }
                    }}
                  >
                    Finish
                  </Button>
                )}
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
          </Box>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
