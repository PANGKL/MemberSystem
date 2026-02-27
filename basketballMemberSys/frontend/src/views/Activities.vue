<template>
  <div class="activities-container">
    <div class="activities-header">
      <h1>活動報名</h1>
      <el-tabs v-model="activeTab" @tab-change="filterActivities" class="activity-tabs">
        <el-tab-pane label="全部活動" name="all"></el-tab-pane>
        <el-tab-pane label="比賽" name="COMPETITION"></el-tab-pane>
        <el-tab-pane label="訓練" name="TRAINING"></el-tab-pane>
        <el-tab-pane label="特別活動" name="SPECIAL_EVENT"></el-tab-pane>
      </el-tabs>
    </div>

    <el-empty description="加載中..." v-if="loading" class="empty-state"></el-empty>

    <div class="activities-grid" v-else-if="filteredActivities.length > 0">
      <el-card class="activity-card" v-for="activity in filteredActivities" :key="activity.id">
        <!-- 活動類型標籤 -->
        <template #header>
          <div class="card-header">
            <span class="activity-title">{{ activity.title }}</span>
            <el-tag :type="getActivityTypeColor(activity.type)" class="type-badge">
              {{ getActivityTypeName(activity.type) }}
            </el-tag>
          </div>
        </template>

        <!-- 活動詳情內容 -->
        <div class="activity-details">
          <div class="detail-row">
            <el-icon class="detail-icon">
              <Calendar />
            </el-icon>
            <span class="detail-label">日期：</span>
            <span class="detail-value">{{ formatDate(activity.date) }}</span>
          </div>

          <div class="detail-row">
            <el-icon class="detail-icon">
              <Clock />
            </el-icon>
            <span class="detail-label">時間：</span>
            <span class="detail-value">{{ activity.time }}</span>
          </div>

          <div class="detail-row">
            <el-icon class="detail-icon">
              <Location />
            </el-icon>
            <span class="detail-label">地點：</span>
            <span class="detail-value">{{ activity.location }}</span>
          </div>

          <div class="detail-row" v-if="activity.price > 0">
            <el-icon class="detail-icon">
              <ShoppingCart />
            </el-icon>
            <span class="detail-label">價錢：</span>
            <span class="detail-value price">$ {{ activity.price.toFixed(2) }}</span>
          </div>

          <div class="detail-row" v-else>
            <el-icon class="detail-icon">
              <ShoppingCart />
            </el-icon>
            <span class="detail-label">價錢：</span>
            <span class="detail-value price free">免費</span>
          </div>

          <div class="detail-row">
            <el-icon class="detail-icon">
              <User />
            </el-icon>
            <span class="detail-label">名額：</span>
            <span class="detail-value">{{ activity.currentParticipants }} / {{ activity.maxParticipants }}</span>
          </div>

          <!-- 詳細資料 -->
          <div class="description-section" v-if="activity.description">
            <p class="description-title">詳細資料：</p>
            <p class="description-text">{{ activity.description }}</p>
          </div>

          <!-- 進度條 -->
          <div class="capacity-bar">
            <el-progress :percentage="(activity.currentParticipants / activity.maxParticipants) * 100" 
                        :status="getProgressStatus(activity)" />
          </div>
        </div>

        <!-- 卡片底部操作 -->
        <template #footer>
          <div class="card-footer">
            <el-button 
              v-if="activity.currentParticipants < activity.maxParticipants"
              type="primary" 
              @click="showRegistrationDialog(activity)"
              :disabled="!hasChildren">
              報名
            </el-button>
            <el-button 
              v-else
              type="info" 
              disabled>
              已滿額
            </el-button>
            <el-button type="info" @click="showActivityDetails(activity)">
              詳情
            </el-button>
          </div>
        </template>
      </el-card>
    </div>

    <el-empty description="沒有活動" v-else class="empty-state"></el-empty>

    <!-- 報名對話框 -->
    <el-dialog v-model="dialogVisible" title="活動報名" width="500px" @close="resetForm">
      <div class="registration-form">
        <el-form ref="registrationForm" :model="registrationData" label-width="100px">
          <el-form-item label="活動：">
            <span>{{ selectedActivity?.title }}</span>
          </el-form-item>

          <el-form-item label="選擇孩子：" required>
            <el-select 
              v-model="registrationData.childId" 
              placeholder="請選擇孩子"
              @change="validateChildSelection">
              <el-option 
                v-for="child in userChildren" 
                :key="child.id" 
                :label="child.name" 
                :value="child.id">
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="緊急聯絡人：">
            <el-input 
              v-model="registrationData.emergencyContact" 
              placeholder="緊急聯絡人名字">
            </el-input>
          </el-form-item>

          <el-form-item label="緊急電話：">
            <el-input 
              v-model="registrationData.emergencyPhone" 
              placeholder="緊急聯絡電話">
            </el-input>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRegistration" :loading="isSubmitting">報名</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 活動詳情對話框 -->
    <el-dialog v-model="detailsDialogVisible" :title="`${selectedActivity?.title} - 詳情`" width="600px">
      <div class="activity-details-full" v-if="selectedActivity">
        <div class="detail-section">
          <h4>活動詳情</h4>
          <p v-if="selectedActivity.description">{{ selectedActivity.description }}</p>
          <p v-else style="color: #999;">無詳細介紹</p>
        </div>

        <div class="detail-section">
          <h4>活動資訊</h4>
          <ul class="info-list">
            <li><strong>活動類型：</strong> {{ getActivityTypeName(selectedActivity.type) }}</li>
            <li><strong>日期：</strong> {{ formatDate(selectedActivity.date) }}</li>
            <li><strong>時間：</strong> {{ selectedActivity.time }}</li>
            <li><strong>地點：</strong> {{ selectedActivity.location }}</li>
            <li><strong>價錢：</strong> {{ selectedActivity.price > 0 ? `$ ${selectedActivity.price.toFixed(2)}` : '免費' }}</li>
            <li><strong>可報名人數：</strong> {{ selectedActivity.currentParticipants }} / {{ selectedActivity.maxParticipants }}</li>
          </ul>
        </div>

        <div v-if="selectedActivity.registrations && selectedActivity.registrations.length > 0" class="detail-section">
          <h4>已報名參與者（{{ selectedActivity.registrations.length }}人）</h4>
          <el-table :data="selectedActivity.registrations" stripe size="small">
            <el-table-column prop="child.name" label="孩子名字" width="100"></el-table-column>
            <el-table-column prop="user.name" label="家長名字" width="100"></el-table-column>
            <el-table-column prop="status" label="狀態" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'CONFIRMED' ? 'success' : 'warning'">
                  {{ row.status === 'CONFIRMED' ? '已確認' : '待確認' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Calendar, Clock, Location, ShoppingCart, User } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/userStore'
import api from '../api'

const userStore = useUserStore()
const activeTab = ref('all')
const activities = ref([])
const loading = ref(true)
const dialogVisible = ref(false)
const detailsDialogVisible = ref(false)
const selectedActivity = ref(null)
const isSubmitting = ref(false)
const userChildren = ref([])

const registrationData = ref({
  childId: null,
  emergencyContact: '',
  emergencyPhone: ''
})

const hasChildren = computed(() => userChildren.value.length > 0)

const filteredActivities = computed(() => {
  if (activeTab.value === 'all') {
    return activities.value
  }
  return activities.value.filter(a => a.type === activeTab.value)
})

const formatDate = (dateString) => {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('zh-HK', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const getActivityTypeName = (type) => {
  const typeMap = {
    'COMPETITION': '比賽',
    'TRAINING': '訓練',
    'SPECIAL_EVENT': '特別活動'
  }
  return typeMap[type] || type
}

const getActivityTypeColor = (type) => {
  const colorMap = {
    'COMPETITION': 'danger',
    'TRAINING': 'primary',
    'SPECIAL_EVENT': 'success'
  }
  return colorMap[type] || 'info'
}

const getProgressStatus = (activity) => {
  const percentage = (activity.currentParticipants / activity.maxParticipants) * 100
  if (percentage >= 100) return 'exception'
  if (percentage >= 80) return 'warning'
  return 'success'
}

const filterActivities = () => {
  // Computed property automatically handles filtering
}

const showRegistrationDialog = (activity) => {
  selectedActivity.value = activity
  registrationData.value = {
    childId: null,
    emergencyContact: '',
    emergencyPhone: ''
  }
  dialogVisible.value = true
}

const showActivityDetails = async (activity) => {
  try {
    // 獲取活動詳細信息，包括報名名單
    const response = await api.get(`/activities/${activity.id}`)
    selectedActivity.value = response
    detailsDialogVisible.value = true
  } catch (error) {
    ElMessage.error('無法獲取活動詳情：' + error.message)
  }
}

const validateChildSelection = () => {
  // Additional validation if needed
}

const resetForm = () => {
  registrationData.value = {
    childId: null,
    emergencyContact: '',
    emergencyPhone: ''
  }
}

const submitRegistration = async () => {
  if (!registrationData.value.childId) {
    ElMessage.error('請選擇孩子')
    return
  }

  isSubmitting.value = true
  try {
    await api.post(
      `/activities/${selectedActivity.value.id}/register`,
      {
        childId: registrationData.value.childId,
        emergencyContact: registrationData.value.emergencyContact,
        emergencyPhone: registrationData.value.emergencyPhone
      }
    )
    
    ElMessage.success('報名成功！')
    dialogVisible.value = false
    loadActivities() // Refresh the list
  } catch (error) {
    const errorMsg = error.message || '報名失敗'
    ElMessage.error(errorMsg)
  } finally {
    isSubmitting.value = false
  }
}

const loadActivities = async () => {
  try {
    loading.value = true
    const response = await api.get('/activities')
    activities.value = response
  } catch (error) {
    ElMessage.error('無法加載活動：' + error.message)
  } finally {
    loading.value = false
  }
}

const loadUserChildren = async () => {
  try {
    const response = await api.get('/user/children')
    userChildren.value = response
  } catch (error) {
    ElMessage.error('無法加載孩子資訊：' + error.message)
  }
}

onMounted(() => {
  loadActivities()
  loadUserChildren()
})
</script>

<style scoped>
.activities-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.activities-header {
  margin-bottom: 30px;
  text-align: center;
}

.activities-header h1 {
  font-size: 32px;
  color: #1e40af;
  margin-bottom: 20px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

.activity-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.activity-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  overflow: hidden;
}

.activity-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.activity-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
}

.type-badge {
  font-size: 12px;
  padding: 4px 12px;
}

.activity-details {
  padding: 20px 0;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-icon {
  color: #3b82f6;
  margin-right: 8px;
  font-size: 16px;
}

.detail-label {
  font-weight: 600;
  min-width: 60px;
  color: #475569;
}

.detail-value {
  color: #1e293b;
  flex: 1;
}

.detail-value.price {
  font-weight: 600;
  color: #ef4444;
}

.detail-value.price.free {
  color: #10b981;
}

.description-section {
  margin-top: 16px;
  padding: 12px 0;
}

.description-title {
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
  font-size: 14px;
}

.description-text {
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  font-size: 14px;
  padding: 8px 0;
}

.capacity-bar {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.card-footer {
  display: flex;
  gap: 10px;
}

.card-footer .el-button {
  flex: 1;
}

.empty-state {
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  max-width: 600px;
  margin: 40px auto;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.registration-form {
  padding: 20px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.activity-details-full {
  padding: 20px 0;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  color: #1e293b;
  font-size: 16px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #3b82f6;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-list li {
  padding: 8px 0;
  color: #475569;
  line-height: 1.8;
}

.info-list strong {
  color: #1e293b;
  min-width: 100px;
}
</style>
