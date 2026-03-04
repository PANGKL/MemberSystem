<template>
  <div class="user-mgmt">
    <div class="flex justify-between items-center mb-4">
      <h2 class="va-h6 m-0">帳號管理</h2>
      <VaButton icon="add" @click="openCreateDialog">新增帳號</VaButton>
    </div>

    <!-- 篩選器 -->
    <VaCard class="mb-4">
      <VaCardContent>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <VaInput
            v-model="filters.query"
            placeholder="搜尋姓名、Email、用戶名"
            prepend-inner-icon="search"
            clearable
          />
          <VaSelect
            v-model="filters.role"
            placeholder="角色篩選"
            :options="roleOptions"
            value-by="value"
            text-by="label"
            clearable
          />
          <!-- Vuestic DateInput range not fully supported in one component easily without adapter, using 2 inputs or custom -->
          <!-- Simplified to single date or using text for now, or use VaDateInput with mode="range" if supported in version -->
          <div class="flex gap-2">
             <VaDateInput
              v-model="filters.startDate"
              placeholder="註冊開始"
              clearable
            />
             <VaDateInput
              v-model="filters.endDate"
              placeholder="註冊結束"
              clearable
            />
          </div>
          
          <div class="flex justify-end gap-2">
            <VaButton preset="secondary" @click="clearFilters">清除</VaButton>
            <VaButton preset="primary" @click="exportData">匯出 CSV</VaButton>
          </div>
        </div>
      </VaCardContent>
    </VaCard>

    <VaCard>
      <VaCardContent>
        <VaDataTable
          :items="filteredUsers"
          :columns="columns"
          :loading="loading"
          no-data-html="暫無用戶資料"
        >
          <template #cell(date_joined)="{ row }">
            {{ formatDate(row.rowData.date_joined) }}
          </template>
          
          <template #cell(role)="{ row }">
            <VaChip :color="row.rowData.role === 'ADMIN' ? 'danger' : 'info'" size="small">
              {{ row.rowData.role }}
            </VaChip>
          </template>

          <template #cell(actions)="{ row }">
            <div class="flex gap-2">
              <VaButton preset="primary" size="small" icon="edit" @click="handleEdit(row.rowData)" />
              <VaButton preset="warning" size="small" icon="lock_reset" @click="handleResetPassword(row.rowData)" />
              <VaButton 
                preset="danger" 
                size="small" 
                icon="delete" 
                @click="handleDelete(row.rowData)"
                :disabled="row.rowData.id === userStore.user.id"
              />
            </div>
          </template>
        </VaDataTable>
      </VaCardContent>
    </VaCard>

    <!-- 編輯/新增對話框 -->
    <VaModal
      v-model="dialogVisible"
      :title="isEdit ? '編輯用戶' : '新增帳號'"
      hide-default-actions
      size="large"
    >
      <VaForm ref="formRef" @submit.prevent="saveUser" class="flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VaInput
            v-model="form.username"
            label="用戶名"
            :disabled="isEdit"
            :rules="[(v) => !!v || '請輸入用戶名']"
          />
          <VaInput
            v-model="form.name"
            label="姓名"
          />
          <VaInput
            v-model="form.email"
            label="Email"
            type="email"
          />
          <VaInput
            v-model="form.phoneNumber"
            label="電話"
          />
          <VaInput
            v-if="!isEdit"
            v-model="form.password"
            label="密碼"
            type="password"
            :rules="[(v) => !!v || '請輸入密碼']"
          />
          <VaSelect
            v-model="form.role"
            label="角色"
            :options="roleOptions"
            value-by="value"
            text-by="label"
          />
          <VaCounter
            v-if="isEdit"
            v-model="form.points"
            label="積分"
            :min="0"
          />
        </div>

        <!-- 子學員管理 (僅家長) -->
        <div v-if="isEdit && form.role === 'PARENT'" class="bg-gray-50 p-4 rounded">
          <div class="flex justify-between items-center mb-2">
            <h4 class="va-h6">學員資料</h4>
            <VaButton size="small" icon="add" @click="openAddChild">新增學員</VaButton>
          </div>
          <VaDataTable
            :items="form.children || []"
            :columns="childColumns"
            no-data-html="尚無學員"
          >
            <template #cell(student_class_name)="{ row }">
               {{ row.rowData.academic_year_name }} - {{ row.rowData.student_class_name || '未分班' }}
            </template>
            <template #cell(actions)="{ row }">
              <div class="flex gap-2">
                <VaButton preset="primary" size="small" icon="edit" @click="handleEditChild(row.rowData)" />
                <VaButton preset="danger" size="small" icon="delete" @click="handleDeleteChild(row.rowData)" />
              </div>
            </template>
          </VaDataTable>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <VaButton preset="secondary" @click="dialogVisible = false">取消</VaButton>
          <VaButton type="submit" :loading="saving">儲存</VaButton>
        </div>
      </VaForm>
    </VaModal>

    <!-- 重設密碼 -->
    <VaModal
      v-model="resetPwdVisible"
      title="重設密碼"
      hide-default-actions
    >
      <VaForm @submit.prevent="confirmResetPassword" class="flex flex-col gap-4">
        <VaInput
          v-model="newPassword"
          label="新密碼"
          type="password"
          :rules="[(v) => !!v || '請輸入新密碼']"
        />
        <div class="flex justify-end gap-2 mt-4">
          <VaButton preset="secondary" @click="resetPwdVisible = false">取消</VaButton>
          <VaButton type="submit">確認重設</VaButton>
        </div>
      </VaForm>
    </VaModal>

    <!-- 學員編輯對話框 -->
    <VaModal
      v-model="childDialogVisible"
      :title="isEditChild ? '編輯學員' : '新增學員'"
      hide-default-actions
    >
      <VaForm @submit.prevent="saveChild" class="flex flex-col gap-4">
        <VaInput v-model="childForm.name" label="學員名稱" :rules="[(v) => !!v || '請輸入姓名']" />
        <VaDateInput 
          v-model="childForm.date_of_birth" 
          label="出生日期" 
          clearable 
          @update:model-value="(v) => childForm.date_of_birth = formatDateForApi(v)"
        />
        <VaSelect
          v-model="childForm.student_class"
          label="班級"
          :options="classOptions"
          value-by="value"
          text-by="label"
          clearable
          placeholder="選擇班級"
        />
        
        <div class="flex justify-end gap-2 mt-4">
          <VaButton preset="secondary" @click="childDialogVisible = false">取消</VaButton>
          <VaButton type="submit">確認</VaButton>
        </div>
      </VaForm>
    </VaModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../../api';
import { useUserStore } from '../../stores/userStore';
import { useNotifications } from '../../utils/notifications';
import { useConfirm } from '../../utils/confirm';

const userStore = useUserStore();
const { notifySuccess, notifyError } = useNotifications();
const { confirmAction } = useConfirm();

const loading = ref(false);
const saving = ref(false);
const users = ref([]);
const classes = ref([]);

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

const columns = [
  { key: 'id', label: 'ID', width: '60px', sortable: true },
  { key: 'username', label: '用戶名', sortable: true },
  { key: 'name', label: '姓名', sortable: true },
  { key: 'email', label: 'Email' },
  { key: 'date_joined', label: '註冊日期', sortable: true },
  { key: 'role', label: '角色', sortable: true },
  { key: 'points', label: '積分', sortable: true },
  { key: 'actions', label: '操作', width: '180px' }
];

const childColumns = [
  { key: 'name', label: '姓名' },
  { key: 'student_class_name', label: '班級' },
  { key: 'actions', label: '操作', width: '120px' }
];

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

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('zh-TW');
};

const formatDateForApi = (date) => {
  if (!date) return null;
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
      const start = formatDateForApi(filters.startDate);
      const end = formatDateForApi(filters.endDate);
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
  } catch (error) {
    notifyError('無法載入用戶資料');
  } finally {
    loading.value = false;
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
  saving.value = true;
  try {
    if (isEdit.value) {
      await api.put(`/users/${form.id}/`, {
        username: form.username,
        name: form.name,
        email: form.email,
        phone_number: form.phoneNumber,
        role: form.role,
        points: form.points
      });
      notifySuccess('用戶已更新');
    } else {
      const created = await api.post('/users/register/', {
        username: form.username,
        email: form.email,
        password: form.password,
        name: form.name,
        phone_number: form.phoneNumber
      });
      await api.patch(`/users/${created.id}/`, { role: form.role, points: form.points });
      notifySuccess('用戶已創建');
    }
    dialogVisible.value = false;
    fetchUsers();
  } catch (error) {
    notifyError(error.response?.data?.message || '操作失敗');
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (user) => {
  const confirmed = await confirmAction({ message: `確定刪除 ${user.name}？` });
  if (confirmed) {
    try {
      await api.delete(`/users/${user.id}/`);
      notifySuccess('已刪除');
      fetchUsers();
    } catch (e) {
      notifyError('刪除失敗');
    }
  }
};

const handleResetPassword = (user) => {
  selectedUserId.value = user.id;
  newPassword.value = '';
  resetPwdVisible.value = true;
};

const confirmResetPassword = async () => {
  try {
    await api.put(`/users/${selectedUserId.value}/reset_password/`, { newPassword: newPassword.value });
    notifySuccess('密碼已重設');
    resetPwdVisible.value = false;
  } catch (e) {
    notifyError('重設失敗');
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

const saveChild = async () => {
  try {
    const payload = {
      name: childForm.name,
      date_of_birth: formatDateForApi(childForm.date_of_birth),
      student_class: childForm.student_class,
      parent: childForm.parent
    };

    if (isEditChild.value) {
      await api.put(`/users/children/${childForm.id}/`, payload);
      notifySuccess('學員已更新');
    } else {
      await api.post('/users/children/', payload);
      notifySuccess('學員已新增');
    }
    childDialogVisible.value = false;
    // Refresh user data to update children list in form
    const updatedUser = await api.get(`/users/${form.id}/`);
    form.children = updatedUser.children || [];
    fetchUsers(); // Also refresh main list
  } catch (e) {
    notifyError('操作失敗');
  }
};

const handleDeleteChild = async (child) => {
  const confirmed = await confirmAction({ message: `確定刪除學員 ${child.name}？` });
  if (confirmed) {
    try {
      await api.delete(`/users/children/${child.id}/`);
      notifySuccess('已刪除');
      const updatedUser = await api.get(`/users/${form.id}/`);
      form.children = updatedUser.children || [];
      fetchUsers();
    } catch (e) {
      notifyError('刪除失敗');
    }
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
