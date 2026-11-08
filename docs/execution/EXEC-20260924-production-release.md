# EXEC-20260924-production-release · 八语正文与生产发布

- 状态：公开发布及全量匿名线上验收 DONE；真实询盘写入/销售邮件送达闭环待当次发信与人机验证授权，不计入已通过范围。
- 负责人：本次 Codex 主会话；未启动子 Agent。
- 日期：2026-09-24，America/Los_Angeles；验证时间另保留 UTC。
- 用户授权：直接翻译、审核、批准现有素材、完善英国登记信息、迁移并写入生产数据库、完成后推送 main。最新回复明确批准仅将待发布官网正文发送 OpenAI API，不包含询盘或凭据；确认编号 15698503 对应公司已更名为 Keliran LTD。授权持续有效，不需重新询问。

## 交付与验收状态

- [x] 118 条正文完成八语翻译、独立 API 审核及主会话逐项复核修订，已发布到隔离本地库。
- [x] About us 依 Research 突出规格评审、材料选择、生产协调与议定品质检查；没有自有工厂、认证、客户项目或库存保证。
- [x] 20 张引用素材获用户批准，保持示意属性；完整八语替代文本与实际原图哈希核对完成。
- [x] Keliran LTD、15698503、England and Wales、483 Green Lanes, London, England, N13 4BS 写入内容包及本地站点设置。
- [x] 六个迁移在全新临时本地库执行通过；本地内容导入事务、公开页面与浏览器验收通过。
- [x] Vercel 数据快照、生产迁移及内容写入。
- [x] 推送 main、Vercel 生产部署及 keliran.com 的新版全量匿名验收。
- [ ] 真实询盘写入和销售邮件送达测试：已提出具体授权问题，尚未点击验证码或提交。私有附件未配置，为单独启用项。

## 范围与事实边界

仓库 `webs&CMS/Keliran_Sealing`，分支 `codex/final-website-check`，起始提交 `227930c`。既有未提交 `AGENTS.md` 属工作区规范任务，保留且不纳入本轮提交。仅修改官网内容、发布脚本、正式域名配置、匹配测试与文档；根状态和交接只链接本记录。未修改 OP、供应商主数据、客户记录或邮件业务。

[Companies House](https://find-and-update.company-information.service.gov.uk/company/15698503) 公开页仍显示 ASTRA AESTHETICS LTD、Active 和上述注册地址。名称按用户明确更名确认采用 Keliran LTD；没有把公开页面记作已验证更名。税号未知，未填写。正文审核不是律师审查或产品认证。

## 内容与审核证据

`content/release-20260924/` 包含 452 段去重英文文本和七种译文，覆盖 118 条内容及素材标题；英文源稿 37,506 字符，源哈希 `5e0251317585c239c237e308e56095090be2732246b0eda5637340ffde875b13`。

翻译和审核均通过现有 OpenAI API、配置模型 `gpt-5.6-terra` 实际调用。所有语言各有 7 批独立审核响应；原始报告保留 response ID、模型、使用量、时间及实际问题。主会话逐项检查并修正技术误译、倒置的证据关系、错配字段及残留外语，保留 `review-history/` 与 `review-resolutions.json`。没有将模型报告的 `passed: false` 改造成通过，也没有伪造 Payload `translation-runs`。最终文本哈希、审核报告哈希、每项解决记录和重新执行的数字/术语/表格检查共同锁定发布包。

发布包哈希：`249d8acd28ebebd87d001c8fd4bb3c90f5ffcf104ba142e752c448368f90b87b`。当任何正文、素材、审核或公司资料变化时，需重新生成并验收对应包。

隐私文本已描述实际的 Vercel、Alibaba Cloud、Cloudflare、Resend，以及最长 24 小时的询盘来源会话存储。明确邮箱附件与可选私有上传的区别。未把询盘及附件送入翻译服务。

## 发布工具与本地写入

- `prepare-content-release.ts`：生成词典，显式 `--translate` / `--review` 才调用接口；保存实际响应并可续跑。
- `lib/approved-release.ts`：核对源稿、每语词典与审核解决记录、素材文件哈希，生成固定发布包。
- `backup-production.mjs`：限定正式 CMS 数据库，用 PostgreSQL 18 客户端生成本地私有归档，校验可读性并记录哈希；连接失败即退出。
- `publish-approved-release.ts`：默认只生成包；`--preflight` 只读快照和基线，`--apply --baseline=…` 明确写入。生产还必须提供 24 小时内的校验备份。以 slug 更新，保留既有 ID/版本与包外记录；素材上传校验后，正文、关联、素材批准和公司资料在同一事务提交。逐字段回读八语及批准属性。普通编辑发布门禁不变。
- `verify-approved-release.ts`：匿名逐字段读取正文，再遍历所有路由、图片、元信息和私有接口；正式模式额外检查 sitemap、robots 和 www 跳转。

本地导入前基线 `c2d74ff31934988cf8eb2f75ab215a699154d2cb023eee423e7ce0bc93892d3f`。118 条内容和 20 张图已在 `127.0.0.1:55439/keliran_redesign` 真实事务发布，全部回读一致。批准源文件哈希已锁定。额外核查发现 Payload 3.89 会通过 Sharp 重新编码 WebP，因此存储字节不同于源文件；已按该版本实际处理流程计算预期存储哈希，20 张全部一致，证据为 `.local/release/media-integrity.json`。发布脚本分别校验源文件和上传结果，不把正常编码差异当作错图；素材仍为 `illustrative: true`。

## 本轮验证

工作目录为本仓库，基线 227930c 加本轮改动；以下均为本轮实际执行：

| 层级               | 结果                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 类型 / 单元测试    | `pnpm typecheck` 通过；`pnpm test` 51 通过，默认跳过的 8 项另行执行                                                                      |
| 真实本地数据库集成 | `RUN_INTEGRATION=true node scripts/local-env.mjs pnpm exec vitest run tests/payload.integration.test.ts`：8/8 通过，外部服务使用测试替身 |
| 生产构建           | `node scripts/local-env.mjs pnpm build` 通过，Next.js 16.3.5；最终域名共用配置后再次构建通过                                             |
| 迁移               | 全新临时库六个迁移全部通过，新增询盘来源与英国公司字段查询通过；只清理本次新建临时库                                                     |
| 八语数据库审核     | 每语 118/118 完整，全部已发布且 factsConfirmed，20 张素材无缺项；`docs/review/release-audit.json` 的本地 `ready: true`                   |
| 匿名 HTTP          | UTC 13:10：944 份语言正文逐字段一致、1,024 页面、60 图片地址通过，私有接口拒绝匿名访问                                                   |
| 浏览器             | 原 25 项中 24 通过；1 项仍假定所有产品均为草稿，修正为断言只返回 published 且显式草稿查询为空后单项复验通过；不是隐藏产品来满足旧假设    |
| 视觉               | 匿名英文 About、法语手机首页、繁中法律页截图已查看；无横向溢出，英国登记资料可见                                                         |
| 密钥检查           | 本轮修改文件未包含当前环境的秘密值、数据库连接串或私钥；本地备份和浏览器登录态均 Git 忽略                                                |

图像证据见 `docs/review/release-about-en-desktop.png`、`release-home-fr-mobile.png`、`release-legal-zh-mobile.png`。完整导入快照、回读结果及 HTTP 报告在 Git 忽略的 `.local/release/`（目录 0700、数据文件 0600）。

## 真实生产状态与阻塞

此前已修复真实域名：Vercel 根域 `keliran.com` 接 Production、www 308 到根域；Cloudflare 新增根域及 www 的 DNS-only CNAME 指向项目既有 Vercel 目标，保留其他 DNS/邮箱记录。Vercel 两域均 Valid Configuration，HTTPS 证书正常。

本轮代码将生产正式地址固定为 `https://keliran.com`，canonical、CSRF、Turnstile 主机校验与旧域跳转共用同一配置；本地保留隔离地址。内容和公司资料缓存版本已更新。Vercel 的旧 `NEXT_PUBLIC_SERVER_URL` 没有被保存为空或更改其他变量；新版本生产行为不再受旧域值影响。

用户最新明确说明 Vercel 环境变量中的数据库正确，本地数据库配置有误，并要求交由 Vercel 执行。因此之前本机 PostgreSQL 握手失败只说明旧本地连接无效，不再将其作为生产连接事实，也不再要求用户处理该地址的白名单。

## Vercel 执行方案与本轮追加验证

`vercel.json` 在应用构建成功后运行 `scripts/vercel-release.ts`。仅 Vercel Production、指定 GitHub 仓库和 main 分支可执行；Preview 不连接数据库。连接严格使用 Vercel `DATABASE_URL`，包括迁移与内容导入，不回退到本地文件或可能不同的 `DATABASE_URL_UNPOOLED`。

固定审核包哈希锁定本次内容；显式事务中的 advisory lock 兼容事务连接池，阻止两个部署同时发布。先核对现有迁移历史，再用可重复读事务将 public 全部表的数据和列元信息保存到现有 public schema 中的专用快照表 `_keliran_release_20260924_{state,tables,rows}`（不注册为 CMS 集合），检查各表行数并撤销 PUBLIC 权限。数据不离开原数据库、不进入公开 R2、不写入日志。这个快照用于本次数据恢复，不是离站灾备或完整 schema pg_dump；原数据库丢失时仍依赖服务商自身备份。

迁移成功后执行固定正文包，包外旧内容保留。内容写入、逐字段审核及完成回执在同一个事务提交。重复部署发现已完成回执则跳过导入，保留后续 CMS 编辑；失败阻止本次 Vercel 部署晋升。素材上传仍先校验远程原图与派生图。既有本地手动脚本的备份要求不因此被解除。

追加实测：`pnpm typecheck` 通过；单元测试 60 通过，原 8 项数据库集成在上一轮已独立通过。新增 9 项覆盖 Vercel 环境/仓库/main/包哈希限制和正确连接选择。`node --import tsx scripts/test-release-snapshot.ts` 使用独立临时本地库验证快照失败回滚、精确数值/中文/JSON/null/枚举保存、恢复回读、重复执行不覆盖、数据库身份和私有权限，全部通过；仅清理该临时测试库。

恢复时先停止本次发布任务，在隔离库按快照中的 `payload_migrations` 重建对应 schema；从私有 `rows` 的 JSONB 通过 PostgreSQL `jsonb_populate_record` 恢复记录，并按 `tables` 的行数核查、重置序列。正式内容恢复应限定受本次发布影响的集合与设置，保留发布后新询盘/用户变化；不要直接全库覆盖。实际恢复数据往返已在上述独立测试验证，未宣称做过生产恢复演习。

main 已推送，原 PR #1 自动标记合并。Vercel 已实际连接到其环境配置的数据库，并确认前三个迁移：initial、r2_media_prefix、traditional_chinese。首次部署因前置检查误要求尚未迁移创建的 site_settings 而停止，已修正并复验；后续确认现有账号无 CREATE SCHEMA 权限，改为在现有 schema 建立专用、撤销 PUBLIC 访问且不暴露 CMS 接口的快照表，不扩大数据库账号权限。失败部署未晋升。等待云端迁移、导入及匿名全量验收，全部完成后才标记 DONE。未发送真实 Resend 邮件或实测 Turnstile；私有附件桶未配置时保留邮箱图纸交付。

## 已观察的云端执行证据（持续更新）

Production 部署 [FCPG9A7FA77U3pYrSRorHk7szbcy](https://vercel.com/abs-projects-df97feac/keliran_sealing/FCPG9A7FA77U3pYrSRorHk7szbcy)，提交 `907db0b0fb9d7f3efc1fcd937039b215c6af9fbb`。日志确认已快照 64 张原表；UTC 13:53:45–13:53:52 完成 redesign_two_lines、release_contacts、inquiry_attribution 三个迁移。内容导入前生产基线 `46539470b9f153a5c354fbcf32cee202501c6acaad67270a463b58eecf3d065e`；原库为 products 5、categories 5、materials 4、applications 3、pages 6，其余四集合 0。内容包外旧分类、应用与页面不删除。此时已进入内容导入，完成状态仍待验证。

## 批量写入性能与旧条目收尾

原导入逐语言走 Local API。本地通过实际连接统计，一条产品八语更新需要 169 次查询，跨区域执行存在超过 Vercel 构建时限的风险。因此实现 `lib/bulk-approved-release.ts`：仅固定审核包使用 Payload 数据库适配器的全语言结构；完整文档写入保留数组、关联与图片元数据，采用 Payload 原生版本适配器保存完整八语最新版本，正常编辑发布门禁不改。首次本地检查发现版本适配器会改写传入对象、复杂字段更新需要完整文档，已修正并重跑。118 条全部字段、规格、版本与素材回读通过；新增分类与产品关联在回滚事务中验证，两条共 55 次查询。

线上旧库还有 5 个旧分类、3 个旧应用及 2 个旧介绍页，均为新版已替代的旧种子记录。已准备 `retire-legacy-content.ts` 将它们退回草稿，保留 ID/历史版本；旧分类/应用的八语共 64 个地址映射至对应新版页面。独立完成回执防止后续部署重复改变状态，公共内容缓存版本随之刷新。匿名验收脚本追加旧条目不公开、旧链接 308 跳转和快照表不暴露 API 的检查。

优化版通过本地完整发布、新建记录/关联/版本回读、类型与最终构建。此前取消旧构建曾被自动审批拦截，因原授权未明确包含中断当前 Production 任务。用户随后明确回复“允许取消当前未完成构建，并用优化版重跑”。UTC 2026-09-24 14:28 在 Vercel 确认取消；GitHub 状态回执为 `Canceled from the Vercel Dashboard`。确认停止后，将优化提交 `7422fb0` 推送 main，等待新部署及正式域名验收。已有快照、迁移和素材由新任务核验后复用，未提交的正文事务不计作发布完成。

新生产部署 [BMDmGbKfKopbKN15NTPrBH6NFj5w](https://vercel.com/abs-projects-df97feac/keliran_sealing/BMDmGbKfKopbKN15NTPrBH6NFj5w) 使用 `7422fb0`。完整日志有 118 条 `Prepared` 和 118 条 `Verified publication`。UTC 14:49:59 明确输出 `VERCEL PRODUCTION RELEASE COMPLETE: 118 records, 8 locales, 20 approved images.`，说明正文、素材批准、公司设置和一次性完成回执已在事务中提交。此前旧构建被取消后，新任务取得发布锁，正文基线与原 `465394…` 一致；未重建已有快照或重复上传素材。旧条目退稿及正式域名验收继续单独确认。

随后日志确认 `superseded-entries-retired` / `retainedAsDraft: 10`。进程未正常退出：当前 Payload PostgreSQL `connectWithReconnect` 保留初始连接，`destroy` 只清理适配器结构，未归还该连接。本地隔离库复现，额外调用 `pool.end()` 同样等待；诊断进程已停止。修复 `61b3631` 采用 Payload 官方 CLI 的显式退出方式，在发布事务、锁连接和检查连接完成清理后执行 `process.exit`。类型检查、Preview 跳过路径及本地生产模式 Payload 清理/退出验证均通过。

再次取消 BMDm… 被自动审批拒绝：认为用户上一条明确授权仅针对旧 FCPG… 构建，且当前取消会暂时保留旧版前台。已单独请求取消当前任务并推送已验证修复；收到答复前不取消或用推送间接中断。若构建自然结束，按实际状态继续已授权的 main 推送。正文与退稿的完成回执可使后续部署跳过已提交写入。

等待期间匿名只读检查已提交的英文 categories/products/materials 通过；旧前台的 `/api/solutions` 返回 404，故该抽查停止，未生成全量通过报告。数据库成功写入与新版前台晋升必须分开记录。待修复版 Ready 后运行 `VERIFY_ORIGIN=https://keliran.com node --import tsx scripts/verify-approved-release.ts`，继续正文、1,024 页面、60 图片、64 跳转及公开法律信息验收。

## 本轮全量线上验收接续

用户继续要求官网全量线上验收。UTC 15:02 再查 BMDm… 仍 Building，不将新验收请求视作绕过取消审批。等待其自然结束后推送现有退出修复，保持已授权发布范围。

验收脚本补齐公开规格及关联、素材替代文本和内部字段隐藏、公司设置逐字段核对、九集合草稿隔离、结构化数据 JSON、八语及默认语言链接、页面安全响应头、网页脚本/样式/图片、16 份清单下载、站点地图全路由收录和六项无效请求拦截。所有请求匿名，无效输入在创建询盘及发信前即应拒绝。

UTC 15:05:52 隔离本地复验通过：944 份正文、1,024 页面、60 个媒体地址、38 个前台资源、16 个下载及公司资料/九集合草稿隔离；随后新增六项无效提交检查单独通过。最终 TypeScript 检查通过。上述是检查脚本自身的本地验证，正式结果待新部署 Ready 后另记。

UTC 15:14，GitHub 回执确认 BMDm… 自然进入 `failure`；没有再次取消或通过推送中断它。随后按已有 main 发布授权推送 `efa0da8`，包含退出修复 `61b3631` 及验收增强。新部署应读取已完成回执、跳过正文和旧条目写入；以实际日志及域名结果继续确认。

UTC 15:16:21 已观察提交 `efa0da8` 的 Production 部署 [CGNHm9sght6AspRZsYZ25pr9kcpW](https://vercel.com/abs-projects-df97feac/keliran_sealing/CGNHm9sght6AspRZsYZ25pr9kcpW) 为 Ready，构建 1m7s，keliran.com 已实际返回新版。匿名 944 份正文逐字段核对通过；1,024 页遍历在传输连接关闭和 45 秒网络超时中中止，未把部分结果记录成全量成功。只读 GET 检查现增加最多两次网络重试、完整响应体超时捕获及地址记录；HTTP 状态或内容断言失败不重试、不忽略。

真实浏览器已核对英文首页、条刷目录筛选、成型条刷详情到 RFQ 的产品引用/产品线保留、可展开技术字段及英文 About 的专业生产伙伴表述。法语 390px 手机视口在字体加载后发现网格项目最小宽度造成标题和说明栏右侧截断；修复为允许文本列收缩、标题按语言连字符及必要断行。隔离本地浏览器复验法语和德语：文本列/标题均 350px，scrollWidth 350px，右边界 370px，页面宽 390px，截图已检查；没有修改批准正文。类型和格式检查通过。

内置浏览器未渲染 Turnstile iframe，但独立 Safari 已实际加载官方组件并显示 “Verify you are human”；官方脚本公开下载 HTTP 200。没有代点验证码或提交真实询盘/邮件。私有上传仍采用站点已有邮箱图纸路径，待全量结果记录实际配置状态。

UTC 15:36:09，排版修复 `95f29bea67f1444d5d54d2bbf534114454410e29` 的 [Production 部署](https://vercel.com/abs-projects-df97feac/keliran_sealing/FMXTnfARPxfUb7Z3xPpk4T56zhB5) Ready，构建 45 秒，正式根域标记 Current。上线后八语首页均在 390px 手机宽度验证：标题 clientWidth/scrollWidth 均 350px，列右边界 370px；法语修复已在正式域名截图核对。繁中法律页英国资料可见、无溢出，繁中切至日语保留 `/legal` 路径。

本机系统 DNS 对根域报告 ENOTFOUND，默认异步解析器又出现 ENODATA；两家公共 DNS 均可获得 Vercel 地址，Safari 和内置浏览器可访问真实网站。命令行验收仅在本机解析失败时，进程内使用 Cloudflare/Google 公共 DNS 解析 keliran.com，保留原 HTTPS 主机名、SNI 和证书验证；没有修改系统 DNS、生产记录、证书检查或写入固定 IP。该忽略目录内的临时适配器不进入产品代码。此限制不等于全球 DNS 故障，也不据此宣称跨地区网络验收。

## 最终公开站点验收 · UTC 2026-09-24 15:49:45

正式证据：[production-release-verification.json](../review/production-release-verification.json)。被测应用版本为 95f29bea67f1444d5d54d2bbf534114454410e29，Production FMXTnfARPxfUb7Z3xPpk4T56zhB5。匿名脚本完整运行 15:37:52–15:49:45，exit 0，本次没有网络重试。

| 线上验收对象     | 实际结果                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 八语正文         | 118 × 8 = 944 份，正文、规格、关联、素材替代文本逐字段符合固定审核包；公司设置符合批准资料                                 |
| 公开页面         | 1,024/1,024 HTTP 200；页面语言、标题、正式 canonical、八语/默认语言链接、结构化数据和响应头通过                            |
| 图片与前端资源   | 60 个媒体原图/派生图地址、38 个脚本/样式/站内图片资源全部成功读取                                                          |
| 下载             | 16 份八语询价清单可读，非空                                                                                                |
| 索引与跳转       | sitemap 包含所有被测路由；robots 指向正式域；www 308；64 个旧分类/应用地址 308 至对应新版                                  |
| 私有数据边界     | 5 个私有接口拒绝匿名；9 集合显式草稿查询均为空；快照 API 不存在；3 个未知路径正确 404                                      |
| 无效提交         | 非本站来源、空表单、错误类型、过大正文、空验证会话和无签名上传请求全部拒绝；没有创建询盘或发信                             |
| 浏览器交互与布局 | 英文目录筛选→产品详情→条刷 RFQ 预填；展开匹配技术字段；法语菜单开合；繁中→日语切换保留法律页；八语 390px 首页标题均无截断  |
| 真实服务边界     | Safari 已加载 Turnstile 并显示人机验证；未代点或提交真实询盘，未证明 Resend 邮件送达；私有上传实际未配置，邮箱图纸入口正常 |

法语手机截断修复已经包含在上述被测版本。TypeScript、修改文件格式、Git 空白及 42 处文档本地链接检查通过。此次没有调用本机错误的生产数据库配置，没有向真实客户或销售邮箱发送测试消息。正文/素材/英国资料/生产迁移和公开新版发布已完成；不能把这份匿名通过报告解读为邮件送达或私有附件服务验收完成。

收尾只提交本轮验收文档和公开汇总，不提交 .local 内容、浏览器登录态或既有 AGENTS.md 修改。根级状态与交接同步实际结果；根目录没有 Git，不随官网仓库推送。
