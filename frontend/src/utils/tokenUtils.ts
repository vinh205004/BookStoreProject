/**
 * Decode JWT token và lấy claims.
 * JWT format: header.payload.signature
 * Payload là base64url encoded JSON.
 */
export const decodeToken = (token: string): Record<string, string | number | boolean> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const normalizedPayload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

    const payload = JSON.parse(atob(normalizedPayload));
    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Lấy User ID từ JWT token.
 */
export const getCurrentUserId = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  const userId = payload.UserId;
  return typeof userId === 'string' ? userId : null;
};

/**
 * Lấy User Role từ JWT token.
 */
export const getUserRole = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role;
  return typeof role === 'string' ? role : null;
};
