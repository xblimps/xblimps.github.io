// Labelled-bracketing parser + constituency-tree layout.
//
// Parses syntactician-friendly bracketed notation — e.g.
//   [CP [DP {SUBJ}] [C' [C ] [TP [T {VERB}] [vP …]]]]
// — into a node tree, and lays it out as a top-down constituency tree (leaves spread left→right,
// each parent centred over its children) for SVG rendering. Pure + dependency-free so it works for
// Minimalist / X-bar trees and Penn Treebank bracketing alike.

export interface TreeNode {
  id: string
  label: string
  children: TreeNode[]
  terminal: boolean   // a leaf word (vs a phrasal/category label)
}

// supports both Minimalist/X-bar square brackets [TP …] and Penn Treebank parens (S …)
const WORD = /[^\s[\]()]/
const OPEN = (c: string) => c === '[' || c === '('
const CLOSE = (c: string) => c === ']' || c === ')'

export function parseBracketTree(src: string): TreeNode | null {
  const s = (src ?? '').trim()
  if (!s) return null
  let i = 0
  let idc = 0
  const skipWs = () => { while (i < s.length && /\s/.test(s[i])) i++ }
  const readWord = () => { let w = ''; while (i < s.length && WORD.test(s[i])) w += s[i++]; return w }

  function parseNode(): TreeNode | null {
    skipWs()
    if (i >= s.length) return null
    if (OPEN(s[i])) {
      i++ // consume opening bracket
      skipWs()
      const label = readWord() || '∅'
      const node: TreeNode = { id: `n${idc++}`, label, children: [], terminal: false }
      skipWs()
      while (i < s.length && !CLOSE(s[i])) {
        if (OPEN(s[i])) { const c = parseNode(); if (c) node.children.push(c) }
        else { const w = readWord(); if (w) node.children.push({ id: `n${idc++}`, label: w, children: [], terminal: true }) }
        skipWs()
      }
      if (CLOSE(s[i])) i++ // consume closing bracket
      return node
    }
    const w = readWord()
    return w ? { id: `n${idc++}`, label: w, children: [], terminal: true } : null
  }

  const roots: TreeNode[] = []
  skipWs()
  while (i < s.length) {
    const before = i
    const n = parseNode()
    if (n) roots.push(n)
    if (i === before) break // guard against a stray ] or unparseable char
    skipWs()
  }
  if (roots.length === 0) return null
  if (roots.length === 1) return roots[0]
  return { id: 'root', label: '', children: roots, terminal: false }
}

export interface PosNode { node: TreeNode; x: number; y: number }
export interface TreeLayout { nodes: PosNode[]; edges: [PosNode, PosNode][]; width: number; height: number }

export function layoutTree(root: TreeNode, xGap = 58, yGap = 62, padX = 30, padY = 22): TreeLayout {
  const pos = new Map<string, { x: number; y: number }>()
  let leaf = 0
  let maxDepth = 0
  const walk = (n: TreeNode, depth: number): number => {
    maxDepth = Math.max(maxDepth, depth)
    let x: number
    if (n.children.length === 0) { x = leaf; leaf += 1 }
    else { const xs = n.children.map((c) => walk(c, depth + 1)); x = (xs[0] + xs[xs.length - 1]) / 2 }
    pos.set(n.id, { x, y: depth })
    return x
  }
  walk(root, 0)

  const flat: TreeNode[] = []
  ;(function collect(n: TreeNode) { flat.push(n); n.children.forEach(collect) })(root)

  const nodes: PosNode[] = flat.map((n) => {
    const p = pos.get(n.id)!
    return { node: n, x: padX + p.x * xGap, y: padY + p.y * yGap }
  })
  const byId = new Map(nodes.map((p) => [p.node.id, p]))
  const edges: [PosNode, PosNode][] = []
  for (const n of flat) for (const c of n.children) edges.push([byId.get(n.id)!, byId.get(c.id)!])

  return {
    nodes,
    edges,
    width: padX * 2 + Math.max(0, leaf - 1) * xGap,
    height: padY * 2 + maxDepth * yGap,
  }
}
