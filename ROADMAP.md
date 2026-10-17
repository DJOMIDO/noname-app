# ROADMAP

## 项目背景

- **项目目标**：帮助旅行者记录并分析自己的航班与火车行程，把每次出行变成可查看、可统计的故事。
- **核心需求**：
  - 行程录入：航班 / 火车，支持 Basic 与 Detailed 两种模式
  - 行程浏览：列表、详情、分页
  - 统计分析：总览、路线、时长、地图可视化
  - CSV 批量导入行程
  - 用户鉴权与数据隔离（Neon Auth + Neon Postgres）
  - 响应式布局，浅色 / 深色主题一致体验
- **技术栈 / 关键决策**：Vue 3 + TypeScript + Vite；Tailwind CSS + shadcn-vue；Neon Data API / Neon Auth；Vue Router；Leaflet + CARTO 地图
- **当前阶段**：MVP 功能已基本齐备，进入 UI 体验优化迭代
- **详细需求**：见 docs/requirements.md（待补建）

## 任务看板

### Todo

- [ ] 【阻塞·高优】修复 Neon Data API 下 `auth.user_id()` 返回 NULL 导致 RLS 读写全面失效（app 无法增删查自身数据，本地与部署版均受影响）。根因：JWT claims 进了 `request.jwt.claims`（角色可切换）但未进 `pg_session_jwt`。修法：migration 的 RLS 策略与 `user_id` 默认值改用 `current_setting('request.jwt.claims', true)::jsonb ->> 'sub'`（建议分支 `fix/neon-rls-user-id`）
- [ ] 接入密码重置与 Remember me 功能（当前为占位死链）（建议分支 `feat/password-reset`）
- [ ] 欢迎页区分登录态：登录后展示最近行程 / 数据摘要（建议分支 `feat/home-logged-in-summary`）

### In progress

- （暂无）

### Done

- [x] 查看记录列表页改版（分支 `feat/redesign-journeys-list`：玻璃卡片 + RouterLink 可访问性修复、中性 iOS 分段控件、骨架屏 / 空态 CTA、胶囊分页；过程中发现数据层 auth 阻塞，已转 Todo 单独修复）
- [x] 全站配色体系重构（分支 `feat/tune-form-palette`：从 Travel.svg 插画提取 brand/sunset/mint/lilac 四色注册为 @theme 令牌；色彩角色分工——橙=实色 CTA、紫=小面积状态指示、绿=氛围光斑、白=主体；渐变统一紫→天蓝且橙色不入渐变；Tabs 改中性 iOS 分段控件；Login/Signup 输入框样式收敛到共享 fieldClass）
- [x] 添加航班 / 添加火车页改版（分支 `feat/redesign-add-journey-pages`：抽取 JourneyFormShell / FormField / AutocompleteInput 共享件消除两页重复；全字段补 label、Detailed 分组、移动端单列；模式切换移入卡片内与表单贴近；CSV 导入面板重做：玻璃模态 + 拖拽上传 + Esc/遮罩关闭；修复选择器保存后不重置的存量 bug）
- [x] 登录 / 注册页视觉风格与新欢迎页统一（分支 `feat/redesign-auth-pages`，PR #17 已合并：抽取共享 AuthShell；主题初始化从 NavBar 提升到 App 层，修复认证页直接加载丢失深色主题；Remember me / Forgot password 保留占位，后续 `feat/password-reset` 完善）
- [x] 欢迎页重新设计：风格 A+C 融合——渐变 Hero 大标题、玻璃拟态操作卡片、入场动效、氛围光斑与插画融入背景；同步补齐卡片键盘可访问性与 reduced-motion 降级（分支 `feat/redesign-welcome-page`）

### Nice to have

- [ ] B 方向「效率型首页」实验：弱化插图、突出操作入口与快捷数据
- [ ] 补建 docs/requirements.md，沉淀详细需求与验收标准
- [ ] 引入 lint / 测试脚本（当前仅 `npm run build` 作为基础验证）
