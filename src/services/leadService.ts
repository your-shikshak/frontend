import api from './api';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse, PaginatedResponse, IClassLead, IClassLeadFormData } from '../types';

export type GetLeadsQuery = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  studentName?: string;
  grade?: string;
  subject?: string;
  board?: string;
  mode?: string;
  createdByName?: string;
  area?: string;
  leadSource?: string;
};

export const getClassLeads = async (
  query: GetLeadsQuery = {}
): Promise<PaginatedResponse<IClassLead[]>> => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', String(query.page));
  if (query.limit) params.append('limit', String(query.limit));
  if (query.status) params.append('status', query.status);
  if (query.search) params.append('search', query.search);
  if (query.sortBy) params.append('sortBy', query.sortBy);
  if (query.sortOrder) params.append('sortOrder', query.sortOrder);
  if (query.studentName) params.append('studentName', query.studentName);
  if (query.grade) params.append('grade', query.grade);
  if (query.subject) params.append('subject', query.subject);
  if (query.board) params.append('board', query.board);
  if (query.mode) params.append('mode', query.mode);
  if (query.createdByName) params.append('createdByName', query.createdByName);
  if (query.area) params.append('area', query.area);
  if (query.leadSource) params.append('leadSource', query.leadSource);
  const url = `${API_ENDPOINTS.LEADS}?${params.toString()}`;
  const { data } = await api.get(url);
  return data as PaginatedResponse<IClassLead[]>;
};

export const getClassLeadById = async (leadId: string): Promise<ApiResponse<IClassLead>> => {
  const { data } = await api.get(`${API_ENDPOINTS.LEADS}/${leadId}`);
  return data as ApiResponse<IClassLead>;
};

export const getPublicLeadById = async (leadId: string): Promise<ApiResponse<IClassLead>> => {
  const { data } = await api.get(`${API_ENDPOINTS.PUBLIC_LEADS}/${leadId}`);
  return data as ApiResponse<IClassLead>;
};

export const createClassLead = async (
  payload: IClassLeadFormData
): Promise<ApiResponse<IClassLead>> => {
  const { data } = await api.post(API_ENDPOINTS.LEADS, payload);
  return data as ApiResponse<IClassLead>;
};

export const updateClassLead = async (
  leadId: string,
  payload: Partial<IClassLeadFormData>
): Promise<ApiResponse<IClassLead>> => {
  const { data } = await api.put(`${API_ENDPOINTS.LEADS}/${leadId}`, payload);
  return data as ApiResponse<IClassLead>;
};

export const updateClassLeadStatus = async (
  leadId: string,
  status: string
): Promise<ApiResponse<IClassLead>> => {
  const { data } = await api.patch(`${API_ENDPOINTS.LEAD_STATUS(leadId)}`, { status });
  return data as ApiResponse<IClassLead>;
};

export const deleteClassLead = async (leadId: string): Promise<ApiResponse<null>> => {
  const { data } = await api.delete(`${API_ENDPOINTS.LEADS}/${leadId}`);
  return data as ApiResponse<null>;
};

export const getMyLeads = async (): Promise<ApiResponse<IClassLead[]>> => {
  const { data } = await api.get(API_ENDPOINTS.LEADS_MY);
  return data as ApiResponse<IClassLead[]>;
};

export const getMyTutorLeads = async (): Promise<ApiResponse<IClassLead[]>> => {
  const { data } = await api.get(API_ENDPOINTS.TUTOR_LEADS_MY);
  return data as ApiResponse<IClassLead[]>;
};

export const getLeadFilterOptions = async (): Promise<ApiResponse<{ 
  grades: string[]; 
  subjects: string[]; 
  boards: string[]; 
  modes: string[];
  sources: string[];
  genders: string[];
  tiers: string[];
  areas: string[]; 
  cities: string[]; 
  creators: string[]; 
  managers: { id: string; name: string }[];
  coordinators: { id: string; name: string }[];
}>> => {
  const { data } = await api.get(`${API_ENDPOINTS.LEADS}/filter-options`);
  return data as ApiResponse<{ 
    grades: string[]; 
    subjects: string[]; 
    boards: string[]; 
    modes: string[];
    sources: string[];
    genders: string[];
    tiers: string[];
    areas: string[]; 
    cities: string[]; 
    preferredTutorGender?: string[];
    creators: string[]; 
    managers: { id: string; name: string }[];
    coordinators: { id: string; name: string }[];
  }>;
};

export const getCRMLeads = async (managerId?: string): Promise<ApiResponse<Record<string, IClassLead[]>>> => {
  const url = managerId ? `${API_ENDPOINTS.LEADS}/crm?managerId=${managerId}` : `${API_ENDPOINTS.LEADS}/crm`;
  const { data } = await api.get(url);
  return data as ApiResponse<Record<string, IClassLead[]>>;
};

export const reassignLead = async (leadId: string, managerId: string): Promise<ApiResponse<IClassLead>> => {
  const { data } = await api.patch(`${API_ENDPOINTS.LEADS}/${leadId}/reassign`, { managerId });
  return data as ApiResponse<IClassLead>;
};

export default {
  getClassLeads,
  getClassLeadById,
  createClassLead,
  updateClassLead,
  updateClassLeadStatus,
  deleteClassLead,
  getMyLeads,
  getMyTutorLeads,
  getLeadFilterOptions,
  getCRMLeads,
  reassignLead,
  getPublicLeadById,
};
