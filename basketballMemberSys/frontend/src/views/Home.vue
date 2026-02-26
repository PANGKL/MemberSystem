<template>
  <div class="home-view">
    <div class="section-header">
      <h2>課程與訓練活動 (Activities)</h2>
      <el-button type="primary" @click="fetchActivities" circle>
        <RefreshCw class="w-4 h-4" />
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
              <span>{{ formatDate(activity.dateTime) }}</span>
            </div>
            <div class="info-item">
              <Users class="w-4 h-4" />
              <span>人數限制: {{ activity.currentParticipants }}/{{ activity.maxParticipants }}</span>
            </div>
            <p class="activity-desc">{{ activity.description }}</p>
          </div>

          <div class="activity-footer">
            <el-button 
              type="primary" 
              :disabled="activity.currentParticipants >= activity.maxParticipants"
              @click="handleRegister(activity)"
              block
            >
              {{ activity.currentParticipants >= activity.maxParticipants ? '已滿額 (Full)' : '立即報名 (Register)' }}
            </el-button>
          </div>
        </el-card>
      </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import api from '../api';
import { ElMessage } from 'element-plus';
import { Calendar, Users, RefreshCw } from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();
const activities = ref([]);

const fetchActivities = async () => {
  try {
    const data = await api.get('/activities');
    activities.value = data;
  } catch (error) {
    console.error('Failed to fetch activities:', error);
  }
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-HK', {
    month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
  });
};

const handleRegister = async (activity) => {
  // 報名邏輯... 這裡可以彈出對話框選擇子女
  ElMessage.info('正在開啟報名表單... (Opening registration form)');
};

onMounted(() => {
  fetchActivities();
});
</script>

<style scoped>
.home-view {
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
</style>
