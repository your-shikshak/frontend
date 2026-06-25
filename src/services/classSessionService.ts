import api from './api';
import { ApiResponse, IClassSession } from '../types';

export const getMyTutorSessionsForCycle = async (params: {
  month: number;
  year: number;
  ensure?: boolean;
}): Promise<ApiResponse<IClassSession[]>> => {
  const qs = new URLSearchParams();
  qs.append('month', String(params.month));
  qs.append('year', String(params.year));
  if (params.ensure) qs.append('ensure', 'true');

  const { data } = await api.get(`/api/class-sessions/tutor/my?${qs.toString()}`);
  return data as ApiResponse<IClassSession[]>;
};

export const getCoordinatorSessionsForCycle = async (params: {
  month: number;
  year: number;
  ensure?: boolean;
}): Promise<ApiResponse<IClassSession[]>> => {
  const qs = new URLSearchParams();
  qs.append('month', String(params.month));
  qs.append('year', String(params.year));
  if (params.ensure) qs.append('ensure', 'true');

  const { data } = await api.get(`/api/class-sessions/coordinator/my?${qs.toString()}`);
  return data as ApiResponse<IClassSession[]>;
};

export const getClassSessionsForCycle = async (params: {
  classId: string;
  month: number;
  year: number;
  ensure?: boolean;
}): Promise<ApiResponse<IClassSession[]>> => {
  const qs = new URLSearchParams();
  qs.append('month', String(params.month));
  qs.append('year', String(params.year));
  if (params.ensure) qs.append('ensure', 'true');

  const { data } = await api.get(`/api/class-sessions/class/${params.classId}?${qs.toString()}`);
  return data as ApiResponse<IClassSession[]>;
};

export const rescheduleSession = async (params: {
  sessionId: string;
  newDate: string;       // ISO date string
  newTimeSlot?: string;  // e.g. "10:00 - 11:00"
}): Promise<ApiResponse<IClassSession>> => {
  const { data } = await api.patch(`/api/class-sessions/${params.sessionId}/reschedule`, {
    newDate: params.newDate,
    ...(params.newTimeSlot ? { newTimeSlot: params.newTimeSlot } : {}),
  });
  return data as ApiResponse<IClassSession>;
};

export default {
  getMyTutorSessionsForCycle,
  getCoordinatorSessionsForCycle,
  getClassSessionsForCycle,
  rescheduleSession,
};
