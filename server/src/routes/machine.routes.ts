import { Router } from 'express'
import passport from 'passport'
import { scopeByDepartment } from '../middleware/scopeDepartment'
import '../libs/auth/strategies/jwt.strategy'
import * as controller from '../controllers/machine.controller'

const router = Router()

// All routes require JWT auth and department scoping
router.use(passport.authenticate('jwt', { session: false }))
router.use(scopeByDepartment)

// GET /api/machines - List machines with pagination and search
router.get('/', controller.list)

// GET /api/machines/:id - Get machine by ID
router.get('/:id', controller.getById)

// POST /api/machines - Create machine
router.post('/', controller.create)

// PUT /api/machines/:id - Update machine
router.put('/:id', controller.update)

// DELETE /api/machines/:id - Delete machine
router.delete('/:id', controller.remove)

export default router
