import { useState, useRef, useEffect } from 'react'
import styled from '@emotion/styled'
import { theme } from '../theme'
import { PasswordInput } from '../components/PasswordInput'
import { PasswordStrength } from '../components/PasswordStrength'
import { PasswordGenerator } from '../components/PasswordGenerator'
import { ExpirationSliders } from '../components/ExpirationSliders'
import { AdditionalOptions } from '../components/AdditionalOptions'
import { InfoPanel } from '../components/InfoPanel'
import { ShareLinkResult } from '../components/ShareLinkResult'
import { pushSecret } from '../services/api'
import { generatePassword } from '../services/password'

const Page = styled.div`
  max-width: 1040px;
  width: 100%;
  margin: 0 auto;
  padding: ${theme.spacing.xl} ${theme.spacing.md};
`

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: ${theme.spacing.xl};
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const FormColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`

const Sidebar = styled.div<{ maxH?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  ${(p) => p.maxH ? `max-height: ${p.maxH}px;` : ''}
  overflow: hidden;
`

const PushButton = styled.button`
  width: 100%;
  padding: 14px;
  background: ${theme.colors.primary};
  border: none;
  border-radius: ${theme.radius.md};
  color: white;
  font-size: ${theme.font.sizeMd};
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  letter-spacing: 0.02em;

  &:hover:not(:disabled) {
    background: ${theme.colors.primaryHover};
  }

  &:active:not(:disabled) {
    background: ${theme.colors.primaryActive};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export function PushPage() {
  const [content, setContent] = useState(() => generatePassword())
  const [days, setDays] = useState(2)
  const [views, setViews] = useState(6)
  const [passphrase, setPassphrase] = useState('')
  const [allowDeletion, setAllowDeletion] = useState(false)
  const [resultToken, setResultToken] = useState<string | null>(null)
  const [pushing, setPushing] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)
  const [sidebarMax, setSidebarMax] = useState<number | undefined>(undefined)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!formRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      setSidebarMax(entry.contentRect.height)
    })
    observer.observe(formRef.current)
    return () => observer.disconnect()
  }, [])

  const handlePush = async () => {
    if (!content.trim() || pushing) return
    setPushing(true)
    setPushError(null)
    try {
      const token = await pushSecret({
        content,
        passphrase: passphrase || undefined,
        expireDays: days,
        maxViews: views,
        allowDeletion,
      })
      setResultToken(token)
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Failed to share password. Please try again.')
    } finally {
      setPushing(false)
    }
  }

  if (resultToken) {
    return (
      <Page>
        <ShareLinkResult token={resultToken} />
      </Page>
    )
  }

  return (
    <Page>
      <FormGrid>
        <FormColumn ref={formRef}>
          <PasswordInput value={content} onChange={setContent} />
          <PasswordStrength password={content} />
          <ExpirationSliders
            days={days}
            views={views}
            onDaysChange={setDays}
            onViewsChange={setViews}
          />
          <AdditionalOptions
            allowDeletion={allowDeletion}
            onAllowDeletionChange={setAllowDeletion}
            passphrase={passphrase}
            onPassphraseChange={setPassphrase}
          />
          {pushError && (
            <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>{pushError}</div>
          )}
          <PushButton onClick={handlePush} disabled={!content.trim() || pushing}>
            {pushing ? 'Sharing...' : 'Share Securely!'}
          </PushButton>
        </FormColumn>

        <Sidebar maxH={sidebarMax}>
          <PasswordGenerator onGenerate={setContent} />
          <InfoPanel />
        </Sidebar>
      </FormGrid>
    </Page>
  )
}
