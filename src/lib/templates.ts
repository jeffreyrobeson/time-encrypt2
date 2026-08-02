import { CamouflageTemplate } from '../types';

export const PRESET_CAMOUFLAGE_TEMPLATES: CamouflageTemplate[] = [
  // Xiaohongshu Style
  {
    id: 'xhs-sunset',
    category: 'xiaohongshu',
    title: '绝美落日图鉴 🌅',
    text: '今天在路边拍到的绝美落日，天空被染成了温柔的粉橘色～ 每一个记录日常的瞬间都闪闪发光，分享给同样被温柔包围的你们！✨ #治愈系风景 #落日晚霞 #日常碎片',
    iconName: 'Sun',
    tag: '爆款风',
  },
  {
    id: 'xhs-coffee',
    category: 'xiaohongshu',
    title: '街角特调咖啡 ☕',
    text: '打卡了一家藏在巷子里的宝藏咖啡馆，手冲耶加雪菲口感层次超丰富，店里的猫猫也超级黏人！周末的正确打开方式，尊嘟太治愈了吧～ #探店指南 #咖啡日常 #宝藏店铺',
    iconName: 'Coffee',
    tag: '生活风',
  },
  {
    id: 'xhs-study',
    category: 'xiaohongshu',
    title: '沉浸式自律打卡 📖',
    text: '今日份沉浸式学习记录：完成阅读30页，整理笔记2份。把平凡的日子过得热气腾腾，坚持的人终将在顶峰相见！加油打工人！💪 #自律生长 #学习打卡 #努力变成更好的自己',
    iconName: 'BookOpen',
    tag: '励志风',
  },

  // Literary / Soft Poetry
  {
    id: 'lit-summer',
    category: 'literary',
    title: '夏日的晚风 🌿',
    text: '风吹过夏末阶前的时候，所有的秘密都会顺着云朵漂流。有些故事不必急着讲完，时间会把它沉淀成最温柔的答案。',
    iconName: 'Feather',
    tag: '温柔抒情',
  },
  {
    id: 'lit-stars',
    category: 'literary',
    title: '寄给星空的情书 🌟',
    text: '我们在同一片星空下仰望，每一个闪烁的光点都是漫长岁月里的低语。有些话藏在心底，等光年之外的温度将它唤醒。',
    iconName: 'Moon',
    tag: '浪漫诗意',
  },

  // Workplace / Corporate Disguise
  {
    id: 'work-notice',
    category: 'work',
    title: '【项目规划补充说明】 📊',
    text: '各位同事：关于下季度重点项目的推进进度与核心指标补充说明，请详细查阅附件安排。如有相关疑问请在例会上统一沟通。',
    iconName: 'Briefcase',
    tag: '严谨职场',
  },
  {
    id: 'work-weekly',
    category: 'work',
    title: '【周报摘要与节点提醒】 📝',
    text: '本周团队已按计划完成架构优化与接口对接测试，整体进度符合预期。下周重点关注性能监控与上线复盘。',
    iconName: 'FileText',
    tag: '办公伪装',
  },

  // Cute Pets
  {
    id: 'pet-cat',
    category: 'pets',
    title: '我家猫咪又整活了 🐱',
    text: '笑死我了，我家小猫今天又做出了奇奇怪怪的睡姿，趴在书桌上一边吐舌头一边打呼噜，尊嘟是修仙猫猫本猫吧！',
    iconName: 'Heart',
    tag: '萌宠搞笑',
  },

  // Gossip / Entertainment Teaser
  {
    id: 'gossip-tea',
    category: 'gossip',
    title: '吃瓜预警 🍉',
    text: '刚才听说了一个惊天大瓜！细节超乎想象，真实性待考证，先分享给姐妹们尝尝鲜，懂得人都懂！',
    iconName: 'Sparkles',
    tag: '爆料伪装',
  },
];
