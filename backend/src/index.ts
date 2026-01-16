import './types/express'
import express from 'express'
import dotenv from 'dotenv'
import { corsMiddleware } from './middleware/cors'
import { errorHandler } from './middleware/errorHandler'
import { authMiddleware } from './middleware/auth'
import authRouter from './routes/auth'
import assetsRouter from './routes/assets'
import holdingsRouter from './routes/holdings'
import pricesRouter from './routes/prices'
import portfolioRouter from './routes/portfolio'
import transactionsRouter from './routes/transactions'
import dashboardRouter from './routes/dashboard'
import snapshotsRouter from './routes/snapshots'
import onboardingRouter from './routes/onboarding'
import settingsRouter from './routes/settings'
import exchangeRatesRouter from './routes/exchangeRates'
import contributionsRouter from './routes/contributions'
import { exchangeRateService } from './services/exchangeRateService'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(corsMiddleware())
app.use(express.json())

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/assets', authMiddleware, assetsRouter)
app.use('/api/holdings', authMiddleware, holdingsRouter)
app.use('/api/prices', authMiddleware, pricesRouter)
app.use('/api/portfolio', authMiddleware, portfolioRouter)
app.use('/api/transactions', authMiddleware, transactionsRouter)
app.use('/api/dashboard', authMiddleware, dashboardRouter)
app.use('/api/snapshots', authMiddleware, snapshotsRouter)
app.use('/api/onboarding', authMiddleware, onboardingRouter)
app.use('/api/settings', authMiddleware, settingsRouter)
app.use('/api/exchange-rates', authMiddleware, exchangeRatesRouter)
app.use('/api/contributions', authMiddleware, contributionsRouter)

// Centralized error handler (must be last)
app.use(errorHandler)

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  // Preload exchange rates on startup
  await exchangeRateService.preloadRates()
})
