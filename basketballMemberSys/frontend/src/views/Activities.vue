<template>
  <div class="activities-view">
    <div class="section-header">
      <h2>活動中心 (Activities Center)</h2>
      <el-button type="primary" @click="fetchActivities" circle>
        <RefreshCw class="w-4 h-4" />
      </el-button>
    </div>

    <el-tabs v-model="activeTab" class="activities-tabs">
      <el-tab-pane label="新活動 (New)" name="new">
        <div class="activity-grid">
          <el-card v-for="activity in newActivities" :key="activity.id" class="activity-card" shadow="hover">
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
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="待確認" name="pending">
        <div class="activity-grid">
          <el-card v-for="reg in pendingRegistrations" :key="reg.id" class="activity-card" shadow="hover">
            <template #header>
              <div class="activity-card-header">
                <span class="activity-type" :class="reg.activity?.type.toLowerCase()">{{ reg.activity?.type }}</span>
                <h3 class="activity-title">{{ reg.activity?.title }}</h3>
              </div>
            </template>

            <div class="activity-info">
              <div class="info-item">
                <Calendar class="w-4 h-4" />
                <span>{{ formatDate(reg.activity?.date_time) }}</span>
              </div>
              <div class="info-item">
                <MapPin class="w-4 h-4" />
                <span>{{ reg.activity?.location }}</span>
              </div>
              <div class="info-item">
                <DollarSign class="w-4 h-4" />
                <span>{{ reg.activity?.price }} HKD</span>
              </div>
              <div class="info-item">
                <Users class="w-4 h-4" />
                <span>人數限制: {{ reg.activity?.current_participants }}/{{ reg.activity?.max_participants }}</span>
              </div>
              <p class="activity-desc">{{ reg.activity?.description }}</p>
            </div>

            <div class="activity-footer">
              <el-tag :type="getStatusTagType(reg.status)" class="mb-2">{{ getStatusLabel(reg.status) }}</el-tag>
              <div v-if="reg.status === 'PENDING_PAYMENT' && reg.activity?.price > 0">
                <el-button type="warning" size="small" @click="openPaymentDialog(reg)" block>上傳收據</el-button>
              </div>
              <div v-if="reg.status === 'AWAITING_APPROVAL'">
                <small class="text-gray-500">等待管理員核實中...</small>
              </div>
            </div>
          </el-card>
        </div>
        <el-empty v-if="pendingRegistrations.length === 0" description="尚無待處理的報名" />
      </el-tab-pane>

      <el-tab-pane label="已報名" name="confirmed">
        <div class="activity-grid">
          <el-card v-for="reg in confirmedRegistrations" :key="reg.id" class="activity-card success" shadow="hover">
            <template #header>
              <div class="activity-card-header">
                <span class="activity-type" :class="reg.activity?.type.toLowerCase()">{{ reg.activity?.type }}</span>
                <h3 class="activity-title">{{ reg.activity?.title }}</h3>
              </div>
            </template>

            <div class="activity-info">
              <div class="info-item">
                <Calendar class="w-4 h-4" />
                <span>{{ formatDate(reg.activity?.date_time) }}</span>
              </div>
              <div class="info-item">
                <MapPin class="w-4 h-4" />
                <span>{{ reg.activity?.location }}</span>
              </div>
              <div class="info-item">
                <DollarSign class="w-4 h-4" />
                <span>{{ reg.activity?.price }} HKD</span>
              </div>
            </div>

            <div class="activity-footer">
              <el-tag type="success">{{ getStatusLabel(reg.status) }}</el-tag>
              <p class="mt-2 text-green-600">祝你活動愉快！</p>
            </div>
          </el-card>
        </div>
        <el-empty v-if="confirmedRegistrations.length === 0" description="尚無成功的報名記錄" />
      </el-tab-pane>

      <el-tab-pane label="過往活動 (Past)" name="past">
        <div class="activity-grid">
          <el-card v-for="activity in pastActivities" :key="activity.id" class="activity-card past" shadow="hover">
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
              <p class="activity-desc">{{ activity.description }}</p>
            </div>
            <div class="activity-footer">
              <el-button disabled block>活動已結束</el-button>
            </div>
          </el-card>
        </div>
        <el-empty v-if="pastActivities.length === 0" description="尚無過往活動" />
      </el-tab-pane>
    </el-tabs>

    <!-- Payment Upload Dialog -->
    <el-dialog
      v-model="showPaymentDialog"
      title="上傳繳費收據 (Upload Receipt)"
      width="400px"
    >
      <el-form :model="paymentForm" label-width="100px">
        <el-form-item label="收據編號" required>
          <el-input v-model="paymentForm.reference" placeholder="請輸入轉賬編號或參考號"></el-input>
        </el-form-item>
        <el-form-item label="收據圖片" required>
          <el-upload
            class="receipt-upload"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept="image/*"
          >
            <template #trigger>
              <el-button type="primary">選擇圖片</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">請上傳清晰的繳費截圖或收據圖片</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPaymentDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPayment" :loading="uploading">確認上傳</el-button>
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
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Calendar, Users, RefreshCw, MapPin, DollarSign, User } from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();
const activities = ref([]);
const myRegistrations = ref([]);
const activeTab = ref('new');

const showPaymentDialog = ref(false);
const uploading = ref(false);
const paymentForm = reactive({
  registrationId: null,
  reference: '',
  file: null
});

const showRegisterActivityDialog = ref(false);
const selectedActivity = ref(null);
const selectedChildId = ref(null);

// 分類活動
const newActivities = computed(() => {
  const now = new Date();
  const registeredActivityIds = new Set(myRegistrations.value.map(reg => reg.activity?.id || reg.activity));
  return activities.value.filter(a => {
    return new Date(a.date_time) > now && !registeredActivityIds.has(a.id);
  });
});

const pastActivities = computed(() => {
  const now = new Date();
  return activities.value.filter(a => new Date(a.date_time) <= now);
});

const pendingRegistrations = computed(() => {
  return myRegistrations.value
    .filter(reg => reg.status === 'PENDING_PAYMENT' || reg.status === 'AWAITING_APPROVAL')
    .map(reg => {
      const activity = activities.value.find(a => a.id === (reg.activity?.id || reg.activity));
      return { ...reg, activity };
    });
});

const confirmedRegistrations = computed(() => {
  return myRegistrations.value
    .filter(reg => reg.status === 'CONFIRMED')
    .map(reg => {
      const activity = activities.value.find(a => a.id === (reg.activity?.id || reg.activity));
      return { ...reg, activity };
    });
});

const fetchActivities = async () => {
  try {
    const data = await api.get('/activities/');
    activities.value = data.map(activity => ({
      ...activity,
      date_time: activity.date_time || `${activity.date}T${activity.time}`,
      current_participants: activity.currentParticipants ?? activity.current_participants ?? 0,
      max_participants: activity.maxParticipants ?? activity.max_participants ?? 0,
      price: Number(activity.price) || 0
    }));
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    ElMessage.error('未能載入活動列表');
  }
};

const fetchMyRegistrations = async () => {
  try {
    const data = await api.get('/activities/registrations/');
    console.log('Fetched my registrations:', data); // 偵錯日誌
    myRegistrations.value = data.map(reg => ({
      ...reg,
      activity: reg.activity ? {
        ...reg.activity,
        date_time: reg.activity.date_time || `${reg.activity.date}T${reg.activity.time}`
      } : null
    }));
  } catch (error) {
    console.error('Failed to fetch registrations:', error);
  }
};

const getStatusLabel = (status) => {
  const labels = {
    'PENDING_PAYMENT': '待繳費',
    'AWAITING_APPROVAL': '已報名 (待核實)',
    'CONFIRMED': '已繳費 (報名成功)',
    'CANCELLED': '已取消'
  };
  return labels[status] || status;
};

const getStatusTagType = (status) => {
  const types = {
    'PENDING_PAYMENT': 'warning',
    'AWAITING_APPROVAL': 'info',
    'CONFIRMED': 'success',
    'CANCELLED': 'danger'
  };
  return types[status] || '';
};

const openPaymentDialog = (reg) => {
  paymentForm.registrationId = reg.id;
  paymentForm.reference = '';
  paymentForm.file = null;
  showPaymentDialog.value = true;
};

const handleFileChange = (file) => {
  paymentForm.file = file.raw;
};

const submitPayment = async () => {
  if (!paymentForm.file || !paymentForm.reference) {
    ElMessage.warning('請填寫完整繳費資訊');
    return;
  }

  const formData = new FormData();
  formData.append('payment_receipt', paymentForm.file);
  formData.append('payment_reference', paymentForm.reference);

  uploading.value = true;
  try {
    await api.post(`/activities/registrations/${paymentForm.registrationId}/upload_receipt/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    ElMessage.success('收據上傳成功，請等待審核');
    showPaymentDialog.value = false;
    fetchMyRegistrations();
  } catch (error) {
    ElMessage.error('上傳失敗');
  } finally {
    uploading.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('zh-HK', {
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
  });
};

const handleRegister = async (activity) => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('請先登入才能報名活動');
    router.push('/login');
    return;
  }
  if (!userStore.user?.children || userStore.user.children.length === 0) {
    ElMessage.warning('您沒有可報名的子女，請先在個人資料頁新增子女');
    router.push('/profile');
    return;
  }
  selectedActivity.value = activity;
  selectedChildId.value = null;
  showRegisterActivityDialog.value = true;
};

const confirmRegisterActivity = async () => {
  if (!selectedActivity.value || !selectedChildId.value) {
    ElMessage.warning('請選擇要報名的子女');
    return;
  }
  try {
    await api.post(`/activities/${selectedActivity.value.id}/register/`, { child_id: selectedChildId.value });
    if (selectedActivity.value.price > 0) {
      ElMessage.success('報名成功！請前往「待確認」分頁上傳收據。');
    } else {
      ElMessage.success('免費活動報名成功！請等待管理員審核。');
    }
    showRegisterActivityDialog.value = false;
    activeTab.value = 'pending';
    fetchMyRegistrations();
    fetchActivities();
  } catch (error) {
    console.error('Failed to register:', error);
    ElMessage.error(error.response?.data?.detail || '報名失敗');
  }
};

onMounted(async () => {
  // Await fetchActivities to ensure the full list is available for lookups
  await fetchActivities();
  
  if (userStore.isAuthenticated) {
    // Await registrations and profile sync
    await fetchMyRegistrations();
    await userStore.syncUserProfile();
  }
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
