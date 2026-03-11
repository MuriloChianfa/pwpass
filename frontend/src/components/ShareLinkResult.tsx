import { useState } from 'react'
import styled from '@emotion/styled'
import { theme } from '../theme'

interface ShareLinkResultProps {
  token: string
}

const Container = styled.div`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.lg};
  padding: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`

const Title = styled.h3`
  font-size: ${theme.font.sizeLg};
  color: ${theme.colors.success};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`

const Description = styled.p`
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.textMuted};
  line-height: 1.5;
`

const LinkRow = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: stretch;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`

const LinkInput = styled.input`
  flex: 1;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.inputBg};
  border: 1px solid ${theme.colors.inputBorder};
  border-radius: ${theme.radius.md};
  color: ${theme.colors.primaryHover};
  font-size: ${theme.font.sizeSm};
  font-family: 'Courier New', monospace;
  outline: none;
  cursor: text;

  &:focus {
    border-color: ${theme.colors.borderFocus};
  }
`

const CopyButton = styled.button<{ copied: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: ${(p) => (p.copied ? theme.colors.success : theme.colors.primary)};
  border: none;
  border-radius: ${theme.radius.md};
  color: white;
  font-size: ${theme.font.sizeSm};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;

  &:hover {
    background: ${(p) => (p.copied ? theme.colors.success : theme.colors.primaryHover)};
  }
`

const NewPushButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.primaryHover};
  cursor: pointer;
  align-self: flex-start;

  &:hover {
    text-decoration: underline;
  }
`

function buildShareUrl(token: string): string {
  const base = window.location.origin + import.meta.env.BASE_URL
  return `${base}${token}`
}

export function ShareLinkResult({ token }: ShareLinkResultProps) {
  const [copied, setCopied] = useState(false)
  const url = buildShareUrl(token)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Container>
      <Title>
        <span>✓</span> Your password has been created!
      </Title>
      <Description>
        Share this link with the recipient. Once the expiration conditions are met, the
        password will be permanently deleted.
      </Description>
      <LinkRow>
        <LinkInput readOnly value={url} onClick={(e) => e.currentTarget.select()} />
        <CopyButton copied={copied} onClick={handleCopy} type="button">
          {copied ? 'Copied!' : 'Copy Link'}
        </CopyButton>
      </LinkRow>
      <NewPushButton href={import.meta.env.BASE_URL}>
        ← Create another password
      </NewPushButton>
    </Container>
  )
}
