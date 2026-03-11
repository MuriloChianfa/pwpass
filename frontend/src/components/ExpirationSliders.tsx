import styled from '@emotion/styled'
import { theme } from '../theme'

interface ExpirationSlidersProps {
  days: number
  views: number
  onDaysChange: (days: number) => void
  onViewsChange: (views: number) => void
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`

const Label = styled.label`
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.text};
  font-weight: 500;
`

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};

  input[type='range'] {
    flex: 1;
  }
`

const Value = styled.span`
  font-size: ${theme.font.sizeSm};
  color: ${theme.colors.textMuted};
  min-width: 60px;
  text-align: right;
  white-space: nowrap;
`

const Subtitle = styled.p`
  text-align: center;
  font-size: ${theme.font.sizeXs};
  color: ${theme.colors.textPlaceholder};
  font-style: italic;
`

export function ExpirationSliders({
  days,
  views,
  onDaysChange,
  onViewsChange,
}: ExpirationSlidersProps) {
  return (
    <Container>
      <Label>Expire this push and delete after:</Label>
      <SliderRow>
        <input
          type="range"
          min={1}
          max={30}
          value={days}
          onChange={(e) => onDaysChange(Number(e.target.value))}
        />
        <Value>
          {days} {days === 1 ? 'Day' : 'Days'}
        </Value>
      </SliderRow>
      <SliderRow>
        <input
          type="range"
          min={1}
          max={100}
          value={views}
          onChange={(e) => onViewsChange(Number(e.target.value))}
        />
        <Value>
          {views} {views === 1 ? 'View' : 'Views'}
        </Value>
      </SliderRow>
      <Subtitle>(whichever comes first)</Subtitle>
    </Container>
  )
}
