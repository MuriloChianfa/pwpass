import { useState } from 'react'
import styled from '@emotion/styled'
import { theme } from '../theme'
import {
  generatePassword,
  defaultPasswordOptions,
  type PasswordOptions,
} from '../services/password'

interface PasswordGeneratorProps {
  onGenerate: (password: string) => void
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`

const GenerateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  color: ${theme.colors.text};
  font-size: ${theme.font.sizeSm};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${theme.colors.surfaceHover};
    border-color: ${theme.colors.borderFocus};
  }
`

const SettingsPanel = styled.div`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.lg};
  padding: ${theme.spacing.md};
`

const SettingsTitle = styled.h4`
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.textMuted};
  margin-bottom: ${theme.spacing.md};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const OptionRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.xs} 0;
  cursor: pointer;
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.text};
`

const LengthRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.xs} 0;
  margin-bottom: ${theme.spacing.sm};

  label {
    font-size: ${theme.font.sizeSm};
    color: ${theme.colors.text};
    min-width: 52px;
  }

  input[type='range'] {
    flex: 1;
  }

  span {
    font-size: ${theme.font.sizeSm};
    color: ${theme.colors.textMuted};
    min-width: 28px;
    text-align: right;
  }
`

const Checkbox = styled.input`
  accent-color: ${theme.colors.primary};
  width: 16px;
  height: 16px;
  cursor: pointer;
`

export function PasswordGenerator({ onGenerate }: PasswordGeneratorProps) {
  const [options, setOptions] = useState<PasswordOptions>(defaultPasswordOptions)

  const handleGenerate = () => {
    onGenerate(generatePassword(options))
  }

  const toggleOption = (key: keyof Omit<PasswordOptions, 'length'>) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Container>
      <GenerateButton onClick={handleGenerate} type="button">
        <span>🔐</span> Generate a new password
      </GenerateButton>

      <SettingsPanel>
        <SettingsTitle>Generator Settings</SettingsTitle>
        <LengthRow>
          <label>Length</label>
          <input
            type="range"
            min={8}
            max={64}
            value={options.length}
            onChange={(e) =>
              setOptions((prev) => ({ ...prev, length: Number(e.target.value) }))
            }
          />
          <span>{options.length}</span>
        </LengthRow>
        <OptionRow>
          Uppercase (A-Z)
          <Checkbox
            type="checkbox"
            checked={options.uppercase}
            onChange={() => toggleOption('uppercase')}
          />
        </OptionRow>
        <OptionRow>
          Lowercase (a-z)
          <Checkbox
            type="checkbox"
            checked={options.lowercase}
            onChange={() => toggleOption('lowercase')}
          />
        </OptionRow>
        <OptionRow>
          Digits (0-9)
          <Checkbox
            type="checkbox"
            checked={options.digits}
            onChange={() => toggleOption('digits')}
          />
        </OptionRow>
        <OptionRow>
          Symbols (!@#...)
          <Checkbox
            type="checkbox"
            checked={options.symbols}
            onChange={() => toggleOption('symbols')}
          />
        </OptionRow>
      </SettingsPanel>
    </Container>
  )
}
