/**
 * Rebuild the gradients that repair pass 2 flattened.
 *
 * Pass 2's rule turned `from-brand-100/50 via-brand-100/25 to-brand-100/50`
 * into `from-brand-50 via-brand-50 to-brand-50`. That was right for a wash and
 * wrong for everything else: a gradient whose three stops are the same colour
 * is a flat rectangle wearing a gradient's clothes. It passed every contrast
 * and layout check, because technically nothing about it is broken — it just
 * does not render.
 *
 * Three roles need three different treatments, which is why this is keyed on
 * the field name rather than applied as one blanket substitution:
 *
 *   glow   a halo sitting behind a card. It has to fade, or it is a flat tint
 *          sitting on top of the card it is meant to sit behind.
 *   strip  a 2px rule across the top of a card. Pale stops make it invisible;
 *          it is the one place a saturated colour is correct at this weight.
 *   bar    a progress fill. Same reasoning as strip — it has to be seen.
 *   accent a broad card wash. Stays subtle, but keeps a real gradient so the
 *          surface is not a single flat fill.
 *
 * Families present in the original are preserved; only the stops change.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Parse `from-a-100 via-b-50 to-c-100` into ['a','b','c'], or null.
const STOPS = /(?:from|via|to)-([a-z]+)-(\d{2,3})(?:\/(\d{1,3}))?/g

function families(value) {
  const fams = []
  for (const m of value.matchAll(STOPS)) if (!fams.includes(m[1])) fams.push(m[1])
  return fams
}

function rebuild(field, value) {
  const fams = families(value)
  if (!fams.length) return null
  const at = (i) => fams[Math.min(i, fams.length - 1)]

  if (field === 'glow') {
    // Fade to transparent so the halo reads as depth behind the card.
    return `from-${at(0)}-100/70 via-${at(1)}-50/60 to-transparent`
  }
  if (field === 'strip' || field === 'bar') {
    // Saturated: at 2px there is no other way to make it legible.
    return `from-${at(0)}-500 to-${at(1)}-400`
  }
  if (field === 'accent') {
    return `from-${at(0)}-100 via-${at(1)}-50 to-${at(fams.length - 1)}-100`
  }
  return null
}

const FIELDS = /(\b(?:glow|strip|bar|accent):\s*')([^']*)(')/g

function walk(dir) {
  const out = []
  for (const e of readdirSync(dir)) {
    const full = join(dir, e)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.(jsx|js)$/.test(e)) out.push(full)
  }
  return out
}

let files = 0
let fixes = 0
const log = []

for (const file of walk('src')) {
  const rel = file.replace(/\\/g, '/')
  const before = readFileSync(file, 'utf8')
  const after = before.replace(FIELDS, (full, pre, value, post) => {
    const field = pre.match(/(\w+):\s*'?$/)[1]
    const next = rebuild(field, value)
    if (!next || next === value) return full
    fixes++
    log.push(`  ${rel.padEnd(42)} ${field.padEnd(7)} ${value.padEnd(40)} -> ${next}`)
    return pre + next + post
  })
  if (after !== before) {
    writeFileSync(file, after, 'utf8')
    files++
  }
}

console.log(`rebuilt ${fixes} gradient(s) across ${files} file(s)\n`)
console.log(log.join('\n'))