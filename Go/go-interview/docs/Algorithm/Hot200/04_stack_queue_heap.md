# Hot 200：栈、队列与堆

> 本章 22 题。重点掌握“最近未匹配元素”“维护候选最值”和“只保留 Top K”。

## 栈、解析与结构设计

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 20 | [有效的括号](https://leetcode.cn/problems/valid-parentheses/) | 匹配栈 |
| 71 | [简化路径](https://leetcode.cn/problems/simplify-path/) | 分段与规范化 |
| 150 | [逆波兰表达式求值](https://leetcode.cn/problems/evaluate-reverse-polish-notation/) | 操作数栈 |
| 155 | [最小栈](https://leetcode.cn/problems/min-stack/) | 同步维护最小值 |
| 224 | [基本计算器](https://leetcode.cn/problems/basic-calculator/) | 符号与括号上下文 |
| 227 | [基本计算器 II](https://leetcode.cn/problems/basic-calculator-ii/) | 运算优先级 |
| 232 | [用栈实现队列](https://leetcode.cn/problems/implement-queue-using-stacks/) | 输入栈与输出栈 |
| 225 | [用队列实现栈](https://leetcode.cn/problems/implement-stack-using-queues/) | 旋转队列 |
| 394 | [字符串解码](https://leetcode.cn/problems/decode-string/) | 嵌套上下文 |

## 单调栈与单调队列

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 32 | [最长有效括号](https://leetcode.cn/problems/longest-valid-parentheses/) | 未匹配边界 |
| 84 | [柱状图中最大的矩形](https://leetcode.cn/problems/largest-rectangle-in-histogram/) | 单调递增栈 |
| 85 | [最大矩形](https://leetcode.cn/problems/maximal-rectangle/) | 转换为柱状图 |
| 239 | [滑动窗口最大值](https://leetcode.cn/problems/sliding-window-maximum/) | 单调双端队列 |
| 739 | [每日温度](https://leetcode.cn/problems/daily-temperatures/) | 下一个更大元素 |
| 496 | [下一个更大元素 I](https://leetcode.cn/problems/next-greater-element-i/) | 栈加映射 |
| 503 | [下一个更大元素 II](https://leetcode.cn/problems/next-greater-element-ii/) | 循环数组 |

## 堆、Top K 与调度

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 295 | [数据流的中位数](https://leetcode.cn/problems/find-median-from-data-stream/) | 大小堆平衡 |
| 347 | [前 K 个高频元素](https://leetcode.cn/problems/top-k-frequent-elements/) | 频次与最小堆 |
| 621 | [任务调度器](https://leetcode.cn/problems/task-scheduler/) | 频次上界/调度 |
| 692 | [前 K 个高频单词](https://leetcode.cn/problems/top-k-frequent-words/) | 复合比较规则 |
| 215 | [数组中的第 K 个最大元素](https://leetcode.cn/problems/kth-largest-element-in-an-array/) | 堆/快速选择 |
| 703 | [数据流中的第 K 大元素](https://leetcode.cn/problems/kth-largest-element-in-a-stream/) | 固定大小最小堆 |

## 过关标准

能写出 Go 的 `container/heap` 接口；能说明单调栈保存的是下标还是值；能解释双堆如何保持元素数量与取值范围两个不变量。
