# Keliran Strip Brushes

brushes.keliran.com：Keliran 工业条刷独立网站。2026-11-08 从 keliran.com（仓库 `xwz121/Keliran_Sealing`，commit `3a39af7`）拆分而来，拥有独立代码仓库、Vercel 项目、Payload CMS 与数据库；R2 账户与桶和 keliran.com 共用，本站对象在 `brushes/` 前缀下。keliran.com 专注密封件，页脚互相链接。

技术栈不变：Next.js 16、Payload 3、PostgreSQL；前台八种语言（英、法、德、西、意、日、韩、繁中），后台中文。拆分前的发布与审核历史保留在 keliran.com 仓库。

## 站点范围

- 只展示工业条刷与适用的共享资料（采购指南、公司与法律页面）。访问控制只向访客公开 `line = brushes | both` 的已发布内容，页面、REST/GraphQL 与 sitemap 一致。
- 产品参考号沿用：BR01、BR03、BR04、BR05（`-CUSTOM`），没有 BR02。详见 [渠道入口链接](docs/channel-links.md)。
- 路径与 keliran.com 拆分前一致（如 `/en/products/metal-channel-strip-brushes`、`/en/strip-brushes/<分类>`），首页为独立的工业刷首页。
- 从 keliran.com 原样复制的共享资料在改写前，canonical 指向 keliran.com 原文且不进入本站 sitemap（[清单](src/lib/shared-canonical.ts)）。
- 询价接口路径与字段不变；服务器只接受工业刷询盘，旧表单的 `both` 归为工业刷，密封件询盘返回 409 `line-moved` 并提示前往 keliran.com，不跨域重放。产品编号、附件、去重、限流与渠道归因保持原实现。
- 站点常量集中在 [src/lib/site.ts](src/lib/site.ts)。

## 本地开发

Node.js 24 与 pnpm 10.15.0（corepack）。本地数据库需要 PostgreSQL 14+（Homebrew 或 Postgres.app，`PG_BIN` 可覆盖路径）。本站与 keliran.com 可并行运行：

|             | keliran.com                  | 本站                        |
| ----------- | ---------------------------- | --------------------------- |
| 网站        | `127.0.0.1:3000`             | `127.0.0.1:3200`            |
| PostgreSQL  | `55439` / `keliran_redesign` | `55440` / `keliran_brushes` |
| 后台 Cookie | `payload-token`              | `keliran-brushes-token`     |

`scripts/local-env.mjs` 固定连接本机 `keliran_brushes`，关闭真实 R2、邮件、AI 与 Turnstile，不改写 `.env`。

```sh
pnpm install --frozen-lockfile
pnpm db:start                       # 首次会创建 keliran_brushes
node scripts/local-env.mjs pnpm migrate
pnpm seed:local                     # 空库开发用英文草稿；正式内容来自迁移
pnpm review:setup                   # 本地管理员，写入 .local/redesign-admin.json
pnpm dev:local
```

官网 <http://127.0.0.1:3200/en>，后台 <http://127.0.0.1:3200/admin>。始终使用 `127.0.0.1`。

## 内容迁移

从 keliran.com 生产库只读导出、导入本站数据库、生成并验证旧网址跳转，见 [迁移说明](scripts/migration/README.md)。重复执行不重复建档、不覆盖后来编辑；错误目标库或缺失依赖时在写入前停止。

## 内容管理与发布

1. 编辑英文草稿，确认产品事实与素材。
2. 为图片填写八语替代文本并批准公开素材。
3. 在「多语发布中心」运行翻译、技术审核、语言审核和确定性检查。
4. 全部语言通过后统一发布；失败时事务回滚。

源文、译文、术语或模型配置改变后必须重新检查。迁移时原样复制且与已审发布包一致的文本沿用原审核证据；改写的正文和译文必须重新复审。

## 询盘与文件

询盘先校验写库，再由持久任务发送销售通知；通知主题带站点名，后台链接指向本站后台。RFQ 附件最多 5 个、每个 10 MB，经验证会话直传私有桶的 `brushes/inquiries/` 前缀，服务器核对大小、类型和文件头。CRM 以“站点＋记录 ID”关联本站询盘。

## 验收

```sh
node scripts/local-env.mjs pnpm typecheck
node scripts/local-env.mjs pnpm test
RUN_INTEGRATION=true node scripts/local-env.mjs pnpm test tests/payload.integration.test.ts
pnpm format:check
pnpm build:local
node scripts/local-env.mjs pnpm start          # 另一终端：
node scripts/local-env.mjs pnpm test:e2e
node scripts/local-env.mjs pnpm verify:http
```

集成测试只连接本机数据库、使用模拟 AI，不发送真实邮件。

## 部署资料

环境变量见 [.env.example](.env.example)，部署流程见 [部署说明](docs/deployment.md)。素材来源见 [产品配图](docs/product-images.md)、[素材记录](docs/assets-v2.md)，视觉约定见 [设计说明](DESIGN.md)。拆分实施与验证记录见 [EXEC-20261108-brushes-split](docs/execution/EXEC-20261108-brushes-split.md)。
