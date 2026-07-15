# Hot 200：回溯

> 本章 15 题。统一框架是“选择 → 递归 → 撤销”，难点在选择范围、去重层级与剪枝条件。

## 组合、排列与子集

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 17 | [电话号码的字母组合](https://leetcode.cn/problems/letter-combinations-of-a-phone-number/) | 多叉选择树 |
| 22 | [括号生成](https://leetcode.cn/problems/generate-parentheses/) | 合法前缀约束 |
| 39 | [组合总和](https://leetcode.cn/problems/combination-sum/) | 元素可重复选择 |
| 40 | [组合总和 II](https://leetcode.cn/problems/combination-sum-ii/) | 同层去重 |
| 46 | [全排列](https://leetcode.cn/problems/permutations/) | 使用标记 |
| 47 | [全排列 II](https://leetcode.cn/problems/permutations-ii/) | 排序后同层去重 |
| 77 | [组合](https://leetcode.cn/problems/combinations/) | 起始索引与剪枝 |
| 78 | [子集](https://leetcode.cn/problems/subsets/) | 每个节点都是答案 |
| 90 | [子集 II](https://leetcode.cn/problems/subsets-ii/) | 重复元素去重 |

## 搜索、切分与约束满足

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 37 | [解数独](https://leetcode.cn/problems/sudoku-solver/) | 多约束剪枝 |
| 51 | [N 皇后](https://leetcode.cn/problems/n-queens/) | 列与对角线约束 |
| 52 | [N 皇后 II](https://leetcode.cn/problems/n-queens-ii/) | 只统计方案数 |
| 79 | [单词搜索](https://leetcode.cn/problems/word-search/) | 网格路径与恢复 |
| 93 | [复原 IP 地址](https://leetcode.cn/problems/restore-ip-addresses/) | 分段合法性剪枝 |
| 131 | [分割回文串](https://leetcode.cn/problems/palindrome-partitioning/) | 切分点与回文判断 |

## 过关标准

保存结果时复制当前路径；能区分“同一树层去重”和“同一路径不可重复”；能根据剩余元素数量提前终止无效分支。
