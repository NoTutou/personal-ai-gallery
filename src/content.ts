export type Card = { id: string; title: string; summary: string; detail: string; meta: string[]; image?: string }
export type GallerySection = { id: string; eyebrow: string; title: string; scene: string; cards: Card[] }

export const content = {
  site: { displayName: '你的名字', intro: '在学习、兴趣与人工智能之间，持续建立自己的坐标。', closing: '保持好奇', closingText: '这里不是终点，而是一份持续生长的个人档案。' },
  sections: [
    { id: 'education', eyebrow: '01 / Education', title: '教育经历', scene: 'assemble', cards: [
      { id: 'edu-1', title: '本科 · 示例大学', summary: '专业名称 · 20XX—20XX', detail: '在这里替换你的学校、专业、研究方向、奖项或一段重要经历。', meta: ['专业方向', '荣誉奖项'], image: 'assets/education.svg' },
      { id: 'edu-2', title: '持续学习', summary: '课程、证书与自我训练', detail: '记录课堂之外真正改变你思考方式的学习路径。', meta: ['课程', '证书'] },
    ]},
    { id: 'hobbies', eyebrow: '02 / Hobbies', title: '兴趣爱好', scene: 'orbit', cards: [
      { id: 'hobby-1', title: '影像与观察', summary: '在日常里寻找构图', detail: '替换成你的爱好，以及它如何塑造你的感受与表达。', meta: ['摄影', '城市漫游'], image: 'assets/hobby.svg' },
      { id: 'hobby-2', title: '运动与节奏', summary: '让身体参与思考', detail: '写下你喜欢的运动、频率或值得纪念的时刻。', meta: ['跑步', '户外'] },
    ]},
    { id: 'ai-notes', eyebrow: '03 / AI Notes', title: 'AI 笔记', scene: 'deconstruct', cards: [
      { id: 'ai-1', title: '大模型基础', summary: '从 token 到推理', detail: '用自己的语言记录一个概念、实验结论或学习索引。', meta: ['LLM', '基础概念'], image: 'assets/ai-note.svg' },
      { id: 'ai-2', title: '智能体实践', summary: '工具、记忆与协作', detail: '记录你的项目、提示词方法或对智能体系统的观察。', meta: ['Agent', '实践记录'] },
      { id: 'ai-3', title: '每周一问', summary: '保留尚未解决的问题', detail: '好笔记不只保存答案，也保存问题是如何变化的。', meta: ['思考', '待探索'] },
    ]},
  ] satisfies GallerySection[],
  contacts: [{ label: 'Email', href: 'mailto:hello@example.com' }, { label: 'GitHub', href: 'https://github.com/NoTutou' }],
}
