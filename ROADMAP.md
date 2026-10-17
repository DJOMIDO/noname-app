# ROADMAP

## 项目背景

- **项目目标**：帮助旅行者记录并分析自己的航班与火车行程，把每次出行变成可查看、可统计的故事。
- **核心需求**：
  - 行程录入：航班 / 火车，支持 Basic 与 Detailed 两种模式
  - 行程浏览：列表、搜索筛选、详情、分页
  - 统计分析：总览、路线、时长、地图可视化
  - CSV 批量导入行程
  - 用户鉴权与数据隔离（Neon Auth + Neon Postgres）
  - 响应式布局，浅色 / 深色主题一致体验
- **技术栈 / 关键决策**：Vue 3 + TypeScript + Vite；Tailwind CSS + shadcn-vue；Neon Data API / Neon Auth；Vue Router；Leaflet + CARTO 地图
- **当前阶段**：MVP 功能已基本齐备，进入 UI 体验优化迭代
- **详细需求**：见 docs/requirements.md（待补建）

## 任务看板

### Todo

- [ ] 确认部署环境（Netlify）的 `VITE_NEON_URL` 与本地共用同一 endpoint（`ep-floral-sun-b9mm9800`）；若是则 migration 已直接生效（app 实测写入 user_id 正确），无需额外操作；若部署指向另一 Neon 分支，则需对该分支重跑本 migration

### In progress

- （暂无）

### Done

- [x] 接入密码重置与 Remember me（分支 `feat/password-reset`：根因——原 SupabaseAuthAdapter 不暴露 better-auth 的 OTP 重置方法、`updateUser({password})` 直接抛错，而 Neon 官方推荐且对 SPA/Vue 最干净的是「发 6 位邮箱验证码 + 一步重置」的 Email OTP 路径（无需消费邮件链接 token）。决策：整体切换到 BetterAuthVanillaAdapter，全项目 5 处 auth 调用随之改写（`signInWithPassword→signIn.email`、`signUp→signUp.email`（username 映射顶层 name）、`getUser→getSession`、signOut 不变），并修正 SideNav/BottomTabBar/Home 三处 `user_metadata.displayName→name`（Supabase 档案结构在 better-auth 下不存在）。新增 ForgotPassword（`forgetPassword.emailOtp` 发码，不泄露邮箱是否注册）与 ResetPassword（`emailOtp.resetPassword` 校验码+新密码一步重置）两页，走 AuthShell 全屏无导航壳；Login 移除 Remember me 勾选框（better-auth 会话本就持久化，勾选框无真实语义）、Forgot password 从死链改为指向 /forgot-password；已实测注册/登录/重置全流程通过
- [x] 引入单元测试（分支 `test/add-vitest`：Vitest 3 + 独立 `vitest.config.ts`（纯逻辑测试跑 Node 环境，不加载 Vue/Tailwind 插件、不装 jsdom，只复用 `@` 别名）；新增 `npm test` / `npm test:watch`；首批 39 个用例覆盖 `lib/stats`（多数值统计 / 按币种汇总 / 合并）、`lib/csvImport`（引号与转义、CRLF、BOM、空行、列名缺失/多余、必填与日期时间价格校验、入库行映射、模板往返）、`lib/geo`（IATA 查找、haversine 距离与时区差含夏令时）；用例文件放在 `src/lib/__tests__/` 下，顺便被 vue-tsc 与 eslint 一并检查；踩坑：`vitest@latest`（v4）会拉 optional peers 触发 npm arborist `edgesOut` 崩溃，`--legacy-peer-deps` 又会重写全树 peer 解析（lockfile -460 行），降级到 `vitest@^3` 后 lockfile 变为纯增量）
- [x] 行程查询收敛为窄列（分支 `refactor/narrow-journey-queries`：新增 `src/lib/journeyColumns.ts` 集中定义列集与行类型，首页最近行程与行程列表卡片从 21 列降到 11 列（砍掉 notes/booking_ref/gate/aircraft_reg/时间戳/user_id）；行类型用 `as const satisfies readonly (keyof T)[]` 从同一份列清单派生 `Pick`，补上旧 `FLIGHT_STATS_COLUMNS` 配 `Flight` 全类型的谎言——读未拉取字段现在会被 vue-tsc 报错；统计链路（useJourneyStats + 6 个图表/汇总组件）props 同步改为 `FlightStatsRow`/`TrainStatsRow`；决策：详情页保留 `select('*')`，因为它是 17 字段全量编辑表单，显式列出零收益且多一处需与表结构同步的维护点，窄列规范已收敛为「列表/聚合查询必须窄列」）
- [x] 引入 ESLint 静态检查（分支 `chore/add-eslint`：ESLint 10 + Vue 3/TS 官方预设（`@vue/eslint-config-typescript`）flat config；`scripts/**` 加 Node globals、`src/**/*.vue` 关闭 multi-word-component-names（单字页名与 shadcn 原语为有意命名）；新增 `npm run lint` / `lint:fix`；清掉全部 12 处 `no-explicit-any`——useAuthUser 导出 `AuthUser` 类型、列表与详情页改用 `Flight`/`Train` + `.returns<T>()`、`assign()` 用 `keyof` 索引替代 `form as any`；顺带把写入点的 `!isLoggedIn.value` 守卫改为 `!user.value` 以完成空值收窄；lint 与 build 全绿）
- [x] 数据层收敛与统计页加载优化（分支 `refactor/journeys-data-layer`：新增 useJourneys composable——统计专用窄列查询（裁掉 notes/booking_ref/gate 等图表不消费字段，全量拉取 payload 大幅减小）+ 按 userId 隔离的 module 级缓存；Stats.vue 改用它，二次进入秒开；7 个写入点（录入/编辑/删除/CSV 导入）全部接入缓存失效，增删改后统计不会显示脏数据；类型出口用客户端官方 .returns<T>() 无强转）
- [x] 欢迎页区分登录态（分支 `feat/home-logged-in-summary`，PR #28 已合并：新增 HomeSummary 个性化卡片——问候语 + 航班/火车计数 chips + 最近 3 条行程快捷入口；零行程的登录用户仍看 TravelIntro 激励页，与游客一致；数据加载完成后才切换展示，避免闪现）
- [x] 行程列表搜索与年份筛选（分支 `feat/journey-search-filter`：新增 JourneysFilterBar（防抖搜索框 + 年份 chips，同时作用于两个 Tab）；PostgREST or/ilike 多字段匹配，城市名自动扩展为 IATA 码集合（airports.json 本地查表），MU5101 式连写航班号识别航司前缀拆分匹配；过滤变化页码归 1（合并 watcher 防重复请求）；空态区分「无数据」与「无匹配」；踩坑：date 列不能 ILIKE，or=() 语法不支持 cast(text)，日期收窄由年份 chips 的 gte/lte 承担）
- [x] 统一未登录访问逻辑（分支 `feat/guest-browse-auth-states`：消除「首页卡片拦截、导航栏放行」的矛盾——所有入口都可进入页面；Journeys/Stats 与 CSV 导入用可复用的 GuestState 引导登录，取代红色 error toast；useAuthUser 收敛为鉴权单一真源（isLoggedIn/ready/refresh）；录入表单游客可填写，保存时跳 `login?next` 并用 localStorage 草稿保留输入，登录后回原页恢复；登录/注册按 next 回跳并清理调试日志）

- [x] 修复 Neon Data API 下 RLS 读写全面失效（分支 `fix/neon-rls-user-id`：根因——Data API 只写入 `request.jwt.claims`（角色可切换）却未初始化 pg_session_jwt，`auth.user_id()` 恒为 NULL。新增 `public.current_user_id()` 从 `current_setting('request.jwt.claims', true)::jsonb ->> 'sub'` 取用户 id；migration 的 `user_id` 默认值与全部 RLS 策略改用该函数，并对已存在表 `ALTER COLUMN ... SET DEFAULT`。开发库以 authenticated 角色 + claims 模拟验证增/查/改/删全部通过，临时 dev policies 已回滚）
- [x] 查看记录列表页改版（分支 `feat/redesign-journeys-list`：玻璃卡片 + RouterLink 可访问性修复、中性 iOS 分段控件、骨架屏 / 空态 CTA、胶囊分页；过程中发现数据层 auth 阻塞，已转 Todo 单独修复）
- [x] 全站配色体系重构（分支 `feat/tune-form-palette`：从 Travel.svg 插画提取 brand/sunset/mint/lilac 四色注册为 @theme 令牌；色彩角色分工——橙=实色 CTA、紫=小面积状态指示、绿=氛围光斑、白=主体；渐变统一紫→天蓝且橙色不入渐变；Tabs 改中性 iOS 分段控件；Login/Signup 输入框样式收敛到共享 fieldClass）
- [x] 添加航班 / 添加火车页改版（分支 `feat/redesign-add-journey-pages`：抽取 JourneyFormShell / FormField / AutocompleteInput 共享件消除两页重复；全字段补 label、Detailed 分组、移动端单列；模式切换移入卡片内与表单贴近；CSV 导入面板重做：玻璃模态 + 拖拽上传 + Esc/遮罩关闭；修复选择器保存后不重置的存量 bug）
- [x] 登录 / 注册页视觉风格与新欢迎页统一（分支 `feat/redesign-auth-pages`，PR #17 已合并：抽取共享 AuthShell；主题初始化从 NavBar 提升到 App 层，修复认证页直接加载丢失深色主题；Remember me / Forgot password 保留占位，后续 `feat/password-reset` 完善）
- [x] 欢迎页重新设计：风格 A+C 融合——渐变 Hero 大标题、玻璃拟态操作卡片、入场动效、氛围光斑与插画融入背景；同步补齐卡片键盘可访问性与 reduced-motion 降级（分支 `feat/redesign-welcome-page`）

### Nice to have

- [ ] B 方向「效率型首页」实验：弱化插图、突出操作入口与快捷数据
- [ ] 补建 docs/requirements.md，沉淀详细需求与验收标准
- [ ] 接 CI：目前 lint / test 只能本地手动跑，仓库无 `.github/workflows`
- [ ] 修复 `normalizeNeonUrl` 注释与行为不一致：注释说接受 Auth URL 形态，但 `https://ep-x.neonauth.../auth`（无数据库名路径）实际返回 `invalid`
