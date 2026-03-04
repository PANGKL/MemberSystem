<template>
  <el-config-provider>
    <router-view />
  </el-config-provider>
</template>

<script setup>
import { onMounted } from 'vue';
import { ElConfigProvider } from 'element-plus';
import { useUserStore } from './stores/userStore';

const userStore = useUserStore();

onMounted(async () => {
  if (userStore.isAuthenticated) {
    await userStore.syncUserProfile();
  }
});
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:root {
  --el-color-primary: #3b82f6;
  --el-color-primary-light-3: #93c5fd;
  --el-color-primary-dark-2: #1e40af;
}

h1, h2, h3, h4, h5, h6 {
  color: #1e293b;
}

.el-button--primary {
  --el-button-bg-color: #3b82f6;
  --el-button-border-color: #3b82f6;
  --el-button-hover-bg-color: #2563eb;
  --el-button-hover-border-color: #2563eb;
  --el-button-active-bg-color: #1d4ed8;
  --el-button-active-border-color: #1d4ed8;
}
</style>
