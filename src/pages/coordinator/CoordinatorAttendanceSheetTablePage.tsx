import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Tab,
  Tabs,
  Typography,
  Paper,
  Stack,
  TextField,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { FINAL_CLASS_STATUS, PAYMENT_TYPE, USER_ROLES } from '@/constants';
import { getFinalClasses } from '../../services/finalClassService';
import { getAttendanceSheetPayments } from '../../services/attendanceSheetService';
import PaymentStatusChip from '../../components/payments/PaymentStatusChip';
import ErrorAlert from '../../components/common/ErrorAlert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { getClassSessionsForCycle } from '../../services/classSessionService';
import MarkUpcomingAttendanceModal from '../../components/coordinator/MarkUpcomingAttendanceModal';
import AttendanceSheet from '../../components/tutors/AttendanceSheet';


type TabKey = 'upcoming' | 'completed';

type PayoutStatus = {
  status: string;
  amount?: number;
  paymentId?: string;
};

type AttendanceSheetLite = {
  _id?: string;
  id?: string;
  cycleNumber?: number;
  month?: number;
  year?: number;
  totalSessionsPlanned?: number;
  records?: Array<{ _id?: string; id?: string; sessionDate?: string; topicCovered?: string; studentAttendanceStatus?: string; status?: string }>;
};

type SessionRow = {
  id: string;
  type: 'UPCOMING' | 'COMPLETED';
  classId: string;
  className: string;
  studentName: string;
  subject: string;
  sessionDateTimeIso: string;
  timeSlot: string;
  payoutStatus?: PayoutStatus | null;
  finalClass?: any;
};

const ymd = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return ymd(d);
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const CoordinatorAttendanceSheetTablePage: React.FC = () => {
  const user = useSelector(selectCurrentUser);

  const [tab, setTab] = useState<TabKey>('completed');
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [sheets, setSheets] = useState<AttendanceSheetLite[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');

  const [payoutSummary, setPayoutSummary] = useState<PayoutStatus | null>(null);
  const [cycleSessions, setCycleSessions] = useState<any[]>([]);

  // Modal State
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [selectedSessionRow, setSelectedSessionRow] = useState<SessionRow | null>(null);

  // Client-rendered PDF (html2canvas + jsPDF), same mechanism as
  // AttendanceSheetReviewModal on /attendance-sheet-approvals
  const attendanceSheetRef = useRef<{ exportPdf: () => Promise<void> }>(null);

  const coordinatorUserId = (user as any)?.id || (user as any)?._id;

  const loadClasses = async () => {
    if (!coordinatorUserId) return;
    try {
      setLoading(true);
      setError(null);
      const isAdmin = user?.role === USER_ROLES.ADMIN;
      const res = await getFinalClasses(1, 500, { 
        ...(isAdmin ? {} : { coordinatorId: coordinatorUserId }), 
        status: FINAL_CLASS_STATUS.ACTIVE 
      });
      const list = (res.data || []) as any[];
      setClasses(list);
      if (!selectedClassId && list.length > 0) {
        const firstId = String((list[0] as any).id || (list[0] as any)._id || '');
        setSelectedClassId(firstId);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load classes');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClasses();
  }, [coordinatorUserId]);

  const loadSheetsForClass = async () => {
    if (!selectedClassId) {
      setSheets([]);
      setSelectedSheetId('');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/attendance-sheets/class/${selectedClassId}`);
      const list = ((res as any)?.data?.data || (res as any)?.data || []) as AttendanceSheetLite[];
      const normalized = Array.isArray(list) ? list : [];
      normalized.sort((a, b) => Number(b.cycleNumber || 0) - Number(a.cycleNumber || 0));
      setSheets(normalized);

      const first = normalized[0];
      const firstId = first ? String(first._id || first.id || '') : '';
      setSelectedSheetId(firstId);
    } catch (e: any) {
      setSheets([]);
      setSelectedSheetId('');
      setError(e?.response?.data?.message || e?.message || 'Failed to load attendance sheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSheetsForClass();
  }, [selectedClassId]);

  const selectedSheet = useMemo(() => {
    if (!selectedSheetId) return null;
    return sheets.find((s) => String(s._id || s.id || '') === String(selectedSheetId)) || null;
  }, [sheets, selectedSheetId]);

  // Same tutorData/classInfo shape AttendanceSheetReviewModal builds for the
  // AttendanceSheet component, adapted to this page's data (selectedSheet's
  // raw records + the selected class from `classes`).
  const selectedClassForSheet = useMemo(
    () => classes.find((c: any) => String(c.id || c._id) === String(selectedClassId)) || null,
    [classes, selectedClassId]
  );

  const sheetTutorData = useMemo(() => {
    const recs = Array.isArray(selectedSheet?.records) ? (selectedSheet!.records as any[]) : [];
    return {
      attendanceRecords: recs.map((r: any) => {
        const dateObj = r.sessionDate ? new Date(r.sessionDate) : null;
        const yyyyMmDd = dateObj
          ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(
            dateObj.getDate()
          ).padStart(2, '0')}`
          : '';
        return {
          classId: selectedClassId,
          date: yyyyMmDd,
          status: r.status || r.studentAttendanceStatus || '',
          duration: typeof r.durationHours === 'number' ? r.durationHours : 1,
          topicsCovered: r.topicCovered || undefined,
          markedAt: r.submittedAt ? String(r.submittedAt) : r.createdAt ? String(r.createdAt) : '',
        };
      }),
    };
  }, [selectedSheet, selectedClassId]);

  const sheetClassInfo = useMemo(() => {
    const cls: any = selectedClassForSheet || {};
    const subject = Array.isArray(cls.subject)
      ? cls.subject.map((s: any) => (typeof s === 'string' ? s : s?.label || s?.name || 'N/A')).join(', ')
      : String(cls.subject || '');
    return {
      classId: cls.className || selectedClassId,
      studentName: cls.studentName || '',
      subject,
      tutorName: cls.tutor?.name || 'Tutor',
    };
  }, [selectedClassForSheet, selectedClassId]);

  useEffect(() => {
    const loadCycleSessions = async () => {
      if (!coordinatorUserId || (!selectedSheet && sheets.length > 0)) {
        setCycleSessions([]);
        return;
      }
      
      let month: number;
      let year: number;
      
      if (selectedSheet) {
        month = Number((selectedSheet as any).month || 0);
        year = Number((selectedSheet as any).year || 0);
      } else {
        const now = new Date();
        month = now.getMonth() + 1;
        year = now.getFullYear();
      }
      
      if (!month || !year) {
        setCycleSessions([]);
        return;
      }

      try {
        const resp = await getClassSessionsForCycle({ 
          classId: selectedClassId, 
          month, 
          year, 
          ensure: true 
        });
        setCycleSessions(Array.isArray(resp.data) ? resp.data : []);
      } catch {
        setCycleSessions([]);
      }
    };

    void loadCycleSessions();
  }, [coordinatorUserId, selectedSheet, sheets.length]);

  const monthlyLimitForSelectedClass = useMemo(() => {
    if (!selectedClassId) return 0;
    const cls = classes.find((c: any) => String(c.id || c._id) === String(selectedClassId));
    const sheetLimit = Number((selectedSheet as any)?.totalSessionsPlanned || 0);
    if (Number.isFinite(sheetLimit) && sheetLimit > 0) return sheetLimit;
    const nRaw = (cls as any)?.classesPerMonth ?? 0;
    const n = Number(nRaw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [classes, selectedClassId, selectedSheet]);

  const completedForSelectedCycle = useMemo(() => {
    if (!selectedClassId || !selectedSheet) return [] as SessionRow[];
    const cls = classes.find((c: any) => String(c.id || c._id) === String(selectedClassId));
    const fc = cls || {};
    const subject = Array.isArray((fc as any).subject) 
      ? (fc as any).subject.map((s: any) => typeof s === 'string' ? s : s?.label || s?.name || 'N/A').join(', ') 
      : String((fc as any).subject || '');
    const timeSlot = (fc as any)?.schedule?.timeSlot || '';

    const recs = Array.isArray(selectedSheet.records) ? selectedSheet.records : [];
    const rows: SessionRow[] = recs.map((r: any) => ({
      id: String(r._id || r.id || `${selectedSheetId}:${r.sessionDate || ''}`),
      type: 'COMPLETED',
      classId: selectedClassId,
      className: String((fc as any).className || ''),
      studentName: String((fc as any).studentName || ''),
      subject,
      sessionDateTimeIso: String(r.sessionDate || ''),
      timeSlot,
      payoutStatus: null,
      finalClass: fc,
    }));

    rows.sort((a, b) => a.sessionDateTimeIso.localeCompare(b.sessionDateTimeIso));
    return rows;
  }, [classes, selectedClassId, selectedSheet, selectedSheetId]);

  const upcomingForSelectedCycle = useMemo(() => {
    if (!selectedClassId || (!selectedSheet && sheets.length > 0)) return [] as SessionRow[];

    const cls = classes.find((c: any) => String(c.id || c._id) === String(selectedClassId));
    if (!cls) return [];

    const remaining = monthlyLimitForSelectedClass > 0
        ? Math.max(0, monthlyLimitForSelectedClass - completedForSelectedCycle.length)
        : 9999;

    if (remaining <= 0) return [];

    const subject = Array.isArray((cls as any).subject) 
      ? (cls as any).subject.map((s: any) => typeof s === 'string' ? s : s?.label || s?.name || 'N/A').join(', ') 
      : String((cls as any).subject || '');

    const completedKeySet = new Set<string>();
    completedForSelectedCycle.forEach((r) => {
      completedKeySet.add(`${r.classId}::${formatDate(r.sessionDateTimeIso)}`);
    });

    const plannedForClass = (cycleSessions || [])
      .filter((s: any) => {
        const fc = s?.finalClass;
        const gc = s?.groupClass;
        const fcId = String(fc?.id || fc?._id || '');
        const gcId = String(gc?.id || gc?._id || '');
        return String(selectedClassId) === fcId || String(selectedClassId) === gcId;
      })
      .map((s: any) => {
        const d = new Date(s.sessionDate);
        if (Number.isNaN(d.getTime())) return null;
        
        // Use the populated class data from the session if available, 
        // fallback to the 'cls' from the dropdown list
        const classData = s.finalClass || s.groupClass || cls;
        
        return {
          sessionDateTimeIso: d.toISOString(),
          dateKey: ymd(d),
          timeSlot: String(s.timeSlot || (classData as any)?.schedule?.timeSlot || ''),
          classData,
        };
      })
      .filter(Boolean) as Array<{ sessionDateTimeIso: string; dateKey: string; timeSlot: string, classData: any }>;

    plannedForClass.sort((a, b) => a.sessionDateTimeIso.localeCompare(b.sessionDateTimeIso));

    const rows: SessionRow[] = [];
    for (const p of plannedForClass) {
      if (completedKeySet.has(`${selectedClassId}::${p.dateKey}`)) continue;

      rows.push({
        id: `${selectedClassId}::${p.dateKey}`,
        type: 'UPCOMING',
        classId: selectedClassId,
        className: String((cls as any).className || ''),
        studentName: String((cls as any).studentName || ''),
        subject,
        sessionDateTimeIso: p.sessionDateTimeIso,
        timeSlot: p.timeSlot,
        payoutStatus: null,
        finalClass: p.classData,
      });

      if (rows.length >= remaining) break;
    }

    return rows;
  }, [classes, selectedClassId, selectedSheet, sheets.length, monthlyLimitForSelectedClass, completedForSelectedCycle, cycleSessions]);

  const visibleRows = tab === 'upcoming' ? upcomingForSelectedCycle : completedForSelectedCycle;

  const loadPayoutSummary = async () => {
    if (!selectedSheetId) {
      setPayoutSummary(null);
      return;
    }
    try {
      const payRes = await getAttendanceSheetPayments(String(selectedSheetId));
      const payout = (payRes.data || null)?.tutorPayout || null;
      if (!payout) {
        setPayoutSummary(null);
        return;
      }
      setPayoutSummary({
        status: String(payout.status || ''),
        amount: typeof payout.amount === 'number' ? payout.amount : undefined,
        paymentId: String(payout._id || payout.id || ''),
      });
    } catch {
      setPayoutSummary(null);
    }
  };

  useEffect(() => {
    void loadPayoutSummary();
  }, [selectedSheetId]);

  const handleExportPdf = async () => {
    if (!selectedClassId || !selectedSheet) return;
    await attendanceSheetRef.current?.exportPdf();
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'date',
      headerName: 'Date',
      flex: 0.7,
      valueGetter: (_v, row: any) => formatDate(row.sessionDateTimeIso),
    },
    {
      field: 'time',
      headerName: 'Time',
      flex: 0.6,
      valueGetter: (_v, row: any) => row.timeSlot || formatTime(row.sessionDateTimeIso),
    },
    { field: 'studentName', headerName: 'Student', flex: 1 },
    { field: 'subject', headerName: 'Subject', flex: 1 },
    {
      field: 'payout',
      headerName: 'Status',
      flex: 0.8,
      renderCell: (params) => {
          const row = params.row as SessionRow;
          return (
              <Typography variant="body2" color={row.type === 'UPCOMING' ? 'info.main' : 'success.main'}>
                  {row.type}
              </Typography>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      sortable: false,
      renderCell: (params) => {
        const row = params.row as SessionRow;
        if (row.type !== 'UPCOMING') return null;
        return (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedSessionRow(row);
              setMarkModalOpen(true);
            }}
          >
            Mark
          </Button>
        );
      }
    }
  ], []);


  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Coordinator Attendance Sheet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View detailed attendance records and export sheets for your assigned classes.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
              select
              size="small"
              label="Class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              sx={{ minWidth: 260 }}
          >
            {classes.map((c: any) => {
              const id = String(c.id || c._id || '');
              const label = `${c.studentName || 'Student'} • ${c.className || 'Class'}`;
              return (
                <MenuItem key={id} value={id}>
                  {label}
                </MenuItem>
              );
            })}
          </TextField>

          <TextField
              select
              size="small"
              label="Cycle"
              value={selectedSheetId}
              onChange={(e) => setSelectedSheetId(e.target.value)}
              sx={{ width: 160 }}
              disabled={!selectedClassId || sheets.length === 0}
          >
            {sheets.map((s) => {
              const id = String(s._id || s.id || '');
              const cycleNo = Number(s.cycleNumber || 0) || 0;
              const label = cycleNo ? `Cycle ${cycleNo}` : id;
              return (
                <MenuItem key={id} value={id}>
                  {label}
                </MenuItem>
              );
            })}
          </TextField>

          <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportPdf}
              disabled={!selectedClassId || !selectedSheet}
          >
            Download Sheet
          </Button>
        </Stack>
      </Box>

      {/* Hidden off-screen render target for html2canvas/jsPDF export —
          same mechanism as AttendanceSheetReviewModal on /attendance-sheet-approvals */}
      {selectedSheet && (
        <Box sx={{ position: 'absolute', top: -10000, left: -10000 }}>
          <AttendanceSheet
            ref={attendanceSheetRef}
            tutorData={sheetTutorData}
            classInfo={sheetClassInfo}
            sheetNo={selectedSheet.cycleNumber || 1}
          />
        </Box>
      )}

      {selectedClassId && (
        <Box mb={2}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
              <Typography variant="subtitle2" color="text.secondary">
                Tutor Payout Status (for selected cycle)
              </Typography>
              {payoutSummary?.status ? (
                <PaymentStatusChip status={payoutSummary.status} paymentType={PAYMENT_TYPE.TUTOR_PAYOUT} />
              ) : (
                <Typography variant="body2" color="text.secondary">—</Typography>
              )}
            </Stack>
          </Paper>
        </Box>
      )}

      {error && <ErrorAlert error={error} onClose={() => setError(null)} />}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            indicatorColor="primary"
            textColor="primary"
            sx={{ px: 2, pt: 1 }}
        >
          <Tab value="completed" label={`Completed (${completedForSelectedCycle.length})`} />
          <Tab value="upcoming" label={`Upcoming (${upcomingForSelectedCycle.length})`} />
        </Tabs>

        <Box sx={{ height: 560, width: '100%' }}>
          {loading ? (
            <Box sx={{ p: 3 }}>
              <LoadingSpinner message="Loading..." />
            </Box>
          ) : (
            <DataGrid
                rows={visibleRows}
                columns={columns}
                getRowId={(r) => (r as any).id}
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } },
                }}
                sx={{ border: 'none' }}
            />
          )}
        </Box>
      </Paper>

      {selectedSessionRow && (
        <MarkUpcomingAttendanceModal
          open={markModalOpen}
          onClose={() => {
            setMarkModalOpen(false);
            setSelectedSessionRow(null);
          }}
          finalClassId={selectedSessionRow.classId}
          studentName={selectedSessionRow.studentName}
          sessionDate={selectedSessionRow.sessionDateTimeIso}
          initialDuration={
            (selectedSessionRow.finalClass as any)?.classLead?.classDurationHours || 
            (selectedSessionRow as any).groupClass?.classLead?.classDurationHours || 
            1
          }
          onSuccess={() => {
            void loadSheetsForClass();
          }}
        />
      )}
    </Container>

  );
};

export default CoordinatorAttendanceSheetTablePage;
