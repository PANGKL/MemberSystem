<template>
  <div class="academic-year-mgmt">
    <div class="flex justify-between items-center mb-4">
      <h2 class="va-h6 m-0">學年管理</h2>
      <VaButton icon="add" @click="openCreateDialog">新增學年</VaButton>
    </div>

    <VaCard>
      <VaCardContent>
        <VaDataTable
          :items="academicYears"
          :columns="columns"
          :loading="loading"
          no-data-html="暫無學年資料"
        >
          <template #cell(is_active)="{ row }">
            <VaChip :color="row.rowData.is_active ? 'success' : 'danger'" size="small">
              {{ row.rowData.is_active ? '啟用' : '停用' }}
            </VaChip>
          </template>

          <template #cell(actions)="{ row }">
            <div class="flex gap-2">
              <VaButton preset="primary" size="small" icon="edit" @click="handleEdit(row.rowData)" />
              <VaButton preset="danger" size="small" icon="delete" @click="handleDelete(row.rowData)" />
            </div>
          </template>
        </VaDataTable>
      </VaCardContent>
    </VaCard>

    <!-- 編輯/新增對話框 -->
    <VaModal
      v-model="dialogVisible"
      :title="isEdit ? '編輯學年' : '新增學年'"
      hide-default-actions
    >
      <VaForm ref="formRef" @submit.prevent="saveAcademicYear" class="flex flex-col gap-4 min-w-[300px]">
        <VaInput
          v-model="form.name"
          label="學年度名稱"
          placeholder="例如：113"
          :rules="[(v) => !!v || '請輸入學年度名稱']"
        />
        
        <VaDateInput
          v-model="form.start_date"
          label="起始日期"
          placeholder="選擇日期"
          clearable
          :rules="[(v) => !!v || '請選擇起始日期']"
          @update:model-value="(v) => form.start_date = formatDateForApi(v)"
        />

        <VaDateInput
          v-model="form.end_date"
          label="結束日期"
          placeholder="選擇日期"
          clearable
          :rules="[(v) => !!v || '請選擇結束日期']"
          @update:model-value="(v) => form.end_date = formatDateForApi(v)"
        />

        <VaSwitch
          v-model="form.is_active"
          :label="form.is_active ? '啟用' : '停用'"
          size="small"
        />

        <div class="flex justify-end gap-2 mt-4">
          <VaButton preset="secondary" @click="dialogVisible = false">取消</VaButton>
          <VaButton type="submit" :loading="saving">儲存</VaButton>
        </div>
      </VaForm>
    </VaModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../../api';
import { useNotifications } from '../../utils/notifications';
import { useConfirm } from '../../utils/confirm';

const { notifySuccess, notifyError } = useNotifications();
const { confirmAction } = useConfirm();

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

const columns = [
  { key: 'id', label: 'ID', sortable: true, width: '60px' },
  { key: 'name', label: '學年度名稱', sortable: true },
  { key: 'start_date', label: '起始日期', sortable: true },
  { key: 'end_date', label: '結束日期', sortable: true },
  { key: 'is_active', label: '狀態', width: '100px' },
  { key: 'actions', label: '操作', width: '120px' }
];

// VaDateInput returns Date object, backend needs YYYY-MM-DD string
// But for display in VaDateInput, it handles Date object or string well usually.
// Let's ensure we send string to API and bind Date object/string correctly.
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
    notifyError('無法載入學年資料');
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
    start_date: row.start_date ? new Date(row.start_date) : null,
    end_date: row.end_date ? new Date(row.end_date) : null
  });
  dialogVisible.value = true;
};

const saveAcademicYear = async () => {
  // VaForm validation check could be added here if needed, 
  // but @submit.prevent on VaForm usually handles it if isValid is checked.
  // For simplicity, we check fields manually or rely on backend error if basic rules pass.
  
  if (!form.name || !form.start_date || !form.end_date) {
    notifyError('請填寫完整資料');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      ...form,
      start_date: formatDateForApi(form.start_date),
      end_date: formatDateForApi(form.end_date)
    };

    if (isEdit.value) {
      await api.put(`/users/academic-years/${form.id}/`, payload);
      notifySuccess('學年更新成功');
    } else {
      await api.post('/users/academic-years/', payload);
      notifySuccess('學年建立成功');
    }
    dialogVisible.value = false;
    fetchAcademicYears();
  } catch (error) {
    const errorMsg = error.response?.data?.name ? '學年名稱重複或無效' : '操作失敗';
    notifyError(errorMsg);
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (row) => {
  const confirmed = await confirmAction({
    title: '刪除學年',
    message: `確定要刪除學年 ${row.name} 嗎？此操作將連同刪除該學年下的所有班級。`,
    okText: '刪除',
    cancelText: '取消'
  });

  if (confirmed) {
    try {
      await api.delete(`/users/academic-years/${row.id}/`);
      notifySuccess('學年已刪除');
      fetchAcademicYears();
    } catch (error) {
      notifyError('刪除失敗');
    }
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
