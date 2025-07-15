<template>
  <v-app>
    <div class="auth-wrapper">
      <!-- Right Panel - Auth Form -->
      <div class="auth-panel">
        <div class="auth-container">
          <div class="auth-header">
            <img src="/icons/logo.svg" alt="AKADEMEDYA" class="auth-logo" ><h2 class="auth-title">AKADEMEDYA</h2></img>
            
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
                      @click:append-inner="showPassword.login = !showPassword.login"
                    />

                    <v-btn
                      type="submit"
                      color="primary"
                      size="large"
                      block
                      :loading="loading.login"
                      :disabled="loading.login"
                      class="mb-4"
                      elevation="2"
                    >
                      Giriş Yap
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
                      :loading="loading.register"
                      :disabled="loading.register"
                      elevation="2"
                    >
                      Hesap Oluştur
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

// Router
const router = useRouter()

// Reactive Data
const currentTab = ref('login')
const showForgotPassword = ref(false)
const forgotPasswordEmail = ref('')

const showPassword = reactive({
  login: false,
  register: false,
  confirmPassword: false,
})

const loading = reactive({
  login: false,
  register: false,
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

// Validation Rules
const rules = {
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
    return value === registerData.password || 'Şifreler eşleşmiyor'
  },
}

// Methods
const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
  alert.type = type
  alert.message = message
  alert.show = true
}

const hideAlert = () => {
  alert.show = false
}

const handleLogin = async () => {
  const { valid } = await loginForm.value.validate()
  if (!valid) return

  loading.login = true
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    showAlert('success', 'Giriş başarılı!')

    // Redirect to dashboard
    setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
  } catch (error: any) {
    console.error('Login error:', error)
    showAlert('error', 'Giriş başarısız!')
  } finally {
    loading.login = false
  }
}

const handleRegister = async () => {
  const { valid } = await registerForm.value.validate()
  if (!valid) return

  loading.register = true
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    showAlert('success', 'Kayıt başarılı! E-posta doğrulama linkini kontrol ediniz.')
    currentTab.value = 'login'

    // Clear form
    Object.keys(registerData).forEach((key) => {
      registerData[key as keyof typeof registerData] = ''
    })
    registerForm.value.reset()
  } catch (error: any) {
    console.error('Register error:', error)
    showAlert('error', 'Kayıt başarısız!')
  } finally {
    loading.register = false
  }
}
</script>

<style scoped>
.auth-wrapper {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Branding Panel */
.branding-panel {
  flex: 1;
  background: linear-gradient(135deg, rgba(0, 75, 133, 0.95) 0%, rgba(102, 126, 234, 0.95) 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem 2rem;
  color: white;
  position: relative;
}

.branding-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.branding-content {
  max-width: 400px;
  text-align: center;
  z-index: 1;
}

.logo-container {
  margin-bottom: 3rem;
}

.main-logo {
  width: 120px;
  height: 120px;
  margin-bottom: 1.5rem;
  filter: brightness(0) invert(1);
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.company-name {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.company-tagline {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 0;
  letter-spacing: 1px;
}

.features-list {
  margin-bottom: 3rem;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  text-align: left;
}

.feature-item .v-icon {
  margin-right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem;
  border-radius: 50%;
}

.feature-text h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.feature-text p {
  font-size: 0.9rem;
  opacity: 0.8;
  margin: 0;
}

.company-info {
  opacity: 0.7;
  font-size: 0.9rem;
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
}

.auth-container {
  width: 100%;
  max-width: 450px;
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
  min-height: 400px;
}

.auth-card {
  background: transparent;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .branding-panel {
    display: none;
  }

  .auth-panel {
    flex: none;
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .auth-container {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 2rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }
}

@media (max-width: 600px) {
  .auth-panel {
    padding: 1rem;
  }

  .auth-container {
    padding: 1.5rem;
  }

  .company-name {
    font-size: 2rem;
  }

  .main-logo {
    width: 80px;
    height: 80px;
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

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
