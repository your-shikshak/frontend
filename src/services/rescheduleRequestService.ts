import api from './api';

export interface IRescheduleRequest {
  requestId: string;
  classId: string;
  studentName: string;
  className: string;
  subject: { label: string }[];
  schedule?: { timeSlot?: string };
  sessionId: string;
  fromDate: string;
  toDate: string;
  timeSlot: string;
  requestedBy: string;
  requestedAt: string;
}

export const getPendingRescheduleRequests = async (): Promise<{ data: IRescheduleRequest[]; count: number }> => {
  const { data } = await api.get('/api/coordinators/reschedule-requests');
  return data;
};

export const approveRescheduleRequest = async (classId: string, requestId: string): Promise<void> => {
  await api.post(`/api/coordinators/reschedule-requests/${classId}/${requestId}/approve`);
};

export const rejectRescheduleRequest = async (classId: string, requestId: string, reason?: string): Promise<void> => {
  await api.post(`/api/coordinators/reschedule-requests/${classId}/${requestId}/reject`, { reason });
};
