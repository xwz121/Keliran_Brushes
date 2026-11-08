# keliran.com → brushes.keliran.com 内容迁移

把 keliran.com 生产 CMS 中的工业刷内容（`line = brushes`）、共享资料（`line = both`）、页面、公司资料、术语表及其引用图片，复制到本站独立数据库。旧库只读，不复制询盘、客户附件、管理员、会话或待执行任务。

## 三个脚本

| 命令                                                                           | 作用                                                                          | 写入                       |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | -------------------------- |
| `pnpm migration:export`                                                        | 只读导出到 `.local/migration/<时间>/`（`bundle.json`、图片、`inventory.csv`） | 只写本机 `.local/`         |
| `pnpm migration:import --plan` / `--apply`                                     | 检查目标库并预览，或写入                                                      | `--apply` 才写目标库与存储 |
| `pnpm migration:redirects [--main-repo=<主站路径>] [--write-shared-canonical]` | 生成跳转清单、主站跳转数据、共享资料 canonical 清单                           | 只写代码文件               |
| `pnpm migration:check-redirects --main=<主站> --brushes=<本站>`                | 逐条请求旧网址验证跳转                                                        | 不写                       |

## 源库连接（只读）

在本项目根目录创建 `.env.migration-source`（已被 git 忽略，切勿提交或粘贴到聊天）：

```sh
# keliran.com 所在的阿里云 RDS PostgreSQL 实例，库名 keliran_CMS，使用只读账号；
# 主机、端口与 SSL 参数与主站连接串相同
MIGRATION_SOURCE_DATABASE_URL=postgresql://brushes_export:<密码>@<实例地址>:<端口>/keliran_CMS
# 主站公开图片地址（即主站 R2_PUBLIC_URL），用于下载并校验图片
MIGRATION_SOURCE_MEDIA_BASE_URL=https://<公开图片域名>
```

只读账号的建法：在 RDS 控制台“账号管理”创建普通账号 `brushes_export`，再用高权限账号在 DMS 中连接 `keliran_CMS` 执行（大小写混合的库名需加双引号）：

```sql
GRANT CONNECT ON DATABASE "keliran_CMS" TO brushes_export;
GRANT USAGE ON SCHEMA public TO brushes_export;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO brushes_export;
ALTER ROLE brushes_export SET default_transaction_read_only = on;
```

在本机运行导出时，临时把本机公网 IP 加入 RDS 白名单，导出后移除。

导出脚本还有两道保护：连接参数要求会话只读（若数据库代理拒绝该参数，可设 `MIGRATION_SOURCE_SESSION_OPTIONS=off`，仍依赖账号与事务保护）；全部读取在同一个 `REPEATABLE READ READ ONLY` 事务中完成，结束时回滚。

导出前停止条件：事务不是只读；源库存在 `migration_records`（说明连到了本站库）；源库迁移记录不是仓库已知的 6 个。

## 导入与保护

本地隔离演练（库 `keliran_brushes`，端口 55440）：

```sh
pnpm db:start
node scripts/local-env.mjs pnpm migrate
node scripts/local-env.mjs pnpm migration:import --plan
node scripts/local-env.mjs pnpm migration:import --apply
```

远程目标（RDS 上的 `keliran_brushes`）先 `--plan`，确认输出的数据库名后，带 `--target-fingerprint=<plan 输出值>` 再 `--apply`。写生产库属于生产数据迁移，须另有授权。

写入前全部检查，任一项失败即停止且不写入：

- 目标与源库为同一数据库（按 `current_database()` 与服务器标识比对：Neon timeline、系统标识，或 RDS 上服务器自报的地址与端口；换公网/内网地址或账号也能识别）；
- 目标没有 `migration_records` 表（未跑本站迁移，或连到了主站库）；
- 本地目标不是 `keliran_brushes`；远程目标缺少或不匹配 `--target-fingerprint`；
- 目标迁移未全部执行；
- 首次导入时目标已有任何内容、图片或询盘（防止误用主站库的克隆或已有数据的库）；
- bundle 缺文件、图片校验不符、批准原图无法复现、关系依赖缺失、slug 非法或重复。

## 幂等与不覆盖

`migration-records` 账本按源记录 ID 保存 `sourceHash`（导出时）和 `importedHash`（写入后读回）。哈希基于与数据库无关的规范化文档：去掉 ID 与时间戳，关系换成 `集合/slug`，图片换成文件 SHA-256，同时包含已发布版本和较新的草稿。

| 再次执行时                                         | 处理                   |
| -------------------------------------------------- | ---------------------- |
| 目标没有该记录                                     | 新建                   |
| 目标未被编辑（当前哈希＝`importedHash`）且源有变化 | 更新（上线前最终同步） |
| 目标已被编辑、被删除，或同 slug 记录非迁移导入     | 跳过并列为冲突         |
| 源库已删除                                         | 只报告，不删除         |

写入后每条记录必须满足 `importedHash = sourceHash`（原样复制），否则整个内容事务回滚。图片上传先于内容事务，每张单独记账，中断后重跑会续传。

## 图片与审核证据

- 能对应 `content/release-20260924/media.json` 已批准原图的图片，从原图上传，并校验存储文件与生产对象逐字节一致；其余标为“重编码副本，需目检”。图片写入本站 `brushes/` 前缀；八语替代文本、示意图与批准标记原样复制。
- 文本证据：英文与各语言译文全部等于已审发布包最终文本的记录标为 `release-20260924`，沿用原审核；任何不同（包括生产后续编辑）标为 `needs-review`。翻译运行记录只作引用，不导入（其哈希含旧库 ID）。改写后的正文须在本站多语发布中心重新复审。

## 跳转清单

`pnpm migration:redirects --main-repo=../../Keliran.com/Keliran_Sealing` 生成：

- `reports/brushes-redirect-map.csv`：八语旧网址→新网址（详情、工业刷中心页、询价与目录入口）；
- 主站 `src/lib/brushes-redirects.ts`：主站据此做 308 永久跳转；
- 加 `--write-shared-canonical` 时重写 `src/lib/shared-canonical.ts`。只在首次迁移时使用；之后改写发布的共享资料要手动从清单删除，避免被重新加回。

上线时以最终导出重新生成，跳转至少保留一年。
