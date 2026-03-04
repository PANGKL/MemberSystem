// frontend/src/api/index.js
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores/userStore';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', 
  timeout: 10000,
});

// Concurrency control for token refresh
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (accessToken) => {
  refreshSubscribers.forEach((cb) => cb(accessToken));
  refreshSubscribers = [];
};

const onRefreshFailed = (error) => {
  refreshSubscribers.forEach((cb) => cb(null, error));
  refreshSubscribers = [];
};

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    const accessToken = userStore.accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const userStore = useUserStore();

    // Prevent infinite loops if the refresh token endpoint itself fails (though we use raw axios in store, this is a safety net)
    if (originalRequest.url.includes('/token/refresh/')) {
      userStore.logout();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token, err) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(err || error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await userStore.refreshAccessToken();
        isRefreshing = false;
        onRefreshed(newAccessToken);
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshFailed(refreshError);
        
        // Only show error and logout if not already on login page
        if (!window.location.pathname.includes('/login')) {
          userStore.logout();
          ElMessage.error('認證過期，請重新登入 (Authentication expired)');
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other 401s (e.g. login failed, or after retry failed)
    if (error.response?.status === 401) {
      if (window.location.pathname.includes('/login')) {
        ElMessage.error('帳號或密碼錯誤');
      } else {
        // Double check to ensure we logout if we somehow got here without going through refresh logic (e.g. no refresh token)
        if (!isRefreshing) {
           userStore.logout();
           ElMessage.error('認證失敗，請重新登入');
        }
      }
    } else {
      const message = error.response?.data?.detail || error.response?.data?.message || '發生錯誤 (Something went wrong)';
      // Don't show error for 404s or cancelled requests if not needed, but generally good to show
      if (error.response?.status !== 404) {
         ElMessage.error(message);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
