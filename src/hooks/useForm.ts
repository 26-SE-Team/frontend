import { useState, useCallback } from 'react'

type FormValues = Record<string, string | boolean> & { [key: string]: string | boolean }
type FormErrors = Record<string, string>
type Validator<T extends FormValues> = (values: T) => FormErrors

interface UseFormOptions<T extends FormValues> {
  initialValues: T
  validate?: Validator<T>
  onSubmit: (values: T) => Promise<void>
}

export function useForm<T extends FormValues>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target
      setValues((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }))
      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[name]
          return next
        })
      }
    },
    [errors]
  )

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitError(null)
      setSubmitSuccess(false)

      // Touch all fields
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      )
      setTouched(allTouched)

      // Validate
      if (validate) {
        const validationErrors = validate(values)
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors)
          return
        }
      }

      setIsSubmitting(true)
      try {
        await onSubmit(values)
        setSubmitSuccess(true)
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : '오류가 발생했습니다.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, validate, onSubmit]
  )

  const getFieldProps = (name: keyof T) => ({
    name: name as string,
    value: values[name] as string,
    onChange: handleChange,
    onBlur: handleBlur,
    'aria-invalid': !!(touched[name as string] && errors[name as string]),
  })

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    submitSuccess,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldProps,
  }
}