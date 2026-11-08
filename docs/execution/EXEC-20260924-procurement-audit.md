# EXEC-20260924-procurement-audit · 按采购与渠道审计优化官网

- 状态：DONE（用户授权推送 main；`d9afeaa` 于 2026-09-24 20:39:25 UTC 在 Vercel Production 部署完成，线上只读验收通过）
- 负责人 / 会话：本次 Claude Code 会话（主会话实现；一个只读子 Agent 复核七语新文案，不写文件）
- 创建 / 最后更新：2026-09-24，America/Los_Angeles
- 依据：[Keliran 官网深度评价与优化方案](../../../Keliran_Website_Procurement_Channel_Audit_2026-09-25.md)（下称“审计”，其第 00 节说明它未实测网站，页面问题均为“待复核”）
- 关联：[渠道入口链接与产品参考号](../channel-links.md)、[EXEC-20260924-visual-review-fixes](EXEC-20260924-visual-review-fixes.md)、[EXEC-20260924-verify-checks](EXEC-20260924-verify-checks.md)
- 缩写：Request for Quotation（询价请求，RFQ）；Stock Keeping Unit（库存单位，SKU）；Non-Disclosure Agreement（保密协议，NDA）；Urchin Tracking Module（来源追踪参数，UTM）；Search Engine Optimization（搜索引擎优化，SEO）

## 目标与验收条件

用户要求：根据审计继续深度优化 `webs&CMS/Keliran_Sealing`，然后推送到 `main`。

本轮先把审计中的“前次观察”与实际代码、内容对照，只做能在代码与界面文案中真实落地、且不需要新增业务事实的项目。审计明确要求不编造的内容（真实样件、检验记录、客户案例、印刷物、个人名片、社交账号）只登记为人工输入。

- [x] 首页首屏与首页标题先说明产品（审计 KEL-11、§02.1、§21.1）。
- [x] 产品页说明“产品系列参考号 + 供货状态”，不暗示现货或 SKU；询价表、WhatsApp 预填消息、结构化数据使用同一参考号（KEL-05/06/07、§06.4、§21.2）。
- [x] 被转发的产品页可直接进入公司资料与供应商准入资料；供应商准入指南侧栏给出登记所需公司资料；法律页与指南提示付款资料核验（KEL-10、§10.7、§14.4–14.6、§21.5、§21.14）。
- [x] 页脚在版权声明之外显示英国公司法定信息（KEL-02、§02.9、§14.4）。
- [x] 询价页和图纸区给出保密协议路径（§15.3、§21.7）；邮箱字段不再暗示必须用企业邮箱（§15.1）。
- [x] 从 WhatsApp 聊天链接进入的买家看到“无需再次提交，在原聊天回复”（KEL-12、§08.4、§21.8）。
- [x] 打印/另存 PDF 的页面保留正文、在线地址与公司法定信息（§10.7、§17.3）。
- [x] 渠道链接与产品参考号对照表（KEL-12、§18.2）。
- [x] 不改动已批准发布清单；八语文案、测试与文档同步。

## 范围、归属与基线

| 类别     | 路径 / 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 基线     | origin/main `296f755`（生产）。共享检出停在已验收未推送的 `claude/visual-review-fixes`（`78d975d`，基于 `296f755`，交接写明“可快进合并”）；另有 `claude/verify-check-fixes`（`bd42879`，仅验收脚本、`.prettierignore` 与文档）。本任务在独立工作树 `webs&CMS/Keliran_Sealing-procure` 新建分支 `claude/procurement-audit`，自 `78d975d` 起并合并 `claude/verify-check-fixes`（`d843322`，无冲突），因为用户要求推送 `main`，这两个分支均为已验收、只待合入的前序工作。共享检出与 `Keliran_Sealing-verify` 工作树未改动；共享检出 `AGENTS.md` 的他人未提交修改未触碰 |
| 可写范围 | 前台页面（首页、产品详情、RFQ、前台 layout）、`Footer`、`InquiryForm`、`ResourcePage`、新增 `SupplierReview`、`ContinueChatNotice`、`EmailText`、`src/lib/{company,interface-copy,inquiry-attribution,jsonld,i18n}.ts`、`src/proxy.ts`、`llms.txt` 路由、八语 `src/lib/copy/*.json`、`src/styles/redesign.css`、测试、本文与相关文档                                                                                                                                                                                                                                |
| 非目标   | CMS 正文与生产数据库（首页大标题、隐私正文、材料名等仍走正文审核）；`content/`、种子脚本与发布清单；新建 `/r/` 短链、个人名片页、证据页；点击统计或广告回传；社交账号配置                                                                                                                                                                                                                                                                                                                                                                                           |
| 依赖     | 本地数据库 `127.0.0.1:55439/keliran_redesign`；工作树 `media` 以符号链接指向共享检出的本地媒体目录（Git 忽略）                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## 审计对照：已存在、本轮完成、需人工

审计未能访问网站。对照代码与已发布内容后，不少“待复核”项目在上线版本中已满足，本轮不重复建设：

- 询价可靠性（KEL-03）：先校验写库再经持久任务通知，提交 ID 去重，失败保留输入可重试，成功页给参考号；邮件未配置时显示 `not-configured`。
- 文件安全（KEL-04）：私有 R2 桶、签名直传、服务端核对大小/类型/文件头、短时下载；生产未配置私有桶时改为邮件或 WhatsApp 交付图纸。
- 快速与完整询价（KEL-08）：快速询价 + 三组可选详情，数量、公司、国家均可不填。
- 能力声明（KEL-02）：对英文发布包全文检索库存、工厂、认证、保证、免费样品、交期等词，只出现在否定或限定语境（如“不以通用工厂证书代替适用证据”“参考值，非保证规格”）。典型场景均标为“典型场景”。
- 搜索基础（KEL-16）：canonical、八语 hreflang 与 x-default、站点地图只含已发布内容、`robots` 排除后台/接口/预览；结构化数据无价格、库存或评分。

| 审计任务                    | 本轮结果                                                                                                                                                                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KEL-11 首页信息顺序         | 首屏标题上方的眉题改为“工业密封件与工业条刷”（八语 `productIdentity`），原 CMS 眉题文字移到桌面顶栏右侧；首页 `<title>` 改为同一产品名（CMS 另设不同于大标题的 SEO 标题时仍以 CMS 为准）。CMS 大标题 “The right components…” 未改，需要走正文审核                                |
| KEL-05/06/07 参考号与产品页 | 产品页眉题“产品系列”，参考号/状态列表（如 `SE02-CUSTOM` / 依规格报价），以及“本页是产品系列、非单一库存规格”说明；询价表显示“产品参考：名称 · 参考号”；产品页与带 `?product=` 的 RFQ 页 WhatsApp 预填“产品名 + 参考号”；产品结构化数据由 `sku` 改为 `productID`，并加 `category` |
| KEL-10 公司与供应商资料     | 产品页新增“正在评估 Keliran 作为供应商？”区块，直达公司与法律资讯、供应商准入指南、合作流程；供应商准入指南侧栏显示两家主体登记资料与“付款前请确认”；法律页侧栏加同一付款核验提示                                                                                                |
| KEL-02 法定披露             | 页脚在版权行下显示每个有注册号的主体：`Keliran LTD · 注册号 · England and Wales · 注册地址`（数据取自站点设置，八语标签与地区译名）；中国主体无注册号，不进入该行，照旧在公司资料中显示                                                                                          |
| §15 询价与保密              | RFQ 左栏与“图纸、照片与安全”组显示保密协议提示并链接 `contact@keliran.com`，只承诺先确认文件交换方式；邮箱字段标签由“Work email”改为“Email”（八语）                                                                                                                              |
| KEL-12 渠道承接             | 访问带 `utm_source=whatsapp` 时，同一分页 24 小时内的产品页、RFQ 页显示继续聊天提示与按钮；新增 [渠道链接表](../channel-links.md)（Facebook、Instagram、WhatsApp 资料页/聊天、名片、手册、展会的建议链接与 16 个参考号）                                                         |
| §10.7 转发与打印            | 打印时隐藏页眉、询价区、WhatsApp、页脚导航与链接区，保留正文、参考号、页脚法定信息，并在末尾打印“在线版本：完整网址”（由 `proxy` 传入路径）；供应商准入指南打印时保留公司登记侧栏                                                                                                |
| llms.txt                    | 增加公司资料与合作流程链接                                                                                                                                                                                                                                                       |
| 未做，需人工                | KEL-09 真实证据（样件、检验记录）；KEL-06 截面图/尺寸示意/实物照片；KEL-13 印刷物、`/r/` 短链与个人名片页；KEL-14 Facebook/Instagram/WhatsApp 内置浏览器实机；KEL-15/19 点击统计、同意机制与广告回传；KEL-17 目标角色任务测试；中国主体统一社会信用代码与对外英文名核验          |

## 文案

新增 18 个界面键（`productIdentity`、`productFamily`、`referenceLabel`、`statusLabel`、`familyNote`、`supplierReviewTitle`、`supplierReviewBody`、`companyInfo`、`companyRecordTitle`、`registeredOffice`、`paymentCheckTitle`、`paymentCheckBody`、`ndaNote`、`chatContinueTitle`、`chatContinueBody`、`chatContinueCta`、`whatsappProductMessage`、`printedFrom`），英文依审计 §21 改写，只陈述现有流程。另改：`email` 标签八语、德语 `registration`（“Registrierung”→“Registernummer”）、德语 `companyPosition` 中“Streifenbürsten”→“Leistenbürsten”（与全站界面术语一致）。七语由本会话起草，另一 Agent 只读复核，采纳其 fr/de/es/it/ja/ko 共 16 处措辞建议；数字、单位、邮箱与 `{product}`/`{ref}` 占位符由测试校验。**尚未经人工语言审核。**

注意：德语产品名 “Metallkanal-Streifenbürsten” 等来自已批准 CMS 正文，与界面术语 “Leistenbürsten” 不一致，本轮未改（需正文审核）。

## 实际验证

时间：2026-09-24 约 13:00–13:40（America/Los_Angeles）；工作树 `webs&CMS/Keliran_Sealing-procure`，分支 `claude/procurement-audit`。应用命令均经 `scripts/local-env.mjs`（本地数据库，关闭 R2、邮件、AI、Turnstile）；本地生产服务运行于 3000 端口（开始时该端口空闲）。

| 层级      | 方法                                                                  | 结果                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 类型检查  | `pnpm typecheck`                                                      | 通过                                                                                                                                                                                                                                                                                                                                                                                                         |
| 单元测试  | `pnpm test`                                                           | 74 通过，9 项集成测试按设计跳过；新增 `tests/procurement.test.ts` 6 项（法定信息行八语、无注册号不显示、预填消息占位符、结构化数据无 SKU/offer、保密提示含邮箱、WhatsApp 来源识别）                                                                                                                                                                                                                          |
| 集成测试  | `RUN_INTEGRATION=true pnpm test tests/payload.integration.test.ts`    | 9/9 通过（本轮未改服务端逻辑，作回归）                                                                                                                                                                                                                                                                                                                                                                       |
| 生产构建  | `pnpm build`（经 local-env）                                          | 通过                                                                                                                                                                                                                                                                                                                                                                                                         |
| 发布清单  | `.local/hash-check.ts` 调用 `approvedRelease()` 与 `releaseHash` 比较 | 一致 `249d8acd…`，生产构建的发布门槛不受影响                                                                                                                                                                                                                                                                                                                                                                 |
| 浏览器    | `pnpm exec playwright test`（本地生产构建）                           | 62/62 通过；新增 `tests/e2e/procurement.spec.ts` 9 项：首页眉题与标题（en/de/ja/zh-Hant）、产品页参考号/状态/结构化数据/供应商链接均 200/询价表与聊天同一参考号、WhatsApp 来源提示跨页保留且其他来源不显示、RFQ 参考号与保密提示、页脚法定信息八语、指南与法律页付款提示、打印样式、de/fr/ja/ko 在 390/1280px 无横向溢出。首次运行打印测试失败（打印规则被后面的屏幕规则覆盖），将相关规则移到文件末尾后通过 |
| HTTP 验收 | `pnpm verify:http`                                                    | 通过：1,024 条认证路由、60 个媒体、元数据、OG、robots/sitemap、私有接口、未发布隔离与非法请求                                                                                                                                                                                                                                                                                                                |
| 发布审查  | `pnpm audit:release:local`                                            | `ready: true`，无阻塞（输出时间戳文件已恢复，不入库）                                                                                                                                                                                                                                                                                                                                                        |
| 格式      | `pnpm format:check`                                                   | 通过                                                                                                                                                                                                                                                                                                                                                                                                         |
| 截图      | `.local/capture-procurement.mjs`                                      | 入库于 `docs/review/procurement/`：en 手机首页、en 手机产品页（WhatsApp 来源）、de 桌面产品页、ja 供应商准入指南、繁中页脚、en 产品页打印预览；已人工查看                                                                                                                                                                                                                                                    |

浏览器测试会重写已入库的 `docs/review/polish-success-mobile.png`，与本任务无关，已恢复。

未执行：真实询盘提交与邮件送达；Safari/Firefox 与社交应用内置浏览器；人工语言审核；打印到真实纸张。

## 阻塞、风险与恢复

- 继续聊天提示只按来源标签判断：从 WhatsApp 资料页进入、尚未聊天的访客也会看到这句问句（措辞为问句）。可在资料页网址去掉 `utm_source=whatsapp` 规避，代价是失去来源记录。
- 页脚法定信息把“有注册号的主体”所列地址标为注册地址；目前只有 Keliran LTD 满足，且与 Companies House 及法律页一致。若以后为中国主体填写注册号，需确认所填地址即其登记住所。
- 首页 CMS 字段 `hero-kicker` 的文字现显示在桌面顶栏右侧（手机隐藏），首屏眉题改由界面文案提供；编辑该字段仍有效，但位置已变。
- 恢复：各文件改动可随提交整体回退；无数据库迁移、无内容或发布清单改动。

## 交接

- 渠道账号、印刷物、名片与目录按 [渠道链接表](../channel-links.md) 配置前，需由人提供实际账号地址与物料版本。
- 七语新文案待人工语言审核（登记于 [多语发布审查](../MULTILINGUAL-RELEASE-REVIEW.md)）。
- 后续建议（需业务输入）：一个代表性产品的真实样件与内部检验记录（审计 §13.3–13.4 模板）；截面/尺寸示意图；中国主体登记资料核验；隐私正文补充 WhatsApp。

## 上线

- 推送（2026-09-24 20:38 UTC，用户授权）：`claude/procurement-audit` 推送至 origin；推送前 `git fetch` 确认 origin/main 仍为 `296f755` 且为本分支祖先，origin/main 快进至 `d9afeaa`。随之上线的还有 `claude/visual-review-fixes`（`88db143`、`78d975d`）与 `claude/verify-check-fixes`（经合并提交 `d843322`）。
- 部署：GitHub 提交状态 Vercel `success`（“Deployment has completed”）；GitHub Production 部署记录创建于 20:39:25 UTC、状态 success。构建内发布步骤按设计只做只读核对（发布清单哈希未变、无新迁移）。
- 线上只读验收（约 20:40–20:45 UTC，`curl` + Playwright/Chrome，未提交任何表单、未发送消息）：8 种语言 × 首页 / 产品页 / 带产品的 RFQ / 供应商准入指南 / 法律页 × 390 与 1280px 共 80 次加载，全部 HTTP 200、无横向溢出、无控制台错误；每页页脚含 Keliran LTD 注册信息；首页眉题非空、`<title>` 为 “Industrial sealing components & strip brushes | Keliran”；产品页参考号/状态两项与三条供应商链接齐全，结构化数据为 `"productID":"SE02-CUSTOM"` 且无 `sku`；RFQ 保密提示链接邮箱；指南侧栏公司登记资料；无 WhatsApp 来源时不显示继续聊天提示。另 3 次加载：带 `utm_source=whatsapp` 的产品页显示提示且按钮为 `wa.me/8617509072335` 并预填 `SE02-CUSTOM`，站内跳到 RFQ 后提示仍在；打印媒体下询价区隐藏、“Online version: https://keliran.com/en/products/sponge-rubber-seals” 显示；`/llms.txt` 含公司资料链接。
- 未验证：真实询盘与邮件、真实 WhatsApp 会话、社交应用内置浏览器、纸面打印。
