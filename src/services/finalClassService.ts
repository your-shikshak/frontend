import api from './api';
import { PaginatedResponse, IFinalClass, ApiResponse } from '../types';

export const getMyClasses = async (
  tutorId: string,
  status?: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<IFinalClass[]>> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('page', String(page));
  params.append('limit', String(limit));
  const base = `/api/final-classes/tutor/${tutorId}`;
  const url = `${base}?${params.toString()}`;
  const { data } = await api.get(url);
  return data as PaginatedResponse<IFinalClass[]>;
};

export const getFinalClasses = async (
  page: number = 1,
  limit: number = 10,
  filters: { status?: string; coordinatorId?: string; tutorId?: string; sortBy?: string; sortOrder?: string; search?: string; noCoordinator?: boolean } = {}
): Promise<PaginatedResponse<IFinalClass[]>> => {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.coordinatorId) params.append('coordinatorId', filters.coordinatorId);
  if (filters.tutorId) params.append('tutorId', filters.tutorId);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  if (filters.search) params.append('search', filters.search);
  if (filters.noCoordinator) params.append('noCoordinator', 'true');

  const { data } = await api.get(`/api/final-classes?${params.toString()}`);
  return data as PaginatedResponse<IFinalClass[]>;
};

export const updateFinalClassSchedule = async (
  classId: string,
  schedule: { startDate?: string; daysOfWeek: string[]; timeSlot: string }
): Promise<ApiResponse<IFinalClass>> => {
  const { data } = await api.put(`/api/final-classes/${classId}`, { schedule });
  return data as ApiResponse<IFinalClass>;
};

export const createOneTimeReschedule = async (
  classId: string,
  payload: { fromDate: string; toDate?: string; timeSlot: string }
): Promise<ApiResponse<IFinalClass>> => {
  const { data } = await api.post(`/api/final-classes/${classId}/reschedule`, payload);
  return data as ApiResponse<IFinalClass>;
};

export const requestParentReschedule = async (classId: string): Promise<ApiResponse<null>> => {
  const { data } = await api.post(`/api/final-classes/${classId}/parent-reschedule`);
  return data as ApiResponse<null>;
};

export const getUnassignedClasses = async (): Promise<PaginatedResponse<IFinalClass[]>> => {
	const params = new URLSearchParams();
	params.append('noCoordinator', 'true');
	params.append('page', '1');
	params.append('limit', '100');
	const url = `/api/final-classes?${params.toString()}`;
	const { data } = await api.get(url);
	return data as PaginatedResponse<IFinalClass[]>;
};

export const assignCoordinatorToClass = async (
	classId: string,
	coordinatorUserId: string
): Promise<ApiResponse<IFinalClass>> => {
	const { data } = await api.put(`/api/final-classes/${classId}`, { coordinatorUserId });
	return data as ApiResponse<IFinalClass>;
};

export const updateClassTestsPerMonth = async (
  classId: string,
  testPerMonth: number
): Promise<ApiResponse<IFinalClass>> => {
  const { data } = await api.put(`/api/final-classes/${classId}`, { testPerMonth });
  return data as ApiResponse<IFinalClass>;
};

export const updateTestPerMonth = async (
  classId: string,
  testPerMonth: number
): Promise<ApiResponse<IFinalClass>> => {
  const { data } = await api.put(`/api/final-classes/${classId}`, { testPerMonth });
  return data as ApiResponse<IFinalClass>;
};

export const updateAttendanceSubmissionWindow = async (
  classId: string,
  attendanceSubmissionWindow: number
): Promise<ApiResponse<IFinalClass>> => {
  const { data } = await api.put(`/api/final-classes/${classId}`, { attendanceSubmissionWindow });
  return data as ApiResponse<IFinalClass>;
};

export const getFinalClass = async (classId: string): Promise<ApiResponse<IFinalClass>> => {
  const { data } = await api.get(`/api/final-classes/${classId}`);
  return data as ApiResponse<IFinalClass>;
};

export const updateClassStatus = async (
  classId: string,
  status: string,
  actualEndDate?: string
): Promise<ApiResponse<IFinalClass>> => {
  const { data } = await api.patch(`/api/final-classes/${classId}/status`, { status, actualEndDate });
  return data as ApiResponse<IFinalClass>;
};

export const downloadAttendancePdf = async (classId: string, start?: string, end?: string) => {
  const params = new URLSearchParams();
  if (start) params.append('start', start);
  if (end) params.append('end', end);
  
  const response = await api.get(`/api/attendance/class/${classId}/export-pdf?${params.toString()}`, {
    responseType: 'blob',
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `attendance-${classId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const updateClassProgress = async (
  classId: string,
  completedSessions: number
): Promise<ApiResponse<IFinalClass>> => {
  const { data } = await api.patch(`/api/final-classes/${classId}/progress`, { completedSessions });
  return data as ApiResponse<IFinalClass>;
};

export const changeTutor = async (
  classId: string,
  newTutorUserId: string,
  reason?: string
): Promise<ApiResponse<IFinalClass>> => {
  const { data } = await api.post(`/api/final-classes/${classId}/change-tutor`, { newTutorUserId, reason });
  return data as ApiResponse<IFinalClass>;
};

export const recordTutorLeaving = async (
  classId: string,
  reason?: string
): Promise<ApiResponse<IFinalClass>> => {
  const { data } = await api.post(`/api/final-classes/${classId}/tutor-leaving`, { reason });
  return data as ApiResponse<IFinalClass>;
};

export const repostAsLead = async (classId: string): Promise<ApiResponse<any>> => {
  const { data } = await api.post(`/api/final-classes/${classId}/repost-lead`);
  return data as ApiResponse<any>;
};

export const renewClass = async (
  classId: string,
  payload?: { monthlyFee?: number; sessionsPerMonth?: number; attendanceSheetId?: string }
): Promise<ApiResponse<any>> => {
  const { data } = await api.post(`/api/final-classes/${classId}/renew`, payload || {});
  return data as ApiResponse<any>;
};

export interface PendingCycleClass {
  _id: string;
  className: string;
  studentName: string;
  classesPerMonth: number;
  currentCycleNumber: number;
  schedule?: { daysOfWeek?: string[]; timeSlot?: string };
}

export const getPendingCycleStarts = async (): Promise<ApiResponse<PendingCycleClass[]>> => {
  const { data } = await api.get('/api/final-classes/tutor/pending-cycle-start');
  return data as ApiResponse<PendingCycleClass[]>;
};

export const setCycleStartDate = async (
  classId: string,
  startDate: string,
): Promise<ApiResponse<any>> => {
  const { data } = await api.post(`/api/final-classes/${classId}/start-cycle`, { startDate });
  return data as ApiResponse<any>;
};

export default {
	getMyClasses,
	getFinalClasses,
  getFinalClass,
	updateFinalClassSchedule,
  updateClassStatus,
  updateClassProgress,
	createOneTimeReschedule,
	requestParentReschedule,
	getUnassignedClasses,
	assignCoordinatorToClass,
	updateClassTestsPerMonth,
  updateTestPerMonth,
  updateAttendanceSubmissionWindow,
  downloadAttendancePdf,
  	changeTutor,
	recordTutorLeaving,
	repostAsLead,
	renewClass,
};
