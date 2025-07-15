<template>
  <v-container fluid class="notfound-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="5">
        <div class="text-center">
          <!-- 404 Animation -->
          <div class="error-animation mb-6">
            <div class="error-number">404</div>
            <v-icon size="120" color="primary" class="floating-icon"> mdi-table-off </v-icon>
          </div>

          <!-- Error Message -->
          <h1 class="text-h3 font-weight-bold mb-3">Sayfa Bulunamadı</h1>

          <p class="text-h6 text--secondary mb-6">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>

          <!-- Suggestions -->
          <v-card variant="outlined" class="mb-6">
            <v-card-text>
              <h3 class="text-h6 mb-3">Ne yapabilirsiniz?</h3>
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-home</v-icon>
                  </template>
                  <v-list-item-title>Ana sayfaya geri dönün</v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-table</v-icon>
                  </template>
                  <v-list-item-title>Tablolarınızı kontrol edin</v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-magnify</v-icon>
                  </template>
                  <v-list-item-title>URL'yi kontrol edin</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Action Buttons -->
          <div class="d-flex flex-column flex-sm-row justify-center gap-3">
            <v-btn color="primary" size="large" prepend-icon="mdi-home" @click="goHome">
              Ana Sayfa
            </v-btn>

            <v-btn
              color="secondary"
              size="large"
              variant="outlined"
              prepend-icon="mdi-arrow-left"
              @click="goBack"
            >
              Geri Dön
            </v-btn>

            <v-btn
              v-if="authStore.isAuthenticated"
              color="success"
              size="large"
              variant="outlined"
              prepend-icon="mdi-table"
              @click="goToTables"
            >
              Tablolarım
            </v-btn>
          </div>

          <!-- Error Code -->
          <div class="mt-8">
            <v-chip color="error" variant="tonal" size="small"> Hata Kodu: 404 - Not Found </v-chip>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Composables
const router = useRouter()
const authStore = useAuthStore()

// Methods
const goHome = () => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  } else {
    router.push('/auth')
  }
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goHome()
  }
}

const goToTables = () => {
  router.push('/tables')
}
</script>

<style scoped>
.notfound-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.fill-height {
  min-height: 100vh;
}

.error-animation {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.error-number {
  font-size: 8rem;
  font-weight: 900;
  color: transparent;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  line-height: 1;
  margin-bottom: 1rem;
}

.floating-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* Responsive Design */
@media (max-width: 600px) {
  .error-number {
    font-size: 6rem;
  }

  .floating-icon {
    font-size: 80px !important;
  }

  .d-flex.flex-column.flex-sm-row {
    gap: 12px;
  }

  .d-flex.flex-column.flex-sm-row .v-btn {
    width: 100%;
  }
}

@media (max-width: 400px) {
  .error-number {
    font-size: 4rem;
  }

  .floating-icon {
    font-size: 60px !important;
  }
}
</style>
