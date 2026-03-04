<template>
  <div class="admin-layout">
    <VaNavbar color="#1f2937" class="app-navbar" >
      <template #left>
        <VaButton
          preset="secondary"
          color="textPrimary"
          class="menu-toggle-btn"
          @click="isSidebarVisible = !isSidebarVisible"
        >
          <Menu class="menu-icon-white" />
        </VaButton>
        <VaNavbarItem class="logo" @click="router.push('/admin/users')">
          <Dribbble class="nav-icon" />
          <span class="logo-text">會員系統後台</span>
        </VaNavbarItem>
      </template>
      <template #right>
        <VaNavbarItem class="nav-item-desktop">
          <span class="nav-link" @click="router.push('/')">返回主頁</span>
        </VaNavbarItem>
        <VaNavbarItem>
          <el-dropdown trigger="click">
            <div class="user-trigger">
              <UserCircle class="nav-icon" />
              <span class="username">{{ userStore.user?.name || userStore.user?.username || '管理員' }}</span>
              <ArrowDown class="icon-small" />
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="userStore.logout()">
                  登出
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </VaNavbarItem>
      </template>
    </VaNavbar>

    <div class="admin-content">
      <VaSidebar
        v-model="isSidebarVisible"
        minimized-width="0"
        width="240px"
        class="admin-sidebar"
        color="#1f2937"
        textColor="#e5e7eb"
      >
        <VaSidebarItem
          v-for="item in menuItems"
          :key="item.path"
          :active="route.path === item.path"
          @click="handleMenuClick(item.path)"
          hover-color="#ffffffff"
          active-color="#646a75ff"
        >
          <VaSidebarItemContent>
            <component :is="item.icon" class="menu-icon" />
            <VaSidebarItemTitle>{{ item.title }}</VaSidebarItemTitle>
          </VaSidebarItemContent>
        </VaSidebarItem>
      </VaSidebar>

      <main class="main-content">
        <!-- Breadcrumb -->
        <!-- <div class="breadcrumb">
          <span class="breadcrumb-link" @click="router.push('/admin/users')">首頁</span>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">{{ currentRouteName }}</span>
        </div> -->
        
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import { 
  Dribbble, 
  UserCircle, 
  ArrowDown, 
  Users, 
  Calendar, 
  Activity,
  School,
  Menu
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const isSidebarVisible = ref(true);

const menuItems = [
  { title: '帳號與學員', path: '/admin/users', icon: Users },
  { title: '學年管理', path: '/admin/academic-years', icon: Calendar },
  { title: '班別管理', path: '/admin/classes', icon: School },
  { title: '活動管理', path: '/admin/activities', icon: Activity },
];

const currentRouteName = computed(() => {
  const item = menuItems.find(i => i.path === route.path);
  return item ? item.title : '管理介面';
});

// Responsive Sidebar
const checkScreenSize = () => {
  if (window.innerWidth < 1024) {
    isSidebarVisible.value = false;
  } else {
    isSidebarVisible.value = true;
  }
};

const handleMenuClick = (path) => {
  router.push(path);
  if (window.innerWidth < 1024) {
    isSidebarVisible.value = false;
  }
};

onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: visible; /* 允許下拉選單超出容器 */
}

.admin-content {
  display: flex;
  flex: 1;
  overflow: hidden; /* 主內容可以滾動，但不會影響 navbar */
  position: relative;
  z-index: 1; /* 確保內容層級低於 navbar */
}

.admin-sidebar {
  border-right: 1px solid #e5e7eb;
}

.main-content {
  flex: 1;
  padding: 0 1.5rem;
  background-color: #f9fafb;
  overflow-y: auto;
  width: 100%;
}

.logo {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: white;
}

.menu-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.75rem;
}

.breadcrumb {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.breadcrumb-link {
  cursor: pointer;
}

.breadcrumb-link:hover {
  color: #32d653ff;
}

.breadcrumb-separator {
  margin: 0 0.5rem;
}

.breadcrumb-current {
  font-weight: 500;
  color: #374151;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Remove VaDropdown overrides as we switched to ElDropdown */
/* Navbar Styles */
.app-navbar {
  margin-bottom: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 2000;
  flex-shrink: 0;
  position: relative;
}

.admin-sidebar {
  z-index: 1000;
  border-right: 1px solid #e5e7eb;
}

.menu-toggle-btn {
  margin-right: 0.75rem;
  display: none;
}

.menu-icon-white {
  width: 1.5rem;
  height: 1.5rem;
  color: white;
}

.logo-text {
  font-weight: bold;
  font-size: 1.125rem;
  display: none;
}

.nav-icon {
  width: 1.5rem;
  height: 1.5rem;
  margin-right: 0.5rem;
}

.nav-item-desktop {
  display: none;
}

.nav-link {
  font-weight: bold;
  font-size: 1.125rem;
  cursor: pointer;
  margin-right: 1rem;
}

.user-trigger {
  display: flex;
  align-items: center;
  color: white;
  cursor: pointer;
}

.username {
  display: none;
}

.icon-small {
  width: 1rem;
  height: 1rem;
  margin-left: 0.25rem;
}

.cursor-pointer {
  cursor: pointer;
}

@media (min-width: 640px) {
  .logo-text {
    display: block;
  }
  .nav-item-desktop {
    display: block;
  }
  .nav-link {
    display: block;
  }
  .username {
    display: inline;
  }
}

@media (max-width: 1024px) {
  .menu-toggle-btn {
    display: block;
  }
}</style>
