/** 简易行 Diff（无第三方时的 LCS 回退；有 diff 包时组件侧可换） */

export function lineDiff(a: string, b: string): string {
  const left = String(a ?? '').split(/\r?\n/)
  const right = String(b ?? '').split(/\r?\n/)
  const lcs = buildLcs(left, right)
  const out: string[] = []
  let i = 0
  let j = 0
  let k = 0
  while (i < left.length || j < right.length) {
    if (k < lcs.length && i < left.length && left[i] === lcs[k] && j < right.length && right[j] === lcs[k]) {
      out.push('  ' + left[i])
      i++
      j++
      k++
    } else if (k < lcs.length && i < left.length && left[i] !== lcs[k]) {
      out.push('- ' + left[i])
      i++
    } else if (k < lcs.length && j < right.length && right[j] !== lcs[k]) {
      out.push('+ ' + right[j])
      j++
    } else if (i < left.length && j >= right.length) {
      out.push('- ' + left[i++])
    } else if (j < right.length && i >= left.length) {
      out.push('+ ' + right[j++])
    } else if (i < left.length && j < right.length) {
      // 两边都有但无法对齐
      out.push('- ' + left[i++])
      out.push('+ ' + right[j++])
    } else break
  }
  return out.join('\n') || '(无差异)'
}

function buildLcs(a: string[], b: string[]): string[] {
  const n = a.length
  const m = b.length
  // 限制规模，避免过大矩阵
  if (n * m > 400000) {
    return greedyLcs(a, b)
  }
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i]![j] = dp[i - 1]![j - 1]! + 1
      else dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!)
    }
  }
  const seq: string[] = []
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      seq.push(a[i - 1]!)
      i--
      j--
    } else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) i--
    else j--
  }
  return seq.reverse()
}

function greedyLcs(a: string[], b: string[]): string[] {
  const set = new Set(b)
  return a.filter((x) => set.has(x)).slice(0, 500)
}
