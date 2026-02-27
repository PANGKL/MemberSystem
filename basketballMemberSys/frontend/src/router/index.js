import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import Home from '../views/Home.vue';
import Auth from '../views/Auth.vue';
import Profile from '../views/Profile.vue';
import Activities from '../views/Activities.vue';
import AdminUsers from '../views/AdminUsers.vue';
import AdminActivities from '../views/AdminActivities.vue';
import MainLayout from '../layouts/MainLayout.vue';

const routes = [
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: Home
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile
      },
      {
        path: 'activities',
        name: 'Activities',
        component: Activities
      },
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: AdminUsers,
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/activities',
        name: 'AdminActivities',
        component: AdminActivities,
        meta: { requiresAdmin: true }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: Auth,
    meta: { guestOnly: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isAuthenticated = !!userStore.token;
  const isAdmin = userStore.user?.role === 'ADMIN';

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.meta.guestOnly && isAuthenticated) {
    next('/');
  } else if (to.meta.requiresAdmin && !isAdmin) {
    next('/'); // 非管理員試圖進入管理頁面，導回首頁
  } else {
    next();
  }
});

export default router;
