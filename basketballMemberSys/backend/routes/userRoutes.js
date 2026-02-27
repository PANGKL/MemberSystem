import express from 'express'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import prisma from '../services/prisma.js'
import bcrypt from 'bcryptjs'

const router = express.Router()

// 獲取個人檔案 (Get Profile)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { children: true }
    })
    if (!user) return res.status(404).json({ message: 'User not found' })
    const { password, ...userData } = user
    res.json(userData)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// 獲取用戶孩子列表 (Get User's Children)
router.get('/children', authenticateToken, async (req, res) => {
  try {
    const children = await prisma.child.findMany({
      where: { parentId: req.user.userId }
    })
    res.json(children)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GDPR: 導出個人資料 (Export Data)
router.get('/export-data', authenticateToken, async (req, res) => {
  try {
    const data = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { 
        children: true, 
        registrations: { include: { activity: true } },
        transactions: true 
      }
    })
    const { password, ...exportData } = data
    res.json({
      title: "GDPR Data Export",
      timestamp: new Date(),
      data: exportData
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GDPR: 刪除帳號 (Right to be forgotten)
router.delete('/purge-account', authenticateToken, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.user.userId } })
    res.json({ message: '帳號已根據 GDPR 要求永久刪除 (Account purged per GDPR)' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// 管理員：獲取所有用戶 (Admin: Get All Users)
router.get('/all', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { children: true },
      orderBy: { createdAt: 'desc' }
    })
    const usersWithoutPassword = users.map(user => {
      const { password, ...userData } = user
      return userData
    })
    res.json(usersWithoutPassword)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// 管理員：創建用戶 (Admin: Create User)
router.post('/create', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { username, email, password, name, phoneNumber, role } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword, name, phoneNumber, role }
    })
    res.status(201).json({ message: '用戶創建成功' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// 管理員：編輯用戶 (Admin: Update User)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const { username, name, email, phoneNumber, role, points, level } = req.body
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { username, name, email, phoneNumber, role, points: parseInt(points), level }
    })
    res.json({ message: '更新成功' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// 管理員：重設密碼 (Admin: Reset Password)
router.put('/:id/reset-password', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const { newPassword } = req.body
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword }
    })
    res.json({ message: '密碼已重設' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// 管理員：刪除用戶 (Admin: Delete User)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    await prisma.user.delete({ where: { id: parseInt(id) } })
    res.json({ message: '用戶已刪除' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
