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
                placeholder="搜尋"
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
        <!-- 搜尋與篩選區域 -->
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
              <el-select v-model="childClassFilter" placeholder="班級篩選" clearable style="width: 100%">
                <el-option label="全部" value="" />
                <el-option 
                  v-for="cls in classes" 
                  :key="cls.id" 
                  :label="`${cls.academic_year_name} - ${cls.name}`" 
                  :value="cls.id" 
                />
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
            <el-table-column prop="student_class_name" label="班級" width="150">
              <template #default="{ row }">
                {{ row.academic_year_name }} - {{ row.student_class_name || '未分班' }}
              </template>
            </el-table-column>
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
                <el-tag size="small">{{ child.academic_year_name }} - {{ child.student_class_name || '未分班' }}</el-tag>
              </div>
              <div class="user-card-body">
                <p><span class="label">出生日期:</span> {{ child.date_of_birth }}</p>
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

      <!-- 班別管理選項卡 -->
      <el-tab-pane label="班別管理" name="classes">
        <div class="tab-actions">
          <el-button type="primary" @click="openCreateClassDialog">
            <Plus class="w-4 h-4 mr-1" />
            新增班別
          </el-button>
        </div>

        <el-card shadow="never" class="table-card">
          <el-table :data="classes" v-loading="classesLoading" style="width: 100%">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="academic_year_name" label="學年度" />
            <el-table-column prop="name" label="班別名稱" />
            <el-table-column label="操作" width="220">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditClass(row)">編輯</el-button>
                <el-button size="small" type="primary" @click="openClassStudents(row)">查看學生</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 學年管理選項卡 -->
      <el-tab-pane label="學年管理" name="academic_years">
        <div class="tab-actions">
          <el-button type="primary" @click="openCreateAcademicYearDialog">
            <Plus class="w-4 h-4 mr-1" />
            新增學年
          </el-button>
        </div>

        <el-card shadow="never" class="table-card">
          <el-table :data="academicYears" v-loading="academicYearsLoading" style="width: 100%">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="學年度名稱" />
            <el-table-column prop="start_date" label="起始日期" />
            <el-table-column prop="end_date" label="結束日期" />
            <el-table-column prop="is_active" label="狀態">
              <template #default="{ row }">
                <el-tag :type="row.is_active ? 'success' : 'danger'">
                  {{ row.is_active ? '啟用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button-group>
                  <el-button size="small" @click="handleEditAcademicYear(row)">編輯</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteAcademicYear(row)">刪除</el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
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
              <el-table-column prop="student_class_name" label="班級">
                <template #default="{ row }">
                  {{ row.academic_year_name }} - {{ row.student_class_name || '未分班' }}
                </template>
              </el-table-column>
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
        <el-form-item label="班級">
          <el-select v-model="childForm.student_class" class="w-full" clearable placeholder="選擇班級">
            <el-option 
              v-for="cls in classes" 
              :key="cls.id" 
              :label="`${cls.academic_year_name} - ${cls.name}`" 
              :value="cls.id" 
            />
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

    <!-- 建立班別對話框 -->
    <el-dialog v-model="classDialogVisible" title="建立班別" width="90%" style="max-width: 500px">
      <el-form :model="classForm" label-position="top">
        <el-form-item label="學年度" required>
          <el-select v-model="classForm.academic_year" placeholder="請選擇學年度" style="width: 100%" v-loading="academicYearsLoading">
            <el-option 
              v-for="year in activeAcademicYears" 
              :key="year.id" 
              :label="year.name" 
              :value="year.id" 
            />
          </el-select>
          <div v-if="activeAcademicYears.length === 0 && !academicYearsLoading" class="text-xs text-red-500 mt-1">
            目前無啟用的學年度，請先至「學年管理」新增或啟用學年。
          </div>
        </el-form-item>
        <el-form-item label="班別名稱" required>
          <el-input 
            v-model="classForm.name" 
            placeholder="請輸入班別名稱 (限制 20 字)" 
            maxlength="20" 
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="classDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveClass" :disabled="activeAcademicYears.length === 0">建立</el-button>
      </template>
    </el-dialog>

    <!-- 學年編輯/新增對話框 -->
    <el-dialog v-model="academicYearDialogVisible" :title="isEditAcademicYear ? '編輯學年' : '新增學年'" width="90%" style="max-width: 500px">
      <el-form :model="academicYearForm" label-position="top">
        <el-form-item label="學年度名稱" required>
          <el-input v-model="academicYearForm.name" placeholder="例如：113" />
        </el-form-item>
        <el-form-item label="起始日期" required>
          <el-date-picker v-model="academicYearForm.start_date" type="date" placeholder="選擇日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="結束日期" required>
          <el-date-picker v-model="academicYearForm.end_date" type="date" placeholder="選擇日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="狀態">
          <el-switch v-model="academicYearForm.is_active" active-text="啟用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="academicYearDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAcademicYear">儲存</el-button>
      </template>
    </el-dialog>
  </div>
    <!-- 班別學生列表對話框 -->
    <el-dialog v-model="classStudentsDialogVisible" :title="`班別學生列表 - ${selectedClass?.academic_year_name || ''} ${selectedClass?.name || ''}`" width="90%" style="max-width: 720px">
      <el-table :data="classStudents" v-loading="classStudentsLoading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="date_of_birth" label="出生日期" width="140" />
        <el-table-column prop="parent_name" label="家長" />
      </el-table>
      <template #footer>
        <el-button @click="classStudentsDialogVisible = false">關閉</el-button>
      </template>
    </el-dialog>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useUserStore } from '../stores/userStore';
import { useRouter } from 'vue-router';
import api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from 'lucide-vue-next';

const userStore = useUserStore();
const router = useRouter();
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
const childClassFilter = ref('');
const childDateRange = ref(null);

// Class Management
const classes = ref([]);
const classesLoading = ref(false);
const classDialogVisible = ref(false);
const classForm = reactive({
  academic_year: null,
  name: ''
});

// Class Students
const classStudentsDialogVisible = ref(false);
const classStudentsLoading = ref(false);
const classStudents = ref([]);
const selectedClass = ref(null);

// Academic Year Management
const academicYears = ref([]);
const academicYearsLoading = ref(false);
const academicYearDialogVisible = ref(false);
const isEditAcademicYear = ref(false);
const academicYearForm = reactive({
  id: null,
  name: '',
  start_date: '',
  end_date: '',
  is_active: true
});

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
  student_class: null,
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

    // 2. Class Filter
    let matchClass = true;
    if (childClassFilter.value) {
      matchClass = child.student_class === childClassFilter.value;
    }

    // 3. Date Range Filter (Using created_at if available, otherwise skip)
    // Assuming backend adds created_at to ChildSerializer, if not, this filter won't work effectively
    // But we can check if child object has it.
    let matchDate = true;
    if (childDateRange.value && childDateRange.value.length === 2 && child.created_at) {
      const createdDate = new Date(child.created_at).toISOString().split('T')[0];
      matchDate = createdDate >= childDateRange.value[0] && createdDate <= childDateRange.value[1];
    }

    return matchQuery && matchClass && matchDate;
  });
});

const activeAcademicYears = computed(() => {
  return academicYears.value.filter(year => year.is_active);
});

// Filter Actions
const clearUserFilters = () => {
  userSearchQuery.value = '';
  userRoleFilter.value = '';
  userDateRange.value = null;
};

const clearChildFilters = () => {
  childSearchQuery.value = '';
  childClassFilter.value = '';
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
  const headers = ['ID', 'Name', 'DOB', 'Academic Year', 'Class', 'Parent', 'Active Courses'];
  const csvContent = [
    headers.join(','),
    ...filteredChildren.value.map(c => [
      c.id,
      `"${c.name}"`,
      c.date_of_birth,
      c.academic_year_name || '',
      c.student_class_name || '',
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
      // 後端提供 parent_name；若不存在則嘗試從嵌套物件回退，最後為 N/A
      parentName: child.parent_name || child.parent?.name || 'N/A'
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

const fetchClasses = async () => {
  classesLoading.value = true;
  try {
    const data = await api.get('/users/classes/');
    classes.value = data;
  } catch (error) {
    console.error('Fetch classes failed:', error);
  } finally {
    classesLoading.value = false;
  }
};

const fetchAcademicYears = async () => {
  academicYearsLoading.value = true;
  try {
    const data = await api.get('/users/academic-years/');
    academicYears.value = data;
  } catch (error) {
    console.error('Fetch academic years failed:', error);
  } finally {
    academicYearsLoading.value = false;
  }
};

const openCreateClassDialog = () => {
  if (activeAcademicYears.value.length === 0) {
    ElMessage.warning('目前無啟用的學年度，請先至「學年管理」新增或啟用學年。');
  }
  classForm.academic_year = activeAcademicYears.value.length > 0 ? activeAcademicYears.value[0].id : null;
  classForm.name = '';
  classDialogVisible.value = true;
};

const saveClass = async () => {
  if (!classForm.academic_year || !classForm.name) {
    ElMessage.warning('請填寫完整資料');
    return;
  }
  try {
    await api.post('/users/classes/', classForm);
    ElMessage.success('班別建立成功');
    classDialogVisible.value = false;
    fetchClasses();
  } catch (error) {
     const errorMsg = error.response?.data?.name ? '班別名稱重複或無效' : '建立失敗';
     ElMessage.error(errorMsg);
  }
};

const handleEditClass = (row) => {
  router.push(`/admin/class/edit/${row.id}`);
};

const openClassStudents = async (row) => {
  selectedClass.value = row;
  classStudentsDialogVisible.value = true;
  classStudentsLoading.value = true;
  try {
    const data = await api.get(`/users/classes/${row.id}/students/`);
    classStudents.value = data;
  } catch (e) {
    ElMessage.error('載入學生列表失敗');
  } finally {
    classStudentsLoading.value = false;
  }
};

const openCreateAcademicYearDialog = () => {
  isEditAcademicYear.value = false;
  Object.assign(academicYearForm, { id: null, name: '', start_date: '', end_date: '', is_active: true });
  academicYearDialogVisible.value = true;
};

const handleEditAcademicYear = (row) => {
  isEditAcademicYear.value = true;
  Object.assign(academicYearForm, row);
  academicYearDialogVisible.value = true;
};

const saveAcademicYear = async () => {
  if (!academicYearForm.name || !academicYearForm.start_date || !academicYearForm.end_date) {
    ElMessage.warning('請填寫完整資料');
    return;
  }
  try {
    if (isEditAcademicYear.value) {
      await api.put(`/users/academic-years/${academicYearForm.id}/`, academicYearForm);
      ElMessage.success('學年更新成功');
    } else {
      await api.post('/users/academic-years/', academicYearForm);
      ElMessage.success('學年建立成功');
    }
    academicYearDialogVisible.value = false;
    fetchAcademicYears();
  } catch (error) {
    const errorMsg = error.response?.data?.name ? '學年名稱重複或無效' : '操作失敗';
    ElMessage.error(errorMsg);
  }
};

const handleDeleteAcademicYear = (row) => {
  ElMessageBox.confirm(`確定要刪除學年 ${row.name} 嗎？`, '警告', { type: 'warning' })
    .then(async () => {
      try {
        await api.delete(`/users/academic-years/${row.id}/`);
        ElMessage.success('學年已刪除');
        fetchAcademicYears();
      } catch (error) {
        ElMessage.error('刪除失敗');
      }
    });
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
  Object.assign(childForm, { id: null, name: '', date_of_birth: '', student_class: null, parent: null });
  childDialogVisible.value = true;
};

const handleEditChild = (child) => {
  isEditChild.value = true;
  Object.assign(childForm, {
    id: child.id,
    name: child.name,
    date_of_birth: child.date_of_birth,
    student_class: child.student_class,
    parent: child.parent?.id || child.parent // Handle both populated and ID-only parent
  });
  childDialogVisible.value = true;
};

const saveChild = async () => {
  try {
    if (!childForm.name || !childForm.parent) {
      ElMessage.warning('請填寫所有必填項目');
      return;
    }
    
    const payload = {
      name: childForm.name,
      date_of_birth: childForm.date_of_birth || null,
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
  fetchAcademicYears();
  fetchClasses();
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
