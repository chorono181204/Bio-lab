import { Router } from 'express'
import * as entryController from '../controllers/entry.controller'
import passport from 'passport'
import { scopeByDepartment } from '../middleware/scopeDepartment'

const router = Router()

router.use(passport.authenticate('jwt', { session: false }))
router.use(scopeByDepartment)

// Entry routes
router.get('/', entryController.list)
router.get('/:id', entryController.getById)
router.post('/', entryController.create)
router.put('/:id', entryController.update)
router.delete('/:id', entryController.remove)

export default router