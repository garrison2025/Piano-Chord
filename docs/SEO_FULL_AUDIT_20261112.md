# Piano Chord Explorer｜全站 SEO 审核与修复报告

审核日期：2026-11-12。当前公开测试站：https://piano-chord.pages.dev/。
代码仓库：https://github.com/garrison2025/Piano-Chord。
数据口径：2026-11-11 V1.3 可行性方案 + 2026-11-12 实站 43 个原有 HTML URL 逐页提取 + 新版 About/Privacy 实站抽查 + GitHub Actions 构建全量审核。绝不将竞品 Semrush 估算当作本站实际自然搜索点击。

## 一、执行结论

**技术站内 SEO 验收通过；完整生产 SEO 尚未完成。** 可读、可用、可抓取的内容与基本站内结构已经具备，重要缺口已在本轮修复。仍必须进行正式域名、Cloudflare 重定向、Google Search Console 和实际性能验证，不能据此宣称 Google 已收录、关键词已有排名或移动端 CWV 通过。

## 二、覆盖面与指标（基于修复后的构建）

| 项目 | 最新结果 | 说明 |
|---|---:|---|
| Sitemap 列出的可索引 HTML | 44 | 旧 43 + 独立 About；隐私页不在 Sitemap |
| 不索引的独立隐私页 | 1 | Privacy 标记 noindex,follow；仍由页脚可访问 |
| 和弦教学详情页 | 29 | 16 个 V1.3 优先词页面 + 13 个原创教学补充页 |
| 交互式和弦库页面 | 1 | 展示 120 和弦，未批量生成 120 个薄内容 URL |
| 独立和弦 SVG 图 | 29 | 稳定路径 /diagrams/{slug}.svg，并列入图片 Sitemap |
| 全站 HTML img 引用 | 47 | 引用次数，不等于 47 张不同图片 |
| 不重复 Title | 44 / 44 | 旧 29 篇 Title 均已重新编辑 |
| 不重复 Description | 44 / 44 | 包括 About 与主要工具页 |
| 孤立的可索引页面 | 0 | 每个 Sitemap 页面都有从另一个页面来的 HTML 链接 |
| 构建 SEO 深度审核 | 0 错误、0 警告 | CI run 43189015384 |

最新审核脚本：scripts/seo-integrity-audit.mjs。检查实际 dist 内生成的 HTML，而不是只检查 Astro 模板；完整 JSON 结果可从该 GitHub Actions 运行的 piano-chord-seo-audit 附件下载。

## 三、已通过的技术项目

1. Robots.txt：允许抓取公开内容，并使用与构建 Canonical 同源的绝对 Sitemap URL。
2. Sitemap.xml：44 个唯一的绝对规范 HTML URL，29 个对应的图片扩展记录。未人为编造 lastmod 时间。
3. 全站 Title/Description/Canonical：完整存在，名称唯一、路径正确；页面有一个主 H1，HTML lang=en，og:url 与 canonical 对应。
4. BreadcrumbList JSON-LD：页面中的结构化数据可通过 JSON 语法解析、路径有效；首页新增 WebSite 名称声明。未增加假评价、假 FAQ 或搜索行为 Schema。
5. HTML 链接图：从生成文件检查所有站内超链接目标，不存在孤立可索引页面，未发现本轮覆盖范围内的损坏站内链接。
6. 图片：主要和弦页面有标准 img src 指向独立 SVG，并有描述性 alt。Google Search Central 支持 SVG 作为图片搜索资源；真实 Google Images 是否索引仍需 GSC 验证。
7. 实站路由抽查：HTTP 跳 HTTPS；无斜杠和弦页跳到 /chords/b-minor/；不存在的和弦页返回 HTTP 404；查询参数页的 canonical 指向主工具 URL。精确的 301/308 响应状态码未独立记录。
8. 隐私和错误页面：Privacy 及 404 不加入索引；About 可索引且有公共反馈渠道。

## 四、实际发现并修复的缺口

### P1：和弦搜索 Title 过长、缩写意图表达弱 — 已修复

原 29 个 Title 约 73–84 个字符，共用相同的长尾后缀。新的独立标题约 38–51 字符，明确包括 Bm、Bb、Em、Gm、C7、Cmaj7 等实际词形，同时保留正确的和弦名称/音符。并未改变原 URL、H1 和原来的 29 篇教学文案，也没有制造新页面。Google 不规定固定字符上限；优化目标是易读和减少重复模板，而不是满足某个虚构的字数门槛。

### P1：网站身份和可信度说明不足 — 已修复

首页加入标准 WebSite JSON-LD（品牌 Piano Chord Explorer、真实 Canonical URL、英文语言）。新建 About 页面解释免费功能、乐理计算逻辑、SVG 图、浏览器合成音的限制、自动化测试的范围，并提供真实公开的 GitHub Issues 意见反馈链接；没有捏造专家头衔、作者姓名、资质或邮箱。

### P1：缺少隐私说明 — 已修复

增加 Privacy 页面并在每页页脚链接；明确录制和 MIDI/视频在浏览器中处理，不需要上传；说明 Cloudflare 托管、Google Fonts 请求、选择 MP4 时 jsDelivr 资源请求及第三方平台跳转。页面当前 noindex,follow、未列入 Sitemap。若未来添加 AdSense、Analytics 或广告 Cookie，必须更新说明和按实际地区要求安排合规选择机制。

## 五、仍未关闭的项目

| 优先级 | 项目 | 状态与下一动作 |
|---|---|---|
| P0 | 正式域名及统一 Canonical | 现仍以 piano-chord.pages.dev 为 canonical。域名购买/绑定后，在 Cloudflare build 环境将 PUBLIC_SITE_URL 配置为正式 HTTPS 域名；验证 https、www、旧 Pages 预览域名至主域的实际重定向行为 |
| P0 | Google Search Console | 未核实所有权、实际 Google 选定 Canonical、索引数量、受阻页面和查询；连接财产后上传最终域名 sitemap.xml 并检查 URL |
| P1 | Core Web Vitals | 实验室曾测虚拟钢琴初始 JS 约 65 KiB（未压缩），但未独立取得移动/桌面真实 LCP、INP、CLS。Google Fonts 是外部请求，可能影响字体加载；先测量再决定是否自托管 |
| P1 | 网站实际外链/品牌曝光 | 本轮无法基于可靠数据核实引荐域、非品牌搜索排名与增长。需要 GSC 或实际外链工具数据，优先相关音乐学习站，避免低质目录群发 |
| 已修复 | Social/Open Graph 图片 | 全站已设置 OG image、Twitter image、大图卡片，统一使用本地 1200×630 PNG；构建及实站元数据核查通过；实际社交平台展示尚未验收 |
| P2 | 图像搜索表现 | SVG 可在生成文件和图片 Sitemap 中发现，但 Google Images 的真实曝光/索引尚未检验；可基于实际图片展现再决定是否为高价值 16 页提供 PNG |
| P2 | 手机硬件与跨浏览器 | Chromium 桌面及 390px 模拟端验收通过；真实 iOS Safari、Android Chrome、Firefox、慢网络下仍需验证 |
| P2 | 内容优于竞品的程度 | 29 篇每篇有音符/转位/试听/听辨，值得进一步人工评测音乐教学深度与可读性。无需为提升字数机械填充，工具页功能本身是重要主内容 |

## 六、V1.3 搜索需求范围与实际 SEO 表现的区别

- V1.3 实际批准的首批验证对象是 16 个高意图和弦页，数据来自用户 Semrush 美国 Positions 和竞品 pianochord.org 的 Pages 报告；所有 Volume、KD 均是历史研究数据。
- 前列关键词包括 bm chord piano（US Volume 5,400，KD26）、bb piano chord（4,400，KD21）、em on piano chords（3,600，KD17）、c7 chord（5,400，KD12）、g chord piano（6,600，KD20）。
- 竞品 pianochord.org 美国自然月流量约 115,100 是 Semrush 估算，**不是本站流量，也不是本站收益预测**。
- 当前本站真实 GSC 点击、展示、非品牌流量与页面索引均未获取。新增 13 个和弦详情页的教学完整性不能被表述为 13 个都已独立验证搜索需求。
- 120 和弦交互目录与 29 个独立 SEO 详情页保持分开；继续反对为了堆 URL 数量而模板化扩展其余 91 页。

## 七、建议的上线与 GSC 操作顺序

1. 确定并绑定正式域名，统一首选 host，重新构建并独立验证首页、Bm、Bb、C7、和弦图及所有 Sitemap 规范 URL。
2. 在 Google Search Console 添加正式域名财产；提交正式域名 /sitemap.xml。抽样检查首页、/chords/b-minor/、/chords/b-flat-major/、/chords/c-7/、/tools/chord-library/、/tools/virtual-piano/ 的覆盖、Google 选定 Canonical 和手机可抓取性。
3. 上线后分 30/60/90 天查看 Web 与 Image 搜索的展示、点击、CTR、主要查询及有效索引。按具体页面与词组修订内容；不以单一综合 SEO 评分替代实际数据。
4. 取得真实 CWV 与 Google Images 曝光后，再决定是否自托管字体或补新 SEO 详情页；共享 PNG 社交封面已完成，不代表所有平台一定显示。

## 八、参考依据及验证边界

代码：
https://github.com/garrison2025/Piano-Chord
https://github.com/garrison2025/Piano-Chord/actions/runs/43189015384
https://github.com/garrison2025/Piano-Chord/blob/main/scripts/seo-integrity-audit.mjs

Google 官方：
https://developers.google.com/search/docs/essentials
https://developers.google.com/search/docs/appearance/title-link
https://developers.google.com/search/docs/appearance/site-names
https://developers.google.com/search/docs/appearance/google-images
https://developers.google.com/search/docs/fundamentals/creating-helpful-content

审计证明的是：源代码、生成 HTML、已抽样抓取的 Cloudflare 预览地址和本轮自动化覆盖范围。无法证明 Google 已收录任何 URL、竞争排名已改善、未来 AdSense 审核会通过、外链已获得或真实用户体验无问题。


---

## 九、第二轮 SEO 修复记录（2026-11-12，后续提交）

**执行原则：** 保留 V1.3 的 16 个有搜索需求证据的优先关键词入口及当前 29 篇独立课程，不批量为 120 个和弦生成新的索引页。前一轮构建审计已确认抓取、链接及元数据基础；本轮转向有实际教学帮助的工具正文、图文分享与资源发现。

### 实际修改

1. **Chord Finder**：三个可直接操作的例子，C–E–G（C major）、A–C–E（A minor）、C–E–G–B♭（C7）；解释 C7/Cmaj7 区别及 3/4 音组合识别的边界，链接到相应教学页。页面文字为静态生成的 HTML，非仅在 JavaScript 中可见。
2. **Chord Compare**：加入 Bm→D major（共享 D/F♯）及 C7→Cmaj7（B♭→B）的音符变化练习，并提供预选 A/B 的工具链接。
3. **Metronome**：增加 2/4、3/4、4/4 计数示例：60 BPM 时 2/4=2 秒/小节、3/4=3 秒/小节；80 BPM 时 4/4=3 秒/小节。没有改变节拍器原功能。
4. **Google Fonts**：从主 CSS 的远程 import 改成 HTML head 预连接及外部样式表，减少串行发现环节；仍要连接第三方域名，不代表实际 Core Web Vitals 已改善或字体已自托管。
5. **社交分享**：新增本地 1200×630 PNG，所有页面共享正确绝对主机的 OG image 和 X/Twitter large-image 元数据。CSS/JS 构建流程仍使用原有依赖，没有新 API 或托管固定费用。
6. **自动测试**：44 个索引 HTML、44 个唯一 Title/Description、29 张原始 SVG 和弦图、0 孤立页面保持不变；新增 head 字体加载、社交图地址与真实 PNG 尺寸的静态检查及浏览器回归。

### 实站可提取正文对比

| 网址 | 初审核英文词数 | 本轮修订后 |
|---|---:|---:|
| /tools/chord-finder/ | 148 | 475 |
| /tools/chord-compare/ | 202 | 374 |
| /tools/metronome/ | 201 | 347 |

字数只是同一提取工具两次 HTML 提取的结果，**不是搜索质量评分或排名预测**。新增教学内容的主要目的是提高工具可操作性，是否影响搜索点击仍必须等实际 Google Search Console 数据。

### 实站验证及未完成范围

- Cloudflare 预览站首页、Chord Finder、Chord Compare、Metronome 都已读取到新 OG PNG 路径及正确规范主机元数据。
- 新版静态构建与 Chromium 音乐工具测试通过；新增 PNG 图片浏览器解码核查亦已加入后续测试。
- 尚未取得 Google Search Console 的实际收录、搜索查询、非品牌自然点击、图片展示及真实 Core Web Vitals，也未绑定最终自定义域名。
- X、TikTok、Facebook 对 PNG 的最终展示可能受平台抓取及缓存影响，未冒充为实际发布平台验收。
