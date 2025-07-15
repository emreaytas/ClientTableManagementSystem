<template>
  <v-app>
    <div class="auth-wrapper">
      <!-- Right Panel - Auth Form -->
      <div class="auth-panel">
        <div class="auth-container">
          <div class="auth-header">
            <img src="/icons/logo.svg" alt="AKADEMEDYA" class="auth-logo" />
            <h2 class="auth-title">AKADEMEDYA</h2>
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
                      class="mb-2"
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
                      class="mb-3"
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
                      class="mt-2"
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
                      <v-col cols="6">
                        <v-text-field
                          v-model="registerData.firstName"
                          label="Ad"
                          prepend-inner-icon="mdi-account"
                          variant="outlined"
                          :rules="[rules.required]"
                          hide-details="auto"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="registerData.lastName"
                          label="Soyad"
                          variant="outlined"
                          :rules="[rules.required]"
                          hide-details="auto"
                        />
                      </v-col>
                    </v-row>

                    <v-text-field
                      v-model="registerData.email"
                      label="E-posta"
                      prepend-inner-icon="mdi-email"
                      variant="outlined"
                      :rules="[rules.required, rules.email]"
                      class="mb-4"
                      hide-details="auto"
                    />

                    <v-text-field
                      v-model="registerData.userName"
                      label="Kullanıcı Adı"
                      prepend-inner-icon="mdi-account-circle"
                      variant="outlined"
                      :rules="[rules.required, rules.minLength]"
                      class="mb-4"
                      hide-details="auto"
                    />

                    <v-text-field
                      v-model="registerData.password"
                      :type="showPassword.register ? 'text' : 'password'"
                      label="Şifre"
                      prepend-inner-icon="mdi-lock"
                      :append-inner-icon="showPassword.register ? 'mdi-eye' : 'mdi-eye-off'"
                      variant="outlined"
                      :rules="[rules.required, rules.password]"
                      class="mb-4"
                      hide-details="auto"
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
                      class="mb-4"
                      hide-details="auto"
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
      </div>
    </div>
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
const loginForm = ref()
const registerForm = ref()

// Computed validation rules
const rules = computed(() => ({
  required: (value: string) => !!value || 'Bu alan zorunludur',
  email: (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Geçerli bir e-posta adresi giriniz'
  },
  minLength: (value: string) => value.length >= 3 || 'En az 3 karakter olmalıdır',
  password: (value: string) => {
    if (!value) return 'Şifre zorunludur'
    if (value.length < 6) return 'Şifre en az 6 karakter olmalıdır'
    return true
  },
  passwordMatch: (value: string) => {
    // Şifre tekrarı boşsa ve ana şifre de boşsa sorun yok
    if (!value && !registerData.password) return true
    // Şifre tekrarı boşsa ama ana şifre doluysa hata ver
    if (!value && registerData.password) return 'Şifre tekrarı zorunludur'
    // Ana şifre boşsa ama şifre tekrarı doluysa bekle
    if (value && !registerData.password) return true
    // İkisi de doluysa karşılaştır
    if (value && registerData.password) {
      return value === registerData.password || 'Şifreler eşleşmiyor'
    }
    return true
  },
}))

// Methods
const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
  alert.type = type
  alert.message = message
  alert.show = true

  // Auto hide after 5 seconds
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

      // Redirect logic
      const redirectPath = (route.query.redirect as string) || '/dashboard'

      setTimeout(() => {
        router.push(redirectPath)
      }, 1000)
    } else {
      showAlert('error', response.message || 'Giriş başarısız!')
    }
  } catch (error: any) {
    console.error('Login error:', error)
    showAlert('error', 'Giriş yapılırken bir hata oluştu')
  }
}

const handleRegister = async () => {
  // Manual validation for password match
  if (registerData.password !== registerData.confirmPassword) {
    showAlert('error', 'Şifreler eşleşmiyor!')
    return
  }

  const { valid } = await registerForm.value.validate()
  if (!valid) return

  try {
    const response = await authStore.register({
      firstName: registerData.firstName.trim(),
      lastName: registerData.lastName.trim(),
      email: registerData.email.trim().toLowerCase(),
      userName: registerData.userName.trim(),
      password: registerData.password,
    })

    if (response.success) {
      showAlert(
        'success',
        response.message || 'Kayıt başarılı! E-posta doğrulama linkini kontrol ediniz.',
      )

      // Switch to login tab
      currentTab.value = 'login'

      // Clear form
      Object.keys(registerData).forEach((key) => {
        registerData[key as keyof typeof registerData] = ''
      })
      registerForm.value?.reset()
    } else {
      showAlert('error', response.message || 'Kayıt başarısız!')
    }
  } catch (error: any) {
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
/* SCROLLBAR TAMAMEN KALDIRMA */

/* Global scroll kaldırma */
html,
body {
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

/* Vuetify app ayarları */
.v-application {
  overflow: hidden !important;
}

/* Tüm scrollbar'ları tamamen gizle */
::-webkit-scrollbar {
  display: none !important;
  width: 0px !important;
  height: 0px !important;
  background: transparent !important;
}

::-webkit-scrollbar-track {
  display: none !important;
  background: transparent !important;
}

::-webkit-scrollbar-thumb {
  display: none !important;
  background: transparent !important;
}

::-webkit-scrollbar-corner {
  display: none !important;
  background: transparent !important;
}

/* Firefox */
* {
  scrollbar-width: none !important;
}

/* IE/Edge */
* {
  -ms-overflow-style: none !important;
}

.auth-wrapper {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden !important;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box;
}

/* Auth Panel */
.auth-panel {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  overflow: hidden !important;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.auth-container {
  width: 100%;
  max-width: 450px;
  max-height: 85vh;
  overflow: hidden !important;
  box-sizing: border-box;
}

/* Container için scrollbar tamamen kaldır */
.auth-container::-webkit-scrollbar {
  display: none !important;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.auth-title {
  font-size: 2rem;
  font-weight: 700;
  color: #004b85;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.auth-tabs {
  margin-bottom: 2rem;
}

.tab-button {
  font-weight: 600;
  text-transform: none;
}

.auth-forms {
  min-height: 300px;
  overflow: hidden !important;
}

.auth-card {
  background: transparent;
  overflow: hidden !important;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .auth-panel {
    flex: none;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    overflow: hidden !important;
  }

  .auth-container {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 2rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    overflow: hidden !important;
  }
}

@media (max-width: 600px) {
  .auth-panel {
    padding: 1rem;
    overflow: hidden !important;
  }

  .auth-container {
    padding: 1.5rem;
    overflow: hidden !important;
  }

  .auth-title {
    font-size: 1.8rem;
  }

  .auth-logo {
    width: 60px;
    height: 60px;
  }
}

/* Form Styling */
.v-text-field {
  margin-bottom: 1rem;
}

.v-btn {
  text-transform: none;
  font-weight: 600;
}

/* Tüm elementler için scrollbar kaldırma */
div,
section,
article,
aside,
nav,
main,
header,
footer,
.v-card,
.v-card-text,
.v-form,
.v-tabs-window,
.v-tabs-window-item {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

div::-webkit-scrollbar,
section::-webkit-scrollbar,
article::-webkit-scrollbar,
.v-card::-webkit-scrollbar,
.v-card-text::-webkit-scrollbar,
.v-form::-webkit-scrollbar,
.v-tabs-window::-webkit-scrollbar,
.v-tabs-window-item::-webkit-scrollbar {
  display: none !important;
  width: 0px !important;
  background: transparent !important;
}

/* Vuetify specific scrollbar kaldırma */
.v-application--wrap {
  overflow: hidden !important;
}

.v-main {
  overflow: hidden !important;
}
</style>
