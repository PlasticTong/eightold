# Hot 200：图、搜索与并查集

> 本章 20 题。先确认节点、边和访问状态，再决定 DFS、BFS、拓扑排序、并查集或最短路。

## 网格 DFS/BFS

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 130 | [被围绕的区域](https://leetcode.cn/problems/surrounded-regions/) | 从边界反向搜索 |
| 200 | [岛屿数量](https://leetcode.cn/problems/number-of-islands/) | 连通块计数 |
| 417 | [太平洋大西洋水流问题](https://leetcode.cn/problems/pacific-atlantic-water-flow/) | 反向可达性 |
| 994 | [腐烂的橘子](https://leetcode.cn/problems/rotting-oranges/) | 多源 BFS |
| 733 | [图像渲染](https://leetcode.cn/problems/flood-fill/) | 洪水填充 |
| 695 | [岛屿的最大面积](https://leetcode.cn/problems/max-area-of-island/) | 连通块面积 |
| 1091 | [二进制矩阵中的最短路径](https://leetcode.cn/problems/shortest-path-in-binary-matrix/) | 无权图最短路 |

## 图遍历与拓扑排序

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 127 | [单词接龙](https://leetcode.cn/problems/word-ladder/) | 隐式图 BFS |
| 133 | [克隆图](https://leetcode.cn/problems/clone-graph/) | 原节点到副本映射 |
| 207 | [课程表](https://leetcode.cn/problems/course-schedule/) | 拓扑判环 |
| 210 | [课程表 II](https://leetcode.cn/problems/course-schedule-ii/) | 输出拓扑序 |
| 785 | [判断二分图](https://leetcode.cn/problems/is-graph-bipartite/) | 染色冲突 |
| 797 | [所有可能的路径](https://leetcode.cn/problems/all-paths-from-source-to-target/) | DAG 路径回溯 |
| 399 | [除法求值](https://leetcode.cn/problems/evaluate-division/) | 带权图搜索 |
| 752 | [打开转盘锁](https://leetcode.cn/problems/open-the-lock/) | 状态空间 BFS |

## 并查集与加权图

| 题号 | 题目 | 训练重点 |
| ---: | --- | --- |
| 547 | [省份数量](https://leetcode.cn/problems/number-of-provinces/) | 连通分量 |
| 684 | [冗余连接](https://leetcode.cn/problems/redundant-connection/) | 检测成环边 |
| 721 | [账户合并](https://leetcode.cn/problems/accounts-merge/) | 实体归并 |
| 1584 | [连接所有点的最小费用](https://leetcode.cn/problems/min-cost-to-connect-all-points/) | 最小生成树 |
| 743 | [网络延迟时间](https://leetcode.cn/problems/network-delay-time/) | Dijkstra 最短路 |

## 过关标准

访问标记必须在入队时设置，避免重复入队；能解释拓扑排序为何可判环；能独立写出带路径压缩和按大小合并的并查集。
