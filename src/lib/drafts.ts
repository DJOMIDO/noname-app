// Lightweight localStorage-backed draft store for journey forms.
// A guest can fill the whole form, and when they hit "Save" we persist what
// they typed here before redirecting to login — so their effort survives the
// round-trip and is restored when they come back signed in.

const PREFIX = 'journey-draft'

export function saveDraft<T>(key: string, value: T): void {
    try {
        localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value))
    } catch {
        // Ignore quota / privacy-mode failures — a lost draft must not break saving.
    }
}

export function loadDraft<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(`${PREFIX}:${key}`)
        return raw ? (JSON.parse(raw) as T) : null
    } catch {
        return null
    }
}

export function clearDraft(key: string): void {
    try {
        localStorage.removeItem(`${PREFIX}:${key}`)
    } catch {
        // Nothing to clean up if storage is unavailable.
    }
}
