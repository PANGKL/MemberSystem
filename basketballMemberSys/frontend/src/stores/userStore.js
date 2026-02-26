import { defineStore } from 'pinia';
import api from '../api';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'ADMIN',
  },
  actions: {
    async login(username, password) {
      this.loading = true;
      try {
        const data = await api.post('/auth/login', { username, password });
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      } catch (error) {
        return false;
      } finally {
        this.loading = false;
      }
    },
    async register(userData) {
      this.loading = true;
      try {
        console.log('Registering user with data:', userData);
        await api.post('/auth/register', userData);
        return true;
      } catch (error) {
        return false;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },
});
