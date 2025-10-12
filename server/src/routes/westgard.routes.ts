import { Router } from 'express'
import * as westgardController from '../controllers/westgard.controller'
import passport from 'passport'

const router = Router()

router.use(passport.authenticate('jwt', { session: false }))

// Westgard rule routes
router.get('/', westgardController.list)
router.get('/options', westgardController.getOptions)
router.get('/:id', westgardController.getById)
router.post('/', westgardController.create)
router.put('/:id', westgardController.update)
router.delete('/:id', westgardController.remove)

export default router
