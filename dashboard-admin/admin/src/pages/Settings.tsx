import { useEffect, useState } from 'react'
import { AlertCircle, Bell, CheckCircle2, Lock, Send, Shield, Store } from 'lucide-react'
import { useI18n } from '@/assets/i18n'
import { Cancel } from '@/components/Cancel'
import { Edit } from '@/components/Edit'
import { CrudDialog } from '@/components/CrudDialog'
import { extractErrorMessage, telegramApi } from '@/api'
import {
  DEFAULT_STORE_SETTINGS,
  getStoreSettings,
  saveStoreSettings,
  type StoreSettings,
} from '@/utils/settings'

export function Settings({ notify }: { notify: (message: string) => void }) {
  const { t } = useI18n()
  const initialSettings = getStoreSettings()
  const [storeName, setStoreName] = useState(initialSettings.storeName)
  const [email, setEmail] = useState(initialSettings.supportEmail)
  const [currency, setCurrency] = useState<StoreSettings['currency']>(
    initialSettings.currency,
  )
  const [notifications, setNotifications] = useState(
    initialSettings.notificationsEnabled,
  )
  const [twoFactorOpen, setTwoFactorOpen] = useState(false)

  const [telegramConfig, setTelegramConfig] = useState<{
    configured: boolean
    hasBotToken: boolean
    hasChatId: boolean
    botTokenMasked: string
    chatId: string | null
  } | null>(null)
  const [telegramBotToken, setTelegramBotToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [testingTelegram, setTestingTelegram] = useState(false)
  const [savingTelegram, setSavingTelegram] = useState(false)

  useEffect(() => {
    telegramApi
      .getConfig()
      .then((cfg) => {
        if (cfg) {
          setTelegramConfig(cfg)
          if (cfg.chatId) setTelegramChatId(cfg.chatId)
        }
      })
      .catch(() => {
        // ignore if not reachable
      })
  }, [])

  const handleSaveTelegram = async () => {
    setSavingTelegram(true)
    try {
      const updated = await telegramApi.updateConfig({
        botToken: telegramBotToken.trim() || undefined,
        chatId: telegramChatId.trim() || undefined,
      })
      if (updated) {
        setTelegramConfig(updated)
        if (telegramBotToken) setTelegramBotToken('')
      }
      notify('Telegram Bot configuration saved to server')
    } catch (err) {
      notify(extractErrorMessage(err, 'Failed to save Telegram config'))
    } finally {
      setSavingTelegram(false)
    }
  }

  const handleTestTelegram = async () => {
    setTestingTelegram(true)
    try {
      const res = await telegramApi.sendTest()
      notify(res?.message || 'Test alert sent to Telegram bot!')
    } catch (err) {
      notify(
        extractErrorMessage(
          err,
          'Could not send test message. Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.',
        ),
      )
    } finally {
      setTestingTelegram(false)
    }
  }

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault()
    saveStoreSettings({
      storeName,
      supportEmail: email,
      currency,
      notificationsEnabled: notifications,
    })
    notify('Store settings saved successfully')
  }

  const handleCancel = () => {
    setStoreName(DEFAULT_STORE_SETTINGS.storeName)
    setEmail(DEFAULT_STORE_SETTINGS.supportEmail)
    setCurrency(DEFAULT_STORE_SETTINGS.currency)
    setNotifications(DEFAULT_STORE_SETTINGS.notificationsEnabled)
    notify(t('Cancel'))
  }

  return (
    <div className="feature-view">
      {twoFactorOpen && (
        <CrudDialog
          mode="edit"
          label="2FA security"
          columns={['Method', 'Phone', 'Email', 'Status']}
          row={['Authenticator App', '+1 (415) 555-0148', email, 'Active']}
          onClose={() => setTwoFactorOpen(false)}
          onSave={() => {
            saveStoreSettings({ twoFactorEnabled: true })
            notify('Two-factor authentication updated')
            setTwoFactorOpen(false)
          }}
        />
      )}

      <div className="feature-heading">
        <div>
          <h1>{t('Settings')}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cancel onClick={handleCancel} />
          <Edit label="Save changes" className="primary-button" onClick={() => handleSave()} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        <section className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <span className="product-avatar"><Store /></span>
            <div>
              <h2 style={{ margin: 0, fontSize: '15px' }}>{t('Store Details')}</h2>
              <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: '11px' }}>
                {t('General information about your ecommerce store')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label className="crud-field">
              <span>{t('Store name')}</span>
              <input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </label>
            <label className="crud-field">
              <span>{t('Support email')}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="crud-field">
              <span>{t('Store currency')}</span>
              <select
                className="filter-button"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as StoreSettings['currency'])}
                style={{ width: '100%', height: '38px', padding: '0 12px' }}
              >
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="KHR (៛)">KHR (៛)</option>
              </select>
            </label>
          </form>
        </section>

        <section className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <span className="product-avatar"><Shield /></span>
            <div>
              <h2 style={{ margin: 0, fontSize: '15px' }}>{t('Preferences & Security')}</h2>
              <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: '11px' }}>
                {t('Notifications and access settings')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#247f75' }}
              />
              <div>
                <strong style={{ fontSize: '12px', color: '#172638', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell style={{ width: '13px' }} /> {t('Email notifications')}
                </strong>
                <small style={{ color: 'var(--muted-foreground)', fontSize: '10px' }}>
                  {t('Receive updates for new orders and low stock alerts')}
                </small>
              </div>
            </label>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <strong style={{ fontSize: '12px', color: '#172638', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock style={{ width: '13px' }} /> {t('Two-factor authentication')}
              </strong>
              <small style={{ color: 'var(--muted-foreground)', fontSize: '10px', display: 'block', margin: '4px 0 10px' }}>
                {t('Keep your admin account secure with 2FA')}
              </small>
              <Edit
                label="Configure 2FA"
                className="filter-button"
                onClick={() => setTwoFactorOpen(true)}
              />
            </div>
          </div>
        </section>

        <section className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="product-avatar" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <Send style={{ width: '18px', height: '18px' }} />
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: '15px' }}>Telegram Bot Purchase Alerts</h2>
                <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: '11px' }}>
                  Real-time alerts when customers buy products
                </p>
              </div>
            </div>
            {telegramConfig?.configured ? (
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#166534', background: '#dcfce7', padding: '3px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 style={{ width: '12px', height: '12px' }} /> Connected
              </span>
            ) : (
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#854d0e', background: '#fef9c3', padding: '3px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle style={{ width: '12px', height: '12px' }} /> Setup Required
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label className="crud-field">
              <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Bot Token</span>
                {telegramConfig?.botTokenMasked && (
                  <small style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>
                    Active: {telegramConfig.botTokenMasked}
                  </small>
                )}
              </span>
              <input
                type="password"
                placeholder={telegramConfig?.hasBotToken ? "Enter new token to replace" : "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"}
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
              />
            </label>

            <label className="crud-field">
              <span>Chat ID / Group ID</span>
              <input
                type="text"
                placeholder="e.g. 987654321 or -100123456789"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
              />
            </label>

            <small style={{ color: 'var(--muted-foreground)', fontSize: '11px', lineHeight: 1.4 }}>
              💡 <b>How to setup:</b> Create a bot with <b>@BotFather</b> on Telegram to get your <b>Bot Token</b>. Message <b>@userinfobot</b> to get your personal <b>Chat ID</b>, or add the bot to your Telegram group and use the group ID.
            </small>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                className="filter-button"
                onClick={() => void handleTestTelegram()}
                disabled={testingTelegram || (!telegramConfig?.configured && (!telegramBotToken || !telegramChatId))}
                style={{ flex: 1, height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Send style={{ width: '13px', height: '13px' }} />
                <span>{testingTelegram ? 'Sending Test...' : 'Send Test Alert'}</span>
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleSaveTelegram()}
                disabled={savingTelegram}
                style={{ flex: 1, height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span>{savingTelegram ? 'Saving...' : 'Save Bot Config'}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Settings
