# Sketch Corridor Portfolio

一个"手绘铅笔风 3D 走廊"交互式作品集网站（灵感来自 itomdev.com 的交互形式，代码、贴图、音效、文案均为原创/占位）。

## 运行

```bash
npm install
npm run dev      # 开发模式  http://localhost:5173
npm run build    # 生产构建，输出到 dist/
npm run preview  # 预览生产构建
```

## 技术栈

Vite · React 19 · three.js / @react-three/fiber · GSAP · zustand · Web Audio API

## 修改内容

所有文字/项目/联系方式都在 **`src/data/content.js`**：

| 导出 | 用途 |
| --- | --- |
| `site` | 名字、职业、标语、邮箱 |
| `about` | About 房间的介绍、技能清单、便利贴信息 |
| `projects` | Gallery 旋转画廊里的项目（`art` 为程序化插画主题） |
| `corridorArt` | 走廊墙上挂的画 |
| `studio` | Studio 房间的文章/视频/动态卡片 |
| `awards` | 奖项卡片 |
| `contact` | 联系方式 |
| `rooms` | 四扇门的位置、朝向、颜色 |

插画主题可选：`mountains` `sea` `house` `flowers` `city` `planet` `tree` `rocket`（见 `src/lib/art.js`，可自行新增）。

## 目录结构

```
src/
  data/content.js        占位内容
  lib/sketch.js          铅笔线条 / 排线 / 水彩 画笔工具
  lib/art.js             程序化插画（素描版 + 上色版）
  lib/textures.js        所有 Canvas 贴图生成 + 预加载
  lib/audio.js           Web Audio 合成音效与环境音
  store.js               全局状态、成就系统（localStorage）
  director.js            进门/出门/穿梭的镜头动画
  three/                 3D 场景：走廊、门、画框、画廊房间、相机
  ui/                    预加载撕纸、菜单、地图、音频、成就、滚动条
  ui/rooms/              About / Gallery / Studio / Contact 房间页面
  styles/main.css        全部样式
```

## 操作

- 滚轮 / 上下滑动 / W S ↑ ↓ 在走廊中行走，Home / End 回到起点或终点
- 点击门进入房间，Esc 返回
- Gallery：拖拽或 ← → 旋转，点击画作查看项目
- 右上角菜单可直接传送到任意房间；左下角为地图、音频设置和成就
