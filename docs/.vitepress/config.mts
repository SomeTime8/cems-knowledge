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
      { text: 'CEMS', link: '/cems/01-overview' }
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
          { text: '08 后端复刻实施方案', link: '/cems/08-backend-plan' }
        ]
      }
    ],
    search: { provider: 'local' },
    outline: { level: [2, 3], label: '本页目录' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/' }]
  }
})
