/** 由 scripts/extract-ref-data.mjs 从旧站抽取，勿手改大数据 */
export default {
  "kind": "flat",
  "data": [
    {
      "name": "REQUIRED",
      "isDefault": true,
      "desc": "如果当前存在事务则加入；否则新建一个事务（默认值）",
      "scenario": "绝大部分业务方法：单服务内多次写操作希望一并提交/回滚"
    },
    {
      "name": "SUPPORTS",
      "isDefault": false,
      "desc": "如果当前存在事务则加入；否则以非事务方式执行",
      "scenario": "查询方法：外层有事务就跟着走，没有也没关系（提升非事务场景性能）"
    },
    {
      "name": "MANDATORY",
      "isDefault": false,
      "desc": "必须存在一个事务，否则抛 IllegalTransactionStateException",
      "scenario": "核心写入方法强制要求外层开启事务，避免被误用为非事务调用"
    },
    {
      "name": "REQUIRES_NEW",
      "isDefault": false,
      "desc": "无论当前是否有事务，都新建一个事务；原事务被挂起",
      "scenario": "记录操作日志 / 审计：无论主业务成功失败，日志都希望独立提交"
    },
    {
      "name": "NOT_SUPPORTED",
      "isDefault": false,
      "desc": "以非事务方式执行；若当前存在事务则挂起",
      "scenario": "某些必须非事务执行的中间件调用（如发消息）"
    },
    {
      "name": "NEVER",
      "isDefault": false,
      "desc": "必须在非事务下执行；若当前存在事务则抛异常",
      "scenario": "强约束：禁止在事务中调用的方法（如某些 DDL、远程接口）"
    },
    {
      "name": "NESTED",
      "isDefault": false,
      "desc": "若当前存在事务则创建嵌套事务（savepoint）；否则等价于 REQUIRED",
      "scenario": "部分子操作可独立回滚而不影响外层（仅 JDBC DataSource 支持）"
    }
  ]
} as const
