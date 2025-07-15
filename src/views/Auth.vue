<template>
  <v-container fluid class="auth-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <v-card class="auth-card elevation-12" rounded="lg">
          <!-- Logo ve Başlık -->
          <v-card-title class="text-center pa-6">
            <div class="logo-section">
              <v-icon size="48" color="primary" class="mb-2"> mdi-table-large </v-icon>
              <h1 class="text-h4 font-weight-bold primary--text">AKADEMEDYA</h1>
              <p class="text-subtitle-1 text--secondary mt-2">Tablo Yönetim Sistemi</p>
            </div>
          </v-card-title>

          <v-card-text class="px-6 pb-6">
            <!-- Tab Buttons -->
            <v-tabs
              v-model="currentTab"
              bg-color="grey-lighten-4"
              color="primary"
              grow
              rounded="lg"
              class="mb-6"
            >
              <v-tab value="login">
                <v-icon left>mdi-login</v-icon>
                Giriş Yap
              </v-tab>
              <v-tab value="register">
                <v-icon left>mdi-account-plus</v-icon>
                Kaydol
              </v-tab>
            </v-tabs>

            <!-- Alert Messages -->
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

            <v-tabs-window v-model="currentTab">
              <!-- Giriş Formu -->
              <v-tabs-window-item value="login">
                <v-form ref="loginForm" @submit.prevent="handleLogin">
                  <v-text-field
                    v-model="loginData.userName"
                    label="Kullanıcı Adı"
                    prepend-inner-icon="mdi-account"
                    variant="outlined"
                    :rules="[rules.required]"
                    class="mb-3"
                    autofocus
                  ></v-text-field>

                  <v-text-field
                    v-model="loginData.password"
                    :type="showPassword.login ? 'text' : 'password'"
                    label="Şifre"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword.login ? 'mdi-eye' : 'mdi-eye-off'"
                    variant="outlined"
                    :rules="[rules.required]"
                    class="mb-3"
                    @click:append-inner="showPassword.login = !showPassword.login"
                  ></v-text-field>

                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    :loading="loading.login"
                    :disabled="loading.login"
                    class="mb-3"
                  >
                    Giriş Yap
                  </v-btn>
                </v-form>
              </v-tabs-window-item>

              <!-- Kayıt Formu -->
              <v-tabs-window-item value="register">
                <v-form ref="registerForm" @submit.prevent="handleRegister">
                  <v-row>
                    <v-col cols="6">
                      <v-text-field
                        v-model="registerData.firstName"
                        label="Ad"
                        prepend-inner-icon="mdi-account"
                        variant="outlined"
                        :rules="[rules.required]"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="registerData.lastName"
                        label="Soyad"
                        variant="outlined"
                        :rules="[rules.required]"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-text-field
                    v-model="registerData.email"
                    label="E-posta"
                    prepend-inner-icon="mdi-email"
                    variant="outlined"
                    :rules="[rules.required, rules.email]"
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model="registerData.userName"
                    label="Kullanıcı Adı"
                    prepend-inner-icon="mdi-account-circle"
                    variant="outlined"
                    :rules="[rules.required, rules.minLength]"
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model="registerData.password"
                    :type="showPassword.register ? 'text' : 'password'"
                    label="Şifre"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword.register ? 'mdi-eye' : 'mdi-eye-off'"
                    variant="outlined"
                    :rules="[rules.required, rules.password]"
                    class="mb-3"
                    @click:append-inner="showPassword.register = !showPassword.register"
                  ></v-text-field>

                  <v-text-field
                    v-model="registerData.confirmPassword"
                    :type="showPassword.confirmPassword ? 'text' : 'password'"
                    label="Şifre Tekrar"
                    prepend-inner-icon="mdi-lock-check"
                    :append-inner-icon="showPassword.confirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    variant="outlined"
                    :rules="[rules.required, rules.passwordMatch]"
                    class="mb-3"
                    @click:append-inner="
                      showPassword.confirmPassword = !showPassword.confirmPassword
                    "
                  ></v-text-field>

                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    :loading="loading.register"
                    :disabled="loading.register"
                  >
                    Kayıt Ol
                  </v-btn>
                </v-form>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Şifremi Unuttum Dialog -->
    <v-dialog v-model="showForgotPassword" max-width="400">
      <v-card>
        <v-card-title>Şifremi Unuttum</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="forgotPasswordEmail"
            label="E-posta Adresiniz"
            prepend-inner-icon="mdi-email"
            variant="outlined"
            :rules="[rules.required, rules.email]"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="showForgotPassword = false"> İptal </v-btn>
          <v-btn color="primary" @click="handleForgotPassword"> Gönder </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// Store ve Router
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

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
    const response = await authStore.login({
      userName: loginData.userName,
      password: loginData.password,
    })

    if (response.success) {
      toast.success('Giriş başarılı!')
      router.push('/dashboard')
    } else {
      showAlert('error', response.message || 'Giriş başarısız!')
    }
  } catch (error: any) {
    console.error('Login error:', error)
    showAlert('error', error.message || 'Giriş sırasında bir hata oluştu')
  } finally {
    loading.login = false
  }
}

const handleRegister = async () => {
  const { valid } = await registerForm.value.validate()
  if (!valid) return

  loading.register = true
  try {
    const response = await authStore.register({
      firstName: registerData.firstName,
      lastName: registerData.lastName,
      email: registerData.email,
      userName: registerData.userName,
      password: registerData.password,
    })

    if (response.success) {
      showAlert(
        'success',
        response.message || 'Kayıt başarılı! E-posta doğrulama linkini kontrol ediniz.',
      )
      currentTab.value = 'login'
      // Form verilerini temizle
      Object.keys(registerData).forEach((key) => {
        registerData[key as keyof typeof registerData] = ''
      })
      registerForm.value.reset()
    } else {
      showAlert('error', response.message || 'Kayıt başarısız!')
    }
  } catch (error: any) {
    console.error('Register error:', error)
    showAlert('error', error.message || 'Kayıt sırasında bir hata oluştu')
  } finally {
    loading.register = false
  }
}

const handleForgotPassword = async () => {
  if (!forgotPasswordEmail.value) {
    showAlert('warning', 'E-posta adresi gereklidir')
    return
  }

  try {
    // Şifremi unuttum API çağrısı burada yapılacak
    toast.info('Şifre sıfırlama linki e-posta adresinize gönderildi')
    showForgotPassword.value = false
    forgotPasswordEmail.value = ''
  } catch (error: any) {
    showAlert('error', 'Şifre sıfırlama işlemi başarısız')
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.logo-section {
  width: 100%;
}

.fill-height {
  min-height: calc(100vh - 40px);
}

/* Responsive Design */
@media (max-width: 600px) {
  .auth-container {
    padding: 10px;
  }

  .auth-card {
    margin: 0;
  }
}
</style>
