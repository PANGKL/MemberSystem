import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '../stores/userStore';
import api from '../api';

// Mock api
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('login action should set user data and token on success', async () => {
    const userStore = useUserStore();
    const mockTokenResponse = {
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
    };
    const mockUserResponse = {
      id: 1,
      username: 'admin',
      role: 'ADMIN',
    };

    api.post.mockResolvedValue(mockTokenResponse);
    api.get.mockResolvedValue(mockUserResponse);

    const result = await userStore.login('admin', 'password');

    expect(result).toBe(true);
    expect(userStore.accessToken).toBe('mock-access-token');
    expect(userStore.user).toEqual(mockUserResponse);
    expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
  });

  it('login action should return false on failure', async () => {
    const userStore = useUserStore();
    api.post.mockRejectedValue(new Error('Login failed'));

    const result = await userStore.login('admin', 'wrong-password');

    expect(result).toBe(false);
    expect(userStore.accessToken).toBeNull();
  });

  it('isAdmin getter should return true for admin role', () => {
    const userStore = useUserStore();
    userStore.user = { role: 'ADMIN' };
    expect(userStore.isAdmin).toBe(true);
  });

  it('isAdmin getter should return false for user role', () => {
    const userStore = useUserStore();
    userStore.user = { role: 'USER' };
    expect(userStore.isAdmin).toBe(false);
  });
});
