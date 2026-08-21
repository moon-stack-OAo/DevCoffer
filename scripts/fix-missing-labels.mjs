import fs from 'node:fs'
import path from 'node:path'

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.name.endsWith('.vue')) out.push(p)
  }
  return out
}

function ensureInputLabel(body) {
  if (/class="lbl"/.test(body)) return { body, changed: false }
  // If first meaningful content is textarea, prepend 输入 label
  const trimmed = body.replace(/^\n/, '')
  if (/^\s*<textarea\b/.test(trimmed)) {
    return {
      body: `\n      <label class="lbl">输入</label>\n${trimmed.replace(/^\s*/, '      ')}`,
      changed: true,
    }
  }
  // file input / plain input as main content
  if (/^\s*<input\b/.test(trimmed) && !/class="lbl"/.test(trimmed)) {
    return {
      body: `\n      <label class="lbl">输入</label>\n${trimmed.replace(/^\s*/, '      ')}`,
      changed: true,
    }
  }
  return { body, changed: false }
}

function ensureOutputLabel(body) {
  if (/class="lbl"/.test(body)) return { body, changed: false }
  const trimmed = body.replace(/^\n/, '')
  if (/^\s*<textarea\b/.test(trimmed)) {
    return {
      body: `\n      <label class="lbl">输出</label>\n${trimmed.replace(/^\s*/, '      ')}`,
      changed: true,
    }
  }
  if (/^\s*<div class="log"/.test(trimmed) || /^\s*<pre\b/.test(trimmed)) {
    return {
      body: `\n      <label class="lbl">输出</label>\n${trimmed.replace(/^\s*/, '      ')}`,
      changed: true,
    }
  }
  return { body, changed: false }
}

let changedFiles = 0
for (const file of walk('components/tools')) {
  let src = fs.readFileSync(file, 'utf8')
  if (/:dual\s*=\s*["']false["']|:dual\s*=\s*false/.test(src)) continue
  if (!src.includes('#input') || !src.includes('#output')) continue

  let fileChanged = false
  src = src.replace(/<template #input>([\s\S]*?)<\/template>/, (_, body) => {
    const r = ensureInputLabel(body)
    if (r.changed) fileChanged = true
    return `<template #input>${r.body.replace(/\n+$/, '\n    ')}</template>`
  })
  src = src.replace(/<template #output>([\s\S]*?)<\/template>/, (_, body) => {
    const r = ensureOutputLabel(body)
    if (r.changed) fileChanged = true
    return `<template #output>${r.body.replace(/\n+$/, '\n    ')}</template>`
  })

  if (fileChanged) {
    fs.writeFileSync(file, src)
    changedFiles++
    console.log('OK', path.relative(process.cwd(), file))
  }
}
console.log('CHANGED=' + changedFiles)
