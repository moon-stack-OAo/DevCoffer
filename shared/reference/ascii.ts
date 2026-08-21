/** ASCII 码表 */

import type { RefGroup, RefItem } from './engine'
import { filterFlat } from './engine'

export type AsciiRow = {
  dec: number
  hex: string
  oct: string
  char: string
  name: string
}

const CTRL_NAMES: Record<number, string> = {
  0: 'NUL (空)',
  1: 'SOH (标题开始)',
  2: 'STX (正文开始)',
  3: 'ETX (正文结束)',
  4: 'EOT (传输结束)',
  5: 'ENQ (询问)',
  6: 'ACK (确认)',
  7: 'BEL (响铃)',
  8: 'BS (退格)',
  9: 'TAB (制表符)',
  10: 'LF (换行)',
  11: 'VT (垂直制表)',
  12: 'FF (换页)',
  13: 'CR (回车)',
  14: 'SO (移出)',
  15: 'SI (移入)',
  16: 'DLE (数据链路转义)',
  17: 'DC1 (设备控制1)',
  18: 'DC2 (设备控制2)',
  19: 'DC3 (设备控制3)',
  20: 'DC4 (设备控制4)',
  21: 'NAK (拒绝)',
  22: 'SYN (同步空闲)',
  23: 'ETB (块传输结束)',
  24: 'CAN (取消)',
  25: 'EM (介质结束)',
  26: 'SUB (替换)',
  27: 'ESC (转义)',
  28: 'FS (文件分隔)',
  29: 'GS (组分隔)',
  30: 'RS (记录分隔)',
  31: 'US (单元分隔)',
  32: 'SP (空格)',
  127: 'DEL (删除)',
}

export function buildAsciiTable(): AsciiRow[] {
  const rows: AsciiRow[] = []
  for (let i = 0; i < 128; i++) {
    const ch = i <= 0x20 || i === 0x7f ? '' : String.fromCharCode(i)
    rows.push({
      dec: i,
      hex: i.toString(16).toUpperCase().padStart(2, '0'),
      oct: i.toString(8).padStart(3, '0'),
      char: ch || (i === 32 ? ' ' : ''),
      name: CTRL_NAMES[i] || (i < 32 ? '控制字符' : i === 127 ? '删除' : ''),
    })
  }
  return rows
}

function rowToItem(r: AsciiRow): RefItem {
  const ch = r.char === ' ' ? '␠' : r.char || '·'
  return {
    name: `${r.dec}  ${ch}`,
    title: r.name || ch,
    desc: `DEC ${r.dec} · HEX ${r.hex} · OCT ${r.oct}`,
    codeLabel: r.hex,
    pattern: r.char,
    code: `dec=${r.dec}\nhex=0x${r.hex}\noct=${r.oct}\nchar=${JSON.stringify(r.char)}`,
  }
}

export function queryAscii(q: string): RefGroup[] {
  const items = filterFlat(buildAsciiTable().map(rowToItem), q)
  return items.length ? [{ cat: 'ASCII 0–127', items }] : []
}

export function searchAscii(q: string): string {
  const groups = queryAscii(q)
  const items = groups[0]?.items || []
  if (!items.length) return '无匹配结果'
  const header = 'DEC  HEX  OCT  CHAR  NAME'
  const lines = items.map((it) => {
    const dec = String(it.desc || '').match(/DEC (\d+)/)?.[1] || ''
    const hex = String(it.codeLabel || '')
    const oct = String(it.desc || '').match(/OCT (\d+)/)?.[1] || ''
    const ch = it.pattern === ' ' ? '␠' : it.pattern || '·'
    return `${dec.padStart(3)}  ${hex.padStart(2)}   ${oct.padStart(3)}  ${String(ch).padEnd(4)}  ${it.title || ''}`
  })
  return [header, ...lines].join('\n')
}
