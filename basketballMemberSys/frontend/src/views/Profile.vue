// frontend/src/views/Profile.vue
<template>
  <div class="profile-view">
    <div class="back-action">
      <el-button @click="router.push('/')" link>
        <ArrowLeft class="w-5 h-5 mr-2" />
        返回首頁
      </el-button>
    </div>
    
    <div class="profile-grid" v-if="profile">
        <!-- 左側：基本資料與積分 -->
        <div class="profile-sidebar">
          <el-card class="user-card" shadow="never">
            <div class="user-avatar">
              <component :is="selectedIcon" class="w-20 h-20 text-blue-500" />
              <el-button type="primary" link @click="showAvatarDialog = true">變更頭像</el-button>
            </div>
            <div class="user-basic-info">
              <h3>{{ profile.name }}</h3>
              <p class="email">{{ profile.email }}</p>
              <el-tag :type="profile.role === 'ADMIN' ? 'danger' : 'success'" size="small">
                {{ profile.role }}
              </el-tag>
            </div>
            
            <div class="stats-section">
              <div class="stat-item">
                <span class="label">目前積分</span>
                <span class="value">{{ profile.points }}</span>
              </div>
              <div class="stat-item">
                <span class="label">等級</span>
                <span class="value level">{{ profile.level }}</span>
              </div>
            </div>

            <div class="gdpr-actions">
              <el-divider>隱私權與資料 (GDPR)</el-divider>
              <el-button @click="handleExportData" plain class="w-full mb-3">
                <Download class="w-4 h-4 mr-2" />
                導出我的資料
              </el-button>
              <el-button @click="handlePurgeAccount" type="danger" plain class="w-full">
                <Trash2 class="w-4 h-4 mr-2" />
                刪除帳號
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- 右側：子女管理與其他設定 -->
        <div class="profile-content">
          <el-card class="right-card" shadow="never">
            <template #header>
              <div class="card-header">
                <h3>我的學員</h3>
                <el-button type="primary" size="small" @click="showAddChildDialog = true">
                  <Plus class="w-4 h-4 mr-1" />
                  新增學員
                </el-button>
              </div>
            </template>
            <div v-if="profile.children && profile.children.length > 0" class="children-list">
              <div v-for="child in profile.children" :key="child.id" class="child-item">
                <div class="child-info">
                  <div class="child-header">
                    <span class="child-name">{{ child.name }}</span>
                    <el-tag type="info" size="small">{{ child.academic_year_name ? `${child.academic_year_name} - ` : '' }}{{ child.student_class_name || '未分班' }}</el-tag>
                  </div>
                  <div class="child-details">
                    <span class="detail-item">
                      <span class="label">出生日期:</span>
                      <span class="value">{{ child.date_of_birth || 'N/A' }}</span>
                    </span>
                  </div>
                </div>
                <el-button type="info" link @click="handleEditChild(child)">編輯</el-button>
              </div>
            </div>
            <el-empty v-else description="目前還沒有學員資料" :image-size="60" />
          </el-card>

          <!-- 報名紀錄簡述 -->
          <el-card class="recent-activities-card" shadow="never">
            <template #header>
              <h3>最近報名紀錄</h3>
            </template>
            
            <div v-if="registrations && registrations.length > 0" class="registrations-list">
              <div v-for="reg in registrations" :key="reg.id" class="reg-item">
                <div class="reg-info">
                   <div class="reg-header">
                     <span class="reg-title">{{ reg.activity?.title }}</span>
                     <el-tag :type="getStatusType(reg.status)" size="small">
                       {{ getStatusLabel(reg.status) }}
                     </el-tag>
                   </div>
                   <div class="reg-details">
                     <span class="detail-item">學員: {{ reg.child?.name }}</span>
                     <span class="detail-item">日期: {{ reg.activity?.date }}</span>
                     <span class="detail-item" v-if="reg.activity?.price > 0">費用: ${{ reg.activity?.price }}</span>
                     <span class="detail-item text-green-600" v-else>費用: 免費</span>
                   </div>
                </div>
                <div class="reg-actions">
                  <el-button 
                    v-if="['PENDING_PAYMENT', 'AWAITING_APPROVAL', 'CONFIRMED'].includes(reg.status)" 
                    type="danger" 
                    link 
                    size="small" 
                    @click="cancelRegistration(reg)"
                  >
                    取消報名
                  </el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="尚無報名紀錄" :image-size="60" />
          </el-card>
        </div>
      </div>

    <!-- 頭像選擇對話框 -->
    <el-dialog v-model="showAvatarDialog" title="選擇頭像圖標" width="90%" style="max-width: 480px">
      <div class="avatar-grid">
        <el-button
          v-for="opt in avatarChoices"
          :key="opt.key"
          class="avatar-button"
          plain
          :class="{ 'is-active': selectedAvatarKey === opt.key }"
          @click="selectAvatar(opt.key)"
        >
          <component :is="opt.icon" class="w-8 h-8" />
        </el-button>
      </div>
      <template #footer>
        <el-button @click="showAvatarDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAvatar">確認</el-button>
      </template>
    </el-dialog>

    <!-- 新增學員對話框 -->
    <el-dialog v-model="showAddChildDialog" title="新增學員資料" width="90%" style="max-width: 400px">
      <el-form :model="childForm" :rules="childRules" ref="childFormRef" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="childForm.name"></el-input>
        </el-form-item>
        <el-form-item label="出生日期" prop="date_of_birth">
          <el-date-picker
            v-model="childForm.date_of_birth"
            type="date"
            placeholder="選擇日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="班級" prop="student_class">
           <el-select v-model="childForm.student_class" placeholder="選擇班級" style="width: 100%;" clearable>
            <el-option 
              v-for="cls in classes" 
              :key="cls.id" 
              :label="`${cls.academic_year_name} - ${cls.name}`" 
              :value="cls.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddChildDialog = false">取消</el-button>
        <el-button type="primary" @click="addChild">確認</el-button>
      </template>
    </el-dialog>

    <!-- 編輯學員對話框 -->
    <el-dialog v-model="showEditChildDialog" title="編輯學員資料" width="90%" style="max-width: 400px">
      <el-form :model="editChildForm" :rules="childRules" ref="editChildFormRef" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editChildForm.name"></el-input>
        </el-form-item>
        <el-form-item label="出生日期" prop="date_of_birth">
          <el-date-picker
            v-model="editChildForm.date_of_birth"
            type="date"
            placeholder="選擇日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="班級" prop="student_class">
           <el-select v-model="editChildForm.student_class" placeholder="選擇班級" style="width: 100%;" clearable>
            <el-option 
              v-for="cls in classes" 
              :key="cls.id" 
              :label="`${cls.academic_year_name} - ${cls.name}`" 
              :value="cls.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditChildDialog = false">取消</el-button>
        <el-button type="primary" @click="updateChild">確認</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  ArrowLeft, UserCircle, Download, Trash2, 
  Plus, User, Smile, Dribbble
} from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const profile = ref(null);
const showAddChildDialog = ref(false);
const showEditChildDialog = ref(false);
const childFormRef = ref(null);
const editChildFormRef = ref(null);
const currentEditingChildId = ref(null);

const childForm = reactive({
  name: '',
  date_of_birth: null,
  student_class: null,
});

const editChildForm = reactive({
  name: '',
  date_of_birth: null,
  student_class: null,
});

const childRules = reactive({
  name: [{ required: true, message: '請輸入姓名', trigger: 'blur' }],
  date_of_birth: [{ required: true, message: '請選擇出生日期', trigger: 'change' }],
});

const classes = ref([]);

const fetchClasses = async () => {
  try {
    const data = await api.get('/users/classes/available/');
    classes.value = data;
  } catch (error) {
    console.error('Fetch classes failed:', error);
  }
};

// 頭像相關
const showAvatarDialog = ref(false);
const selectedAvatarKey = ref(localStorage.getItem('selectedAvatar') || 'UserCircle');
const avatarChoices = reactive([
  { key: 'UserCircle', icon: shallowRef(UserCircle) },
  { key: 'User', icon: shallowRef(User) },
  { key: 'Smile', icon: shallowRef(Smile) },
  { key: 'Dribbble', icon: shallowRef(Dribbble) },
]);

const selectedIcon = shallowRef(avatarChoices.find(opt => opt.key === selectedAvatarKey.value)?.icon || UserCircle);

const selectAvatar = (key) => {
  selectedAvatarKey.value = key;
  selectedIcon.value = avatarChoices.find(opt => opt.key === key).icon;
};

const saveAvatar = () => {
  localStorage.setItem('selectedAvatar', selectedAvatarKey.value);
  ElMessage.success('頭像已更新');
  showAvatarDialog.value = false;
};


const registrations = ref([]);

const fetchProfile = async () => {
  loading.value = true;
  try {
    const data = await api.get('/users/profile/'); // 更新 API 端點
    profile.value = data;
    await fetchRegistrations();
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  } finally {
    loading.value = false;
  }
};

const fetchRegistrations = async () => {
  try {
    const data = await api.get('/activities/registrations/');
    registrations.value = Array.isArray(data) ? data : (data.results || []);
    // Sort by date descending
    registrations.value.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (error) {
    console.error('Fetch registrations failed:', error);
  }
};

const getStatusLabel = (status) => {
  const map = {
    'PENDING_PAYMENT': '待繳費',
    'AWAITING_APPROVAL': '待審核',
    'CONFIRMED': '已確認',
    'CANCELLED': '已取消'
  };
  return map[status] || status;
};

const getStatusType = (status) => {
  const map = {
    'PENDING_PAYMENT': 'warning',
    'AWAITING_APPROVAL': 'info',
    'CONFIRMED': 'success',
    'CANCELLED': 'danger'
  };
  return map[status] || '';
};

const cancelRegistration = (reg) => {
  ElMessageBox.confirm(`確定要取消 ${reg.activity?.title} 的報名嗎？`, '警告', {
    type: 'warning',
    confirmButtonText: '確定取消',
    cancelButtonText: '暫不取消'
  }).then(async () => {
    try {
      await api.post(`/activities/registrations/${reg.id}/cancel/`);
      ElMessage.success('已取消報名');
      fetchRegistrations();
    } catch (error) {
      ElMessage.error(error.response?.data?.detail || '取消失敗');
    }
  });
};

const handleExportData = async () => {
  try {
    const response = await api.get('/users/export-data/'); // 更新 API 端點
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `basketball-club-data-${profile.value.name}.json`);
    document.body.appendChild(link);
    link.click();
    ElMessage.success('資料已準備好下載 (Data exported)');
  } catch (error) {
    ElMessage.error('導出失敗 (Export failed)');
  }
};

const handlePurgeAccount = () => {
  ElMessageBox.confirm(
    '確定要永久刪除帳號嗎？此操作不可逆。',
    '警告',
    {
      confirmButtonText: '確認刪除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await api.delete('/users/purge-account/'); // 更新 API 端點
      ElMessage.success('帳號已刪除');
      userStore.logout();
    } catch (error) {
      ElMessage.error('刪除失敗');
    }
  });
};

const addChild = async () => {
  if (!childFormRef.value) return;
  childFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await api.post('/users/children/', childForm); // 更新 API 端點
        ElMessage.success('學員新增成功');
        showAddChildDialog.value = false;
        childFormRef.value.resetFields();
        fetchProfile(); // 重新載入個人檔案以更新學員列表
      } catch (error) {
        ElMessage.error('新增學員失敗');
        console.error('Add child failed:', error);
      }
    }
  });
};

const handleEditChild = (child) => {
  currentEditingChildId.value = child.id;
  Object.assign(editChildForm, {
    name: child.name,
    date_of_birth: child.date_of_birth,
    student_class: child.student_class,
  });
  showEditChildDialog.value = true;
};

const updateChild = async () => {
  if (!editChildFormRef.value) return;
  editChildFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await api.put(`/users/children/${currentEditingChildId.value}/`, editChildForm); // 更新 API 端點
        ElMessage.success('學員資料更新成功');
        showEditChildDialog.value = false;
        fetchProfile(); // 重新載入個人檔案以更新學員列表
      } catch (error) {
        ElMessage.error('更新學員資料失敗');
        console.error('Update child failed:', error);
      }
    }
  });
};

onMounted(() => {
  fetchProfile();
  fetchClasses();
});
</script>

<style scoped>
.profile-view {
  padding-bottom: 1rem;
}

.back-action {
  margin-bottom: 1.5rem;
}

.profile-grid {
  display: grid;
  grid-template-cols: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .profile-grid {
    grid-template-cols: 3fr 7fr;
    gap: 2rem;
  }
}

.user-card {
  text-align: center;
  border-radius: 16px;
  padding: 1rem 0;
}

.user-avatar {
  margin-bottom: 1rem;
}

.user-basic-info h3 {
  margin: 0 0 4px;
  font-size: 1.25rem;
}

.user-basic-info .email {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  margin: 2rem 0;
  background-color: #f1f5f9;
  padding: 1rem;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item .label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.stat-item .value {
  font-size: 1.1rem;
  font-weight: 800;
  color: #2563eb;
}

.stat-item .level {
  color: #059669;
}

.gdpr-actions {
  margin-top: 2rem;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.right-card, .recent-activities-card {
  border-radius: 16px;
}

.child-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.child-item:last-child {
  border-bottom: none;
}

.child-info {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.5rem;
}

.child-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.child-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

.child-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  font-size: 0.85rem;
  color: #64748b;
}

.detail-item {
  display: flex;
  gap: 0.5rem;
}

.detail-item .label {
  font-weight: 600;
  color: #64748b;
}

.detail-item .value {
  color: #1e293b;
}

.w-full { width: 100%; }
.mb-3 { margin-bottom: 0.75rem; }

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
}

.avatar-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background-color: #ffffff;
  transition: all 0.2s ease-in-out;
}

.avatar-button:hover {
  border-color: #409eff;
  color: #409eff;
}

.avatar-button.is-active {
  border-color: #409eff;
  background-color: #ecf5ff;
  color: #409eff;
}

/* 報名紀錄 */
.registrations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reg-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  background-color: #f8fafc;
}

.reg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reg-title {
  font-weight: 600;
  color: #1e293b;
}

.reg-details {
  font-size: 0.85rem;
  color: #64748b;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.reg-actions {
  text-align: right;
  border-top: 1px dashed #e2e8f0;
  padding-top: 8px;
}

.text-green-600 {
  color: #10b981;
}

/* 響應式 */
</style>
