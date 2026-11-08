# 2026-09-24 官网正文发布包

覆盖 118 条 CMS 内容、8 个语言、452 段去重文本及 20 张引用图片标题。正式内容源为 `scripts/seed/catalogue.ts`、`scripts/seed/resources.ts`，公司字段为 `content/business-profile.json`。

- `en.json` 与七语 JSON：按英文文本哈希索引的正文和素材标题。
- `<locale>.review.json`：实际独立 API 审核报告，保留发现的问题，不伪造通过状态。
- `review-history/`：修改前报告与逐项修订依据。
- `review-resolutions.json`：Codex 主会话复核解决记录，绑定原报告与最终译文哈希。属于 AI 辅助编辑审核，不声称母语人工、法律或产品认证审核。
- `media.json`：用户对当前 20 张示意图的授权与文件哈希。最终发布替代文本采用已审核词典，按相同英文标题解析；保留示意属性。

`node --import tsx scripts/publish-approved-release.ts` 默认只生成并验证包，不连接数据库。真实生产过程、测试、备份和未完成事项以 [Execution](../../docs/execution/EXEC-20260924-production-release.md) 为准。本包存在或本地审核通过不代表生产发布完成。
