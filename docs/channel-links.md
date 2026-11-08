# 渠道入口链接与产品参考号

用途：给 Facebook、Instagram、WhatsApp Business、名片和手册配置官网链接时使用，使同一产品在官网、聊天、询价和印刷物中使用同一个参考号。依据 [采购与渠道审计](../../Keliran_Website_Procurement_Channel_Audit_2026-09-25.md) 第 05、08、10、18 节；实现记录见 [EXEC-20260924-procurement-audit](execution/EXEC-20260924-procurement-audit.md)。

- 本表是**建议链接**，不代表这些账号、名片或手册已经存在或已配置。账号实际地址和印刷物需由人提供后再核对。
- 缩写：Urchin Tracking Module（来源追踪参数，UTM）；Quick Response（二维码，QR）。

## 1. 来源标记规则

官网只保存 `utm_source`、`utm_medium`、`utm_campaign`、`utm_content`、`utm_term` 五个标签、入口路径和外部来源域名，随询盘一起入库；不保存完整查询串。原有约定见 [首波询盘承接](execution/EXEC-20260924-inquiry-sprint.md) 中“来源记录约定与复盘口径”。

- 全部小写，用下划线或连字符；同一印刷物或账号入口的标签保持不变。
- 标签中不得出现邮箱、电话、客户名、图纸名、价格或报价号。
- 站内链接不再加标签；没有标签的访问保持“未知”，不推断渠道。
- 点击或打开页面不等于有效询盘；有效需求、可报价、样品和订单阶段由人工标记。

## 2. 建议链接

`{slug}`、`{ref}` 从第 3 节取；其他语言把 `/en/` 换成 `/de/`、`/fr/`、`/es/`、`/it/`、`/ja/`、`/ko/`、`/zh-Hant/`。

| 入口                         | 建议链接                                                                                                                                        | 说明                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Facebook 主页主链接          | `https://keliran.com/en?utm_source=facebook&utm_medium=organic_social&utm_campaign=profile&utm_content=main_link`                               | 首屏先显示两条产品线                 |
| Instagram 简介链接           | `https://keliran.com/en?utm_source=instagram&utm_medium=organic_social&utm_campaign=profile&utm_content=bio`                                    | 同上                                 |
| WhatsApp Business 资料页网址 | `https://keliran.com/en?utm_source=whatsapp&utm_medium=messaging&utm_campaign=profile&utm_content=website`                                      | 见下方“继续聊天提示”                 |
| 聊天中发送产品页             | `https://keliran.com/en/products/{slug}?utm_source=whatsapp&utm_medium=messaging&utm_campaign=sales_support&utm_content={ref}`                  | 买家看到“无需再次提交，在原聊天回复” |
| 聊天中发送公司资料           | `https://keliran.com/en/legal?utm_source=whatsapp&utm_medium=messaging&utm_campaign=sales_support&utm_content=company`                          | 采购、财务核对主体与注册信息         |
| 聊天中发送供应商准入指南     | `https://keliran.com/en/guides/supplier-qualification?utm_source=whatsapp&utm_medium=messaging&utm_campaign=sales_support&utm_content=supplier` | 侧栏含供应商登记所需公司资料         |
| 名片二维码（公司通用）       | `https://keliran.com/en/contact?utm_source=business_card&utm_medium=offline&utm_campaign=contact&utm_content={card_version}`                    | 个人名片页尚未建立                   |
| 手册产品页二维码             | `https://keliran.com/en/products/{slug}?utm_source=brochure&utm_medium=offline&utm_campaign={brochure_version}&utm_content={ref}`               | 纸面同时印参考号和可读短网址         |
| 展会物料                     | `https://keliran.com/en/products/{slug}?utm_source={event_slug}&utm_medium=offline&utm_campaign={event_campaign}&utm_content={asset}`           | 只用于实际参加的活动                 |

继续聊天提示：来源为 `whatsapp` 的访问，在同一浏览器分页的 24 小时内，产品页和询价页会显示“是否在延续 WhatsApp 对话？无需再次提交询价，请在同一聊天中回复尚缺的尺寸或应用细节”，按钮打开同一 WhatsApp Business 号码。WhatsApp 资料页进入的访客也会看到这句问句；若不希望这样，资料页网址可去掉 `utm_source=whatsapp`，但会失去来源标记。

WhatsApp 预填消息：产品页和带 `?product=` 的询价页，WhatsApp 按钮会预填“产品名 + 参考号”（八种语言），销售可据此对应到同一产品页。

## 3. 产品参考号

以下 16 个参考号是**产品系列参考号**，不是库存单位（Stock Keeping Unit，SKU），也不代表某个现货规格；材料、尺寸、模具、起订量与交期均在报价中确认。来源：本地审核库 2026-09-24，与生产发布内容包一致（发布清单哈希未变）。

| 参考号      | 英文名称                       | 产品线 | 英文页面                                   |
| ----------- | ------------------------------ | ------ | ------------------------------------------ |
| SE01-CUSTOM | Solid rubber profiles          | 密封   | `/en/products/solid-rubber-profiles`       |
| SE02-CUSTOM | Sponge rubber seals            | 密封   | `/en/products/sponge-rubber-seals`         |
| SE03-CUSTOM | Edge trims & bulb seals        | 密封   | `/en/products/edge-trim-bulb-seals`        |
| SE04-CUSTOM | Silicone profiles              | 密封   | `/en/products/silicone-profiles`           |
| SE05-CUSTOM | Moulded rubber components      | 密封   | `/en/products/moulded-rubber-components`   |
| SE06-CUSTOM | Die-cut gaskets                | 密封   | `/en/products/die-cut-gaskets`             |
| SE07-CUSTOM | Fabricated sealing frames      | 密封   | `/en/products/fabricated-sealing-frames`   |
| RUB-001     | Custom molded rubber parts     | 密封   | `/en/products/custom-molded-rubber-parts`  |
| RUB-002     | Solid rubber gaskets & washers | 密封   | `/en/products/solid-rubber-gaskets`        |
| RUB-003     | Custom FKM O-rings             | 密封   | `/en/products/custom-fkm-o-rings`          |
| RUB-004     | Standard O-rings               | 密封   | `/en/products/standard-o-rings`            |
| RUB-005     | O-ring & seal kits             | 密封   | `/en/products/o-ring-seal-kits`            |
| BR01-CUSTOM | Metal-channel strip brushes    | 条刷   | `/en/products/metal-channel-strip-brushes` |
| BR03-CUSTOM | Formed strip brushes           | 条刷   | `/en/products/formed-strip-brushes`        |
| BR04-CUSTOM | Brush holders & channels       | 条刷   | `/en/products/brush-holders`               |
| BR05-CUSTOM | Custom equipment brushes       | 条刷   | `/en/products/custom-equipment-brushes`    |

WhatsApp Business 目录如建立，卡片名称与参考号应与本表一致，卡片链接指向对应产品页；未定价的定制品不填零价格或“现货”。客户专属零件号、图纸版本和样品编号另行管理，不公开在官网。
