/**
 * Simple in-memory rate limiter for authentication attempts
 * In production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

// Global storage for rate limit entries
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default configuration
const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes
};

/**
 * Check if an IP/identifier is rate limited
 * @param identifier - Usually IP address or user identifier
 * @param config - Optional configuration override
 * @returns true if rate limited, false otherwise
 */
export const isRateLimited = (
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG,
): boolean => {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    return false;
  }

  // Check if still blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    return true;
  }

  // Reset if window has passed
  if (now - entry.lastAttempt > config.windowMs) {
    rateLimitStore.delete(identifier);
    return false;
  }

  return entry.attempts >= config.maxAttempts;
};

/**
 * Record a failed attempt
 * @param identifier - Usually IP address or user identifier
 * @param config - Optional configuration override
 */
export const recordFailedAttempt = (
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG,
): void => {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier) || { attempts: 0, lastAttempt: now };

  // Reset if window has passed
  if (now - entry.lastAttempt > config.windowMs) {
    entry.attempts = 1;
  } else {
    entry.attempts++;
  }

  entry.lastAttempt = now;

  // Block if max attempts reached
  if (entry.attempts >= config.maxAttempts) {
    entry.blockedUntil = now + config.blockDurationMs;
  }

  rateLimitStore.set(identifier, entry);
};

/**
 * Record a successful attempt (resets the counter)
 * @param identifier - Usually IP address or user identifier
 */
export const recordSuccessfulAttempt = (identifier: string): void => {
  rateLimitStore.delete(identifier);
};

/**
 * Get remaining time until unblocked (in milliseconds)
 * @param identifier - Usually IP address or user identifier
 * @returns milliseconds until unblocked, or 0 if not blocked
 */
export const getTimeUntilUnblocked = (identifier: string): number => {
  const entry = rateLimitStore.get(identifier);
  if (!entry?.blockedUntil) {
    return 0;
  }

  const remaining = entry.blockedUntil - Date.now();
  return Math.max(0, remaining);
};

/**
 * Clean up old entries (should be called periodically)
 * @param config - Optional configuration override
 */
export const cleanupRateLimit = (config: RateLimitConfig = DEFAULT_CONFIG): void => {
  const now = Date.now();
  for (const [identifier, entry] of rateLimitStore.entries()) {
    if (
      (!entry.blockedUntil || now > entry.blockedUntil) &&
      now - entry.lastAttempt > config.windowMs
    ) {
      rateLimitStore.delete(identifier);
    }
  }
};

/**
 * Get current rate limit stats for debugging/monitoring
 * @param identifier - Usually IP address or user identifier
 * @returns Current rate limit entry or null
 */
export const getRateLimitStats = (identifier: string): RateLimitEntry | null => {
  return rateLimitStore.get(identifier) || null;
};

/**
 * Clear all rate limit entries (useful for testing)
 */
export const clearRateLimit = (): void => {
  rateLimitStore.clear();
};

/**
 * Start automatic cleanup interval
 * @param intervalMs - Cleanup interval in milliseconds (default: 10 minutes)
 * @returns The interval ID or null if setInterval is not available
 */
export const startCleanupInterval = (intervalMs = 10 * 60 * 1000): NodeJS.Timeout | null => {
  if (typeof setInterval !== 'undefined') {
    /* istanbul ignore next 3 */
    return setInterval(() => {
      cleanupRateLimit();
    }, intervalMs);
  }
  /* istanbul ignore next */
  return null;
};

/**
 * Convenience functions using default auth configuration
 */
export const authRateLimit = {
  isLimited: (identifier: string) => isRateLimited(identifier),
  recordFailed: (identifier: string) => recordFailedAttempt(identifier),
  recordSuccess: (identifier: string) => recordSuccessfulAttempt(identifier),
  getTimeRemaining: (identifier: string) => getTimeUntilUnblocked(identifier),
  getStats: (identifier: string) => getRateLimitStats(identifier),
  cleanup: () => cleanupRateLimit(),
  clear: () => clearRateLimit(),
  startCleanup: (intervalMs?: number) => startCleanupInterval(intervalMs),
};

// Start automatic cleanup every 10 minutes
/* istanbul ignore next */
startCleanupInterval();
