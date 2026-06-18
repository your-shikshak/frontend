import api from './api';

export interface ITeacherRequestOption {
  _id: string;
  label: string;
  value: string;
}

export interface ITeacherRequestParent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export type TeacherRequestStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'DEMO_SCHEDULED'
  | 'DEMO_COMPLETED'
  | 'CONVERTED'
  | 'CLOSED';

export interface ITeacherRequest {
  _id: string;
  requestId: string;
  parent: ITeacherRequestParent;
  submitterType?: 'PARENT' | 'STUDENT';
  studentName: string;
  board: ITeacherRequestOption;
  grade: ITeacherRequestOption;
  subjects: ITeacherRequestOption[];
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  preferredDays: string[];
  preferredTimeSlot?: string;
  address?: string;
  city?: string;
  budgetRange?: string;
  notes?: string;
  status: TeacherRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherRequestListResponse {
  success: boolean;
  data: ITeacherRequest[];
  total: number;
  page: number;
  pages: number;
}

export const getAllTeacherRequests = async (filters: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<TeacherRequestListResponse> => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.page)   params.append('page',   String(filters.page));
  if (filters.limit)  params.append('limit',  String(filters.limit));
  // Response shape: { success, data: { data: [...], total, page, pages } }
  const { data: body } = await api.get(`/api/v1/teacher-requests?${params.toString()}`);
  const inner = body?.data ?? body;
  return {
    success: body?.success ?? true,
    data:    Array.isArray(inner?.data) ? inner.data : Array.isArray(inner) ? inner : [],
    total:   inner?.total ?? 0,
    page:    inner?.page  ?? 1,
    pages:   inner?.pages ?? 1,
  };
};

export const updateTeacherRequestStatus = async (
  id: string,
  status: TeacherRequestStatus,
): Promise<void> => {
  await api.patch(`/api/v1/teacher-requests/${id}/status`, { status });
};
