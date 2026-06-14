import api from './api';
import { API_ENDPOINTS } from '../constants';
import {
  ApiResponse,
  PaginatedResponse,
  ITutor,
  ITutorFeedback,
  ITutorPerformanceMetrics,
  ITutorAdvancedAnalytics,
  ISubmitFeedbackFormData,
  IPublicTutorReview,
} from '../types';

export type GetTutorsQuery = {
  page?: number;
  limit?: number;
  verificationStatus?: string;
  isAvailable?: boolean;
  subjects?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  teacherId?: string;
  name?: string;
  email?: string;
  phone?: string;
  preferredMode?: string;
  verifiedBy?: string;
  city?: string;
  area?: string;
  grade?: string;
  board?: string;
};

export const getTutors = async (params: GetTutorsQuery = {}): Promise<PaginatedResponse<ITutor[]>> => {
  const res = await api.get(API_ENDPOINTS.TUTORS, {
    params: {
      ...params,
      subjects: params.subjects?.join(','),
    },
  });
  return res.data;
};

export const getTutorById = async (tutorId: string): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.get(`${API_ENDPOINTS.TUTORS}/${tutorId}`);
  return data as ApiResponse<ITutor>;
};

export const getTutorByUserId = async (userId: string): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.get(`${API_ENDPOINTS.TUTORS}/user/${userId}`);
  return data as ApiResponse<ITutor>;
};

export const getMyProfile = async (): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.get(API_ENDPOINTS.TUTORS_MY_PROFILE);
  return data as ApiResponse<ITutor>;
};

export type CreateTutorPayload = {
  userId: string;
  experienceHours: number;
  subjects: string[];
  qualifications?: string[];
  preferredMode?: string;
  preferredLocations?: string[];
};

export const createTutorProfile = async (
  payload: CreateTutorPayload
): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.post(API_ENDPOINTS.TUTORS, payload);
  return data as ApiResponse<ITutor>;
};

export const updateTutorProfile = async (
  tutorId: string,
  payload: Partial<CreateTutorPayload> & Record<string, any>
): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.put(`${API_ENDPOINTS.TUTORS}/${tutorId}`, payload);
  return data as ApiResponse<ITutor>;
};

export const deleteTutorProfile = async (tutorId: string): Promise<ApiResponse<null>> => {
  const { data } = await api.delete(`${API_ENDPOINTS.TUTORS}/${tutorId}`);
  return data as ApiResponse<null>;
};

export const updateTutorSettings = async (
  tutorId: string,
  settings: { availabilityPreferences?: { daysAvailable?: string[]; timeSlots?: string[] } }
): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.patch(`${API_ENDPOINTS.TUTORS}/${tutorId}/settings`, settings);
  return data as ApiResponse<ITutor>;
};

export const uploadDocument = async (
  tutorId: string,
  documentType: string,
  file: File
): Promise<ApiResponse<ITutor>> => {
  const formData = new FormData();
  formData.append('document', file, file.name || 'upload');
  formData.append('documentType', documentType);
  const { data } = await api.post(`${API_ENDPOINTS.TUTORS_DOCUMENTS(tutorId)}`, formData);
  return data as ApiResponse<ITutor>;
};

export const deleteDocument = async (
  tutorId: string,
  documentIndex: number
): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.delete(
    `${API_ENDPOINTS.TUTORS_DELETE_DOCUMENT(tutorId, documentIndex)}`
  );
  return data as ApiResponse<ITutor>;
};

export const updateVerificationStatus = async (
  tutorId: string,
  status: string,
  verificationNotes?: string,
  whatsappCommunityJoined?: boolean,
  rejectionReason?: string
): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.patch(
    `${API_ENDPOINTS.TUTORS_VERIFICATION_STATUS(tutorId)}`,
    { status, verificationNotes, whatsappCommunityJoined, rejectionReason }
  );
  return data as ApiResponse<ITutor>;
};

export const updateVerificationFeeStatus = async (
  tutorId: string,
  feeStatus: string,
  paymentProof?: File,
  paymentDate?: Date
): Promise<ApiResponse<ITutor>> => {
  const formData = new FormData();
  formData.append('verificationFeeStatus', feeStatus);
  if (paymentDate) {
    formData.append('verificationFeePaymentDate', paymentDate.toISOString());
  }
  if (paymentProof) {
    formData.append('document', paymentProof);
  }

  const { data } = await api.patch(
    `${API_ENDPOINTS.TUTORS}/${tutorId}/verification-fee`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return data as ApiResponse<ITutor>;
};

export const submitVerification = async (tutorId: string): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.post(`${API_ENDPOINTS.TUTORS}/${tutorId}/submit-verification`);
  return data as ApiResponse<ITutor>;
};

export const deductTutorVerificationFee = async (tutorId: string): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.post(API_ENDPOINTS.TUTORS_DEDUCT_VERIFICATION_FEE(tutorId));
  return data as ApiResponse<ITutor>;
};

export const getPendingVerifications = async (): Promise<ApiResponse<ITutor[]>> => {
  const { data } = await api.get(API_ENDPOINTS.TUTORS_PENDING_VERIFICATIONS);
  return data as ApiResponse<ITutor[]>;
};

export const getSubjects = async (): Promise<ApiResponse<string[]>> => {
  const { data } = await api.get(`${API_ENDPOINTS.TUTORS}/subjects`);
  return data as ApiResponse<string[]>;
};

export const getVerifiers = async (): Promise<ApiResponse<{ _id: string; name: string }[]>> => {
  const { data } = await api.get(`${API_ENDPOINTS.TUTORS}/verifiers`);
  return data as ApiResponse<{ _id: string; name: string }[]>;
};
export const getCities = async (): Promise<ApiResponse<string[]>> => {
  const { data } = await api.get(`${API_ENDPOINTS.TUTORS}/cities`);
  return data as ApiResponse<string[]>;
};
export const getAreas = async (): Promise<ApiResponse<string[]>> => {
  const { data } = await api.get(`${API_ENDPOINTS.TUTORS}/areas`);
  return data as ApiResponse<string[]>;
};

export const getTutorsByStatus = async (
  status: string,
  query: { page?: number; limit?: number } = {}
): Promise<PaginatedResponse<ITutor[]>> => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', String(query.page));
  if (query.limit) params.append('limit', String(query.limit));
  const { data } = await api.get(`${API_ENDPOINTS.TUTORS}/status/${status}?${params.toString()}`);
  return data as PaginatedResponse<ITutor[]>;
};

export const requestTierChange = async (
  payload: { tutorId: string; newTier: string; reason?: string }
): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.post(API_ENDPOINTS.TUTORS_TIER_REQUEST, payload);
  return data as ApiResponse<ITutor>;
};

export const approveTierChange = async (
  tutorId: string,
  approve: boolean,
  notes?: string
): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.patch(API_ENDPOINTS.TUTORS_TIER_APPROVE(tutorId), { approve, notes });
  return data as ApiResponse<ITutor>;
};

export const submitTutorFeedback = async (
  payload: ISubmitFeedbackFormData
): Promise<ApiResponse<ITutorFeedback>> => {
  const { data } = await api.post(API_ENDPOINTS.TUTORS_FEEDBACK, payload);
  return data as ApiResponse<ITutorFeedback>;
};

export const getTutorFeedback = async (
  tutorId: string,
  query: { page?: number; limit?: number; month?: string; finalClassId?: string } = {}
): Promise<PaginatedResponse<ITutorFeedback[]>> => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', String(query.page));
  if (query.limit) params.append('limit', String(query.limit));
  if (query.month) params.append('month', query.month);
  if (query.finalClassId) params.append('finalClassId', query.finalClassId);
  const { data } = await api.get(`${API_ENDPOINTS.TUTORS_FEEDBACK_GET(tutorId)}?${params.toString()}`);
  return data as PaginatedResponse<ITutorFeedback[]>;
};

export const getTutorPerformanceMetrics = async (
  tutorId: string
): Promise<ApiResponse<ITutorPerformanceMetrics>> => {
  const { data } = await api.get(API_ENDPOINTS.TUTORS_PERFORMANCE(tutorId));
  return data as ApiResponse<ITutorPerformanceMetrics>;
};

export const getTutorAdvancedAnalytics = async (
  tutorId: string
): Promise<ApiResponse<ITutorAdvancedAnalytics>> => {
  const { data } = await api.get(API_ENDPOINTS.TUTORS_ADVANCED_ANALYTICS(tutorId));
  return data as ApiResponse<ITutorAdvancedAnalytics>;
};

export const getPublicTutorReviews = async (
  teacherId: string,
  query: { page?: number; limit?: number } = {}
): Promise<PaginatedResponse<IPublicTutorReview[]>> => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', String(query.page));
  if (query.limit) params.append('limit', String(query.limit));
  const qs = params.toString();
  const url = qs
    ? `${API_ENDPOINTS.TUTORS_PUBLIC_REVIEWS(teacherId)}?${qs}`
    : API_ENDPOINTS.TUTORS_PUBLIC_REVIEWS(teacherId);
  const { data } = await api.get(url);
  return data as PaginatedResponse<IPublicTutorReview[]>;
};

export const getCoordinatorTutors = async (
  query: { page?: number; limit?: number; tier?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}
): Promise<PaginatedResponse<ITutor[]>> => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', String(query.page));
  if (query.limit) params.append('limit', String(query.limit));
  if (query.tier) params.append('tier', query.tier);
  if (query.sortBy) params.append('sortBy', query.sortBy);
  if (query.sortOrder) params.append('sortOrder', query.sortOrder);
  const { data } = await api.get(`${API_ENDPOINTS.COORDINATOR_TUTORS}?${params.toString()}`);
  return data as PaginatedResponse<ITutor[]>;
};

export const getPublicTutorProfile = async (teacherId: string): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.get(`${API_ENDPOINTS.TUTORS}/public/${teacherId}`);
  return data as ApiResponse<ITutor>;
};

export const getTutorStats = async (tutorId: string): Promise<ApiResponse<any>> => {
  const { data } = await api.get(`${API_ENDPOINTS.TUTORS}/${tutorId}/stats`);
  return data as ApiResponse<any>;
};

export const getMyProfileForEdit = async (): Promise<ApiResponse<any>> => {
  const { data } = await api.get(`${API_ENDPOINTS.TUTORS_MY_PROFILE}/for-edit`);
  return data as ApiResponse<any>;
};

export const updateMyProfile = async (payload: any): Promise<ApiResponse<ITutor>> => {
  const { data } = await api.put(API_ENDPOINTS.TUTORS_MY_PROFILE, payload);
  return data as ApiResponse<ITutor>;
};

export const getMyClasses = async (tutorId: string, status?: string): Promise<ApiResponse<any[]>> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  const { data } = await api.get(`${API_ENDPOINTS.TUTORS}/${tutorId}/classes?${params.toString()}`);
  return data as ApiResponse<any[]>;
};

export const getAttendanceByClass = async (classId: string): Promise<ApiResponse<any[]>> => {
  const { data } = await api.get(`${API_ENDPOINTS.TUTORS}/classes/${classId}/attendance`);
  return data as ApiResponse<any[]>;
};

export const upsertAttendanceSheet = async (classId: string, month: number, year: number): Promise<ApiResponse<any>> => {
  const { data } = await api.post(`${API_ENDPOINTS.TUTORS}/classes/${classId}/attendance-sheet`, { month, year });
  return data as ApiResponse<any>;
};

export const submitAttendanceSheet = async (sheetId: string): Promise<ApiResponse<any>> => {
  const { data } = await api.post(`${API_ENDPOINTS.TUTORS}/attendance-sheets/${sheetId}/submit`);
  return data as ApiResponse<any>;
};

export default {
  getTutors,
  getTutorById,
  getTutorByUserId,
  getMyProfile,
  getMyProfileForEdit,
  updateMyProfile,
  createTutorProfile,
  updateTutorProfile,
  deleteTutorProfile,
  uploadDocument,
  deleteDocument,
  updateVerificationStatus,
  updateVerificationFeeStatus,
  getPendingVerifications,
  getTutorsByStatus,
  requestTierChange,
  approveTierChange,
  submitTutorFeedback,
  getTutorFeedback,
  getTutorPerformanceMetrics,
  getTutorAdvancedAnalytics,
  getCoordinatorTutors,
  getPublicTutorReviews,
  getPublicTutorProfile,
  getTutorStats,
  getSubjects,
  getVerifiers,
  getCities,
  getAreas,
  getMyClasses,
  getAttendanceByClass,
  upsertAttendanceSheet,
  submitAttendanceSheet,
  deductTutorVerificationFee,
};
