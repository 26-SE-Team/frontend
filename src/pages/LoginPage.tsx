import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Input } from '../components/Input'
import { useForm } from '../hooks/useForm'
import type { LoginFormData } from '../types/auth'
import styles from './AuthPage.module.css'
import { GoogleLogin } from '@react-oauth/google'

const initialValues: LoginFormData = {
  email: '',
  password: '',
  rememberMe: false,
}

function validate(values: LoginFormData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!values.email) {
    errors.email = '이메일을 입력해주세요.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
  }
  if (!values.password) {
    errors.password = '비밀번호를 입력해주세요.'
  } else if (values.password.length < 6) {
    errors.password = '비밀번호는 최소 6자 이상이어야 합니다.'
  }
  return errors
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    submitSuccess,
    handleChange,
    handleSubmit,
    getFieldProps,
  } = useForm<LoginFormData>({
    initialValues,
    validate,
    onSubmit: async (_values) => {
      // 실제 API 호출 시뮬레이션
      await new Promise((res) => setTimeout(res, 1200))
      // 성공 후 홈으로 이동 (실제 구현 시 토큰 저장 등)
      navigate('/')
    },
  })

  return (
    <AuthLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>로그인</h1>
        <p className={styles.subtitle}>
          계정이 없으신가요?{' '}
          <Link to="/register" className={styles.link}>회원가입</Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.fields}>
          <Input
            label="이메일"
            type="email"
            placeholder="hello@example.com"
            error={errors.email}
            touched={touched.email}
            icon={<EmailIcon />}
            {...getFieldProps('email')}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="••••••••"
            error={errors.password}
            touched={touched.password}
            icon={<LockIcon />}
            {...getFieldProps('password')}
          />
        </div>

        <div className={styles.row}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="rememberMe"
              checked={values.rememberMe}
              onChange={handleChange}
              className={styles.checkbox}
            />
            <span className={styles.checkmark}>
              {values.rememberMe && <CheckIcon />}
            </span>
            로그인 유지
          </label>
          <Link to="/forgot-password" className={styles.link}>
            비밀번호 찾기
          </Link>
        </div>

        {submitError && (
          <div className={styles.alertError} role="alert">
            <AlertIcon />
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className={styles.alertSuccess} role="status">
            <SuccessIcon />
            로그인 성공! 잠시 후 이동합니다.
          </div>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className={styles.spinner} />
          ) : (
            '로그인'
          )}
        </button>

        <div className={styles.divider}>
          <span>또는</span>
        </div>

        <div className={styles.socialButtons}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              const res = await fetch('http://localhost:8080/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  credential: credentialResponse.credential,
                }),
              })

              const data = await res.json()
              console.log(data)

              // 예: 백엔드가 accessToken을 주면 저장
              localStorage.setItem('accessToken', data.accessToken)

              navigate('/')
            }}
            onError={() => {
              console.log('Google 로그인 실패')
            }}
          />
          <button type="button" className={styles.socialBtn} onClick={() => {
            window.location.href = 'http://localhost:8080/api/auth/kakao'
          }}>
            <KakaoIcon /> 카카오로 계속하기
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}

// Icons
const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4" width="20" height="16" rx="3"/>
    <path d="M2 7l10 7 10-7"/>
  </svg>
)

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const SuccessIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
    <polyline points="2 6 5 9 10 3"/>
  </svg>
)

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const KakaoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#3A1D1D">
    <path d="M12 3C6.48 3 2 6.59 2 11c0 2.76 1.62 5.19 4.07 6.7l-1.04 3.88 4.5-2.97A11.97 11.97 0 0012 19c5.52 0 10-3.59 10-8S17.52 3 12 3z"/>
  </svg>
)