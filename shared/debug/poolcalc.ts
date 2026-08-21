/** 线程池参数估算（对齐旧站 Little's Law + CPU/IO） */

export type PoolInput = {
  qps: number
  avgMs: number
  cpuCores?: number
  blockingRatio?: number
  targetUtil?: number
  queueSeconds?: number
}

export function poolCalcEstimate(input: PoolInput): string {
  const qps = Number(input.qps)
  const avgMs = Number(input.avgMs)
  const cores = Number(input.cpuCores ?? 8)
  const blockingRatio = Number(input.blockingRatio ?? 1)
  const targetUtil = Number(input.targetUtil ?? 0.7)
  const queueSeconds = Number(input.queueSeconds ?? 1.5)

  if (!(qps > 0)) throw new Error('QPS 必须大于 0')
  if (!(avgMs > 0)) throw new Error('平均耗时(ms) 必须大于 0')
  if (!(cores > 0)) throw new Error('CPU 核数必须大于 0')
  if (blockingRatio < 0 || blockingRatio > 100) throw new Error('阻塞比应在 0~100')
  if (!(targetUtil > 0) || targetUtil > 1) throw new Error('目标利用率应在 (0,1]')
  if (!(queueSeconds > 0)) throw new Error('可接受排队秒数必须大于 0')

  const concurrency = qps * (avgMs / 1000)
  const coreByCpu = cores * targetUtil
  const coreByIo = cores * (1 + blockingRatio) * targetUtil
  const isIoHeavy = blockingRatio >= 1
  let coreRaw = isIoHeavy
    ? Math.max(coreByIo, concurrency)
    : Math.max(coreByCpu, Math.min(concurrency, cores * 2))
  coreRaw = Math.max(coreRaw, concurrency * 0.8, 1)
  const coreSize = Math.max(1, Math.ceil(coreRaw))
  const maxFactor = isIoHeavy ? 2 : 1.5
  const maxSize = Math.max(coreSize + 1, Math.ceil(coreSize * maxFactor))
  const queueCapacity = Math.max(0, Math.ceil(qps * queueSeconds * 1.2))

  const notes: string[] = []
  notes.push(
    `理论并发 concurrency ≈ QPS × (avgMs/1000) = ${qps} × (${avgMs}/1000) = ${concurrency.toFixed(2)}`,
  )
  if (isIoHeavy) {
    notes.push(`判定为 IO/阻塞偏多（blockingRatio=${blockingRatio} ≥ 1）`)
    notes.push(
      `core 参考：cores × (1 + blockingRatio) × targetUtil = ${cores} × (1+${blockingRatio}) × ${targetUtil} = ${coreByIo.toFixed(2)}`,
    )
  } else {
    notes.push(`判定为偏 CPU 密集（blockingRatio=${blockingRatio} < 1）`)
    notes.push(
      `core 参考：cores × targetUtil = ${cores} × ${targetUtil} = ${coreByCpu.toFixed(2)}`,
    )
  }
  notes.push(`maxSize 建议 ≈ core × ${maxFactor}（突发缓冲）`)
  notes.push(
    `queueCapacity ≈ QPS × 排队秒数 × 1.2 = ${qps} × ${queueSeconds} × 1.2 = ${(qps * queueSeconds * 1.2).toFixed(1)}`,
  )
  notes.push('实际还需结合拒绝策略、超时与压测结果微调；队列过大易掩盖慢请求。')

  return [
    '=== 推荐参数 ===',
    `corePoolSize   : ${coreSize}`,
    `maxPoolSize    : ${maxSize}`,
    `queueCapacity  : ${queueCapacity}`,
    `理论并发       : ${Math.round(concurrency * 100) / 100}`,
    '',
    '=== 公式 ===',
    'Little: concurrency = qps * avgMs/1000',
    'core ≈ max(concurrency, cores*(1+blockingRatio)*targetUtil)  [IO]',
    '     或 max(cores*targetUtil, min(concurrency, cores*2))     [CPU]',
    `max  ≈ core * ${maxFactor}`,
    'queue≈ qps * queueSeconds * 1.2',
    '',
    '=== 说明 ===',
    ...notes,
  ].join('\n')
}
