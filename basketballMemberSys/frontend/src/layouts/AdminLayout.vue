<template>
  <div class="admin-layout">
    <VaNavbar color="primary" class="mb-3">
      <template #left>
        <VaButton
          preset="secondary"
          color="textPrimary"
          class="mr-3 lg:hidden"
          @click="isSidebarVisible = !isSidebarVisible"
        >
          <Menu class="w-6 h-6 text-white" />
        </VaButton>
        <VaNavbarItem class="logo" @click="router.push('/admin/users')">
          <Dribbble class="w-6 h-6 mr-2" />
          <span class="font-bold text-lg hidden sm:block">會員系統後台</span>
        </VaNavbarItem>
      </template>
      <template #right>
        <VaNavbarItem class="hidden sm:block">
          <VaButton preset="secondary" color="textPrimary" @click="router.push('/')">
            返回前台
          </VaButton>
        </VaNavbarItem>
        <VaNavbarItem>
          <VaDropdown>
            <template #anchor>
              <div class="flex items-center cursor-pointer text-white">
                <UserCircle class="w-5 h-5 mr-2" />
                <span class="hidden sm:inline">{{ userStore.user?.name || userStore.user?.username || '管理員' }}</span>
                <ArrowDown class="w-4 h-4 ml-1" />
              </div>
            </template>
            <VaDropdownContent>
              <VaList>
                <VaListItem @click="userStore.logout()">
                  <VaListItemSection>登出</VaListItemSection>
                </VaListItem>
              </VaList>
            </VaDropdownContent>
          </VaDropdown>
        </VaNavbarItem>
      </template>
    </VaNavbar>

    <div class="flex h-[calc(100vh-64px)]">
      <VaSidebar
        v-model="isSidebarVisible"
        minimized-width="0"
        width="240px"
        class="border-r border-gray-200"
      >
        <VaSidebarItem
          v-for="item in menuItems"
          :key="item.path"
          :active="route.path === item.path"
          @click="handleMenuClick(item.path)"
        >
          <VaSidebarItemContent>
            <component :is="item.icon" class="w-5 h-5 mr-3" />
            <VaSidebarItemTitle>{{ item.title }}</VaSidebarItemTitle>
          </VaSidebarItemContent>
        </VaSidebarItem>
      </VaSidebar>

      <main class="flex-1 p-4 bg-gray-50 overflow-auto w-full">
        <!-- Breadcrumb -->
        <div class="mb-4 flex items-center text-sm text-gray-500">
          <span class="cursor-pointer hover:text-primary" @click="router.push('/admin/users')">首頁</span>
          <span class="mx-2">/</span>
          <span class="font-medium text-gray-700">{{ currentRouteName }}</span>
        </div>
        
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
}

.logo {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
