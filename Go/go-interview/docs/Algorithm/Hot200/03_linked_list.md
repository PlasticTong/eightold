# Hot 200：链表

> 本章 18 题。画清指针变化再写代码；涉及头结点变化时优先使用虚拟头结点。

## 基础操作与结构判断

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 19 | [删除链表的倒数第 N 个结点](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/) | 固定间距双指针 |
| 21 | [合并两个有序链表](https://leetcode.cn/problems/merge-two-sorted-lists/) | 虚拟头结点 |
| 24 | [两两交换链表中的节点](https://leetcode.cn/problems/swap-nodes-in-pairs/) | 局部重连 |
| 61 | [旋转链表](https://leetcode.cn/problems/rotate-list/) | 成环后断开 |
| 82 | [删除排序链表中的重复元素 II](https://leetcode.cn/problems/remove-duplicates-from-sorted-list-ii/) | 跨过整段重复值 |
| 86 | [分隔链表](https://leetcode.cn/problems/partition-list/) | 两链表稳定拼接 |
| 92 | [反转链表 II](https://leetcode.cn/problems/reverse-linked-list-ii/) | 区间反转 |
| 141 | [环形链表](https://leetcode.cn/problems/linked-list-cycle/) | 快慢指针 |
| 160 | [相交链表](https://leetcode.cn/problems/intersection-of-two-linked-lists/) | 路程补偿 |
| 206 | [反转链表](https://leetcode.cn/problems/reverse-linked-list/) | 三指针迭代 |
| 234 | [回文链表](https://leetcode.cn/problems/palindrome-linked-list/) | 中点、反转、比较 |

## 组合、复制与设计

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 2 | [两数相加](https://leetcode.cn/problems/add-two-numbers/) | 进位与不等长链表 |
| 23 | [合并 K 个升序链表](https://leetcode.cn/problems/merge-k-sorted-lists/) | 分治/最小堆 |
| 25 | [K 个一组翻转链表](https://leetcode.cn/problems/reverse-nodes-in-k-group/) | 分组边界与重连 |
| 138 | [随机链表的复制](https://leetcode.cn/problems/copy-list-with-random-pointer/) | 映射/节点穿插 |
| 142 | [环形链表 II](https://leetcode.cn/problems/linked-list-cycle-ii/) | 环入口推导 |
| 146 | [LRU 缓存](https://leetcode.cn/problems/lru-cache/) | 哈希表加双向链表 |
| 148 | [排序链表](https://leetcode.cn/problems/sort-list/) | 链表归并排序 |

## 过关标准

每次改指针前保存会丢失的后继节点；能画出空链表、单节点、两节点的变化；能解释 LRU 为什么所有操作都是 `O(1)`。
