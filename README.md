# 手绘走廊 · 个人作品集

手绘素描风格的个人主页：一条单点透视走廊，两侧的门通向「关于我 / 项目作品 / 工作室动态 / 奖项证书 / 常见问题」五个房间。结构与交互逻辑复刻自 [itomdev.com](https://itomdev.com/)，手绘图案为内置占位插画。

```bash
npm install
npm run dev
```

## 如何填写自己的信息

所有文字内容都集中在 `src/content.ts`，每个字段都有中文注释说明出现位置，改完保存即可预览。想放真实照片/截图，把文件放进 `public/assets/`，再在 `content.ts` 里填对应路径（如 `avatar: 'assets/me.jpg'`、项目的 `image` 字段）。

提交到 `main` 后由 GitHub Actions 自动发布至 GitHub Pages。
