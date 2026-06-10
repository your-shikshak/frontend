import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost';

export const api = axios.create({
  baseURL: apiBase,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tutorLeadToken');
  if (token) {
    if (!config.headers) (config as any).headers = {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const message = (error.response?.data as any)?.message || error.message || 'Request failed';
    if (status === 401) {
      localStorage.removeItem('tutorLeadToken');
      toast.error('Session expired. Please login again.');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('Not authorized to perform this action');
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your connection.');
    } else if (message) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

// Types for responses (lightweight)
export type LoginResponse = { token: string; isVerification: boolean };
export type MeResponse = any; // can be typed later

export const tutorLeadAuthAPI = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post('/api/v1/tutor-lead-auth/login', { email, password });
    const token = data?.data?.token as string | undefined;
    const isVerification = data?.data?.isVerification === true;
    if (token) localStorage.setItem('tutorLeadToken', token);
    return { token: token || '', isVerification };
  },
  async getMe(): Promise<MeResponse> {
    const { data } = await api.get('/api/v1/tutor-lead-auth/me');
    return data?.data ?? data;
  },
  async updateMe(payload: any): Promise<void> {
    await api.patch('/api/v1/tutor-lead-auth/me', payload);
  },
};

export const registrationOtpAPI = {
  async send(email: string): Promise<void> {
    await api.post('/api/auth/email-otp/send', { email });
  },
  async verify(email: string, otp: string): Promise<void> {
    await api.post('/api/auth/email-otp/verify', { email, otp });
  },
};

export const tutorLeadAPI = {
  async create(payload: any): Promise<any> {
    const toSend = { ...(payload || {}) };
    if ('confirmPassword' in toSend) delete (toSend as any).confirmPassword;
    const { data } = await api.post('/api/v1/tutor-leads', toSend);
    return data?.data ?? data;
  },
};

export const tutorLeadDocsAPI = {
  async uploadAadhar(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('document', file);
    await api.post('/api/v1/tutor-lead-docs/aadhar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
