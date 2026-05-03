// Mode state machine for OPTIMIZE / SCALE / HOLD transitions.
// Encodes A6 (rollback & stability), A7 (pre-scaling gate), B7 (guardrails).

import { CampaignAggregate, CampaignState, Mode } from './types.ts';

export interface TransitionDecision {
  next_mode: Mode;
  reason: string;
  from: Mode;
}

export function shouldExitScale(campaign: CampaignAggregate, state: CampaignState): TransitionDecision | null {
  // B7.1 ROAS below target
  if (state.current_mode === 'SCALE' && campaign.roas_7d < state.target_roas) {
    return { next_mode: 'OPTIMIZE', reason: `B7.1 ROAS ${campaign.roas_7d.toFixed(2)} < target ${state.target_roas}`, from: 'SCALE' };
  }
  // B7.2 CPA drift > 20% above baseline
  if (state.current_mode === 'SCALE' && state.baseline_cpa && campaign.cpa_7d > state.baseline_cpa * 1.2) {
    return { next_mode: 'OPTIMIZE', reason: `B7.2 CPA drift > 20% above baseline`, from: 'SCALE' };
  }
  return null;
}

export function shouldEnterHold(campaign: CampaignAggregate, state: CampaignState): TransitionDecision | null {
  if (state.consecutive_unstable_days > 3) {
    return { next_mode: 'HOLD', reason: 'A6 unstable >3 consecutive days', from: state.current_mode };
  }
  return null;
}

/**
 * A7 Pre-Scaling Gate. All five must pass to enter SCALE_MODE.
 * Returns null when cleared, otherwise a HOLD/OPTIMIZE decision.
 */
export function preScalingGate(
  campaign: CampaignAggregate, state: CampaignState,
): TransitionDecision | null {
  if (!state.inventory_ok) return { next_mode: 'HOLD', reason: 'A7.1 inventory cannot support 3x', from: state.current_mode };
  if (!state.cashflow_ok) return { next_mode: 'HOLD', reason: 'A7.2 cash flow cannot absorb', from: state.current_mode };
  if (!state.ops_ok)      return { next_mode: 'HOLD', reason: 'A7.3 operations cannot handle surge', from: state.current_mode };

  const targetCpa = state.target_cpa ?? state.baseline_cpa ?? 0;
  if (targetCpa > 0 && campaign.cpa_7d > targetCpa) {
    return { next_mode: 'OPTIMIZE', reason: `A7.4 CPA ${campaign.cpa_7d.toFixed(2)} > target ${targetCpa}`, from: state.current_mode };
  }

  // A7.5 cold frequency >= 3 — approximated by overall freq until we add
  // audience breakdown.
  const avgFreq = campaign.ads.length
    ? campaign.ads.reduce((s, a) => s + a.frequency, 0) / campaign.ads.length
    : 1;
  if (avgFreq >= 3) {
    return { next_mode: 'OPTIMIZE', reason: `A7.5 cold frequency ${avgFreq.toFixed(2)} >= 3`, from: state.current_mode };
  }

  return null; // cleared
}
