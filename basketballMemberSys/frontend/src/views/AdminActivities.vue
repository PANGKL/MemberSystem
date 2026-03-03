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
        
        <!-- 搜尋與篩選區域 -->
        <el-card shadow="never" class="filter-card mb-4">
          <el-row :gutter="20">
            <el-col :span="6" :xs="24">
              <el-input
                v-model="searchQuery"
                placeholder="搜尋活動名稱、ID"
                clearable
                prefix-icon="Search"
              />
            </el-col>
            <el-col :span="6" :xs="24">
              <el-select v-model="filterType" placeholder="活動類型" clearable style="width: 100%">
                <el-option label="全部類型" value="" />
                <el-option label="課程 (Course)" value="COURSE" />
                <el-option label="訓練 (Training)" value="TRAINING" />
                <el-option label="比賽 (Competition)" value="COMPETITION" />
                <el-option label="特別活動 (Special Event)" value="SPECIAL_EVENT" />
              </el-select>
            </el-col>
            <el-col :span="6" :xs="24">
              <el-select v-model="filterStatus" placeholder="活動狀態" clearable style="width: 100%">
                <el-option label="全部狀態" value="" />
                <el-option label="報名中 (Registering)" value="registering" />
                <el-option label="已結束 (Ended)" value="ended" />
                <el-option label="已滿額 (Full)" value="full" />
              </el-select>
            </el-col>
            <el-col :span="6" :xs="24">
               <el-date-picker
                v-model="searchDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="日期起"
                end-placeholder="日期止"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-col>
          </el-row>
          <el-row :gutter="20" class="mt-4">
             <el-col :span="12" :xs="24">
               <span class="demonstration text-gray-500 mr-2">參與人數:</span>
               <el-slider v-model="filterParticipantsRange" range :max="50" style="width: 80%; display: inline-block; vertical-align: middle;" />
             </el-col>
             <el-col :span="12" :xs="24" class="text-right">
                <el-button @click="clearFilters">清除篩選</el-button>
                <el-button type="primary" @click="exportActivityData">匯出 CSV</el-button>
             </el-col>
          </el-row>
        </el-card>

        <div class="table-container">
          <el-table :data="filteredActivities" stripe style="width: 100%" row-key="id">
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="registration-details">
                  <h3>報名詳情 (Registrations)</h3>
                  <el-table :data="row.registrations" size="small" border row-key="id">
                    <el-table-column label="學員姓名">
                      <template #default="scope">
                        {{ scope.row.child?.name }}
                      </template>
                    </el-table-column>
                    <el-table-column label="家長">
                      <template #default="scope">
                        {{ scope.row.user?.name }} ({{ scope.row.user?.username }})
                      </template>
                    </el-table-column>
                    <el-table-column label="狀態" width="120">
                      <template #default="scope">
                        <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                          {{ getStatusLabel(scope.row.status) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="收據" width="100">
                      <template #default="scope">
                        <span v-if="scope.row.activity?.price == 0">免費</span>
                        <template v-else>
                          <el-button v-if="scope.row.payment_receipt" type="primary" link @click="viewReceipt(scope.row)">查看</el-button>
                          <span v-else>未上傳</span>
                        </template>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150">
                      <template #default="scope">
                        <el-button-group>
                          <el-button 
                            v-if="scope.row.status === 'AWAITING_APPROVAL'" 
                            type="success" 
                            size="small" 
                            @click="approveRegistration(scope.row)"
                          >確認</el-button>
                          <el-button 
                            v-if="scope.row.status === 'AWAITING_APPROVAL' || scope.row.status === 'CONFIRMED'" 
                            type="danger" 
                            size="small" 
                            @click="rejectRegistration(scope.row)"
                          >駁回</el-button>
                        </el-button-group>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </template>
            </el-table-column>
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
            
            <el-table-column label="價錢" width="100">
              <template #default="{ row }">
                <span v-if="Number(row.price) > 0">${{ Number(row.price).toFixed(1) }}</span>
                <span v-else style="color: #10b981;">免費</span>
              </template>
            </el-table-column>

            <el-table-column label="人數" width="100">
              <template #default="{ row }">
                <el-progress :percentage="getParticipationPercentage(row)" />
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
                      :percentage="getParticipationPercentage(row)" 
                      :status="getParticipationRatio(row) >= 1 ? 'exception' : undefined"
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
            <el-option label="課程" value="COURSE"></el-option>
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

    <!-- 查看收據對話框 -->
    <el-dialog v-model="showReceiptDialog" title="查看繳費收據" width="500px">
      <div v-if="selectedRegistration" class="receipt-preview">
        <p><strong>學員:</strong> {{ selectedRegistration.child?.name }}</p>
        <p><strong>收據編號:</strong> {{ selectedRegistration.payment_reference }}</p>
        <div class="receipt-image-container">
          <el-image 
            :src="selectedRegistration.payment_receipt" 
            fit="contain"
            :preview-src-list="[selectedRegistration.payment_receipt]"
          ></el-image>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Calendar, Trophy, Lightning, Star, Search } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/userStore'
import api from '../api'

const userStore = useUserStore()
const activeTab = ref('list')
const activities = ref([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)

const showReceiptDialog = ref(false)
const selectedRegistration = ref(null)

// Filters
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const searchDateRange = ref(null)
const filterParticipantsRange = ref([0, 50])

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
  return activities.value.filter(activity => {
    // 1. Search Query
    const query = searchQuery.value.toLowerCase()
    const matchQuery = !query || 
      (activity.title && activity.title.toLowerCase().includes(query)) ||
      (activity.description && activity.description.toLowerCase().includes(query)) ||
      (activity.location && activity.location.toLowerCase().includes(query)) ||
      (String(activity.id).includes(query))

    // 2. Type Filter
    const matchType = !filterType.value || activity.type === filterType.value

    // 3. Status Filter
    let matchStatus = true
    if (filterStatus.value) {
      const now = new Date()
      const activityDate = new Date(activity.dateTime || `${activity.date}T${activity.time}`)
      const isFull = activity.currentParticipants >= activity.maxParticipants

      if (filterStatus.value === 'registering') {
        matchStatus = activityDate > now && !isFull
      } else if (filterStatus.value === 'ended') {
        matchStatus = activityDate < now
      } else if (filterStatus.value === 'full') {
        matchStatus = isFull
      }
    }

    // 4. Date Range Filter
    let matchDate = true
    if (searchDateRange.value && searchDateRange.value.length === 2 && activity.date) {
      matchDate = activity.date >= searchDateRange.value[0] && activity.date <= searchDateRange.value[1]
    }

    // 5. Participants Range Filter
    const matchParticipants = 
      activity.currentParticipants >= filterParticipantsRange.value[0] &&
      activity.currentParticipants <= filterParticipantsRange.value[1]

    return matchQuery && matchType && matchStatus && matchDate && matchParticipants
  }).sort((a, b) => {
    const dateA = a.dateTime || a.date_time || `${a.date}T${a.time}`
    const dateB = b.dateTime || b.date_time || `${b.date}T${b.time}`
    return new Date(dateA) - new Date(dateB)
  })
})

const clearFilters = () => {
  searchQuery.value = ''
  filterType.value = ''
  filterStatus.value = ''
  searchDateRange.value = null
  filterParticipantsRange.value = [0, 50]
}

const exportActivityData = () => {
  const headers = ['ID', 'Title', 'Type', 'Date', 'Time', 'Location', 'Price', 'Participants', 'Max Participants']
  const csvContent = [
    headers.join(','),
    ...filteredActivities.value.map(a => [
      a.id,
      `"${a.title}"`,
      a.type,
      a.date,
      a.time,
      `"${a.location}"`,
      a.price,
      a.currentParticipants,
      a.maxParticipants
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'activities_export.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

const competitionCount = computed(() => activities.value.filter(a => a.type === 'COMPETITION').length)
const trainingCount = computed(() => activities.value.filter(a => a.type === 'TRAINING').length)
const specialEventCount = computed(() => activities.value.filter(a => a.type === 'SPECIAL_EVENT').length)

const getActivityTypeName = (type) => {
  const typeMap = {
    'COURSE': '課程',
    'COMPETITION': '比賽',
    'TRAINING': '訓練',
    'SPECIAL_EVENT': '特別活動'
  }
  return typeMap[type] || type
}

const getActivityTypeColor = (type) => {
  const colorMap = {
    'COURSE': 'info',
    'COMPETITION': 'danger',
    'TRAINING': 'primary',
    'SPECIAL_EVENT': 'success'
  }
  return colorMap[type] || 'info'
}

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

const getParticipationRatio = (activity) => {
  const max = Number(activity?.maxParticipants)
  const current = Number(activity?.currentParticipants)
  if (!max || Number.isNaN(max) || max <= 0) {
    return 0
  }
  if (Number.isNaN(current) || current < 0) {
    return 0
  }
  return current / max
}

const getParticipationPercentage = (activity) => {
  const ratio = getParticipationRatio(activity)
  return Number((ratio * 100).toFixed(1))
}

const viewReceipt = (reg) => {
  selectedRegistration.value = reg;
  showReceiptDialog.value = true;
};

const approveRegistration = async (reg) => {
  try {
    await api.post(`/activities/registrations/${reg.id}/approve/`);
    ElMessage.success('報名已確認');
    loadActivities();
  } catch (error) {
    ElMessage.error('操作失敗');
  }
};

const rejectRegistration = async (reg) => {
  try {
    await api.post(`/activities/registrations/${reg.id}/reject/`);
    ElMessage.success('報名已退回待繳費狀態');
    loadActivities();
  } catch (error) {
    ElMessage.error('操作失敗');
  }
};

const loadActivities = async () => {
  try {
    const response = await api.get('/activities/')
    const rawData = Array.isArray(response) ? response : (response?.results || [])
    activities.value = rawData.map(activity => ({
      ...activity,
      // 確保前端使用的欄位名稱正確映射
      currentParticipants: activity.currentParticipants || activity.current_participants || 0,
      maxParticipants: activity.maxParticipants || activity.max_participants || 0,
      price: Number(activity.price) || 0,
      // 如果後端返回的是 date 和 time，確保它們被正確讀取
      date: activity.date,
      time: activity.time,
      dateTime: activity.date_time || activity.dateTime,
      registrations: activity.registrations || []
    }))
    console.log('Activities loaded:', activities.value)
  } catch (error) {
    ElMessage.error('無法加載活動：' + (error.response?.data?.detail || error.message))
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
    id: activity.id,
    title: activity.title,
    type: activity.type,
    date: activity.date,
    time: activity.time,
    location: activity.location,
    price: activity.price,
    maxParticipants: activity.maxParticipants,
    description: activity.description || ''
  }
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

    isSubmitting.value = true;
    console.log('Sending data:', data); // 調試用

    if (isEditing.value) {
      // Update activity
      await api.put(
        `/activities/${formData.value.id}/`,
        data
      )
      ElMessage.success('活動已更新')
    } else {
      // Create activity
      await api.post(
        '/activities/',
        data
      )
      ElMessage.success('活動已建立')
    }

    dialogVisible.value = false
    loadActivities()
  } catch (error) {
    const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : (error.message || '操作失敗')
    ElMessage.error(errorMsg)
    console.error('API Error:', error.response?.data)
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
        await api.delete(`/activities/${activity.id}/`)
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
