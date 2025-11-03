import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    role: string
  }
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

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
      role: string
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
