# 算法与 LeetCode Hot 200

> 一套面向 Go 后端面试的 200 题训练模块：先识别模型，再写出正确代码，最后讲清复杂度与边界。

力扣官方提供的是 [LeetCode 热题 100](https://leetcode.cn/studyplan/top-100-liked/) 和 [面试经典 150 题](https://leetcode.cn/studyplan/top-interview-150/)，没有唯一的官方“Hot 200”。本模块以这两套官方题单为骨架，去重后补充常见基础模型，整理为恰好 200 题。

## 题目地图

| 模块 | 题量 | 先掌握的模型 |
| --- | ---: | --- |
| [数组、哈希与矩阵](/go/interview/Algorithm/Hot200/01_array_hash.md) | 30 | 前缀和、原地修改、哈希计数、矩阵模拟 |
| [双指针与滑动窗口](/go/interview/Algorithm/Hot200/02_two_pointer_window.md) | 20 | 相向指针、快慢指针、定长/不定长窗口 |
| [链表](/go/interview/Algorithm/Hot200/03_linked_list.md) | 18 | 虚拟头结点、反转、合并、环检测 |
| [栈、队列与堆](/go/interview/Algorithm/Hot200/04_stack_queue_heap.md) | 22 | 单调栈、双端队列、Top K、数据流 |
| [二叉树与 BST](/go/interview/Algorithm/Hot200/05_tree.md) | 30 | 递归、层序、路径、最近祖先、构造树 |
| [图、DFS、BFS 与并查集](/go/interview/Algorithm/Hot200/06_graph.md) | 20 | 网格搜索、拓扑排序、最短路、连通性 |
| [二分、排序与贪心](/go/interview/Algorithm/Hot200/07_binary_sort_greedy.md) | 20 | 二分答案、区间、排序扫描、局部最优 |
| [回溯](/go/interview/Algorithm/Hot200/08_backtracking.md) | 15 | 选择、约束、撤销、剪枝、去重 |
| [动态规划](/go/interview/Algorithm/Hot200/09_dynamic_programming.md) | 25 | 状态、转移、初始化、遍历顺序、压缩 |
| **合计** | **200** | — |

## 三轮刷题法

### 第一轮：认识模型

- 每题独立思考 15–20 分钟；没有方向就看提示，不硬熬。
- 写出可运行解法后，记录时间复杂度、空间复杂度和一个易错边界。
- 目标是“见过并理解”，不追求一次记住所有代码。

### 第二轮：脱离题型标签

- 打乱顺序，只看题目，不提前看它属于哪个章节。
- 30 分钟内完成：思路 5 分钟、编码 20 分钟、自测 5 分钟。
- 做错的题在 1、3、7、14 天后重做。

### 第三轮：模拟面试

- 先口述暴力方案，再逐步优化。
- 编码时主动覆盖空输入、单元素、重复元素、溢出和越界。
- 最后用一句话解释为什么算法正确，而不只是说“能通过”。

## 每题的完成标准

```text
能识别题型
→ 能说出核心不变量或状态定义
→ 能用 Go 独立写出
→ 能分析时间/空间复杂度
→ 能列出至少两个边界条件
```

## Go 解题约定

- 栈通常直接用切片尾部进行 `append`/截断。
- BFS 队列用切片加头指针，避免反复 `queue = queue[1:]` 长期引用底层数组。
- 堆使用标准库 `container/heap`。
- DFS/回溯先估算递归深度；深度不可控时改为显式栈。
- 不为了“少一行代码”省略空切片、空树和索引边界检查。

常用代码骨架见 [Go 算法模板](/go/interview/Algorithm/Hot200/10_go_templates.md)。

## 使用说明

章节右侧提供本页导航，读完可在页尾点击“标记为已学”。题目标题链接到力扣中国站；本仓库只保存题单、原创提示与 Go 模板，不复制题目正文或官方题解。
