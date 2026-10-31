/**
 * Resonance Design System — Unresolved Submission Persistence Utility
 *
 * Provides persistent client-side protection for unconfirmed metadata creations:
 * - Survives modal dismissal, route navigation, and page refreshes indefinitely (NO TTL EXPIRY)
 * - Retains timestamp for age display without silently removing duplicate protection
 * - Dismissing the notification banner hides the banner but preserves the underlying unresolved record
 * - A new metadata submission is blocked while an unresolved record is active
 * - Cleared strictly when the original record is positively identified on the server
 *
 * Note: Client-side persistence tracks unconfirmed attempts across browser sessions,
 * but does not constitute a backend idempotency guarantee.
 */

const STORAGE_KEY = 'resonance_unresolved_submission'

export function getUnresolvedSubmission() {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    if (!data.title || !data.genre) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return data
  } catch (err) {
    console.warn('Failed to parse unresolved submission from storage:', err)
    return null
  }
}

export function hasUnresolvedSubmission() {
  return Boolean(getUnresolvedSubmission())
}

export function setUnresolvedSubmission({ title, genre, dispatchedAt, bannerDismissed = false }) {
  if (typeof window === 'undefined') return

  try {
    const existing = getUnresolvedSubmission()
    const payload = {
      title: title.trim(),
      genre: genre.trim(),
      dispatchedAt: Number(dispatchedAt) || existing?.dispatchedAt || Date.now(),
      timestamp: existing?.timestamp || Date.now(),
      bannerDismissed: Boolean(bannerDismissed),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (err) {
    console.warn('Failed to save unresolved submission to storage:', err)
  }
}

export function dismissUnresolvedBanner() {
  if (typeof window === 'undefined') return

  try {
    const existing = getUnresolvedSubmission()
    if (!existing) return

    const payload = {
      ...existing,
      bannerDismissed: true,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (err) {
    console.warn('Failed to dismiss unresolved banner in storage:', err)
  }
}

export function clearUnresolvedSubmission() {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.warn('Failed to clear unresolved submission from storage:', err)
  }
}

export function formatUnresolvedAge(timestamp) {
  if (!timestamp || typeof timestamp !== 'number') return 'recently'
  const elapsedMinutes = Math.floor((Date.now() - timestamp) / 60000)
  if (elapsedMinutes < 1) return 'just now'
  if (elapsedMinutes === 1) return '1 minute ago'
  if (elapsedMinutes < 60) return `${elapsedMinutes} minutes ago`
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours === 1) return '1 hour ago'
  return `${elapsedHours} hours ago`
}
