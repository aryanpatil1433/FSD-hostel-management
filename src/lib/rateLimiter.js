const STORAGE_KEY = 'hcp_submission_history'
const LIMIT_COUNT = 3
const TIME_WINDOW_MS = 15 * 60 * 1000 // 15 minutes in milliseconds

/**
 * Retrieves the list of timestamps of previous submissions from localStorage
 * @returns {Array<{timestamp: number, phone: string, room: string}>}
 */
function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const now = Date.now()
    // Clean up expired entries older than the time window
    return parsed.filter(item => now - item.timestamp < TIME_WINDOW_MS)
  } catch {
    return []
  }
}

/**
 * Checks if the current client/phone is rate-limited
 * @param {string} phone
 * @param {string} room
 * @returns {{isLimited: boolean, remainingSeconds: number, count: number, max: number}}
 */
export function checkRateLimit(phone = '', room = '') {
  const history = getHistory()
  const now = Date.now()

  // Filter relevant recent submissions by phone or room
  const cleanPhone = phone.trim().replace(/\D/g, '')
  const recentMatching = history.filter(item => {
    const phoneMatch = cleanPhone && item.phone === cleanPhone
    const roomMatch = room.trim() && item.room.toLowerCase() === room.trim().toLowerCase()
    return phoneMatch || roomMatch
  })

  // Also check overall submissions from this browser
  const activeCount = Math.max(recentMatching.length, history.length)

  if (activeCount >= LIMIT_COUNT) {
    // Find the oldest record in the active window to determine when it expires
    const oldestTimestamp = Math.min(...history.map(h => h.timestamp))
    const elapsed = now - oldestTimestamp
    const remainingMs = Math.max(0, TIME_WINDOW_MS - elapsed)
    const remainingSeconds = Math.ceil(remainingMs / 1000)

    return {
      isLimited: true,
      remainingSeconds,
      count: activeCount,
      max: LIMIT_COUNT,
    }
  }

  return {
    isLimited: false,
    remainingSeconds: 0,
    count: activeCount,
    max: LIMIT_COUNT,
  }
}

/**
 * Records a successful submission in localStorage
 * @param {string} phone
 * @param {string} room
 */
export function recordSubmission(phone = '', room = '') {
  try {
    const history = getHistory()
    const cleanPhone = phone.trim().replace(/\D/g, '')
    history.push({
      timestamp: Date.now(),
      phone: cleanPhone,
      room: room.trim(),
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (err) {
    console.error('Failed to save rate limit history:', err)
  }
}

/**
 * Formats seconds into "Xm Ys" or "X minutes"
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatRemainingTime(totalSeconds) {
  if (totalSeconds <= 0) return '0s'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}
