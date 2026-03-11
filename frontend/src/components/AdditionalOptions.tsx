import { useState } from 'react'
import styled from '@emotion/styled'
import { theme } from '../theme'

interface AdditionalOptionsProps {
  allowDeletion: boolean
  onAllowDeletionChange: (value: boolean) => void
  passphrase: string
  onPassphraseChange: (value: string) => void
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  font-size: ${theme.font.sizeSm};
  font-weight: 600;
  color: ${theme.colors.text};
`

const Divider = styled.hr`
  flex: 1;
  border: none;
  border-top: 1px solid ${theme.colors.border};
`

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: 999px;
  color: ${theme.colors.textMuted};
  font-size: ${theme.font.sizeSm};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${theme.colors.surfaceHover};
    color: ${theme.colors.text};
  }
`

const OptionsPanel = styled.div`
  padding: ${theme.spacing.md};
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.lg};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`

const OptionRow = styled.label`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  cursor: pointer;
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.text};
`

const Checkbox = styled.input`
  accent-color: ${theme.colors.primary};
  width: 16px;
  height: 16px;
  cursor: pointer;
`

const PassphraseSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`

const PassphraseLabel = styled.label`
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.text};
  font-weight: 600;
`

const PassphraseInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  background: ${theme.colors.inputBg};
  border: 1px solid ${theme.colors.inputBorder};
  border-radius: ${theme.radius.md};
  padding: 0 ${theme.spacing.md};
  transition: border-color 0.2s;

  &:focus-within {
    border-color: ${theme.colors.borderFocus};
  }
`

const LockIcon = styled.span`
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.textMuted};
`

const PassphraseInput = styled.input`
  flex: 1;
  padding: ${theme.spacing.sm} 0;
  background: transparent;
  border: none;
  color: ${theme.colors.text};
  font-size: ${theme.font.sizeSm};
  outline: none;

  &::placeholder {
    color: ${theme.colors.textPlaceholder};
  }
`

export function AdditionalOptions({
  allowDeletion,
  onAllowDeletionChange,
  passphrase,
  onPassphraseChange,
}: AdditionalOptionsProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Container>
      <Header>
        Additional Options
        <Divider />
        <ToggleButton onClick={() => setExpanded((v) => !v)} type="button">
          + Show / Hide
        </ToggleButton>
      </Header>
      {expanded && (
        <OptionsPanel>
          <PassphraseSection>
            <PassphraseLabel>Passphrase Lockdown</PassphraseLabel>
            <PassphraseInputWrapper>
              <LockIcon>🔒</LockIcon>
              <PassphraseInput
                type="password"
                value={passphrase}
                onChange={(e) => onPassphraseChange(e.target.value)}
                placeholder="Require recipients to enter a passphrase to view this password."
              />
            </PassphraseInputWrapper>
          </PassphraseSection>
          <OptionRow>
            <Checkbox
              type="checkbox"
              checked={allowDeletion}
              onChange={(e) => onAllowDeletionChange(e.target.checked)}
            />
            Allow viewers to delete this password before expiration
          </OptionRow>
        </OptionsPanel>
      )}
    </Container>
  )
}
