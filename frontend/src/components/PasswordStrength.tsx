import { useMemo } from 'react'
import styled from '@emotion/styled'
import { theme } from '../theme'
import { analyzePassword, type ScoreLabel } from '../services/password'

interface PasswordStrengthProps {
  password: string
}

const CATEGORY_COLORS = {
  uppercase: '#3b82f6',
  lowercase: '#22c55e',
  digits: '#f59e0b',
  symbols: '#a855f7',
} as const

const CATEGORY_LABELS: Record<string, string> = {
  uppercase: 'Uppercase',
  lowercase: 'Lowercase',
  digits: 'Digits',
  symbols: 'Symbols',
}

const SCORE_CONFIG: Record<ScoreLabel, { label: string; color: string }> = {
  weak:          { label: 'Weak',        color: '#ef4444' },
  fair:          { label: 'Fair',        color: '#f97316' },
  good:          { label: 'Good',        color: '#eab308' },
  strong:        { label: 'Strong',      color: '#22c55e' },
  'very-strong': { label: 'Very Strong', color: '#10b981' },
}

const MAX_ENTROPY = 128

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`

const SectionLabel = styled.span`
  font-size: ${theme.font.sizeXs};
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const BarTrack = styled.div`
  width: 100%;
  height: 10px;
  border-radius: 5px;
  background: ${theme.colors.border};
  overflow: hidden;
  display: flex;
`

const BarSegment = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${(p) => p.width}%;
  background: ${(p) => p.color};
  transition: width 0.3s ease;
`

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm} ${theme.spacing.md};
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-size: ${theme.font.sizeXs};
  color: ${theme.colors.textMuted};
`

const LegendDot = styled.span<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.color};
  flex-shrink: 0;
`

const ScoreRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.xs};
`

const ScoreBarOuter = styled.div`
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: ${theme.colors.border};
  overflow: hidden;
`

const ScoreBarFill = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${(p) => p.width}%;
  background: ${(p) => p.color};
  border-radius: 4px;
  transition: width 0.3s ease, background 0.3s ease;
`

const EntropyText = styled.span`
  font-size: ${theme.font.sizeXs};
  color: ${theme.colors.textMuted};
  white-space: nowrap;
`

const ScoreBadge = styled.span<{ color: string }>`
  font-size: ${theme.font.sizeSm};
  font-weight: 700;
  color: ${(p) => p.color};
  white-space: nowrap;
`

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const analysis = useMemo(() => analyzePassword(password), [password])

  if (!password) return null

  const total = password.length
  const { charCounts, entropy, score } = analysis
  const scoreInfo = SCORE_CONFIG[score]
  const entropyPercent = Math.min(100, (entropy / MAX_ENTROPY) * 100)

  const segments = (Object.keys(CATEGORY_COLORS) as Array<keyof typeof CATEGORY_COLORS>)
    .filter((key) => charCounts[key] > 0)
    .map((key) => ({
      key,
      width: (charCounts[key] / total) * 100,
      color: CATEGORY_COLORS[key],
      count: charCounts[key],
    }))

  return (
    <Container>
      <SectionLabel>Character Distribution</SectionLabel>
      <BarTrack>
        {segments.map((seg) => (
          <BarSegment key={seg.key} width={seg.width} color={seg.color} />
        ))}
      </BarTrack>
      <Legend>
        {segments.map((seg) => (
          <LegendItem key={seg.key}>
            <LegendDot color={seg.color} />
            {CATEGORY_LABELS[seg.key]} ({seg.count})
          </LegendItem>
        ))}
      </Legend>

      <ScoreRow>
        <EntropyText>{Math.round(entropy)} bits of entropy</EntropyText>
        <ScoreBadge color={scoreInfo.color}>{scoreInfo.label}</ScoreBadge>
      </ScoreRow>
      <ScoreBarOuter>
        <ScoreBarFill width={entropyPercent} color={scoreInfo.color} />
      </ScoreBarOuter>
    </Container>
  )
}
