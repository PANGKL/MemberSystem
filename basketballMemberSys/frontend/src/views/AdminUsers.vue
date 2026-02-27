<template>
  <div class="admin-view">
    <div class="admin-header">
      <h2>帳號與學員管理</h2>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 用戶管理選項卡 -->
      <el-tab-pane label="帳號管理" name="users">
        <div class="tab-actions">
          <el-button type="primary" @click="openCreateUserDialog">
            <Plus class="w-4 h-4 mr-1" />
            新增帳號
          </el-button>
        </div>

        <el-card shadow="never" class="table-card">
          <!-- Desktop Table -->
          <el-table :data="users" v-loading="usersLoading" style="width: 100%" class="hidden-xs-only">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="username" label="用戶名" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="email" label="Email" />
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
            <div v-for="user in users" :key="user.id" class="mobile-user-card">
              <div class="user-card-header">
                <span class="user-name">{{ user.name }}</span>
                <el-tag :type="user.role === 'ADMIN' ? 'danger' : 'info'" size="small">{{ user.role }}</el-tag>
              </div>
              <div class="user-card-body">
                <p><span class="label">用戶名:</span> {{ user.username }}</p>
                <p><span class="label">Email:</span> {{ user.email }}</p>
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
        <div class="tab-actions">
          <el-button type="primary" @click="openCreateChildDialog">
            <Plus class="w-4 h-4 mr-1" />
            新增學員
          </el-button>
        </div>

        <el-card shadow="never" class="table-card">
          <!-- Desktop Table -->
          <el-table :data="children" v-loading="childrenLoading" style="width: 100%" class="hidden-xs-only">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="學員名稱" />
            <el-table-column prop="dateOfBirth" label="出生日期" width="120" />
            <el-table-column prop="ageGroup" label="年齡組別" width="100" />
            <el-table-column prop="skillLevel" label="技能等級" width="100" />
            <el-table-column prop="parentName" label="家長" />
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
            <div v-for="child in children" :key="child.id" class="mobile-user-card">
              <div class="user-card-header">
                <span class="user-name">{{ child.name }}</span>
                <el-tag size="small">{{ child.ageGroup }}</el-tag>
              </div>
              <div class="user-card-body">
                <p><span class="label">出生日期:</span> {{ child.dateOfBirth }}</p>
                <p><span class="label">技能等級:</span> {{ child.skillLevel }}</p>
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
    <el-dialog v-model="userDialogVisible" :title="isEditUser ? '編輯用戶' : '新增帳號'" width="90%" style="max-width: 500px">
      <el-form :model="userForm" label-position="top">
        <el-form-item label="用戶名">
          <el-input v-model="userForm.username" :disabled="isEditUser" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="userForm.name" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="密碼" v-if="!isEditUser">
          <el-input v-model="userForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="電話">
          <el-input v-model="userForm.phoneNumber" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.role" class="w-full">
            <el-option label="PARENT" value="PARENT" />
            <el-option label="COACH" value="COACH" />
            <el-option label="ADMIN" value="ADMIN" />
          </el-select>
        </el-form-item>
        <el-form-item label="積分" v-if="isEditUser">
          <el-input-number v-model="userForm.points" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">確認</el-button>
      </template>
    </el-dialog>

    <!-- 編輯/新增學員對話框 -->
    <el-dialog v-model="childDialogVisible" :title="isEditChild ? '編輯學員' : '新增學員'" width="90%" style="max-width: 500px">
      <el-form :model="childForm" label-position="top">
        <el-form-item label="學員名稱">
          <el-input v-model="childForm.name" />
        </el-form-item>
        <el-form-item label="出生日期">
          <el-input v-model="childForm.dateOfBirth" type="date" />
        </el-form-item>
        <el-form-item label="年齡組別">
          <el-select v-model="childForm.ageGroup" class="w-full">
            <el-option label="U10" value="U10" />
            <el-option label="U12" value="U12" />
            <el-option label="U14" value="U14" />
            <el-option label="U16" value="U16" />
            <el-option label="U18" value="U18" />
          </el-select>
        </el-form-item>
        <el-form-item label="技能等級">
          <el-select v-model="childForm.skillLevel" class="w-full">
            <el-option label="BEGINNER" value="BEGINNER" />
            <el-option label="INTERMEDIATE" value="INTERMEDIATE" />
            <el-option label="ADVANCED" value="ADVANCED" />
          </el-select>
        </el-form-item>
        <el-form-item label="家長">
          <el-select v-model="childForm.parentId" class="w-full" placeholder="選擇家長">
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
import { ref, onMounted, reactive } from 'vue';
import { useUserStore } from '../stores/userStore';
import api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from 'lucide-vue-next';

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

const userForm = reactive({
  id: null,
  username: '',
  name: '',
  email: '',
  password: '',
  phoneNumber: '',
  role: 'PARENT',
  points: 0,
  level: 'NOVICE'
});

// Child Management
const children = ref([]);
const childrenLoading = ref(false);
const childDialogVisible = ref(false);
const isEditChild = ref(false);
const parentList = ref([]);

const childForm = reactive({
  id: null,
  name: '',
  dateOfBirth: '',
  ageGroup: 'U10',
  skillLevel: 'BEGINNER',
  parentId: null
});

const fetchUsers = async () => {
  usersLoading.value = true;
  try {
    const data = await api.get('/user/all');
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
    const data = await api.get('/children/all');
    // Map parent names to children
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
    const data = await api.get('/user/all');
    parentList.value = data.filter(user => user.role === 'PARENT');
  } catch (error) {
    console.error('Fetch parent list failed:', error);
  }
};

const openCreateUserDialog = () => {
  isEditUser.value = false;
  Object.assign(userForm, { id: null, username: '', name: '', email: '', password: '', phoneNumber: '', role: 'PARENT', points: 0 });
  userDialogVisible.value = true;
};

const handleEditUser = (user) => {
  isEditUser.value = true;
  Object.assign(userForm, user);
  userDialogVisible.value = true;
};

const saveUser = async () => {
  try {
    if (isEditUser.value) {
      await api.put(`/user/${userForm.id}`, userForm);
      ElMessage.success('用戶已更新');
    } else {
      await api.post('/user/create', userForm);
      ElMessage.success('用戶已創建');
    }
    userDialogVisible.value = false;
    fetchUsers();
  } catch (error) {
    ElMessage.error('操作失敗');
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
    await api.put(`/user/${selectedUserId.value}/reset-password`, { newPassword: newPassword.value });
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
        await api.delete(`/user/${user.id}`);
        ElMessage.success('用戶已刪除');
        fetchUsers();
      } catch (error) {
        ElMessage.error('刪除失敗');
      }
    });
};

const openCreateChildDialog = () => {
  isEditChild.value = false;
  Object.assign(childForm, { id: null, name: '', dateOfBirth: '', ageGroup: 'U10', skillLevel: 'BEGINNER', parentId: null });
  childDialogVisible.value = true;
};

const handleEditChild = (child) => {
  isEditChild.value = true;
  Object.assign(childForm, child);
  childDialogVisible.value = true;
};

const saveChild = async () => {
  try {
    if (!childForm.name || !childForm.ageGroup || !childForm.parentId) {
      ElMessage.warning('請填寫所有必填項目');
      return;
    }
    
    if (isEditChild.value) {
      await api.put(`/children/${childForm.id}`, childForm);
      ElMessage.success('學員已更新');
    } else {
      await api.post('/children', childForm);
      ElMessage.success('學員已新增');
    }
    childDialogVisible.value = false;
    fetchChildren();
  } catch (error) {
    ElMessage.error('操作失敗: ' + (error.response?.data?.message || ''));
  }
};

const handleDeleteChild = (child) => {
  ElMessageBox.confirm(`確定要刪除學員 ${child.name} 嗎？`, '警告', { type: 'warning' })
    .then(async () => {
      try {
        await api.delete(`/children/${child.id}`);
        ElMessage.success('學員已刪除');
        fetchChildren();
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
