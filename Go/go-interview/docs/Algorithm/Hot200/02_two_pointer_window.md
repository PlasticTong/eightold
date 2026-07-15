# Hot 200：双指针与滑动窗口

> 本章 20 题。先说清两个指针各自代表什么，以及窗口在什么条件下扩张或收缩。

## 双指针与原地修改

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 11 | [盛最多水的容器](https://leetcode.cn/problems/container-with-most-water/) | 相向指针与短板 |
| 15 | [三数之和](https://leetcode.cn/problems/3sum/) | 排序、去重、夹逼 |
| 18 | [四数之和](https://leetcode.cn/problems/4sum/) | 多层枚举与剪枝 |
| 26 | [删除有序数组中的重复项](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/) | 快慢指针 |
| 27 | [移除元素](https://leetcode.cn/problems/remove-element/) | 原地覆盖 |
| 80 | [删除有序数组中的重复项 II](https://leetcode.cn/problems/remove-duplicates-from-sorted-array-ii/) | 保留次数不变量 |
| 88 | [合并两个有序数组](https://leetcode.cn/problems/merge-sorted-array/) | 从后向前合并 |
| 125 | [验证回文串](https://leetcode.cn/problems/valid-palindrome/) | 跳过无效字符 |
| 167 | [两数之和 II](https://leetcode.cn/problems/two-sum-ii-input-array-is-sorted/) | 单调夹逼 |
| 189 | [轮转数组](https://leetcode.cn/problems/rotate-array/) | 三次翻转 |
| 283 | [移动零](https://leetcode.cn/problems/move-zeroes/) | 稳定原地移动 |
| 392 | [判断子序列](https://leetcode.cn/problems/is-subsequence/) | 双序列扫描 |
| 42 | [接雨水](https://leetcode.cn/problems/trapping-rain-water/) | 左右最大值 |
| 977 | [有序数组的平方](https://leetcode.cn/problems/squares-of-a-sorted-array/) | 从最大绝对值填充 |

## 滑动窗口

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 3 | [无重复字符的最长子串](https://leetcode.cn/problems/longest-substring-without-repeating-characters/) | 不定长窗口判重 |
| 76 | [最小覆盖子串](https://leetcode.cn/problems/minimum-window-substring/) | 覆盖计数与收缩 |
| 209 | [长度最小的子数组](https://leetcode.cn/problems/minimum-size-subarray-sum/) | 正数和的单调性 |
| 567 | [字符串的排列](https://leetcode.cn/problems/permutation-in-string/) | 定长频次窗口 |
| 438 | [找到字符串中所有字母异位词](https://leetcode.cn/problems/find-all-anagrams-in-a-string/) | 窗口差异计数 |
| 713 | [乘积小于 K 的子数组](https://leetcode.cn/problems/subarray-product-less-than-k/) | 以右端点计数 |

## 过关标准

写窗口前先定义 `[left,right]` 的含义；能解释为什么丢掉某一端不会错过最优解；能处理重复值、空字符串和 `k <= 1` 等边界。
