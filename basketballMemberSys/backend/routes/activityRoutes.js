import express from 'express'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import prisma from '../services/prisma.js'

const router = express.Router()

// 獲取活動列表 (Get All Activities)
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

// 獲取單個活動詳情 (Get Activity by ID)
router.get('/:id', async (req, res) => {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        registrations: {
          include: {
            user: {
              select: { id: true, username: true, name: true, email: true }
            },
            child: true
          }
        }
      }
    })
    if (!activity) {
      return res.status(404).json({ message: '活動未找到 (Activity not found)' })
    }
    res.json(activity)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// 報名活動 (Register for Activity)
router.post('/:activityId/register', authenticateToken, async (req, res) => {
  try {
    const { childId, emergencyContact, emergencyPhone } = req.body
    const activityId = parseInt(req.params.activityId)
    
    // 1. 檢查活動是否存在且未滿額
    const activity = await prisma.activity.findUnique({ where: { id: activityId } })
    if (!activity || activity.currentParticipants >= activity.maxParticipants) {
      return res.status(400).json({ message: '活動已滿或不存在 (Activity full or not found)' })
    }

    // 2. 檢查用戶是否已報名
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        userId: req.user.userId,
        childId: parseInt(childId),
        activityId: activityId
      }
    })
    if (existingRegistration) {
      return res.status(400).json({ message: '已報名此活動 (Already registered for this activity)' })
    }

    // 3. 建立報名記錄
    const registration = await prisma.registration.create({
      data: {
        userId: req.user.userId,
        childId: parseInt(childId),
        activityId: activityId,
        emergencyContact,
        emergencyPhone
      }
    })

    // 4. 更新活動人數
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
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { title, type, description, date, time, location, price, maxParticipants } = req.body
    
    // 驗證必填字段
    if (!title || !type || !date || !time || !location || maxParticipants === undefined) {
      return res.status(400).json({ message: '缺少必填字段 (Missing required fields)' })
    }

    // 組合 dateTime
    const dateTime = new Date(`${date}T${time}:00`)
    
    const activity = await prisma.activity.create({
      data: {
        title,
        type,
        description: description || '',
        date,
        time,
        location,
        price: parseFloat(price) || 0,
        dateTime,
        maxParticipants: parseInt(maxParticipants),
        currentParticipants: 0
      }
    })
    res.status(201).json({ message: '活動已建立 (Activity created)', activity })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// 管理員：更新活動 (Admin: Update Activity)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { title, type, description, date, time, location, price, maxParticipants } = req.body
    const id = parseInt(req.params.id)

    // 檢查活動是否存在
    const existingActivity = await prisma.activity.findUnique({ where: { id } })
    if (!existingActivity) {
      return res.status(404).json({ message: '活動未找到 (Activity not found)' })
    }

    // 組合 dateTime
    const dateTime = date && time ? new Date(`${date}T${time}:00`) : existingActivity.dateTime

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        title: title || existingActivity.title,
        type: type || existingActivity.type,
        description: description !== undefined ? description : existingActivity.description,
        date: date || existingActivity.date,
        time: time || existingActivity.time,
        location: location || existingActivity.location,
        price: price !== undefined ? parseFloat(price) : existingActivity.price,
        dateTime: dateTime,
        maxParticipants: maxParticipants !== undefined ? parseInt(maxParticipants) : existingActivity.maxParticipants
      }
    })
    res.json({ message: '活動已更新 (Activity updated)', activity })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// 管理員：刪除活動 (Admin: Delete Activity)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id)

    // 檢查活動是否存在
    const activity = await prisma.activity.findUnique({ where: { id } })
    if (!activity) {
      return res.status(404).json({ message: '活動未找到 (Activity not found)' })
    }

    // 刪除相關的報名記錄
    await prisma.registration.deleteMany({
      where: { activityId: id }
    })

    // 刪除活動
    await prisma.activity.delete({
      where: { id }
    })

    res.json({ message: '活動已刪除 (Activity deleted)' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
