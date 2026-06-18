import api from './api';

export interface IBanner {
  _id: string;
  imageUrl: string;
  uploaderName: string;
  uploaderRole: 'ADMIN' | 'COORDINATOR';
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export const getBanners = async (): Promise<IBanner[]> => {
  const { data } = await api.get('/api/v1/banners');
  return data.data;
};

export const createBanner = async (formData: FormData): Promise<IBanner> => {
  const { data } = await api.post('/api/v1/banners', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const deleteBanner = async (id: string): Promise<void> => {
  await api.delete(`/api/v1/banners/${id}`);
};
