// Simple in-memory session store for admin sessions with expiration

interface AdminSession {
  token: string;
  expiresAt: number;
}

const adminSessions = new Map<string, AdminSession>();
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds


export function addAdminSession(token: string): boolean {
 
  const expiresAt = Date.now() + SESSION_DURATION;
  adminSessions.set(token, { token, expiresAt });
  return true;
}

export function hasAdminSession(token: string): boolean {
  const session = adminSessions.get(token);
  if (!session) return false;

  // Check if session has expired
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    return false;
  }

  return true;
}

export function removeAdminSession(token: string) {
  adminSessions.delete(token);
}