// Kullanıcı interface'i
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  userName: string
  emailConfirmed: boolean
  isEmailConfirmed: boolean
  createdAt?: string
  updatedAt?: string
}

// Giriş isteği
export interface LoginRequest {
  userName: string
  password: string
}

// Kayıt isteği
export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  userName: string
  password: string
}

// API yanıt yapısı
export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: User
  errors?: Record<string, string[]>
}

// Şifre sıfırlama isteği
export interface ForgotPasswordRequest {
  email: string
}

// Şifre yenileme isteği
export interface ResetPasswordRequest {
  token: string
  email: string
  password: string
}

// E-posta doğrulama isteği
export interface ConfirmEmailRequest {
  token: string
  email: string
}

// Kullanıcı güncelleme isteği
export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  email?: string
}

// Şifre değiştirme isteği
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// JWT Payload yapısı
export interface JwtPayload {
  sub: string // user id
  unique_name: string // username
  email: string
  exp: number // expiration time
  iat: number // issued at
  jti: string // jwt id
}

// API Error Response
export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  statusCode: number
}

// Loading states
export interface LoadingStates {
  login: boolean
  register: boolean
  forgotPassword: boolean
  resetPassword: boolean
  confirmEmail: boolean
  updateProfile: boolean
  changePassword: boolean
}

// Form validation rules
export interface ValidationRule {
  (value: string): boolean | string
}

export interface ValidationRules {
  required: ValidationRule
  email: ValidationRule
  minLength: (min: number) => ValidationRule
  password: ValidationRule
  passwordMatch: (password: string) => ValidationRule
}
