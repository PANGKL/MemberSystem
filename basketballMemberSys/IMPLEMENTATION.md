# 活動報名功能實現文檔

## 功能概述

已實現完整的活動報名系統，包括：
- **前端**：用戶可以瀏覽和報名各類活動、管理員可以建立/編輯/刪除活動
- **後端**：完整的 REST API 實現活動管理和報名功能
- **數據庫**：擴展 Activity 模型以支持完整的活動信息

---

## 後端實現

### 1. 數據庫架構（Schema 更新）

**文件**: `backend/prisma/schema.prisma`

在 Activity 模型中添加了以下字段：
- `date` (String): 活動日期，格式 YYYY-MM-DD
- `time` (String): 活動時間，格式 HH:MM
- `location` (String): 活動地點
- `price` (Float): 活動價格，默認 0（免費）

```prisma
model Activity {
  id            Int      @id @default(autoincrement())
  title         String
  type          String   // COMPETITION, TRAINING, SPECIAL_EVENT
  description   String?
  date          String   // YYYY-MM-DD format
  time          String   // HH:MM format
  location      String
  price         Float    @default(0)
  dateTime      DateTime
  maxParticipants Int
  currentParticipants Int @default(0)
  registrations Registration[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**遷移**: 已運行 `npx prisma migrate dev`，創建了新遷移 `20260227084020_add_activity_fields`

### 2. API 路由（活動管理）

**文件**: `backend/routes/activityRoutes.js`

實現的端點：

#### 公開端點
- `GET /api/activities/` - 獲取所有活動列表
- `GET /api/activities/:id` - 獲取單個活動詳情（包含報名列表）
- `POST /api/activities/:activityId/register` - 報名活動（需認證）

#### 管理員端點（需要 ADMIN 角色）
- `POST /api/activities/` - 建立新活動
- `PUT /api/activities/:id` - 編輯活動
- `DELETE /api/activities/:id` - 刪除活動

### 3. 用戶路由補充

**文件**: `backend/routes/userRoutes.js`

添加新端點：
- `GET /api/user/children` - 獲取當前用戶的孩子列表（用於報名時選擇）

---

## 前端實現

### 1. 活動報名頁面

**文件**: `frontend/src/views/Activities.vue`

功能特性：
- **活動展示**: 用卡片形式展示所有活動，支持按類型過濾
- **活動卡片包含信息**:
  - 活動名稱及類型標籤（比賽/訓練/特別活動）
  - 日期與時間
  - 地點
  - 價格（顯示免費標籤如果價格為 0）
  - 報名人數進度
  - 詳細描述
  
- **用戶交互**:
  - 報名按鈕：打開報名表單對話框
  - 詳情按鈕：顯示詳細信息和已報名的參與者列表
  - 按類型過濾：標籤頁支持全部、比賽、訓練、特別活動的過濾

- **報名功能**:
  - 選擇要報名的孩子
  - 輸入應急聯絡人信息
  - 驗證報名數據並提交

### 2. 活動管理頁面（管理員）

**文件**: `frontend/src/views/AdminActivities.vue`

功能特性：
- **活動列表標籤**: 表格顯示所有活動，支持編輯和刪除
  - 顯示活動名稱、類型、日期、時間、地點、價格
  - 人數進度條
  - 編輯/刪除按鈕
  
- **統計概覽標籤**: 
  - 統計卡片：總活動數、比賽數、訓練數、特別活動數
  - 報名分佈表：顯示各活動的報名進度
  
- **活動建立/編輯**:
  - 對話框表單支持：
    - 活動名稱
    - 活動類型（下拉選擇）
    - 日期（日期選擇器）
    - 時間（時間選擇器）
    - 地點
    - 價格（數字輸入）
    - 最大人數
    - 詳細描述（多行文本）
  - 驗證在提交前進行
  - 編輯時預填表單信息

### 3. 路由配置

**文件**: `frontend/src/router/index.js`

添加新路由：
```javascript
{
  path: 'activities',
  name: 'Activities',
  component: Activities  // 用戶活動報名頁
},
{
  path: 'admin/activities',
  name: 'AdminActivities',
  component: AdminActivities,  // 管理員活動管理頁
  meta: { requiresAdmin: true }
}
```

### 4. 導航布局更新

**文件**: `frontend/src/layouts/MainLayout.vue`

在頭部導航中添加：
- `活動報名` 鏈接（所有已認證用戶可見）
- `活動管理` 鏈接（僅管理員可見）

---

## 活動類型定義

支持三種活動類型：

| 類型代碼 | 中文名稱 | 徽章顏色 | 用途 |
|---------|---------|---------|------|
| COMPETITION | 比賽 | 紅色 | 官方比賽、錦標賽等 |
| TRAINING | 訓練 | 藍色 | 日常訓練課程 |
| SPECIAL_EVENT | 特別活動 | 綠色 | 友誼賽、社交活動等 |

---

## 使用流程

### 用戶（家長）報名活動

1. 登入系統
2. 點擊導航中的「活動報名」
3. 瀏覽活動卡片，支持按類型過濾
4. 選擇要報名的活動
5. 點擊「報名」按鈕
6. 選擇孩子並輸入緊急聯絡信息
7. 提交報名

### 管理員管理活動

1. 以管理員身份登入系統
2. 點擊導航中的「活動管理」
3. **查看活動列表**：
   - 列表標籤顯示所有活動
   - 點擊「編輯」修改活動信息
   - 點擊「刪除」刪除活動
4. **建立新活動**：
   - 點擊「建立新活動」按鈕
   - 填入所有活動信息
   - 點擊「建立」
5. **查看統計**：
   - 概覽標籤顯示活動統計
   - 查看各活動的報名分佈

---

## 技術棧

### 後端
- **框架**: Express.js
- **數據庫**: SQLite + Prisma ORM
- **認證**: JWT（JSON Web Tokens）
- **驗證**: 角色基權限控制（RBAC）

### 前端
- **框架**: Vue 3
- **UI 框架**: Element Plus
- **圖標**: Lucide Vue Next
- **HTTP 客戶端**: Axios
- **路由**: Vue Router
- **狀態管理**: Pinia（userStore）

---

## API 端點參考

### 活動相關

| 方法 | 端點 | 認證 | 角色 | 功能 |
|------|------|------|------|------|
| GET | `/api/activities/` | 否 | 任何 | 獲取活動列表 |
| GET | `/api/activities/:id` | 是 | 任何 | 獲取活動詳情 |
| POST | `/api/activities/` | 是 | ADMIN | 建立活動 |
| PUT | `/api/activities/:id` | 是 | ADMIN | 編輯活動 |
| DELETE | `/api/activities/:id` | 是 | ADMIN | 刪除活動 |
| POST | `/api/activities/:id/register` | 是 | 任何 | 報名活動 |

### 用戶相關

| 方法 | 端點 | 認證 | 功能 |
|------|------|------|------|
| GET | `/api/user/profile` | 是 | 獲取個人檔案 |
| GET | `/api/user/children` | 是 | 獲取孩子列表 |

---

## 文件修改清單

### 後端修改
- ✅ `backend/prisma/schema.prisma` - 更新 Activity 模型
- ✅ `backend/routes/activityRoutes.js` - 完整的活動 API 實現
- ✅ `backend/routes/userRoutes.js` - 添加 /children 端點
- ✅ `backend/prisma/migrations/20260227084020_add_activity_fields/` - 數據庫遷移

### 前端新建
- ✅ `frontend/src/views/Activities.vue` - 用戶活動報名頁
- ✅ `frontend/src/views/AdminActivities.vue` - 管理員活動管理頁

### 前端修改
- ✅ `frontend/src/router/index.js` - 添加活動相關路由
- ✅ `frontend/src/layouts/MainLayout.vue` - 添加導航鏈接

---

## 注意事項

1. **數據庫遷移**: 本地開發時已執行 Prisma 遷移，生產環境需要運行相同命令
2. **認證**: 所有管理功能都需要 ADMIN 角色，通過 JWT 令牌驗證
3. **權限控制**: 使用 authorizeRoles 中間件確保只有管理員可以執行 CRUD 操作
4. **數據驗證**: API 會驗證所有必填字段，前端也有相應的表單驗證
5. **時間格式**: 日期格式為 YYYY-MM-DD，時間格式為 HH:MM

---

## 測試建議

1. **創建測試活動**：
   - 至少創建一個比賽、一個訓練、一個特別活動
   - 測試不同的價格（免費和收費）

2. **測試報名流程**：
   - 以普通用戶身份報名活動
   - 驗證人數更新
   - 測試報名已滿的活動

3. **測試管理功能**：
   - 編輯活動信息
   - 刪除活動（應該清除相關報名記錄）

4. **測試權限**：
   - 確保非管理員無法訪問管理頁面
   - 驗證管理員可以訪問管理功能

---

## 未來改進建議

1. **支付集成**: 集成支付網關處理活動費用
2. **通知系統**: 報名成功後發送郵件/短信確認
3. **參與者簽到**: 在活動當天進行簽到功能
4. **評價系統**: 活動結束後收集參與者評價
5. **日曆視圖**: 在日曆上展示活動
6. **導出功能**: 導出報名名單（CSV/Excel）
7. **批量操作**: 支持批量刪除或修改活動

