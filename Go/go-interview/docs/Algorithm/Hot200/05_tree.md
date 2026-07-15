# Hot 200：二叉树、BST 与 Trie

> 本章 30 题。递归函数要先定义“输入一个节点时，它返回什么”，再写终止条件和组合逻辑。

## 遍历、层序与构造

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 94 | [二叉树的中序遍历](https://leetcode.cn/problems/binary-tree-inorder-traversal/) | 递归与显式栈 |
| 100 | [相同的树](https://leetcode.cn/problems/same-tree/) | 同步递归 |
| 101 | [对称二叉树](https://leetcode.cn/problems/symmetric-tree/) | 镜像比较 |
| 102 | [二叉树的层序遍历](https://leetcode.cn/problems/binary-tree-level-order-traversal/) | 分层 BFS |
| 103 | [二叉树的锯齿形层序遍历](https://leetcode.cn/problems/binary-tree-zigzag-level-order-traversal/) | 层方向处理 |
| 104 | [二叉树的最大深度](https://leetcode.cn/problems/maximum-depth-of-binary-tree/) | 后序高度 |
| 105 | [从前序与中序遍历序列构造二叉树](https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) | 根与区间 |
| 106 | [从中序与后序遍历序列构造二叉树](https://leetcode.cn/problems/construct-binary-tree-from-inorder-and-postorder-traversal/) | 索引映射 |
| 108 | [将有序数组转换为二叉搜索树](https://leetcode.cn/problems/convert-sorted-array-to-binary-search-tree/) | 分治构造 |
| 110 | [平衡二叉树](https://leetcode.cn/problems/balanced-binary-tree/) | 自底向上剪枝 |
| 111 | [二叉树的最小深度](https://leetcode.cn/problems/minimum-depth-of-binary-tree/) | 叶节点边界 |
| 114 | [二叉树展开为链表](https://leetcode.cn/problems/flatten-binary-tree-to-linked-list/) | 后序重连 |
| 116 | [填充每个节点的下一个右侧节点指针](https://leetcode.cn/problems/populating-next-right-pointers-in-each-node/) | 完美树跨层连接 |
| 117 | [填充每个节点的下一个右侧节点指针 II](https://leetcode.cn/problems/populating-next-right-pointers-in-each-node-ii/) | 通用层链表 |

## 路径、视图与结构信息

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 112 | [路径总和](https://leetcode.cn/problems/path-sum/) | 根到叶路径 |
| 124 | [二叉树中的最大路径和](https://leetcode.cn/problems/binary-tree-maximum-path-sum/) | 单边贡献与全局答案 |
| 129 | [求根节点到叶节点数字之和](https://leetcode.cn/problems/sum-root-to-leaf-numbers/) | 路径状态累积 |
| 199 | [二叉树的右视图](https://leetcode.cn/problems/binary-tree-right-side-view/) | 每层最后节点 |
| 226 | [翻转二叉树](https://leetcode.cn/problems/invert-binary-tree/) | 子树交换 |
| 236 | [二叉树的最近公共祖先](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/) | 自底向上返回命中 |
| 297 | [二叉树的序列化与反序列化](https://leetcode.cn/problems/serialize-and-deserialize-binary-tree/) | 空节点占位与边界 |
| 437 | [路径总和 III](https://leetcode.cn/problems/path-sum-iii/) | 树上前缀和 |
| 543 | [二叉树的直径](https://leetcode.cn/problems/diameter-of-binary-tree/) | 左右高度之和 |
| 617 | [合并二叉树](https://leetcode.cn/problems/merge-two-binary-trees/) | 双树递归 |
| 662 | [二叉树最大宽度](https://leetcode.cn/problems/maximum-width-of-binary-tree/) | 层序位置编号 |

## BST 与字典树

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 98 | [验证二叉搜索树](https://leetcode.cn/problems/validate-binary-search-tree/) | 上下界/中序单调 |
| 208 | [实现 Trie](https://leetcode.cn/problems/implement-trie-prefix-tree/) | 字符边与终止标记 |
| 230 | [二叉搜索树中第 K 小的元素](https://leetcode.cn/problems/kth-smallest-element-in-a-bst/) | 中序第 K 个 |
| 235 | [二叉搜索树的最近公共祖先](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-search-tree/) | 利用大小关系 |
| 700 | [二叉搜索树中的搜索](https://leetcode.cn/problems/search-in-a-binary-search-tree/) | BST 定向查找 |

## 过关标准

能区分前序、后序递归各自适合的问题；空树能正确返回；涉及全局答案时能说清递归返回值与全局变量分别表示什么。
