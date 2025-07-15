<template>
  <v-app>
    <div class="notfound-container">
      <div class="notfound-content">
        <img src="/icons/logo.svg" alt="AKADEMEDYA" class="error-logo mb-6" />

        <div class="error-code">404</div>

        <h1 class="error-title">Sayfa Bulunamadı</h1>

        <p class="error-description">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>

        <div class="error-actions">
          <v-btn color="primary" size="large" prepend-icon="mdi-home" @click="goHome" class="mr-4">
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
        </div>
      </div>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/auth')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goHome()
  }
}
</script>

<style scoped>
.notfound-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.notfound-content {
  text-align: center;
  color: white;
  max-width: 500px;
}

.error-logo {
  width: 80px;
  height: 80px;
  filter: brightness(0) invert(1);
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

.error-code {
  font-size: 8rem;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 1rem;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.error-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.error-description {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 600px) {
  .error-code {
    font-size: 5rem;
  }

  .error-title {
    font-size: 2rem;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .error-actions .v-btn {
    width: 200px;
    margin: 0.5rem 0;
  }
}
</style>
