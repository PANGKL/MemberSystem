// frontend/src/stores/userStore.js
import { defineStore } from 'pinia';
import api from '../api'; // 確保這裡導入的是修改後的 api 實例
import { ElMessage } from 'element-plus'; // 導入 ElMessage

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    accessToken: localStorage.getItem('accessToken') || null, // 儲存 access token
    refreshToken: localStorage.getItem('refreshToken') || null, // 儲存 refresh token
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    isAdmin: (state) => {
      const u = state.user || {};
      return u.role === 'ADMIN' || u.is_superuser === true || u.is_staff === true;
    },
  },
  actions: {
    async login(username, password) {
      this.loading = true;
      try {
        // Django Simple JWT 的登入端點是 /api/token/
        const response = await api.post('/token/', { username, password });
        this.accessToken = response.access;
        this.refreshToken = response.refresh;
        
        // 獲取使用者資料 (Django Simple JWT 登入不會直接返回 user 資料)
        const userData = await api.get('/users/profile/'); // 假設有 /api/users/profile/ 端點
        this.user = userData;

        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', this.refreshToken);
        localStorage.setItem('user', JSON.stringify(this.user));
        return true;
      } catch (error) {
        console.error('Login failed:', error);
        // 錯誤訊息會由 api/index.js 的攔截器處理
        return false;
      } finally {
        this.loading = false;
      }
    },
    async register(userData) {
      this.loading = true;
      try {
        // Django 的註冊端點是 /api/users/register/
        await api.post('/users/register/', userData);
        ElMessage.success('註冊成功，請登入 (Registration successful, please log in)');
        return true;
      } catch (error) {
        console.error('Register failed:', error);
        // 錯誤訊息會由 api/index.js 的攔截器處理
        return false;
      } finally {
        this.loading = false;
      }
    },
    async refreshAccessToken() {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }
      try {
        const response = await api.post('/token/refresh/', { refresh: this.refreshToken });
        this.accessToken = response.access;
        localStorage.setItem('accessToken', this.accessToken);
        return this.accessToken;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        this.logout(); // 刷新失敗則登出
        throw error;
      }
    },
    logout() {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      // 導向登入頁面
      window.location.href = '/login';
    },
    // 新增一個同步使用者資料的 action，用於在 token 刷新後更新 userStore 中的 user 物件
    async syncUserProfile() {
      if (this.isAuthenticated) {
        try {
          const userData = await api.get('/users/profile/');
          this.user = userData;
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Failed to sync user profile:', error);
          // 如果同步失敗，可能是 token 無效，考慮登出
          if (error.response?.status === 401 || error.response?.status === 403) {
            this.logout();
          }
        }
      }
    }
  },
});
