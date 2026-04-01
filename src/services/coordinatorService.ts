import api from './api';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse, PaginatedResponse, ICoordinatorDashboardStats, ICoordinatorTodaysTasks, ICoordinatorPaymentSummary, IPaymentFilters, ICoordinatorProfileMetrics } from '../types';

export const getDashboardStats = async (): Promise<ApiResponse<ICoordinatorDashboardStats>> => {
  const { data } = await api.get(API_ENDPOINTS.COORDINATORS_DASHBOARD_STATS);
  return data as ApiResponse<ICoordinatorDashboardStats>;
};

export const getMyProfile = async (): Promise<ApiResponse<any>> => {
  const { data } = await api.get(API_ENDPOINTS.COORDINATORS_MY_PROFILE);
  return data as ApiResponse<any>;
};

export const getTodaysTasks = async (): Promise<ApiResponse<ICoordinatorTodaysTasks>> => {
  const { data } = await api.get(API_ENDPOINTS.COORDINATORS_DASHBOARD_TASKS);
  return data as ApiResponse<ICoordinatorTodaysTasks>;
};

export const getAssignedClasses = async (
  page: number,
  limit: number,
  status?: string,
  subject?: string,
  grade?: string,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
): Promise<PaginatedResponse<any[]>> => {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (status) params.append('status', status);
  if (subject) params.append('subject', subject);
  if (grade) params.append('grade', grade);
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  const url = `${API_ENDPOINTS.COORDINATORS_ASSIGNED_CLASSES}?${params.toString()}`;
  const { data } = await api.get(url);
  return data as PaginatedResponse<any[]>;
};

export const getPaymentSummary = async (
  filters: IPaymentFilters = { page: 1, limit: 10 }
): Promise<ApiResponse<ICoordinatorPaymentSummary>> => {
  const params = new URLSearchParams();
  if (typeof filters.page !== 'undefined') params.append('page', String(filters.page));
  if (typeof filters.limit !== 'undefined') params.append('limit', String(filters.limit));
  if (filters.status) params.append('status', filters.status);
  if (filters.paymentType) params.append('paymentType', filters.paymentType);
  if (filters.classId) params.append('classId', filters.classId);
  if (filters.fromDate) params.append('fromDate', filters.fromDate);
  if (filters.toDate) params.append('toDate', filters.toDate);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  const url = `${API_ENDPOINTS.COORDINATOR_PAYMENTS_SUMMARY}?${params.toString()}`;
  const { data } = await api.get(url);
  return data as ApiResponse<ICoordinatorPaymentSummary>;
};

export const getProfileMetrics = async (
  fromDate?: string,
  toDate?: string,
  userId?: string
): Promise<ApiResponse<ICoordinatorProfileMetrics>> => {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (userId) params.append('userId', userId);
  const url = `${API_ENDPOINTS.COORDINATOR_PROFILE_METRICS}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await api.get(url);
  return data as ApiResponse<ICoordinatorProfileMetrics>;
};

export const getCoordinatorById = async (id: string): Promise<ApiResponse<any>> => {
  const url = `${API_ENDPOINTS.COORDINATORS}/${id}`;
  const { data } = await api.get(url);
  return data as ApiResponse<any>;
};

export const getCoordinatorByUserId = async (userId: string): Promise<ApiResponse<any>> => {
  const url = `${API_ENDPOINTS.COORDINATORS}/user/${userId}`;
  const { data } = await api.get(url);
  return data as ApiResponse<any>;
};

export const createCoordinator = async (
  payload: { userId: string; specialization?: string[]; maxClassCapacity?: number }
): Promise<ApiResponse<any>> => {
  const { data } = await api.post(API_ENDPOINTS.COORDINATORS, payload);
  return data as ApiResponse<any>;
};

export const getEligibleCoordinatorUsers = async (): Promise<ApiResponse<any[]>> => {
  const { data } = await api.get(`${API_ENDPOINTS.COORDINATORS}/eligible-users`);
  return data as ApiResponse<any[]>;
};

export const getCoordinators = async (
  page = 1,
  limit = 10,
  isActive?: boolean,
  hasCapacity?: boolean,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  name?: string,
  email?: string,
  phone?: string,
  specialization?: string,
  search?: string
): Promise<PaginatedResponse<any[]>> => {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (typeof isActive === 'boolean') params.append('isActive', String(isActive));
  if (typeof hasCapacity === 'boolean') params.append('hasCapacity', String(hasCapacity));
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  if (name) params.append('name', name);
  if (email) params.append('email', email);
  if (phone) params.append('phone', phone);
  if (specialization) params.append('specialization', specialization);
  if (search) params.append('search', search);
  const url = `${API_ENDPOINTS.COORDINATORS}?${params.toString()}`;
  const { data } = await api.get(url);
  return data as PaginatedResponse<any[]>;
};

export const uploadCoordinatorDocument = async (
  coordinatorId: string,
  documentType: string,
  file: File
): Promise<ApiResponse<any>> => {
  const formData = new FormData();
  formData.append('document', file, file.name || 'upload');
  formData.append('documentType', documentType);
  const { data } = await api.post(`${API_ENDPOINTS.COORDINATORS_DOCUMENTS(coordinatorId)}`, formData);
  return data as ApiResponse<any>;
};

export const deleteCoordinatorDocument = async (
  coordinatorId: string,
  documentIndex: number
): Promise<ApiResponse<any>> => {
  const { data } = await api.delete(
    `${API_ENDPOINTS.COORDINATORS_DELETE_DOCUMENT(coordinatorId, documentIndex)}`
  );
  return data as ApiResponse<any>;
};

export const updateCoordinator = async (
  coordinatorId: string,
  updateData: Partial<{ 
    maxClassCapacity: number; 
    specialization: string[]; 
    isActive: boolean;
    bio: string;
    languagesKnown: string[];
    skills: string[];
    permanentAddress: string;
    residentialAddress: string;
  }>
): Promise<ApiResponse<any>> => {
  const { data } = await api.put(`${API_ENDPOINTS.COORDINATORS}/${coordinatorId}`, updateData);
  return data as ApiResponse<any>;
};

export const deleteCoordinator = async (
  coordinatorId: string
): Promise<ApiResponse<boolean>> => {
  const { data } = await api.delete(`${API_ENDPOINTS.COORDINATORS}/${coordinatorId}`);
  return data as ApiResponse<boolean>;
};

export const getPendingCoordinatorVerifications = async (): Promise<ApiResponse<any[]>> => {
  const { data } = await api.get(`${API_ENDPOINTS.COORDINATORS}/pending-verifications`);
  return data as ApiResponse<any[]>;
};

export const updateCoordinatorVerificationStatus = async (
  coordinatorId: string,
  status: 'VERIFIED' | 'REJECTED',
  rejectionReason?: string
): Promise<ApiResponse<any>> => {
  const { data } = await api.patch(`${API_ENDPOINTS.COORDINATORS}/${coordinatorId}/verification-status`, {
    status,
    ...(rejectionReason ? { verificationNotes: rejectionReason } : {}),
  });
  return data as ApiResponse<any>;
};

export const getAllAttendanceSheets = async (): Promise<ApiResponse<any[]>> => {
  const { data } = await api.get(API_ENDPOINTS.ATTENDANCE_SHEETS_COORDINATOR_ALL);
  return data as ApiResponse<any[]>;
};

export const approveAttendanceSheet = async (id: string): Promise<ApiResponse<any>> => {
  const { data } = await api.patch(API_ENDPOINTS.ATTENDANCE_SHEETS_APPROVE(id));
  return data as ApiResponse<any>;
};

export const rejectAttendanceSheet = async (id: string, rejectionReason: string): Promise<ApiResponse<any>> => {
  const { data } = await api.patch(API_ENDPOINTS.ATTENDANCE_SHEETS_REJECT(id), { rejectionReason });
  return data as ApiResponse<any>;
};

export default { 
  getDashboardStats, 
  getTodaysTasks, 
  getAssignedClasses, 
  getPaymentSummary, 
  getProfileMetrics, 
  getMyProfile,
  getCoordinatorByUserId, 
  createCoordinator, 
  getEligibleCoordinatorUsers, 
  getCoordinators, 
  updateCoordinator, 
  deleteCoordinator, 
  getPendingCoordinatorVerifications, 
  updateCoordinatorVerificationStatus,
  getAllAttendanceSheets,
  approveAttendanceSheet,
  rejectAttendanceSheet
};
