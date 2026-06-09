import api from './api';

export interface IShiftRequest {
  _id: string;
  finalClass: {
    _id: string;
    className?: string;
    studentName?: string;
    schedule?: { daysOfWeek?: string[]; timeSlot?: string };
    classesPerMonth?: number;
  };
  cycleNumber: number;
  requestedBy: { _id: string; name: string; email: string };
  shiftDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: { _id: string; name: string };
  approvedAt?: string;
  rejectionReason?: string;
  appliedAt?: string;
  createdAt: string;
}

export const getPendingShiftRequests = async (): Promise<{ data: IShiftRequest[]; count: number }> => {
  const { data } = await api.get('/api/shift-requests/coordinator/pending');
  return data;
};

export const approveShiftRequest = async (requestId: string): Promise<{ data: IShiftRequest }> => {
  const { data } = await api.put(`/api/shift-requests/${requestId}/approve`);
  return data;
};

export const rejectShiftRequest = async (requestId: string, rejectionReason?: string): Promise<{ data: IShiftRequest }> => {
  const { data } = await api.put(`/api/shift-requests/${requestId}/reject`, { rejectionReason });
  return data;
};
