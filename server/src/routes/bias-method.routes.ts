import { Router } from 'express'
import passport from 'passport'
import { scopeByDepartment } from '../middleware/scopeDepartment'
import '../libs/auth/strategies/jwt.strategy'
import * as controller from '../controllers/bias-method.controller'

const router = Router()

// All routes require JWT auth and department scoping
router.use(passport.authenticate('jwt', { session: false }))
router.use(scopeByDepartment)

// GET /api/bias-methods - List bias methods with pagination and search
router.get('/', controller.list)

// GET /api/bias-methods/:id - Get bias method by ID
router.get('/:id', controller.getById)

// POST /api/bias-methods - Create bias method
router.post('/', controller.create)

// PUT /api/bias-methods/:id - Update bias method
router.put('/:id', controller.update)

// DELETE /api/bias-methods/:id - Delete bias method
router.delete('/:id', controller.remove)

export default router
