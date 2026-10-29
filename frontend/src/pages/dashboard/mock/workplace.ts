export const kpiCards = [
  {
    key: "orders",
    title: "总订单量",
    value: "205,216",
    tip: "这个月增长 +12.4%",
    spark: [42, 55, 48, 70, 62, 88, 76, 95, 84, 110, 98, 120],
  },
  {
    key: "products",
    title: "商品总数",
    value: "55,231",
    tip: "在售 SKU",
    spark: [20, 28, 26, 40, 36, 48, 44, 60, 52, 70, 66, 80],
  },
  {
    key: "sales",
    title: "销售量",
    value: "14.5k",
    tip: "本周成交",
    spark: [30, 45, 38, 60, 55, 72, 68, 90, 84, 100, 92, 115],
  },
  {
    key: "growth",
    title: "销售增长",
    value: "12%",
    tip: "同比上升",
    spark: [10, 18, 16, 28, 24, 36, 40, 48, 46, 58, 62, 70],
  },
] as const

export const conversionSeries = [32, 40, 38, 52, 48, 64, 60, 72, 68, 80, 76, 90]

export const salesTrend = {
  months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  online: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330],
  offline: [220, 182, 191, 234, 290, 330, 310, 201, 154, 190, 330, 410],
}

export const salesClass = [
  { name: "已完成", value: 48 },
  { name: "处理中", value: 32 },
  { name: "待发货", value: 20 },
]

export const hotProducts = [
  { name: "无线耳机 Pro", sales: 1280 },
  { name: "智能手表 S3", sales: 980 },
  { name: "机械键盘 87", sales: 760 },
]

export const annualSales = [820, 932, 901, 934, 1290, 1330, 1320, 1450, 1200, 1100, 980, 1300]

export const activeUsers = {
  labels: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
  values: [820, 932, 901, 934, 1290, 1330, 1120],
  metrics: [
    { name: "日活", num: "12.8k" },
    { name: "新增", num: "1.2k" },
    { name: "留存", num: "68%" },
    { name: "转化", num: "3.6%" },
  ],
}

export const trafficOverview = {
  labels: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  values: [220, 280, 260, 340, 390, 420, 480, 460, 520, 580, 610, 680],
}
