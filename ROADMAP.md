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

- [ ] 登录 / 注册页视觉风格与新欢迎页统一（建议分支 `feat/redesign-auth-pages`）
- [ ] 欢迎页区分登录态：登录后展示最近行程 / 数据摘要（建议分支 `feat/home-logged-in-summary`）

### In progress

- （无）

### Done

- [x] 欢迎页重新设计：风格 A+C 融合——渐变 Hero 大标题、玻璃拟态操作卡片、入场动效、氛围光斑与插画融入背景；同步补齐卡片键盘可访问性与 reduced-motion 降级（分支 `feat/redesign-welcome-page`）

### Nice to have

- [ ] B 方向「效率型首页」实验：弱化插图、突出操作入口与快捷数据
- [ ] 补建 docs/requirements.md，沉淀详细需求与验收标准
- [ ] 引入 lint / 测试脚本（当前仅 `npm run build` 作为基础验证）
