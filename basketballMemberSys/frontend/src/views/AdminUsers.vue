<template>
  <div class="admin-view">
    <div class="admin-header">
      <h2>帳號管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <Plus class="w-4 h-4 mr-1" />
        新增帳號
      </el-button>
    </div>

    <el-card shadow="never" class="table-card">
      <!-- Desktop Table -->
      <el-table :data="users" v-loading="loading" style="width: 100%" class="hidden-xs-only">
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
              <el-button size="small" @click="handleEdit(row)">編輯</el-button>
              <el-button size="small" type="warning" @click="handleResetPassword(row)">重設密碼</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)" :disabled="row.id === userStore.user.id">刪除</el-button>
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
            <el-button size="small" @click="handleEdit(user)">編輯</el-button>
            <el-button size="small" type="warning" @click="handleResetPassword(user)">重設</el-button>
            <el-button size="small" type="danger" @click="handleDelete(user)" :disabled="user.id === userStore.user.id">刪除</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 編輯/新增對話框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '編輯用戶' : '新增帳號'" width="90%" style="max-width: 500px">
      <el-form :model="form" label-position="top">
        <el-form-item label="用戶名">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="密碼" v-if="!isEdit">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="電話">
          <el-input v-model="form.phoneNumber" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" class="w-full">
            <el-option label="PARENT" value="PARENT" />
            <el-option label="COACH" value="COACH" />
            <el-option label="ADMIN" value="ADMIN" />
          </el-select>
        </el-form-item>
        <el-form-item label="積分" v-if="isEdit">
          <el-input-number v-model="form.points" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">確認</el-button>
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
const users = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const resetPwdDialogVisible = ref(false);
const selectedUserId = ref(null);
const newPassword = ref('');

const form = reactive({
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

const fetchUsers = async () => {
  loading.value = true;
  try {
    const data = await api.get('/user/all');
    users.value = data;
  } catch (error) {
    console.error('Fetch users failed:', error);
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  isEdit.value = false;
  Object.assign(form, { id: null, username: '', name: '', email: '', password: '', phoneNumber: '', role: 'PARENT', points: 0 });
  dialogVisible.value = true;
};

const handleEdit = (user) => {
  isEdit.value = true;
  Object.assign(form, user);
  dialogVisible.value = true;
};

const saveUser = async () => {
  try {
    if (isEdit.value) {
      await api.put(`/user/${form.id}`, form);
      ElMessage.success('更新成功');
    } else {
      await api.post('/user/create', form);
      ElMessage.success('創建成功');
    }
    dialogVisible.value = false;
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

const handleDelete = (user) => {
  ElMessageBox.confirm(`確定要刪除用戶 ${user.name} 嗎？`, '警告', { type: 'warning' })
    .then(async () => {
      await api.delete(`/user/${user.id}`);
      ElMessage.success('已刪除');
      fetchUsers();
    });
};

onMounted(fetchUsers);
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
