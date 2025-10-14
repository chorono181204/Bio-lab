import { Router } from 'express'
import passport from 'passport'
import { requireRole } from '../middleware/requireRole'
import '../libs/auth/strategies/jwt.strategy'
import * as controller from '../controllers/department.controller'

const router = Router()

// All routes require JWT auth and admin/manager role
router.use(passport.authenticate('jwt', { session: false }))


// GET /api/departments - List departments with pagination and search
router.get('/', controller.list)

// GET /api/departments/:id - Get department by ID
router.get('/:id', controller.getById)

// POST /api/departments - Create department (admin only)
router.post('/', controller.create)

// PUT /api/departments/:id - Update department (admin only)
router.put('/:id', controller.update)

// DELETE /api/departments/:id - Delete department (admin only)
router.delete('/:id', controller.remove)

export default router







