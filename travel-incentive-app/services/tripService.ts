import api from '../api';
import { TripData, TravelInfo, Photo } from '../types';

export const getUserRegistration = async () => {
  try {
    const res = await api.get('/trip/registration/me');
    return res.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      // Nessuna registrazione trovata
      return null;
    }
    throw error;
  }
};

export const getTripData = async (): Promise<TripData> => {
  const res = await api.get('/trip');
  return res.data;
};

export const getTravelInfo = async (): Promise<TravelInfo> => {
  const res = await api.get('/travel-info');
  return res.data;
};

export const updateTripData = async (data: Partial<TripData>): Promise<TripData> => {
  const res = await api.put('/trip', data);
  return res.data;
};

export const updateTravelInfo = async (data: Partial<TravelInfo>): Promise<TravelInfo> => {
  const res = await api.put('/travel-info', data);
  return res.data;
};

export const addAnnouncement = async (announcement: any) => {
  const res = await api.post('/announcements', announcement);
  return res.data;
};

export const deleteAnnouncement = async (id: string) => {
  const res = await api.delete(`/announcements/${id}`);
  return res.data;
};

export const getDownloadableDocuments = async (): Promise<string[]> => {
  const res = await api.get('/trip/documents');
  return res.data;
};

export const submitRegistration = async (data: any) => {
  const res = await api.post('/trip/registration', data);
  return res.data;
};

export const uploadPhoto = async (photoData: FormData): Promise<Photo[]> => {
  const res = await api.post<Photo[]>('/trip/photos', photoData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const togglePhotoLike = async (photoId: number): Promise<Photo> => {
  const res = await api.post<Photo>(`/trip/photos/${photoId}/like`);
  return res.data;
};

export const deletePhoto = async (photoId: number) => {
  await api.delete(`/trip/photos/${photoId}`);
};

// Document Management
export const getUserDocuments = async (): Promise<any[]> => {
  const res = await api.get('/documents/me');
  return res.data;
};

// Config
export const getConfig = async (): Promise<any> => {
  const res = await api.get('/config');
  return res.data;
};