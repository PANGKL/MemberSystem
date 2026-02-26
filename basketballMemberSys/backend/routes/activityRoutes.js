import express from 'express'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import prisma from '../services/prisma.js'

const router = express.Router()

// 獲取活動列表 (Get Activities)
router.get('/', async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { dateTime: 'asc' }
    })
    res.json(activities)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// 報名活動 (Register for Activity)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { childId, activityId, emergencyContact, emergencyPhone } = req.body
    
    // 1. 檢查活動是否存在且未滿額
    const activity = await prisma.activity.findUnique({ where: { id: activityId } })
    if (!activity || activity.currentParticipants >= activity.maxParticipants) {
      return res.status(400).json({ message: '活動已滿或不存在 (Activity full or not found)' })
    }

    // 2. 建立報名記錄
    const registration = await prisma.registration.create({
      data: {
        userId: req.user.userId,
        childId,
        activityId,
        emergencyContact,
        emergencyPhone
      }
    })

    // 3. 更新活動人數
    await prisma.activity.update({
      where: { id: activityId },
      data: { currentParticipants: { increment: 1 } }
    })

    res.status(201).json({ message: '報名成功 (Registration success)', registration })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// 管理員：建立活動 (Admin: Create Activity)
router.post('/create', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { title, type, description, dateTime, maxParticipants } = req.body
    const activity = await prisma.activity.create({
      data: {
        title,
        type,
        description,
        dateTime: new Date(dateTime),
        maxParticipants
      }
    })
    res.status(201).json(activity)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
