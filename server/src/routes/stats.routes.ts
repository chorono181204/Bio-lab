import { Router } from 'express'
import passport from 'passport'
import '../libs/auth/strategies/jwt.strategy'
import { getStats } from '../controllers/stats.controller'
import { scopeByDepartment } from '../middleware/scopeDepartment'

const router = Router()

// All routes require JWT auth and department scoping
router.use(passport.authenticate('jwt', { session: false }))
router.use(scopeByDepartment)

router.get('/', getStats)

export default router
