const TIMESTAMP_WINDOW_MS = 10 * 60 * 1000;

export function generateMetaStateToken(userId: string): string {
  const timestamp = Date.now().toString();
  const data = `${userId}:${timestamp}`;

  return btoa(data);
}

export function verifyMetaStateToken(token: string, userId: string): boolean {
  try {
    const decoded = atob(token);
    const [storedUserId, timestampStr] = decoded.split(':');

    if (storedUserId !== userId) {
      return false;
    }

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const timeDiff = Math.abs(now - timestamp);

    if (timeDiff > TIMESTAMP_WINDOW_MS) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
