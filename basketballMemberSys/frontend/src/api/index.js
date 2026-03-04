// frontend/src/api/index.js
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores/userStore'; // 導入 userStore

const api = axios.create({
  // 更新為 Django 後端的埠號，例如 8000
  baseURL: 'http://localhost:8000/api', 
  timeout: 10000,
});

// 請求攔截器：注入 Access Token
api.interceptors.request.use(
  (config) => {
    const userStore = useUserStore(); // 在攔截器中獲取 store 實例
    const accessToken = userStore.accessToken; // 從 store 獲取 access token

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 回應攔截器：處理錯誤和 Token 刷新
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const userStore = useUserStore();

    // 如果是 401 Unauthorized 錯誤，且不是登入或刷新 token 的請求
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 標記為已重試

      // 嘗試刷新 token
      try {
        const newAccessToken = await userStore.refreshAccessToken();
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest); // 使用新的 token 重新發送請求
        }
      } catch (refreshError) {
        // 刷新失敗，導向登入頁面
        userStore.logout();
        ElMessage.error('認證過期，請重新登入 (Authentication expired, please log in again)');
        return Promise.reject(refreshError);
      }
    }

    // 如果是登入失敗 (401)，且目前不在登入頁面，才進行導向
    if (error.response?.status === 401) {
      // 如果已經在登入頁面，僅顯示後端回傳的錯誤訊息（如：帳密錯誤）
      if (window.location.pathname.includes('/login')) {
        ElMessage.error('帳號或密碼錯誤');
      } else {
        // 如果不是登入頁面，且不是 token 刷新失敗，則導向登入頁面
        userStore.logout();
        ElMessage.error('認證失敗，請重新登入 (Authentication failed, please log in again)');
      }
    } else {
      // 其他錯誤
      const message = error.response?.data?.detail || error.response?.data?.message || '發生錯誤 (Something went wrong)';
      ElMessage.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
