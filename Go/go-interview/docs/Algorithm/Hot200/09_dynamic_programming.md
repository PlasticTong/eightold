# Hot 200：动态规划

> 本章 25 题。每道题先写一句完整的状态定义，再写转移、初始化、遍历顺序和最终答案。

## 一维状态与序列

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 53 | [最大子数组和](https://leetcode.cn/problems/maximum-subarray/) | 以当前位置结尾 |
| 70 | [爬楼梯](https://leetcode.cn/problems/climbing-stairs/) | 基础线性递推 |
| 91 | [解码方法](https://leetcode.cn/problems/decode-ways/) | 一位/两位转移 |
| 96 | [不同的二叉搜索树](https://leetcode.cn/problems/unique-binary-search-trees/) | 按根拆分 |
| 139 | [单词拆分](https://leetcode.cn/problems/word-break/) | 可达前缀 |
| 152 | [乘积最大子数组](https://leetcode.cn/problems/maximum-product-subarray/) | 同时维护最大最小 |
| 198 | [打家劫舍](https://leetcode.cn/problems/house-robber/) | 选与不选 |
| 213 | [打家劫舍 II](https://leetcode.cn/problems/house-robber-ii/) | 环拆成两段 |
| 279 | [完全平方数](https://leetcode.cn/problems/perfect-squares/) | 完全背包/最短步数 |
| 300 | [最长递增子序列](https://leetcode.cn/problems/longest-increasing-subsequence/) | DP/贪心二分 |

## 网格、字符串与区间

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 5 | [最长回文子串](https://leetcode.cn/problems/longest-palindromic-substring/) | 区间状态/中心扩展 |
| 10 | [正则表达式匹配](https://leetcode.cn/problems/regular-expression-matching/) | 前缀匹配与星号 |
| 62 | [不同路径](https://leetcode.cn/problems/unique-paths/) | 网格路径计数 |
| 64 | [最小路径和](https://leetcode.cn/problems/minimum-path-sum/) | 网格最优值 |
| 72 | [编辑距离](https://leetcode.cn/problems/edit-distance/) | 插入删除替换 |
| 115 | [不同的子序列](https://leetcode.cn/problems/distinct-subsequences/) | 前缀方案计数 |
| 120 | [三角形最小路径和](https://leetcode.cn/problems/triangle/) | 自底向上压缩 |
| 221 | [最大正方形](https://leetcode.cn/problems/maximal-square/) | 右下角边长 |
| 647 | [回文子串](https://leetcode.cn/problems/palindromic-substrings/) | 回文计数 |
| 1143 | [最长公共子序列](https://leetcode.cn/problems/longest-common-subsequence/) | 双序列前缀 |

## 背包、股票与树形 DP

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 309 | [买卖股票的最佳时机含冷冻期](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-with-cooldown/) | 多状态机 |
| 322 | [零钱兑换](https://leetcode.cn/problems/coin-change/) | 完全背包最小值 |
| 337 | [打家劫舍 III](https://leetcode.cn/problems/house-robber-iii/) | 树上选与不选 |
| 416 | [分割等和子集](https://leetcode.cn/problems/partition-equal-subset-sum/) | 0/1 背包可达性 |
| 494 | [目标和](https://leetcode.cn/problems/target-sum/) | 转换为子集计数 |

## 过关标准

状态定义必须包含下标含义；压缩空间前先确认依赖方向；背包问题能解释容量为何正序或倒序；无法证明贪心时能回到 DP 建模。
