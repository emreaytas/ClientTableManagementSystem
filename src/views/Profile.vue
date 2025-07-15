<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-6">Profil Ayarları</h1>
      </v-col>
    </v-row>

    <v-row>
      <!-- Profile Info -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text class="text-center">
            <v-avatar size="120" color="primary" class="mb-4">
              <span class="text-h2">{{ userInitials }}</span>
            </v-avatar>
            <h3 class="text-h5 mb-2">{{ authStore.fullName }}</h3>
            <p class="text-subtitle-1 text--secondary mb-3">{{ authStore.user?.email }}</p>
            <v-chip
              :color="authStore.user?.emailConfirmed ? 'success' : 'warning'"
              variant="tonal"
            >
              {{ authStore.user?.emailConfirmed ? 'E-posta Doğrulandı' : 'E-posta Doğrulanmadı' }}
            </v-chip>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title>Hesap İstatistikleri</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>Toplam Tablo</v-list-item-title>
                <v-list-item-subtitle>{{ stats.tableCount }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Toplam Kayıt</v-list-item-title>
                <v-list-item-subtitle>{{ stats.recordCount }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Üyelik Tarihi</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(authStore.user?.createdAt) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Son Giriş</v-list-item-title>
                <v-list-item-subtitle>{{ currentDate }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Profile Forms -->
      <v-col cols="12" md="8">
        <v-tabs v-model="activeTab" color="primary" class="mb-4">
          <v-tab value="personal">Kişisel Bilgiler</v-tab>
          <v-tab value="security">Güvenlik</v-tab>
          <v-tab value="preferences">Tercihler</v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab">
          <!-- Personal Information Tab -->
          <v-tabs-window-item value="personal">
            <v-card>
              <v-card-title>Kişisel Bilgiler</v-card-title>
              <v-card-text>
                <v-form ref="personalForm" @submit.prevent="updatePersonalInfo">
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="personalData.firstName"
                        label="Ad *"
                        variant="outlined"
                        :rules="[rules.required]"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="personalData.lastName"
                        label="Soyad *"
                        variant="outlined"
                        :rules="[rules.required]"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="personalData.email"
                        label="E-posta *"
                        variant="outlined"
                        :rules="[rules.required, rules.email]"
                        readonly
                      ></v-text-field>
                      <p class="text-caption text--secondary">
                        E-posta adresi değiştirilemez
                      </p>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="personalData.userName"
                        label="Kullanıcı Adı *"
                        variant="outlined"
                        :rules="[rules.required]"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <v-btn
                    type="submit"
                    color="primary"
                    :loading="personalLoading"
                    class="mt-3"
                  >
                    Bilgileri Güncelle
                  </v-btn>
                </v-form>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>

          <!-- Security Tab -->
          <v-tabs-window-item value="security">
            <v-card>
              <v-card-title>Şifre Değiştir</v-card-title>
              <v-card-text>
                <v-form ref="passwordForm" @submit.prevent="changePassword">
                  <v-text-field
                    v-model="passwordData.currentPassword"
                    :type="showPassword.current ? 'text' : 'password'"
                    label="Mevcut Şifre *"
                    variant="outlined"
                    :rules="[rules.required]"
                    :append-inner-icon="showPassword.current ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword.current = !showPassword.current"
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model="passwordData.newPassword"
                    :type="showPassword.new ? 'text' : 'password'"
                    label="Yeni Şifre *"
                    variant="outlined"
                    :rules="[rules.required, rules.password]"
                    :append-inner-icon="showPassword.new ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword.new = !showPassword.new"
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model="passwordData.confirmPassword"
                    :type="showPassword.confirm ? 'text' : 'password'"
                    label="Yeni Şifre Tekrar *"
                    variant="outlined"
                    :rules="[rules.required, rules.passwordMatch]"
                    :append-inner-icon="showPassword.confirm ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword.confirm = !showPassword.confirm"
                    class="mb-3"
                  ></v-text-field>

                  <v-btn
                    type="submit"
                    color="primary"
                    :loading="passwordLoading"
                    class="mt-3"
                  >
                    Şifreyi Değiştir
                  </v-btn>
                </v-form>
              </v-card-text>
            </v-card>

            <v-card class="mt-4">
              <v-card-title class="text-error">Tehlikeli Alan</v-card-title>
              <v-card-text>
                <p class="mb-4">
                  Hesabınızı kalıcı olarak silmek için aşağıdaki butonu kullanabilirsiniz.
                  Bu işlem geri alınamaz.
                </p>
                <v-btn
                  color="error"
                  variant="outlined"
                  @click="confirmAccountDeletion"
                >
                  Hesabı Sil
                </v-btn>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>

          <!-- Preferences Tab -->
          <v-tabs-window-item value="preferences">
            <v-card>
              <v-card-title>Görünüm Tercihleri</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12">
                    <v-select
                      v-model="preferences.theme"
                      :items="themeOptions"
                      label="Tema"
                      variant="outlined"
                      @update:model-value="updateTheme"
                    ></v-select>
                  </v-col>
                  <v-col cols="12">
                    <v-select
                      v-model="preferences.language"
                      :items="languageOptions"
                      label="Dil"
                      variant="outlined"
                    ></v-select>
                  </v-col>
                  <v-col cols="12">
                    <v-select
                      v-model="preferences.dateFormat"
                      :items="dateFormatOptions"
                      label="Tarih Formatı"
                      variant="outlined"
                    ></v-select>
                  </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>

                <h4 class="text-h6 mb-3">Bildirim Tercihleri</h4>
                <v-switch
                  v-model="preferences.emailNotifications"
                  label="E-posta Bildirimleri"
                  color="primary"
                  class="mb-2"
                ></v-switch>
                <v-switch
                  v-model="preferences.browserNotifications"
                  label="Tarayıcı Bildirimleri"
                  color="primary"
                  class="mb-2"
                ></v-switch>
                <v-switch
                  v-model="preferences.marketingEmails"
                  label="Pazarlama E-postaları"
                  color="primary"
                ></v-switch>

                <v-btn
                  color="primary"
                  :loading="preferencesLoading"
                  @click="updatePreferences"
                  class="mt-4"
                >
                  Tercihleri Kaydet
                </v-btn>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-col>
    </v-row>

    <!-- Account Deletion Confirmation Dialog -->
    <v-dialog v-model="deleteAccountDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6 text-error">
          Hesabı Sil
        </v-card-title>
        <v-card-text>
          <v-alert type="error" variant="tonal" class="mb-4">
            Bu işlem geri alınamaz! Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.
          </v-alert>
          <p class="mb-3">
            Devam etmek için kullanıcı adınızı yazın:
          </p>
          <v-text-field
            v-model="deleteConfirmation"
            :label="`"${authStore.userName}" yazın`"
            variant="outlined"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="deleteAccountDialog = false"
          >
            İptal
          </v-btn>
          <v-btn
            color="error"
            :disabled="deleteConfirmation !== authStore.userName"
            :loading="deleteAccountLoading"
            @click="deleteAccount"
          >
            Hesabı Sil
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// Composables
const router = useRouter()
const theme = useTheme()
const authStore = useAuthStore()
const toast = useToast()

// Reactive Data
const activeTab = ref('personal')
const personalLoading = ref(false)
const passwordLoading = ref(false)
const preferencesLoading = ref(false)
const deleteAccountLoading = ref(false)
const deleteAccountDialog = ref(false)
const deleteConfirmation = ref('')

const showPassword = reactive({
  current: false,
  new: false,
  confirm: false
})

const personalData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  userName: ''
})

const passwordData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const preferences = reactive({
  theme: 'light',
  language: 'tr',
  dateFormat: 'dd/mm/yyyy',
  emailNotifications: true,
  browserNotifications: false,
  marketingEmails: false
})

const stats = ref({
  tableCount: 0,
  recordCount: 0
})

// Form References
const personalForm = ref()
const passwordForm = ref()

// Computed
const userInitials = computed(() => {
  if (!authStore.user) return 'U'
  const firstName = authStore.user.firstName || ''
  const lastName = authStore.user.lastName || ''
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Options
const themeOptions = [
  { title: 'Açık Tema', value: 'light' },
  { title: 'Karanlık Tema', value: 'dark' }
]

const languageOptions = [
  { title: 'Türkçe', value: 'tr' },
  { title: 'English', value: 'en' }
]

const dateFormatOptions = [
  { title: 'DD/MM/YYYY', value: 'dd/mm/yyyy' },
  { title: 'MM/DD/YYYY', value: 'mm/dd/yyyy' },
  { title: 'YYYY-MM-DD', value: 'yyyy-mm-dd' }
]

// Validation Rules
const rules = {
  required: (value: string) => !!value || 'Bu alan zorunludur',
  email: (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Geçerli bir e-posta adresi giriniz'
  },
  password: (value: string) => {
    if (!value) return 'Şifre zorunludur'
    if (value.length < 6) return 'Şifre en az 6 karakter olmalıdır'
    return true
  },
  passwordMatch: (value: string) => {
    return value === passwordData.newPassword || 'Şifreler eşleşmiyor'
  }
}

// Methods
const loadUserData = () => {
  if (authStore.user) {
    personalData.firstName = authStore.user.firstName
    personalData.lastName = authStore.user.lastName
    personalData.email = authStore.user.email
    personalData.userName = authStore.user.userName
  }
}

const loadStats = async () => {
  try {
    // API call to get user statistics
    // const response = await api.get('/user/stats')
    // stats.value = response.data

    // Mock data
    stats.value = {
      tableCount: 5,
      recordCount: 150
    }
  } catch (error) {
    console.error('Stats loading error:', error)
  }
}

const updatePersonalInfo = async () => {
  const { valid } = await personalForm.value.validate()
  if (!valid) return

  personalLoading.value = true
  try {
    // API call to update personal info
    // await api.put('/user/profile', personalData)

    // Update store
    if (authStore.user) {
      authStore.user.firstName = personalData.firstName
      authStore.user.lastName = personalData.lastName
      authStore.user.userName = personalData.userName
    }

    toast.success('Kişisel bilgiler başarıyla güncellendi')
  } catch (error) {
    console.error('Personal info update error:', error)
    toast.error('Bilgiler güncellenirken hata oluştu')
  } finally {
    personalLoading.value = false
  }
}

const changePassword = async () => {
  const { valid } = await passwordForm.value.validate()
  if (!valid) return

  passwordLoading.value = true
  try {
    // API call to change password
    // await api.post('/user/change-password', passwordData)

    toast.success('Şifre başarıyla değiştirildi')

    // Reset form
    passwordData.currentPassword = ''
    passwordData.newPassword = ''
    passwordData.confirmPassword = ''
    passwordForm.value.reset()
  } catch (error) {
    console.error('Password change error:', error)
    toast.error('Şifre değiştirilirken hata oluştu')
  } finally {
    passwordLoading.value = false
  }
}

const updatePreferences = async () => {
  preferencesLoading.value = true
  try {
    // API call to save preferences
    // await api.put('/user/preferences', preferences)

    toast.success('Tercihler başarıyla kaydedildi')
  } catch (error) {
    console.error('Preferences update error:', error)
    toast.error('Tercihler kaydedilirken hata oluştu')
  } finally {
    preferencesLoading.value = false
  }
}

const updateTheme = (newTheme: string) => {
  theme.global.name.value = newTheme
}

const confirmAccountDeletion = () => {
  deleteConfirmation.value = ''
  deleteAccountDialog.value = true
}

const deleteAccount = async () => {
  deleteAccountLoading.value = true
  try {
    // API call to delete account
    // await api.delete('/user/account')

    toast.success('Hesap başarıyla silindi')
    authStore.logout()
    router.push('/auth')
  } catch (error) {
    console.error('Account deletion error:', error)
    toast.error('Hesap silinirken hata oluştu')
  } finally {
    deleteAccountLoading.value = false
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Bilinmiyor'
  return new Date(dateString).toLocaleDateString('tr-TR')
}

onMounted(() => {
  loadUserData()
  loadStats()
})
</script>

<style scoped>
.v-avatar {
  border: 4px solid rgba(var(--v-theme-primary), 0.1);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .v-tabs {
    margin-bottom: 16px;
  }
}
</style>
