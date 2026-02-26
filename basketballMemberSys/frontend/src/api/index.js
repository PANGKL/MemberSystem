import axios from 'axios';
import { ElMessage } from 'element-plus';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

// 請求攔截器：注入 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 回應攔截器：處理錯誤
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || '發生錯誤 (Something went wrong)';
    
    // 如果是登入失敗 (401)，且目前不在登入頁面，才進行導向
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 只有當前不是在登入頁面時，才彈出提示並導向
      if (!window.location.pathname.includes('/login')) {
        ElMessage.error('認證過期，請重新登入');
        window.location.href = '/login';
      } else {
        // 如果已經在登入頁面，僅顯示後端回傳的錯誤訊息（如：帳密錯誤）
        ElMessage.error(message);
      }
    } else {
      // 其他錯誤
      ElMessage.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
