import { Router } from 'express'
import passport from 'passport'
import '../libs/auth/strategies/jwt.strategy'
import { login, me } from '../controllers/auth.controller'

const router = Router()

router.post('/login', login)
router.get('/me', passport.authenticate('jwt', { session: false }), me)

export default router


