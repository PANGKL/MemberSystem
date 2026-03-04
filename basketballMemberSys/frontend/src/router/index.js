import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import Home from '../views/Home.vue';
import Auth from '../views/Auth.vue';
import Profile from '../views/Profile.vue';
import Activities from '../views/Activities.vue';
import AdminLayout from '../layouts/AdminLayout.vue';
import AcademicYearMgmt from '../views/admin/AcademicYearMgmt.vue';
import ClassMgmt from '../views/admin/ClassMgmt.vue';
import UserMgmt from '../views/admin/UserMgmt.vue';
import AdminActivities from '../views/AdminActivities.vue'; // Temporarily keep until migrated
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
      }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true, breadcrumb: '後台首頁' },
    children: [
      {
        path: 'users',
        name: 'UserMgmt',
        component: UserMgmt,
        meta: { breadcrumb: '帳號與學員管理' }
      },
      {
        path: 'academic-years',
        name: 'AcademicYearMgmt',
        component: AcademicYearMgmt,
        meta: { breadcrumb: '學年管理' }
      },
      {
        path: 'classes',
        name: 'ClassMgmt',
        component: ClassMgmt,
        meta: { breadcrumb: '班別管理' }
      },
      {
        path: 'activities',
        name: 'AdminActivities',
        component: AdminActivities,
        meta: { breadcrumb: '活動管理' }
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
