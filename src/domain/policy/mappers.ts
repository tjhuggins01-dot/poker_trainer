import { type HandClass, type PolicyAction, type SituationPolicyRecord } from '../../lib/types';

const POLICY_BUCKET_TO_ACTION_ID: Record<string, string> = {
  raise: 'RAISE',
  limp: 'LIMP',
  call: 'CALL',
  threeBet: '3BET',
  fourBet: '4BET',
};

export const policyToActionMap = (policy: SituationPolicyRecord['policy'] | undefined): Partial<Record<HandClass, string>> => {
  const map: Partial<Record<HandClass, string>> = {};
  Object.entries(policy ?? {}).forEach(([bucket, hands]) => {
    const actionId = POLICY_BUCKET_TO_ACTION_ID[bucket] ?? bucket.toUpperCase();
    (hands ?? []).forEach((hand) => {
      map[hand] = actionId;
    });
  });
  return map;
};

export const actionSetToColorMap = (actionSet: PolicyAction[] | undefined): Record<string, string> =>
  Object.fromEntries((actionSet ?? []).map((action) => [action.id, action.color]));
