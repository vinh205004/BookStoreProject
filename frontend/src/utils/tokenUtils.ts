/**
 * Decode JWT token và lấy claims
 * JWT format: header.payload.signature
 * Payload là base64 encoded JSON
 */
export const decodeToken = (token: string): Record<string, string | number | boolean> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode payload (base64)
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Lấy User ID từ JWT token
 */
export const getCurrentUserId = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  // JWT token chứa "UserId" claim
  const userId = payload['UserId'];
  return typeof userId === 'string' ? userId : null;
};

/**
 * Lấy User Role từ JWT token
 */
export const getUserRole = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload['role'];
  return typeof role === 'string' ? role : null;
};
