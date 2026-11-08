# EXEC-20260926-seo-geo

- 状态：DONE（代码发布与授权平台提交完成；Google sitemap 读取及人工证据项待后续复核）；负责人：本次 Codex 主会话，独立实施。
- 时间：2026-09-26，America/Los_Angeles（证据使用 UTC）。
- 授权：用户要求依据 2026-09-25 SEO/GEO 规格及 Safari 已登录 Google/Bing 账户继续完善官网，验证后推送 main、部署 Vercel。
- 基线：main / origin/main `a5da42ee23613bae4617b5fdbe7697312d260033`；仅 `AGENTS.md` 有既有修改，保留且不纳入本任务提交。根目录无 Git。
- 可写：官网 src、tests、scripts、reports、docs 及必要的新版本内容配置；根交接仅追加任务入口。既有发布包与业务资料不覆盖。
- 输入：`../keliran-seo-geo-codex-change-spec-2026-09-25.md`、当前公开站点、搜索平台报告、源码与已发布 CMS 内容。
- 交付：前后路由/抓取审计、模板去重、采购关系和材料角色、核心页采购路径、询价上下文、结构化数据与 sitemap 校验、main 发布及线上证据。
- 验收：本地隔离环境类型/单元/集成/浏览器/构建检查；生产只读 HTML、规范地址、八语链接、下载与平台提交回执；不发送真实询盘、邮件或客户文件。
- 非目标：新分析像素、扩大训练许可、虚构供应能力、改公司身份、重做网站。永久迁移候选先逐项记录，本轮优先保留地址并区分任务。

## 基线观察

- Google Search Console（Safari，2026-09-26）：0 点击；索引报告更新时间 2026-09-20，0 已收录、4 未收录，原因「已被 robots.txt 屏蔽」。这是历史报告，早于 9 月 24 日新版发布，不能当作当前故障。
- Bing Webmaster（Safari）：2026-06-25 至 2026-09-24 点击/展示均为 0；Sitemaps 显示 0 rows。
- 当前 `https://keliran.com/robots.txt` 200，Allow `/`，仅限制 admin/api/preview；sitemap 200，863,105 字节。原始响应保存在 `.local/seo-geo-before/`，此目录不提交。
- 使用已安装 Next.js 16.3.5 文档核对 metadata/robots/sitemap；本地继续使用 `scripts/local-env.mjs`，不读取生产凭据。

## 实施

- K02：共用 `distinctSections` 只去除完整重复段落/列表，保留独有内容；正文和侧栏锚点共用结果。摘要列表保留列表语义；产品已有整机验证段落时不再追加重复提醒。
- K03–K11：首页业务名称成为 h1，原口号保留；选型子栏目与商业详情职责区分。17 个核心内容入口有 91 条配置关系，标题/摘要仍取真实 CMS。旧产品/地址保留。漏水场景保留情境与问题，复用的诊断内容指向解决方案，新增空白调查表。
- K05/K06：材料关系带部件角色与 needs-review 状态；SS304 刷丝/刷座分清；铝供货仍待确认。材料显示名本地化而存储值不变。
- K10/K21：测量指南直接提供现有下载；背槽与刷座字段分开，同步 8 份条刷清单；新增 8 份空白供应商审核记录，含图纸、样品批准、尺寸检查、包装与变更项目，无虚构结果。
- K13–K16：保留真实 Product，无 Offer/Review；补与可见层级一致的 BreadcrumbList、稳定实体 ID。Sitemap 分页读取实际已发布语言，排除既有淘汰记录、去重，列表也有语言映射；本地核对仍为 1,024 路由，未收缩现有八语索引范围。
- K18–K20：资料页传受限 kind/slug，后台只接纳公开已发布主题；产品与业务线一致性校验；主题保存到已有 rfq JSON，无新数据库迁移/第三方分析。语言切换仅保留 line、product、context。
- 既有 CMS 发布包、公司主数据、生产连接、robots 训练许可及私有上传状态均未改写。

## 验收证据（2026-09-26，官网工作目录）

| 层级         | 方法                                                                                          | 结果                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 生产基线     | `node scripts/audit-seo.mjs https://keliran.com before`                                       | 1,024/1,024 200；canonical 正确；无 noindex、缺失 h1；见 reports/keliran-http-before.json 与路由 CSV     |
| 类型/构建    | 本地启动器下 typecheck、`pnpm build:local`                                                    | 通过；最终构建日志 `.local/seo-build-final.log`                                                          |
| 单元         | `node scripts/local-env.mjs pnpm test`                                                        | 81 项通过；10 项集成在此默认跳过，另行运行                                                               |
| 本地数据库   | `RUN_INTEGRATION=true node scripts/local-env.mjs pnpm test tests/payload.integration.test.ts` | 10/10 通过，含主题/刷座字段实际落库、未知和草稿身份拒绝、重复提交、未配置邮件状态                        |
| 浏览器       | `node scripts/local-env.mjs pnpm test:e2e`                                                    | 69/69 通过，日志 `.local/seo-e2e-final.log`；初轮 4 处过时断言/定位等待问题已修正                        |
| 最终视觉微调 | 关联卡片去重、首页断行；重建后只重跑受影响 SEO/视觉套件                                       | 12/12 通过；2 处旧定位断言更新为正文链接唯一性后通过；截图 `.local/seo-geo-ui/`                          |
| HTTP 回归    | `node scripts/local-env.mjs pnpm verify:http`                                                 | 1,024 认证预览路由、60 素材、metadata、安全隔离通过；此项不等同匿名生产                                  |
| 内容发布保护 | `pnpm audit:release:local`                                                                    | ready=true；118 × 8 正文完整，20 素材无阻塞；本轮证据副本 `.local/seo-final-release-audit.json`          |
| 关系/sitemap | `node scripts/local-env.mjs node --import tsx scripts/verify-seo-relations.ts`                | 17 入口、91 链接，missing=[]；1,024 唯一地址，128 产品详情语言地址；reports/keliran-relations-check.json |
| 格式/diff    | `pnpm format:check`、`git diff --check`                                                       | 通过                                                                                                     |

生产真实邮件、验证码提交、附件、真实用户性能/排名未测试；不将模拟提交或匿名可访问性当作真实送达/收录。已有浏览器测试改写的旧历史截图和 release-audit 时间戳已另存本轮 `.local/`，历史文件保持原版本。

## 平台授权与发布

- 初次 Bing 提交被自动审批拦截（它认为原指令不包含平台提交）。已按用户随后明确答复「授权提交与请求收录」取得 Google/Bing sitemap、历史屏蔽验证及核心页收录请求授权。
- Google/Bing sitemap 均已提交；Bing Success、发现 1.0K 地址；Google 复查仍为无法抓取，公开 XML 与 Bing 正常，后续原因尚未确认。Google 历史 robots 验证已开始。两平台均已接收首页加 4 个代表产品页请求，完整 URL、实时抓取与回执见发布后验收。
- 应用提交 `30447db468dd613931312926d1fb54daf8540ca9` 已推送 main，Vercel Production 于 18:23:25 UTC Ready，keliran.com 为 Current。发布后 1,024 路由及 28 项功能检查通过，详见 [发布后验收](../../reports/keliran-audit-after.md)。生产只读验收与本地提交测试分别记录。

## 接续与回滚

- 下一步优先复查 Google sitemap 读取状态及历史 robots 验证结果；若持续失败，结合真实抓取日志再定位，不重复批量提交、不擅改安全规则。收录和排名尚不能由请求接收推断。
- [证据缺口](../../reports/keliran-content-evidence-gaps.md)：真实供货/技术证据、工程测量图人工审核、新词条人工行业语言审核、真实询盘送达及搜索后续效果。
- [迁移候选](../../reports/keliran-redirect-candidates.csv)：本轮没有新增永久迁移、删页或取消索引；RUB-001 保留。
- 本次仅代码和公开派生文件；可通过 revert 本任务应用提交回滚，再由 main 触发 Vercel。无本次数据库迁移需要撤销。平台 sitemap 提交不删除已存在内容，回滚代码也不要求删除 sitemap。
