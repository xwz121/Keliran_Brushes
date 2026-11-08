# SEO / GEO 发布后验收 · 2026-09-26

主记录：[Execution](../docs/execution/EXEC-20260926-seo-geo.md)。应用提交 `30447db468dd613931312926d1fb54daf8540ca9`，main 已推送，Vercel Production 于 18:23:25 UTC Ready，正式域名为 Current。

[应用部署](https://vercel.com/abs-projects-df97feac/keliran_sealing/Bo6FUgq3LP3MtakrTzvRcXoEKrSL)；GitHub 提交状态 Vercel success。

## 生产只读验收

- `node scripts/audit-seo.mjs https://keliran.com after` 于 18:24:58 UTC 完成：1,024 / 1,024 地址 200，wrongCanonical/noindex/missingH1/errors 全为空。
- 与 before CSV 比较：路由集合完全相同；缺失 canonical、hreflang、JSON-LD 均为 0。完整记录：[HTTP 汇总](keliran-http-after.json)、[路由 CSV](keliran-route-inventory-after.csv)。JSON-LD 原始快照在忽略目录 `.local/seo-geo-after/`。
- Sitemap 返回 200、application/xml，标准 XML 解析通过，1,024 条、1,023,785 字节。分页、语言和去重已在本地实际 CMS 核对。
- 18:26:51 UTC：八语共 24 份公开下载及材料角色、产品面包屑、主题询盘、robots 四项检查通过，见 [功能证据](keliran-production-features.json)。没有发送生产询盘。
- 历史报告的 http/https × www/非 www 四个根域地址均最终到 `https://keliran.com/en`，200。
- 本轮浏览器版式、交互、数据库落库是隔离本地验收；生产 Safari 额外确认刷座页部件角色、铝材待确认提示、采购字段和询盘入口已显示。没有点击生产验证码或发送表单，也没有测量真实用户性能。

## 搜索平台实读与提交

操作使用用户已登录 Safari；用户明确授权提交 sitemap、历史 robots 验证及核心页面收录请求。账户标识、Cookie 和原始会话不写入记录。

- Google 首页 `/en` 单页检查显示已收录。18:25:31 UTC 实时测试：Google 检查工具智能手机版；允许抓取=是、抓取=成功、允许索引=是、规范地址=`https://keliran.com/en`。首页更新请求已加入优先抓取队列。
- Google 历史 robots 问题已显示「验证 已开始，开始日期 2026/9/26」；旧汇总仍为 9 月 20 日、4 个根域地址，不能解释为新版失败。
- Google sitemap 已显示提交成功；18:41 UTC 复查仍为无法抓取、未显示有效读取日期，不能标记为处理成功。公开 XML 验证正常且 Bing 已成功读取；需保留 Google 待重抓/进一步诊断项，不据此宣称搜索平台全部通过。进一步打开 sitemap 网址实时检查时，Search Console 页面反复空白且界面定位失效，故这项未完成；不将首页实时测试替代 sitemap 专项测试。
- Bing sitemap 已从 Processing 变为 Success；详情显示 Successfully processed，已发现 1.0K 个地址（平台舍入显示），错误/警告均 0。首页和四个代表产品页均已显示 Indexing requested。18:37 UTC 刷座页 Live URL 测试显示 URL can be indexed by Bing、No SEO/GEO issues found。
- Google 海绵密封条页已收录；产品摘要提示缺少 offers / review / aggregateRating，因此不具备商品富结果资格。继续保留真实 Product，不伪造价格或评价；此提示不等于网页未收录。资格要求与 [Google 官方产品摘要文档](https://developers.google.com/search/docs/appearance/structured-data/product-snippet) 一致。Google 展示的旧抓取时间为 2026-09-26 02:11:45 PDT，早于此次部署。

收录请求不是收录承诺。排名、生成式引用、有效询盘与邮件送达不在以上通过项内。

## 核心页请求回执

2026-09-26，约 18:27–18:41 UTC，以下 5 个 URL 在 Google 均显示「已请求编入索引／已加入优先抓取队列」，在 Bing 均显示「Indexing requested.」。没有重复请求同一 URL，也没有批量提交全部 1,024 个地址。

| URL（https://keliran.com）         | Google 提交前单页状态          | Bing 提交前单页状态                    | 最终请求状态   |
| ---------------------------------- | ------------------------------ | -------------------------------------- | -------------- |
| /en                                | 已收录；实时测试成功           | Not discovered                         | 两个平台均接收 |
| /en/products/sponge-rubber-seals   | 已收录；商品富结果缺少资格字段 | Not discovered                         | 两个平台均接收 |
| /en/products/solid-rubber-profiles | Google 无法识别此网址          | Discovered but not crawled             | 两个平台均接收 |
| /en/products/formed-strip-brushes  | Google 无法识别此网址          | Discovered but not crawled             | 两个平台均接收 |
| /en/products/brush-holders         | Google 无法识别此网址          | Discovered but not crawled；实时可索引 | 两个平台均接收 |
