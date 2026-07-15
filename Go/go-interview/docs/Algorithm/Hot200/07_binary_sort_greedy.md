# Hot 200：二分、排序与贪心

> 本章 20 题。二分要证明答案空间具有单调性；贪心要解释为何当前选择不会破坏全局最优。

## 二分查找与二分答案

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 4 | [寻找两个正序数组的中位数](https://leetcode.cn/problems/median-of-two-sorted-arrays/) | 划分与第 K 小 |
| 33 | [搜索旋转排序数组](https://leetcode.cn/problems/search-in-rotated-sorted-array/) | 判断有序半边 |
| 34 | [查找元素的第一个和最后一个位置](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/) | 左右边界 |
| 35 | [搜索插入位置](https://leetcode.cn/problems/search-insert-position/) | lower bound |
| 69 | [x 的平方根](https://leetcode.cn/problems/sqrtx/) | 值域二分与溢出 |
| 74 | [搜索二维矩阵](https://leetcode.cn/problems/search-a-2d-matrix/) | 二维映射一维 |
| 153 | [寻找旋转排序数组中的最小值](https://leetcode.cn/problems/find-minimum-in-rotated-sorted-array/) | 与右端比较 |
| 162 | [寻找峰值](https://leetcode.cn/problems/find-peak-element/) | 利用局部趋势 |
| 704 | [二分查找](https://leetcode.cn/problems/binary-search/) | 区间不变量 |
| 875 | [爱吃香蕉的珂珂](https://leetcode.cn/problems/koko-eating-bananas/) | 最小可行速度 |

## 排序与区间

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 31 | [下一个排列](https://leetcode.cn/problems/next-permutation/) | 找逆序点与后缀翻转 |
| 56 | [合并区间](https://leetcode.cn/problems/merge-intervals/) | 按起点扫描 |
| 57 | [插入区间](https://leetcode.cn/problems/insert-interval/) | 三段式处理 |
| 75 | [颜色分类](https://leetcode.cn/problems/sort-colors/) | 三路划分 |
| 452 | [用最少数量的箭引爆气球](https://leetcode.cn/problems/minimum-number-of-arrows-to-burst-balloons/) | 区间右端点 |

## 贪心决策

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 55 | [跳跃游戏](https://leetcode.cn/problems/jump-game/) | 最远可达位置 |
| 45 | [跳跃游戏 II](https://leetcode.cn/problems/jump-game-ii/) | 分层扩展边界 |
| 121 | [买卖股票的最佳时机](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock/) | 维护历史最小值 |
| 134 | [加油站](https://leetcode.cn/problems/gas-station/) | 总量与失败区间 |
| 763 | [划分字母区间](https://leetcode.cn/problems/partition-labels/) | 最后出现位置 |

## 过关标准

二分模板能明确使用闭区间还是半开区间；计算中点与乘法时考虑溢出；贪心解答至少能给出交换论证、覆盖范围或失败区间中的一种证明。
