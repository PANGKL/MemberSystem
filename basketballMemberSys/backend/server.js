import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'crypto'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import activityRoutes from './routes/activityRoutes.js'
import childRoutes from './routes/childRoutes.js'

dotenv.config()

// Generate a random JWT secret on startup to force re-login for all users
process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
console.log('Generated new JWT_SECRET for session invalidation on startup.');

const app = express()
const PORT = process.env.PORT || 3000

// 中間件 (Middleware)
app.use(cors())
app.use(express.json())

// 路由 (Routes)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/children', childRoutes)

// 健康檢查 (Health Check)
app.get('/', (req, res) => {
  res.json({ message: 'Basketball Club API is running' })
})

// 錯誤處理中間件 (Global Error Handler)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: '服務器內部錯誤 (Internal Server Error)' })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})