import styled from '@emotion/styled'
import { theme } from '../theme'

const Panel = styled.div`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.lg};
  padding: ${theme.spacing.lg};
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`

const Title = styled.h4`
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: ${theme.spacing.md};
`

const List = styled.ul`
  list-style: disc;
  padding-left: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`

const Item = styled.li`
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.textMuted};
  line-height: 1.5;

  a {
    color: ${theme.colors.primaryHover};
    text-decoration: underline;
    text-decoration-color: transparent;
    transition: text-decoration-color 0.2s;

    &:hover {
      text-decoration-color: currentColor;
    }
  }
`

export function InfoPanel() {
  return (
    <Panel>
      <Title>About Password Strength</Title>
      <List>
        <Item>
          <strong>Entropy</strong> measures how unpredictable a password is, <a href="https://en.wikipedia.org/wiki/Entropy_(information_theory)" target="_blank" rel="noopener noreferrer">bits of information</a>.
          More bits means exponentially secure.
        </Item>
        <Item>
          A password with <strong>80+ bits</strong> of entropy is considered resistant
          to brute-force attacks, even with modern hardware. Below 28 bits, it's considered weak.
        </Item>
        <Item>
          The <strong>character distribution</strong> chart shows the mix of uppercase,
          lowercase, digits, and symbols. A more uniform spread increases randomness.
        </Item>
        <Item>
          Repeated characters, sequential runs, and{' '}
          <a href="https://en.wikipedia.org/wiki/N-gram" target="_blank" rel="noopener noreferrer">n-gram</a> patterns
          reduce effective entropy, penalizing the actual score.
        </Item>
        <Item>
          Avoid common words and known passwords, attackers use{' '}
          <a href="https://en.wikipedia.org/wiki/Dictionary_attack" target="_blank" rel="noopener noreferrer">dictionary attacks</a>{' '}
          before attempting brute force.
        </Item>
        <Item>
          Upon expiration, all content associated with the password is deleted.
        </Item>
      </List>
    </Panel>
  )
}
