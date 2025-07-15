<template>
  <v-app>
    <v-container class="email-confirmation-container fill-height">
      <v-row justify="center" align="center" class="fill-height">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="confirmation-card pa-6" elevation="12">
            <v-card-text class="text-center">
              <!-- Loading State -->
              <div v-if="status === 'loading'" class="loading-section">
                <v-progress-circular size="64" width="6" color="primary" indeterminate />
                <h3 class="mt-4 mb-2">E-posta Doğrulanıyor</h3>
                <p class="text-grey-600">Lütfen bekleyiniz...</p>
              </div>

              <!-- Success State -->
              <div v-else-if="status === 'success'" class="success-section">
                <v-icon size="80" color="success" class="mb-4">mdi-check-circle</v-icon>
                <h2 class="mb-3 text-success">Aktivasyon Tamamlandı!</h2>
                <p class="mb-4 text-grey-700">{{ message }}</p>
                <p class="mb-6 text-grey-600">Artık giriş yapabilirsiniz.</p>

                <div class="action-buttons">
                  <v-btn
                    color="success"
                    size="large"
                    block
                    @click="goToLogin"
                    prepend-icon="mdi-login"
                    elevation="2"
                  >
                    Giriş Sayfasına Git
                  </v-btn>
                </div>
              </div>

              <!-- Error State -->
              <div v-else-if="status === 'error'" class="error-section">
                <v-icon size="80" color="error" class="mb-4">mdi-alert-circle</v-icon>
                <h2 class="mb-3 text-error">Doğrulama Başarısız</h2>
                <p class="mb-4 text-grey-700">{{ message }}</p>

                <div class="action-buttons">
                  <v-btn
                    color="primary"
                    size="large"
                    block
                    @click="resendEmail"
                    prepend-icon="mdi-email-resend"
                    class="mb-3"
                    elevation="2"
                  >
                    Tekrar Gönder
                  </v-btn>

                  <v-btn
                    color="grey"
                    variant="outlined"
                    size="large"
                    block
                    @click="goToLogin"
                    prepend-icon="mdi-arrow-left"
                  >
                    Giriş Sayfasına Dön
                  </v-btn>
                </div>
              </div>

              <!-- Invalid State -->
              <div v-else-if="status === 'invalid'" class="invalid-section">
                <v-icon size="80" color="warning" class="mb-4">mdi-link-off</v-icon>
                <h2 class="mb-3 text-warning">Geçersiz Link</h2>
                <p class="mb-4 text-grey-700">
                  Doğrulama linki geçersiz veya eksik parametreler bulunuyor.
                </p>
                <p class="mb-6 text-grey-600">Lütfen doğru linki kullandığınızdan emin olun.</p>

                <div class="action-buttons">
                  <v-btn
                    color="primary"
                    size="large"
                    block
                    @click="goToLogin"
                    prepend-icon="mdi-arrow-left"
                    elevation="2"
                  >
                    Giriş Sayfasına Dön
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Resend Email Dialog -->
      <v-dialog v-model="showResendDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon class="mr-2">mdi-email-resend</v-icon>
            Doğrulama E-postası Gönder
          </v-card-title>

          <v-card-text class="pa-6">
            <p class="mb-4 text-grey-700">
              E-posta doğrulama linki göndermek için e-posta adresinizi giriniz.
            </p>

            <v-text-field
              v-model="resendEmailAddress"
              label="E-posta Adresi"
              prepend-inner-icon="mdi-email"
              variant="outlined"
              :rules="[rules.required, rules.email]"
              class="mb-4"
              hide-details="auto"
            />
          </v-card-text>

          <v-card-actions class="pa-6 pt-0">
            <v-spacer />
            <v-btn
              color="grey"
              variant="text"
              @click="showResendDialog = false"
              :disabled="resendLoading"
            >
              İptal
            </v-btn>
            <v-btn
              color="primary"
              @click="handleResendEmail"
              :loading="resendLoading"
              :disabled="resendLoading || !resendEmailAddress"
              elevation="2"
            >
              Gönder
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Toast Messages -->
      <v-snackbar v-model="showToast" :color="toastType" :timeout="5000" location="top">
        {{ toastMessage }}
        <template v-slot:actions>
          <v-btn color="white" variant="text" @click="showToast = false"> Kapat </v-btn>
        </template>
      </v-snackbar>
    </v-container>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Router ve Store
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Reactive Data
const loading = ref(false)
const status = ref<'loading' | 'success' | 'error' | 'invalid'>('loading')
const message = ref('')
const showResendDialog = ref(false)
const resendEmailAddress = ref('')
const resendLoading = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('info')

// Validation Rules
const rules = {
  required: (value: string) => !!value || 'Bu alan zorunludur',
  email: (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Geçerli bir e-posta adresi giriniz'
  },
}

// Toast helper
const showToastMessage = (type: 'success' | 'error' | 'warning' | 'info', msg: string) => {
  toastType.value = type
  toastMessage.value = msg
  showToast.value = true
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
      message.value = response.message || 'E-posta adresiniz başarıyla doğrulandı!'
      showToastMessage('success', 'Aktivasyon tamamlandı!')

      // 3 saniye sonra otomatik olarak Auth sayfasına yönlendir
      setTimeout(() => {
        goToLogin()
      }, 3000)
    } else {
      status.value = 'error'
      message.value = response.message || 'E-posta doğrulama işlemi başarısız'
      showToastMessage('error', 'Doğrulama başarısız!')
    }
  } catch (error: any) {
    console.error('Email confirmation error:', error)
    status.value = 'error'
    message.value = error.message || 'E-posta doğrulama işlemi başarısız'
    showToastMessage('error', 'Bir hata oluştu!')
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  showToastMessage('info', 'Giriş sayfasına yönlendiriliyorsunuz...')
  setTimeout(() => {
    router.push('/auth')
  }, 1000)
}

const resendEmail = () => {
  const email = route.query.email as string
  if (email) {
    resendEmailAddress.value = email
  }
  showResendDialog.value = true
}

const handleResendEmail = async () => {
  if (!resendEmailAddress.value) {
    showToastMessage('warning', 'E-posta adresi gereklidir')
    return
  }

  try {
    resendLoading.value = true

    // API call to resend email verification
    const response = await authStore.resendEmailConfirmation(resendEmailAddress.value)

    if (response.success) {
      showToastMessage('success', 'Doğrulama e-postası tekrar gönderildi')
      showResendDialog.value = false
      resendEmailAddress.value = ''
    } else {
      showToastMessage('error', response.message || 'E-posta gönderme işlemi başarısız')
    }
  } catch (error: any) {
    console.error('Resend email error:', error)
    showToastMessage('error', error.message || 'E-posta gönderme işlemi başarısız')
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
    showToastMessage('success', 'Aktivasyon tamamlandı!')

    // 3 saniye sonra otomatik olarak Auth sayfasına yönlendir
    setTimeout(() => {
      goToLogin()
    }, 3000)
  } else if (success === 'false') {
    status.value = 'error'
    message.value = urlMessage || 'E-posta doğrulama işlemi başarısız'
    loading.value = false
    showToastMessage('error', 'Doğrulama başarısız!')
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
  background: rgba(255, 255, 255, 0.95);
}

.fill-height {
  min-height: calc(100vh - 40px);
}

.loading-section,
.success-section,
.error-section,
.invalid-section {
  min-height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.action-buttons {
  width: 100%;
  max-width: 300px;
}

/* Success animasyonu */
.success-section .v-icon {
  animation: successPulse 2s ease-in-out infinite;
}

@keyframes successPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* Error animasyonu */
.error-section .v-icon {
  animation: errorShake 0.5s ease-in-out;
}

@keyframes errorShake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

/* Responsive Design */
@media (max-width: 600px) {
  .email-confirmation-container {
    padding: 10px;
  }

  .confirmation-card {
    margin: 0;
  }

  .loading-section,
  .success-section,
  .error-section,
  .invalid-section {
    min-height: 200px;
    padding: 20px 10px;
  }
}
</style>
