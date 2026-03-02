// frontend/src/views/Auth.vue
<template>
  <div class="auth-container">
    <el-card class="auth-card" shadow="always">
      <div class="logo-section">
        <Dribbble class="logo-icon" />
        <h2>球會會員系統</h2>
      </div>

      <div class="auth-content">
        <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" placeholder="用戶名" clearable>
              <template #prefix><User /></template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input type="password" v-model="loginForm.password" placeholder="密碼" show-password>
              <template #prefix><Lock /></template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="w-full" @click="handleLogin" :loading="userStore.loading">登入</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import { ElMessage } from 'element-plus';
import { User, Lock, Dribbble } from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();

const loginFormRef = ref(null);

const loginForm = reactive({
  username: '',
  password: '',
});

const loginRules = reactive({
  username: [{ required: true, message: '請輸入用戶名', trigger: 'blur' }],
  password: [{ required: true, message: '請輸入密碼', trigger: 'blur' }],
});

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  loginFormRef.value.validate(async (valid) => {
    if (valid) {
      const success = await userStore.login(loginForm.username, loginForm.password);
      if (success) {
        ElMessage.success('登入成功');
        router.push('/');
      } else {
        // 錯誤訊息已在 api/index.js 和 userStore 中處理
      }
    } else {
      ElMessage.error('請檢查登入表單');
      return false;
    }
  });
};
</script>

<style scoped>
/* 樣式保持不變 */
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.auth-card {
  width: 90%;
  max-width: 400px;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.logo-section {
  text-align: center;
  margin-bottom: 20px;
}

.logo-icon {
  width: 60px;
  height: 60px;
  color: #409eff;
  margin-bottom: 10px;
}

.logo-section h2 {
  font-size: 24px;
  color: #303133;
  margin: 0;
}

.auth-content {
  padding: 15px 0;
}

.w-full {
  width: 100%;
}
</style>
