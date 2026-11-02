import { Database } from 'lucide-react'
import { LoginForm } from '@/components/auth/Login-form'
import { MainLayout } from '@/layouts/MainLayout'
import type { AuthUser } from '@/api'

export interface LoginPageProps {
  onLogin?: (email: string, user?: AuthUser) => void
  notify?: (message: string) => void
}

export function LoginPage({ onLogin, notify }: LoginPageProps) {
  return (
    <MainLayout>
      <div
        style={{
          minHeight: '80vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
        }}
      >
        <div
          className="panel"
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '32px',
            boxShadow: '0 12px 30px rgba(23,33,47,.08)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              className="brand-mark"
              style={{ width: '42px', height: '42px', margin: '0 auto 12px' }}
            >
              <Database style={{ width: '22px' }} />
            </div>
            <h1 style={{ fontSize: '22px', margin: 0 }}>CommerceOS</h1>
            <p className="subheading" style={{ marginTop: '4px' }}>
              Sign in to access your admin dashboard
            </p>
          </div>

          <LoginForm
            onLoginSuccess={(email) => {
              notify?.(`Signed in as ${email}`)
              onLogin?.(email)
            }}
          />
        </div>
      </div>
    </MainLayout>
  )
}

export default LoginPage
