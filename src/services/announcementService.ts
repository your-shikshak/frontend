import api from './api';
import { API_ENDPOINTS } from '../constants';
import {
  ApiResponse,
  PaginatedResponse,
  IAnnouncement,
  ITutorComparison,
  ICoordinatorAnnouncement,
  ISendAnnouncementFormData,
  ICoordinatorAnnouncementStats,
} from '../types';

export const postAnnouncement = async (
  classLeadId: string
): Promise<ApiResponse<IAnnouncement>> => {
  // Send both keys to be compatible with different backend expectations
  const payload: any = { classLeadId };
  payload.leadId = classLeadId;
  const { data } = await api.post(API_ENDPOINTS.ANNOUNCEMENTS, payload);
  return data as ApiResponse<IAnnouncement>;
};

export const getAnnouncements = async (
  query: { page?: number; limit?: number; isActive?: boolean } = {}
): Promise<PaginatedResponse<IAnnouncement[]>> => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', String(query.page));
  if (query.limit) params.append('limit', String(query.limit));
  if (typeof query.isActive === 'boolean') params.append('isActive', String(query.isActive));
  const url = `${API_ENDPOINTS.ANNOUNCEMENTS}?${params.toString()}`;
  const { data } = await api.get(url);
  return data as PaginatedResponse<IAnnouncement[]>;
};

export const getTutorAvailableAnnouncements = async (
  query: { page?: number; limit?: number; isActive?: boolean } = {}
): Promise<PaginatedResponse<IAnnouncement[]>> => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', String(query.page));
  if (query.limit) params.append('limit', String(query.limit));
  if (typeof query.isActive === 'boolean') params.append('isActive', String(query.isActive));
  const url = `${API_ENDPOINTS.ANNOUNCEMENTS_TUTOR_AVAILABLE}?${params.toString()}`;
  const { data } = await api.get(url);
  return data as PaginatedResponse<IAnnouncement[]>;
};

export const getAnnouncementByLeadId = async (
  classLeadId: string
): Promise<ApiResponse<IAnnouncement>> => {
  const { data } = await api.get(API_ENDPOINTS.ANNOUNCEMENTS_BY_LEAD(classLeadId));
  return data as ApiResponse<IAnnouncement>;
};

export const getInterestedTutors = async (
  announcementId: string
): Promise<ApiResponse<ITutorComparison[]>> => {
  const { data } = await api.get(
    API_ENDPOINTS.ANNOUNCEMENTS_INTERESTED_TUTORS(announcementId)
  );
  return data as ApiResponse<ITutorComparison[]>;
};

export const getRecommendedTutors = async (
  announcementId: string
): Promise<ApiResponse<ITutorComparison[]>> => {
  const { data } = await api.get(
    API_ENDPOINTS.ANNOUNCEMENTS_RECOMMENDED_TUTORS(announcementId)
  );
  return data as ApiResponse<ITutorComparison[]>;
};

export const expressInterest = async (
  announcementId: string,
  notes?: string
): Promise<ApiResponse<IAnnouncement>> => {
  const payload: { notes?: string } = {};
  if (notes) payload.notes = notes;
  const { data } = await api.post(
    API_ENDPOINTS.ANNOUNCEMENTS_EXPRESS_INTEREST(announcementId),
    payload
  );
  return data as ApiResponse<IAnnouncement>;
};

export const getMyExpressedInterests = async (): Promise<{ data: any[]; success: boolean }> => {
  const { data } = await api.get('/api/announcements/tutor/my-interests');
  return data;
};

export const sendAdminBroadcast = async (payload: {
  subject: string;
  message: string;
  recipientGroup: 'ALL_MANAGERS' | 'ALL_COORDINATORS' | 'ALL_TEACHERS' | 'ALL_PARENTS';
}): Promise<{ data: { recipientCount: number; recipientGroup: string } }> => {
  const { data } = await api.post('/api/announcements/admin/broadcast', payload);
  return data;
};

export interface IBroadcastLog {
  _id: string;
  subject: string;
  message: string;
  recipientGroup: string;
  recipientCount: number;
  sentByName: string;
  createdAt: string;
}

export const getBroadcastHistory = async (page = 1, limit = 20): Promise<{ logs: IBroadcastLog[]; total: number }> => {
  const { data } = await api.get(`/api/announcements/admin/broadcast/history?page=${page}&limit=${limit}`);
  return data?.data ?? { logs: [], total: 0 };
};

export const deleteBroadcastLog = async (logId: string): Promise<void> => {
  await api.delete(`/api/announcements/admin/broadcast/${logId}`);
};

export const sendCoordinatorAnnouncement = async (
  payload: ISendAnnouncementFormData
): Promise<ApiResponse<ICoordinatorAnnouncement>> => {
  const { data } = await api.post(API_ENDPOINTS.COORDINATOR_ANNOUNCEMENTS, payload);
  return data as ApiResponse<ICoordinatorAnnouncement>;
};

export const getCoordinatorAnnouncements = async (
  query: { page?: number; limit?: number; recipientType?: string; fromDate?: string; toDate?: string } = {}
): Promise<PaginatedResponse<ICoordinatorAnnouncement[]>> => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', String(query.page));
  if (query.limit) params.append('limit', String(query.limit));
  if (query.recipientType) params.append('recipientType', query.recipientType);
  if (query.fromDate) params.append('fromDate', query.fromDate);
  if (query.toDate) params.append('toDate', query.toDate);
  const url = `${API_ENDPOINTS.COORDINATOR_ANNOUNCEMENTS}?${params.toString()}`;
  const { data } = await api.get(url);
  return data as PaginatedResponse<ICoordinatorAnnouncement[]>;
};

export const getCoordinatorAnnouncementById = async (
  announcementId: string
): Promise<ApiResponse<ICoordinatorAnnouncement>> => {
  const { data } = await api.get(API_ENDPOINTS.COORDINATOR_ANNOUNCEMENT_DETAIL(announcementId));
  return data as ApiResponse<ICoordinatorAnnouncement>;
};

export const getCoordinatorAnnouncementStats = async (): Promise<
  ApiResponse<ICoordinatorAnnouncementStats>
> => {
  const { data } = await api.get(API_ENDPOINTS.COORDINATOR_ANNOUNCEMENTS_STATS);
  return data as ApiResponse<ICoordinatorAnnouncementStats>;
};

export default {
  postAnnouncement,
  getAnnouncements,
  getTutorAvailableAnnouncements,
  getAnnouncementByLeadId,
  getInterestedTutors,
  getRecommendedTutors,
  expressInterest,
  sendCoordinatorAnnouncement,
  getCoordinatorAnnouncements,
  getCoordinatorAnnouncementById,
  getCoordinatorAnnouncementStats,
};
