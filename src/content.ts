// ============================================================
//  个人信息填写处 —— 整个网站的文字内容都在这个文件里
//  把下面的占位文字换成你自己的信息即可，其它代码不用动。
//  每一项旁边的中文注释说明了它出现在页面的哪个位置。
// ============================================================

export type DoodleKey =
  | 'camera' | 'game' | 'wave' | 'grid' | 'pen' | 'play'
  | 'share' | 'rss' | 'photo' | 'phone' | 'medal' | 'ribbon' | 'avatar'

// ---------- 首页走廊上方的大标题 ----------
export const profile = {
  // 首页大标题 + 顶部导航的品牌名
  name: '你的名字',
  // 名字的英文/拼音写法，显示在大标题下方（可留空 ''）
  latinName: 'Your Name',
  // 一句话身份，例如：创意开发者 · 前端工程师
  role: '创意开发者 · 前端工程师',
  // 首页的一句话自我介绍
  tagline: '一行介绍：你做什么、喜欢什么、代表作是什么。',
  // 首页右上角的主按钮
  primaryCta: { label: '走进走廊', href: '#about' },
  secondaryCta: { label: '直接看项目', href: '#projects' },
}

// ---------- 「关于我」房间 ----------
export const about = {
  // 也可以放一张真实头像/照片的路径，例如 'assets/me.jpg'（放进 public/assets 后写文件名）；留空 '' 则显示手绘头像
  avatar: '',
  // 「关于我」标题下的小字
  eyebrow: 'About Me · 关于我',
  // 依次填几段自我介绍，每一段是一个字符串
  paragraphs: [
    '第一段：写写你是谁、在哪个城市、做什么工作或学什么专业。比如你如何开始写代码、喜欢什么类型的项目。',
    '第二段：写你的技术栈和做事方式。比如常用的语言、框架、工具，以及你对动画、交互或性能的偏好。',
    '第三段：写你做过什么、拿过什么结果。比如作品被谁收录、服务过什么客户、有什么让你骄傲的数字。',
  ],
  // 「关于我」底部的链接按钮（href 留 '#' 表示待填）
  links: [
    { label: 'GitHub', href: 'https://github.com/你的用户名' },
    { label: 'LinkedIn', href: '#' },
    { label: 'B 站主页', href: '#' },
    { label: 'Email', href: 'mailto:you@example.com' },
  ],
}

// ---------- 「项目作品」房间 ----------
// 每个项目：标题、一句话摘要、弹窗里的详细段落、外链。
// art 是卡片上的手绘小图案，可选：camera 相机 / game 手柄 / wave 声波 / grid 组件 / pen 钢笔 …
// 也可以给 image 填 'assets/xxx.png'（放进 public/assets）用真实截图代替手绘图案。
export type Project = {
  id: string
  title: string
  summary: string
  details: string[]
  link?: string
  linkLabel?: string
  art: DoodleKey
  image?: string
}

export const projects: Project[] = [
  {
    id: 'p1',
    title: '项目一 · 一个完整的网站作品',
    summary: '一句话说明这个项目做了什么、用了什么技术、亮点在哪里。',
    details: [
      '第一段：项目的背景和目标。它是为谁做的、解决了什么问题、你在其中承担什么角色。',
      '第二段：技术实现。用了什么框架和库，动画、性能或工程上有什么值得说的细节。',
      '第三段：结果与反馈。数据、评价、奖项，或者你从中学到了什么。',
    ],
    link: '#',
    linkLabel: '访问项目',
    art: 'camera',
  },
  {
    id: 'p2',
    title: '项目二 · 一个好玩的小实验',
    summary: '一句话说明这个交互实验的玩法和它有趣的地方。',
    details: [
      '第一段：这个实验的创意从哪来，用户能怎么玩。',
      '第二段：技术要点。比如用了什么浏览器 API、算法或实时效果。',
      '第三段：发布后的反响或你后续想怎么继续做。',
    ],
    link: '#',
    linkLabel: '访问项目',
    art: 'game',
  },
  {
    id: 'p3',
    title: '项目三 · 一个视觉/动效向的作品',
    summary: '一句话说明它的视觉风格和动效设计。',
    details: [
      '第一段：视觉概念。你想传达什么情绪或品牌感。',
      '第二段：动效与渲染。着色器、滚动叙事或排版上的尝试。',
      '第三段：它被谁喜欢过、收录过，或者你自己的评价。',
    ],
    link: '#',
    linkLabel: '访问项目',
    art: 'wave',
  },
  {
    id: 'p4',
    title: '项目四 · 一套组件或工具库',
    summary: '一句话说明这套东西解决什么重复问题。',
    details: [
      '第一段：为什么做它。你在什么场景下反复造轮子，于是抽成了库。',
      '第二段：包含哪些东西，怎么用，有什么设计取舍。',
      '第三段：开源地址、star/下载情况，或欢迎别人怎么参与。',
    ],
    link: '#',
    linkLabel: '访问项目',
    art: 'grid',
  },
]

// ---------- 「工作室动态」房间 ----------
// 像原站 The Studio 一样陈列你的内容动态：文章、视频、社交帖子……
// source 决定来源徽章：article 文章 / video 视频 / social 动态 / blog 博客 / photo 图片 / short 短视频
export type StudioItem = {
  id: string
  title: string
  source: 'article' | 'video' | 'social' | 'blog' | 'photo' | 'short'
  summary: string
  link?: string
}

export const sourceLabels: Record<StudioItem['source'], string> = {
  article: '技术文章',
  video: '视频',
  social: '社交动态',
  blog: '博客',
  photo: '图片动态',
  short: '短视频',
}

export const sourceDoodles: Record<StudioItem['source'], DoodleKey> = {
  article: 'pen',
  video: 'play',
  social: 'share',
  blog: 'rss',
  photo: 'photo',
  short: 'phone',
}

export const studioItems: StudioItem[] = [
  { id: 's1', title: '一篇被收录/转发的技术文章', source: 'article', summary: '在哪儿发表了什么主题的文章，核心观点一句话。', link: '#' },
  { id: 's2', title: '一支项目制作过程的视频', source: 'video', summary: '视频讲了什么：完整走查、直播剪辑还是教程。', link: '#' },
  { id: 's3', title: '一条项目发布的动态', source: 'social', summary: '在哪个平台宣布了什么项目，获得了什么反馈。', link: '#' },
  { id: 's4', title: '一篇博客：某个技术点的深挖', source: 'blog', summary: '这篇博客深挖了什么问题，读的人能学到什么。', link: '#' },
  { id: 's5', title: '一组作品幕后图', source: 'photo', summary: '放一些草图、过程图或拍摄花絮的说明。', link: '#' },
  { id: 's6', title: '一支短视频：灵感合集或幕后', source: 'short', summary: '短视频账号叫什么、更新什么类型的内容。', link: '#' },
]

// ---------- 「奖项与证书」房间 ----------
// kind: 'sotd' 显示为「每日精选」星标，'other' 显示为「荣誉」绶带
export type Award = {
  id: string
  title: string
  kind: 'sotd' | 'other'
  date: string
  description: string
  link?: string
}

export const awards: Award[] = [
  { id: 'a1', title: '某某平台 · 每日网站精选', kind: 'sotd', date: '2026-04-25', description: '描述这个奖项的分量：什么平台颁发的、按什么标准评选、你的哪个作品获了奖。', link: '#' },
  { id: 'a2', title: '某某设计奖 · 荣誉提名', kind: 'other', date: '2026-04-30', description: '描述提名的原因和评选维度，比如设计、可用性、创意。', link: '#' },
  { id: 'a3', title: '某某社区 · 年度作品收录', kind: 'other', date: '2026-05-08', description: '被哪个社区/合集收录，为什么值得放进来。', link: '#' },
  { id: 'a4', title: '某比赛 / 认证 · 名次或等级', kind: 'sotd', date: '2025-12-01', description: '比赛规模、参赛人数、你的名次或证书等级。', link: '#' },
  { id: 'a5', title: '另一项荣誉', kind: 'other', date: '2025-09-15', description: '同样格式，继续往下加即可，页面会自动排列。', link: '#' },
]

// ---------- 「常见问题」房间 ----------
// q 是问题，a 是回答。可以自由增删条目。
export const faqs: { q: string; a: string }[] = [
  { q: '你和其他开发者有什么不同？', a: '写下你的工作哲学和方法。比如：先打磨结构与性能，再叠加视觉效果；一切从零手写，不用模板。' },
  { q: '你使用哪些技术？', a: '列出你的主力技术栈和按需启用的工具。比如：React、TypeScript、GSAP、CSS 动画；需要时用 Three.js / WebGL。' },
  { q: '你现在是什么状态？（在职 / 在读 / 自由职业）', a: '说明你目前的身份、所在地和可合作的范围。' },
  { q: '你做哪一类项目？', a: '描述你最喜欢做的项目类型，以及各类项目的代表作。' },
  { q: '你最得意的项目是怎么回事？', a: '挑一个招牌项目，用两三句话讲清楚它的玩法、技术和反响。' },
  { q: '你接外包或合作吗？', a: '写清是否接单、擅长的合作方式、大概的周期和联系方式。' },
  { q: '你获得过什么奖项或认可？', a: '简要列举奖项，详细内容可以指向上面的「奖项与证书」房间。' },
  { q: '你是设计师吗？', a: '诚实定位自己：会什么、不会什么、通常怎么和设计师协作。' },
]

// ---------- 页脚联系方式 ----------
export const footer = {
  heading: '一起做点有趣的东西吧',
  text: '欢迎通过下面的方式找到我，聊项目、聊合作或者只是打个招呼都行。',
  email: 'you@example.com',
  socials: [
    { label: 'GitHub', href: 'https://github.com/你的用户名' },
    { label: 'LinkedIn', href: '#' },
    { label: 'X / Twitter', href: '#' },
    { label: 'Instagram', href: '#' },
  ],
  credit: '结构与交互逻辑复刻自 itomdev.com · 手绘图案为占位插画 · 所有文字在 src/content.ts 中填写',
}
