// frontend/src/views/Auth.vue
<template>
  <div class="auth-container">
    <el-card class="auth-card" shadow="always">
      <div class="logo-section">
        <Dribbble class="logo-icon" />
        <h2>球會會員系統</h2>
      </div>

      <el-tabs v-model="activeTab" class="auth-tabs">
        <el-tab-pane label="登入" name="login">
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
        </el-tab-pane>

        <el-tab-pane label="註冊" name="register">
          <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" @submit.prevent="handleRegister">
            <el-form-item prop="username">
              <el-input v-model="registerForm.username" placeholder="用戶名" clearable>
                <template #prefix><User /></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="email">
              <el-input v-model="registerForm.email" placeholder="電子郵件 (選填)" clearable>
                <template #prefix><Mail /></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input type="password" v-model="registerForm.password" placeholder="密碼" show-password>
                <template #prefix><Lock /></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input type="password" v-model="registerForm.confirmPassword" placeholder="確認密碼" show-password>
                <template #prefix><Lock /></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="name">
              <el-input v-model="registerForm.name" placeholder="姓名" clearable>
                <template #prefix><UserSquare /></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="phoneNumber">
              <el-input v-model="registerForm.phoneNumber" placeholder="電話號碼 (選填)" clearable>
                <template #prefix><Phone /></template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="success" class="w-full" @click="handleRegister" :loading="userStore.loading">註冊</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import { ElMessage } from 'element-plus';
import { User, Lock, Mail, UserSquare, Phone, Dribbble } from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();

const activeTab = ref('login');
const loginFormRef = ref(null);
const registerFormRef = ref(null);

const loginForm = reactive({
  username: '',
  password: '',
});

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  phoneNumber: '',
});

const loginRules = reactive({
  username: [{ required: true, message: '請輸入用戶名', trigger: 'blur' }],
  password: [{ required: true, message: '請輸入密碼', trigger: 'blur' }],
});

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('請再次輸入密碼'));
  } else if (value !== registerForm.password) {
    callback(new Error('兩次輸入的密碼不一致!'));
  } else {
    callback();
  }
};

const registerRules = reactive({
  username: [{ required: true, message: '請輸入用戶名', trigger: 'blur' }],
  password: [{ required: true, message: '請輸入密碼', trigger: 'blur' }, { min: 6, message: '密碼長度至少為6位', trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validatePass, trigger: 'blur' }],
  name: [{ required: true, message: '請輸入姓名', trigger: 'blur' }],
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

const handleRegister = async () => {
  if (!registerFormRef.value) return;
  registerFormRef.value.validate(async (valid) => {
    if (valid) {
      const success = await userStore.register({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        name: registerForm.name,
        phone_number: registerForm.phoneNumber,
      });
      if (success) {
        // 註冊成功後，通常會導向登入頁面或自動登入
        activeTab.value = 'login'; // 切換到登入頁面
        loginForm.username = registerForm.username; // 預填用戶名
        ElMessage.success('註冊成功，請登入');
      } else {
        // 錯誤訊息已在 api/index.js 和 userStore 中處理
      }
    } else {
      ElMessage.error('請檢查註冊表單');
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

.auth-tabs .el-tab-pane {
  padding: 15px 0;
}

.w-full {
  width: 100%;
}
</style>
