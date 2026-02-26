import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../services/prisma.js'

const router = express.Router()

// 註冊 (Register)
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request body:', req.body)
    const { username, email, password, name, phoneNumber } = req.body
    
    if (!username || !password || !name) {
      return res.status(400).json({ message: '請填寫所有必填欄位 (Please fill all required fields)' })
    }

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ message: '用戶名已被使用 (Username already exists)' })
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } })
      if (existingEmail) {
        return res.status(400).json({ message: '郵箱已被註冊 (Email already exists)' })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        phoneNumber,
        role: 'PARENT'
      }
    })

    console.log('User created successfully:', user.username)
    res.status(201).json({ message: '註冊成功 (Registration successful)' })
  } catch (error) {
    console.error('Registration error detail:', error)
    res.status(500).json({ message: error.message || '註冊失敗 (Registration failed)' })
  }
})

// 登入 (Login)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await prisma.user.findUnique({ where: { username } })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: '用戶名或密碼錯誤 (Invalid username or password)' })
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        level: user.level
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
