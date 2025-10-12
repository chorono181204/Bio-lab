import { Router } from 'express'
import * as controller from '../controllers/qcLevel.controller'
import passport from 'passport'

const router = Router()

router.use(passport.authenticate('jwt', { session: false }))

router.get('/', controller.list)
router.get('/:id', controller.getById)
router.post('/', controller.create)
router.put('/:id', controller.update)
router.delete('/:id', controller.remove)

export default router

