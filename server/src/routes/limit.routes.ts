import { Router } from 'express'
import * as controller from '../controllers/limit.controller'
import passport from 'passport'
import { scopeByDepartment } from '../middleware/scopeDepartment'

const router = Router()

router.use(passport.authenticate('jwt', { session: false }))
router.use(scopeByDepartment)

router.get('/', controller.list)
router.get('/:id', controller.getById)
router.post('/', controller.create)
router.put('/:id', controller.update)
router.delete('/:id', controller.remove)

export default router