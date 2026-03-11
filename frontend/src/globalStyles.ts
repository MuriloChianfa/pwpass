import { css } from '@emotion/react'
import { theme } from './theme'

export const globalStyles = css`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: ${theme.font.family};
    background-color: ${theme.colors.bg};
    color: ${theme.colors.text};
    line-height: 1.6;
    min-height: 100vh;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  a {
    color: ${theme.colors.primaryHover};
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    background: ${theme.colors.border};
    border-radius: 3px;
    outline: none;
    cursor: pointer;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${theme.colors.primary};
    border: 2px solid ${theme.colors.primaryHover};
    cursor: pointer;
    transition: background 0.15s;
  }

  input[type="range"]::-webkit-slider-thumb:hover {
    background: ${theme.colors.primaryHover};
  }

  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${theme.colors.primary};
    border: 2px solid ${theme.colors.primaryHover};
    cursor: pointer;
  }

  input[type="range"]::-moz-range-progress {
    background: ${theme.colors.primary};
    border-radius: 3px;
    height: 6px;
  }
`
