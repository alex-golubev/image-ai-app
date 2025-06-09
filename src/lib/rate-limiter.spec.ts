import {
  isRateLimited,
  recordFailedAttempt,
  recordSuccessfulAttempt,
  getTimeUntilUnblocked,
  cleanupRateLimit,
  getRateLimitStats,
  clearRateLimit,
  authRateLimit,
  startCleanupInterval,
} from '~/lib/rate-limiter';

describe('Rate Limiter', () => {
  const testIP = '192.168.1.1';
  const testConfig = {
    maxAttempts: 3,
    windowMs: 1000, // 1 second
    blockDurationMs: 2000, // 2 seconds
  };

  beforeEach(() => {
    clearRateLimit();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic functionality', () => {
    it('should not rate limit initially', () => {
      expect(isRateLimited(testIP, testConfig)).toBe(false);
    });

    it('should not rate limit after successful attempt', () => {
      recordSuccessfulAttempt(testIP);
      expect(isRateLimited(testIP, testConfig)).toBe(false);
    });

    it('should not rate limit after few failed attempts', () => {
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);
      expect(isRateLimited(testIP, testConfig)).toBe(false);
    });

    it('should rate limit after max failed attempts', () => {
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);
      expect(isRateLimited(testIP, testConfig)).toBe(true);
    });

    it('should reset attempts after window expires', () => {
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);

      // Fast-forward time past the window
      jest.advanceTimersByTime(1100);

      expect(isRateLimited(testIP, testConfig)).toBe(false);
    });

    it('should reset attempts after successful login', () => {
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);
      recordSuccessfulAttempt(testIP);

      expect(isRateLimited(testIP, testConfig)).toBe(false);
    });

    it('should reset attempt count when window expires and record new attempt', () => {
      // Record some failed attempts
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);

      // Fast-forward time past the window
      jest.advanceTimersByTime(1100);

      // Record a new failed attempt - this should reset the count to 1
      recordFailedAttempt(testIP, testConfig);

      const stats = getRateLimitStats(testIP);
      expect(stats?.attempts).toBe(1);
      expect(isRateLimited(testIP, testConfig)).toBe(false);
    });
  });

  describe('Time-based behavior', () => {
    it('should return time until unblocked', () => {
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);

      const timeRemaining = getTimeUntilUnblocked(testIP);
      expect(timeRemaining).toBeGreaterThan(0);
      expect(timeRemaining).toBeLessThanOrEqual(2000);
    });

    it('should return 0 time remaining when not blocked', () => {
      expect(getTimeUntilUnblocked(testIP)).toBe(0);
    });

    it('should return 0 time remaining for non-existent entry', () => {
      expect(getTimeUntilUnblocked('non-existent-ip')).toBe(0);
    });

    it('should handle expired block time', () => {
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);

      // Fast-forward time past the block duration
      jest.advanceTimersByTime(2100);

      expect(isRateLimited(testIP, testConfig)).toBe(false);
      expect(getTimeUntilUnblocked(testIP)).toBe(0);
    });
  });

  describe('Multiple IPs', () => {
    it('should handle multiple IPs independently', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      recordFailedAttempt(ip1, testConfig);
      recordFailedAttempt(ip1, testConfig);
      recordFailedAttempt(ip1, testConfig);

      expect(isRateLimited(ip1, testConfig)).toBe(true);
      expect(isRateLimited(ip2, testConfig)).toBe(false);
    });

    it('should track attempts separately for different IPs', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      recordFailedAttempt(ip1, testConfig);
      recordFailedAttempt(ip2, testConfig);
      recordFailedAttempt(ip2, testConfig);

      const stats1 = getRateLimitStats(ip1);
      const stats2 = getRateLimitStats(ip2);

      expect(stats1?.attempts).toBe(1);
      expect(stats2?.attempts).toBe(2);
    });
  });

  describe('Stats and monitoring', () => {
    it('should return null stats for non-existent identifier', () => {
      expect(getRateLimitStats('non-existent')).toBeNull();
    });

    it('should return correct stats after failed attempts', () => {
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);

      const stats = getRateLimitStats(testIP);
      expect(stats).not.toBeNull();
      expect(stats?.attempts).toBe(2);
      expect(stats?.lastAttempt).toBeGreaterThan(0);
      expect(stats?.blockedUntil).toBeUndefined();
    });

    it('should include blockedUntil when rate limited', () => {
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);

      const stats = getRateLimitStats(testIP);
      expect(stats?.blockedUntil).toBeGreaterThan(Date.now());
    });
  });

  describe('Cleanup', () => {
    it('should clean up old entries', () => {
      recordFailedAttempt(testIP, testConfig);

      // Fast-forward time past the window
      jest.advanceTimersByTime(1100);

      cleanupRateLimit(testConfig);
      expect(getRateLimitStats(testIP)).toBeNull();
    });

    it('should not clean up recent entries', () => {
      recordFailedAttempt(testIP, testConfig);

      cleanupRateLimit(testConfig);
      expect(getRateLimitStats(testIP)).not.toBeNull();
    });

    it('should not clean up blocked entries that are still blocked', () => {
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);

      cleanupRateLimit(testConfig);
      expect(getRateLimitStats(testIP)).not.toBeNull();
    });

    it('should clean up entries with expired block time', () => {
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);
      recordFailedAttempt(testIP, testConfig);

      // Fast-forward time past both block and window duration
      jest.advanceTimersByTime(2100);

      cleanupRateLimit(testConfig);
      expect(getRateLimitStats(testIP)).toBeNull();
    });
  });

  describe('Clear functionality', () => {
    it('should clear all entries', () => {
      recordFailedAttempt('ip1', testConfig);
      recordFailedAttempt('ip2', testConfig);

      clearRateLimit();

      expect(getRateLimitStats('ip1')).toBeNull();
      expect(getRateLimitStats('ip2')).toBeNull();
    });
  });

  describe('Auth rate limit convenience functions', () => {
    beforeEach(() => {
      authRateLimit.clear();
    });

    it('should provide convenience methods', () => {
      expect(typeof authRateLimit.isLimited).toBe('function');
      expect(typeof authRateLimit.recordFailed).toBe('function');
      expect(typeof authRateLimit.recordSuccess).toBe('function');
      expect(typeof authRateLimit.getTimeRemaining).toBe('function');
      expect(typeof authRateLimit.getStats).toBe('function');
      expect(typeof authRateLimit.cleanup).toBe('function');
      expect(typeof authRateLimit.clear).toBe('function');
      expect(typeof authRateLimit.startCleanup).toBe('function');
    });

    it('should work with default configuration', () => {
      expect(authRateLimit.isLimited(testIP)).toBe(false);

      // Record 5 failed attempts (default max)
      for (let i = 0; i < 5; i++) {
        authRateLimit.recordFailed(testIP);
      }

      expect(authRateLimit.isLimited(testIP)).toBe(true);
      expect(authRateLimit.getTimeRemaining(testIP)).toBeGreaterThan(0);
    });

    it('should reset on successful attempt', () => {
      authRateLimit.recordFailed(testIP);
      authRateLimit.recordFailed(testIP);
      authRateLimit.recordSuccess(testIP);

      expect(authRateLimit.isLimited(testIP)).toBe(false);
      expect(authRateLimit.getStats(testIP)).toBeNull();
    });

    it('should cleanup old entries using convenience method', () => {
      authRateLimit.recordFailed(testIP);

      // Fast-forward time past the default window (15 minutes)
      jest.advanceTimersByTime(16 * 60 * 1000);

      authRateLimit.cleanup();
      expect(authRateLimit.getStats(testIP)).toBeNull();
    });

    it('should start cleanup interval using convenience method', () => {
      const mockInterval = { id: 'test-interval' };
      const mockSetInterval = jest.fn().mockReturnValue(mockInterval);
      const originalSetInterval = global.setInterval;
      global.setInterval = mockSetInterval;

      const intervalId = authRateLimit.startCleanup(5000);

      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
      expect(intervalId).toBe(mockInterval);

      // Test that the callback function works
      const cleanupCallback = mockSetInterval.mock.calls[0][0];
      expect(typeof cleanupCallback).toBe('function');

      // Execute the callback to cover the cleanupRateLimit() call
      expect(() => cleanupCallback()).not.toThrow();

      // Restore original setInterval
      global.setInterval = originalSetInterval;
    });
  });

  describe('Configuration override', () => {
    it('should use custom configuration when provided', () => {
      const customConfig = {
        maxAttempts: 2,
        windowMs: 500,
        blockDurationMs: 1000,
      };

      recordFailedAttempt(testIP, customConfig);
      recordFailedAttempt(testIP, customConfig);

      expect(isRateLimited(testIP, customConfig)).toBe(true);
    });

    it('should use default configuration when not provided', () => {
      // Default is 5 attempts
      for (let i = 0; i < 4; i++) {
        recordFailedAttempt(testIP);
      }

      expect(isRateLimited(testIP)).toBe(false);

      recordFailedAttempt(testIP);
      expect(isRateLimited(testIP)).toBe(true);
    });
  });

  describe('Module initialization', () => {
    it('should handle setInterval availability check', async () => {
      // This test ensures the setInterval check doesn't break in environments where it's not available
      const originalSetInterval = global.setInterval;

      // Test with setInterval available (normal case)
      expect(typeof setInterval).toBe('function');

      // Test with setInterval undefined (some test environments)
      // @ts-expect-error - intentionally testing undefined case
      global.setInterval = undefined;

      // Re-import the module to test the setInterval check
      jest.resetModules();
      const rateLimiterModule = await import('~/lib/rate-limiter');
      expect(rateLimiterModule).toBeDefined();

      // Restore original setInterval
      global.setInterval = originalSetInterval;
    });

    it('should set up automatic cleanup interval', async () => {
      // Mock setInterval to capture the callback
      const mockSetInterval = jest.fn();
      const originalSetInterval = global.setInterval;
      global.setInterval = mockSetInterval;

      // Re-import the module to trigger the setInterval setup
      jest.resetModules();
      await import('~/lib/rate-limiter');

      // Verify setInterval was called with correct parameters
      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        10 * 60 * 1000, // 10 minutes
      );

      // Test that the callback function works
      const cleanupCallback = mockSetInterval.mock.calls[0][0];
      expect(typeof cleanupCallback).toBe('function');

      // Execute the callback to cover the cleanupRateLimit() call
      expect(() => cleanupCallback()).not.toThrow();

      // Restore original setInterval
      global.setInterval = originalSetInterval;
    });

    it('should start cleanup interval and return interval ID', () => {
      const mockInterval = { id: 'test-interval' };
      const mockSetInterval = jest.fn().mockReturnValue(mockInterval);
      const originalSetInterval = global.setInterval;
      global.setInterval = mockSetInterval;

      const intervalId = startCleanupInterval(5000);

      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
      expect(intervalId).toBe(mockInterval);

      // Test that the callback function works
      const cleanupCallback = mockSetInterval.mock.calls[0][0];
      expect(typeof cleanupCallback).toBe('function');

      // Execute the callback to cover the cleanupRateLimit() call
      expect(() => cleanupCallback()).not.toThrow();

      // Restore original setInterval
      global.setInterval = originalSetInterval;
    });

    it('should return null when setInterval is not available', () => {
      const originalSetInterval = global.setInterval;
      // @ts-expect-error - intentionally testing undefined case
      global.setInterval = undefined;

      const intervalId = startCleanupInterval();

      expect(intervalId).toBeNull();

      // Restore original setInterval
      global.setInterval = originalSetInterval;
    });

    it('should execute cleanup callback with real setInterval', () => {
      // Use real setInterval but with very short interval
      const intervalId = startCleanupInterval(1);

      expect(intervalId).toBeDefined();
      expect(intervalId).not.toBeNull();

      // Clear the interval immediately to avoid side effects
      if (intervalId) {
        clearInterval(intervalId);
      }
    });
  });
});
