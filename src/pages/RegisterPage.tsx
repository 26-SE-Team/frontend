import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Input } from '../components/Input'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from '../hooks/useForm'
import { useSocialLogin } from '../hooks/useSocialLogin'
import { authStorage, type AccountMode, type AuthUser } from '../services/authService'
import type { RegisterFormData } from '../types/auth'
import styles from './AuthPage.module.css'

const initialValues: RegisterFormData = {
  name: '',
  email: '',
  accountMode: 'tenant',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
}

function validate(values: RegisterFormData): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!values.name) {
    errors.name = '이름을 입력해주세요.'
  } else if (values.name.length < 2) {
    errors.name = '이름은 2자 이상이어야 합니다.'
  }

  if (!values.email) {
    errors.email = '이메일을 입력해주세요.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
  }

  if (values.accountMode !== 'tenant' && values.accountMode !== 'broker') {
    errors.accountMode = '가입 유형을 선택해주세요.'
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력해주세요.'
  } else if (values.password.length < 8) {
    errors.password = '비밀번호는 8자 이상이어야 합니다.'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = '비밀번호를 다시 입력해주세요.'
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
  }

  if (!values.agreeToTerms) {
    errors.agreeToTerms = '이용약관에 동의해주세요.'
  }

  return errors
}

function getPasswordStrength(password: string): {
  score: number
  label: string
  className: string
} {
  if (!password) return { score: 0, label: '', className: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: '약함', className: 'weak' }
  if (score === 2) return { score: 2, label: '보통', className: 'fair' }
  if (score === 3) return { score: 3, label: '양호', className: 'good' }
  return { score: 4, label: '강함', className: 'strong' }
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const { loginWithKakao, loginWithGoogle, loading } = useSocialLogin()

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    submitSuccess,
    handleChange,
    handleSubmit,
    handleBlur,
    getFieldProps,
  } = useForm<RegisterFormData>({
    initialValues,
    validate,
    onSubmit: async (submittedValues) => {
      await new Promise((res) => setTimeout(res, 1400))
      const accountMode = submittedValues.accountMode as AccountMode
      const now = Date.now()
      const user: AuthUser = {
        id: `registered-${now}`,
        email: submittedValues.email,
        nickname: submittedValues.name,
        provider: 'email',
        accountMode,
        brokerCertificationStatus:
          accountMode === 'broker' ? 'required' : 'not-required',
        isBrokerCertified: false,
      }

      authStorage.setSession(
        {
          accessToken: `registered-access-${now}`,
          refreshToken: `registered-refresh-${now}`,
        },
        user
      )
      setUser(user)
      navigate(accountMode === 'broker' ? '/mypage' : '/home', { replace: true })
    },
  })

  const strength = useMemo(
    () => getPasswordStrength(values.password),
    [values.password]
  )

  return (
    <AuthLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>회원가입</h1>
        <p className={styles.subtitle}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className={styles.link}>로그인</Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.fields}>
          <Input
            label="이름"
            type="text"
            placeholder="홍길동"
            error={errors.name}
            touched={touched.name}
            icon={<PersonIcon />}
            {...getFieldProps('name')}
          />
          <Input
            label="이메일"
            type="email"
            placeholder="hello@example.com"
            error={errors.email}
            touched={touched.email}
            icon={<EmailIcon />}
            {...getFieldProps('email')}
          />

          <fieldset className={styles.accountType}>
            <legend>어떤 계정으로 가입하시나요?</legend>
            <div className={styles.accountTypeOptions}>
              <label className={styles.accountTypeOption}>
                <input
                  type="radio"
                  name="accountMode"
                  value="tenant"
                  checked={values.accountMode === 'tenant'}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <span>
                  <strong>임차인</strong>
                  <small>매물 탐색과 상담을 이용해요</small>
                </span>
              </label>
              <label className={styles.accountTypeOption}>
                <input
                  type="radio"
                  name="accountMode"
                  value="broker"
                  checked={values.accountMode === 'broker'}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <span>
                  <strong>중개인</strong>
                  <small>인증 후 매물을 등록해요</small>
                </span>
              </label>
            </div>
            {touched.accountMode && errors.accountMode && (
              <p className={styles.fieldError}>
                <AlertIcon /> {errors.accountMode}
              </p>
            )}
          </fieldset>

          {/* Password with strength indicator */}
          <div>
            <Input
              label="비밀번호"
              type="password"
              placeholder="8자 이상 입력해주세요"
              error={errors.password}
              touched={touched.password}
              icon={<LockIcon />}
              {...getFieldProps('password')}
            />
            {values.password && (
              <div style={{ marginTop: 8 }}>
                <div className={styles.strengthBar}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`${styles.strengthSegment} ${
                        i <= strength.score ? styles[strength.className] : ''
                      }`}
                    />
                  ))}
                </div>
                <p className={`${styles.strengthLabel} ${styles[strength.className]}`}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          <Input
            label="비밀번호 확인"
            type="password"
            placeholder="비밀번호를 다시 입력해주세요"
            error={errors.confirmPassword}
            touched={touched.confirmPassword}
            icon={<LockIcon />}
            {...getFieldProps('confirmPassword')}
          />
        </div>

        {/* Terms */}
        <div>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={values.agreeToTerms}
              onChange={handleChange}
              onBlur={handleBlur}
              className={styles.checkbox}
            />
            <span className={styles.checkmark}>
              {values.agreeToTerms && <CheckIcon />}
            </span>
            <span className={styles.termsText}>
              <Link to="/terms" className={styles.link}>이용약관</Link>
              {' '}및{' '}
              <Link to="/privacy" className={styles.link}>개인정보처리방침</Link>
              에 동의합니다
            </span>
          </label>
          {touched.agreeToTerms && errors.agreeToTerms && (
            <p style={{ fontSize: 12.5, color: 'var(--error)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertIcon /> {errors.agreeToTerms}
            </p>
          )}
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
            회원가입 완료! 로그인 페이지로 이동합니다.
          </div>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? <span className={styles.spinner} /> : '회원가입'}
        </button>

        <div className={styles.divider}><span>또는</span></div>

        <div className={styles.socialButtons}>
          <button
            type="button"
            className={styles.socialBtn}
            disabled={loading !== null}
            onClick={() => void loginWithGoogle()}
          >
            <GoogleIcon /> Google로 시작하기
          </button>
          <button
            type="button"
            className={styles.socialBtn}
            disabled={loading !== null}
            onClick={() => void loginWithKakao()}
          >
            <KakaoIcon /> 카카오로 시작하기
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}

// Icons
const PersonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/>
  </svg>
)

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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
