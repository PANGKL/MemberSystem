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
              <UserCircle class="w-20 h-20 text-blue-500" />
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
          <el-card class="children-card" shadow="never">
            <template #header>
              <div class="card-header">
                <h3>學員資料 (Children)</h3>
                <el-button type="primary" size="small" @click="showAddChildDialog = true">
                  <Plus class="w-4 h-4 mr-1" />
                  新增學員
                </el-button>
              </div>
            </template>

            <div v-if="profile.children && profile.children.length > 0" class="children-list">
              <div v-for="child in profile.children" :key="child.id" class="child-item">
                <div class="child-info">
                  <span class="child-name">{{ child.name }}</span>
                  <span class="child-meta">{{ child.ageGroup }} • {{ child.skillLevel }}</span>
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
            <el-empty description="即將推出報名詳情查詢" :image-size="60" />
          </el-card>
        </div>
      </div>

    <!-- 新增學員對話框 (略) -->
    <el-dialog v-model="showAddChildDialog" title="新增學員資料" width="90%" style="max-width: 400px">
      <p class="text-slate-500 text-sm mb-4">此功能正在開發中，請稍候。</p>
      <template #footer>
        <el-button @click="showAddChildDialog = false">取消</el-button>
        <el-button type="primary" disabled>確認</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  ArrowLeft, UserCircle, Download, Trash2, 
  Plus 
} from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const profile = ref(null);
const showAddChildDialog = ref(false);

const fetchProfile = async () => {
  loading.value = true;
  try {
    const data = await api.get('/user/profile');
    profile.value = data;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  } finally {
    loading.value = false;
  }
};

const handleExportData = async () => {
  try {
    const response = await api.get('/user/export-data');
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
      await api.delete('/user/purge-account');
      ElMessage.success('帳號已刪除');
      userStore.logout();
    } catch (error) {
      ElMessage.error('刪除失敗');
    }
  });
};

onMounted(fetchProfile);
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
    grid-template-cols: 300px 1fr;
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

.children-card, .recent-activities-card {
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
}

.child-name {
  font-weight: 700;
  color: #1e293b;
}

.child-meta {
  font-size: 0.85rem;
  color: #64748b;
}

.w-full { width: 100%; }
.mb-3 { margin-bottom: 0.75rem; }
</style>
