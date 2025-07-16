<template>
  <v-app>
    <v-row no-gutters class="auth-wrapper">
      <!-- Left Panel: Branding -->
      <v-col cols="12" md="7" class="left-panel d-none d-md-flex">
        <div class="left-panel-content">
          <img src="/icons/logo.svg" alt="AKADEMEDYA" class="brand-logo" />
          <h1 class="welcome-title">AKADEMEDYA TABLO YÖNETİM SİSTEMİ</h1>
          <p class="welcome-subtitle"></p>
        </div>
      </v-col>

      <!-- Right Panel: Auth Form -->
      <v-col cols="12" md="5" class="right-panel">
        <div class="auth-container">
          <div class="auth-header">
            <h2 class="auth-title">Giriş yapın ya da kaydolun</h2>
          </div>

          <v-tabs v-model="currentTab" color="primary" class="auth-tabs" centered>
            <v-tab value="login" class="tab-button">
              <v-icon left>mdi-login</v-icon>
              Giriş Yap
            </v-tab>
            <v-tab value="register" class="tab-button">
              <v-icon left>mdi-account-plus</v-icon>
              Kaydol
            </v-tab>
          </v-tabs>

          <v-alert
            v-if="alert.show"
            :type="alert.type"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="hideAlert"
          >
            {{ alert.message }}
          </v-alert>

          <v-tabs-window v-model="currentTab" class="auth-forms">
            <!-- Login Form -->
            <v-tabs-window-item value="login">
              <v-card flat class="auth-card">
                <v-card-text>
                  <v-form ref="loginForm" @submit.prevent="handleLogin">
                    <v-text-field
                      v-model="loginData.userName"
                      label="Kullanıcı Adı"
                      prepend-inner-icon="mdi-account"
                      variant="outlined"
                      :rules="[rules.required]"
                      class="mb-4"
                      hide-details="auto"
                      density="compact"
                    />

                    <v-text-field
                      v-model="loginData.password"
                      :type="showPassword.login ? 'text' : 'password'"
                      label="Şifre"
                      prepend-inner-icon="mdi-lock"
                      :append-inner-icon="showPassword.login ? 'mdi-eye' : 'mdi-eye-off'"
                      variant="outlined"
                      :rules="[rules.required]"
                      class="mb-4"
                      hide-details="auto"
                      density="compact"
                      @click:append-inner="showPassword.login = !showPassword.login"
                    />

                    <v-btn
                      type="submit"
                      color="primary"
                      size="large"
                      block
                      :loading="authStore.loading"
                      :disabled="authStore.loading"
                      class="mt-4"
                      elevation="2"
                    >
                      {{ authStore.loading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
                    </v-btn>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-tabs-window-item>

            <!-- Register Form -->
            <v-tabs-window-item value="register">
              <v-card flat class="auth-card">
                <v-card-text>
                  <v-form ref="registerForm" @submit.prevent="handleRegister">
                    <v-row>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="registerData.firstName"
                          label="Ad"
                          prepend-inner-icon="mdi-account"
                          variant="outlined"
                          :rules="[rules.required]"
                          hide-details="auto"
                          density="compact"
                        />
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="registerData.lastName"
                          label="Soyad"
                          variant="outlined"
                          :rules="[rules.required]"
                          hide-details="auto"
                          density="compact"
                        />
                      </v-col>
                    </v-row>

                    <v-text-field
                      v-model="registerData.email"
                      label="E-posta"
                      prepend-inner-icon="mdi-email"
                      variant="outlined"
                      :rules="[rules.required, rules.email]"
                      class="mt-4"
                      hide-details="auto"
                      density="compact"
                    />

                    <v-text-field
                      v-model="registerData.userName"
                      label="Kullanıcı Adı"
                      prepend-inner-icon="mdi-account-circle"
                      variant="outlined"
                      :rules="[rules.required, rules.minLength]"
                      class="mt-4"
                      hide-details="auto"
                      density="compact"
                    />

                    <v-text-field
                      v-model="registerData.password"
                      :type="showPassword.register ? 'text' : 'password'"
                      label="Şifre"
                      prepend-inner-icon="mdi-lock"
                      :append-inner-icon="showPassword.register ? 'mdi-eye' : 'mdi-eye-off'"
                      variant="outlined"
                      :rules="[rules.required, rules.password]"
                      class="mt-4"
                      hide-details="auto"
                      density="compact"
                      @click:append-inner="showPassword.register = !showPassword.register"
                    />

                    <v-text-field
                      v-model="registerData.confirmPassword"
                      :type="showPassword.confirmPassword ? 'text' : 'password'"
                      label="Şifre Tekrar"
                      prepend-inner-icon="mdi-lock-check"
                      :append-inner-icon="showPassword.confirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      variant="outlined"
                      :rules="[rules.required, rules.passwordMatch]"
                      class="mt-4"
                      hide-details="auto"
                      density="compact"
                      @click:append-inner="
                        showPassword.confirmPassword = !showPassword.confirmPassword
                      "
                    />

                    <v-btn
                      type="submit"
                      color="primary"
                      size="large"
                      block
                      :loading="authStore.loading"
                      :disabled="authStore.loading"
                      class="mt-4"
                      elevation="2"
                    >
                      {{ authStore.loading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur' }}
                    </v-btn>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </v-col>
    </v-row>
  </v-app>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Router
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Reactive Data
const currentTab = ref('login')

const showPassword = reactive({
  login: false,
  register: false,
  confirmPassword: false,
})

const alert = reactive({
  show: false,
  type: 'success' as 'success' | 'error' | 'warning' | 'info',
  message: '',
})

const loginData = reactive({
  userName: '',
  password: '',
})

const registerData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  userName: '',
  password: '',
  confirmPassword: '',
})

// Form References
const loginForm = ref<any>()
const registerForm = ref<any>()

// Computed validation rules
const rules = computed(() => ({
  required: (value: string) => !!value || 'Bu alan zorunludur',
  email: (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Geçerli bir e-posta adresi giriniz'
  },
  minLength: (value: string) => (value && value.length >= 3) || 'En az 3 karakter olmalıdır',
  password: (value: string) => (value && value.length >= 6) || 'Şifre en az 6 karakter olmalıdır',
  passwordMatch: (value: string) => value === registerData.password || 'Şifreler eşleşmiyor',
}))

// Methods
const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
  alert.type = type
  alert.message = message
  alert.show = true
  setTimeout(() => {
    alert.show = false
  }, 5000)
}

const hideAlert = () => {
  alert.show = false
}

const handleLogin = async () => {
  const { valid } = await loginForm.value.validate()
  if (!valid) return

  try {
    const response = await authStore.login({
      userName: loginData.userName.trim(),
      password: loginData.password,
    })
    if (response.success) {
      showAlert('success', response.message || 'Giriş başarılı!')
      const redirectPath = (route.query.redirect as string) || '/dashboard'
      setTimeout(() => router.push(redirectPath), 1000)
    } else {
      showAlert('error', response.message || 'Giriş başarısız!')
    }
  } catch (error) {
    console.error('Login error:', error)
    showAlert('error', 'Giriş yapılırken bir hata oluştu')
  }
}

const handleRegister = async () => {
  const { valid } = await registerForm.value.validate()
  if (!valid) return

  try {
    const response = await authStore.register({
      firstName: registerData.firstName.trim(),
      lastName: registerData.lastName.trim(),
      email: registerData.email.trim().toLowerCase(),
      userName: registerData.userName.trim(),
      password: registerData.password,
      confirmPassword: registerData.confirmPassword,
    })

    if (response.success) {
      showAlert('success', response.message || 'Kayıt başarılı! Lütfen e-postanızı doğrulayın.')
      currentTab.value = 'login'
      registerForm.value?.reset()
    } else {
      showAlert('error', response.message || 'Kayıt başarısız!')
    }
  } catch (error) {
    console.error('Register error:', error)
    showAlert('error', 'Kayıt olurken bir hata oluştu')
  }
}

// Check if user is already authenticated
if (authStore.isAuthenticated) {
  const redirectPath = (route.query.redirect as string) || '/dashboard'
  router.push(redirectPath)
}
</script>

<style scoped>
/* Global Styles */
.auth-wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Roboto', 'Segoe UI', sans-serif;
}

/* Left Panel (Branding) */
.left-panel {
  background: linear-gradient(135deg, #00529b 0%, #002b4f 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: white;
  padding: 3rem;
}

.brand-logo {
  width: 120px;
  height: 120px;
  margin-bottom: 2rem;
}

.welcome-title {
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.welcome-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 400px;
}

/* Right Panel (Form) */
.right-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}

.auth-container {
  width: 100%;
  max-width: 450px;
  padding: 2rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-title {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
}

.auth-tabs {
  margin-bottom: 1.5rem;
}

.tab-button {
  font-weight: 600;
  text-transform: none;
  flex: 1;
}

.auth-card {
  background: transparent;
}

.v-btn {
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 8px;
}

/* Responsive Design */
@media (max-width: 960px) {
  .right-panel {
    align-items: flex-start;
    padding-top: 4rem;
  }
  .auth-container {
    padding: 1rem;
  }
}
</style>
