<template>
  <div class="class-mgmt">
    <div class="flex justify-between items-center mb-4">
      <h2 class="va-h6 m-0">班別管理</h2>
      <VaButton icon="add" @click="openCreateDialog">新增班別</VaButton>
    </div>

    <VaCard>
      <VaCardContent>
        <VaDataTable
          :items="classes"
          :columns="columns"
          :loading="loading"
          no-data-html="暫無班別資料"
        >
          <template #cell(actions)="{ row }">
            <div class="flex gap-2">
              <VaButton preset="primary" size="small" icon="edit" @click="handleEdit(row.rowData)" />
              <VaButton preset="secondary" size="small" icon="group" @click="openStudentsList(row.rowData)">
                查看學生
              </VaButton>
            </div>
          </template>
        </VaDataTable>
      </VaCardContent>
    </VaCard>

    <!-- 建立/編輯班別對話框 -->
    <VaModal
      v-model="dialogVisible"
      :title="isEdit ? '編輯班別' : '建立班別'"
      hide-default-actions
    >
      <VaForm ref="formRef" @submit.prevent="saveClass" class="flex flex-col gap-4 min-w-[300px]">
        <VaSelect
          v-model="form.academic_year"
          label="學年度"
          :options="academicYearOptions"
          :disabled="isEdit" 
          value-by="id"
          text-by="name"
          placeholder="請選擇學年度"
          :rules="[(v) => !!v || '請選擇學年度']"
        />
        <div v-if="academicYearOptions.length === 0 && !loading" class="text-xs text-red-500">
          目前無啟用的學年度，請先至「學年管理」新增或啟用。
        </div>

        <VaInput
          v-model="form.name"
          label="班別名稱"
          placeholder="例如：A班"
          :rules="[(v) => !!v || '請輸入班別名稱', (v) => v.length <= 20 || '限制 20 字']"
          :max-length="20"
        />

        <div class="flex justify-end gap-2 mt-4">
          <VaButton preset="secondary" @click="dialogVisible = false">取消</VaButton>
          <VaButton type="submit" :loading="saving" :disabled="academicYearOptions.length === 0 && !isEdit">
            {{ isEdit ? '儲存' : '建立' }}
          </VaButton>
        </div>
      </VaForm>
    </VaModal>

    <!-- 學生列表對話框 -->
    <VaModal
      v-model="studentsDialogVisible"
      :title="`學生列表 - ${selectedClass?.academic_year_name} ${selectedClass?.name}`"
      size="large"
      hide-default-actions
    >
      <VaDataTable
        :items="classStudents"
        :columns="studentColumns"
        :loading="studentsLoading"
        no-data-html="本班尚無學生"
        class="max-h-[60vh]"
      />
      <div class="flex justify-end mt-4">
        <VaButton preset="secondary" @click="studentsDialogVisible = false">關閉</VaButton>
      </div>
    </VaModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import api from '../../api';
import { useNotifications } from '../../utils/notifications';

const { notifySuccess, notifyError, notifyWarning } = useNotifications();

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

const columns = [
  { key: 'id', label: 'ID', sortable: true, width: '60px' },
  { key: 'academic_year_name', label: '學年度', sortable: true },
  { key: 'name', label: '班別名稱', sortable: true },
  { key: 'actions', label: '操作', width: '200px' }
];

const studentColumns = [
  { key: 'id', label: 'ID', width: '60px' },
  { key: 'name', label: '姓名' },
  { key: 'date_of_birth', label: '出生日期' },
  { key: 'parent_name', label: '家長' }
];

const academicYearOptions = computed(() => {
  return academicYears.value.map(y => ({ id: y.id, name: y.name }));
});

const fetchClasses = async () => {
  loading.value = true;
  try {
    const data = await api.get('/users/classes/');
    classes.value = data;
  } catch (error) {
    notifyError('無法載入班別資料');
  } finally {
    loading.value = false;
  }
};

const fetchActiveAcademicYears = async () => {
  try {
    const data = await api.get('/users/academic-years/active/');
    academicYears.value = data;
  } catch (error) {
    notifyError('無法載入學年資料');
  }
};

const openCreateDialog = () => {
  if (academicYears.value.length === 0) {
    notifyWarning('目前無啟用的學年度，請先至「學年管理」新增或啟用。');
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
  // Backend returns academic_year object or ID depending on serializer depth. 
  // Assuming backend returns flat ID or object with ID. 
  // Based on serializer, StudentClassSerializer has academic_year_name (read_only) and academic_year (ID).
  // We need to ensure form.academic_year gets the ID.
  Object.assign(form, {
    id: row.id,
    academic_year: row.academic_year, 
    name: row.name
  });
  dialogVisible.value = true;
};

const saveClass = async () => {
  if (!form.academic_year || !form.name) return;

  saving.value = true;
  try {
    if (isEdit.value) {
      await api.put(`/users/classes/${form.id}/`, form);
      notifySuccess('班別更新成功');
    } else {
      await api.post('/users/classes/', form);
      notifySuccess('班別建立成功');
    }
    dialogVisible.value = false;
    fetchClasses();
  } catch (error) {
    const errorMsg = error.response?.data?.name ? '班別名稱重複或無效' : '操作失敗';
    notifyError(errorMsg);
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
    notifyError('載入學生列表失敗');
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
