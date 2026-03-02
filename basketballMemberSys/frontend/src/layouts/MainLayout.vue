<template>
  <div class="main-layout">
    <header class="global-header">
      <div class="header-left" @click="router.push('/')">
        <Dribbble class="logo-icon" />
        <span class="brand">球會會員系統</span>
      </div>
      <div class="header-right">
        <el-button type="text" @click="router.push('/activities')">活動</el-button>
        <el-dropdown>
          <span class="el-dropdown-link">
            <UserCircle class="mr-1" />
            {{ userStore.user?.name || userStore.user?.username || '帳戶' }}
            <ArrowDown class="dropdown-icon" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="userStore.isAdmin" @click="router.push('/admin/users')">帳號與學員管理</el-dropdown-item>
              <el-dropdown-item v-if="userStore.isAdmin" @click="router.push('/admin/activities')">活動管理</el-dropdown-item>
              <el-dropdown-item @click="router.push('/profile')">個人檔案</el-dropdown-item>
              <el-dropdown-item divided @click="userStore.logout()">登出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
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
import { Dribbble, CircleStar, ArrowDown, UserCircle } from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();

const refreshProfile = async () => {
  await userStore.syncUserProfile(); // 呼叫 userStore 中的同步方法
};

onMounted(refreshProfile);
</script>
<style scoped>
.global-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.logo-icon {
  width: 24px;
  height: 24px;
  color: #409eff;
}
.brand {
  font-weight: 700;
  color: #1f2937;
}
.dropdown-icon {
  width: 16px;
  height: 16px;
  margin-left: 4px;
}
.layout-body {
  padding: 16px;
}
.content-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
