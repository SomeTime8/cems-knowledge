import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'CEMS 知识库',
  description: 'CEMS 建筑企业综合管理平台 - 实测分析、API 盘点、问题与优化',
  lang: 'zh-CN',
  // GitHub Pages: 如果仓库名为 cems-knowledge，改为 '/cems-knowledge/'
  // 如果是 <user>.github.io 仓库，保持 '/'
  base: '/cems-knowledge/',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'CEMS', link: '/cems/01-overview' },
      { text: '自在朋友抖音运营', link: '/zizai-douyin/' }
    ],
    sidebar: [
      {
        text: 'CEMS 建筑企业综合管理平台',
        items: [
          { text: '01 系统概览', link: '/cems/01-overview' },
          { text: '02 功能模块与实现程度', link: '/cems/02-function-modules' },
          { text: '03 API 盘点', link: '/cems/03-api-inventory' },
          { text: '04 数据量与数据质量', link: '/cems/04-data-quality' },
          { text: '05 问题清单与风险', link: '/cems/05-issues-and-risks' },
          { text: '06 优化建议', link: '/cems/06-optimization' },
          { text: '07 访问方式', link: '/cems/07-access-method' },
          { text: '08 后端复刻实施方案', link: '/cems/08-backend-plan' },
          { text: '09 业务分析与行业对标', link: '/cems/09-business-analysis' },
          { text: '10 表单字段级业务分析', link: '/cems/10-form-field-analysis' },
          { text: '11 BPMN 入门（外部资料）', link: '/cems/11-bpmn-primer' },
          { text: '12 深层打磨建议', link: '/cems/12-deep-polish-recommendations' },
          { text: '13 项目实施计划', link: '/cems/13-implementation-plan' },
          { text: '14 复刻站工程说明', link: '/cems/14-replica-project' },
          { text: '15 开发改进计划', link: '/cems/15-improvement-plan' },
          { text: '16 项目推进操作手册', link: '/cems/16-ops-manual' },
          { text: '17 浏览器双出口分流', link: '/cems/17-browser-dual-exit' },
          { text: '18 复刻进度总账与验收体系', link: '/cems/18-progress-and-verification' },
          { text: '19 群杰智能印章对接', link: '/cems/19-qunjie-integration' },
          { text: '20 待定夺总表', link: '/cems/20-pending-decisions' }
        ]
      },
      {
        text: '自在朋友抖音运营',
        items: [
          { text: '专区首页', link: '/zizai-douyin/' },
          { text: '01 运营日记 · 2026-11-08', link: '/zizai-douyin/01-diary-2026-11-08' },
          { text: '02 运营日记 · 2026-11-09', link: '/zizai-douyin/02-diary-2026-11-09' },
          { text: '03 价格口径与平台红线', link: '/zizai-douyin/03-price-and-redlines' },
          { text: '04 作品数据结论（92 条全量盘点）', link: '/zizai-douyin/04-works-data-findings' },
          { text: '05 视频制作规格（时长 / 卡点 / 钩子）', link: '/zizai-douyin/05-video-production-spec' },
          { text: '06 自动代发事件复盘', link: '/zizai-douyin/06-auto-post-incident' },
          { text: '07 运营打法与排期', link: '/zizai-douyin/07-playbook-and-schedule' }
        ]
      }
    ],
    search: { provider: 'local' },
    outline: { level: [2, 3], label: '本页目录' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/' }]
  }
})
