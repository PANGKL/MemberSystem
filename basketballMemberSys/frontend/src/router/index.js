import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/userStore';

const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue')
      },
      {
        path: 'activities',
        name: 'Activities',
        component: () => import('../views/Activities.vue')
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAdmin: true, breadcrumb: '後台首頁' },
    children: [
      {
        path: 'users',
        name: 'UserMgmt',
        component: () => import('../views/admin/UserMgmt.vue'),
        meta: { breadcrumb: '帳號與學員管理' }
      },
      {
        path: 'academic-years',
        name: 'AcademicYearMgmt',
        component: () => import('../views/admin/AcademicYearMgmt.vue'),
        meta: { breadcrumb: '學年管理' }
      },
      {
        path: 'classes',
        name: 'ClassMgmt',
        component: () => import('../views/admin/ClassMgmt.vue'),
        meta: { breadcrumb: '班別管理' }
      },
      {
        path: 'activities',
        name: 'AdminActivities',
        component: () => import('../views/AdminActivities.vue'),
        meta: { breadcrumb: '活動管理' }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Auth.vue'),
    meta: { guestOnly: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const isAuthenticated = !!userStore.accessToken;
  let isAdmin = userStore.isAdmin;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
    return;
  }

  if (to.meta.requiresAdmin && isAuthenticated && !isAdmin) {
    try {
      await userStore.syncUserProfile();
      isAdmin = userStore.isAdmin;
    } catch (e) {
      // ignore
    }
    if (!isAdmin) {
      next('/');
      return;
    }
  }

  if (to.meta.guestOnly && isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
