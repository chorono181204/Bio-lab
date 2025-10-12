import { Router } from 'express'
import passport from 'passport'
import { scopeByDepartment } from '../middleware/scopeDepartment'
import '../libs/auth/strategies/jwt.strategy'
import * as controller from '../controllers/violation.controller'

const router = Router()

// All routes require JWT auth and department scoping
router.use(passport.authenticate('jwt', { session: false }))
router.use(scopeByDepartment)

// GET /api/violations - List violations with filters
router.get('/', controller.list)

// GET /api/violations/:id - Get violation by ID
router.get('/:id', controller.getById)

// POST /api/violations - Create violation
router.post('/', controller.create)

// PUT /api/violations/:id - Update violation
router.put('/:id', controller.update)

// DELETE /api/violations/:id - Delete violation
router.delete('/:id', controller.remove)

export default router
