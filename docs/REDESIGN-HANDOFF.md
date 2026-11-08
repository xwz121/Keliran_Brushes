# 最新更新

2026-09-23 已完成本地八语界面与真实联系资料接入。当前状态请优先阅读 [多语发布审查](./MULTILINGUAL-RELEASE-REVIEW.md)；下文首次重构交接中的联系方式与界面待办已被本轮更新取代。CMS 正文批量审核由用户明确暂停，尚未正式上线。

# Keliran 官网重写交付说明

目录保持 `Keliran_Sealing`，站点品牌改为 Keliran 总标。此次交付是现有 Next.js / Payload 项目的完整本地改版，没有发布到线上，也没有连接线上数据库执行迁移。

## 业务与内容

- 双产品线：机柜/设备密封 + 工业条刷；旧 `/products/[slug]` 地址保留。
- 14 个分类（含 3 个配套工艺）、16 个产品族/原有产品、17 个材料条目、8 个应用、10 个解决方案、6 个典型场景、8 篇指南、34 个 FAQ、5 个基础页面，共 118 条英文草稿。
- 供应商准入指南明确交易主体、生产责任、图纸版本、材料、样品、检验和变更管理等需要确认的记录。
- 典型场景明确标识，不冒充客户项目。没有客户 Logo、虚构证书、产能、报价、MOQ 或交期承诺。
- 5 张 imagegen 产品族图，PNG 原图与 WebP 网络版本均在项目内。完整提示词见 [assets-v2.md](assets-v2.md)。前台保留产品示意说明，不要求标注“AI生成”。
- 8 种语言路由、原有基础界面翻译、新导航翻译和发布管线保留。**新业务内容目前是英文草稿，其他语言在认证预览中显示英文来源；尚未完成翻译和正式发布审核。** 首页主体文案存储在可翻译的 `sections` 中；新增技术表单/辅助界面仍有英文文案，正式多语发布前需补齐。

## 本地查看

服务地址 `http://127.0.0.1:3000`。必须保持这个主机名，避免与 localhost 的浏览器 Cookie 混用。

```sh
pnpm dev:local
```

已建立独立本地数据库 `keliran_redesign`，本地启动器关闭线上 R2、邮件、AI、Turnstile，且不会改写现有 `.env`。

本地管理员凭据仅保存在被 Git 忽略的 `.local/redesign-admin.json`。登录 `/admin/login` 后打开 `/api/preview?path=/en`；它开启 1 小时认证草稿预览，站内导航会保留预览状态。退出预览后，匿名用户看不到草稿。

从零重建本地环境：先启动项目已有本地 PostgreSQL，再创建 `keliran_redesign` 数据库；运行 `node scripts/local-env.mjs pnpm migrate`、`pnpm seed:local`、`pnpm review:setup`。默认 seed 幂等且不覆盖已有编辑；`--refresh-drafts` 显式刷新种子内容的英文草稿，保留历史版本与已发布版本，使用前先确认编辑差异。

## 询盘与文件

- 短询盘和技术 RFQ 均接入原有询盘后台。密封/条刷字段分别保存，产品链接带入产品与产品线。
- 文件流程：同源检查 → IP 限流 → Turnstile → 45 分钟签名会话 → 10 分钟预签名上传 → 检查对象大小、类型与文件头 → 保存询盘。每次会话最多 5 个文件、每个 10 MB。
- 必须配置与公开媒体桶不同的 `R2_PRIVATE_BUCKET`，关闭该桶的公开域名和 `r2.dev`。只有前缀不同不能实现私有。
- 上传不经过 Vercel 函数的大请求体；浏览器直接 PUT 到 R2。询盘邮件只含文件名和后台地址，不包含公开附件链接。
- 后台管理员/编辑身份验证后，附件下载地址有效期 5 分钟，过期记录不可下载。询盘附件不进入 AI 翻译任务。
- 定时任务清理到期附件和超过一天的孤儿上传。文本询盘记录保留供人工审查，未自动删除法律/业务记录。
- 私有桶未配置时，RFQ 会明确显示附件上传暂不可用，仍可提交文字需求。**本地已验证规则、权限与数据流；真实 R2 的签名、CORS、PUT、文件验证及删除需在 staging 完成实测。**

私有桶 CORS 示例（仅允许实际站点来源）：

```json
[
  {
    "AllowedOrigins": ["https://keliran.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 600
  }
]
```

## 上线前配置与发布

1. 在 Payload「站点设置」填写经营主体、注册/税号（如适用）、地址、公开邮箱、电话、营业时间。WhatsApp/LinkedIn/Facebook 后续填写，空值不显示。不要把后台通知邮箱当作未经确认的公开邮箱。
2. 先备份线上库，并在其独立 staging 副本运行迁移 `20260923_220302_redesign_two_lines`。本轮已在独立本地库执行全部迁移成功；未在实际云库运行。
3. 将内容导入 staging 为草稿，核对原有文章与新英文草稿，确认图像、资料和交易描述。按发布中心流程完成事实确认、素材批准、8 语翻译/检查和发布，不绕过门控。
4. 设置专用私有桶，验证 CORS 与实际图纸上传/下载/到期清理；配置 Resend 和销售通知地址，验证实际邮件送达及队列重试；Turnstile 增加新域名。
5. 将 `keliran.com`/`www.keliran.com` 绑定当前应用，`NEXT_PUBLIC_SERVER_URL=https://keliran.com`；保留旧域名，代码按 `LEGACY_HOSTS` 做保留路径的 308 跳转。未改动 DNS、Vercel 项目或 Cloudflare 设置。
6. 公开图片继续兼容旧行的 R2 前缀；如切换图片域名，先验证旧媒体地址。当前未重写现有媒体记录或前缀。
7. `CONTENT_PREVIEW_MODE=false`；验证 sitemap、JSON-LD、分享图 `/og`、llms.txt、询盘通知与后台下载。开发/预览环境始终 noindex，llms.txt 在非正式环境返回 404。

未启用访客分析或营销 Cookie；后续接入统计时同步更新隐私文案。

## 验证命令

```sh
node scripts/local-env.mjs pnpm typecheck
node scripts/local-env.mjs pnpm test
RUN_INTEGRATION=true node scripts/local-env.mjs pnpm test tests/payload.integration.test.ts
node scripts/local-env.mjs pnpm test:e2e
node scripts/local-env.mjs pnpm verify:http
pnpm build:local
```

Playwright 使用本机 Chrome，登录独立本地管理员。浏览器测试覆盖两个产品线、RFQ 预填、指南、典型场景、空联系渠道、草稿隔离及 390/1280px 布局。HTTP 检查覆盖 136 个多语言路由及安全/SEO 入口。

调研来源和设计判断见 [b2b-benchmark.md](b2b-benchmark.md)。首轮截图在 `docs/review/`，后续页面以本地实时预览为准。

## 本轮实际验收结果

- TypeScript 检查通过；最终生产构建成功，新增路由和 `/og` 分享图片可生成。
- 单元测试 33 项通过；真实 PostgreSQL / Payload 集成测试 8 项通过，包括技术 RFQ 字段保存和安全审核标记。
- 浏览器 11 项测试均验证通过。最后并行检查中，跨 18 页的响应式用例超过原 30 秒时限；将该用例上限调为 90 秒后单独复测，18.3 秒通过，未发现布局溢出。
- 136 个认证草稿页面、公开草稿隔离、后台/附件鉴权、同源与请求体限制、JSON-LD、canonical/hreflang 和实际分享图片地址检查通过。
- CMS 类型再次生成无改动；后台 import map 无新增差异；`git diff --check` 通过。
- 使用 in-app browser 实际检查桌面和 390px 手机首屏，恢复默认窗口大小并保留登录预览页。
- 未调用线上邮件、AI 翻译、真实私有 R2 文件服务；未部署或更改域名。

## 2026-09-24 最终验收

最新检查、修复、依赖扫描与发布阻塞见 [最终验收记录](FINAL-CHECK.md)。本轮在全新临时本地库验证了全部五个迁移及当前 CMS 查询，临时库已删除；此结果不代表生产库已经迁移。八语 HTTP 验收已扩展为读取全部 CMS 列表及详情，共 1,024 个路径和 60 个素材地址。
