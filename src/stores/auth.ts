import { defineStore } from 'pinia'
import { ref, computed } from 'vue' // ref ve computed kullanılıyor, readonly'ye ihtiyaç yok gibi
import router from '@/router' // Yönlendirme için router'ı import edin
// import api from '@/api'; // API servisiniz varsa bunu kullanın

export const useAuthStore = defineStore('auth', () => {
  // Durumlar (State)
  const user = ref<any | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const loading = ref(false) // Yüklenme durumu
  const error = ref<string | null>(null) // Hata mesajı

  // Getters (Computed Properties)
  const fullName = computed(() => {
    if (!user.value) return 'Misafir'
    return `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim()
  })
  const userName = computed(() => user.value?.userName || 'Misafir')

  // Aksiyonlar (Actions)
  const login = async (credentials: any) => {
    loading.value = true
    error.value = null
    try {
      // Gerçek API çağrısı yerine mock data
      // const response = await api.post('/auth/login', credentials);
      // if (response.data.success) {
      //   token.value = response.data.token;
      //   user.value = response.data.user;
      //   localStorage.setItem('token', response.data.token);
      //   return { success: true, message: response.data.message };
      // } else {
      //   return { success: false, message: response.data.message };
      // }

      // ÖRNEK MOCK LOGİN:
      if (credentials.userName === 'test' && credentials.password === '123456') {
        const mockToken = 'mock_jwt_token_12345'
        const mockUser = {
          firstName: 'Deneme',
          lastName: 'Kullanıcı',
          email: 'test@example.com',
          userName: 'test',
          id: '1',
        }
        token.value = mockToken
        user.value = mockUser
        localStorage.setItem('token', mockToken)
        localStorage.setItem('user', JSON.stringify(mockUser)) // Kullanıcı bilgisini de kaydet
        return { success: true, message: 'Giriş başarılı!' }
      } else {
        return { success: false, message: 'Kullanıcı adı veya şifre yanlış.' }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Giriş başarısız!'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const register = async (userData: any) => {
    loading.value = true
    error.value = null
    try {
      // Gerçek API çağrısı yerine mock data
      // const response = await api.post('/auth/register', userData);
      // if (response.data.success) {
      //   return { success: true, message: response.data.message };
      // } else {
      //   return { success: false, message: response.data.message };
      // }

      // ÖRNEK MOCK KAYIT:
      console.log('Registering user:', userData)
      return { success: true, message: 'Kayıt başarılı! E-posta doğrulama linkini kontrol ediniz.' }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Kayıt başarısız!'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user') // Kullanıcı bilgisini de temizle
    router.push('/auth') // Çıkış yaptıktan sonra login sayfasına yönlendir
  }

  // YENİ EKLENECEK KISIM: initializeAuth fonksiyonu
  const initializeAuth = async () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user') // Kullanıcı bilgisini de al

    if (storedToken && storedUser) {
      try {
        // Token'ı ve kullanıcı bilgisini yükle
        token.value = storedToken
        user.value = JSON.parse(storedUser)

        // OPTIONAL: Burada sunucuya token'ın geçerliliğini doğrulayan bir çağrı yapabilirsiniz.
        // Örneğin: await api.get('/auth/verify-token');
        // Eğer doğrulama başarısız olursa logout yapın.
        console.log('Oturum token ile başlatıldı.')
      } catch (err) {
        console.error('Oturum başlatılırken hata:', err)
        logout() // Hata olursa oturumu kapat
      }
    } else {
      logout() // Token veya kullanıcı bilgisi yoksa oturumu kapat
    }
  }

  const checkTokenValidity = () => {
    // Basit bir token geçerlilik kontrolü (gerçekte JWT'nin süresini kontrol etmelisiniz)
    return !!token.value // Şimdilik sadece token'ın varlığını kontrol ediyoruz
  }

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    fullName,
    userName,
    login,
    register,
    logout,
    initializeAuth, // Burayı eklemeyi unutmayın!
    checkTokenValidity,
  }
})
