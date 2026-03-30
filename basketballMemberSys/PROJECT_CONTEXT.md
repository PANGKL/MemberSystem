# Basketball Member System - Project Context

## 專案概述

這是一個**籃球俱樂部會員管理系統**，採用前後端分離架構，提供完整的會員管理、活動報名、積分系統等功能。

## 技術棧

### 後端 (Django REST Framework)
- **框架**: Django 6.0.2
- **REST API**: Django REST Framework
- **認證**: Simple JWT (JSON Web Token)
- **數據庫**: SQLite3
- **CORS**: django-cors-headers
- **文件上傳**: Django 內建文件處理

### 前端 (Vue 3)
- **框架**: Vue 3 (Composition API)
- **構建工具**: Vite 8.0.0-beta
- **路由**: Vue Router 5
- **狀態管理**: Pinia 3
- **UI 框架**: 
  - Element Plus (主要 UI 組件)
  - Vuestic UI (輔助 UI 組件)
  - Tailwind CSS (樣式工具)
- **圖標**: Lucide Vue Next
- **HTTP 客戶端**: Axios
- **測試**: Vitest + Vue Test Utils
- **故事書**: Storybook (組件文檔化)

## 系統架構

```
┌─────────────────────────────────────────────────┐
│          前端 (Vue 3 + Vite)                      │
│  - 會員介面 (MainLayout)                         │
│  - 管理員介面 (AdminLayout)                      │
│  - 活動報名頁面 (Activities.vue)                 │
│  - 個人檔案頁面 (Profile.vue)                    │
│  - 後台管理頁面 (UserMgmt, ClassMgmt, etc.)      │
└──────────────────────────────────────────────────┘
                      ↓ (HTTP + JWT Bearer)
┌──────────────────────────────────────────────────┐
│         後端 (Django REST Framework)              │
│  - 用戶認證 (JWT)                                 │
│  - RESTful API 端點                               │
│  - 權限控制                                       │
│  - 文件上傳處理                                   │
└──────────────────────────────────────────────────┘
                      ↓ (ORM)
┌──────────────────────────────────────────────────┐
│    數據庫 (SQLite3)                               │
│  - 用戶表 (User)                                  │
│  - 學員表 (Child)                                 │
│  - 活動表 (Activity)                              │
│  - 報名表 (Registration)                          │
│  - 獎勵表 (Reward)                                │
│  - 積分交易表 (PointTransaction)                  │
│  - 學年表 (AcademicYear)                          │
│  - 班級表 (StudentClass)                          │
└──────────────────────────────────────────────────┘
```

## 核心功能模組

### 1. 用戶管理 (users_app)

#### 數據模型
- **User**: 繼承自 AbstractUser，包含角色（PARENT/COACH/ADMIN）、積分、等級等字段
- **Child**: 學員信息，與 User 為一對多關係
- **AcademicYear**: 學年度管理
- **StudentClass**: 班級管理，與 AcademicYear 關聯

#### API 端點
- `POST /api/users/register/` - 用戶註冊
- `POST /api/users/profile/` - 獲取/更新個人檔案
- `GET /api/users/children/` - 獲取學員列表
- `POST /api/users/children/` - 新增學員
- `PUT /api/users/children/{id}/` - 更新學員信息
- `DELETE /api/users/children/{id}/` - 刪除學員
- `GET /api/users/classes/` - 獲取班級列表
- `POST /api/users/classes/` - 新增班級
- `GET /api/users/academic-years/` - 獲取學年列表
- `POST /api/users/academic-years/` - 新增學年

### 2. 活動管理 (activities)

#### 數據模型
- **Activity**: 活動信息（類型、日期、時間、地點、價格、人數限制等）
- **Registration**: 報名記錄（用戶、學員、活動、狀態、繳費等）
- **Reward**: 獎勵商品
- **PointTransaction**: 積分交易記錄

#### API 端點
- `GET /api/activities/` - 獲取活動列表
- `POST /api/activities/` - 建立活動（管理員）
- `PUT /api/activities/{id}/` - 更新活動（管理員）
- `DELETE /api/activities/{id}/` - 刪除活動（管理員）
- `POST /api/activities/{id}/register/` - 報名活動
- `GET /api/activities/registrations/` - 獲取報名記錄
- `POST /api/activities/registrations/{id}/upload_receipt/` - 上傳繳費收據
- `POST /api/activities/registrations/{id}/approve/` - 審核報名（管理員）
- `POST /api/activities/registrations/{id}/reject/` - 駁回報名（管理員）
- `POST /api/activities/registrations/{id}/cancel/` - 取消報名
- `GET /api/activities/rewards/` - 獲取獎勵列表
- `GET /api/activities/point-transactions/` - 獲取積分交易記錄

### 3. 認證與授權

#### JWT 配置
- Access Token 有效期：60 分鐘
- Refresh Token 有效期：1 天
- 使用 Bearer Token 認證

#### 權限控制
- **IsAuthenticated**: 需要登入
- **IsAdminUser**: 需要管理員權限
- **IsAdminOrOwner**: 管理員或資源擁有者

## 前端頁面結構

### 主要頁面
1. **Home.vue** - 首頁，展示活動列表
2. **Activities.vue** - 活動中心，包含報名功能
3. **Profile.vue** - 個人檔案管理
4. **Auth.vue** - 登入頁面

### 管理員頁面
1. **AdminActivities.vue** - 活動管理
2. **UserMgmt.vue** - 用戶與學員管理
3. **AcademicYearMgmt.vue** - 學年管理
4. **ClassMgmt.vue** - 班級管理

### 佈局組件
1. **MainLayout.vue** - 會員端佈局（導航欄 + 內容區）
2. **AdminLayout.vue** - 管理員佈局（側邊欄 + 導航欄 + 內容區）

## 狀態管理 (Pinia)

### userStore
- **state**: user, accessToken, refreshToken, loading
- **getters**: isAuthenticated, isAdmin
- **actions**: login, register, refreshAccessToken, logout, syncUserProfile

## 路由配置

### 會員端路由
- `/` - 首頁
- `/profile` - 個人檔案
- `/activities` - 活動中心

### 管理員路由
- `/admin/users` - 用戶管理
- `/admin/academic-years` - 學年管理
- `/admin/classes` - 班級管理
- `/admin/activities` - 活動管理

### 其他路由
- `/login` - 登入頁面

## 數據庫遷移

項目使用 Django 的遷移系統，所有數據庫結構變更都通過遷移文件記錄：

- `users_app/migrations/` - 用戶相關遷移
- `activities/migrations/` - 活動相關遷移

## 開發與部署

### 開發環境
- 後端運行在 `http://localhost:8000`
- 前端運行在 `http://localhost:5173`
- CORS 已配置允許本地開發

### 媒體文件
- 上傳文件存儲在 `django_backend/media/`
- 收據圖片上傳路徑：`receipts/{date}{random_suffix}{ext}`

## 安全特性

1. **JWT 認證**: 無狀態認證，適合 RESTful API
2. **權限控制**: 基於角色的訪問控制
3. **CORS 配置**: 限制跨域請求來源
4. **輸入驗證**: 後端驗證所有輸入數據
5. **文件上傳**: 限制文件類型和路徑

## 性能優化

1. **前端**:
   - 使用 Vite 快速構建
   - 組件按需加載
   - 圖片優化

2. **後端**:
   - 使用 `select_related` 和 `prefetch_related` 優化查詢
   - 數據庫索引優化
   - 使用 F() 表達式進行原子操作

## 擴展性考慮

1. **數據庫**: 可輕鬆切換到 PostgreSQL 或 MySQL
2. **前端**: 模塊化設計，易於添加新功能
3. **API**: RESTful 設計，支持版本控制
4. **認證**: JWT 支持分布式部署

## 文件結構

```
basketballMemberSys/
├── django_backend/
│   ├── activities/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── migrations/
│   ├── users_app/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── permissions.py
│   │   ├── urls.py
│   │   └── migrations/
│   ├── basketballMemberSys_backend_django/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── manage.py
│   ├── db.sqlite3
│   └── media/
│       └── receipts/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   │   ├── MainLayout.vue
│   │   │   └── AdminLayout.vue
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── stores/
│   │   │   └── userStore.js
│   │   ├── api/
│   │   │   └── index.js
│   │   ├── views/
│   │   │   ├── Home.vue
│   │   │   ├── Activities.vue
│   │   │   ├── Profile.vue
│   │   │   ├── Auth.vue
│   │   │   ├── AdminActivities.vue
│   │   │   └── admin/
│   │   │       ├── UserMgmt.vue
│   │   │       ├── AcademicYearMgmt.vue
│   │   │       └── ClassMgmt.vue
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
├── layout_ref/
│   └── [參考佈局組件]
├── QUICKSTART.md
├── IMPLEMENTATION.md
└── ACADEMIC_YEAR_MANUAL.md
```

## 開發團隊注意

### 編碼規範
- 前端使用 Vue 3 Composition API
- 後端遵循 Django 最佳實踐
- API 設計遵循 RESTful 原則

### 提交規範
- 清晰的提交信息
- 關聯的問題編號
- 必要的測試覆蓋

### 測試
- 前端使用 Vitest 進行單元測試
- 後端使用 Django 測試框架
- 關鍵功能需有測試覆蓋

## 聯絡與支持

如有任何問題，請查看：
1. 項目文檔
2. API 端點註釋
3. 代碼內聯註釋
4. 錯誤日誌

---

*最後更新：2026-03-30*