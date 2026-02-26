<template>
  <div class="auth-container">
    <el-card class="auth-card">
      <template #header>
        <div class="auth-header">
          <div class="logo-wrapper">
            <Dribble class="logo-icon" />
          </div>
          <h2>{{ isLogin ? '會員登入 (Login)' : '註冊帳號 (Register)' }}</h2>
        </div>
      </template>

      <el-form :model="form" @submit.prevent="handleSubmit" label-position="top">
        <el-form-item label="用戶名 (Username)">
          <el-input v-model="form.username" placeholder="請輸入用戶名" />
        </el-form-item>

        <el-form-item v-if="!isLogin" label="姓名 (Full Name)">
          <el-input v-model="form.name" placeholder="請輸入姓名" />
        </el-form-item>

        <el-form-item v-if="!isLogin" label="電子郵件 (Email - 可選)">
          <el-input v-model="form.email" type="email" placeholder="example@email.com" />
        </el-form-item>

        <el-form-item label="密碼 (Password)">
          <el-input v-model="form.password" type="password" show-password placeholder="請輸入密碼" />
        </el-form-item>

        <el-form-item v-if="!isLogin" label="電話 (Phone Number)">
          <el-input v-model="form.phoneNumber" placeholder="請輸入電話" />
        </el-form-item>

        <div class="auth-actions">
          <el-button type="primary" native-type="submit" :loading="userStore.loading" block>
            {{ isLogin ? '立即登入' : '確認註冊' }}
          </el-button>
          
          <div class="auth-toggle">
            <span v-if="isLogin">還沒有帳號？ <a @click="isLogin = false">立即註冊</a></span>
            <span v-else>已有帳號？ <a @click="isLogin = true">立即登入</a></span>
          </div>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import { ElMessage } from 'element-plus';
import { Dribbble } from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();
const isLogin = ref(true);

const form = reactive({
  username: '',
  name: '',
  email: '',
  password: '',
  phoneNumber: ''
});

const handleSubmit = async () => {
  if (isLogin.value) {
    const success = await userStore.login(form.username, form.password);
    if (success) {
      ElMessage.success('歡迎回來！ (Welcome back!)');
      router.push('/');
    }
  } else {
    const success = await userStore.register(form);
    if (success) {
      ElMessage.success('註冊成功！請登入 (Registration success, please login)');
      isLogin.value = true;
    }
  }
};
</script>

<style scoped>
.auth-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 使用本地 NBA 主題圖片背景，並加上深色遮罩確保文字清晰 */
  background-image: linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)), 
                    url('/nbabg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.auth-card {
  width: 90%;
  max-width: 400px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  margin: 20px;
}

.auth-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.logo-wrapper {
  width: 64px;
  height: 64px;
  background: #eff6ff;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: #2563eb;
}

.auth-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
}

.auth-actions {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-toggle {
  text-align: center;
  font-size: 0.9rem;
  color: #64748b;
}

.auth-toggle a {
  color: #3b82f6;
  cursor: pointer;
  font-weight: 600;
}

.auth-toggle a:hover {
  text-decoration: underline;
}
</style>
