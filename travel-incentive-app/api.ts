import axios from 'axios';
import { Photo, Profile, TravelInfo, TripData } from './types';

const backendEnv = (import.meta as any)?.env?.VITE_BACKEND_URL as string | undefined;
const resolvedBase = backendEnv && backendEnv.length > 0
  ? `${backendEnv.replace(/\/+$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: resolvedBase,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Interceptor to add the token to every request if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Checking token for request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      token: token ? token.substring(0, 10) + '...' : null
    });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Headers after adding token:', config.headers);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isRegistration404 =
      error.response?.status === 404 &&
      error.config?.url?.includes('/trip/registration/me');

    if (error.response?.status === 401) {
      // Don't trigger a full page redirect here because it will abort
      // any in-flight requests (they show as "cancelled" in the network tab)
      // and can create a redirect loop during the login flow.
      console.warn('API returned 401 for request, removing token but not redirecting:', {
        url: error.config?.url,
        method: error.config?.method,
      });
      localStorage.removeItem('token');
      // Let the application (Auth hook / components) decide how to handle the 401
      // (for example by calling the centralized `logout` that will redirect once).
    } else if (error.code === 'ERR_NETWORK') {
      console.warn('Network error:', error.message);
      // Allow the error to be handled by the component
    } else if (!isRegistration404) {
      // Logga solo se non è il 404 della registrazione
      console.error('API error:', error);
    }
    return Promise.reject(error);
  }
);

// Trip and Travel Info
export const getTripData = async (): Promise<TripData> => {
  const response = await api.get('/trip');
  return response.data;
};

export const getTravelInfo = async (): Promise<TravelInfo> => {
  const response = await api.get('/travel-info');
  return response.data;
};

// Authentication
export const login = async (email: string, password: string) => {
  const startTime = new Date().toISOString();
  console.log('Login request initiated:', { 
    email, 
    password: '***',
    timestamp: startTime,
    url: '/auth/login'
  });

  try {
    const response = await api.post('/auth/login', {
      email: email.trim(),
      password: password
    });

    console.log('Server response received:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      hasToken: !!response.data?.token,
      timestamp: new Date().toISOString(),
      headers: response.headers,
      duration: `${Date.now() - new Date(startTime).getTime()}ms`
    });

    if (!response.data) {
      throw new Error('Risposta del server vuota');
    }

    if (!response.data.token) {
      console.error('Login response missing token:', response.data);
      throw new Error('Token non presente nella risposta');
    }

    console.log('Saving token to localStorage:', {
      tokenReceived: true,
      tokenLength: response.data.token.length,
      tokenPreview: response.data.token.substring(0, 10) + '...'
    });
    
    localStorage.setItem('token', response.data.token);
    
    // Verify token was saved
    const savedToken = localStorage.getItem('token');
    console.log('Token verification after save:', {
      tokenSaved: !!savedToken,
      savedTokenLength: savedToken ? savedToken.length : 0,
      matches: savedToken === response.data.token
    });

    return response.data;

  } catch (error) {
    const errorTime = new Date().toISOString();
    
    if (axios.isAxiosError(error)) {
      console.error('Login request failed:', {
        name: error.name,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          timeout: error.config?.timeout
        },
        timestamp: errorTime,
        duration: `${Date.now() - new Date(startTime).getTime()}ms`
      });

      if (error.code === 'ERR_NETWORK') {
        throw new Error('Impossibile raggiungere il server. Verifica la tua connessione e riprova.');
      }

      const errorMessage = error.response?.data?.msg || 
                         error.response?.data?.message || 
                         'Errore durante il login. Verifica le credenziali e riprova.';
      throw new Error(errorMessage);
    }

    console.error('Unexpected error during login:', {
      error,
      timestamp: errorTime,
      duration: `${Date.now() - new Date(startTime).getTime()}ms`
    });
    throw error;
  }
};

// Photo Management
export const getPhotos = async (): Promise<Photo[]> => {
  const response = await api.get('/trip/photos');
  return response.data;
};

export const uploadPhotos = async (photos: FormData): Promise<Photo[]> => {
  const response = await api.post('/trip/photos', photos, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const likePhoto = async (photoId: number): Promise<{ likes: number }> => {
  const response = await api.post(`/trip/photos/${photoId}/like`);
  return response.data;
};

export const deletePhoto = async (photoId: number): Promise<void> => {
  await api.delete(`/trip/photos/${photoId}`);
};

// Profile Management
export const getUserProfile = async (): Promise<Profile> => {
  const response = await api.get('/auth/profile');
  return response.data;
};

// Document Management
export const getLegalDocuments = async () => {
  const response = await api.get('/documents/legal');
  return response.data;
};

export default api;
