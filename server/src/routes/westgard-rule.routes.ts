import { Router } from 'express'
import passport from 'passport'
import { scopeByDepartment } from '../middleware/scopeDepartment'
import '../libs/auth/strategies/jwt.strategy'
import * as controller from '../controllers/westgard-rule.controller'

const router = Router()

// All routes require JWT auth and department scoping
router.use(passport.authenticate('jwt', { session: false }))
router.use(scopeByDepartment)

// GET /api/westgard-rules - List Westgard rules with pagination and search
router.get('/', controller.list)

// GET /api/westgard-rules/:id - Get Westgard rule by ID
router.get('/:id', controller.getById)

// POST /api/westgard-rules - Create Westgard rule
router.post('/', controller.create)

// PUT /api/westgard-rules/:id - Update Westgard rule
router.put('/:id', controller.update)

// DELETE /api/westgard-rules/:id - Delete Westgard rule
router.delete('/:id', controller.remove)

export default router
