export interface PasswordOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  digits: boolean
  symbols: boolean
}

export const defaultPasswordOptions: PasswordOptions = {
  length: 48,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
}

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
} as const

export function generatePassword(options: PasswordOptions = defaultPasswordOptions): string {
  let charset = ''
  const required: string[] = []

  if (options.uppercase) {
    charset += CHAR_SETS.uppercase
    required.push(randomChar(CHAR_SETS.uppercase))
  }
  if (options.lowercase) {
    charset += CHAR_SETS.lowercase
    required.push(randomChar(CHAR_SETS.lowercase))
  }
  if (options.digits) {
    charset += CHAR_SETS.digits
    required.push(randomChar(CHAR_SETS.digits))
  }
  if (options.symbols) {
    charset += CHAR_SETS.symbols
    required.push(randomChar(CHAR_SETS.symbols))
  }

  if (charset.length === 0) {
    charset = CHAR_SETS.lowercase
  }

  const remaining = Math.max(0, options.length - required.length)
  const chars = [...required]

  const randomValues = new Uint32Array(remaining)
  crypto.getRandomValues(randomValues)

  for (let i = 0; i < remaining; i++) {
    chars.push(charset[randomValues[i] % charset.length])
  }

  return shuffle(chars).join('')
}

export type ScoreLabel = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'

export interface PasswordAnalysis {
  entropy: number
  score: ScoreLabel
  charCounts: {
    uppercase: number
    lowercase: number
    digits: number
    symbols: number
  }
  charsetSize: number
}

export function analyzePassword(password: string): PasswordAnalysis {
  const charCounts = { uppercase: 0, lowercase: 0, digits: 0, symbols: 0 }

  for (const ch of password) {
    if (/[A-Z]/.test(ch)) charCounts.uppercase++
    else if (/[a-z]/.test(ch)) charCounts.lowercase++
    else if (/[0-9]/.test(ch)) charCounts.digits++
    else charCounts.symbols++
  }

  let charsetSize = 0
  if (charCounts.uppercase > 0) charsetSize += 26
  if (charCounts.lowercase > 0) charsetSize += 26
  if (charCounts.digits > 0) charsetSize += 10
  if (charCounts.symbols > 0) charsetSize += 32

  const poolEntropy = password.length > 0 && charsetSize > 0
    ? password.length * Math.log2(charsetSize)
    : 0

  const shannonBits = calcShannonEntropy(password)
  const seqPenalty = calcSequentialPenalty(password)
  const ngramPenalty = calcNgramRepetitionPenalty(password)
  const commonPenalty = calcCommonPatternPenalty(password)

  const entropy = Math.max(
    0,
    Math.min(poolEntropy, shannonBits) * seqPenalty * ngramPenalty * commonPenalty,
  )

  let score: ScoreLabel
  if (entropy < 28) score = 'weak'
  else if (entropy < 36) score = 'fair'
  else if (entropy < 60) score = 'good'
  else if (entropy < 80) score = 'strong'
  else score = 'very-strong'

  return { entropy, score, charCounts, charsetSize }
}

// Shannon entropy: measures actual randomness based on character frequencies.
// A password like "aaaaaaa" gets ~0 bits; a uniformly distributed one gets close
// to the theoretical pool entropy.
function calcShannonEntropy(password: string): number {
  if (password.length === 0) return 0

  const freq = new Map<string, number>()
  for (const ch of password) {
    freq.set(ch, (freq.get(ch) || 0) + 1)
  }

  let bitsPerChar = 0
  const len = password.length
  for (const count of freq.values()) {
    const p = count / len
    bitsPerChar -= p * Math.log2(p)
  }

  return bitsPerChar * len
}

// Penalizes ascending/descending character runs like "abcdef" or "987654".
function calcSequentialPenalty(password: string): number {
  if (password.length < 3) return 1

  let seqCount = 0
  for (let i = 0; i < password.length - 2; i++) {
    const d1 = password.charCodeAt(i + 1) - password.charCodeAt(i)
    const d2 = password.charCodeAt(i + 2) - password.charCodeAt(i + 1)
    if (d1 === d2 && Math.abs(d1) === 1) {
      seqCount++
    }
  }

  const ratio = seqCount / (password.length - 2)
  return Math.max(0.2, 1 - ratio * 0.7)
}

// Penalizes repeated bigrams and trigrams (e.g. "abababab" or "xyzxyzxyz").
function calcNgramRepetitionPenalty(password: string): number {
  if (password.length < 6) return 1

  let penalty = 1
  for (const n of [2, 3]) {
    const ngrams = new Map<string, number>()
    for (let i = 0; i <= password.length - n; i++) {
      const gram = password.substring(i, i + n)
      ngrams.set(gram, (ngrams.get(gram) || 0) + 1)
    }

    const total = password.length - n + 1
    let repeated = 0
    for (const count of ngrams.values()) {
      if (count > 1) repeated += count - 1
    }

    const ratio = repeated / total
    penalty *= Math.max(0.2, 1 - ratio * 0.6)
  }

  return penalty
}

const COMMON_PATTERNS = [
  'password', 'qwerty', 'abc123', 'letmein', 'admin', 'welcome',
  'monkey', 'master', 'dragon', 'login', 'princess', 'football',
  'shadow', 'sunshine', 'trustno1', 'iloveyou', '123456', '12345678',
  'qwertyui', 'asdfgh', 'zxcvbn', '1q2w3e', 'pass', 'test',
  'hello', 'charlie', 'access', 'thunder', 'baseball', 'michael',
  'mustang', 'secret', 'superman', 'batman', 'starwars', 'killer',
]

// Penalizes passwords containing well-known dictionary words or patterns.
function calcCommonPatternPenalty(password: string): number {
  const lower = password.toLowerCase()
  let penalty = 1
  for (const pattern of COMMON_PATTERNS) {
    if (lower.includes(pattern)) {
      penalty *= 0.4
    }
  }
  return Math.max(0.1, penalty)
}

function randomChar(set: string): string {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return set[arr[0] % set.length]
}

function shuffle(arr: string[]): string[] {
  const result = [...arr]
  const randomValues = new Uint32Array(result.length)
  crypto.getRandomValues(randomValues)

  for (let i = result.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
