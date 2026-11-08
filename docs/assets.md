# 品牌与素材记录

## Logo

- 使用 `logo/README.txt` 定义的 **Keliran Logo System 1.2x**，源目录为 `/Users/mac/Desktop/Keliran/logo`。
- 浅色背景：`public/brand/1.2x/keliran-sealing-light.svg`，复制自 `logo/light/Keliran-Sealing-1.2x.svg`，文字为海军蓝 `#101A3A`。
- 深色背景：`public/brand/1.2x/keliran-sealing-dark.svg`，复制自 `logo/dark/Keliran-Sealing-1.2x-Dark.svg`，文字为白色。
- 保留原始金色渐变、Montserrat 转曲字标和 `868 × 300` 画布比例。行业版图形高度为两行文字整体高度的 1.2 倍，按原稿居中，不拉伸、不做 CSS 反色。SVG 仅规范文本换行和行尾空白，图形数据与设计源文件一致。
- 白色导航固定使用浅底版本；深蓝页脚与关于我们品牌展示区固定使用深底版本；Payload 后台按照实际主题切换。
- 使用版本目录避免浏览器沿用旧 Logo 缓存。
- `public/brand/1.2x/keliran-symbol.svg` 与 `src/app/icon.svg` 从新 SVG 的 `Original_gold_symbol` 组直接提取，保留路径和渐变，以居中的正方形画布用于后台导航及浏览器标签页。
- `src/app/favicon.ico` 包含从同一图形导出的 16、32、48 像素透明图标；`src/app/apple-icon.png` 为 180 像素白底图标，用于移动设备收藏。所有图标均由原始矢量生成，没有重新绘制。

## 首页示意图

文件：`public/images/sealing-hero.png`，1536 × 1024。由内置 ImageGen 生成，用于本地示意预览；界面明确标注 Illustrative product rendering 及六种译文。图片没有作为已确认的实际产品照片导入 CMS。

生成设计要求：

> Premium studio product mockup for an industrial sealing supplier. A physically plausible arrangement of black rubber O-rings, flat black gaskets and washers, and restrained brown/gold sealing components on a brushed silver metal disk. Pale neutral studio background, soft directional daylight, precise material surfaces, quiet editorial composition, wide landscape framing. No text, no logo, no labels, no factory or certification claims.

## 字体

自托管 IBM Plex Sans、IBM Plex Sans JP、IBM Plex Sans KR。来自 IBM 官方 npm 包，许可文件随字体一起保存在 `public/fonts`。日、韩文字体采用官方 Unicode 子集，浏览器按需加载；不依赖 Google Fonts 网络请求。

## 正式产品素材

正式产品图片由后台上传，并填写来源/授权记录和所有已启用语言的替代文本。`approved` 需要显式确认。生成式示意素材如果用于正式站点，也应保留 `illustrative` 标记。不得据此声称真实供货、库存、认证或制造能力。
