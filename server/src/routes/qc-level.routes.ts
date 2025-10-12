import { Router } from 'express'
import passport from 'passport'
import { scopeByDepartment } from '../middleware/scopeDepartment'
import '../libs/auth/strategies/jwt.strategy'
import * as controller from '../controllers/qc-level.controller'

const router = Router()

// All routes require JWT auth and department scoping
router.use(passport.authenticate('jwt', { session: false }))
router.use(scopeByDepartment)

// GET /api/qc-levels - List QC levels with pagination and search
router.get('/', controller.list)

// GET /api/qc-levels/:id - Get QC level by ID
router.get('/:id', controller.getById)

// POST /api/qc-levels - Create QC level
router.post('/', controller.create)

// PUT /api/qc-levels/:id - Update QC level
router.put('/:id', controller.update)

// DELETE /api/qc-levels/:id - Delete QC level
router.delete('/:id', controller.remove)

export default router
