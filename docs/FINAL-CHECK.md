# 官网最终代码验收 · 2026-09-24

最新状态见 [八语正文与生产发布记录](execution/EXEC-20260924-production-release.md)：118 条八语正文、20 张素材及英国公司资料已在生产发布，main 已推送，Vercel Ready，keliran.com 新版已上线。最新线上证据及真实询盘/邮件验证边界以该记录为准。下列测试数和待办保留较早的代码验收基线，不能作为当前生产状态；最新本地审查为 `ready: true`。

本轮完成官网代码、资源和数据库迁移的本地验收，并整理为 `codex/final-website-check` 发布分支。生产 `main` 关联 Vercel 自动部署；在正式数据库和内容准备完成前，不合入生产分支。

**代码与本地功能验收通过；正式内容发布仍有阻塞。** 本轮未恢复真实 API 翻译，未修改生产数据库、DNS 或生产服务配置。

后续询盘转化改进及其独立验证见 [2026-09-24 首波询盘承接记录](execution/EXEC-20260924-inquiry-sprint.md)。下列数字保留本记录原验收基线。

## 验收结果

| 检查                           | 结果                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| TypeScript                     | 通过；最终 `next build` 也完成类型检查                                                                                   |
| 单元与真实 PostgreSQL 集成测试 | 52/52 通过，含 8 项数据库集成测试                                                                                        |
| Playwright 浏览器测试          | 21/21 通过，使用最终生产构建                                                                                             |
| 八语 HTTP 验收                 | 1,024 个列表与详情路径通过                                                                                               |
| CMS 引用素材                   | 60 个原图/响应式图片地址通过                                                                                             |
| SEO 与权限                     | canonical、JSON-LD、分享图、noindex、robots/sitemap、草稿隔离、私有 API、非法请求检查通过                                |
| 数据库迁移                     | 全新临时本地库中五个迁移全部通过；全部内容集合、询盘、媒体、审核记录及站点设置查询通过；临时库已清理                     |
| 生产构建                       | Next.js 16.3.5 构建成功                                                                                                  |
| 格式及 Git 空白检查            | 通过                                                                                                                     |
| 生产依赖审查                   | `pnpm audit --prod`：无已知漏洞                                                                                          |
| 秘密信息检查                   | 待提交文件未发现当前 `.env` 中的密钥/数据库连接串或私钥、GitHub/OpenAI 令牌模式；本地凭据、备份和浏览器状态保持 Git 忽略 |

浏览器测试覆盖八语界面、语言切换、移动端无横向溢出、产品搜索与筛选、询价产品线预填、提交成功焦点、网络失败的本地化提示、双 WhatsApp 入口、未提供的社交渠道隐藏及匿名权限。

更新依赖后还只读检查了 CMS 仪表盘、产品列表及站点设置页面：均正常渲染，未出现浏览器运行时异常。

截图已更新于 `docs/review/`，实际查看了桌面首页和手机 RFQ 的完整布局。HTTP 验收中的非英语 CMS 正文为认证草稿预览的英文回退；页面可用不代表正文已经翻译。

## 最后修复

- 过期附件清理原先固定读取前 100 条询盘；已分页遍历，避免较早的无附件记录阻塞后续文件回收，并增加回归测试。
- 重新选择不合规文件时，清除上次上传引用、签名和进度，避免保留旧附件状态。
- 网络错误统一使用当前语言的询盘提示，避免直接向访客显示英文浏览器异常。
- 发布审查改为遍历实际引用的素材，覆盖后来新增的独立产品/工艺配图；新增正文缺失、空库和必需图片检查，禁用审查期间的开发 schema 同步。
- HTTP 验收从固定抽样扩展到 CMS 全量路由及引用素材；浏览器预览初始化验证重定向状态，不再自动跟随页面请求。
- README 更新为当前双产品线、技术 RFQ、私有附件与隔离本地环境的实际流程。Next.js 自动生成的 `next-env.d.ts` 不再进入格式校验。
- 锁定 Monaco 的 DOMPurify 依赖为 3.4.13、旧 esbuild-kit 的 esbuild 依赖为 0.25.12，修复扫描出的五条公告。修复依据为 [DOMPurify 官方公告](https://github.com/cure53/DOMPurify/security/advisories/GHSA-55q2-fjhq-7xh7) 和 [esbuild 官方公告](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99)；依赖调整后重新验证了构建、全部单元/集成测试及迁移。

## 当时的正式发布阻塞（后续处理见最新 Execution）

机器可读结果见 [release-audit.json](review/release-audit.json)，当前 `ready: false`：

1. 118 条英文 CMS 草稿完整；另外七种语言每种仍有 118 条正文待翻译。此前暂停的真实 API 翻译/审核尚未获得恢复指示，本轮未执行。
2. 118 条内容仍未统一发布，业务事实确认与真实八语审核尚未通过。
3. 当前内容引用 20 张素材；19 张独立产品/工艺图缺少七语替代文本及素材批准，共 152 项素材待办。首次产品族素材的批准不等于后续独立配图也已批准。
4. Keliran LTD 注册号、注册地区和地址的注册办公室身份仍待提供/确认。隐私与法律正文需确认实际经营及数据处理安排。
5. 生产数据库迁移、内容导入、真实 Turnstile 与 Resend 送达尚未执行或验证。私有 R2 上传在真实桶完成权限、CORS、上传、下载及清理验收前保持未启用。

不得把模拟测试结果、认证草稿预览或仓库推送视为正式内容审核通过。后续先在独立 staging 验证迁移和内容，再安排生产迁移及分支合入。

## 2026-09-24 后续改动说明（已上线 `13f9a0e`）

上文“双 WhatsApp 入口”指当时的悬浮选号弹层。分支 `claude/website-polish` 已将其改为一键入口：页眉拆分按钮、RFQ 与产品询价区左栏面板、手机悬浮按钮，主号码取站点设置第一个号码。该分支的本地验证与上线后的线上只读验收见 [EXEC-20260924-website-polish](execution/EXEC-20260924-website-polish.md)；上文验收结果仍对应当时版本。

## 2026-09-24 验收脚本与格式基线修正（经 `d843322` 合并，随 `d9afeaa` 上线）

本地分支 `claude/verify-check-fixes`（已变基到 origin/main `10128e3`）修正两项与代码改动无关的基线失败。验证命令与证据见 [EXEC-20260924-verify-checks](execution/EXEC-20260924-verify-checks.md)。

- **HTTP 验收中的草稿隔离**：原断言要求匿名 `draft=true&locale=all` 查询 `totalDocs === 0`。它写于 `fceb3eb`，当时本地库只有草稿。现在本地库 16 个产品均已发布，所以断言失败，但并没有草稿泄露。现改为与浏览器测试相同的不变量：匿名草稿查询取全部产品（`limit=250`，确认没有下一页），每个文档的 `_status` 都是 `published`；`where[_status][equals]=draft` 查询返回 0。上文“草稿隔离”一行仍指当时的旧断言。
- **格式检查：选择加入 `.prettierignore`，不重排文件。** `pnpm format:check` 失败于 `content/release-20260924/` 下的 5 个文件：ja/ko 审核报告、`review-history/round-1/` 中的 ja/ko 报告及 `review-resolutions.json`。已验证 Prettier 只会把短数组合并为一行。五个文件解析后深度相等，发布校验用的内容哈希也不变（`src/lib/ai/checks.ts` 的 `hash()`：对键排序后的 JSON 计算 SHA-256）。因此两种做法都不影响发布包校验。仍选择忽略，原因有两点：
  1. 这些文件由 `scripts/prepare-content-release.ts` 以 `JSON.stringify(…, null, 2)` 写出，数组总是展开。其余语言的报告能通过检查，只是因为它们的 `deterministic` 数组为空；任何一次重新生成都会让检查再次失败。
  2. 忽略后，提交的字节与生产发布实际读取的版本（`e7c66c0` 引入，与 origin/main 相同）保持一致。审计时比对文件校验和，不必再解释“只有空白变化”。

  Vercel 生产构建（`scripts/vercel-release.ts`）要求发布清单哈希等于固定的 `releaseHash`。该清单同样由解析后的内容计算，变基后已复核两者仍相等。

  忽略范围为 `content/release-20260924/**/*.json`，目录内的 `README.md` 仍接受格式检查。以后新建发布目录如果继续使用该脚本，需要另加同类规则，或让脚本直接输出 Prettier 格式。

## 2026-09-24 采购审核与渠道承接（分支 `claude/procurement-audit`）

该分支在 `claude/visual-review-fixes` 基础上合并 `claude/verify-check-fixes`，并按采购与渠道审计补充产品参考号与状态、供应商评估入口、页脚法定信息、付款核验与保密协议提示、WhatsApp 回访提示和打印样式。本地验证：类型检查、单元 74、集成 9/9、生产构建、浏览器 62/62、`verify:http`（1,024 条路由）、`audit:release:local`（`ready: true`）、`format:check` 均通过，发布清单哈希不变。已于 2026-09-24 20:39 UTC 以 `d9afeaa` 上线，线上只读验收见同一记录。详见 [EXEC-20260924-procurement-audit](execution/EXEC-20260924-procurement-audit.md)。
