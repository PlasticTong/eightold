# go-microv5 组件关系图案例（完整调用过程）

以下是一个基于 `go-microv5` 的完整调用过程关系图示例。

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant Service as 服务
    participant Registry as 服务注册中心
    participant Selector as 服务选择器
    participant Transport as 传输层
    participant Broker as 消息代理
    participant Queue as 消息队列
    participant Protocol as 通信协议
    participant ServiceInstance as 服务实例

    Client->>Service: 调用服务
    Service->>Registry: 注册服务
    Service->>Selector: 选择服务实例
    Selector->>Registry: 获取服务实例列表
    Selector->>ServiceInstance: 选择最佳实例
    Service->>Transport: 发送请求
    Transport->>Protocol: 使用 HTTP/GRPC 协议通信
    Service->>Broker: 发布消息
    Broker->>Queue: 推送消息到队列
    Queue->>ServiceInstance: 消费消息
    ServiceInstance->>Client: 返回响应
```

## 组件说明

- **客户端 (Client)**: 发起服务调用的入口。
- **服务 (Service)**: 核心业务逻辑处理单元，负责处理请求。
- **服务注册中心 (Registry)**: 管理服务的注册与发现。
- **服务选择器 (Selector)**: 选择合适的服务实例，支持负载均衡。
- **传输层 (Transport)**: 提供网络通信能力，支持多种协议。
- **消息代理 (Broker)**: 实现发布/订阅模式的消息传递。
- **消息队列 (Queue)**: 用于异步消息传递。
- **通信协议 (Protocol)**: 支持 HTTP、gRPC 等协议。
- **服务实例 (ServiceInstance)**: 实际运行的服务节点，处理请求并返回响应。
