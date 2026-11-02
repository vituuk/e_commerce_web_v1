import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Lock, LogIn, Mail } from 'lucide-react'
import { useAuthLogin } from '@/hooks/use-auth'
import { setAccessToken } from '@/utils/tokenStorage'
import { extractErrorMessage } from '@/api'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(5, 'Password must be at least 5 characters'),
})

export interface LoginFormProps {
  onLoginSuccess?: (email: string) => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { mutate: loginMutate, isPending } = useAuthLogin()
  const [serverError, setServerError] = useState('')

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: {
      onSubmit: loginSchema,
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError('')
      loginMutate(
        { request: value },
        {
          onSuccess: (res) => {
            if (res?.token) {
              setAccessToken(res.token, 2)
            }
            window.dispatchEvent(new CustomEvent('commerceos-auth-change'))
            onLoginSuccess?.(value.email)
          },
          onError: (err) => {
            setServerError(
              extractErrorMessage(
                err,
                'Access denied: Only admin or superadmin accounts can sign in',
              ),
            )
          },
        },
      )
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
    >
      {serverError && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {serverError}
        </div>
      )}

      <form.Field name="email">
        {(field) => (
          <label className="crud-field">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail style={{ width: '13px', height: '13px' }} /> Email address
              <span className="crud-required-mark" aria-hidden="true">*</span>
            </span>
            <input
              type="email"
              required
              placeholder="admin@commerceos.io"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <small style={{ color: '#dc2626', fontSize: '12px' }}>
                {field.state.meta.errors[0]}
              </small>
            )}
          </label>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <label className="crud-field">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock style={{ width: '13px', height: '13px' }} /> Password
              <span className="crud-required-mark" aria-hidden="true">*</span>
            </span>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <small style={{ color: '#dc2626', fontSize: '12px' }}>
                {field.state.meta.errors[0]}
              </small>
            )}
          </label>
        )}
      </form.Field>

      <button
        type="submit"
        className="primary-button"
        disabled={isPending}
        style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
      >
        <LogIn style={{ width: '16px', height: '16px' }} />
        <span>{isPending ? 'Signing in...' : 'Sign in'}</span>
      </button>
    </form>
  )
}

export default LoginForm

