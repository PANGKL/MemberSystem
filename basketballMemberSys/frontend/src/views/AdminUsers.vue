<template>
  <div class="admin-view">
    <div class="admin-header">
      <h2>帳號與學員管理</h2>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 用戶管理選項卡 -->
      <el-tab-pane label="帳號管理" name="users">
        <!-- 搜尋與篩選區域 -->
        <el-card shadow="never" class="filter-card mb-4">
          <el-row :gutter="20">
            <el-col :span="6" :xs="24">
              <el-input
                v-model="userSearchQuery"
                placeholder="搜尋姓名、Email、用戶名"
                clearable
                prefix-icon="Search"
              />
            </el-col>
            <el-col :span="6" :xs="24">
              <el-select v-model="userRoleFilter" placeholder="角色篩選" clearable style="width: 100%">
                <el-option label="全部角色" value="" />
                <el-option label="管理員 (Admin)" value="ADMIN" />
                <el-option label="教練 (Coach)" value="COACH" />
                <el-option label="家長 (Parent)" value="PARENT" />
              </el-select>
            </el-col>
            <el-col :span="8" :xs="24">
               <el-date-picker
                v-model="userDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="註冊開始日期"
                end-placeholder="註冊結束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-col>
            <el-col :span="4" :xs="24" class="text-right">
              <el-button @click="clearUserFilters">清除篩選</el-button>
              <el-button type="primary" @click="exportUserData">匯出 CSV</el-button>
            </el-col>
          </el-row>
        </el-card>

        <div class="tab-actions">
          <el-button type="primary" @click="openCreateUserDialog">
            <Plus class="w-4 h-4 mr-1" />
            新增帳號
          </el-button>
        </div>

        <el-card shadow="never" class="table-card">
          <!-- Desktop Table -->
          <el-table :data="filteredUsers" v-loading="usersLoading" style="width: 100%" class="hidden-xs-only">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="username" label="用戶名" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="email" label="Email" />
            <el-table-column prop="date_joined" label="註冊日期" width="180">
              <template #default="{ row }">
                {{ formatDate(row.date_joined) }}
              </template>
            </el-table-column>
            <el-table-column prop="role" label="角色" width="100">
              <template #default="{ row }">
                <el-tag :type="row.role === 'ADMIN' ? 'danger' : 'info'">{{ row.role }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="points" label="積分" width="80" />
            <el-table-column label="操作" width="250">
              <template #default="{ row }">
                <el-button-group>
                  <el-button size="small" @click="handleEditUser(row)">編輯</el-button>
                  <el-button size="small" type="warning" @click="handleResetPassword(row)">重設密碼</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteUser(row)" :disabled="row.id === userStore.user.id">刪除</el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>

          <!-- Mobile Card List -->
          <div class="mobile-user-list hidden-sm-and-up">
            <div v-for="user in filteredUsers" :key="user.id" class="mobile-user-card">
              <div class="user-card-header">
                <span class="user-name">{{ user.name }}</span>
                <el-tag :type="user.role === 'ADMIN' ? 'danger' : 'info'" size="small">{{ user.role }}</el-tag>
              </div>
              <div class="user-card-body">
                <p><span class="label">用戶名:</span> {{ user.username }}</p>
                <p><span class="label">Email:</span> {{ user.email }}</p>
                <p><span class="label">註冊日期:</span> {{ formatDate(user.date_joined) }}</p>
                <p><span class="label">積分:</span> {{ user.points }}</p>
              </div>
              <div class="user-card-actions">
                <el-button size="small" @click="handleEditUser(user)">編輯</el-button>
                <el-button size="small" type="warning" @click="handleResetPassword(user)">重設</el-button>
                <el-button size="small" type="danger" @click="handleDeleteUser(user)" :disabled="user.id === userStore.user.id">刪除</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 學員管理選項卡 -->
      <el-tab-pane label="學員管理" name="children">
        <!-- 學員搜尋與篩選區域 -->
        <el-card shadow="never" class="filter-card mb-4">
          <el-row :gutter="20">
            <el-col :span="6" :xs="24">
              <el-input
                v-model="childSearchQuery"
                placeholder="搜尋學員姓名、ID"
                clearable
                prefix-icon="Search"
              />
            </el-col>
            <el-col :span="6" :xs="24">
              <el-select v-model="childCourseStatusFilter" placeholder="課程狀態" clearable style="width: 100%">
                <el-option label="全部" value="" />
                <el-option label="有進行中課程 (Active Course)" value="active" />
                <el-option label="無進行中課程 (No Active Course)" value="inactive" />
              </el-select>
            </el-col>
            <el-col :span="6" :xs="24">
               <el-date-picker
                v-model="childDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="建立日期起"
                end-placeholder="建立日期止"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-col>
            <el-col :span="6" :xs="24" class="text-right">
              <el-button @click="clearChildFilters">清除篩選</el-button>
               <el-button type="primary" @click="exportChildData">匯出 CSV</el-button>
            </el-col>
          </el-row>
        </el-card>

        <div class="tab-actions">
          <el-button type="primary" @click="openCreateChildDialog">
            <Plus class="w-4 h-4 mr-1" />
            新增學員
          </el-button>
        </div>

        <el-card shadow="never" class="table-card">
          <!-- Desktop Table -->
          <el-table :data="filteredChildren" v-loading="childrenLoading" style="width: 100%" class="hidden-xs-only">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="學員名稱" />
            <el-table-column prop="date_of_birth" label="出生日期" width="120" />
            <el-table-column prop="age_group" label="年齡組別" width="100" />
            <el-table-column prop="skill_level" label="技能等級" width="100" />
            <el-table-column prop="parentName" label="家長" />
            <el-table-column label="課程狀態">
              <template #default="{ row }">
                <el-tag v-if="row.active_courses && row.active_courses.length > 0" type="success">進行中 ({{ row.active_courses.length }})</el-tag>
                <el-tag v-else type="info">無課程</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button-group>
                  <el-button size="small" @click="handleEditChild(row)">編輯</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteChild(row)">刪除</el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>

          <!-- Mobile Card List -->
          <div class="mobile-user-list hidden-sm-and-up">
            <div v-for="child in filteredChildren" :key="child.id" class="mobile-user-card">
              <div class="user-card-header">
                <span class="user-name">{{ child.name }}</span>
                <el-tag size="small">{{ child.age_group }}</el-tag>
              </div>
              <div class="user-card-body">
                <p><span class="label">出生日期:</span> {{ child.date_of_birth }}</p>
                <p><span class="label">技能等級:</span> {{ child.skill_level }}</p>
                <p><span class="label">課程狀態:</span> 
                  <span v-if="child.active_courses && child.active_courses.length > 0" class="text-green-600">進行中</span>
                  <span v-else class="text-gray-400">無課程</span>
                </p>
                <p><span class="label">家長:</span> {{ child.parentName }}</p>
              </div>
              <div class="user-card-actions">
                <el-button size="small" @click="handleEditChild(child)">編輯</el-button>
                <el-button size="small" type="danger" @click="handleDeleteChild(child)">刪除</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 編輯/新增用戶對話框 -->
    <el-dialog v-model="userDialogVisible" :title="isEditUser ? '編輯用戶' : '新增帳號'" width="90%" style="max-width: 650px">
      <el-form :model="userForm" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用戶名">
              <el-input v-model="userForm.username" :disabled="isEditUser" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="userForm.name" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Email">
              <el-input v-model="userForm.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="電話">
              <el-input v-model="userForm.phoneNumber" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="密碼" v-if="!isEditUser">
          <el-input v-model="userForm.password" type="password" show-password />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色">
              <el-select v-model="userForm.role" class="w-full">
                <el-option label="PARENT" value="PARENT" />
                <el-option label="COACH" value="COACH" />
                <el-option label="ADMIN" value="ADMIN" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="isEditUser">
            <el-form-item label="積分">
              <el-input-number v-model="userForm.points" :min="0" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>

        <!--學員管理部分 -->
        <div v-if="isEditUser && userForm.role === 'PARENT'" class="children-mgmt-section">
          <el-divider content-position="left">學員資料管理</el-divider>
          <div class="children-list-edit">
            <el-table :data="userForm.children" size="small" border>
              <el-table-column prop="name" label="姓名" />
              <el-table-column prop="age_group" label="組別" width="80" />
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button type="primary" size="small" link @click="handleEditChild(row)">編輯</el-button>
                  <el-button type="danger" size="small" link @click="handleDeleteChild(row)">刪除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="mt-2 text-right">
              <el-button type="success" size="small" plain @click="prepareAddChildForUser">
                <Plus class="w-3 h-3 mr-1" /> 新增學員
              </el-button>
            </div>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">確認更新帳號</el-button>
      </template>
    </el-dialog>

    <!-- 編輯/新增學員對話框 -->
    <el-dialog v-model="childDialogVisible" :title="isEditChild ? '編輯學員' : '新增學員'" width="90%" style="max-width: 500px">
      <el-form :model="childForm" label-position="top">
        <el-form-item label="學員名稱">
          <el-input v-model="childForm.name" />
        </el-form-item>
        <el-form-item label="出生日期">
          <el-input v-model="childForm.date_of_birth" type="date" />
        </el-form-item>
        <el-form-item label="年齡組別">
          <el-select v-model="childForm.age_group" class="w-full">
            <el-option label="U10" value="U10" />
            <el-option label="U12" value="U12" />
            <el-option label="U14" value="U14" />
            <el-option label="U16" value="U16" />
            <el-option label="U18" value="U18" />
          </el-select>
        </el-form-item>
        <el-form-item label="技能等級">
          <el-select v-model="childForm.skill_level" class="w-full">
            <el-option label="BEGINNER" value="BEGINNER" />
            <el-option label="INTERMEDIATE" value="INTERMEDIATE" />
            <el-option label="ADVANCED" value="ADVANCED" />
          </el-select>
        </el-form-item>
        <el-form-item label="家長">
          <el-select v-model="childForm.parent" class="w-full" placeholder="選擇家長">
            <el-option v-for="parent in parentList" :key="parent.id" :label="parent.name" :value="parent.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="childDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveChild">確認</el-button>
      </template>
    </el-dialog>

    <!-- 重設密碼對話框 -->
    <el-dialog v-model="resetPwdDialogVisible" title="重設密碼" width="90%" style="max-width: 400px">
      <el-form label-position="top">
        <el-form-item label="新密碼">
          <el-input v-model="newPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmResetPassword">確認重設</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useUserStore } from '../stores/userStore';
import api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from 'lucide-vue-next';

const userStore = useUserStore();
const activeTab = ref('users');

// User Management
const users = ref([]);
const usersLoading = ref(false);
const userDialogVisible = ref(false);
const isEditUser = ref(false);
const resetPwdDialogVisible = ref(false);
const selectedUserId = ref(null);
const newPassword = ref('');

// User Filters
const userSearchQuery = ref('');
const userRoleFilter = ref('');
const userDateRange = ref(null);

// Child Management
const children = ref([]);
const childrenLoading = ref(false);
const childDialogVisible = ref(false);
const isEditChild = ref(false);
const parentList = ref([]);

// Child Filters
const childSearchQuery = ref('');
const childCourseStatusFilter = ref('');
const childDateRange = ref(null);

const userForm = reactive({
  id: null,
  username: '',
  name: '',
  email: '',
  password: '',
  phoneNumber: '',
  role: 'PARENT',
  points: 0,
  level: 'NOVICE',
  children: []
});

const childForm = reactive({
  id: null,
  name: '',
  date_of_birth: '',
  age_group: 'U10',
  skill_level: 'BEGINNER',
  parent: null
});

// Helper Functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// Computed Properties for Filtering
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    // 1. Search Query (Name, Email, Username, ID)
    const query = userSearchQuery.value.toLowerCase();
    const matchQuery = !query || 
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.username && user.username.toLowerCase().includes(query)) ||
      (String(user.id).includes(query));
    
    // 2. Role Filter
    const matchRole = !userRoleFilter.value || user.role === userRoleFilter.value;

    // 3. Date Range Filter
    let matchDate = true;
    if (userDateRange.value && userDateRange.value.length === 2 && user.date_joined) {
      const joinedDate = new Date(user.date_joined).toISOString().split('T')[0];
      matchDate = joinedDate >= userDateRange.value[0] && joinedDate <= userDateRange.value[1];
    }

    return matchQuery && matchRole && matchDate;
  });
});

const filteredChildren = computed(() => {
  return children.value.filter(child => {
    // 1. Search Query (Name, ID)
    const query = childSearchQuery.value.toLowerCase();
    const matchQuery = !query || 
      (child.name && child.name.toLowerCase().includes(query)) ||
      (String(child.id).includes(query));

    // 2. Course Status Filter
    let matchStatus = true;
    if (childCourseStatusFilter.value === 'active') {
      matchStatus = child.active_courses && child.active_courses.length > 0;
    } else if (childCourseStatusFilter.value === 'inactive') {
      matchStatus = !child.active_courses || child.active_courses.length === 0;
    }

    // 3. Date Range Filter (Using created_at if available, otherwise skip)
    // Assuming backend adds created_at to ChildSerializer, if not, this filter won't work effectively
    // But we can check if child object has it.
    let matchDate = true;
    if (childDateRange.value && childDateRange.value.length === 2 && child.created_at) {
      const createdDate = new Date(child.created_at).toISOString().split('T')[0];
      matchDate = createdDate >= childDateRange.value[0] && createdDate <= childDateRange.value[1];
    }

    return matchQuery && matchStatus && matchDate;
  });
});

// Filter Actions
const clearUserFilters = () => {
  userSearchQuery.value = '';
  userRoleFilter.value = '';
  userDateRange.value = null;
};

const clearChildFilters = () => {
  childSearchQuery.value = '';
  childCourseStatusFilter.value = '';
  childDateRange.value = null;
};

const exportUserData = () => {
  const headers = ['ID', 'Username', 'Name', 'Email', 'Role', 'Points', 'Date Joined'];
  const csvContent = [
    headers.join(','),
    ...filteredUsers.value.map(u => [
      u.id,
      `"${u.username}"`,
      `"${u.name}"`,
      `"${u.email}"`,
      u.role,
      u.points,
      u.date_joined ? new Date(u.date_joined).toISOString().split('T')[0] : ''
    ].join(','))
  ].join('\n');

  downloadCSV(csvContent, 'users_export.csv');
};

const exportChildData = () => {
  const headers = ['ID', 'Name', 'DOB', 'Age Group', 'Skill Level', 'Parent', 'Active Courses'];
  const csvContent = [
    headers.join(','),
    ...filteredChildren.value.map(c => [
      c.id,
      `"${c.name}"`,
      c.date_of_birth,
      c.age_group,
      c.skill_level,
      `"${c.parentName}"`,
      `"${(c.active_courses || []).join('; ')}"`
    ].join(','))
  ].join('\n');

  downloadCSV(csvContent, 'children_export.csv');
};

const downloadCSV = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const fetchUsers = async () => {
  usersLoading.value = true;
  try {
    const data = await api.get('/users/');
    users.value = data;
  } catch (error) {
    console.error('Fetch users failed:', error);
  } finally {
    usersLoading.value = false;
  }
};

const fetchChildren = async () => {
  childrenLoading.value = true;
  try {
    const data = await api.get('/users/children/');
    const childrenWithParentNames = data.map(child => ({
      ...child,
      parentName: child.parent?.name || 'N/A'
    }));
    children.value = childrenWithParentNames;
  } catch (error) {
    console.error('Fetch children failed:', error);
  } finally {
    childrenLoading.value = false;
  }
};

const fetchParentList = async () => {
  try {
    const data = await api.get('/users/');
    parentList.value = data.filter(user => user.role === 'PARENT');
  } catch (error) {
    console.error('Fetch parent list failed:', error);
  }
};

const openCreateUserDialog = () => {
  isEditUser.value = false;
  Object.assign(userForm, { id: null, username: '', name: '', email: '', password: '', phoneNumber: '', role: 'PARENT', points: 0, children: [] });
  userDialogVisible.value = true;
};

const handleEditUser = (user) => {
  isEditUser.value = true;
  Object.assign(userForm, user);
  // Ensure children is an array
  if (!userForm.children) userForm.children = [];
  userDialogVisible.value = true;
};

const prepareAddChildForUser = () => {
  openCreateChildDialog();
  childForm.parent = userForm.id;
};

const saveUser = async () => {
  try {
    if (isEditUser.value) {
      const payload = {
        username: userForm.username,
        name: userForm.name,
        email: userForm.email,
        phone_number: userForm.phoneNumber,
        role: userForm.role,
        points: userForm.points,
        level: userForm.level,
      };
      await api.put(`/users/${userForm.id}/`, payload);
      ElMessage.success('用戶已更新');
    } else {
      // 先用註冊端點建立帳號（含密碼）
      const created = await api.post('/users/register/', {
        username: userForm.username,
        email: userForm.email,
        password: userForm.password,
        name: userForm.name,
        phone_number: userForm.phoneNumber,
      });
      // 之後用管理端點更新角色、積分等
      await api.patch(`/users/${created.id}/`, {
        role: userForm.role,
        points: userForm.points,
        level: userForm.level,
      });
      ElMessage.success('用戶已創建');
    }
    userDialogVisible.value = false;
    fetchUsers();
  } catch (error) {
    const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : (error.message || '操作失敗');
    ElMessage.error(errorMsg);
  }
};

const handleResetPassword = (user) => {
  selectedUserId.value = user.id;
  newPassword.value = '';
  resetPwdDialogVisible.value = true;
};

const confirmResetPassword = async () => {
  if (!newPassword.value) return ElMessage.warning('請輸入密碼');
  try {
    await api.put(`/users/${selectedUserId.value}/reset_password/`, { newPassword: newPassword.value });
    ElMessage.success('密碼已重設');
    resetPwdDialogVisible.value = false;
  } catch (error) {
    ElMessage.error('重設失敗');
  }
};

const handleDeleteUser = (user) => {
  ElMessageBox.confirm(`確定要刪除用戶 ${user.name} 嗎？`, '警告', { type: 'warning' })
    .then(async () => {
      try {
        await api.delete(`/users/${user.id}/`);
        ElMessage.success('用戶已刪除');
        fetchUsers();
      } catch (error) {
        ElMessage.error('刪除失敗');
      }
    });
};

const openCreateChildDialog = () => {
  isEditChild.value = false;
  Object.assign(childForm, { id: null, name: '', date_of_birth: '', age_group: 'U10', skill_level: 'BEGINNER', parent: null });
  childDialogVisible.value = true;
};

const handleEditChild = (child) => {
  isEditChild.value = true;
  Object.assign(childForm, {
    id: child.id,
    name: child.name,
    date_of_birth: child.date_of_birth,
    age_group: child.age_group,
    skill_level: child.skill_level,
    parent: child.parent?.id || child.parent // Handle both populated and ID-only parent
  });
  childDialogVisible.value = true;
};

const saveChild = async () => {
  try {
    if (!childForm.name || !childForm.age_group || !childForm.parent) {
      ElMessage.warning('請填寫所有必填項目');
      return;
    }
    
    const payload = {
      name: childForm.name,
      date_of_birth: childForm.date_of_birth || null,
      age_group: childForm.age_group,
      skill_level: childForm.skill_level,
      parent: childForm.parent
    };

    if (isEditChild.value) {
      await api.put(`/users/children/${childForm.id}/`, payload);
      ElMessage.success('學員已更新');
    } else {
      await api.post('/users/children/', payload);
      ElMessage.success('學員已新增');
    }
    childDialogVisible.value = false;
    
    // If we are editing a user, refresh that user's children
    if (userDialogVisible.value && userForm.id === childForm.parent) {
      const updatedUser = await api.get(`/users/${userForm.id}/`);
      userForm.children = updatedUser.children || [];
    }
    
    fetchChildren();
    fetchUsers(); // Also refresh the main list
  } catch (error) {
    ElMessage.error('操作失敗: ' + (error.response?.data?.message || ''));
  }
};

const handleDeleteChild = (child) => {
  ElMessageBox.confirm(`確定要刪除學員 ${child.name} 嗎？`, '警告', { type: 'warning' })
    .then(async () => {
      try {
        await api.delete(`/users/children/${child.id}/`);
        ElMessage.success('學員已刪除');
        
        // If we are editing a user, refresh that user's children
        if (userDialogVisible.value && userForm.id === (child.parent?.id || child.parent)) {
          const updatedUser = await api.get(`/users/${userForm.id}/`);
          userForm.children = updatedUser.children || [];
        }
        
        fetchChildren();
        fetchUsers();
      } catch (error) {
        ElMessage.error('刪除失敗');
      }
    });
};

onMounted(() => {
  fetchUsers();
  fetchChildren();
  fetchParentList();
});
</script>

<style scoped>
.admin-view {
  padding-bottom: 1rem;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .admin-header {
    margin-bottom: 2rem;
  }
}

.admin-header h2 {
  font-size: 1.25rem;
  margin: 0;
}

@media (min-width: 768px) {
  .admin-header h2 {
    font-size: 1.5rem;
  }
}

.tab-actions {
  margin-bottom: 1rem;
}

.table-card {
  border-radius: 16px;
}

.mobile-user-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobile-user-card {
  padding: 1rem;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  background-color: #fff;
}

.user-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.user-name {
  font-weight: 700;
  color: #1e293b;
}

.user-card-body {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 1rem;
}

.user-card-body p {
  margin: 4px 0;
}

.user-card-body .label {
  font-weight: 600;
  color: #94a3b8;
}

.user-card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.children-mgmt-section {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.children-list-edit {
  margin-top: 0.5rem;
}

.mt-2 { margin-top: 0.5rem; }
.text-right { text-align: right; }

.w-full { width: 100%; }

/* Element Plus hidden classes helper if not globally available */
@media (max-width: 767px) {
  .hidden-xs-only {
    display: none !important;
  }
}
@media (min-width: 768px) {
  .hidden-sm-and-up {
    display: none !important;
  }
}
</style>
