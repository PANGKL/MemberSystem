<template>
  <div class="activities-view">
    <div class="section-header">
      <h2>所有活動 (All Activities)</h2>
      <el-button type="primary" @click="fetchActivities" circle>
        <RefreshCw class="w-4 h-4" />
      </el-button>
      <el-button v-if="userStore.isAdmin" type="success" @click="showCreateActivityDialog = true">
        新增活動 (Add Activity)
      </el-button>
    </div>

    <div class="activity-grid">
      <el-card v-for="activity in activities" :key="activity.id" class="activity-card" shadow="hover">
        <template #header>
          <div class="activity-card-header">
            <span class="activity-type" :class="activity.type.toLowerCase()">{{ activity.type }}</span>
            <h3 class="activity-title">{{ activity.title }}</h3>
          </div>
        </template>

        <div class="activity-info">
          <div class="info-item">
            <Calendar class="w-4 h-4" />
            <span>{{ formatDate(activity.date_time) }}</span>
          </div>
          <div class="info-item">
            <MapPin class="w-4 h-4" />
            <span>{{ activity.location }}</span>
          </div>
          <div class="info-item">
            <DollarSign class="w-4 h-4" />
            <span>{{ activity.price }} HKD</span>
          </div>
          <div class="info-item">
            <Users class="w-4 h-4" />
            <span>人數限制: {{ activity.current_participants }}/{{ activity.max_participants }}</span>
          </div>
          <p class="activity-desc">{{ activity.description }}</p>
        </div>

        <div class="activity-footer">
          <el-button
            type="primary"
            :disabled="activity.current_participants >= activity.max_participants"
            @click="handleRegister(activity)"
            block
          >
            {{ activity.current_participants >= activity.max_participants ? '已滿額 (Full)' : '立即報名 (Register)' }}
          </el-button>
          <div v-if="userStore.isAdmin" class="admin-actions">
            <el-button type="warning" size="small" @click="handleEditActivity(activity)">編輯</el-button>
            <el-button type="danger" size="small" @click="handleDeleteActivity(activity)">刪除</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Create/Edit Activity Dialog -->
    <el-dialog
      v-model="showCreateActivityDialog"
      :title="isEditMode ? '編輯活動' : '新增活動'"
      width="500px"
      @close="resetActivityForm"
    >
      <el-form :model="activityForm" :rules="activityRules" ref="activityFormRef" label-width="100px">
        <el-form-item label="活動名稱" prop="title">
          <el-input v-model="activityForm.title"></el-input>
        </el-form-item>
        <el-form-item label="活動類型" prop="type">
          <el-select v-model="activityForm.type" placeholder="選擇活動類型">
            <el-option label="Course" value="COURSE"></el-option>
            <el-option label="Training" value="TRAINING"></el-option>
            <el-option label="Competition" value="COMPETITION"></el-option>
            <el-option label="Special Event" value="SPECIAL_EVENT"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="日期時間" prop="date_time">
          <el-date-picker
            v-model="activityForm.date_time"
            type="datetime"
            placeholder="選擇日期時間"
            value-format="YYYY-MM-DDTHH:mm:ss"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="地點" prop="location">
          <el-input v-model="activityForm.location"></el-input>
        </el-form-item>
        <el-form-item label="價格" prop="price">
          <el-input-number v-model="activityForm.price" :min="0"></el-input-number>
        </el-form-item>
        <el-form-item label="最大人數" prop="max_participants">
          <el-input-number v-model="activityForm.max_participants" :min="1"></el-input-number>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="activityForm.description"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateActivityDialog = false">取消</el-button>
        <el-button type="primary" @click="isEditMode ? updateActivity() : createActivity()">
          {{ isEditMode ? '更新' : '新增' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Register Activity Dialog -->
    <el-dialog
      v-model="showRegisterActivityDialog"
      title="報名活動 (Register Activity)"
      width="400px"
    >
      <p>您正在為活動 <strong>{{ selectedActivity?.title }}</strong> 報名。</p>
      <p>請選擇要報名的子女：</p>
      <el-select v-model="selectedChildId" placeholder="選擇子女">
        <el-option
          v-for="child in userStore.user?.children"
          :key="child.id"
          :label="child.name"
          :value="child.id"
        ></el-option>
      </el-select>
      <template #footer>
        <el-button @click="showRegisterActivityDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmRegisterActivity">確認報名</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Calendar, Users, RefreshCw, MapPin, DollarSign } from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();
const activities = ref([]);
const showCreateActivityDialog = ref(false);
const showRegisterActivityDialog = ref(false);
const isEditMode = ref(false);
const currentEditingActivityId = ref(null);
const selectedActivity = ref(null);
const selectedChildId = ref(null);

const activityFormRef = ref(null);
const activityForm = reactive({
  title: '',
  type: 'COURSE',
  date_time: '',
  location: '',
  price: 0,
  max_participants: 1,
  description: '',
});

const activityRules = reactive({
  title: [{ required: true, message: '請輸入活動名稱', trigger: 'blur' }],
  type: [{ required: true, message: '請選擇活動類型', trigger: 'change' }],
  date_time: [{ required: true, message: '請選擇日期時間', trigger: 'change' }],
  location: [{ required: true, message: '請輸入活動地點', trigger: 'blur' }],
  price: [{ required: true, message: '請輸入活動價格', trigger: 'blur' }],
  max_participants: [{ required: true, message: '請輸入最大人數', trigger: 'blur' }],
  description: [{ required: true, message: '請輸入活動描述', trigger: 'blur' }],
});

const fetchActivities = async () => {
  try {
    const data = await api.get('/activities');
    activities.value = data;
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    ElMessage.error('未能載入活動列表 (Failed to load activities list)');
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('zh-HK', {
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
  });
};

const resetActivityForm = () => {
  activityFormRef.value?.resetFields();
  Object.assign(activityForm, {
    title: '',
    type: 'COURSE',
    date_time: '',
    location: '',
    price: 0,
    max_participants: 1,
    description: '',
  });
  isEditMode.value = false;
  currentEditingActivityId.value = null;
};

const createActivity = async () => {
  if (!activityFormRef.value) return;
  activityFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await api.post('/activities/', activityForm);
        ElMessage.success('活動新增成功！');
        showCreateActivityDialog.value = false;
        fetchActivities();
      } catch (error) {
        console.error('Failed to create activity:', error);
        ElMessage.error(error.response?.data?.detail || '新增活動失敗，請稍後再試');
      }
    }
  });
};

const handleEditActivity = (activity) => {
  isEditMode.value = true;
  currentEditingActivityId.value = activity.id;
  Object.assign(activityForm, {
    title: activity.title,
    type: activity.type,
    date_time: activity.date_time,
    location: activity.location,
    price: activity.price,
    max_participants: activity.max_participants,
    description: activity.description,
  });
  showCreateActivityDialog.value = true;
};

const updateActivity = async () => {
  if (!activityFormRef.value) return;
  activityFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await api.put(`/activities/${currentEditingActivityId.value}/`, activityForm);
        ElMessage.success('活動更新成功！');
        showCreateActivityDialog.value = false;
        fetchActivities();
      } catch (error) {
        console.error('Failed to update activity:', error);
        ElMessage.error(error.response?.data?.detail || '更新活動失敗，請稍後再試');
      }
    }
  });
};

const handleDeleteActivity = async (activity) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除活動 "${activity.title}" 嗎？ (Are you sure you want to delete "${activity.title}"?)`,
      '確認刪除 (Confirm Deletion)',
      {
        confirmButtonText: '確定 (Confirm)',
        cancelButtonText: '取消 (Cancel)',
        type: 'warning',
      }
    );
    await api.delete(`/activities/${activity.id}/`);
    ElMessage.success('活動刪除成功！');
    fetchActivities();
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消刪除 (Deletion cancelled)');
    } else {
      console.error('Failed to delete activity:', error);
      ElMessage.error(error.response?.data?.detail || '刪除活動失敗，請稍後再試');
    }
  }
};

const handleRegister = async (activity) => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('請先登入才能報名活動 (Please log in to register for activities)');
    router.push('/login');
    return;
  }
  if (!userStore.user?.children || userStore.user.children.length === 0) {
    ElMessage.warning('您沒有可報名的子女，請先在個人資料頁新增子女 (You have no children to register, please add children in your profile page first)');
    router.push('/profile');
    return;
  }
  selectedActivity.value = activity;
  selectedChildId.value = null; // Reset selected child
  showRegisterActivityDialog.value = true;
};

const confirmRegisterActivity = async () => {
  if (!selectedActivity.value || !selectedChildId.value) {
    ElMessage.warning('請選擇要報名的子女 (Please select a child to register)');
    return;
  }
  try {
    await api.post(`/activities/${selectedActivity.value.id}/register/`, { child_id: selectedChildId.value });
    ElMessage.success('報名成功！');
    showRegisterActivityDialog.value = false;
    fetchActivities(); // Refresh activities to update participant count
  } catch (error) {
    console.error('Failed to register for activity:', error);
    ElMessage.error(error.response?.data?.detail || '報名失敗，請稍後再試');
  }
};

onMounted(() => {
  fetchActivities();
  userStore.syncUserProfile(); // Ensure children data is loaded for registration
});
</script>

<style scoped>
.activities-view {
  padding-bottom: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .section-header {
    margin-bottom: 2rem;
  }
}

.section-header h2 {
  font-size: 1.25rem;
  color: #1e293b;
  font-weight: 700;
}

@media (min-width: 768px) {
  .section-header h2 {
    font-size: 1.5rem;
  }
}

.activity-grid {
  display: grid;
  grid-template-cols: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .activity-grid {
    grid-template-cols: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .activity-grid {
    gap: 2rem;
  }
}

.activity-card {
  border-radius: 16px;
  border: none;
  overflow: hidden;
}

.activity-card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-type {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 6px;
  width: fit-content;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.activity-type.course { background-color: #dbeafe; color: #1e40af; }
.activity-type.training { background-color: #fef3c7; color: #92400e; }
.activity-type.competition { background-color: #fee2e2; color: #b91c1c; }
.activity-type.special_event { background-color: #e0e7ff; color: #4338ca; }


.activity-title {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
}

.activity-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 0.9rem;
}

.activity-desc {
  margin: 12px 0 0;
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.6;
}

.activity-footer {
  margin-top: 24px;
}

.admin-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}
</style>
