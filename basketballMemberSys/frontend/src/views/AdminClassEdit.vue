<template>
  <div class="admin-class-edit">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <h2>編輯班別資料</h2>
        </div>
      </template>
      
      <el-form 
        ref="classFormRef"
        :model="classForm" 
        :rules="rules" 
        label-position="top"
        v-loading="loading"
      >
        <el-form-item label="學年度" prop="academic_year">
          <el-select v-model="classForm.academic_year" placeholder="請選擇學年度" style="width: 100%">
            <el-option label="112" value="112" />
            <el-option label="113" value="113" />
            <el-option label="114" value="114" />
            <el-option label="115" value="115" />
          </el-select>
        </el-form-item>

        <el-form-item label="班別名稱" prop="name">
          <el-input 
            v-model="classForm.name" 
            placeholder="請輸入班別名稱 (限制 20 字)" 
            maxlength="20" 
            show-word-limit
          />
        </el-form-item>

        <div class="form-actions">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSave">儲存</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const classId = route.params.classId;

const loading = ref(false);
const classFormRef = ref(null);

const classForm = reactive({
  academic_year: '',
  name: ''
});

const rules = {
  academic_year: [
    { required: true, message: '請選擇學年度', trigger: 'change' }
  ],
  name: [
    { required: true, message: '請輸入班別名稱', trigger: 'blur' },
    { max: 20, message: '班別名稱不能超過 20 個字', trigger: 'blur' }
  ]
};

const fetchClassData = async () => {
  if (!classId) return;
  loading.value = true;
  try {
    const data = await api.get(`/users/classes/${classId}/`);
    classForm.academic_year = data.academic_year;
    classForm.name = data.name;
  } catch (error) {
    ElMessage.error('無法載入班別資料');
    router.push('/admin/users'); // Redirect back on error
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  if (!classFormRef.value) return;
  
  await classFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        await api.put(`/users/classes/${classId}/`, classForm);
        ElMessage.success('班別資料更新成功');
        router.push('/admin/users'); // Go back to list
      } catch (error) {
        const errorMsg = error.response?.data?.name ? '班別名稱重複或無效' : '更新失敗';
        ElMessage.error(errorMsg);
      } finally {
        loading.value = false;
      }
    } else {
      ElMessage.warning('請檢查輸入資料');
    }
  });
};

const handleCancel = () => {
  router.push('/admin/users');
};

onMounted(() => {
  fetchClassData();
});
</script>

<style scoped>
.admin-class-edit {
  max-width: 600px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}
</style>
