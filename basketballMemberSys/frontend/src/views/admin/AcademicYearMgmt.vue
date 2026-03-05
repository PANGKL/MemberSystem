<template>
  <div class="academic-year-mgmt">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold m-0">學年管理</h2>
      <el-button type="primary" @click="openCreateDialog">新增學年</el-button>
    </div>

    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="academicYears"
        style="width: 100%"
        empty-text="暫無學年資料"
      >
        <!-- <el-table-column prop="id" label="ID" width="60" sortable /> -->
        <el-table-column prop="name" label="學年度名稱" sortable />
        <el-table-column prop="start_date" label="起始日期" sortable />
        <el-table-column prop="end_date" label="結束日期" sortable />
        <el-table-column prop="is_active" label="狀態" width="150">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? '啟用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <div class="flex gap-2">
              <el-button type="primary" size="small" @click="handleEdit(row)">編輯</el-button>
              <el-button type="danger" size="small"  @click="handleDelete(row)">刪除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 編輯/新增對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '編輯學年' : '新增學年'"
      width="400px"
    >
      <el-form ref="formRef" :model="form" label-width="100px" class="flex flex-col gap-4">
        <el-form-item label="學年度名稱" required>
          <el-input v-model="form.name" placeholder="例如：2026" />
        </el-form-item>
        
        <el-form-item label="起始日期" required>
          <el-date-picker
            v-model="form.start_date"
            type="date"
            placeholder="選擇日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="結束日期" required>
          <el-date-picker
            v-model="form.end_date"
            type="date"
            placeholder="選擇日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="狀態">
          <el-switch
            v-model="form.is_active"
            active-text="啟用"
            inactive-text="停用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveAcademicYear">儲存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';

const loading = ref(false);
const saving = ref(false);
const academicYears = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);

const form = reactive({
  id: null,
  name: '',
  start_date: null,
  end_date: null,
  is_active: true
});

const formatDateForApi = (date) => {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
};

const fetchAcademicYears = async () => {
  loading.value = true;
  try {
    const data = await api.get('/users/academic-years/');
    academicYears.value = data;
  } catch (error) {
    ElMessage.error('無法載入學年資料');
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  isEdit.value = false;
  Object.assign(form, { id: null, name: '', start_date: null, end_date: null, is_active: true });
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  Object.assign(form, {
    ...row,
    start_date: row.start_date, // Assuming string YYYY-MM-DD from API
    end_date: row.end_date
  });
  dialogVisible.value = true;
};

const saveAcademicYear = async () => {
  if (!form.name || !form.start_date || !form.end_date) {
    ElMessage.warning('請填寫完整資料');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      ...form,
      start_date: form.start_date, // Already formatted by el-date-picker
      end_date: form.end_date
    };

    if (isEdit.value) {
      await api.put(`/users/academic-years/${form.id}/`, payload);
      ElMessage.success('學年更新成功');
    } else {
      await api.post('/users/academic-years/', payload);
      ElMessage.success('學年建立成功');
    }
    dialogVisible.value = false;
    fetchAcademicYears();
  } catch (error) {
    const errorMsg = error.response?.data?.name ? '學年名稱重複或無效' : '操作失敗';
    ElMessage.error(errorMsg);
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除學年 ${row.name} 嗎？此操作將連同刪除該學年下的所有班級。`,
      '刪除學年',
      {
        confirmButtonText: '刪除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await api.delete(`/users/academic-years/${row.id}/`);
    ElMessage.success('學年已刪除');
    fetchAcademicYears();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('刪除失敗');
  }
};

onMounted(() => {
  fetchAcademicYears();
});
</script>

<style scoped>
.academic-year-mgmt {
  padding: 1rem;
}



</style>
