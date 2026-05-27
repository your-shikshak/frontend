import React, { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell, Paper, Chip, TextField, MenuItem, Stack } from '@mui/material';
import { PAYMENT_STATUS } from '../../constants';

// Local, minimal types matching the template structure.
// You can later swap these to your central types if needed.
export interface AttendanceRecord {
  classId: string;
  date: string; // YYYY-MM-DD
  status: string;
  duration?: number; // in hours
  topicsCovered?: string;
  markedAt?: string; // ISO string
}

export interface AssignedClass {
  classId: string;
  studentName: string;
  subject?: string;
  tutorName?: string;
}

export interface TutorProfile {
  attendanceRecords: AttendanceRecord[];
}

export interface AttendanceSheetProps {
  tutorData: TutorProfile;
  classInfo: AssignedClass;
  range?: { start: string; end: string };
  sheetNo?: number;
  rowsPerPage?: number;
  payments?: { classFees?: any | null; tutorPayout?: any | null };
  canEditPayments?: boolean;
  onUpdatePaymentStatus?: (paymentId: string, status: string) => Promise<void> | void;
}

function toCsvValue(value: string | number | undefined): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function formatMarkedAt(markedAt?: string): string {
  if (!markedAt) return '';
  const d = new Date(markedAt);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}


const AttendanceSheet = forwardRef(function AttendanceSheet(
  { tutorData, classInfo, range, sheetNo = 1, rowsPerPage = 10, payments, canEditPayments = false, onUpdatePaymentStatus }: AttendanceSheetProps,
  ref: React.Ref<{ exportPdf: () => Promise<void> }>
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const records = useMemo(() => {
    return tutorData.attendanceRecords
      .filter((r) => !range || (r.date >= range.start && r.date <= range.end))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [tutorData.attendanceRecords, range]);

  const chunks = useMemo(() => {
    const arr = [];
    for (let i = 0; i < records.length; i += rowsPerPage) {
      arr.push(records.slice(i, i + rowsPerPage));
    }
    if (arr.length === 0) arr.push([]); // Show at least one empty sheet if no records
    return arr;
  }, [records, rowsPerPage]);

  const exportPdf = async () => {
    if (!containerRef.current) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const sheetElements = containerRef.current.querySelectorAll('.physical-sheet');

    for (let i = 0; i < sheetElements.length; i++) {
      const element = sheetElements[i] as HTMLElement;
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = 210; // A4 width in mm
      if (canvas.width === 0) continue; // Skip if empty
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    }

    const blobUrl = pdf.output('bloburl');
    window.open(blobUrl, '_blank');
  };

  useImperativeHandle(ref, () => ({ exportPdf }));

  const today = new Date();
  const formattedToday = `${String(today.getDate()).padStart(2, '0')} / ${String(
    today.getMonth() + 1
  ).padStart(2, '0')} / ${today.getFullYear()}`;

  return (
    <Box ref={containerRef} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {chunks.map((chunk, chunkIndex) => {
        const currentSheetNo = sheetNo + chunkIndex;
        const totalMinutes = chunk.reduce((sum, r) => sum + (r.duration || 0) * 60, 0);
        const totalHours = totalMinutes / 60;
        const totalHoursDisplay = totalHours ? totalHours.toFixed(1) : '0.0';

        return (
          <Box
            key={chunkIndex}
            className="physical-sheet"
            sx={{
              bgcolor: 'common.white',
              p: 6,
              borderRadius: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              border: '1px solid',
              borderColor: 'grey.100',
              boxShadow: 'none',
              width: '210mm',
              minHeight: '297mm',
              position: 'relative',
              boxSizing: 'border-box',
              // Dynamic scaling for mobile to match width perfectly
              '@media screen and (max-width: 800px)': {
                width: '210mm',
                zoom: 'calc(1.05 * 100vw / 794px)', // Over-scale slightly to fill modal space
                transformOrigin: 'top center',
                margin: '0',
                left: '50%',
                transform: 'translateX(-50%)'
              },
              // Firefox fallback
              '@supports not (zoom: 1)': {
                '@media screen and (max-width: 800px)': {
                  transform: 'translateX(-50%) scale(calc(1.05 * 100vw / 794px))',
                  transformOrigin: 'top left',
                }
              },
              '*': {
                letterSpacing: '0.01em !important',
                lineHeight: '1.3 !important',
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif !important'
              },
              '@media print': {
                border: 'none',
                p: 0,
                zoom: '1 !important',
                transform: 'none !important',
              }
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                pb: 1,
                px: 1,
                pt: 0.5,
                color: 'text.primary',
              }}
            >
              <Box
                component="img"
                src="/1.jpg"
                alt="logo"
                sx={{ width: 46, height: 46, objectFit: 'contain' }}
              />
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1 }}>
                  YOUR SHIKSHAK
                </Typography>
                <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                  Your Learning Partner
                </Typography>
              </Box>
            </Box>

            {/* Thin divider under brand header */}
            <Box
              sx={{
                borderBottom: '1px solid',
                borderColor: 'grey.200',
                mt: 1,
              }}
            />

            {/* Centered sheet title */}
            <Typography
              variant="h6"
              align="center"
              sx={{
                fontWeight: 700,
                mt: 1,
                mb: 1,
                fontSize: '1.2rem',
                textTransform: 'uppercase',
                color: 'primary.main'
              }}
            >
              Attendance Sheet
            </Typography>

            {/* Meta info */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                rowGap: 1.5,
                columnGap: 4,
                px: 1,
              }}
            >
              <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  <strong>Tutor Name:</strong> {classInfo.tutorName || '__________'}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  <strong>Class ID:</strong> {classInfo.classId}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  <strong>Sheet No:</strong> {currentSheetNo}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  <strong>Student Name:</strong> {classInfo.studentName}
                </Typography>
              </Box>
              {range && (
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                    <strong>Period:</strong> {range.start} – {range.end}
                  </Typography>
                </Box>
              )}
            </Box>

            {(payments?.classFees || payments?.tutorPayout) && (
              <Box sx={{ px: 1, mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Payment Status
                </Typography>
                <Stack direction="column" spacing={1.25}>
                  {payments?.classFees && (
                    <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Class Fees</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Amount: {payments.classFees?.amount ?? '—'} {payments.classFees?.currency || ''}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          size="small"
                          label={String(payments.classFees?.status || PAYMENT_STATUS.PENDING)}
                          color={String(payments.classFees?.status) === PAYMENT_STATUS.PAID ? 'success' : String(payments.classFees?.status) === PAYMENT_STATUS.OVERDUE ? 'error' : 'warning'}
                          variant="outlined"
                        />
                        {canEditPayments && (payments.classFees?.id || payments.classFees?._id) && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <TextField
                              select
                              size="small"
                              value={String(payments.classFees?.status || PAYMENT_STATUS.PENDING)}
                              onChange={(e) => onUpdatePaymentStatus?.(String(payments.classFees?.id || payments.classFees?._id), e.target.value)}
                              sx={{ minWidth: 140 }}
                            >
                              {Object.values(PAYMENT_STATUS).map((s) => (
                                <MenuItem key={s} value={s}>{s}</MenuItem>
                              ))}
                            </TextField>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}

                  {payments?.tutorPayout && (
                    <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Tutor Payout</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Amount: {payments.tutorPayout?.amount ?? '—'} {payments.tutorPayout?.currency || ''}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          size="small"
                          label={String(payments.tutorPayout?.status || PAYMENT_STATUS.PENDING)}
                          color={String(payments.tutorPayout?.status) === PAYMENT_STATUS.PAID ? 'success' : String(payments.tutorPayout?.status) === PAYMENT_STATUS.OVERDUE ? 'error' : 'warning'}
                          variant="outlined"
                        />
                        {canEditPayments && (payments.tutorPayout?.id || payments.tutorPayout?._id) && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <TextField
                              select
                              size="small"
                              value={String(payments.tutorPayout?.status || PAYMENT_STATUS.PENDING)}
                              onChange={(e) => onUpdatePaymentStatus?.(String(payments.tutorPayout?.id || payments.tutorPayout?._id), e.target.value)}
                              sx={{ minWidth: 140 }}
                            >
                              {Object.values(PAYMENT_STATUS).map((s) => (
                                <MenuItem key={s} value={s}>{s}</MenuItem>
                              ))}
                            </TextField>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}

            {/* Table */}
            <Box component={Paper} variant="outlined" sx={{ overflowX: 'auto', borderRadius: 1, mt: 1 }}>
              <Table size="small" sx={{ '& th': { bgcolor: 'grey.50', fontWeight: 700, borderBottom: '2px solid', borderColor: 'grey.300' }, '& td, & th': { fontSize: '0.85rem', py: 1, borderRight: '1px solid', borderColor: 'grey.200' }, '& td:last-child, & th:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ width: '8%', minWidth: '50px' }}>S. No.</TableCell>
                    <TableCell align="center" sx={{ width: '15%', minWidth: '100px' }}>Date</TableCell>
                    <TableCell align="center" sx={{ width: '12%', minWidth: '80px' }}>Status</TableCell>
                    <TableCell align="center" sx={{ width: '15%', minWidth: '120px' }}>Duration (mins)</TableCell>
                    <TableCell align="center">Topic / Chapter Covered</TableCell>
                    <TableCell align="center" sx={{ width: '18%', minWidth: '140px' }}>Marked At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {chunk.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center">{chunkIndex * rowsPerPage + idx + 1}</TableCell>
                      <TableCell align="center">{r.date ?? ''}</TableCell>
                      <TableCell align="center">{r.status ?? ''}</TableCell>
                      <TableCell align="center">{r.duration ? r.duration * 60 : ''}</TableCell>
                      <TableCell sx={{ px: 2 }}>{r.topicsCovered ?? ''}</TableCell>
                      <TableCell align="center">{formatMarkedAt(r.markedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                mt: 'auto', // Push to bottom
                pb: 2
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Total Teaching Hours: {totalHoursDisplay} hrs</Typography>
              <Typography variant="body2">
                Tutor’s Remarks (if any): __________________________________________________________________
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, mt: 1 }}>
                <Typography variant="body2">Parent’s Final Signature: ______________________</Typography>
                <Typography variant="body2">Date: {formattedToday}</Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
});

export default AttendanceSheet;

