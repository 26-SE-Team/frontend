export interface LoginFormData {
  [key: string]: string | boolean
  email: string
  password: string
  rememberMe: boolean
}

export interface RegisterFormData {
  [key: string]: string | boolean
  name: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export interface FormError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: FormError[]
}