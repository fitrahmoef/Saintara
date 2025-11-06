import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserRole } from '../types/institution.types'

export interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    role: UserRole
    institution_id?: number
    permissions?: string[]
  }
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Try to get token from cookies first (preferred), then fall back to Authorization header
  let token = req.cookies?.accessToken

  // Fallback to Authorization header for backward compatibility
  if (!token) {
    const authHeader = req.headers['authorization']
    token = authHeader && authHeader.split(' ')[1]
  }

  if (!token) {
    res.status(401).json({
      status: 'error',
      message: 'Access token required',
    })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number
      email: string
      role: UserRole
      institution_id?: number
      permissions?: string[]
    }
    req.user = decoded
    next()
  } catch (error) {
    res.status(403).json({
      status: 'error',
      message: 'Invalid or expired token',
    })
    return
  }
}

export const authorizeRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'Access denied',
      })
      return
    }
    next()
  }
}

// Alternative version that accepts array parameter
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'Access denied',
      })
      return
    }
    next()
  }
}

// Alias for backward compatibility
export const authenticate = authenticateToken

/**
 * Middleware to check if user has a specific permission
 */
export const requirePermission = (permissionCode: string, scope: 'own' | 'institution' | 'all' = 'own') => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      })
      return
    }

    const { checkUserPermission } = await import('../utils/permission.utils')

    const hasPermission = await checkUserPermission(
      req.user.id,
      permissionCode,
      scope,
      req.params.institutionId ? parseInt(req.params.institutionId) : undefined
    )

    if (!hasPermission) {
      res.status(403).json({
        status: 'error',
        message: `Permission denied: ${permissionCode}`,
      })
      return
    }

    next()
  }
}

/**
 * Middleware to check if user can access a specific institution
 */
export const requireInstitutionAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    })
    return
  }

  const targetInstitutionId = parseInt(req.params.institutionId || req.body.institution_id)

  if (!targetInstitutionId) {
    res.status(400).json({
      status: 'error',
      message: 'Institution ID required',
    })
    return
  }

  // Superadmin can access all institutions
  if (req.user.role === 'superadmin') {
    next()
    return
  }

  // Other roles must be part of the institution
  if (req.user.institution_id !== targetInstitutionId) {
    res.status(403).json({
      status: 'error',
      message: 'Access denied to this institution',
    })
    return
  }

  next()
}

/**
 * Middleware to check if user is admin-level (superadmin, institution_admin, or admin)
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    })
    return
  }

  const adminRoles: UserRole[] = ['superadmin', 'institution_admin', 'admin']

  if (!adminRoles.includes(req.user.role)) {
    res.status(403).json({
      status: 'error',
      message: 'Admin access required',
    })
    return
  }

  next()
}

/**
 * Middleware to check if user is superadmin
 */
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    })
    return
  }

  if (req.user.role !== 'superadmin') {
    res.status(403).json({
      status: 'error',
      message: 'Superadmin access required',
    })
    return
  }

  next()
}
