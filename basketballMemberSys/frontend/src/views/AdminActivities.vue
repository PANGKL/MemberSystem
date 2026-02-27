<template>
  <div class="admin-activities-container">
    <div class="admin-header">
      <h1>活動管理</h1>
      <el-button type="primary" @click="showCreateDialog" class="create-btn">
        <el-icon style="vertical-align: middle; margin-right: 5px;">
          <Plus />
        </el-icon>
        建立新活動
      </el-button>
    </div>

    <el-tabs v-model="activeTab" class="management-tabs">
      <el-tab-pane label="活動列表" name="list">
        <div class="table-container">
          <el-table :data="filteredActivities" stripe style="width: 100%">
            <el-table-column prop="title" label="活動名稱" width="150"></el-table-column>
            
            <el-table-column label="類型" width="100">
              <template #default="{ row }">
                <el-tag :type="getActivityTypeColor(row.type)">
                  {{ getActivityTypeName(row.type) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="date" label="日期" width="110"></el-table-column>
            <el-table-column prop="time" label="時間" width="80"></el-table-column>
            <el-table-column prop="location" label="地點" width="120"></el-table-column>
            
            <el-table-column label="價錢" width="80">
              <template #default="{ row }">
                <span v-if="row.price > 0">${{ row.price.toFixed(2) }}</span>
                <span v-else style="color: #10b981;">免費</span>
              </template>
            </el-table-column>

            <el-table-column label="人數" width="100">
              <template #default="{ row }">
                <el-progress :percentage="((row.currentParticipants / row.maxParticipants) * 100).toFixed(1)" />
                <small style="color: #999;">{{ row.currentParticipants }} / {{ row.maxParticipants }}</small>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="showEditDialog(row)">編輯</el-button>
                <el-button type="danger" size="small" @click="deleteActivity(row)">刪除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="統計概覽" name="stats">
        <div class="stats-container">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="6">
              <el-statistic title="總活動數" :value="activities.length" class="stat-card">
                <template #prefix>
                  <el-icon style="color: #3b82f6;">
                    <Calendar />
                  </el-icon>
                </template>
              </el-statistic>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6">
              <el-statistic title="比賽" :value="competitionCount" class="stat-card">
                <template #prefix>
                  <el-icon style="color: #ef4444;">
                    <Trophy />
                  </el-icon>
                </template>
              </el-statistic>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6">
              <el-statistic title="訓練" :value="trainingCount" class="stat-card">
                <template #prefix>
                  <el-icon style="color: #3b82f6;">
                    <Lightning />
                  </el-icon>
                </template>
              </el-statistic>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6">
              <el-statistic title="特別活動" :value="specialEventCount" class="stat-card">
                <template #prefix>
                  <el-icon style="color: #10b981;">
                    <Star />
                  </el-icon>
                </template>
              </el-statistic>
            </el-col>
          </el-row>

          <div class="chart-section" style="margin-top: 30px;">
            <h3>報名人數分佈</h3>
            <el-table :data="activities" stripe style="margin-top: 20px;">
              <el-table-column prop="title" label="活動名稱" width="200"></el-table-column>
              <el-table-column label="報名進度" width="300">
                <template #default="{ row }">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <el-progress 
                      :percentage="parseFloat(((row.currentParticipants / row.maxParticipants) * 100).toFixed(1))" 
                      :status="(row.currentParticipants / row.maxParticipants) >= 1 ? 'exception' : undefined"
                      style="flex: 1;" />
                    <span style="min-width: 60px;">{{ row.currentParticipants }}/{{ row.maxParticipants }}</span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 建立/編輯活動對話框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditing ? '編輯活動' : '建立新活動'" 
      width="600px"
      @close="resetForm">
      <el-form ref="activityForm" :model="formData" label-width="100px" :rules="rules">
        <el-form-item label="活動名稱" prop="title">
          <el-input v-model="formData.title" placeholder="輸入活動名稱"></el-input>
        </el-form-item>

        <el-form-item label="活動類型" prop="type">
          <el-select v-model="formData.type" placeholder="選擇活動類型">
            <el-option label="比賽" value="COMPETITION"></el-option>
            <el-option label="訓練" value="TRAINING"></el-option>
            <el-option label="特別活動" value="SPECIAL_EVENT"></el-option>
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="日期" prop="date">
              <el-date-picker 
                v-model="formData.date" 
                type="date"
                placeholder="選擇日期"
                value-format="YYYY-MM-DD">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="時間" prop="time">
              <el-time-picker 
                v-model="formData.time" 
                placeholder="選擇時間"
                format="HH:mm"
                value-format="HH:mm">
              </el-time-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="地點" prop="location">
          <el-input v-model="formData.location" placeholder="輸入活動地點"></el-input>
        </el-form-item>

        <el-form-item label="價錢" prop="price">
          <el-input-number 
            v-model="formData.price" 
            :min="0" 
            :step="10"
            :precision="2"
            placeholder="輸入價錢">
          </el-input-number>
        </el-form-item>

        <el-form-item label="最大人數" prop="maxParticipants">
          <el-input-number 
            v-model="formData.maxParticipants" 
            :min="1"
            placeholder="輸入最大參與人數">
          </el-input-number>
        </el-form-item>

        <el-form-item label="詳細資料" prop="description">
          <el-input 
            v-model="formData.description" 
            type="textarea"
            rows="4"
            placeholder="輸入活動詳細資料">
          </el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="isSubmitting">
            {{ isEditing ? '更新' : '建立' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Calendar, Trophy, Lightning, Star } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/userStore'
import api from '../api'

const userStore = useUserStore()
const activeTab = ref('list')
const activities = ref([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)

const formData = ref({
  title: '',
  type: 'TRAINING',
  date: '',
  time: '',
  location: '',
  price: 0,
  maxParticipants: 20,
  description: ''
})

const rules = {
  title: [{ required: true, message: '請輸入活動名稱', trigger: 'blur' }],
  type: [{ required: true, message: '請選擇活動類型', trigger: 'change' }],
  date: [{ required: true, message: '請選擇日期', trigger: 'change' }],
  time: [{ required: true, message: '請選擇時間', trigger: 'change' }],
  location: [{ required: true, message: '請輸入地點', trigger: 'blur' }],
  maxParticipants: [{ required: true, message: '請輸入最大人數', trigger: 'blur' }]
}

const filteredActivities = computed(() => {
  return activities.value.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
})

const competitionCount = computed(() => activities.value.filter(a => a.type === 'COMPETITION').length)
const trainingCount = computed(() => activities.value.filter(a => a.type === 'TRAINING').length)
const specialEventCount = computed(() => activities.value.filter(a => a.type === 'SPECIAL_EVENT').length)

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

const loadActivities = async () => {
  try {
    const response = await api.get('/activities')
    activities.value = response
  } catch (error) {
    ElMessage.error('無法加載活動：' + error.message)
  }
}

const showCreateDialog = () => {
  isEditing.value = false
  resetForm()
  dialogVisible.value = true
}

const showEditDialog = (activity) => {
  isEditing.value = true
  formData.value = {
    title: activity.title,
    type: activity.type,
    date: activity.date,
    time: activity.time,
    location: activity.location,
    price: activity.price,
    maxParticipants: activity.maxParticipants,
    description: activity.description || ''
  }
  formData.value.id = activity.id
  dialogVisible.value = true
}

const resetForm = () => {
  formData.value = {
    title: '',
    type: 'TRAINING',
    date: '',
    time: '',
    location: '',
    price: 0,
    maxParticipants: 20,
    description: ''
  }
}

const submitForm = async () => {
  try {
    const data = {
      title: formData.value.title,
      type: formData.value.type,
      date: formData.value.date,
      time: formData.value.time,
      location: formData.value.location,
      price: formData.value.price,
      maxParticipants: formData.value.maxParticipants,
      description: formData.value.description
    }

    isSubmitting.value = true

    if (isEditing.value) {
      // Update activity
      await api.put(
        `/activities/${formData.value.id}`,
        data
      )
      ElMessage.success('活動已更新')
    } else {
      // Create activity
      await api.post(
        '/activities',
        data
      )
      ElMessage.success('活動已建立')
    }

    dialogVisible.value = false
    loadActivities()
  } catch (error) {
    const errorMsg = error.message || '操作失敗'
    ElMessage.error(errorMsg)
  } finally {
    isSubmitting.value = false
  }
}

const deleteActivity = (activity) => {
  ElMessageBox.confirm(
    `確定要刪除「${activity.title}」嗎？`,
    '警告',
    {
      confirmButtonText: '刪除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        await api.delete(`/activities/${activity.id}`)
        ElMessage.success('活動已刪除')
        loadActivities()
      } catch (error) {
        const errorMsg = error.message || '刪除失敗'
        ElMessage.error(errorMsg)
      }
    })
    .catch(() => {
      ElMessage.info('取消刪除')
    })
}

onMounted(() => {
  loadActivities()
})
</script>

<style scoped>
.admin-activities-container {
  padding: 20px;
  min-height: 100vh;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.admin-header h1 {
  font-size: 28px;
  color: #000000;
  stroke: 1px #000000;
  margin: 0;
}

.create-btn {
  min-width: 150px;
}

.management-tabs {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.stats-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 8px;
  color: white;
  text-align: center;
}

.chart-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.chart-section h3 {
  color: #1e293b;
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-table) {
  background: transparent;
}

:deep(.el-statistic) {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
</style>
