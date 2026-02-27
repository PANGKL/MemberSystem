<template>
  <div class="main-layout">
    <header class="global-header">
      <div class="header-content">
        <div class="logo" @click="router.push('/')">
          <Dribbble class="logo-icon" />
          <h1>球會會員系統</h1>
        </div>
        
        <nav class="header-nav" v-if="userStore.isAuthenticated">
          <router-link to="/activities" class="nav-link">活動報名</router-link>
          <router-link v-if="userStore.isAdmin" to="/admin/activities" class="nav-link">活動管理</router-link>
        </nav>
        
        <div class="user-info" v-if="userStore.user">
          <div class="points-badge">
            <CircleStar class="badge-icon" />
            <span>{{ userStore.user.points || 0 }} <span class="badge-text">積分</span></span>
          </div>
          <el-dropdown>
            <span class="el-dropdown-link">
              <span class="user-name-text">{{ userStore.user.name }}</span>
              <span v-if="!userStore.user.name" class="user-name-text">User</span>
              <span class="user-name-text"> ({{ userStore.user.role }})</span>
              <UserCircle v-if="!userStore.user.name" class="w-6 h-6 sm:hidden" />
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="userStore.isAdmin" @click="router.push('/admin/users')">
                  帳號管理 (Admin)
                </el-dropdown-item>
                <el-dropdown-item @click="router.push('/profile')">個人檔案 (Profile)</el-dropdown-item>
                <el-dropdown-item divided @click="userStore.logout()">登出 (Logout)</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>


    <main class="layout-body">
      <div class="content-container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import api from '../api';
import { Dribbble, CircleStar, ArrowDown, UserCircle } from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();

// 定期或在掛載時獲取最新資料
const refreshProfile = async () => {
  if (userStore.isAuthenticated) {
    try {
      const userData = await api.get('/user/profile');
      userStore.user = userData;
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to sync profile:', error);
    }
  }
};

onMounted(refreshProfile);
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background-color: #f8fafc;
}

.global-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

@media (min-width: 768px) {
  .global-header {
    padding: 0.75rem 2rem;
  }
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .logo {
    gap: 12px;
  }
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: #2563eb;
}

@media (min-width: 768px) {
  .logo-icon {
    width: 32px;
    height: 32px;
  }
}

.logo h1 {
  font-size: 1.1rem;
  margin: 0;
  color: #1e293b;
  font-weight: 800;
}

@media (min-width: 768px) {
  .logo h1 {
    font-size: 1.5rem;
  }
}

.header-nav {
  display: flex;
  gap: 20px;
  flex: 1;
  justify-content: flex-end;
}

@media (max-width: 767px) {
  .header-nav {
    display: none;
  }
}

.nav-link {
  color: #475569;
  text-decoration: none;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: #2563eb;
  background-color: #eff6ff;
}

.nav-link.router-link-active {
  color: #2563eb;
  background-color: #eff6ff;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .user-info {
    gap: 24px;
  }
}

.points-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #fef3c7;
  color: #92400e;
  padding: 4px 10px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.75rem;
}

@media (min-width: 768px) {
  .points-badge {
    gap: 8px;
    padding: 6px 16px;
    font-size: 0.85rem;
  }
}

.badge-text {
  display: none;
}

@media (min-width: 480px) {
  .badge-text {
    display: inline;
  }
}

.user-name-text {
  display: none;
}

@media (min-width: 640px) {
  .user-name-text {
    display: inline;
  }
}

.badge-icon {
  width: 16px;
  height: 16px;
  color: #d97706;
}

.el-dropdown-link {
  cursor: pointer;
  color: #1e293b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.layout-body {
  padding-top: 0;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 768px) {
  .content-container {
    padding: 2rem;
  }
}

/* dark mode support */
.dark-mode .main-layout {
  background-color: #1e1e2f;
  color: #e0e0e0;
}
.dark-mode .global-header {
  background-color: #2a2a3e;
  border-bottom-color: #444;
}
.dark-mode .nav-link {
  color: #c0c0c0;
}
.dark-mode .nav-link.router-link-active {
  color: #ffffff;
  background-color: #444;
}
.dark-mode .user-info {
  color: #e0e0e0;
}
.dark-mode .admin-sidebar {
  background-color: #2a2a3e;
  color: #e0e0e0;
}


/* dark toggle position */
.dark-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

/* stronger text color override for dark mode */
.dark-mode .main-layout,
.dark-mode .main-layout * {
  color: #e0e0e0 !important;
}
</style>
