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

export default {
  getMyTutorSessionsForCycle,
  getCoordinatorSessionsForCycle,
  getClassSessionsForCycle,
};
