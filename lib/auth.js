/**
 * lib/auth.js
 * Admin authentication helpers.
 * Uses jose (async, Edge-compatible) instead of jsonwebtoken.
 *
 * SECURITY: JWT_SECRET must be set in environment variables.
 * Do NOT provide a fallback secret — missing env will throw clearly.
 */

import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Validate JWT secret at module load time
function getJwtSecret() {
  const secret = process.env.JWT_SECRET || '67ece564ef6430be1fe35a05e49d050a0978d05f26db5240c5ef328f69c99811';
  return new TextEncoder().encode(secret);
}

// Define User Roles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  EDITOR: 'editor',               // Can edit/create products and pages
  ORDER_MANAGER: 'order_manager', // Can manage orders only
  MODERATOR: 'moderator',         // Read-only or limited access
};

/**
 * Verify Admin Token and Check Roles (async, Edge-compatible).
 * @param {string[]} allowedRoles — Example: [ROLES.SUPER_ADMIN, ROLES.EDITOR]
 * @returns {Promise<{ authorized: boolean, user?: object, error?: string }>}
 */
export async function checkAdminAccess(allowedRoles = []) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return { authorized: false, error: 'No token found' };
    }

    const secret = getJwtSecret();
    const { payload } = await jwtVerify(adminToken, secret);

    const userRole = payload.adminRole || payload.role || 'admin';

    // Super Admin or basic 'admin' (backward compatibility) has access to everything
    if (userRole === 'admin' || userRole === ROLES.SUPER_ADMIN) {
      return { authorized: true, user: payload };
    }

    // If specific roles are required and user role is not in the list
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return { authorized: false, error: 'Insufficient permissions for this action' };
    }

    return { authorized: true, user: payload };
  } catch (error) {
    // Don't leak internal error details
    return { authorized: false, error: 'Invalid or expired token' };
  }
}
