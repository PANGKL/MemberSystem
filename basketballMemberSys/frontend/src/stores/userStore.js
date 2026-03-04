// frontend/src/stores/userStore.js
import { defineStore } from 'pinia';
import api from '../api';
import axios from 'axios'; // Import axios directly for refresh token request
import { ElMessage } from 'element-plus';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
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
        const response = await api.post('/token/', { username, password });
        this.accessToken = response.access;
        this.refreshToken = response.refresh;
        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', this.refreshToken);
        
        const userResponse = await api.get('/users/profile/');
        this.user = userResponse;
        localStorage.setItem('user', JSON.stringify(this.user));

        return true;
      } catch (error) {
        console.error('Login failed:', error);
        return false;
      } finally {
        this.loading = false;
      }
    },
    async register(userData) {
      this.loading = true;
      try {
        await api.post('/users/register/', userData);
        ElMessage.success('註冊成功，請登入 (Registration successful, please log in)');
        return true;
      } catch (error) {
        console.error('Register failed:', error);
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
        // Use direct axios to avoid interceptor loop
        // Ensure the URL matches your backend configuration
        const baseURL = 'http://localhost:8000/api'; 
        const response = await axios.post(`${baseURL}/token/refresh/`, { 
          refresh: this.refreshToken 
        });
        
        // Response data is directly in response.data when using raw axios
        const data = response.data;
        this.accessToken = data.access;
        localStorage.setItem('accessToken', this.accessToken);
        return this.accessToken;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        this.logout();
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
      window.location.href = '/login';
    },
    async syncUserProfile() {
      if (this.isAuthenticated) {
        try {
          const userData = await api.get('/users/profile/');
          this.user = userData;
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Failed to sync user profile:', error);
          if (error.response?.status === 401 || error.response?.status === 403) {
            this.logout();
          }
        }
      }
    }
  },
});
