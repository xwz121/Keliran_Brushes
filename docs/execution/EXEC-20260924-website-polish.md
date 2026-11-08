# EXEC-20260924-website-polish · 一键 WhatsApp、快速询价表、双产品线呈现与克制动效

- 状态：DONE（已推送并合并 main，`13f9a0e` 于 2026-09-24 18:20:45 UTC 在 Vercel Production 部署完成；主 WhatsApp 号码随后改为固定 +86）
- 负责人 / 会话：本次 Claude Code 会话（主会话实现；只读分析、翻译起草与复核使用子 Agent，均不写文件）
- 创建 / 最后更新：2026-09-24，America/Los_Angeles
- 缩写：One-click-to-WhatsApp（一键 WhatsApp，OCTW）；Request for Quotation（询价请求，RFQ）；Largest Contentful Paint（最大内容绘制，LCP）；Cumulative Layout Shift（累计布局偏移，CLS）。
- 关联：[首波询盘承接](EXEC-20260924-inquiry-sprint.md)（本项变更其第 56 行“基础用途、数量、材料、尺寸在前”的询价表决策）、[生产发布记录](EXEC-20260924-production-release.md)

## 目标与验收条件

用户在官网上线后提出四点：OCTW 只在页脚且询价页找不到；询价表是否过于复杂；两条产品线的选择与呈现是否合理；缺少 GSAP 动效。用户已确认的取舍：主号码始终为中国号、WhatsApp 用绿色、询价表采用“快速询价 + 可选详情”、动效为克制工业风、按钮放在询价页左栏和页眉“Request a quote”左侧。实施中用户追加：页眉绿色按钮不好看，改为与“Request a quote”合并的较大拆分按钮。

- [x] 询价页左栏最上方、产品页询价区左栏有一键 WhatsApp；页眉为 WhatsApp +“Request a quote”拆分按钮；手机悬浮按钮一键直达；主号码为中国号，英国号为次要链接。
- [x] 询价表首屏为产品线（含“尚不确定 / 两者”）、需求、数量、姓名、邮箱、同意；其余三组折叠选填；服务端只增加 `line: 'both'` 分支，数据库不迁移。
- [x] 首页首屏点名两条线并直达；落地页不再对 4 个产品提供搜索/筛选，提供测量指南与 RFQ 清单；`/products?line=` 服务端直接过滤。
- [x] 首屏 CSS 入场、首屏以下懒加载 GSAP 一次性显现；减少动态效果时不加载；无 JS 时内容完整；表单与 WhatsApp 入口不做滚动动效。
- [x] 八语文案、测试、DESIGN 与相关文档同步。

## 范围、归属与基线

| 类别     | 路径 / 说明                                                                                                                                                                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 基线     | 仓库 `webs&CMS/Keliran_Sealing`，自 `0074b66`（与 origin/main、`codex/final-website-check` 相同）新建本地分支 `claude/website-polish`。开始时仅 `AGENTS.md` 有他人未提交修改，全程未触碰、未提交                                                      |
| 可写范围 | 前台页面与组件、`src/lib/{whatsapp,contact-channels,rfq-schema}.ts`、`src/lib/motion/`、样式、八语界面文案、`content/business-profile.json`、清单生成脚本与 16 份派生清单、测试、`playwright.config.ts`、`scripts/capture-review.mjs`、本文与相关文档 |
| 非目标   | 生产 CMS 数据、生产部署与推送、真实询盘/邮件、CMS 正文与隐私正文、点击统计、ScrollTrigger/SplitText/页面转场                                                                                                                                          |
| 依赖     | 新增依赖 `gsap` 3.15.0（Standard “no charge” license）；本地数据库 `127.0.0.1:55439/keliran_redesign`                                                                                                                                                 |

## 实施（按提交）

| 提交      | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2203e5` | OCTW：去掉两次点击的 `<details>` 选号弹层；`whatsappContacts` 增加格式化号码并以 CMS 顺序第一个为主号码；新增 `WhatsAppButton`、`WhatsAppPanel`；RFQ 左栏与产品询价区面板（桌面 sticky，手机排到表单前）；手机悬浮按钮（表单聚焦或菜单打开时隐藏）；页脚链接最小 44px；`buildWhatsAppURL` 按码点截断，避免截断 emoji 抛错。清单生成脚本改为中国号在前并重新生成 16 份清单（`content/business-profile.json` 的对调已在上线前撤回，见“上线”）                                                                                     |
| `3e466cd` | 快速询价：产品线三选一（无上下文默认“尚不确定 / 两者”），需求描述提示随产品线变化；规格、公司/交付/样品、图纸/照片/安全三组折叠；切换产品线保留通用字段、清空另一条线专属字段；产品引用显示标题；成功页提供带参考号的 WhatsApp 跟进。`rfqSchema` 增加 `generalRfq`（`line: 'both'`，数据库枚举原已包含）                                                                                                                                                                                                                        |
| `8caea4c` | 产品线：首页导语改用点名两条线的 `heroBody`，并加两条线直达链接；线卡列出 4 个入口产品；产品数 ≤6 的列表不显示搜索/筛选；落地页“What to send”条（测量指南 + 清单）；品类数多于入口产品时显示品类标签（密封 10 个，条刷与入口一一对应不显示）；条刷隐藏重复的“View all products”；`/products?line=` 服务端过滤；页眉询价链接在产品线页面带 `?line=`；文章侧栏对 `both` 文档不再强制 `?line=sealing`                                                                                                                              |
| `2f93cbc` | 动效与页眉：见下节；页眉绿色按钮改为深蓝 WhatsApp 半 + 金色“Request a quote”半的拆分按钮（高 50px，≤1200px 左半只显示图标，≤800px 隐藏）                                                                                                                                                                                                                                                                                                                                                                                        |
| `0553f4e` | 独立评审修复（见“独立评审”）：全部 WhatsApp 按钮改为页眉同款深蓝底白字、仅图标绿色；页面正文已有 WhatsApp 面板或联系方式时不显示悬浮按钮；询价表字段统一 24px 间距、折叠组 +/− 标记；表单只按产品重建，页眉 /rfq 链接不再清空已填内容；无 `?line` 的产品链接按产品所属线预选；目录在 `?line` 变化时重置；引擎改为每页一个 `gsap.context` + 可移除的媒体监听、布局变化时复查、无动效页面不下载、画线可打印；电话号码分组显示；页眉/悬浮/菜单 WhatsApp 读屏提示新标签页；日文标题按短语断行且不溢出；集成测试真正覆盖产品线不一致 |

### 2026-09-24 追加：页眉拆分按钮同色

用户看过深蓝/金两色拆分按钮后要求“两个最好是同个颜色，然后用线分开”。页眉两半改为同一操作金底、深蓝文字与图标（绿色图标在金底上对比不足，改随文字色），中间加 1px 深蓝半透明竖线（上下各留 12px），两半各自悬停变浅金；其他 WhatsApp 按钮保持深蓝底。验证（约 11:05–11:10，另建工作树 `webs&CMS/Keliran_Sealing-cta` 上的 `claude/website-polish`，本地生产构建运行于 3002 端口，因 3000 端口与共享检出目录正被另一后续任务会话使用）：`pnpm build:local` 通过；`whatsapp.spec.ts`、`site.spec.ts`、`inquiry-sprint.spec.ts` 共 20/20 通过（临时配置仅把地址改为 3002）；1280px en/de 与 1100px de 的页眉截图、悬停态实际查看，页眉无溢出；56 张截图矩阵无横向溢出，8 张入库截图已更新。本次仅改 CSS 与 DESIGN，未重跑全部 48 项浏览器测试。

### 上线前检查（用户 2026-09-24 授权推送并合并 main）

- 生产构建命令会运行 `scripts/vercel-release.ts`，它断言已批准发布清单的哈希等于固定 `releaseHash`，而清单包含 `content/business-profile.json`。本分支曾对调该文件中的 WhatsApp 号码，本地计算得清单哈希 `ca043d69…`，与 `249d8acd…` 不符，合并后生产构建会以“The approved release changed”失败。已将该文件恢复为已发布版本（重新计算哈希一致），不修改发布脚本。中国号为主的顺序改由站点设置中两个字段的顺序决定（本地库已对调；生产需在后台对调）。
- 清单一致后，生产构建的发布步骤只读取迁移记录与既有发布回执：本分支无新迁移，回执已完成，不会重复导入内容或覆盖后续 CMS 编辑。
- 浏览器测试改为校验“所有入口使用同一主号码、另一已批准号码为次要”，不再写死顺序；单元测试校验对调字段即对调主号码。复验：类型检查通过，单元 62 通过，浏览器 48/48 通过（工作树本地生产构建，3002 端口，临时配置仅改地址）。

### 上线结果

- 推送：`claude/website-polish` 推送至 origin；origin/main 由 `0074b66` 快进至 `13f9a0e`（用户授权）。Vercel 提交状态 11:20:45（PDT）为 success，GitHub Production 部署记录对应 `13f9a0e`；构建内发布步骤按预期只做只读核对后通过。
- 线上只读验收（约 11:22–11:35 PDT，Playwright + Chrome，未提交任何表单）：8 种语言 × 首页 / RFQ / 两条落地页 × 1280 与 390px 共 64 次加载，全部 HTTP 200、无横向溢出、桌面页眉拆分按钮可见、滚动后无残留未显现的动效元素；手机悬浮按钮在首页与产品线页显示、在 RFQ 页隐藏；`/en/products?line=brushes` 首个 HTML 即为 4 张产品卡。首次运行在部分桌面页记录到 `%c%d font-size:0;color:transparent NaN` 控制台输出（Cloudflare Turnstile 脚本的混淆调试输出，非本站代码），后两次运行未复现。
- 首次上线时主 WhatsApp 号码为英国号（生产站点设置中英国号排第一）；后续已改为代码规则固定 +86 为主号码，见“追加：WhatsApp Business 主号码固定为 +86”。
- 未验证：真实询盘提交、销售邮件送达、真实 WhatsApp 会话；七语新文案仍待人工审核。

### 追加：WhatsApp Business 主号码固定为 +86

用户确认 WhatsApp Business 注册在 +86 175 0907 2335，要求所有主要 WhatsApp 入口使用该号码。因生产站点设置需管理员登录，改为代码规则：`whatsappContacts` 在站点设置列有该号码时总是把它排在首位，其余号码保持站点设置顺序；是否启用与显示哪些号码仍由站点设置决定，不再需要在后台对调字段。页眉、询价与产品面板、手机悬浮按钮、菜单、页脚、成功页与图纸补交入口均经同一函数取号。验证（约 12:00 PDT，工作树 `webs&CMS/Keliran_Sealing-wa`，分支 `claude/whatsapp-business-primary`，基于 `10128e3`）：本地库先按仓库原资料恢复为英国号在前（与生产顺序一致），类型检查通过、单元 62 通过、清单哈希与 `releaseHash` 一致、构建通过、浏览器 48/48 通过（3002 端口，临时配置仅改地址），页眉链接为 `wa.me/8617509072335`。

### 追加：公司主体资料多语与 WhatsApp 单一号码

用户要求把“上海柯立然科技有限公司”“上海市闵行区申虹路33号”等主体字段做八语，并指出英国号仍作为 WhatsApp 次要链接显示（WhatsApp Business 只注册在 +86）。

- WhatsApp：站点设置列有 +86 号码时，它是唯一的 WhatsApp 入口；英国号保留为电话。面板次要链接、页脚与联系页的英国号 WhatsApp 链接随之消失。
- 主体资料：新增 `src/lib/business-i18n.ts`，按页面语言显示阅读译名。站点设置保留注册值（`content/business-profile.json` 属于已批准发布清单，未改）。`BusinessDetails` 在译名与注册名不同时显示“登记名称: 上海柯立然科技有限公司”（新文案键 `registeredName`，八语）；国家名用 `Intl.DisplayNames`；“England and Wales”七语译文；页脚版权行用本地化名称，修正 “Ltd..” 双句点，日、繁中不加西文句点；日、韩版权声明改为本地语言（原为英文）；JSON-LD `name` 本地化并新增 `legalName`（注册中文名），`addressCountry` 用 ISO 代码。
- 验证（约 12:25–12:45 PDT，工作树 `webs&CMS/Keliran_Sealing-i18n`，分支 `claude/business-details-i18n`，基于 `9e1f254`）：类型检查通过；单元 65 通过（新增 `tests/business-i18n.test.ts`，`storage-config` 一项在机器高负载下首次超时，单独重跑通过）；清单哈希与 `releaseHash` 一致；构建通过；浏览器 48/48 通过（3002 端口，临时配置仅改地址），含 en/zh-Hant/ja/de/fr 联系页主体信息、页脚与“英国号无 WhatsApp 链接”断言；实际查看 en/ja/zh-Hant/ko 联系页主体信息文本。
- 未处理（需在 CMS 中修改并走正文审核）：隐私页（`privacy`）有一句正文也写有中文注册名（在已批准发布内容中）。建议在后台把 en/fr/de/es/it/ko 这句中的“上海柯立然科技有限公司”改为“Shanghai Keliran Technology Co., Ltd.（上海柯立然科技有限公司）”（西文用半角括号），日语与繁中保持不变。各语言这句的开头分别为：en “Keliran LTD and 上海柯立然科技有限公司 are the business entities…”；fr “Keliran LTD et 上海柯立然科技有限公司 sont les entités commerciales…”；de “Keliran LTD und 上海柯立然科技有限公司 sind die auf dieser Website genannten…”；es “Keliran LTD y 上海柯立然科技有限公司 son las entidades comerciales…”；it “Keliran LTD e 上海柯立然科技有限公司 sono le entità commerciali…”；ko “Keliran LTD 및 上海柯立然科技有限公司는 이 웹사이트에 명시된…”。
- 新文案（`registeredName`、七语 “England and Wales”、日韩版权声明、公司英文阅读译名）未经人工语言审核。

## 独立评审

实现后运行只读评审工作流：4 个 Agent 分别查看 en/de/ja/zh-Hant 共 56 张截图，3 个 Agent 从正确性、可访问性/本地化、动效/性能/SEO 审查 `0074b66..2f93cbc` 差异。确认并已修复的问题见上表 `0553f4e`；其中视觉评审一致指出面板与悬浮按钮的整块绿色与用户对页眉绿色按钮的意见冲突，故统一为深蓝样式。未在本分支处理的既有问题（非本次引入）：深色产品图上的图片标签不可读、深蓝区“About us”金色链接对比度低、指南摘要中被压平的 Markdown 列表符号、手机首屏保证项换行错位、材料标签与注册地区等 CMS 内容未本地化、德语数字与单位间断行。

动效实现：`src/styles/motion.css` 提供首屏 CSS 入场（首页 H1 按 CMS 换行拆行，只位移不淡入）、画线规则（无 JS 时与原边框一致）和打印兜底；`src/lib/motion/engine.ts` 由 `MotionProvider` 在 hydration 后按页面懒加载（页面没有 `data-motion` 时不加载）；每页一个 `gsap.context`，导航或中途开启减少动态效果时整体 `revert()` 并移除监听。只有初始完全位于视口下方的元素会被设为起始态；滚动与布局变化（ResizeObserver）检查代替 IntersectionObserver（快速滚动或锚点跳过的元素会立即完成，否则会一直隐藏）；聚焦、输入、打印时立即完成。起始态用 `opacity` 而非 `autoAlpha`，避免未显现区域的链接无法用 Tab 聚焦。

文案：新增 11 个、修改 4 个、删除 1 个（`chooseNumber`）界面键。七语由 Agent 起草并由另一 Agent 复核，数字/单位/`{ref}` 由测试校验；未经人工语言审核。

## 实际验证

时间：2026-09-24 约 10:10–11:05（America/Los_Angeles）；工作目录为本仓库，分支 `claude/website-polish`，最终结果对应 `0553f4e`。所有应用命令经 `scripts/local-env.mjs`（本地数据库，关闭 R2、邮件、AI、Turnstile）。

| 层级                                | 方法                                                                     | 结果                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 类型检查                            | `node scripts/local-env.mjs pnpm typecheck`                              | 通过                                                                                                                                                                                                                                                                                                                                        |
| 单元测试                            | `node scripts/local-env.mjs pnpm test`                                   | 62 通过，9 项集成测试在此命令中跳过                                                                                                                                                                                                                                                                                                         |
| 本地数据库集成                      | `RUN_INTEGRATION=true … pnpm test tests/payload.integration.test.ts`     | 9/9 通过，含新增 `both` 入库及“Product line mismatch”断言                                                                                                                                                                                                                                                                                   |
| 生产构建                            | `pnpm build:local`                                                       | 通过                                                                                                                                                                                                                                                                                                                                        |
| 浏览器                              | `node scripts/local-env.mjs pnpm test:e2e`，最终生产构建运行于 3000 端口 | 最终 48/48 通过。过程中：新动效测试曾在引擎加载前计数（修正为等待就绪标记）；评审修复后日文首页 375/390px 因 `word-break: auto-phrase` 横向溢出，已加 `overflow-wrap: anywhere` 修复；悬浮按钮测试按新规则（有面板的页面不显示）更新                                                                                                        |
| HTTP 验收                           | `pnpm verify:http`                                                       | 在第 86 行断言“匿名 `draft=true` 查询 totalDocs 为 0”处失败：本地库现有 16 个产品均为已发布（`_status: published`），该断言写于 `fceb3eb` 本地库仅有草稿时，与本分支无关；e2e 已按“无草稿状态文档”检查同一边界。用仅改此断言的忽略目录副本复跑：1,024 条认证路由、60 个媒体、元数据、私有 API、未发布隔离与非法请求全部通过；仓库脚本未修改 |
| LCP（动效开 / 关，各 5 次取中位数） | `.local/lcp.mjs`（Playwright + Chrome，本地生产构建）                    | 最终构建：`/en` 390px 96 / 96ms，1280px 84 / 88ms；`/en/rfq` 390px 80 / 80ms，1280px 92 / 92ms；LCP 元素两种模式一致（首页手机为 H1 第一行，桌面为主图；RFQ 为导语或 H1）。本地环境数值，不代表线上网络条件                                                                                                                                 |
| 包体                                | 构建产物检查                                                             | GSAP 位于单独 chunk，约 72KB（gzip 约 27.8KB），不在首屏 HTML 引用中；减少动态效果时不加载                                                                                                                                                                                                                                                  |
| 询价表高度                          | e2e 记录 + 本地浏览器                                                    | 桌面表单高度约 1,943px → 1,068px；手机提交按钮约 3,012px → 1,927px（线上旧版本为参照）                                                                                                                                                                                                                                                      |
| 截图                                | `.local/capture-polish.mjs`（减少动态效果）                              | en/de/ja/zh-Hant × 390/1280 × 首页、两条落地页、RFQ、RFQ 条刷、条刷产品页、联系页，共 56 张，均无横向溢出；最终版本已人工查看 RFQ（en 1280、de 390）；8 张精选入库于 `docs/review/polish/`，全量保留在被 Git 忽略的 `.local/polish-matrix/`                                                                                                 |
| 格式                                | 对本次改动文件运行 Prettier 检查                                         | 通过；仓库整体 `pnpm format:check` 在基线即因 5 个 `content/release-20260924/*review*.json` 失败，非本次文件，未改动                                                                                                                                                                                                                        |

未执行：生产环境任何操作；真实 Turnstile、邮件、上传；Safari/Firefox 实机（`:has()` 在旧浏览器只影响“聚焦时隐藏悬浮按钮”）；人工语言审核。

## 阻塞、风险与恢复

- 线上主号码仍取生产 CMS 的第一个号码（目前为英国号）。部署前需在 Payload「站点设置」对调 `whatsappNumber` 与 `whatsappNumberSecondary`，否则主按钮仍是英国号。
- 选“尚不确定 / 两者”的询盘在通知邮件主题中显示 `[both]`，销售端按“未分类”处理；结构化字段减少，国家移入折叠组，按国家复盘主要依靠活动标签。
- WhatsApp 点击目前没有统计；隐私正文尚未提及 WhatsApp/Meta（CMS 正文，另记人工待办）。
- 恢复：各提交可单独回退；CMS 关闭 `whatsappFloating` 只关悬浮按钮，关闭 `whatsappEnabled` 关闭全部 WhatsApp 入口；移除 `MotionProvider` 挂载与 `motion.css` 引入即可去掉动效。无数据库迁移。

## 交接

- 已完成：分支 `claude/website-polish` 全部提交已推送并合并 main 上线；精选截图在 `docs/review/polish/` 与 `docs/review/polish-success-mobile.png`。
- 尚余（需用户决定或授权）：七语新文案人工审核；隐私正文补充 WhatsApp；“独立评审”中列出的既有问题另行处理；`scripts/verify-http.mjs` 第 86 行断言需按已发布数据更新。
- 本地环境：为运行浏览器测试停止了 07:15 启动的旧版 `pnpm start`（3000 端口，旧构建）；本会话最后启动的本地生产服务器仍在 3000 端口。
