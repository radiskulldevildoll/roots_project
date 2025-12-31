import axios from 'axios';
import { API_BASE_URL, endpoints } from './config';
import { tokenStorage } from './storage';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    // Use safe storage wrapper that handles SSR and blocked localStorage
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh logic for auth endpoints
      if (originalRequest.url?.includes('/auth/jwt/')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();
      
      if (!refreshToken) {
        // No refresh token, redirect to login
        tokenStorage.clearTokens();
        
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Try to refresh the token
        const response = await axios.post(endpoints.auth.refresh, {
          refresh: refreshToken,
        });

        const { access, refresh } = response.data;
        
        tokenStorage.setAccessToken(access);
        if (refresh) {
          tokenStorage.setRefreshToken(refresh);
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        processQueue(null, access);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Refresh failed, clear tokens and redirect to login
        tokenStorage.clearTokens();
        
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper functions for common operations
export const apiHelpers = {
  // Auth
  login: (credentials) => api.post('/api/auth/jwt/create/', credentials),
  register: (userData) => api.post('/api/auth/users/', userData),
  getCurrentUser: () => api.get('/api/auth/users/me/'),
  
  // People
  getPeople: () => api.get('/api/genealogy/people/'),
  getPerson: (id) => api.get(`/api/genealogy/people/${id}/`),
  createPerson: (data) => api.post('/api/genealogy/people/', data),
  updatePerson: (id, data) => api.patch(`/api/genealogy/people/${id}/`, data),
  deletePerson: (id) => api.delete(`/api/genealogy/people/${id}/`),
  getVisualTree: (focusId) => api.get('/api/genealogy/people/visual_tree/', { 
    params: focusId ? { focus_id: focusId } : {} 
  }),
  uploadProfilePicture: (id, file) => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    return api.patch(`/api/genealogy/people/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Relationships
  getRelationships: () => api.get('/api/genealogy/relationships/'),
  createRelationship: (data) => api.post('/api/genealogy/relationships/', data),
  deleteRelationship: (id) => api.delete(`/api/genealogy/relationships/${id}/`),
  
  // Parent-Child Links
  getParentLinks: (childId) => api.get('/api/genealogy/parent_links/', {
    params: childId ? { child: childId } : {}
  }),
  createParentLink: (data) => api.post('/api/genealogy/parent_links/', data),
  deleteParentLink: (id) => api.delete(`/api/genealogy/parent_links/${id}/`),
  
  // Stories
  getStories: () => api.get('/api/stories/'),
  getStory: (id) => api.get(`/api/stories/${id}/`),
  createStory: (data) => api.post('/api/stories/', data),
  updateStory: (id, data) => api.patch(`/api/stories/${id}/`, data),
  deleteStory: (id) => api.delete(`/api/stories/${id}/`),
  getStoriesByPerson: (personId) => api.get(`/api/stories/by_person/?person_id=${personId}`),
  
  // Media
  getMedia: () => api.get('/api/media/'),
  getMediaItem: (id) => api.get(`/api/media/${id}/`),
  uploadMedia: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (key === 'tagged_people' && Array.isArray(data[key])) {
          data[key].forEach(id => formData.append('tagged_people', id));
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    return api.post('/api/media/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateMedia: (id, data) => api.patch(`/api/media/${id}/`, data),
  deleteMedia: (id) => api.delete(`/api/media/${id}/`),
  getMediaByPerson: (personId) => api.get(`/api/media/by_person/?person_id=${personId}`),
  getMediaByType: (type) => api.get(`/api/media/by_type/?type=${type}`),
};

export default api;
