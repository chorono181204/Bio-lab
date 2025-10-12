import { Router } from 'express'
import passport from 'passport'
import { scopeByDepartment } from '../middleware/scopeDepartment'
import '../libs/auth/strategies/jwt.strategy'
import * as controller from '../controllers/analyte.controller'

const router = Router()

// All routes require JWT auth and department scoping
router.use(passport.authenticate('jwt', { session: false }))
router.use(scopeByDepartment)

// GET /api/analytes - List analytes with pagination and search (supports ?options=true)
router.get('/', controller.list)

// GET /api/analytes/:id - Get analyte by ID
router.get('/:id', controller.getById)

// POST /api/analytes - Create analyte
router.post('/', controller.create)

// PUT /api/analytes/:id - Update analyte
router.put('/:id', controller.update)

// DELETE /api/analytes/:id - Delete analyte
router.delete('/:id', controller.remove)

export default router
