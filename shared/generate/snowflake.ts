/** Twitter Snowflake ID（可配置 datacenter / worker） */

export const SNOWFLAKE_EPOCH = BigInt('1288834974657')

let lastTimestamp = BigInt(-1)
let sequence = BigInt(0)

const MASK_5 = BigInt(0x1f)
const MASK_12 = BigInt(0xfff)
const MASK_41 = BigInt('2199023255551') // (1n << 41n) - 1
const SHIFT_12 = BigInt(12)
const SHIFT_17 = BigInt(17)
const SHIFT_22 = BigInt(22)
const SHIFT_41 = BigInt(41)

function formatTime(ms: number): string {
    const d = new Date(ms)
    const pad = (n: number, w = 2) => String(n).padStart(w, '0')
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
    )
}

export function snowflakeId(
    workerId: number,
    datacenterId: number,
    seq: number | bigint,
    ts?: number | bigint,
    epoch: bigint = SNOWFLAKE_EPOCH,
): bigint {
    const wid = BigInt(workerId || 0)
    const did = BigInt(datacenterId || 0)
    const s = BigInt(seq || 0)
    const t = BigInt(ts == null ? Date.now() : ts)
    const timestamp = t - epoch
    if (timestamp < BigInt(0)) throw new Error('时间戳小于 Epoch')
    if (timestamp >= BigInt(1) << SHIFT_41) throw new Error('时间戳超过 41 位')
    return (
        (timestamp << SHIFT_22) |
        ((did & MASK_5) << SHIFT_17) |
        ((wid & MASK_5) << SHIFT_12) |
        (s & MASK_12)
    )
}

export function nextSnowflake(
    workerId: number,
    datacenterId: number,
    epoch: bigint = SNOWFLAKE_EPOCH,
): bigint {
    let ts = BigInt(Date.now())
    if (ts === lastTimestamp) {
        sequence = (sequence + BigInt(1)) & MASK_12
        if (sequence === BigInt(0)) {
            while (ts <= lastTimestamp) ts = BigInt(Date.now())
        }
    } else {
        sequence = BigInt(0)
    }
    lastTimestamp = ts
    return snowflakeId(workerId, datacenterId, sequence, ts, epoch)
}

export function generateSnowflakes(
    count: number,
    workerId = 1,
    datacenterId = 1,
): string[] {
    const n = Math.max(1, Math.min(100, Math.floor(count) || 1))
    const list: string[] = []
    for (let i = 0; i < n; i++) list.push(nextSnowflake(workerId, datacenterId).toString())
    return list
}

export type ParsedSnowflake = {
    timestamp: number
    datetime: string
    localTime: string
    datacenterId: number
    workerId: number
    sequence: number
}

export function parseSnowflake(idStr: string, epoch: bigint = SNOWFLAKE_EPOCH): ParsedSnowflake {
    const raw = String(idStr).trim()
    if (!/^\d{1,20}$/.test(raw)) throw new Error('ID 必须为纯数字')
    const id = BigInt(raw)
    const timestamp = Number((id >> SHIFT_22) & MASK_41) + Number(epoch)
    return {
        timestamp,
        datetime: new Date(timestamp).toISOString(),
        localTime: formatTime(timestamp),
        datacenterId: Number((id >> SHIFT_17) & MASK_5),
        workerId: Number((id >> SHIFT_12) & MASK_5),
        sequence: Number(id & MASK_12),
    }
}
