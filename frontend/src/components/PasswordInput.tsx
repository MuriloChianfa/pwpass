import styled from '@emotion/styled'
import { theme } from '../theme'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
}

const Textarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: ${theme.spacing.md};
  background: ${theme.colors.inputBg};
  border: 1px solid ${theme.colors.inputBorder};
  border-radius: ${theme.radius.lg};
  color: ${theme.colors.text};
  font-family: 'Courier New', monospace;
  font-size: ${theme.font.sizeMd};
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;

  &::placeholder {
    color: ${theme.colors.textPlaceholder};
    font-family: ${theme.font.family};
  }

  &:focus {
    border-color: ${theme.colors.borderFocus};
  }
`

export function PasswordInput({ value, onChange }: PasswordInputProps) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter the password or text to push..."
    />
  )
}
