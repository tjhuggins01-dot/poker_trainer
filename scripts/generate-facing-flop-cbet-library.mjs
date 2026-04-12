import fs from 'node:fs';
import path from 'node:path';

const spotId = 'cash9max-100-btn-vs-co-srp-flop-ip-facing-cbet';

const boardConfigs = [
  {
    board: ['As', '8d', '3c'],
    family: 'a-high-dry',
    texture: 'dry-high',
    scenarios: {
      air: { hand: ['Kd', 'Qh'], responses: { small: 'fold', big: 'fold' }, handClass: 'pure-air' },
      'overcards-bd': { hand: ['Kc', 'Qc'], responses: { small: 'call', big: 'fold' }, handClass: 'overcards-backdoor' },
      'weak-pair': { hand: ['8h', '7s'], responses: { small: 'call', big: 'fold' }, handClass: 'middle-pair' },
      'strong-top': { hand: ['Ad', 'Jc'], responses: { small: 'call', big: 'call' }, handClass: 'top-pair-good-kicker' },
      'strong-equity': { hand: ['5s', '4s'], responses: { small: 'call', big: 'fold' }, handClass: 'gutshot-backdoor-flush' },
      nutted: { hand: ['3h', '3d'], responses: { small: 'raise', big: 'raise' }, handClass: 'bottom-set' },
      ambiguous: { hand: ['Ah', '5h'], responses: { small: null, big: null }, handClass: 'top-pair-weak-kicker', rejection: 'Top-pair weak-kicker mixes between thin value/protection and passive realization.' },
    },
  },
  {
    board: ['Kh', '7c', '2d'],
    family: 'k-high-dry',
    texture: 'dry-high',
    scenarios: {
      air: { hand: ['Qd', '4s'], responses: { small: 'fold', big: 'fold' }, handClass: 'pure-air' },
      'overcards-bd': { hand: ['Qs', 'Js'], responses: { small: 'call', big: 'fold' }, handClass: 'overcards-backdoor' },
      'weak-pair': { hand: ['7h', '6s'], responses: { small: 'call', big: 'fold' }, handClass: 'middle-pair' },
      'strong-top': { hand: ['Kd', 'Jc'], responses: { small: 'call', big: 'call' }, handClass: 'top-pair-good-kicker' },
      'strong-equity': { hand: ['Ad', 'Qd'], responses: { small: 'call', big: 'fold' }, handClass: 'overs-backdoor-nut-draw' },
      nutted: { hand: ['7d', '7s'], responses: { small: 'raise', big: 'raise' }, handClass: 'middle-set' },
      ambiguous: { hand: ['Kc', '9c'], responses: { small: null, big: null }, handClass: 'top-pair-weaker-kicker', rejection: 'Borderline top-pair kicker quality is too close for one rigid baseline action.' },
    },
  },
  {
    board: ['Qh', 'Td', '8c'],
    family: 'qj-high-dynamic',
    texture: 'dynamic-broadway',
    scenarios: {
      air: { hand: ['4s', '3d'], responses: { small: 'fold', big: 'fold' }, handClass: 'pure-air' },
      'overcards-bd': { hand: ['As', 'Kc'], responses: { small: 'call', big: 'fold' }, handClass: 'double-over-gutshot' },
      'weak-pair': { hand: ['8h', '7h'], responses: { small: 'call', big: 'fold' }, handClass: 'third-pair-backdoor' },
      'strong-top': { hand: ['Qs', 'Jc'], responses: { small: 'call', big: 'call' }, handClass: 'top-pair-gutter' },
      'strong-equity': { hand: ['Jh', '9h'], responses: { small: 'raise', big: 'raise' }, handClass: 'open-ender-backdoor-flush' },
      nutted: { hand: ['9s', '7s'], responses: { small: 'raise', big: 'raise' }, handClass: 'made-straight' },
      ambiguous: { hand: ['Ts', '9c'], responses: { small: null, big: null }, handClass: 'second-pair-open-ender', rejection: 'High-EQ pair+draw hand mixes call and raise at meaningful frequency.' },
    },
  },
  {
    board: ['Ks', 'Qs', 'Td'],
    family: 'broadway-connected',
    texture: 'dynamic-broadway',
    scenarios: {
      air: { hand: ['4d', '3c'], responses: { small: 'fold', big: 'fold' }, handClass: 'pure-air' },
      'overcards-bd': { hand: ['Ac', '9c'], responses: { small: 'call', big: 'fold' }, handClass: 'ace-high-gutshot' },
      'weak-pair': { hand: ['9h', '8h'], responses: { small: 'call', big: 'fold' }, handClass: 'bottom-pair-gutter' },
      'strong-top': { hand: ['Kd', 'Jc'], responses: { small: 'call', big: 'call' }, handClass: 'top-pair-open-ender' },
      'strong-equity': { hand: ['Jh', '9h'], responses: { small: 'raise', big: 'raise' }, handClass: 'open-ender-backdoor-flush' },
      nutted: { hand: ['Ac', 'Jd'], responses: { small: 'raise', big: 'raise' }, handClass: 'nut-straight' },
      ambiguous: { hand: ['As', 'Qd'], responses: { small: null, big: null }, handClass: 'second-pair-gutter', rejection: 'Second-pair plus straight potential is too close between call and raise.' },
    },
  },
  {
    board: ['9h', '8d', '7c'],
    family: 'middling-connected',
    texture: 'dynamic-connected',
    scenarios: {
      air: { hand: ['As', '2s'], responses: { small: 'fold', big: 'fold' }, handClass: 'pure-air' },
      'overcards-bd': { hand: ['Kc', 'Qc'], responses: { small: 'call', big: 'fold' }, handClass: 'overcards-gutshot' },
      'weak-pair': { hand: ['8s', '2h'], responses: { small: 'call', big: 'fold' }, handClass: 'middle-pair' },
      'strong-top': { hand: ['9s', 'Td'], responses: { small: 'call', big: 'call' }, handClass: 'top-pair-gutter' },
      'strong-equity': { hand: ['Jc', 'Tc'], responses: { small: 'raise', big: 'raise' }, handClass: 'open-ender-overs' },
      nutted: { hand: ['6s', '5s'], responses: { small: 'raise', big: 'raise' }, handClass: 'made-straight' },
      ambiguous: { hand: ['9c', '6c'], responses: { small: null, big: null }, handClass: 'top-pair-weak-gutter', rejection: 'Top-pair weak-kicker on dynamic board is not cleanly single-action.' },
    },
  },
  {
    board: ['6s', '5h', '4d'],
    family: 'low-connected',
    texture: 'dynamic-connected',
    scenarios: {
      air: { hand: ['Kc', 'Qd'], responses: { small: 'fold', big: 'fold' }, handClass: 'pure-air' },
      'overcards-bd': { hand: ['As', '7c'], responses: { small: 'call', big: 'fold' }, handClass: 'ace-high-gutshot' },
      'weak-pair': { hand: ['5c', '2s'], responses: { small: 'call', big: 'fold' }, handClass: 'middle-pair' },
      'strong-top': { hand: ['6h', '7d'], responses: { small: 'call', big: 'call' }, handClass: 'top-pair-open-ender' },
      'strong-equity': { hand: ['8h', '7h'], responses: { small: 'raise', big: 'raise' }, handClass: 'open-ender-backdoor-flush' },
      nutted: { hand: ['7c', '3c'], responses: { small: 'raise', big: 'raise' }, handClass: 'made-straight' },
      ambiguous: { hand: ['Ah', '5d'], responses: { small: null, big: null }, handClass: 'pair-wheel-gutter', rejection: 'Pair plus wheel potential can be mixed and is excluded for clarity.' },
    },
  },
  {
    board: ['7d', '3s', '2c'],
    family: 'low-disconnected',
    texture: 'dry-low',
    scenarios: {
      air: { hand: ['Kd', 'Qh'], responses: { small: 'fold', big: 'fold' }, handClass: 'pure-air' },
      'overcards-bd': { hand: ['Ac', 'Jc'], responses: { small: 'call', big: 'fold' }, handClass: 'overcards-backdoor' },
      'weak-pair': { hand: ['3h', '4h'], responses: { small: 'call', big: 'fold' }, handClass: 'middle-pair-gutter' },
      'strong-top': { hand: ['7h', '8c'], responses: { small: 'call', big: 'call' }, handClass: 'top-pair' },
      'strong-equity': { hand: ['5h', '4h'], responses: { small: 'call', big: 'fold' }, handClass: 'open-ender-backdoor-flush' },
      nutted: { hand: ['7c', '7s'], responses: { small: 'raise', big: 'raise' }, handClass: 'top-set' },
      ambiguous: { hand: ['As', '7c'], responses: { small: null, big: null }, handClass: 'top-pair-ace-kicker', rejection: 'Thin value/protection incentives versus call-down are close.' },
    },
  },
  {
    board: ['Kc', 'Kd', '5s'],
    family: 'paired-high',
    texture: 'paired',
    scenarios: {
      air: { hand: ['Qh', '2d'], responses: { small: 'fold', big: 'fold' }, handClass: 'pure-air' },
      'overcards-bd': { hand: ['Ah', 'Qh'], responses: { small: 'call', big: 'fold' }, handClass: 'ace-high-backdoor' },
      'weak-pair': { hand: ['5h', '4h'], responses: { small: 'call', big: 'fold' }, handClass: 'underfull-pair' },
      'strong-top': { hand: ['Qs', 'Qd'], responses: { small: 'call', big: 'call' }, handClass: 'showdown-pocket-pair' },
      'strong-equity': { hand: ['Ac', '5c'], responses: { small: 'call', big: 'fold' }, handClass: 'pair-backdoor-flush' },
      nutted: { hand: ['Kh', 'Jd'], responses: { small: 'raise', big: 'raise' }, handClass: 'trip-kings' },
      ambiguous: { hand: ['Ks', 'Qc'], responses: { small: null, big: null }, handClass: 'trip-kings-kicker', rejection: 'Strong trips can mix slowplay and raise frequencies.' },
    },
  },
  {
    board: ['4c', '4h', '9d'],
    family: 'paired-low',
    texture: 'paired',
    scenarios: {
      air: { hand: ['Qs', '2s'], responses: { small: 'fold', big: 'fold' }, handClass: 'pure-air' },
      'overcards-bd': { hand: ['Ac', 'Kc'], responses: { small: 'call', big: 'fold' }, handClass: 'overcards-backdoor' },
      'weak-pair': { hand: ['2h', '2d'], responses: { small: 'call', big: 'fold' }, handClass: 'underpair' },
      'strong-top': { hand: ['9h', '8s'], responses: { small: 'call', big: 'call' }, handClass: 'top-pair' },
      'strong-equity': { hand: ['Ah', '9c'], responses: { small: 'call', big: 'call' }, handClass: 'top-pair-top-kicker' },
      nutted: { hand: ['9c', '9s'], responses: { small: 'raise', big: 'raise' }, handClass: 'full-house' },
      ambiguous: { hand: ['As', '9h'], responses: { small: null, big: null }, handClass: 'top-pair-ace-kicker', rejection: 'Top pair on paired boards has close call/raise EV under simplification.' },
    },
  },
  {
    board: ['Ah', 'Th', '5h'],
    family: 'monotone-high',
    texture: 'monotone',
    scenarios: {
      air: { hand: ['Kd', 'Qc'], responses: { small: 'fold', big: 'fold' }, handClass: 'no-heart-air' },
      'overcards-bd': { hand: ['Ks', 'Qd'], responses: { small: 'call', big: 'fold' }, handClass: 'overs-no-heart' },
      'weak-pair': { hand: ['5d', '4s'], responses: { small: 'call', big: 'fold' }, handClass: 'bottom-pair-no-heart' },
      'strong-top': { hand: ['Ad', 'Qc'], responses: { small: 'call', big: 'call' }, handClass: 'top-pair-no-heart' },
      'strong-equity': { hand: ['Kh', '2h'], responses: { small: 'raise', big: 'raise' }, handClass: 'made-flush' },
      nutted: { hand: ['5c', '5d'], responses: { small: 'raise', big: 'call' }, handClass: 'set-on-monotone' },
      ambiguous: { hand: ['As', 'Jh'], responses: { small: null, big: null }, handClass: 'top-pair-heart-blocker', rejection: 'Top pair plus heart blocker has mixed continue and pressure incentives.' },
    },
  },
  {
    board: ['8c', '5c', '2c'],
    family: 'monotone-low',
    texture: 'monotone',
    scenarios: {
      air: { hand: ['Qh', '3d'], responses: { small: 'fold', big: 'fold' }, handClass: 'no-club-air' },
      'overcards-bd': { hand: ['Ah', 'Kd'], responses: { small: 'call', big: 'fold' }, handClass: 'overs-no-club' },
      'weak-pair': { hand: ['5d', '4s'], responses: { small: 'call', big: 'fold' }, handClass: 'middle-pair-no-club' },
      'strong-top': { hand: ['8h', '7s'], responses: { small: 'call', big: 'call' }, handClass: 'top-pair-no-club' },
      'strong-equity': { hand: ['Ac', 'Kc'], responses: { small: 'raise', big: 'raise' }, handClass: 'nut-flush' },
      nutted: { hand: ['8d', '8s'], responses: { small: 'raise', big: 'call' }, handClass: 'set-on-monotone' },
      ambiguous: { hand: ['As', 'Qc'], responses: { small: null, big: null }, handClass: 'overpair-high-club-blocker', rejection: 'Strong blocker hand can mix aggressive and passive lines.' },
    },
  },
  {
    board: ['Jd', '9d', '6s'],
    family: 'two-tone-dynamic',
    texture: 'dynamic-two-tone',
    scenarios: {
      air: { hand: ['4c', '3h'], responses: { small: 'fold', big: 'fold' }, handClass: 'pure-air' },
      'overcards-bd': { hand: ['As', 'Qc'], responses: { small: 'call', big: 'fold' }, handClass: 'overcards-gutshot' },
      'weak-pair': { hand: ['6h', '5c'], responses: { small: 'call', big: 'fold' }, handClass: 'bottom-pair' },
      'strong-top': { hand: ['Jc', 'Td'], responses: { small: 'call', big: 'call' }, handClass: 'top-pair-open-ender' },
      'strong-equity': { hand: ['Qd', 'Td'], responses: { small: 'raise', big: 'raise' }, handClass: 'combo-draw' },
      nutted: { hand: ['8c', '7c'], responses: { small: 'raise', big: 'raise' }, handClass: 'made-straight' },
      ambiguous: { hand: ['Ad', '9c'], responses: { small: null, big: null }, handClass: 'second-pair-nut-diamond', rejection: 'Second pair with strong flush blocker has mixed call/raise incentives.' },
    },
  },
];

const rationaleByAction = {
  fold: 'Alternative actions are too loose in this simplified baseline.',
  call: 'Calling best preserves realization and avoids over-polarizing.',
  raise: 'Raising cleanly captures value, denial, or fold-equity leverage.',
};

const conflict = (board, hand) => {
  const cards = new Set(board);
  return hand.some((card) => cards.has(card));
};

const all = [];
for (const cfg of boardConfigs) {
  for (const [key, scenario] of Object.entries(cfg.scenarios)) {
    if (conflict(cfg.board, scenario.hand)) {
      throw new Error(`Card collision for ${cfg.family}/${key}: board=${cfg.board.join(' ')} hand=${scenario.hand.join(' ')}`);
    }

    for (const bucket of ['small', 'big']) {
      const response = scenario.responses[bucket];
      const accepted = Boolean(response);
      all.push({
        id: `${spotId}-${cfg.family}-${key}-${bucket}`,
        drillFamily: 'postflop-facing-flop-cbet',
        drillType: 'facing-flop-cbet-hand-level',
        spot: spotId,
        spotLabel: 'BTN vs CO SRP',
        board: cfg.board,
        heroHand: scenario.hand,
        cBetSizeBucket: bucket,
        potSizeBb: 10,
        cBetSizeBb: bucket === 'small' ? 3.3 : 6.6,
        recommendedResponse: response,
        explanation: response ? {
          summary: `${scenario.handClass} on ${cfg.family} prefers ${response} in this baseline. ${bucket === 'small' ? 'Small sizing keeps continue thresholds wider.' : 'Big sizing tightens thresholds and increases polarization.'}`,
          bullets: [
            `Hand class: ${scenario.handClass}`,
            `Texture: ${cfg.family}`,
            rationaleByAction[response],
          ],
          tags: [`family:${cfg.family}`, `hand:${scenario.handClass}`, `size:${bucket}`, `response:${response}`],
        } : null,
        tags: [`family:${cfg.family}`, `texture:${cfg.texture}`, `hand:${scenario.handClass}`, `size:${bucket}`],
        accepted,
        rejectionReason: response ? null : scenario.rejection,
      });
    }
  }
}

const accepted = all.filter((entry) => entry.accepted).map(({ accepted: _a, rejectionReason: _r, ...entry }) => entry);
const outDir = path.join('src/lib/data/postflop-facing-cbet/libraries');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${spotId}.accepted.json`), `${JSON.stringify(accepted, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, `${spotId}.review.json`), `${JSON.stringify(all, null, 2)}\n`);

console.log(`accepted=${accepted.length}, total=${all.length}`);
