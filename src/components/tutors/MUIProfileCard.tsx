import { CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, Avatar, Grid, Chip, Divider, Box, Tooltip, alpha, Typography, useTheme, Alert } from '@mui/material';
import {
  User, Phone, Mail, Calendar, MapPin, GraduationCap, Briefcase, Clock,
  FileText, CheckCircle, Star, Award, BookOpen, Languages, Sparkles,
  BarChart2, ShieldCheck, Info, Heart, ExternalLink, CreditCard, Wallet, Handshake,
  ShieldAlert, Eye, ScanLine, XCircle
} from 'lucide-react';
import { ITutor, IDocument } from '../../types';
import { preferTier } from '../../utils/tier';
import { getMyProfile, uploadDocument, getTutorById, updateVerificationFeeStatus } from '../../services/tutorService';
import { useAuth } from '../../hooks/useAuth';
import React, { useEffect, useState, useMemo } from 'react';

import DocumentViewerModal from '../common/DocumentViewerModal';
import { useNavigate } from 'react-router-dom';
import { useOptions } from '../../hooks/useOptions';
import { useDemoMode } from '../../hooks/useDemoMode';

import { PlayCircle, StopCircle } from 'lucide-react';


interface MUIProfileCardProps {
  tutorId?: string;
}

const MUIProfileCard: React.FC<MUIProfileCardProps> = ({ tutorId }) => {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const [tutor, setTutor] = useState<ITutor | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentUploadError, setDocumentUploadError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<IDocument | null>(null);

  // --- Verification Fee Logic ---
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [feeAction, setFeeAction] = useState<'PAY_NOW' | 'DEDUCT' | 'ADMIN_MARK_PAID' | null>(null);
  const [feeFile, setFeeFile] = useState<File | null>(null);
  const [submittingFee, setSubmittingFee] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  const isManager = Boolean(currentUser && currentUser.role === 'MANAGER');
  const isTutorSelf = Boolean(!tutorId && currentUser && currentUser.role === 'TUTOR');
  const VERIFICATION_FEE_AMOUNT = 500; // Matches backend constant

  const { isDemoMode, toggleDemoMode, getDemoTutor } = useDemoMode();


  const displayTutor = useMemo(() => getDemoTutor(tutor), [tutor, isDemoMode]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = tutorId ? await getTutorById(tutorId) : await getMyProfile();
        setTutor(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load tutor profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [tutorId]);

  const navigate = useNavigate();
  const { options: subjectOptions } = useOptions('SUBJECT');

  const formatSubjectLabel = (subject: any) => {
    if (!subject) return '-';
    if (typeof subject === 'string') {
      const found = subjectOptions.find(o => o._id === subject || o.value === subject);
      if (found) return found.label;
      return subject;
    }
    return subject.label || '-';
  };

  const groupedSubjects = useMemo(() => {
    if (!displayTutor || !displayTutor.subjects) return [];

    interface Group {
      parentLabel: string;
      subjects: string[];
    }
    const groups: Record<string, Group> = {};

    displayTutor.subjects.forEach((sub: any) => {
      if (!sub) return;

      let label = '';
      let parentLabel = 'Other';

      if (typeof sub === 'string') {
        const found = subjectOptions.find(o => o._id === sub || o.value === sub);
        label = found ? found.label : sub;

        // Try to find hierarchy from option service (if populated)
        if (found && found.parent) {
          const grade: any = typeof found.parent === 'object' ? found.parent : subjectOptions.find(o => o._id === found.parent);
          if (grade) {
            const board: any = typeof grade.parent === 'object' ? grade.parent : subjectOptions.find(o => o._id === grade.parent);
            parentLabel = board ? `${board.label} • ${grade.label}` : grade.label;
          }
        }
      } else {
        label = sub.label;
        const parts = [];
        let current = sub.parent;
        while (current) {
          parts.unshift(current.label);
          current = current.parent;
        }
        if (parts.length > 0) parentLabel = parts.join(' • ');
      }

      if (!groups[parentLabel]) {
        groups[parentLabel] = { parentLabel, subjects: [] };
      }
      groups[parentLabel].subjects.push(label);
    });

    return Object.values(groups);
  }, [tutor?.subjects, subjectOptions]);
  const { options: cityOptions } = useOptions('CITY');

  const groupedLocations = useMemo(() => {
    if (!displayTutor || !displayTutor.preferredCities) return [];

    interface LocationGroup {
      city: string;
      areas: string[];
    }
    const groups: Record<string, LocationGroup> = {};

    // Initialize groups for all preferred cities
    displayTutor.preferredCities.forEach((city: string) => {
      groups[city] = { city, areas: [] };
    });

    // Attempt to distribute preferred locations among cities
    if (displayTutor.preferredLocations) {
      displayTutor.preferredLocations.forEach((loc: string) => {
        const cityKey = displayTutor.preferredCities?.[0] || 'Other';
        if (!groups[cityKey]) groups[cityKey] = { city: cityKey, areas: [] };

        // Deduplicate and skip if area name matches city name
        if (!groups[cityKey].areas.includes(loc) && loc.toLowerCase() !== cityKey.toLowerCase()) {
          groups[cityKey].areas.push(loc);
        }
      });
    }

    return Object.values(groups).filter(g => g.city !== 'Other' || g.areas.length > 0);
  }, [displayTutor?.preferredCities, displayTutor?.preferredLocations]);

  const resolvedTier = preferTier(displayTutor?.tier, displayTutor?.experienceHours);
  const tierTone = (resolvedTier || '').toUpperCase();

  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});

  const toggleLocations = (city: string) => {
    setExpandedLocations(prev => ({ ...prev, [city]: !prev[city] }));
  };

  useEffect(() => {
    if (displayTutor) {
      console.log('MUIProfileCard Debug:', {
        profileImageUrl: displayTutor.documents?.find(d => d.documentType === 'PROFILE_PHOTO')?.documentUrl,
        hasDocuments: !!displayTutor.documents,
        docCount: displayTutor.documents?.length || 0
      });
    }
  }, [displayTutor]);

  const handleShareProfile = async () => {
    if (!displayTutor) return;
    const teacherId = displayTutor.teacherId || '';
    if (!teacherId) return;
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    const url = `${origin}/ourtutor/${teacherId}`;
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } else {
        window.prompt('Copy this profile link', url);
      }
    } catch {
      window.prompt('Copy this profile link', url);
    }
  };

  if (loading && !displayTutor) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress size={40} thickness={4} />
      </div>
    );
  }

  if (error || !displayTutor) return (
    <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
      <p className="text-red-600 font-medium">{error || 'Tutor not found'}</p>
      <DocumentViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        document={viewingDocument}
      />
    </div>
  );
  const { user } = displayTutor;
  const profilePhotoDoc = (displayTutor.documents || []).find((d) => d.documentType === 'PROFILE_PHOTO');
  const profileImageUrl = profilePhotoDoc?.documentUrl;

  console.log('MUIProfileCard Debug:', {
    profileImageUrl,
    hasDocuments: !!displayTutor.documents?.length,
    docCount: displayTutor.documents?.length
  });

  const initials = (user?.name || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const handleOpenAvatarModal = () => {
    setUploadError(null);
    setSelectedFile(null);
    setAvatarModalOpen(true);
  };

  const handleCloseAvatarModal = () => {
    if (uploadingAvatar) return;
    setAvatarModalOpen(false);
    setSelectedFile(null);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) setUploadError(null);
    // Allow selecting the same file again to re-trigger onChange
    e.target.value = '';
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) {
      setUploadError('Please select an image file to upload.');
      return;
    }
    try {
      setUploadingAvatar(true);
      setUploadError(null);
      const res = await uploadDocument((displayTutor as any).id || displayTutor._id, 'PROFILE_PHOTO', selectedFile);
      setTutor(res.data);
      setAvatarModalOpen(false);
      setSelectedFile(null);
    } catch (e: any) {
      setUploadError(
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        'Failed to upload profile image.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  type DocumentStatus = 'not_uploaded' | 'pending' | 'approved';
  const computeStatusForType = (backendType: string): DocumentStatus => {
    const allDocs = (displayTutor.documents || []).filter((d) => d.documentType === backendType);
    if (!allDocs.length) return 'not_uploaded';
    const anyApproved = allDocs.some((d) => d.verifiedAt);
    if (anyApproved) return 'approved';
    return 'pending';
  };

  const handleOpenViewer = (backendType: string) => {
    const doc = (displayTutor.documents || []).find(d => d.documentType === backendType);
    if (doc) {
      setViewingDocument(doc);
      setViewerOpen(true);
    }
  };

  const docLabels: Record<string, string> = {
    'PROFILE_PHOTO': 'Profile Photo',
    'EXPERIENCE_PROOF': 'Experience Proof',
    'AADHAAR': 'Aadhar Card',
    'CERTIFICATE': 'Qualification Certificate',
    // 'DEGREE': 'Degree Document', // Removed
  };

  const handleOpenDocumentModal = (type: string) => {
    setSelectedDocumentType(type);
    setSelectedDocumentFile(null);
    setDocumentUploadError(null);
    setDocumentModalOpen(true);
  };

  const handleCloseDocumentModal = () => {
    if (uploadingDocument) return;
    setDocumentModalOpen(false);
    setSelectedDocumentFile(null);
  };

  const handleUploadDocumentFile = async () => {
    if (!selectedDocumentFile || !selectedDocumentType) {
      setDocumentUploadError('Please select a file.');
      return;
    }
    try {
      setUploadingDocument(true);
      setDocumentUploadError(null);
      // Map frontend types to backend types if needed, or ensure they match
      // In this case, 'DEGREE' was removed, others match enum in backend if consistent
      const res = await uploadDocument((displayTutor as any).id || displayTutor._id, selectedDocumentType, selectedDocumentFile);
      setTutor(res.data);
      handleCloseDocumentModal();
    } catch (e: any) {
      setDocumentUploadError(e?.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploadingDocument(false);
    }
  };

  // --- Verification Fee Logic ---


  const handleOpenFeeModal = () => {
    setFeeModalOpen(true);
    setFeeAction(null);
    setFeeFile(null);
    setFeeError(null);
  };



  const handleFeeSubmit = async () => {
    if (!displayTutor || !feeAction) return;
    try {
      setSubmittingFee(true);
      setFeeError(null);

      if ((feeAction === 'PAY_NOW' || feeAction === 'DEDUCT') && !isTutorSelf) {
        setFeeError('Only tutors can update their own verification fee status.');
        return;
      }

      if (feeAction === 'ADMIN_MARK_PAID' && !isManager) {
        setFeeError('Only managers can mark verification fee as paid manually.');
        return;
      }


      const feeStatus = (feeAction === 'PAY_NOW' || feeAction === 'ADMIN_MARK_PAID') ? 'PAID' : 'DEDUCT_FROM_FIRST_MONTH';

      const res = await updateVerificationFeeStatus(
        (displayTutor as any).id || displayTutor._id,
        feeStatus,
        feeFile || undefined
      );

      setTutor(res.data);
      setFeeModalOpen(false);
      setFeeAction(null);
      setFeeFile(null);
    } catch (e: any) {
      setFeeError(e?.response?.data?.message || 'Failed to update verification fee status.');
    } finally {
      setSubmittingFee(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 relative">

      
      {/* 1. HERO SECTION - Yourshikshak  LIGHT MODE */}
      <div id="tour-hero" className="relative overflow-hidden bg-gradient-to-br from-[#f8faff] to-[#eff6ff] rounded-[2.5rem] shadow-xl border border-slate-100 transition-all duration-500 hover:shadow-indigo-500/5">
        {/* Animated Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-400/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            {/* Avatar & Tier */}
            <div className="flex flex-col items-center gap-6">
              <div
                className={`group relative w-36 h-36 md:w-48 md:h-48 rounded-[2.5rem] overflow-hidden ring-8 ring-white shadow-2xl transition-all duration-500 ${isTutorSelf ? 'cursor-pointer hover:ring-blue-500/20' : ''}`}
                onClick={isTutorSelf ? handleOpenAvatarModal : undefined}
              >
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={user?.name}
                    crossOrigin="anonymous"
                    onError={(e) => console.error('MUIProfileCard Image Error:', {
                      src: (e.target as HTMLImageElement).src,
                      status: 'Failed to load'
                    })}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0066ff] via-[#2563eb] to-[#3b82f6] flex items-center justify-center">
                    <User className="w-16 h-16 text-white/90" />
                  </div>
                )}
                {isTutorSelf && (
                  <div className="absolute inset-0 bg-[#0066ff]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[4px]">
                    <div className="text-center group-hover:scale-110 transition-transform">
                      <Sparkles className="text-white w-10 h-10 mb-2 mx-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                      <span className="text-white text-[10px] font-black tracking-widest uppercase">Sync Photo</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-5 py-2 rounded-full bg-white border border-slate-100 shadow-md flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${tierTone.includes('GOLD') ? 'bg-amber-400' : tierTone.includes('SILVER') ? 'bg-slate-400' : tierTone.includes('PLATINUM') ? 'bg-indigo-400' : 'bg-orange-500'}`} />
                <span className="text-[10px] font-black tracking-[0.15em] uppercase text-slate-500">
                  Tier: <span className={tierTone.includes('GOLD') ? 'text-amber-600' : tierTone.includes('SILVER') ? 'text-slate-600' : tierTone.includes('PLATINUM') ? 'text-indigo-600' : 'text-orange-600'}>
                    {resolvedTier}
                  </span>
                </span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center md:text-left space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <h1 className="text-4xl md:text-5xl font-extrabold text-[#1e293b] tracking-tight font-['Manrope']" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    {displayTutor?.user?.name}
                  </h1>
                  {displayTutor?.verificationStatus === 'VERIFIED' && (
                    <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-[10px] font-black text-emerald-700 tracking-wider">VERIFIED</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <div className="w-8 h-[2px] bg-blue-600/30 rounded-full" />
                  <p className="text-blue-600 font-extrabold text-sm tracking-[0.1em] uppercase opacity-90 font-['Manrope']">
                    {displayTutor.qualifications?.[0] || "Professional Educator"}
                  </p>
                </div>
                <div className="relative">
                  <p className="text-[#475569] font-medium text-lg max-w-2xl leading-relaxed italic border-l-4 border-blue-500/20 pl-6 py-2 bg-blue-50/30 rounded-r-2xl">
                    "{displayTutor.bio || "Dedicated to empowering students through personalized and innovative teaching methodologies."}"
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8">
                <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
                  <Award className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-extrabold text-[#1e293b] tracking-widest uppercase font-['Manrope']">{displayTutor.teacherId || 'TUT-XXXX'}</span>
                </div>
                <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-[#1e293b] leading-none">{displayTutor.experienceHours || 0}</span>
                    <span className="text-[9px] font-bold text-slate-400 tracking-tighter uppercase mt-0.5">Total Hours</span>
                  </div>
                </div>
                {!tutorId && (
                  <div className="flex gap-2">
                    <Button
                      startIcon={<ExternalLink size={18} />}
                      variant="contained"
                      size="large"
                      onClick={handleShareProfile}
                      sx={{
                        borderRadius: '18px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #0066ff 100%)',
                        color: 'white',
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 800,
                        textTransform: 'none',
                        px: 4,
                        boxShadow: '0 8px 16px rgba(0, 102, 255, 0.2)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1d4ed8 0%, #0052cc 100%)',
                          boxShadow: '0 12px 20px rgba(0, 102, 255, 0.3)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s'
                      }}
                    >
                      {shareCopied ? 'URL Copied!' : 'Share Profile'}
                    </Button>



























                  </div>
                )}
              </div>
            </div>

            {/* Availability Insights */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl min-w-[220px] flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status</span>
                <div className={`w-3 h-3 rounded-full animate-pulse ${displayTutor.isAvailable ? 'bg-emerald-500' : 'bg-red-500'} shadow-[0_0_10px_rgba(16,185,129,0.5)]`} />
              </div>
              <div className="text-center space-y-4">
                <div className="py-2 px-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className={`text-xl font-black font-['Manrope'] ${displayTutor.isAvailable ? 'text-emerald-600' : 'text-red-600'}`}>
                    {displayTutor.isAvailable ? 'ACTIVE' : 'OFF DUTY'}
                  </p>
                </div>
                <Divider sx={{ borderColor: alpha('#64748b', 0.08) }} />
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${displayTutor.whatsappCommunityJoined ? 'bg-blue-500' : 'bg-slate-300'}`} />
                  <p className="text-[10px] font-extrabold text-slate-500 tracking-tight">WHATSAPP COMMUNITY: {displayTutor.whatsappCommunityJoined ? 'JOINED' : 'PENDING'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Grid container spacing={4}>
        {/* 2. STATS OVERVIEW - Yourshikshak  */}
        <Grid item xs={12} id="tour-stats">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { label: 'Assigned', value: displayTutor.classesAssigned, icon: BarChart2, color: '#2563eb', bg: 'bg-blue-50/50' },
              { label: 'Completed', value: displayTutor.classesCompleted, icon: CheckCircle, color: '#059669', bg: 'bg-emerald-50/50' },
              { label: 'Demos', value: displayTutor.demosTaken, icon: Clock, color: '#7c3aed', bg: 'bg-violet-50/50' },
              { label: 'Hours', value: displayTutor.experienceHours || 0, icon: Clock, color: '#d97706', bg: 'bg-amber-50/50' },
              { label: 'Interests', value: displayTutor.interestCount, icon: Heart, color: '#e11d48', bg: 'bg-rose-50/50' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} mb-4 flex items-center justify-center group-hover:rotate-6 transition-all duration-500`} style={{ color: stat.color }}>
                  <stat.icon size={26} strokeWidth={2.5} />
                </div>
                <div className="text-3xl font-black text-[#1e293b] tracking-tight font-['Manrope']">{stat.value}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 font-['Manrope']">{stat.label}</div>
              </div>
            ))}
          </div>
        </Grid>

        {/* 3. LEFT COLUMN: PERSONAL & CONTACT */}
        <Grid item xs={12} lg={4} className="space-y-6" id="tour-contact">
          {/* Contact Details - Yourshikshak  */}
          <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-6">
            <h3 className="text-lg font-black text-[#1e293b] flex items-center gap-3 font-['Manrope']" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Phone size={18} strokeWidth={2.5} />
              </div>
              Contact Network
            </h3>
            <div className="space-y-5">
              {[
                { label: 'Primary Email', value: user?.email, icon: Mail },
                { label: 'Secure WhatsApp', value: user?.phone, icon: Phone },
                { label: 'Emergency Contact', value: displayTutor?.alternatePhone, icon: Phone },
                { label: 'Base Location', value: user?.city, icon: MapPin },
                { label: 'Gender Profile', value: user?.gender?.toLowerCase(), icon: User, capitalize: true },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 mt-1">
                    <item.icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-['Manrope'] mb-0.5">{item.label}</p>
                    <p className={`text-sm font-bold text-[#334155] break-all leading-snug ${item.capitalize ? 'capitalize' : ''}`}>
                      {item.label === 'Primary Email' && item.value 
                        ? item.value.split('@').map((part, idx) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && '@\u200B'}
                              {part}
                            </React.Fragment>
                          ))
                        : (item.value || 'DEFERRED')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Verification Status Card */}
          <section className={`rounded-[2rem] shadow-sm p-8 border ${displayTutor.verificationStatus === 'VERIFIED' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-amber-50/30 border-amber-100'}`}>
            <h3 className="text-lg font-black text-[#1e293b] mb-6 flex items-center gap-3 font-['Manrope']" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <ShieldCheck className={displayTutor.verificationStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'} /> Verification
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-500 font-['Manrope']">Verification Status:</span>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${displayTutor.verificationStatus === 'VERIFIED' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                  }`}>
                  {displayTutor.verificationStatus}
                </span>
              </div>
              {displayTutor.verifiedAt && (
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-500 font-['Manrope']">Authenticated On:</span>
                  <span className="text-slate-700 font-black font-['Manrope'] text-xs opacity-60">{new Date(displayTutor.verifiedAt).toLocaleDateString()}</span>
                </div>
              )}
              {displayTutor.verificationStatus === 'REJECTED' && displayTutor.verificationRejectionReason && (
                <Box mt={2}>
                  <Alert 
                    severity="error" 
                    icon={<XCircle size={20} />}
                    sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'error.light' }}
                  >
                    <Typography variant="caption" fontWeight={800} display="block" sx={{ textTransform: 'uppercase', mb: 0.5 }}>
                      Verification Rejected
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {displayTutor.verificationRejectionReason}
                    </Typography>
                  </Alert>
                </Box>
              )}
              {displayTutor.verificationNotes && (
                <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5 font-['Manrope']">
                    <Info size={12} className="text-blue-500" /> System Remarks
                  </p>
                  <p className="text-xs text-[#475569] font-medium italic leading-relaxed">"{displayTutor.verificationNotes}"</p>
                </div>
              )}
            </div>
          </section>
        </Grid>

        {/* 4. MAIN COLUMN: TEACHING & EXPERIENCE */}
        <Grid item xs={12} lg={8} className="space-y-6" id="tour-portfolio">
          {/* Professional Credentials - Yourshikshak  */}
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-10">
            <div className="flex flex-wrap justify-between items-center gap-6 mb-10">
              <h3 className="text-xl font-black text-[#1e293b] flex items-center gap-3 font-['Manrope']" style={{ fontFamily: "'Manrope', sans-serif" }}>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <BookOpen size={22} strokeWidth={2.5} />
                </div>
                Profile Portfolio
              </h3>
              <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                <Briefcase className="text-blue-500 shadow-xl" size={16} />
                <span className="text-xs font-black text-[#475569] uppercase tracking-wider font-['Manrope']">{displayTutor.yearsOfExperience || 0}+ Years Specialized Experience</span>
              </div>
            </div>

            <Grid container spacing={5}>
              <Grid item xs={12} md={6}>
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-['Manrope']">Linguistic Fluency</p>
                    <div className="flex flex-wrap gap-2.5">
                      {displayTutor.languagesKnown?.length ? displayTutor.languagesKnown.map((lang, idx) => (
                        <Chip key={idx} icon={<Languages size={14} />} label={lang} sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 800, borderRadius: '12px', border: '1px solid #e2e8f0', fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem' }} />
                      )) : <span className="text-slate-400 text-xs italic">Awaiting selection</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-['Manrope']">Distinctive Skillsets</p>
                    <div className="flex flex-wrap gap-2.5">
                      {displayTutor.skills?.length ? displayTutor.skills.map((skill, idx) => (
                        <Chip key={idx} icon={<Sparkles size={14} />} label={skill} sx={{ bgcolor: alpha('#0066ff', 0.05), color: '#0066ff', fontWeight: 800, borderRadius: '12px', border: '1px solid', borderColor: alpha('#0066ff', 0.1), fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem' }} />
                      )) : <span className="text-slate-400 text-xs italic">Awaiting selection</span>}
                    </div>
                  </div>
                </div>
              </Grid>

              <Grid item xs={12} md={6}>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-['Manrope']">Verified Qualifications</p>
                    <div className="space-y-3">
                      {displayTutor.qualifications?.length ? (displayTutor.qualifications as any[]).map((q, idx) => {
                        const label = typeof q === 'string' ? q : (q as any)?.label || (q as any)?.name || 'N/A';
                        return (
                          <div key={`${(q as any)?._id || idx}`} className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-blue-100 group">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                              <GraduationCap size={20} />
                            </div>
                            <span className="text-sm font-black text-[#334155] font-['Manrope'] tracking-tight">{label}</span>
                          </div>
                        );
                      }) : <span className="text-slate-400 text-xs italic">Documentation pending</span>}
                    </div>
                  </div>
                </div>
              </Grid>
            </Grid>
          </section>

          {/* Service Preferences - Yourshikshak  Light Mode */}
          <section className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <h3 className="text-xl font-black text-[#1e293b] mb-8 flex items-center gap-3 relative z-10 font-['Manrope']" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
                <Sparkles size={20} strokeWidth={2.5} />
              </div>
              Academic portfolio
            </h3>

            <Grid container spacing={4} className="relative z-10">
              <Grid item xs={12} md={6} className="space-y-8">
                <div>
                  <p className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] mb-4 font-['Manrope']">Teaching Specializations</p>
                  <div className="flex flex-wrap gap-3">
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                      {groupedSubjects.map((group, i) => {
                        const isExpanded = expandedLocations[`sub_${group.parentLabel}`];
                        const displayLimit = 5;
                        const hasMore = group.subjects.length > displayLimit;
                        const visibleSubjects = isExpanded ? group.subjects : group.subjects.slice(0, displayLimit);

                        return (
                          <Typography key={i} variant="body2" sx={{ fontSize: '13px', lineHeight: 1.5 }}>
                            <Box component="span" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.02em', mr: 1, borderBottom: '1.5px solid', borderColor: alpha(theme.palette.primary.main, 0.2), pb: 0.1 }}>
                              {group.parentLabel}
                            </Box>
                            <Box component="span" sx={{ color: 'slate.600', fontWeight: 600 }}>
                              {visibleSubjects.join(', ')}
                              {hasMore && !isExpanded && (
                                <Box component="span" sx={{ color: 'primary.main', fontWeight: 800, cursor: 'pointer', ml: 1, '&:hover': { textDecoration: 'underline' } }} onClick={() => toggleLocations(`sub_${group.parentLabel}`)}>
                                  + {group.subjects.length - displayLimit} more
                                </Box>
                              )}
                              {isExpanded && (
                                <Box component="span" sx={{ color: 'primary.main', fontWeight: 800, cursor: 'pointer', ml: 1, '&:hover': { textDecoration: 'underline' } }} onClick={() => toggleLocations(`sub_${group.parentLabel}`)}>
                                  (Show less)
                                </Box>
                              )}
                            </Box>
                          </Typography>
                        );
                      })}
                    </Box>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] mb-4 font-['Manrope']">Preferred Methodology</p>
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-[#0066ff] px-6 py-3 rounded-2xl font-black tracking-widest text-[#fff] shadow-lg shadow-blue-500/20 text-xs">
                    <Handshake size={16} />
                    {displayTutor.preferredMode || 'NOT SELECTED'}
                  </div>
                </div>
              </Grid>

              <Grid item xs={12} md={6} className="space-y-8">
                <div>
                  <p className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] mb-4 font-['Manrope']">Operational Jurisdictions</p>
                  <div className="space-y-3">
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                      {groupedLocations.map((group, i) => {
                        const isExpanded = expandedLocations[group.city];
                        const displayLimit = 10;
                        const hasMore = group.areas.length > displayLimit;
                        const visibleAreas = isExpanded ? group.areas : group.areas.slice(0, displayLimit);

                        return (
                          <Typography key={i} variant="body2" sx={{ fontSize: '13px', lineHeight: 1.6 }}>
                            <Box component="span" sx={{ color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.02em', mr: 1, borderBottom: '1.5px solid', borderColor: alpha('#2563eb', 0.2), pb: 0.1 }}>
                              {group.city}
                            </Box>
                            <Box component="span" sx={{ color: 'slate.600', fontWeight: 600 }}>
                              {visibleAreas.length > 0 ? visibleAreas.join(', ') : 'Whole City'}
                              {hasMore && !isExpanded && (
                                <Box component="span" sx={{ color: 'primary.main', fontWeight: 800, cursor: 'pointer', ml: 1, '&:hover': { textDecoration: 'underline' } }} onClick={() => toggleLocations(group.city)}>
                                  + {group.areas.length - displayLimit} more
                                </Box>
                              )}
                              {isExpanded && (
                                <Box component="span" sx={{ color: 'primary.main', fontWeight: 800, cursor: 'pointer', ml: 1, '&:hover': { textDecoration: 'underline' } }} onClick={() => toggleLocations(group.city)}>
                                  (Show less)
                                </Box>
                              )}
                            </Box>
                          </Typography>
                        );
                      })}
                      {(!groupedLocations || groupedLocations.length === 0) && (
                        <Typography variant="caption" sx={{ color: 'slate.400', fontStyle: 'italic' }}>
                          No operational jurisdictions listed
                        </Typography>
                      )}
                    </Box>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] mb-4 font-['Manrope']">Availability Pulse</p>
                  <div className="space-y-3">
                    {displayTutor.settings?.availabilityPreferences?.daysAvailable?.length ? (
                      <div className="flex items-center gap-3 text-sm font-bold text-[#334155]">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                          <Calendar size={16} />
                        </div>
                        <span>{displayTutor.settings.availabilityPreferences.daysAvailable.join(', ')}</span>
                      </div>
                    ) : null}
                    {displayTutor.settings?.availabilityPreferences?.timeSlots?.length ? (
                      <div className="flex items-center gap-3 text-sm font-bold text-[#64748b]">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                          <Clock size={16} />
                        </div>
                        <span className="opacity-80 font-medium">{displayTutor.settings.availabilityPreferences.timeSlots.join(' | ')}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Grid>
            </Grid>
          </section>

          {/* Detailed Addresses - Yourshikshak  */}
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-10">
            <h3 className="text-xl font-black text-[#1e293b] mb-8 flex items-center gap-3 font-['Manrope']" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <MapPin size={22} strokeWidth={2.5} />
              </div>
              Verified Jurisdictions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-dashed border-slate-200 group transition-all hover:bg-white hover:border-rose-200">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-3 font-['Manrope'] tracking-widest">Permanent Residence</p>
                <p className="text-sm font-bold text-[#475569] leading-relaxed font-['Inter']">{displayTutor.permanentAddress || 'Vault record missing'}</p>
              </div>
              <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-dashed border-slate-200 group transition-all hover:bg-white hover:border-rose-200">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-3 font-['Manrope'] tracking-widest">Active Operative Base</p>
                <p className="text-sm font-bold text-[#475569] leading-relaxed font-['Inter']">{displayTutor.residentialAddress || 'Same as primary'}</p>
              </div>
            </div>
          </section>
        </Grid>

        {(displayTutor.verificationStatus === 'VERIFIED' || displayTutor.verificationStatus === 'UNDER_REVIEW' || isTutorSelf) && (
        <Grid item xs={12} id="tour-documents">
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
              <h3 className="text-xl font-black text-[#1e293b] flex items-center gap-3 font-['Manrope']" style={{ fontFamily: "'Manrope', sans-serif" }}>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText size={20} strokeWidth={2.5} />
                </div>
                Verification Documents
              </h3>
              <div className="flex flex-wrap gap-2">
                {/* Start Verification Button - Show only for non-verified tutors viewing their own profile */}
                {isTutorSelf && displayTutor.verificationStatus !== 'VERIFIED' && displayTutor.verificationStatus !== 'UNDER_REVIEW' && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate('/tutor-verification-form')}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      bgcolor: '#6366f1',
                      '&:hover': { bgcolor: '#4f46e5' },
                      px: 2.5,
                    }}
                  >
                    Start Verification
                  </Button>
                )}
                {(displayTutor.verificationStatus === 'VERIFIED' || displayTutor.verificationStatus === 'UNDER_REVIEW') && (
                  <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full uppercase tracking-wider">
                    <ShieldCheck size={14} /> {displayTutor.verificationStatus === 'VERIFIED' ? 'Documents Encrypted & Locked' : 'Verification Submitted'}
                  </span>
                )}
                {displayTutor.verificationFeeStatus === 'PAID' && (
                  <Chip icon={<CheckCircle size={14} />} label="Verification Paid" variant="outlined" sx={{ borderRadius: '12px', fontWeight: 800, fontSize: '0.65rem', color: '#059669', borderColor: '#10b981', bgcolor: '#f0fdf4' }} />
                )}
              </div>
            </div>

            {displayTutor.verificationStatus === 'VERIFIED' && (
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }} gap={3}>
              {Object.entries(docLabels).map(([type, label], idx) => {
                const status = computeStatusForType(type);
                const isVerified = displayTutor.verificationStatus === 'VERIFIED';
                const isThisDocUploaded = status === 'pending' || status === 'approved';
                const canUpload = (isTutorSelf || !tutorId) && !isVerified && (!isThisDocUploaded || (displayTutor.verificationStatus === 'REJECTED'));

                const handleCardClick = () => {
                  if (isThisDocUploaded && !canUpload) {
                    handleOpenViewer(type);
                  } else if (canUpload) {
                    handleOpenDocumentModal(type);
                  }
                };

                return (
                  <div
                    key={idx}
                    onClick={handleCardClick}
                    className={`relative p-6 rounded-[2rem] border-2 transition-all group overflow-hidden ${!isThisDocUploaded && !canUpload ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
                      } ${status === 'approved' ? 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-300' :
                        status === 'pending' ? 'bg-amber-50/30 border-amber-100 hover:border-amber-300' :
                          'bg-slate-50/50 border-slate-100 hover:border-slate-300'
                      }`}
                  >
                    <div className={`p-3 rounded-2xl w-fit mb-4 transition-all ${status === 'approved' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' :
                      status === 'pending' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' :
                        'bg-slate-300 text-white'
                      }`}>
                      {type === 'PROFILE_PHOTO' ? <User size={24} /> :
                        type === 'AADHAAR' ? <ScanLine size={24} /> :
                          type === 'CERTIFICATE' ? <Award size={24} /> :
                            type === 'EXPERIENCE_PROOF' ? <Briefcase size={24} /> :
                              <ShieldCheck size={24} />}
                    </div>
                    <p className="text-[11px] font-black text-[#1e293b] uppercase mb-1 font-['Manrope'] tracking-tight">{label}</p>
                    <p className={`text-[9px] font-black tracking-widest uppercase ${status === 'approved' ? 'text-emerald-600' :
                      status === 'pending' ? 'text-amber-600' :
                        'text-slate-400'
                      }`}>
                      {isVerified ? 'ENCRYPTED' : status === 'pending' ? 'REVIEWING' : status.replace('_', ' ')}
                    </p>
                  </div>
                )
              })}
              {/* Verification Fee Card */}
              <div
                onClick={(displayTutor.verificationFeeStatus === 'PAID' || displayTutor.verificationFeeStatus === 'DEDUCT_FROM_FIRST_MONTH') && !isManager ? undefined : handleOpenFeeModal}
                className={`relative p-6 rounded-[2rem] border-2 transition-all group overflow-hidden ${(displayTutor.verificationFeeStatus === 'PAID' || displayTutor.verificationFeeStatus === 'DEDUCT_FROM_FIRST_MONTH') && !isManager ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
                  } ${displayTutor.verificationFeeStatus === 'PAID' ? 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-300' :
                    displayTutor.verificationFeeStatus === 'DEDUCT_FROM_FIRST_MONTH' ? 'bg-indigo-50/30 border-indigo-100 hover:border-indigo-300' :
                      'bg-slate-50/50 border-slate-100 hover:border-slate-300'
                  }`}
              >
                <div className={`p-3 rounded-2xl w-fit mb-4 transition-all ${displayTutor.verificationFeeStatus === 'PAID' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' :
                  displayTutor.verificationFeeStatus === 'DEDUCT_FROM_FIRST_MONTH' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200' :
                    'bg-slate-300 text-white'
                  }`}>
                  <CreditCard size={24} />
                </div>
                <p className="text-[11px] font-black text-[#1e293b] uppercase mb-1 font-['Manrope'] tracking-tight">System Fee</p>
                <p className={`text-[9px] font-black tracking-widest uppercase ${displayTutor.verificationFeeStatus === 'PAID' ? 'text-emerald-600' :
                  displayTutor.verificationFeeStatus === 'DEDUCT_FROM_FIRST_MONTH' ? 'text-indigo-600' :
                    'text-slate-400'
                  }`}>
                  {displayTutor.verificationFeeStatus === 'PAID' ? 'SETTLED' :
                    displayTutor.verificationFeeStatus === 'DEDUCT_FROM_FIRST_MONTH' ? 'DEFERRED' :
                      'REQUIRED'}
                </p>
              </div>
            </Box>
            )}
          </section>
        </Grid>
        )}
      </Grid>

      {/* MODALS */}
      {/* ... Avatar Dialog ... */}
      <Dialog open={avatarModalOpen} onClose={handleCloseAvatarModal} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '32px', p: 1 } }}>
        <DialogTitle className="font-black text-center text-slate-800">Refresh Identity</DialogTitle>
        <DialogContent className="text-center">
          <Avatar sx={{ width: 120, height: 120, mx: 'auto', my: 3, bgcolor: '#2563eb' }} src={profileImageUrl}>{initials}</Avatar>
          <Button variant="outlined" component="label" sx={{ borderRadius: '16px', px: 4 }}>
            SELECT PHOTO <input hidden type="file" accept="image/*" onChange={handleAvatarFileChange} />
          </Button>
          {selectedFile && <p className="mt-4 text-xs font-bold text-blue-600">{selectedFile.name}</p>}
          {uploadError && <p className="text-red-500 text-xs mt-2">{uploadError}</p>}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 3 }}>
          <Button onClick={handleCloseAvatarModal} sx={{ color: 'slate.400' }}>Cancel</Button>
          <Button variant="contained" disabled={!selectedFile || uploadingAvatar} onClick={handleUploadAvatar} sx={{ borderRadius: '16px', px: 6 }}>
            {uploadingAvatar ? 'UPLOADING...' : 'SAVE'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ... Document Dialog ... */}
      <Dialog open={documentModalOpen} onClose={handleCloseDocumentModal} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '32px', p: 1 } }}>
        <DialogTitle className="font-black text-slate-800">Compliance Upload</DialogTitle>
        <DialogContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <p className="text-sm font-bold text-slate-600 mb-2">Target: {docLabels[selectedDocumentType as keyof typeof docLabels]}</p>
            <Button variant="contained" component="label" size="small" sx={{ borderRadius: '12px' }}>
              CHOOSE FILE <input hidden type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setSelectedDocumentFile(e.target.files?.[0] || null)} />
            </Button>
            {selectedDocumentFile && <p className="text-xs mt-2 font-mono">{selectedDocumentFile.name}</p>}
          </div>
          {documentUploadError && <p className="text-red-500 text-xs text-center">{documentUploadError}</p>}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 3 }}>
          <Button onClick={handleCloseDocumentModal}>Close</Button>
          <Button variant="contained" color="secondary" disabled={!selectedDocumentFile || uploadingDocument} onClick={handleUploadDocumentFile} sx={{ borderRadius: '16px' }}>
            {uploadingDocument ? 'UPLOADING...' : 'UPLOAD NOW'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verification Fee Modal */}
      <Dialog open={feeModalOpen} onClose={() => setFeeModalOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '32px', p: 2 } }}>
        <DialogTitle className="font-black text-center text-slate-800 text-2xl">Verification Fees</DialogTitle>
        <DialogContent className="space-y-6 pt-4">
          {!feeAction ? (
            <Box>
              {isManager && (
                <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-slate-800 font-black text-sm uppercase">
                    <ShieldAlert size={18} className="text-indigo-600" /> Admin / Staff Action
                  </div>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    onClick={() => setFeeAction('ADMIN_MARK_PAID')}
                    sx={{ borderRadius: '12px', py: 1.5, fontWeight: 800 }}
                  >
                    MARK AS PAID MANUALLY
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={isTutorSelf ? () => setFeeAction('PAY_NOW') : undefined}
                  className={`p-6 rounded-3xl bg-blue-50 border-2 border-blue-100 transition-all flex flex-col items-center text-center gap-4 group ${isTutorSelf ? 'hover:border-blue-400 cursor-pointer hover:scale-105' : 'opacity-50 cursor-not-allowed'
                    }`}
                >
                  <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <CreditCard size={32} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg">Pay Now (₹{VERIFICATION_FEE_AMOUNT})</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">Scan QR & Upload Screenshot</p>
                  </div>
                </div>
                <div
                  onClick={isTutorSelf ? () => setFeeAction('DEDUCT') : undefined}
                  className={`p-6 rounded-3xl bg-amber-50 border-2 border-amber-100 transition-all flex flex-col items-center text-center gap-4 group ${isTutorSelf ? 'hover:border-amber-400 cursor-pointer hover:scale-105' : 'opacity-50 cursor-not-allowed'
                    }`}
                >
                  <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center group-hover:-rotate-12 transition-transform">
                    <Wallet size={32} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg">Pay Later (₹{VERIFICATION_FEE_AMOUNT + 200})</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">Deduct from 1st Month Salary</p>
                  </div>
                </div>
              </div>
            </Box>
          ) : feeAction === 'PAY_NOW' ? (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block shadow-lg">
                {/* Verification QR */}
                <img src="/verification-qr.png" alt="Payment QR" className="w-40 h-40 mx-auto" />
                {/* Old dynamic QR - kept for future payment gateway integration reference if needed */}
                {/* <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=example@upi&pn=YourShikshak" alt="Payment QR" className="w-40 h-40 mx-auto" /> */}
              </div>
              <p className="text-sm text-slate-500 font-bold">Scan to Pay Subscription Fee</p>

              <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Button variant="outlined" component="label" fullWidth sx={{ borderRadius: '12px', height: '50px', borderStyle: 'dashed' }}>
                  {feeFile ? 'CHANGE SCREENSHOT' : 'UPLOAD PAYMENT SCREENSHOT'}
                  <input hidden type="file" accept="image/*" onChange={(e) => setFeeFile(e.target.files?.[0] || null)} />
                </Button>
                {feeFile && <p className="mt-2 text-sm font-bold text-green-600 flex items-center justify-center gap-2"><CheckCircle size={14} /> {feeFile.name}</p>}
              </div>
            </div>
          ) : feeAction === 'DEDUCT' ? (
            <div className="text-center space-y-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Handshake size={40} />
              </div>
              <h4 className="text-xl font-bold text-slate-800">Confirm Deduction?</h4>
              <p className="text-slate-500 max-w-xs mx-auto">
                We will verify your documents and deduct the verification fee automatically from your first payout.
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={40} />
              </div>
              <h4 className="text-xl font-bold text-slate-800">Admin: Mark as Paid?</h4>
              <p className="text-slate-500 max-w-xs mx-auto">
                Confirm that this tutor has paid the verification fee of ₹{VERIFICATION_FEE_AMOUNT} through an offline channel or verified previous proof.
              </p>
            </div>
          )}

          {feeError && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold text-center">{feeError}</div>}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, justifyContent: 'center', gap: 2 }}>
          {feeAction ? (
            <>
              <Button onClick={() => setFeeAction(null)} sx={{ borderRadius: '12px', px: 3, color: 'slate.500' }}>Back</Button>
              <Button
                variant="contained"
                onClick={handleFeeSubmit}
                disabled={
                  submittingFee ||
                  (feeAction === 'PAY_NOW' && !feeFile) ||
                  ((feeAction === 'PAY_NOW' || feeAction === 'DEDUCT') && !isTutorSelf) ||
                  (feeAction === 'ADMIN_MARK_PAID' && !isManager)
                }
                sx={{ borderRadius: '12px', px: 6, py: 1.5, fontWeight: 800, bgcolor: feeAction === 'PAY_NOW' ? 'primary.main' : feeAction === 'DEDUCT' ? 'warning.main' : 'success.main' }}
              >
                {submittingFee ? <CircularProgress size={20} color="inherit" /> : 'CONFIRM CHOICE'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setFeeModalOpen(false)} sx={{ borderRadius: '12px', px: 4, color: 'slate.400' }}>Cancel</Button>
          )}
        </DialogActions>
      </Dialog>
      <DocumentViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        document={viewingDocument}
      />
      {/* Exit Demo FAB */}
      
    </div >
  );
};

export default MUIProfileCard;
