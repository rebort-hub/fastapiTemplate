export const homeStats = [
  {
    key: "income",
    title: "总收入",
    value: "¥35,000",
    tip: "月收入超过 ¥350,000+",
    tone: "primary" as const,
  },
  {
    key: "users",
    title: "在线用户",
    value: "128",
    tip: "今日活跃 89 人",
    tone: "info" as const,
  },
  {
    key: "login",
    title: "今日登录",
    value: "47",
    tip: "本周新增用户 216",
    tone: "success" as const,
  },
  {
    key: "tasks",
    title: "待办任务",
    value: "3",
    tip: "2 项即将到期",
    tone: "warning" as const,
  },
]

export const quickLinks = [
  { title: "工作台", to: "/dashboard/workplace", desc: "经营概览" },
  { title: "分析页", to: "/dashboard/analysis", desc: "数据洞察" },
  { title: "用户管理", to: "/system/user", desc: "账号权限" },
  { title: "菜单管理", to: "/system/menu", desc: "导航配置" },
  { title: "角色管理", to: "/system/role", desc: "角色授权" },
  { title: "操作日志", to: "/system/log", desc: "审计追踪" },
  { title: "系统设置", to: "/settings", desc: "偏好配置" },
  { title: "项目管理", to: "/items", desc: "业务项目" },
]

export const timeline = [
  { time: "上午 09:30", content: "收到订单 #38291 支付 ¥385.90", tone: "#49beff" },
  { time: "上午 10:00", content: "新商品上架", code: "SKU-3467", tone: "#369eff" },
  { time: "上午 12:00", content: "向供应商支付了 ¥6,495.00", tone: "#67e8cf" },
  { time: "下午 14:30", content: "促销活动开始", code: "PROMO-2026", tone: "#ffc107" },
  { time: "下午 15:45", content: "订单取消提醒", code: "ORD-9876", tone: "#ff6969" },
  { time: "下午 17:00", content: "完成每日销售报表", tone: "#67e8cf" },
]

export const todos = [
  {
    user: "张无忌",
    type: "查看",
    target: "查看今天工作内容",
    date: "上午 09:30",
    done: true,
  },
  {
    user: "赵敏",
    type: "回复",
    target: "回复客户邮件",
    date: "上午 10:30",
    done: true,
  },
  {
    user: "小昭",
    type: "工作",
    target: "工作汇报整理",
    date: "上午 11:00",
    done: false,
  },
  {
    user: "金毛狮王",
    type: "会议",
    target: "产品需求会议",
    date: "下午 14:00",
    done: false,
  },
  {
    user: "周芷若",
    type: "审核",
    target: "审核菜单权限变更",
    date: "下午 16:00",
    done: false,
  },
]

export const progressCards = [
  { title: "任务进度", percent: 65 },
  { title: "项目进度", percent: 80 },
  { title: "本周目标", percent: 45 },
]

export const recentLogins = [
  { username: "admin", location: "北京", time: "09:30", ok: true },
  { username: "张伟", location: "上海", time: "09:28", ok: true },
  { username: "李娜", location: "广州", time: "09:25", ok: false },
  { username: "王磊", location: "深圳", time: "09:20", ok: true },
  { username: "赵敏", location: "杭州", time: "09:15", ok: true },
]
