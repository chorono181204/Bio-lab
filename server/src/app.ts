import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import passport from 'passport'
import authRoutes from './routes/auth.routes'
import analyteRoutes from './routes/analyte.routes'
import lotRoutes from './routes/lot.routes'
import machineRoutes from './routes/machine.routes'
import qcLevelRoutes from './routes/qcLevel.routes'
import limitRoutes from './routes/limit.routes'
import entryRoutes from './routes/entry.routes'
import violationRoutes from './routes/violation.routes'
import westgardRuleRoutes from './routes/westgard.routes'
import biasMethodRoutes from './routes/bias-method.routes'
import departmentRoutes from './routes/department.routes'
import userRoutes from './routes/user.routes'
import formRoutes from './routes/form.routes'
import lookupRoutes from './routes/lookup.routes'
import { authErrorHandler } from './middleware/authErrorHandler'
import { errorLogger } from './middleware/errorLogger'

export function createApp() {
  const app = express()
  
  // CORS configuration
  app.use(cors({
    origin: true,  // Chấp nhận tất cả origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }))
  
  app.use(express.json())
  app.use(helmet())
  app.use(morgan('dev'))
  app.use(passport.initialize())

  app.get('/health', (_req, res) => res.json({ ok: true }))
  app.use('/api/auth', authRoutes)
  app.use('/api/lookups', lookupRoutes)
  app.use('/api/analytes', analyteRoutes)
  app.use('/api/lots', lotRoutes)
  app.use('/api/machines', machineRoutes)
  app.use('/api/qc-levels', qcLevelRoutes)
  app.use('/api/limits', limitRoutes)
  app.use('/api/entries', entryRoutes)
  app.use('/api/violations', violationRoutes)
  app.use('/api/westgard-rules', westgardRuleRoutes)
  app.use('/api/bias-methods', biasMethodRoutes)
  app.use('/api/departments', departmentRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/forms', formRoutes)
  app.use('/api/entries', entryRoutes)

  // Error handling middleware
  app.use(authErrorHandler)
  
  // Error logger middleware
  app.use(errorLogger)
  
  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message || 'Internal server error'
      }
    })
  })

  return app
}



