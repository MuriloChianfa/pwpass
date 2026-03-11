import { useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from '@emotion/styled'
import { theme } from '../theme'
import { getSecret, deleteSecret, hasPassphrase } from '../services/api'
import type { SecretResult } from '../services/api'

const Page = styled.div`
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
  padding: ${theme.spacing.xl} ${theme.spacing.md};
`

const Card = styled.div`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.lg};
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`

const Title = styled.h2`
  font-size: ${theme.font.sizeXl};
  color: ${theme.colors.text};
`

const ErrorTitle = styled(Title)`
  color: ${theme.colors.danger};
`

const SecretRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0;
`

const SecretBox = styled.div`
  flex: 1;
  min-width: 0;
  background: ${theme.colors.inputBg};
  border: 1px solid ${theme.colors.inputBorder};
  border-radius: ${theme.radius.md} 0 0 ${theme.radius.md};
  padding: ${theme.spacing.md};
  font-family: 'Courier New', monospace;
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.text};
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.6;
  overflow: hidden;
`

const IconButton = styled.button<{ rounded?: 'right' | 'none' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  background: ${theme.colors.inputBg};
  border: 1px solid ${theme.colors.inputBorder};
  border-left: none;
  border-radius: ${(p) =>
    p.rounded === 'right' ? `0 ${theme.radius.md} ${theme.radius.md} 0` : '0'};
  color: ${theme.colors.textMuted};
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
  font-size: 18px;
  flex-shrink: 0;

  &:hover {
    color: ${theme.colors.text};
    background: ${theme.colors.border};
  }
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.textMuted};
`

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`

const ButtonRow = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border: none;
  border-radius: ${theme.radius.md};
  font-size: ${theme.font.sizeSm};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  color: white;

  background: ${(p) =>
    p.variant === 'danger'
      ? theme.colors.danger
      : p.variant === 'secondary'
        ? theme.colors.surface
        : theme.colors.primary};

  border: 1px solid
    ${(p) =>
      p.variant === 'danger'
        ? theme.colors.danger
        : p.variant === 'secondary'
          ? theme.colors.border
          : theme.colors.primary};

  &:hover {
    opacity: 0.85;
  }
`

const PassphraseInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.inputBg};
  border: 1px solid ${theme.colors.inputBorder};
  border-radius: ${theme.radius.md};
  color: ${theme.colors.text};
  font-size: ${theme.font.sizeSm};
  outline: none;

  &::placeholder {
    color: ${theme.colors.textPlaceholder};
  }

  &:focus {
    border-color: ${theme.colors.borderFocus};
  }
`

const Description = styled.p`
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.textMuted};
  line-height: 1.5;
`

const BackLink = styled.a`
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.primaryHover};
  align-self: flex-start;

  &:hover {
    text-decoration: underline;
  }
`

function formatExpiry(timestamp: number): string {
  const diff = timestamp - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 24) return `${hours}h remaining`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h remaining`
}

export function ViewPage() {
  const { token } = useParams<{ token: string }>()
  const [secret, setSecret] = useState<SecretResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [needsPassphrase, setNeedsPassphrase] = useState<boolean | null>(null)
  const [passphrase, setPassphrase] = useState('')
  const [copied, setCopied] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [visible, setVisible] = useState(false)

  if (needsPassphrase === null && !secret && !error && token) {
    const needs = hasPassphrase(token)
    if (needs) {
      setNeedsPassphrase(true)
    } else {
      const result = getSecret(token)
      if (result.ok) {
        setSecret(result.data)
      } else {
        setError(result.error)
      }
    }
  }

  const handleUnlock = () => {
    if (!token) return
    const result = getSecret(token, passphrase)
    if (result.ok) {
      setSecret(result.data)
      setNeedsPassphrase(false)
    } else {
      setError(result.error)
    }
  }

  const handleCopy = async () => {
    if (!secret) return
    await navigator.clipboard.writeText(secret.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = () => {
    if (!token) return
    deleteSecret(token)
    setDeleted(true)
  }

  if (deleted) {
    return (
      <Page>
        <Card>
          <Title>Password Deleted</Title>
          <Description>This password has been permanently deleted.</Description>
          <BackLink href={import.meta.env.BASE_URL}>← Generate a new password</BackLink>
        </Card>
      </Page>
    )
  }

  if (error) {
    return (
      <Page>
        <Card>
          <ErrorTitle>Password Unavailable</ErrorTitle>
          <Description>{error}</Description>
          <BackLink href={import.meta.env.BASE_URL}>← Generate a new password</BackLink>
        </Card>
      </Page>
    )
  }

  if (needsPassphrase && !secret) {
    return (
      <Page>
        <Card>
          <Title>🔒 Passphrase Required</Title>
          <Description>
            This password is protected. Enter the passphrase to reveal the password.
          </Description>
          <PassphraseInput
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Enter passphrase..."
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
          />
          <ButtonRow>
            <Button onClick={handleUnlock}>Unlock</Button>
          </ButtonRow>
        </Card>
      </Page>
    )
  }

  if (secret) {
    return (
      <Page>
        <Card>
          <Title>Shared Password</Title>
          <SecretRow>
            <SecretBox>
              {visible ? secret.content : '•'.repeat(secret.content.length)}
            </SecretBox>
            <IconButton
              rounded="none"
              onClick={() => setVisible((v) => !v)}
              title={visible ? 'Hide password' : 'Show password'}
            >
              {visible ? '🙈' : '👁'}
            </IconButton>
            <IconButton
              rounded="right"
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy to clipboard'}
            >
              {copied ? '✓' : '📋'}
            </IconButton>
          </SecretRow>
          <Meta>
            <MetaItem>⏱ {formatExpiry(secret.expiresAt)}</MetaItem>
            <MetaItem>
              👁 {secret.remainingViews} view{secret.remainingViews !== 1 ? 's' : ''}{' '}
              remaining
            </MetaItem>
          </Meta>
          {secret.allowDeletion && (
            <ButtonRow>
              <Button variant="danger" onClick={handleDelete}>
                Delete Now
              </Button>
            </ButtonRow>
          )}
          <BackLink href={import.meta.env.BASE_URL}>← Generate a new password</BackLink>
        </Card>
      </Page>
    )
  }

  return null
}
