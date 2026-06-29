import React from 'react'
import { parseBracketTree, layoutTree } from '../lib/tree'

// Live constituency-tree render of labelled bracketing. Non-terminals are drawn as bold category
// labels, terminals as italic words; {SLOT} placeholders are tinted so the schema is legible.
export default function SyntaxTree({ source, hue = '#534AB7' }: { source: string; hue?: string }) {
  const root = parseBracketTree(source)
  if (!root) {
    return <div className="faint" style={{ fontSize: 12.5, padding: '14px 4px' }}>Type labelled bracketing above to see the tree, e.g. <span className="mono">[TP [DP {'{SUBJ}'}] [T {'{VERB}'}]]</span></div>
  }

  let layout
  try { layout = layoutTree(root) } catch { return <div className="faint" style={{ fontSize: 12.5 }}>Could not lay out this tree — check the brackets are balanced.</div> }
  const { nodes, edges, width, height } = layout
  const isSlot = (s: string) => /^\{.*\}$/.test(s)

  return (
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <svg width={Math.max(width, 80)} height={Math.max(height, 60)} style={{ display: 'block', fontFamily: 'inherit' }}>
        {edges.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y + 6} x2={b.x} y2={b.y - 12} stroke="var(--hair)" strokeWidth={1.2} />
        ))}
        {nodes.map((p) => (
          <text key={p.node.id} x={p.x} y={p.y} textAnchor="middle"
            fontSize={p.node.terminal ? 13 : 12}
            fontStyle={p.node.terminal ? 'italic' : 'normal'}
            fontWeight={p.node.terminal ? 400 : 600}
            fill={isSlot(p.node.label) ? hue : p.node.terminal ? 'var(--ink)' : 'var(--ink-soft)'}
            style={p.node.terminal ? { fontFamily: 'Georgia, serif' } : { fontFamily: 'ui-monospace, monospace', letterSpacing: '.02em' }}>
            {p.node.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
