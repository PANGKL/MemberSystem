<template>
  <div class="class-mgmt">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold m-0">班別管理</h2>
      <el-button type="primary" @click="openCreateDialog">新增班別</el-button>
    </div>

    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="classes"
        style="width: 100%"
        empty-text="暫無班別資料"
      >
        <!-- <el-table-column prop="id" label="ID" width="60" sortable /> -->
        <el-table-column prop="academic_year_name" label="學年度" sortable />
        <el-table-column prop="name" label="班別名稱" sortable />
        
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <div class="flex gap-2">
              <el-button type="primary" size="small" @click="handleEdit(row)">編輯</el-button>
              <el-button type="success" size="small" @click="openStudentsList(row)">
                查看學生
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 建立/編輯班別對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '編輯班別' : '建立班別'"
      width="400px"
    >
      <el-form ref="formRef" :model="form" label-width="80px" class="flex flex-col gap-4">
        <el-form-item label="學年度" required>
          <el-select
            v-model="form.academic_year"
            placeholder="請選擇學年度"
            :disabled="isEdit"
            class="w-full"
          >
            <el-option
              v-for="item in academicYearOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
          <div v-if="academicYearOptions.length === 0 && !loading" class="text-xs text-red-500 mt-1">
            目前無啟用的學年度，請先至「學年管理」新增或啟用。
          </div>
        </el-form-item>

        <el-form-item label="班別名稱" required>
          <el-input
            v-model="form.name"
            placeholder="例如：A班"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            :loading="saving" 
            :disabled="academicYearOptions.length === 0 && !isEdit"
            @click="saveClass"
          >
            {{ isEdit ? '儲存' : '建立' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 學生列表對話框 -->
    <el-dialog
      v-model="studentsDialogVisible"
      :title="`學生列表 - ${selectedClass?.academic_year_name} ${selectedClass?.name}`"
      width="600px"
    >
      <el-table
        v-loading="studentsLoading"
        :data="classStudents"
        style="width: 100%"
        max-height="60vh"
        empty-text="本班尚無學生"
      >
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="date_of_birth" label="出生日期" />
        <el-table-column prop="parent_name" label="家長" />
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="studentsDialogVisible = false">關閉</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import api from '../../api';
import { ElMessage } from 'element-plus';
import { Plus, Edit, User } from '@element-plus/icons-vue';

const loading = ref(false);
const saving = ref(false);
const classes = ref([]);
const academicYears = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);

// Class Students
const studentsDialogVisible = ref(false);
const studentsLoading = ref(false);
const classStudents = ref([]);
const selectedClass = ref(null);

const form = reactive({
  id: null,
  academic_year: null,
  name: ''
});

const academicYearOptions = computed(() => {
  return academicYears.value.map(y => ({ id: y.id, name: y.name }));
});

const fetchClasses = async () => {
  loading.value = true;
  try {
    const data = await api.get('/users/classes/');
    classes.value = data;
  } catch (error) {
    ElMessage.error('無法載入班別資料');
  } finally {
    loading.value = false;
  }
};

const fetchActiveAcademicYears = async () => {
  try {
    const data = await api.get('/users/academic-years/active/');
    academicYears.value = data;
  } catch (error) {
    ElMessage.error('無法載入學年資料');
  }
};

const openCreateDialog = () => {
  if (academicYears.value.length === 0) {
    ElMessage.warning('目前無啟用的學年度，請先至「學年管理」新增或啟用。');
  }
  isEdit.value = false;
  Object.assign(form, { 
    id: null, 
    academic_year: academicYears.value.length > 0 ? academicYears.value[0].id : null, 
    name: '' 
  });
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  Object.assign(form, {
    id: row.id,
    academic_year: row.academic_year, 
    name: row.name
  });
  dialogVisible.value = true;
};

const saveClass = async () => {
  if (!form.academic_year || !form.name) {
    ElMessage.warning('請填寫完整資料');
    return;
  }

  saving.value = true;
  try {
    if (isEdit.value) {
      await api.put(`/users/classes/${form.id}/`, form);
      ElMessage.success('班別更新成功');
    } else {
      await api.post('/users/classes/', form);
      ElMessage.success('班別建立成功');
    }
    dialogVisible.value = false;
    fetchClasses();
  } catch (error) {
    const errorMsg = error.response?.data?.name ? '班別名稱重複或無效' : '操作失敗';
    ElMessage.error(errorMsg);
  } finally {
    saving.value = false;
  }
};

const openStudentsList = async (row) => {
  selectedClass.value = row;
  studentsDialogVisible.value = true;
  studentsLoading.value = true;
  try {
    const data = await api.get(`/users/classes/${row.id}/students/`);
    classStudents.value = data;
  } catch (error) {
    ElMessage.error('載入學生列表失敗');
  } finally {
    studentsLoading.value = false;
  }
};

onMounted(() => {
  fetchClasses();
  fetchActiveAcademicYears();
});
</script>

<style scoped>
.class-mgmt {
  padding: 1rem;
}
</style>
