import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// 載入環境變數
dotenv.config()

const prisma = new PrismaClient()

export default prisma
