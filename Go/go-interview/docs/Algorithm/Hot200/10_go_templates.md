# Go 算法模板（Hot 200）

> 模板的价值是减少机械错误。面试时仍要根据题意解释状态、边界与正确性。

## 二分查找：寻找第一个满足条件的位置

```go
func lowerBound(nums []int, target int) int {
	left, right := 0, len(nums) // [left, right)
	for left < right {
		mid := left + (right-left)/2
		if nums[mid] >= target {
			right = mid
		} else {
			left = mid + 1
		}
	}
	return left
}
```

关键不变量：答案始终位于 `[left, right]`，循环结束时两者相等。

## 滑动窗口：满足条件后收缩

```go
left := 0
for right, value := range nums {
	add(value)
	for invalid() {
		remove(nums[left])
		left++
	}
	updateAnswer(left, right)
}
```

先明确窗口语义：`[left, right]` 内保存什么、什么时候合法、答案在扩张后还是收缩后更新。

## BFS：按层遍历

```go
queue := []*TreeNode{root}
for head := 0; head < len(queue); {
	levelEnd := len(queue)
	for head < levelEnd {
		node := queue[head]
		head++
		if node.Left != nil {
			queue = append(queue, node.Left)
		}
		if node.Right != nil {
			queue = append(queue, node.Right)
		}
	}
}
```

按层处理时，应在进入内层循环前固定本层终点，避免新加入的节点混入当前层。

## DFS：网格四方向搜索

```go
dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
var dfs func(int, int)
dfs = func(x, y int) {
	if x < 0 || x >= rows || y < 0 || y >= cols || visited[x][y] {
		return
	}
	visited[x][y] = true
	for _, d := range dirs {
		dfs(x+d[0], y+d[1])
	}
}
```

根据题目补上“不可进入”的条件；如果直接修改网格作为访问标记，要确认允许修改输入。

## 回溯：选择、递归、撤销

```go
path := make([]int, 0, len(nums))
var dfs func(int)
dfs = func(start int) {
	if complete(path) {
		answer = append(answer, append([]int(nil), path...))
		return
	}
	for i := start; i < len(nums); i++ {
		if shouldSkip(i) {
			continue
		}
		path = append(path, nums[i])
		dfs(i + 1)
		path = path[:len(path)-1]
	}
}
```

保存答案时必须复制 `path`，否则多个答案可能共享同一底层数组。

## 动态规划：检查五件事

```text
1. dp[i] 或 dp[i][j] 表示什么？
2. 状态从哪里转移？
3. 初始状态是什么？
4. 遍历顺序能否保证依赖已经算出？
5. 最终答案位于哪个状态？
```

一维背包中的遍历方向具有语义：每个物品最多一次通常倒序枚举容量；物品可重复使用通常正序枚举容量。

## 最小堆

```go
type IntHeap []int

func (h IntHeap) Len() int           { return len(h) }
func (h IntHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h IntHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *IntHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *IntHeap) Pop() any {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}
```

使用前调用 `heap.Init(&h)`；`Push`、`Pop` 要通过 `heap.Push`、`heap.Pop` 调用，才能维护堆性质。

## 并查集

```go
type DSU struct {
	parent []int
	size   []int
}

func (d *DSU) Find(x int) int {
	if d.parent[x] != x {
		d.parent[x] = d.Find(d.parent[x])
	}
	return d.parent[x]
}

func (d *DSU) Union(a, b int) bool {
	ra, rb := d.Find(a), d.Find(b)
	if ra == rb {
		return false
	}
	if d.size[ra] < d.size[rb] {
		ra, rb = rb, ra
	}
	d.parent[rb] = ra
	d.size[ra] += d.size[rb]
	return true
}
```

路径压缩配合按大小合并，可以让连续查找非常接近常数时间。

## 面试结束前自检

- 空输入和单元素是否安全？
- `left/right` 是闭区间还是半开区间？
- 是否会整数溢出或索引越界？
- map 查询是否区分“不存在”和“值为零”？
- 递归终止条件和回溯撤销是否成对？
- 时间复杂度是否满足数据规模？
