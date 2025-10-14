import { Router } from 'express'
import passport from 'passport'
import '../libs/auth/strategies/jwt.strategy'
import { scopeByDepartment } from '../middleware/scopeDepartment'
import * as controller from '../controllers/user.controller'

const router = Router()

// All routes require JWT auth only
router.use(passport.authenticate('jwt', { session: false }))

// Apply department scoping for non-admin users
router.use(scopeByDepartment)

// GET /api/users - List users with pagination and search
router.get('/', controller.list)

// GET /api/users/:id - Get user by ID
router.get('/:id', controller.getById)

// POST /api/users - Create user (admin only)
router.post('/', controller.create)

// PUT /api/users/profile - Update current user profile (MUST be before /:id route)
router.put('/profile', controller.updateProfile)

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', controller.update)

// PUT /api/users/:id/change-password - Change user password (admin only)
router.put('/:id/change-password', controller.changeUserPassword)

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', controller.remove)

export default router
