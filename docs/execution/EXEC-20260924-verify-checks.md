# EXEC-20260924-verify-checks · HTTP 验收草稿断言与发布证据格式检查

- 状态：DONE（本地修改与验证；后经合并提交 `d843322` 随 `claude/procurement-audit` 推送，`d9afeaa` 于 2026-09-24 20:39 UTC 上线，见 [EXEC-20260924-procurement-audit](EXEC-20260924-procurement-audit.md)）
- 负责人 / 会话：本次 Claude Code 会话（“Update stale website verification checks”）
- 创建 / 最后更新：2026-09-24T11:13-07:00 / 2026-09-24T11:50-07:00
- 关联：[代码验收](../FINAL-CHECK.md)（决定与理由的主记录）、[EXEC-20260924-website-polish](EXEC-20260924-website-polish.md)（其验证表记录了这两项基线失败，交接中列出第 86 行断言待更新）

## 目标与验收条件

用户指出两项检查在当前基线上失败，与代码改动无关，要求修正并记录。

- [x] `scripts/verify-http.mjs` 不再要求匿名草稿查询 `totalDocs === 0`，改为检查“不暴露任何非 `published` 文档”，并在本地生产服务器上运行通过。
- [x] `pnpm format:check` 通过；对 5 个发布审核证据文件二选一（运行 Prettier 或加入忽略），先做 JSON 深度相等检查，再在 [FINAL-CHECK](../FINAL-CHECK.md) 记录选择与理由。
- [x] 在新本地分支提交；不推送、不部署、不触碰生产环境；共享检出中 `AGENTS.md` 的既有未提交修改保持不动。

## 范围、归属与基线

| 类别     | 路径 / 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 基线     | 仓库 `webs&CMS/Keliran_Sealing`，自 `ae02a7e`（当时 `claude/website-polish` 的头，未推送）新建本地分支 `claude/verify-check-fixes`。之后 polish 分支已推送至 main（`10128e3`），本分支随即在本地变基到 origin/main `10128e3`；`docs/FINAL-CHECK.md` 末尾的冲突按“保留 main 改写的 polish 小节，再追加本节”解决。本任务期间另有两个会话在同一仓库工作：共享检出已切到 `claude/visual-review-fixes`，`claude/website-polish` 在 `Keliran_Sealing-cta` 工作树中。为不改变共享检出的分支，本任务使用独立工作树 `webs&CMS/Keliran_Sealing-verify` |
| 可写范围 | `scripts/verify-http.mjs`、`.prettierignore`、`docs/FINAL-CHECK.md`（追加一节）、本文。已通过跨会话消息确认与另两个会话的写入范围不重叠                                                                                                                                                                                                                                                                                                                                                                                                      |
| 非目标   | 发布证据 JSON 内容、浏览器测试、应用代码、生产数据库/部署、根级 `doc/` 记录、website-polish 的 Execution（其会话仍在使用该分支）                                                                                                                                                                                                                                                                                                                                                                                                             |
| 依赖     | 本地数据库 `127.0.0.1:55439/keliran_redesign`（只读 GET，无写入）。工作树未复制 `.env` 或管理员凭据，只放两个被忽略的符号链接：`media` → 共享检出的本地媒体（只读服务），`.local/review-state.json` → 共享检出的本地审核会话 Cookie（首轮有效期至 UTC 18:58；变基后复跑前已由其他会话的浏览器测试刷新，有效期至 UTC 19:20）                                                                                                                                                                                                                  |

## 文件与变更记录

| 文件                        | 角色     | 动作                                                                                                                                                                                                                |
| --------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/verify-http.mjs`   | 验收脚本 | 匿名 `draft=true&locale=all&depth=0&limit=250` 查询：确认没有下一页、文档数等于 totalDocs，且不存在 `_status !== 'published'` 的文档（失败时列出 slug）；另查 `where[_status][equals]=draft` 必须为 0。其余检查不变 |
| `.prettierignore`           | 配置     | 新增 `content/release-20260924/**/*.json` 及说明注释；目录内 README 仍接受检查                                                                                                                                      |
| `docs/FINAL-CHECK.md`       | 验收记录 | 追加本次决定与理由                                                                                                                                                                                                  |
| `content/release-20260924/` | 发布证据 | 未修改；字节与 `e7c66c0`/origin/main 相同                                                                                                                                                                           |

## 实际验证

时间均为 2026-09-24 America/Los_Angeles；工作目录为工作树 `Keliran_Sealing-verify`，11:09–11:11 各项针对 `ae02a7e` 加上述修改；约 11:47 起各项针对变基后的分支（origin/main `10128e3` 加本分支 3 个提交）。

| 时间 / 层级       | 命令 / 检查方法                                                                                                  | 结果与证据                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11:09 构建        | `pnpm build:local`                                                                                               | 通过，Next.js 16.3.5，BUILD_ID `UOz25jiFxonh7hYv20D5d`                                                                                                                                                                |
| 11:09 JSON 等价   | 会话临时脚本（未入库）：用仓库 Prettier 3.9.6 格式化 5 个文件，比较解析结果及 `src/lib/ai/checks.ts` 的 `hash()` | 5 个文件 `deepStrictEqual` 通过，内容哈希不变，去掉空白后文本完全相同（只有空白变化）；文件 SHA-256 会改变，行数减少 7–12。据此确认两种做法都安全，选择忽略的理由见 FINAL-CHECK                                       |
| 11:10 格式        | `pnpm format:check`                                                                                              | 通过：“All matched files use Prettier code style!”；`prettier --file-info` 确认 round-1 文件被忽略，`content/release-20260924/README.md` 仍接受检查并通过                                                             |
| 11:10 启动        | `node scripts/local-env.mjs pnpm start`                                                                          | 127.0.0.1:3000 就绪；确认监听进程的工作目录为本工作树。事先与占用 3000 端口的会话协调，对方停止了其服务器                                                                                                             |
| 11:10–11:11 HTTP  | `node scripts/local-env.mjs pnpm verify:http`                                                                    | 通过（约 48 秒）：“Verified 1024 authenticated draft routes, 60 media URLs, metadata, OG image, robots/sitemap, private APIs, unpublished isolation and invalid requests.”                                            |
| 11:11 数据核对    | 对同一服务器只读 GET，不输出 Cookie                                                                              | 匿名旧查询 totalDocs=16，因此旧断言必然失败；匿名全量 16 个均为 `published`，无下一页；匿名 draft 过滤 0。认证最新版本同为 16 个 `published`、draft 0，说明本地库目前没有草稿，“草稿被隐藏”这一分支无法用真实数据触发 |
| 11:11 反例        | 用合成响应执行新断言逻辑                                                                                         | 全部已发布：通过；混入草稿、缺少 `_status`、分页未取全、draft 过滤返回 1：四种情况均按预期失败                                                                                                                        |
| 11:11 收尾        | 停止本任务服务器                                                                                                 | 3000 端口已释放并通知其他会话                                                                                                                                                                                         |
| 约 11:47 发布清单 | `approvedRelease()`（只读取文件，不连接数据库）                                                                  | 变基后 `manifestHash` 仍等于 `scripts/lib/vercel-release.ts` 中固定的 `releaseHash`（`249d8acd…`）；`content/` 与 origin/main 完全相同                                                                                |
| 11:48 格式 / 构建 | `pnpm format:check`；`pnpm build:local`                                                                          | 均通过；BUILD_ID `w7-s0-DrX1Us3P9mqGkZe`                                                                                                                                                                              |
| 11:48–11:49 HTTP  | `node scripts/local-env.mjs pnpm start` 后运行 `node scripts/local-env.mjs pnpm verify:http`                     | 通过：同样为 1,024 条认证路由、60 个媒体地址及其余检查；随后停止服务器，3000 端口已释放                                                                                                                               |

未执行：类型检查、单元/集成测试和浏览器测试（未改应用代码或测试）；生产环境任何操作。上表是本地环境结果，不代表线上验收。

## 阻塞、风险与恢复

- 本地库暂无草稿产品，新断言的“拦截泄露”能力只经合成反例验证。以后若需实测，可在隔离库创建草稿后重跑，不要写入其他会话共用的审核库。
- 浏览器测试 `draft content and private files stay unavailable to anonymous visitors` 使用默认分页（10 条），只检查 16 个产品中的前 10 个。本次未改测试，列为后续可选项。
- 变基后，本分支与 origin/main 只差本分支的 3 个提交（4 个文件），可以快进合并；推送或合并仍需用户授权。
- 恢复：回退本分支提交即可，没有数据或迁移。

## 交接

- 已完成：本地分支 `claude/verify-check-fixes` 的 3 个提交，已变基到 origin/main `10128e3`（未推送）。
- 尚余：推送或合并需用户授权。合并后，website-polish 交接中“第 86 行断言需按已发布数据更新”一项即已解决，由该记录的负责人更新。工作树 `webs&CMS/Keliran_Sealing-verify` 含未跟踪的 `media` 符号链接，不再需要时用 `git worktree remove --force` 移除（只删除链接，不影响共享检出的媒体）。
- 根级 `doc/` 未更新：本项是官网子项目内部任务，没有跨域变化。
