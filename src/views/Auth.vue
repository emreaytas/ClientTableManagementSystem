<template>
  <v-app>
    <v-row no-gutters class="auth-wrapper">
      <v-col cols="12" md="7" class="left-panel d-none d-md-flex">
        <div class="left-panel-content">
          <img src="/icons/logo.svg" alt="AKADEMEDYA" class="brand-logo" />
          <h1 class="welcome-title">AKADEMEDYA TABLO YÖNETİM SİSTEMİ</h1>
          <h2 class="welcome-title2">AKADEMEDYA TABLE MANAGEMENT SYSTEM</h2>
          <p class="welcome-subtitle"></p>
        </div>
      </v-col>

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
                      :loading="usernameCheck.loading"
                      :error-messages="usernameCheck.error"
                      :success-messages="usernameCheck.success"
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
                      :loading="emailCheck.loading"
                      :error-messages="emailCheck.error"
                      :success-messages="emailCheck.success"
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
                      :loading="usernameCheck.loading"
                      :error-messages="usernameCheck.error"
                      :success-messages="usernameCheck.success"
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
import { ref, reactive, computed, watch } from 'vue' // watch eklendi
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios' // axios veya kullandığınız http istemcisini import edin

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

// --- YENİ EKLENEN ANLIK KONTROL MANTIĞI ---

// Anlık validasyon durumlarını tutmak için reaktif nesneler
const usernameCheck = reactive({
  loading: false,
  error: '',
  success: '',
})

const emailCheck = reactive({
  loading: false,
  error: '',
  success: '',
})

let debounceTimer: number

// Kullanıcı adı ve e-posta alanlarındaki değişiklikleri izle
watch([() => loginData.userName, () => registerData.userName], ([loginUser, registerUser]) => {
  const newUsername = currentTab.value === 'login' ? loginUser : registerUser

  clearTimeout(debounceTimer)
  usernameCheck.error = ''
  usernameCheck.success = ''

  if (!newUsername || newUsername.length < 3) {
    return // 3 karakterden kısaysa kontrol etme
  }

  usernameCheck.loading = true
  debounceTimer = setTimeout(async () => {
    try {
      const response = await axios.get(`/api/auth/check-username/${newUsername}`)
      if (currentTab.value === 'login') {
        // Giriş formunda, kullanıcının OLMAMASI bir hatadır.
        if (!response.data.isTaken) {
          usernameCheck.error = 'Böyle bir kullanıcı bulunamadı.'
        } else {
          usernameCheck.success = 'Kullanıcı adı geçerli.'
        }
      } else {
        // Register form
        // Kayıt formunda, kullanıcının ZATEN VAR OLMASI bir hatadır.
        if (response.data.isTaken) {
          usernameCheck.error = 'Bu kullanıcı adı zaten kullanılıyor.'
        } else {
          usernameCheck.success = 'Kullanıcı adı uygun.'
        }
      }
    } catch (err) {
      console.error('Kullanıcı adı kontrol hatası:', err)
      usernameCheck.error = 'Kontrol sırasında bir hata oluştu.'
    } finally {
      usernameCheck.loading = false
    }
  }, 500) // Kullanıcı yazmayı bıraktıktan 500ms sonra kontrol et
})

watch(
  () => registerData.email,
  (newEmail) => {
    clearTimeout(debounceTimer)
    emailCheck.error = ''
    emailCheck.success = ''

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!newEmail || !emailPattern.test(newEmail)) return

    emailCheck.loading = true
    debounceTimer = setTimeout(async () => {
      try {
        const encodedEmail = encodeURIComponent(newEmail)
        const response = await axios.get(`/api/auth/check-email/${encodedEmail}`)
        if (response.data.isTaken) {
          emailCheck.error = 'Bu e-posta adresi zaten kullanılıyor.'
        } else {
          emailCheck.success = 'E-posta adresi uygun.'
        }
      } catch (err) {
        console.error('E-posta kontrol hatası:', err)
        emailCheck.error = 'Kontrol sırasında bir hata oluştu.'
      } finally {
        emailCheck.loading = false
      }
    }, 500)
  },
)

// Sekme değiştirildiğinde validasyon mesajlarını temizle
watch(
  () => currentTab.value,
  () => {
    usernameCheck.error = ''
    usernameCheck.success = ''
    emailCheck.error = ''
    emailCheck.success = ''
    // Formlardaki verileri de temizleyebilirsiniz (isteğe bağlı)
    // Object.assign(loginData, { userName: '', password: '' });
    // Object.assign(registerData, { /* ... */ });
  },
)

// --- ANLIK KONTROL MANTIĞI SONU ---

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
  // Anlık validasyon hatası varsa formu gönderme
  if (usernameCheck.error) {
    showAlert('error', usernameCheck.error)
    return
  }
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
  // Anlık validasyon hatası varsa formu gönderme
  if (usernameCheck.error || emailCheck.error) {
    showAlert('error', 'Lütfen formdaki hataları düzeltin.')
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

.welcome-title2 {
  font-size: 1.3rem;
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
