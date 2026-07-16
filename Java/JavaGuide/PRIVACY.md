# 隐私与匿名访问统计

## 收集目的

本站仅用匿名统计了解访问趋势、热门章节和页面错误，从而改进学习内容。统计不是广告追踪，也不会用于出售个人数据。

## 收集哪些信息

在你主动选择“允许匿名统计”后，系统可能记录：

- 访问时间、页面路径和页面标题；
- 来源网站的域名（不会记录来源页面路径和查询参数）；
- 浏览器、操作系统、设备类型；
- Cloudflare 根据出口 IP 提供的近似国家、地区和城市；
- 浏览器随机生成的访客 ID（假名标识）与会话 ID；访客 ID 最长 90 天自动轮换。

本站不保存原始 IP，不采集姓名、邮箱、GitHub 账号、输入内容或设备指纹。随机访客 ID 只能区分浏览器，不能证明现实中的身份；清除浏览器数据、使用隐私模式或更换浏览器都会产生新的 ID。

## 保存与访问

在线数据库中的原始访问事件计划最多保存 90 天。数据存放在 Cloudflare D1，只有经过 Cloudflare Access 验证且位于邮箱白名单中的管理员可以查看。删除后的数据仍可能在 Cloudflare 的灾难恢复副本中保留到服务商规定的恢复窗口结束。后台页面始终把访问者称为“匿名访客”。

## 选择与退出

本站尊重浏览器的 Global Privacy Control 和 Do Not Track 信号。你也可以随时修改选择：

<div class="privacy-actions">
  <button type="button" data-analytics-choice="granted">允许匿名统计</button>
  <button type="button" data-analytics-choice="denied">停止并重置匿名 ID</button>
</div>

<span class="analytics-status" data-analytics-status>正在读取当前设置…</span>

选择停止后，当前浏览器中的匿名 ID 会立即删除，之后不再发送访问事件。历史匿名记录无法再与你的新匿名 ID 关联。

## 数据边界

网络失败、脚本拦截器或浏览器禁用 JavaScript 都可能造成漏记；近似地区可能因 VPN、代理或运营商出口而不准确；同一个设备也可能由多人共用。因此统计数据只能用于趋势分析，不能用于确认某个现实中的人访问过本站。
