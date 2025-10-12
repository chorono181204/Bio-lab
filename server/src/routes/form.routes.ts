import { Router } from 'express'
import passport from 'passport'
import * as controller from '../controllers/form.controller'

const router = Router()

// Apply JWT authentication to all routes
router.use(passport.authenticate('jwt', { session: false }))

// GET /api/forms - Get all forms with filters
router.get('/', controller.getAll)

// GET /api/forms/:id - Get form by ID
router.get('/:id', controller.getById)

// POST /api/forms - Create form
router.post('/', controller.create)

// PUT /api/forms/:id - Update form
router.put('/:id', controller.update)

// DELETE /api/forms/:id - Delete form
router.delete('/:id', controller.remove)

export default router






