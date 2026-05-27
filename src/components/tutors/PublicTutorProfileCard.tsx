import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  Paper,
  alpha,
  useTheme,
  Divider,
  Stack,
  Fade,
  Button
} from '@mui/material';
import {
  ShieldCheck,
  Sparkles,
  Award,
  BookOpen,
  MapPin,
  Briefcase,
  Clock,
  ChevronRight,
  Verified,
  GraduationCap,
  Languages,
  Calendar,
  Handshake,
  User,
  Info
} from 'lucide-react';
import { ITutor } from '../../types';

interface PublicTutorProfileCardProps {
  tutor: ITutor;
}

const PublicTutorProfileCard: React.FC<PublicTutorProfileCardProps> = ({ tutor }) => {
  const theme = useTheme();
  const user = tutor.user;
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getFullUrl = (url: string | undefined) => {
    if (!url) return undefined;
    
    // If it's already a full URL with protocol, return it
    if (/^https?:\/\//i.test(url)) return url;
    
    // If it starts with // (protocol-relative), prepend https:
    if (url.startsWith('//')) return `https:${url}`;

    const baseUrlFromEnv = (import.meta as any).env?.VITE_API_BASE_URL;
    const baseUrl = baseUrlFromEnv && baseUrlFromEnv.startsWith('http')
      ? baseUrlFromEnv
      : window.location.origin.replace(':3000', ':5000');

    // If the URL looks like an S3 path (e.g., uploads/tutors/...) and we are on production,
    // but the backend failed to provide a full URL, this is a fallback.
    // However, it's safer to just prepend the baseUrl and let the 404 happen or be handled by the backend fix.
    return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  };

  const profilePhotoDoc = useMemo(() => {
    const docs = Array.isArray(tutor.documents) ? tutor.documents : Object.values(tutor.documents || {});

    // 1. Try exact matches
    const exact = docs.find((d: any) => {
      const type = String(d.documentType || '').toUpperCase().trim();
      return ['PROFILE_PHOTO', 'PROFILE_PHOTOS', 'PROFILE_PICTURE', 'PROFILE_PHOTO_UPLOAD', 'AVATAR'].includes(type);
    });
    if (exact) return exact;

    // 2. Try partial matches or file extensions
    return docs.find((d: any) => {
      const type = String(d.documentType || '').toUpperCase();
      const url = String(d.documentUrl || '').toLowerCase();
      const isImage = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);
      const isProfileType = type.includes('PROFILE') || type.includes('PHOTO') || type.includes('AVATAR');
      const isExcluded = ['AADHAR', 'PAN', 'RESUME', 'DEGREE', 'CERTIFICATE', 'MARKSHEET', 'IDCARD'].some(ex => type.includes(ex));

      return (isProfileType || isImage) && !isExcluded;
    });
  }, [tutor.documents]);

  const profileImageUrl = useMemo(() => {
    const rawUrl = (profilePhotoDoc as any)?.documentUrl;
    const fullUrl = getFullUrl(rawUrl);
    console.log('[PublicTutorProfileCard] Profile Photo Doc:', profilePhotoDoc);
    console.log('[PublicTutorProfileCard] Raw URL:', rawUrl);
    console.log('[PublicTutorProfileCard] Resolved Full URL:', fullUrl);
    return fullUrl;
  }, [profilePhotoDoc]);

  const getTierColor = (tier: string = '') => {
    const t = tier.toUpperCase();
    if (t.includes('GOLD')) return '#f59e0b';
    if (t.includes('SILVER')) return '#94a3b8';
    if (t.includes('BRONZE')) return '#b45309';
    return theme.palette.primary.main;
  };

  const groupedSubjects = useMemo(() => {
    if (!tutor.subjects) return [];

    // Structure: Record<string (Board), { boardName: string, classes: Record<string, { className: string, subjects: string[] }> }>
    const boardGroups: Record<string, { boardName: string, classes: Record<string, { className: string, subjects: string[] }> }> = {};

    tutor.subjects.forEach((sub: any) => {
      if (!sub || typeof sub !== 'object') return;

      const subjectLabel = sub.label || sub.name || 'Subject';
      const className = sub.parent?.label || sub.parent?.name || 'General';
      const boardName = sub.parent?.parent?.label || sub.parent?.parent?.name || 'Other';

      if (!boardGroups[boardName]) {
        boardGroups[boardName] = { boardName, classes: {} };
      }

      if (!boardGroups[boardName].classes[className]) {
        boardGroups[boardName].classes[className] = { className, subjects: [] };
      }

      if (!boardGroups[boardName].classes[className].subjects.includes(subjectLabel)) {
        boardGroups[boardName].classes[className].subjects.push(subjectLabel);
      }
    });

    return Object.values(boardGroups)
      .map(group => ({
        ...group,
        classes: Object.values(group.classes).sort((a, b) => a.className.localeCompare(b.className))
      }))
      .sort((a, b) => a.boardName.localeCompare(b.boardName));
  }, [tutor.subjects]);

  const groupedLocations = useMemo(() => {
    if (!tutor.preferredCities) return [];

    const groups: Record<string, { city: string; areas: string[] }> = {};
    tutor.preferredCities.forEach(city => {
      groups[city] = { city, areas: [] };
    });

    if (tutor.preferredLocations) {
      tutor.preferredLocations.forEach(loc => {
        const cityKey = tutor.preferredCities?.[0] || 'Other';
        if (!groups[cityKey]) groups[cityKey] = { city: cityKey, areas: [] };
        if (!groups[cityKey].areas.includes(loc) && loc.toLowerCase() !== cityKey.toLowerCase()) {
          groups[cityKey].areas.push(loc);
        }
      });
    }
    return Object.values(groups);
  }, [tutor.preferredCities, tutor.preferredLocations]);

  return (
    <Fade in timeout={800}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', spaceY: 4, pb: 12 }}>

        {/* 1. HERO SECTION - Yourshikshak  LIGHT MODE */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 8 },
            borderRadius: '2.5rem',
            background: 'linear-gradient(135deg, #f8faff 0%, #eff6ff 100%)',
            border: '1px solid #f1f5f9',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden',
            mb: 4
          }}
        >
          {/* Animated Background Accents */}
          <Box sx={{ position: 'absolute', top: 0, right: 0, width: 400, height: 400, bgcolor: alpha('#3b82f6', 0.05), borderRadius: '50%', filter: 'blur(100px)', transform: 'translate(30%, -30%)' }} />
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 300, height: 300, bgcolor: alpha('#6366f1', 0.03), borderRadius: '50%', filter: 'blur(80px)', transform: 'translate(-30%, 30%)' }} />

          <Grid container spacing={6} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={profileImageUrl}
                  imgProps={{ crossOrigin: 'anonymous' }}
                  sx={{
                    width: { xs: 154, md: 194 },
                    height: { xs: 154, md: 194 },
                    borderRadius: '2.5rem',
                    boxShadow: '0 25px 40px rgba(0,0,0,0.15)',
                    border: '8px solid white',
                    bgcolor: 'primary.main',
                    transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                >
                  {!profileImageUrl && <User size={64} />}
                </Avatar>
                {tutor.verificationStatus === 'VERIFIED' && (
                  <Box sx={{
                    position: 'absolute',
                    bottom: -10,
                    right: -10,
                    bgcolor: '#10b981',
                    borderRadius: '50%',
                    p: 1.2,
                    boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '4px solid white'
                  }}>
                    <Verified style={{ color: 'white', width: 22, height: 22 }} />
                  </Box>
                )}
              </Box>

              <Chip
                label={`Tier: ${tutor.tier || 'Elite'}`}
                size="small"
                sx={{
                  fontWeight: 900,
                  bgcolor: 'white',
                  color: getTierColor(tutor.tier),
                  border: '1px solid',
                  borderColor: alpha(getTierColor(tutor.tier), 0.2),
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  px: 1.5,
                  py: 2,
                  borderRadius: '1rem',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <Stack spacing={3} alignItems={{ xs: 'center', md: 'flex-start' }}>
                <Box>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 900,
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      color: '#1e293b',
                      letterSpacing: '-0.04em',
                      mb: 1,
                      textAlign: { xs: 'center', md: 'left' }
                    }}
                  >
                    {user?.name}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={2} justifyContent={{ xs: 'center', md: 'flex-start' }}>
                    <Box sx={{ width: 40, height: 2, bgcolor: alpha('#3b82f6', 0.3), borderRadius: '1rem' }} />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: '#2563eb',
                        fontWeight: 900,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase'
                      }}
                    >
                      {tutor.qualifications?.[0] || 'Professional Academician'}
                    </Typography>
                  </Stack>
                </Box>

                <Typography
                  variant="body1"
                  sx={{
                    color: '#475569',
                    fontSize: '1.2rem',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                    borderLeft: '4px solid',
                    borderColor: alpha('#3b82f6', 0.2),
                    pl: 3,
                    py: 1,
                    bgcolor: alpha('#3b82f6', 0.03),
                    borderRadius: '0 1.5rem 1.5rem 0',
                    maxWidth: 700,
                    textAlign: { xs: 'center', md: 'left' }
                  }}
                >
                  "{tutor.bio || 'Dedicated to empowering students through personalized and innovative teaching methodologies.'}"
                </Typography>

                <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                  <Box sx={{ px: 3, py: 1.5, bgcolor: 'white', borderRadius: '1.25rem', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Award size={18} color="#3b82f6" />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '0.05em' }}>{tutor.teacherId}</Typography>
                  </Box>
                  {tutor.isAvailable && (
                    <Box sx={{ px: 3, py: 1.5, bgcolor: 'white', borderRadius: '1.25rem', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)', animation: 'pulse 2s infinite' }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669', letterSpacing: '0.1em', textTransform: 'uppercase' }}> Active now</Typography>
                    </Box>
                  )}
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={4}>
          {/* Main Column: Teaching & Credentials */}
          <Grid item xs={12} lg={8} sx={{ spaceY: 4 }}>
            <Stack spacing={4}>
              {/* Academic Portfolio */}
              <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: '2.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 3, mb: 6 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 2, color: '#1e293b' }}>
                    <Box sx={{ p: 1.25, borderRadius: '1rem', bgcolor: alpha('#3b82f6', 0.05), color: '#2563eb', display: 'flex' }}><BookOpen size={22} /></Box>
                    Academic Portfolio
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {/* Professional Experience */}
                    <Box sx={{ px: 2.5, py: 1.2, bgcolor: '#f8faff', borderRadius: '1.25rem', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <Briefcase size={15} color="#3b82f6" />
                      <Typography variant="caption" sx={{ fontWeight: 900, color: '#475569', textTransform: 'uppercase', fontSize: '10px' }}>
                        {tutor.yearsOfExperience || 0}+ Years Specialist
                      </Typography>
                    </Box>

                    {/* Teaching Hours - Only > 100 */}
                    {(tutor.experienceHours || 0) > 100 && (
                      <Box sx={{ px: 2.5, py: 1.2, bgcolor: alpha('#10b981', 0.03), borderRadius: '1.25rem', border: '1px solid', borderColor: alpha('#10b981', 0.1), display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Clock size={15} color="#10b981" />
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#059669', textTransform: 'uppercase', fontSize: '10px' }}>
                          {Math.floor(tutor.experienceHours || 0)}+ Teaching Hours
                        </Typography>
                      </Box>
                    )}

                    {/* Active Classes - Only > 1 */}
                    {(tutor.classesAssigned || 0) > 1 && (
                      <Box sx={{ px: 2.5, py: 1.2, bgcolor: alpha('#6366f1', 0.03), borderRadius: '1.25rem', border: '1px solid', borderColor: alpha('#6366f1', 0.1), display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <GraduationCap size={15} color="#6366f1" />
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#4f46e5', textTransform: 'uppercase', fontSize: '10px' }}>
                          {tutor.classesAssigned} Active batches
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Grid container spacing={6}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={5}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', mb: 3 }}>Linguistic Fluency</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                          {(tutor.languagesKnown || []).map((lang, idx) => (
                            <Chip key={idx} icon={<Languages size={14} />} label={lang} sx={{ bgcolor: '#f8faff', color: '#1e293b', fontWeight: 800, borderRadius: '0.85rem', border: '1px solid #f1f5f9', px: 0.5 }} />
                          ))}
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', mb: 3 }}>Core Expertise areas</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                          {(tutor.skills || []).map((skill, idx) => (
                            <Chip key={idx} icon={<Sparkles size={14} />} label={skill} sx={{ bgcolor: alpha('#2563eb', 0.05), color: '#2563eb', fontWeight: 800, borderRadius: '0.85rem', border: '1px solid', borderColor: alpha('#2563eb', 0.1), px: 0.5 }} />
                          ))}
                        </Box>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', mb: 3 }}>Verified Qualifications</Typography>
                      <Stack spacing={2.5}>
                        {(tutor.qualifications || []).map((q, idx) => {
                          const label = typeof q === 'string' ? q : (q as any).label || (q as any).name || 'N/A';
                          return (
                            <Box key={idx} sx={{ p: 2.5, borderRadius: '1.5rem', bgcolor: '#f8faff', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.3s', '&:hover': { bgcolor: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', borderColor: alpha('#3b82f6', 0.1) } }}>
                              <Box sx={{ width: 44, height: 44, borderRadius: '1rem', bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}><GraduationCap size={22} /></Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#334155' }}>{label}</Typography>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Service Architecture */}
              <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: '2.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 250, height: 250, bgcolor: alpha('#6366f1', 0.03), borderRadius: '50%', filter: 'blur(50px)', transform: 'translate(40%, -40%)' }} />

                <Typography variant="h5" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 2, color: '#1e293b', mb: 6 }}>
                  <Box sx={{ p: 1.25, borderRadius: '1rem', bgcolor: alpha('#6366f1', 0.05), color: '#4f46e5', display: 'flex' }}><Sparkles size={22} /></Box>
                  Service Architecture
                </Typography>

                <Grid container spacing={6}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={5}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', mb: 3 }}>Pedagogical Scope</Typography>
                        <Stack spacing={3}>
                          {groupedSubjects.map((group, i) => (
                            <Box key={i}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#2563eb',
                                  fontWeight: 900,
                                  textTransform: 'uppercase',
                                  fontSize: '11px',
                                  letterSpacing: '0.1em',
                                  display: 'block',
                                  mb: 1.5,
                                  borderBottom: '1px solid',
                                  borderColor: alpha('#2563eb', 0.1),
                                  pb: 0.5
                                }}
                              >
                                {group.boardName}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                {group.classes.map((cls, idx) => (
                                  <Box key={idx} sx={{
                                    p: 1.5,
                                    borderRadius: '1rem',
                                    bgcolor: alpha('#2563eb', 0.03),
                                    border: '1px solid',
                                    borderColor: alpha('#3b82f6', 0.1),
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.5,
                                    minWidth: 'fit-content'
                                  }}>
                                    <Typography variant="caption" sx={{ fontWeight: 900, color: '#1e293b', fontSize: '0.75rem' }}>
                                      {cls.className}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>
                                      {cls.subjects.join(', ')}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', mb: 3 }}>Preferred Mode</Typography>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, bgcolor: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', px: 3, py: 1.5, borderRadius: '1.25rem', color: 'white' }}>
                          <Handshake size={16} />
                          <Typography variant="caption" sx={{ fontWeight: 900, tracking: '0.15em' }}>{tutor.preferredMode === 'BOTH' ? 'HYBRID INSTRUCTION' : (tutor.preferredMode || 'ONLINE/REMOTE')}</Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Stack spacing={5}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', mb: 3 }}>Operational Jurisdictions</Typography>
                        <Stack spacing={2}>
                          {groupedLocations.map((group, i) => {
                            const isExpanded = expandedSections[group.city];
                            const limit = 8;
                            const hasMore = group.areas.length > limit;
                            const visible = isExpanded ? group.areas : group.areas.slice(0, limit);

                            return (
                              <Box key={i}>
                                <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', mr: 1, borderBottom: '1px solid', borderColor: alpha('#6366f1', 0.2), pb: 0.2 }}>
                                  {group.city}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 700, mt: 1, lineHeight: 1.6 }}>
                                  {group.areas.length > 0 ? visible.join(', ') : 'Whole City / Global'}
                                  {hasMore && (
                                    <Box component="span" sx={{ color: '#4f46e5', ml: 1, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => toggleSection(group.city)}>
                                      {isExpanded ? '(Less)' : `+${group.areas.length - limit} more`}
                                    </Box>
                                  )}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', mb: 3 }}>Availability Pulse</Typography>
                        <Stack spacing={2}>
                          {tutor.settings?.availabilityPreferences?.daysAvailable?.length ? (
                            <Stack direction="row" alignItems="center" spacing={2.5}>
                              <Box sx={{ width: 36, height: 36, borderRadius: '0.75rem', bgcolor: alpha('#10b981', 0.05), color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={18} /></Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#334155' }}>{tutor.settings.availabilityPreferences.daysAvailable.join(', ')}</Typography>
                            </Stack>
                          ) : null}
                          {tutor.settings?.availabilityPreferences?.timeSlots?.length ? (
                            <Stack direction="row" alignItems="center" spacing={2.5}>
                              <Box sx={{ width: 36, height: 36, borderRadius: '0.75rem', bgcolor: alpha('#2563eb', 0.05), color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={18} /></Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#64748b', opacity: 0.8 }}>{tutor.settings.availabilityPreferences.timeSlots.join(' | ')}</Typography>
                            </Stack>
                          ) : null}
                        </Stack>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          </Grid>

          {/* Sidebar Column */}
          <Grid item xs={12} lg={4}>
            
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default PublicTutorProfileCard;

