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

let n = 0
for (const file of walk('components/tools')) {
  let t = fs.readFileSync(file, 'utf8')
  const next = t
    .replace(/\n {8}<template #toolbar>/g, '\n    <template #toolbar>')
    .replace(/\n<template #input>\n</g, '\n    <template #input>\n')
    .replace(/\n<label class="lbl"/g, '\n      <label class="lbl"')
    .replace(/\n<textarea /g, '\n      <textarea ')
    .replace(/\n<input /g, '\n      <input ')
    .replace(/\n<div /g, '\n      <div ')
    .replace(/\n<p class="hint"/g, '\n      <p class="hint"')
  if (next !== t) {
    fs.writeFileSync(file, next)
    n++
  }
}
console.log('NORM=' + n)
