<template>
  <div class="user-mgmt">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold m-0">帳號管理</h2>
      <el-button type="primary" @click="openCreateDialog">新增帳號</el-button>
    </div>

    <!-- 篩選器 -->
    <el-card class="mb-4" shadow="never">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <el-input
          v-model="filters.query"
          placeholder="搜尋姓名、Email、用戶名"
          prefix-icon="Search"
          clearable
        />
        <el-select
          v-model="filters.role"
          placeholder="角色篩選"
          clearable
          class="w-full"
        >
          <el-option
            v-for="item in roleOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        
        <div class="flex gap-2">
           <el-date-picker
            v-model="filters.startDate"
            type="date"
            placeholder="註冊開始"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
           <el-date-picker
            v-model="filters.endDate"
            type="date"
            placeholder="註冊結束"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </div>
        
        <div class="flex justify-end gap-2">
          <el-button @click="clearFilters">清除</el-button>
          <el-button type="primary" @click="exportData">匯出 CSV</el-button>
        </div>
      </div>
    </el-card>

    <!-- 學員管理部分 -->
    <el-tabs v-model="activeTab" class="mb-4">
      <el-tab-pane label="帳號列表" name="users">
        <el-card shadow="never">
          <el-table
            v-loading="loading"
            :data="filteredUsers"
            style="width: 100%"
            empty-text="暫無用戶資料"
          >
            <el-table-column prop="id" label="ID" width="60" sortable />
            <el-table-column prop="username" label="用戶名" sortable />
            <el-table-column prop="name" label="姓名" sortable />
            <el-table-column prop="email" label="Email" />
            <el-table-column prop="date_joined" label="註冊日期" sortable>
              <template #default="{ row }">
                {{ formatDate(row.date_joined) }}
              </template>
            </el-table-column>
            <el-table-column prop="role" label="角色" sortable>
              <template #default="{ row }">
                <el-tag :type="row.role === 'ADMIN' ? 'danger' : 'info'" size="small">
                  {{ row.role }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="points" label="積分" sortable />
            
            <el-table-column label="操作" width="300" fixed="right">
              <template #default="{ row }">
                  <el-button type="primary" size="small" @click="handleEdit(row)">編輯</el-button>
                  <el-button type="warning" size="small" @click="handleResetPassword(row)">重設</el-button>
                  <el-button type="danger" size="small" @click="handleDelete(row)" :disabled="row.id === userStore.user.id"
                  >刪除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="所有學員" name="children">
        <el-card shadow="never">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold m-0">學員列表</h3>
            <el-button type="primary" @click="openAddChildFromList">新增學員</el-button>
          </div>
          <el-table :data="allChildren" style="width: 100%" v-loading="childrenLoading" empty-text="暫無學員資料">
            <el-table-column prop="id" label="ID" width="60" sortable />
            <el-table-column prop="name" label="姓名" sortable />
            <el-table-column prop="date_of_birth" label="出生日期" sortable />
            <el-table-column label="班級" sortable>
              <template #default="{ row }">
                {{ row.academic_year_name }} - {{ row.student_class_name || '未分班' }}
              </template>
            </el-table-column>
            <el-table-column label="家長">
              <template #default="{ row }">
                {{ row.parent_name }} ({{ row.parent_username }})
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <div class="flex gap-2">
                  <el-button type="primary" size="small" @click="handleEditChildFromList(row)">編輯</el-button>
                  <el-button type="danger" size="small" @click="handleDeleteChildFromList(row)">刪除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 編輯/新增對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '編輯用戶' : '新增帳號'"
      width="600px"
    >
      <el-form ref="formRef" :model="form" label-width="80px" class="flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <el-form-item label="用戶名" required>
            <el-input v-model="form.username" :disabled="isEdit" />
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="Email">
            <el-input v-model="form.email" type="email" />
          </el-form-item>
          <el-form-item label="電話">
            <el-input v-model="form.phoneNumber" />
          </el-form-item>
          <el-form-item v-if="!isEdit" label="密碼" required>
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="form.role" class="w-full">
              <el-option
                v-for="item in roleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="isEdit" label="積分">
            <el-input-number v-model="form.points" :min="0" class="w-full" />
          </el-form-item>
        </div>

        <!-- 子學員管理 (僅家長) -->
        <div v-if="isEdit && form.role === 'PARENT'" class="bg-gray-50 p-4 rounded">
          <div class="flex justify-between items-center mb-2">
            <h4 class="text-sm font-bold">學員資料</h4>
            <el-button size="small" @click="openAddChild">新增學員</el-button>
          </div>
          <el-table :data="form.children || []" style="width: 100%" size="small" empty-text="尚無學員">
            <el-table-column prop="name" label="姓名" />
            <el-table-column label="班級">
              <template #default="{ row }">
                {{ row.academic_year_name }} - {{ row.student_class_name || '未分班' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <div class="flex gap-2">
                  <el-button type="primary" size="small" icon="Edit" circle @click="handleEditChild(row)" />
                  <el-button type="danger" size="small" icon="Delete" circle @click="handleDeleteChild(row)" />
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveUser">儲存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 重設密碼 -->
    <el-dialog
      v-model="resetPwdVisible"
      title="重設密碼"
      width="400px"
    >
      <el-form @submit.prevent="confirmResetPassword" label-width="80px">
        <el-form-item label="新密碼" required>
          <el-input v-model="newPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPwdVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmResetPassword">確認重設</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 學員編輯對話框 -->
    <el-dialog
      v-model="childDialogVisible"
      :title="isEditChild ? '編輯學員' : '新增學員'"
      width="500px"
    >
      <el-form label-width="100px" class="flex flex-col gap-4">
        <el-form-item label="家長" required>
          <el-select 
            v-model="childForm.parent" 
            placeholder="搜尋家長姓名或Email" 
            filterable 
            clearable 
            class="w-full"
            :disabled="!isEditChild && childForm.parent && form.id && activeTab === 'users'"
          >
            <!-- Note: if activeTab is 'users', we might be adding child to a specific user context (form.id). 
                 But openAddChildFromList clears parent, so user must select. 
                 Let's make sure we have a list of parents. `users` array contains all users.
            -->
            <el-option
              v-for="u in parentOptions"
              :key="u.id"
              :label="`${u.name} (${u.email})`"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="學員名稱" required>
          <el-input v-model="childForm.name" />
        </el-form-item>
        <el-form-item label="出生日期">
          <el-date-picker
            v-model="childForm.date_of_birth"
            type="date"
            placeholder="選擇日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="班級">
          <el-select v-model="childForm.student_class" placeholder="選擇班級" clearable class="w-full">
            <el-option
              v-for="item in classOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="childDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveChild">確認</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../../api';
import { useUserStore } from '../../stores/userStore';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Edit, Delete, Lock } from '@element-plus/icons-vue';

const userStore = useUserStore();

const loading = ref(false);
const saving = ref(false);
const users = ref([]);
const classes = ref([]);
const activeTab = ref('users');
const childrenLoading = ref(false);
const allChildren = ref([]);

const dialogVisible = ref(false);
const isEdit = ref(false);
const resetPwdVisible = ref(false);
const selectedUserId = ref(null);
const newPassword = ref('');

const childDialogVisible = ref(false);
const isEditChild = ref(false);

const filters = reactive({
  query: '',
  role: '',
  startDate: null,
  endDate: null
});

const form = reactive({
  id: null,
  username: '',
  name: '',
  email: '',
  password: '',
  phoneNumber: '',
  role: 'PARENT',
  points: 0,
  children: []
});

const childForm = reactive({
  id: null,
  name: '',
  date_of_birth: null,
  student_class: null,
  parent: null
});

const roleOptions = [
  { label: '全部角色', value: '' },
  { label: '管理員 (Admin)', value: 'ADMIN' },
  { label: '教練 (Coach)', value: 'COACH' },
  { label: '家長 (Parent)', value: 'PARENT' }
];

const classOptions = computed(() => {
  return classes.value.map(c => ({
    label: `${c.academic_year_name} - ${c.name}`,
    value: c.id
  }));
});

const parentOptions = computed(() => {
  // Return users with role PARENT or all users? Usually parents.
  return users.value.filter(u => u.role === 'PARENT').map(u => ({
    id: u.id,
    name: u.name || u.username,
    email: u.email
  }));
});

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('zh-TW');
};

const formatDateForApi = (date) => {
  if (!date) return null;
  // If it's already YYYY-MM-DD string from el-date-picker value-format
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
};

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const q = filters.query.toLowerCase();
    const matchQuery = !q || 
      (user.name?.toLowerCase().includes(q)) ||
      (user.email?.toLowerCase().includes(q)) ||
      (user.username?.toLowerCase().includes(q));
    
    const matchRole = !filters.role || user.role === filters.role;
    
    let matchDate = true;
    if (filters.startDate && filters.endDate && user.date_joined) {
      const joined = new Date(user.date_joined).toISOString().split('T')[0];
      // el-date-picker with value-format="YYYY-MM-DD" returns string directly
      const start = filters.startDate;
      const end = filters.endDate;
      matchDate = joined >= start && joined <= end;
    }

    return matchQuery && matchRole && matchDate;
  });
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    const data = await api.get('/users/');
    users.value = data;
    fetchAllChildren(); // Load children as well
  } catch (error) {
    ElMessage.error('無法載入用戶資料');
  } finally {
    loading.value = false;
  }
};

const fetchAllChildren = async () => {
  childrenLoading.value = true;
  try {
    // Assuming we have an endpoint to list all children or we extract from users.
    // If backend doesn't have /users/children/list-all, we might need to rely on users list.
    // But typically admin needs a flat list. Let's assume we can GET /users/children/ (admin view).
    // If not, we map from users:
    const children = [];
    users.value.forEach(u => {
      if (u.children && u.children.length) {
        u.children.forEach(c => {
          children.push({
            ...c,
            parent_id: u.id,
            parent_name: u.name,
            parent_username: u.username
          });
        });
      }
    });
    allChildren.value = children;
  } catch (error) {
    console.error(error);
  } finally {
    childrenLoading.value = false;
  }
};

const openAddChildFromList = () => {
  isEditChild.value = false;
  // We need to allow selecting a parent for the new child
  Object.assign(childForm, { id: null, name: '', date_of_birth: null, student_class: null, parent: null });
  childDialogVisible.value = true;
};

const handleEditChildFromList = (child) => {
  // Find parent to set form.id for context if needed, but childDialog handles logic
  // We need to set parent info in childForm
  isEditChild.value = true;
  Object.assign(childForm, {
    id: child.id,
    name: child.name,
    date_of_birth: child.date_of_birth ? new Date(child.date_of_birth) : null,
    student_class: child.student_class,
    parent: child.parent_id || child.parent // Adapt based on API response
  });
  // Also need to ensure `form.id` (parent id) is set if `saveChild` uses it?
  // saveChild uses `childForm.parent`.
  // But wait, saveChild also refreshes user list.
  childDialogVisible.value = true;
};

const handleDeleteChildFromList = async (child) => {
  try {
    await ElMessageBox.confirm(`確定刪除學員 ${child.name}？`, '警告', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await api.delete(`/users/children/${child.id}/`);
    ElMessage.success('已刪除');
    fetchUsers(); // This will refresh users and rebuild children list
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('刪除失敗');
  }
};

const fetchClasses = async () => {
  try {
    const data = await api.get('/users/classes/');
    classes.value = data;
  } catch (error) {
    console.error(error);
  }
};

const clearFilters = () => {
  Object.assign(filters, { query: '', role: '', startDate: null, endDate: null });
};

const exportData = () => {
  const headers = ['ID', 'Username', 'Name', 'Email', 'Role', 'Points', 'Date Joined'];
  const csv = [
    headers.join(','),
    ...filteredUsers.value.map(u => [
      u.id, u.username, u.name, u.email, u.role, u.points, u.date_joined
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'users.csv';
  link.click();
};

const openCreateDialog = () => {
  isEdit.value = false;
  Object.assign(form, { id: null, username: '', name: '', email: '', password: '', role: 'PARENT', points: 0, children: [] });
  dialogVisible.value = true;
};

const handleEdit = (user) => {
  isEdit.value = true;
  Object.assign(form, user);
  if (!form.children) form.children = [];
  dialogVisible.value = true;
};

const saveUser = async () => {
  if (!form.username) {
    ElMessage.warning('請輸入用戶名');
    return;
  }
  if (!isEdit.value && !form.password) {
    ElMessage.warning('請輸入密碼');
    return;
  }

  saving.value = true;
  try {
    if (isEdit.value) {
      await api.patch(`/users/${form.id}/`, {
        username: form.username,
        name: form.name,
        email: form.email,
        phone_number: form.phoneNumber,
        role: form.role,
        points: form.points
      });
      ElMessage.success('用戶已更新');
    } else {
      const created = await api.post('/users/register/', {
        username: form.username,
        email: form.email,
        password: form.password,
        name: form.name,
        phone_number: form.phoneNumber
      });
      await api.patch(`/users/${created.id}/`, { role: form.role, points: form.points });
      ElMessage.success('用戶已創建');
    }
    dialogVisible.value = false;
    fetchUsers();
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失敗');
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (user) => {
  try {
    await ElMessageBox.confirm(`確定刪除 ${user.name}？`, '警告', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    
    await api.delete(`/users/${user.id}/`);
    ElMessage.success('已刪除');
    fetchUsers();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('刪除失敗');
  }
};

const handleResetPassword = (user) => {
  selectedUserId.value = user.id;
  newPassword.value = '';
  resetPwdVisible.value = true;
};

const confirmResetPassword = async () => {
  if (!newPassword.value) {
    ElMessage.warning('請輸入新密碼');
    return;
  }
  try {
    await api.put(`/users/${selectedUserId.value}/reset_password/`, { newPassword: newPassword.value });
    ElMessage.success('密碼已重設');
    resetPwdVisible.value = false;
  } catch (e) {
    ElMessage.error('重設失敗');
  }
};

// Child Mgmt inside User Dialog
const openAddChild = () => {
  isEditChild.value = false;
  Object.assign(childForm, { id: null, name: '', date_of_birth: null, student_class: null, parent: form.id });
  childDialogVisible.value = true;
};

const handleEditChild = (child) => {
  isEditChild.value = true;
  Object.assign(childForm, {
    id: child.id,
    name: child.name,
    date_of_birth: child.date_of_birth ? new Date(child.date_of_birth) : null,
    student_class: child.student_class,
    parent: form.id
  });
  childDialogVisible.value = true;
};

// New function to open add child dialog from the main list (not inside user dialog)
// However, adding a child requires a parent. If we add from main list, we need to select a parent.
// For now, let's keep "Add Child" inside User Edit/Create dialog as it simplifies parent association.
// If "Add Child" is needed on the main page, we would need a parent selector in the child form.

const saveChild = async () => {
  if (!childForm.name) {
    ElMessage.warning('請輸入學員名稱');
    return;
  }
  try {
    const payload = {
      name: childForm.name,
      date_of_birth: childForm.date_of_birth, // Already YYYY-MM-DD from el-date-picker
      student_class: childForm.student_class,
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
    // Refresh user data to update children list in form
    if (form.id) {
       const updatedUser = await api.get(`/users/${form.id}/`);
       form.children = updatedUser.children || [];
    }
    fetchUsers(); // Also refresh main list to update allChildren view
  } catch (e) {
    ElMessage.error('操作失敗');
  }
};

const handleDeleteChild = async (child) => {
  try {
    await ElMessageBox.confirm(`確定刪除學員 ${child.name}？`, '警告', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await api.delete(`/users/children/${child.id}/`);
    ElMessage.success('已刪除');
    const updatedUser = await api.get(`/users/${form.id}/`);
    form.children = updatedUser.children || [];
    fetchUsers();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('刪除失敗');
  }
};

onMounted(() => {
  fetchUsers();
  fetchClasses();
});
</script>

<style scoped>
.user-mgmt {
  padding: 1rem;
}
</style>
