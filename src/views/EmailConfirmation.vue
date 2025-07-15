<template>
  <v-container fluid class="email-confirmation-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="confirmation-card elevation-12" rounded="lg">
          <v-card-text class="text-center pa-8">
            <!-- Loading State -->
            <div v-if="loading" class="loading-section">
              <v-progress-circular
                indeterminate
                color="primary"
                size="64"
                class="mb-4"
              ></v-progress-circular>
              <h2 class="text-h5 mb-2">E-posta Doğrulanıyor...</h2>
              <p class="text-body-1 text--secondary">
                Lütfen bekleyiniz, e-posta adresiniz doğrulanıyor.
              </p>
            </div>

            <!-- Success State -->
            <div v-else-if="status === 'success'" class="success-section">
              <v-icon color="success" size="80" class="mb-4"> mdi-check-circle </v-icon>
              <h2 class="text-h5 mb-2 success--text">E-posta Doğrulandı!</h2>
              <p class="text-body-1 text--secondary mb-4">
                {{
                  message ||
                  'E-posta adresiniz başarıyla doğrulandı. Artık sisteme giriş yapabilirsiniz.'
                }}
              </p>
              <v-btn color="primary" size="large" @click="goToLogin" prepend-icon="mdi-login">
                Giriş Yap
              </v-btn>
            </div>

            <!-- Error State -->
            <div v-else-if="status === 'error'" class="error-section">
              <v-icon color="error" size="80" class="mb-4"> mdi-alert-circle </v-icon>
              <h2 class="text-h5 mb-2 error--text">Doğrulama Başarısız</h2>
              <p class="text-body-1 text--secondary mb-4">
                {{
                  message ||
                  'E-posta doğrulama işlemi başarısız oldu. Link geçersiz veya süresi dolmuş olabilir.'
                }}
              </p>
              <div class="action-buttons">
                <v-btn
                  color="primary"
                  variant="outlined"
                  class="mb-2"
                  @click="resendEmail"
                  :loading="resendLoading"
                  :disabled="resendLoading"
                  prepend-icon="mdi-email-send"
                  block
                >
                  Doğrulama E-postası Gönder
                </v-btn>
                <v-btn
                  color="grey"
                  variant="text"
                  @click="goToLogin"
                  prepend-icon="mdi-arrow-left"
                  block
                >
                  Giriş Sayfasına Dön
                </v-btn>
              </div>
            </div>

            <!-- Invalid Link State -->
            <div v-else class="invalid-section">
              <v-icon color="warning" size="80" class="mb-4"> mdi-link-off </v-icon>
              <h2 class="text-h5 mb-2 warning--text">Geçersiz Link</h2>
              <p class="text-body-1 text--secondary mb-4">
                E-posta doğrulama linki geçersiz. Lütfen doğru linki kullandığınızdan emin olun.
              </p>
              <v-btn color="primary" @click="goToLogin" prepend-icon="mdi-arrow-left">
                Giriş Sayfasına Dön
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Resend Email Dialog -->
    <v-dialog v-model="showResendDialog" max-width="400">
      <v-card>
        <v-card-title>
          <span class="text-h6">Doğrulama E-postası Gönder</span>
        </v-card-title>
        <v-card-text>
          <p class="mb-4">E-posta doğrulama linki göndermek için e-posta adresinizi giriniz.</p>
          <v-text-field
            v-model="resendEmail"
            label="E-posta Adresi"
            prepend-inner-icon="mdi-email"
            variant="outlined"
            :rules="[rules.required, rules.email]"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showResendDialog = false"> İptal </v-btn>
          <v-btn
            color="primary"
            @click="handleResendEmail"
            :loading="resendLoading"
            :disabled="resendLoading"
          >
            Gönder
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// Router ve Store
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Reactive Data
const loading = ref(false)
const status = ref<'loading' | 'success' | 'error' | 'invalid'>('loading')
const message = ref('')
const showResendDialog = ref(false)
const resendEmail = ref('')
const resendLoading = ref(false)

// Validation Rules
const rules = {
  required: (value: string) => !!value || 'Bu alan zorunludur',
  email: (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Geçerli bir e-posta adresi giriniz'
  },
}

// Methods
const confirmEmail = async () => {
  const token = route.query.token as string
  const email = route.query.email as string

  if (!token || !email) {
    status.value = 'invalid'
    loading.value = false
    return
  }

  try {
    loading.value = true
    const response = await authStore.confirmEmail(token, email)

    if (response.success) {
      status.value = 'success'
      message.value = response.message
      toast.success('E-posta adresiniz başarıyla doğrulandı!')
    } else {
      status.value = 'error'
      message.value = response.message
    }
  } catch (error: any) {
    console.error('Email confirmation error:', error)
    status.value = 'error'
    message.value = error.message || 'E-posta doğrulama işlemi başarısız'
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/auth')
}

const resendEmail = () => {
  const email = route.query.email as string
  if (email) {
    resendEmail.value = email
  }
  showResendDialog.value = true
}

const handleResendEmail = async () => {
  if (!resendEmail.value) {
    toast.warning('E-posta adresi gereklidir')
    return
  }

  try {
    resendLoading.value = true
    // API call to resend email verification
    // await authStore.resendEmailVerification(resendEmail.value)

    toast.success('Doğrulama e-postası tekrar gönderildi')
    showResendDialog.value = false
    resendEmail.value = ''
  } catch (error: any) {
    console.error('Resend email error:', error)
    toast.error(error.message || 'E-posta gönderme işlemi başarısız')
  } finally {
    resendLoading.value = false
  }
}

// URL'den success ve message parametrelerini kontrol et (backend redirect'i için)
const checkUrlParams = () => {
  const success = route.query.success as string
  const urlMessage = route.query.message as string

  if (success === 'true') {
    status.value = 'success'
    message.value = urlMessage || 'E-posta adresiniz başarıyla doğrulandı!'
    loading.value = false
  } else if (success === 'false') {
    status.value = 'error'
    message.value = urlMessage || 'E-posta doğrulama işlemi başarısız'
    loading.value = false
  } else {
    // Normal email confirmation flow
    confirmEmail()
  }
}

onMounted(() => {
  checkUrlParams()
})
</script>

<style scoped>
.email-confirmation-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.confirmation-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.fill-height {
  min-height: calc(100vh - 40px);
}

.loading-section,
.success-section,
.error-section,
.invalid-section {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.action-buttons {
  width: 100%;
  max-width: 300px;
}

/* Responsive Design */
@media (max-width: 600px) {
  .email-confirmation-container {
    padding: 10px;
  }

  .confirmation-card {
    margin: 0;
  }
}
</style>
