import passport from 'passport'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'

const JWT_SECRET = 'biolab_secret_key'

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        console.log('🔐 JWT Strategy - Payload received:', payload)
        return done(null, payload)
      } catch (e) {
        console.error('🔐 JWT Strategy - Error:', e)
        return done(e, false)
      }
    }
  )
)

export {} // side-effect registration


