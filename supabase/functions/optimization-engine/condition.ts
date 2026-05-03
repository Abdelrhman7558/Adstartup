// Condition evaluator. Each rule's `condition` is a JSON spec like
//   { all: [{ metric: "roas", op: ">=", value: 6 }, ...] }
// or { any: [...] } or both. We only need numeric/boolean comparisons today,
// so the implementation stays small and dependency-free.

import { ConditionLeaf, RuleCondition } from './types.ts';

function compareLeaf(leaf: ConditionLeaf, ctx: Record<string, number | boolean | string>): boolean {
  const actual = ctx[leaf.metric];
  if (actual === undefined || actual === null) return false;

  // Boolean fast paths
  if (typeof leaf.value === 'boolean') {
    if (leaf.op === '==') return Boolean(actual) === leaf.value;
    if (leaf.op === '!=') return Boolean(actual) !== leaf.value;
    return false;
  }

  // String compare
  if (typeof leaf.value === 'string') {
    if (leaf.op === '==') return String(actual) === leaf.value;
    if (leaf.op === '!=') return String(actual) !== leaf.value;
    return false;
  }

  // Numeric
  const a = Number(actual);
  const v = Number(leaf.value);
  if (Number.isNaN(a) || Number.isNaN(v)) return false;
  switch (leaf.op) {
    case '==': return a === v;
    case '!=': return a !== v;
    case '>':  return a > v;
    case '>=': return a >= v;
    case '<':  return a < v;
    case '<=': return a <= v;
  }
}

export function evaluateCondition(
  cond: RuleCondition,
  ctx: Record<string, number | boolean | string>,
): boolean {
  if (cond.all && cond.all.length > 0) {
    if (!cond.all.every(l => compareLeaf(l, ctx))) return false;
  }
  if (cond.any && cond.any.length > 0) {
    if (!cond.any.some(l => compareLeaf(l, ctx))) return false;
  }
  // Empty condition `{}` matches everything (used by some SHARED rules).
  if (!cond.all && !cond.any) return true;
  return true;
}
