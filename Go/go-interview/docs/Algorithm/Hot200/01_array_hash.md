# Hot 200：数组、哈希与矩阵

> 本章 30 题。重点不是记 API，而是识别“用空间换时间”、前缀状态和原地标记。

## 哈希、计数与集合

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 1 | [两数之和](https://leetcode.cn/problems/two-sum/) | 补数映射 |
| 49 | [字母异位词分组](https://leetcode.cn/problems/group-anagrams/) | 设计哈希键 |
| 128 | [最长连续序列](https://leetcode.cn/problems/longest-consecutive-sequence/) | 集合与序列起点 |
| 169 | [多数元素](https://leetcode.cn/problems/majority-element/) | 计数与摩尔投票 |
| 454 | [四数相加 II](https://leetcode.cn/problems/4sum-ii/) | 分组枚举 |
| 202 | [快乐数](https://leetcode.cn/problems/happy-number/) | 环检测/集合 |
| 205 | [同构字符串](https://leetcode.cn/problems/isomorphic-strings/) | 双向映射 |
| 217 | [存在重复元素](https://leetcode.cn/problems/contains-duplicate/) | 集合判重 |
| 219 | [存在重复元素 II](https://leetcode.cn/problems/contains-duplicate-ii/) | 最近索引 |
| 242 | [有效的字母异位词](https://leetcode.cn/problems/valid-anagram/) | 频次表 |
| 290 | [单词规律](https://leetcode.cn/problems/word-pattern/) | 双射关系 |
| 349 | [两个数组的交集](https://leetcode.cn/problems/intersection-of-two-arrays/) | 集合运算 |
| 136 | [只出现一次的数字](https://leetcode.cn/problems/single-number/) | 异或性质 |
| 383 | [赎金信](https://leetcode.cn/problems/ransom-note/) | 有限字符计数 |

## 前缀状态与数组技巧

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 238 | [除自身以外数组的乘积](https://leetcode.cn/problems/product-of-array-except-self/) | 前后缀乘积 |
| 560 | [和为 K 的子数组](https://leetcode.cn/problems/subarray-sum-equals-k/) | 前缀和计数 |
| 448 | [找到所有数组中消失的数字](https://leetcode.cn/problems/find-all-numbers-disappeared-in-an-array/) | 原地索引标记 |
| 525 | [连续数组](https://leetcode.cn/problems/contiguous-array/) | 前缀差首次位置 |
| 287 | [寻找重复数](https://leetcode.cn/problems/find-the-duplicate-number/) | 值域/环模型 |
| 118 | [杨辉三角](https://leetcode.cn/problems/pascals-triangle/) | 递推构造 |
| 229 | [多数元素 II](https://leetcode.cn/problems/majority-element-ii/) | 多候选摩尔投票 |
| 274 | [H 指数](https://leetcode.cn/problems/h-index/) | 计数/排序 |
| 380 | [O(1) 时间插入、删除和获取随机元素](https://leetcode.cn/problems/insert-delete-getrandom-o1/) | 数组加索引表 |

## 矩阵与原地模拟

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 73 | [矩阵置零](https://leetcode.cn/problems/set-matrix-zeroes/) | 首行首列作标记 |
| 54 | [螺旋矩阵](https://leetcode.cn/problems/spiral-matrix/) | 收缩边界 |
| 48 | [旋转图像](https://leetcode.cn/problems/rotate-image/) | 转置与翻转 |
| 41 | [缺失的第一个正数](https://leetcode.cn/problems/first-missing-positive/) | 原地哈希 |
| 36 | [有效的数独](https://leetcode.cn/problems/valid-sudoku/) | 多维约束去重 |
| 240 | [搜索二维矩阵 II](https://leetcode.cn/problems/search-a-2d-matrix-ii/) | 从角落单调移动 |
| 289 | [生命游戏](https://leetcode.cn/problems/game-of-life/) | 状态编码 |

## 过关标准

看到“连续子数组之和”能先想到前缀和；看到值域为 `1..n` 能评估原地索引；矩阵模拟能明确四条边界的更新时机。
