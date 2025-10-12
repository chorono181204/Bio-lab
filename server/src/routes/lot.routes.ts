import { Router } from 'express'
import passport from 'passport'
import { scopeByDepartment } from '../middleware/scopeDepartment'
import '../libs/auth/strategies/jwt.strategy'
import * as controller from '../controllers/lot.controller'

const router = Router()

// All routes require JWT auth and department scoping
router.use(passport.authenticate('jwt', { session: false }))
router.use(scopeByDepartment)

// GET /api/lots - List lots with pagination and search (supports ?options=true)
router.get('/', controller.list)

// GET /api/lots/:id - Get lot by ID
router.get('/:id', controller.getById)

// GET /api/lots/:id/machines - Get machines for this lot
router.get('/:id/machines', controller.getMachinesByLot)

// GET /api/lots/:id/qc-levels - Get QC levels for this lot
router.get('/:id/qc-levels', controller.getQcLevelsByLot)

// POST /api/lots - Create lot
router.post('/', controller.create)

// PUT /api/lots/:id - Update lot
router.put('/:id', controller.update)

// DELETE /api/lots/:id - Delete lot
router.delete('/:id', controller.remove)

export default router
