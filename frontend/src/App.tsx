import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Global } from '@emotion/react'
import styled from '@emotion/styled'
import { globalStyles } from './globalStyles'
import { theme } from './theme'
import { PushPage } from './pages/PushPage'
import { ViewPage } from './pages/ViewPage'

const Main = styled.main`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Footer = styled.footer`
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  border-top: 1px solid ${theme.colors.border};
  text-align: center;
  font-size: ${theme.font.sizeXs};
  color: ${theme.colors.textPlaceholder};
`

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Global styles={globalStyles} />
      <Main>
        <Routes>
          <Route path="/" element={<PushPage />} />
          <Route path="/:token" element={<ViewPage />} />
        </Routes>
      </Main>
      <Footer>NamedZeus | PWPass | Generate secure passwords and share them securely.</Footer>
    </BrowserRouter>
  )
}
