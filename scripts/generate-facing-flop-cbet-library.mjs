import fs from 'node:fs';
import path from 'node:path';

const spotId = 'cash9max-100-btn-vs-co-srp-flop-ip-facing-cbet';

const boards = [
  { board: ['As', '8d', '3c'], family: 'a-high-dry', texture: 'dry-high' },
  { board: ['Kh', '7c', '2d'], family: 'k-high-dry', texture: 'dry-high' },
  { board: ['Qh', 'Jd', '8c'], family: 'qj-high-dynamic', texture: 'dynamic-broadway' },
  { board: ['Ks', 'Qs', 'Td'], family: 'broadway-connected', texture: 'dynamic-broadway' },
  { board: ['9h', '8d', '7c'], family: 'middling-connected', texture: 'dynamic-connected' },
  { board: ['6s', '5h', '4d'], family: 'low-connected', texture: 'dynamic-connected' },
  { board: ['7d', '3s', '2c'], family: 'low-disconnected', texture: 'dry-low' },
  { board: ['Kc', 'Kd', '5s'], family: 'paired-high', texture: 'paired' },
  { board: ['4c', '4h', '9d'], family: 'paired-low', texture: 'paired' },
  { board: ['Ah', 'Th', '5h'], family: 'monotone-high', texture: 'monotone' },
  { board: ['8c', '5c', '2c'], family: 'monotone-low', texture: 'monotone' },
  { board: ['Jd', '9d', '6s'], family: 'two-tone-dynamic', texture: 'dynamic-two-tone' },
];

const boardScenarioMap = {
  'a-high-dry': {
    strongEquityHand: ['5s', '4s'],
    strongEquityResponses: { small: 'call', big: 'fold' },
  },
  'k-high-dry': {
    strongEquityHand: ['Qs', 'Js'],
    strongEquityResponses: { small: 'call', big: 'fold' },
  },
  'qj-high-dynamic': {
    strongEquityHand: ['Th', '9h'],
    strongEquityResponses: { small: 'raise', big: 'raise' },
  },
  'broadway-connected': {
    strongEquityHand: ['Ah', 'Jh'],
    strongEquityResponses: { small: 'raise', big: 'raise' },
  },
  'middling-connected': {
    strongEquityHand: ['6h', '5h'],
    strongEquityResponses: { small: 'raise', big: 'raise' },
  },
  'low-connected': {
    strongEquityHand: ['7h', '3h'],
    strongEquityResponses: { small: 'raise', big: 'raise' },
  },
  'low-disconnected': {
    strongEquityHand: ['6h', '5h'],
    strongEquityResponses: { small: 'call', big: 'fold' },
  },
  'paired-high': {
    strongEquityHand: ['Ah', 'Qh'],
    strongEquityResponses: { small: 'call', big: 'fold' },
  },
  'paired-low': {
    strongEquityHand: ['Ah', '9h'],
    strongEquityResponses: { small: 'call', big: 'call' },
  },
  'monotone-high': {
    strongEquityHand: ['Kh', 'Qh'],
    strongEquityResponses: { small: 'raise', big: 'raise' },
  },
  'monotone-low': {
    strongEquityHand: ['Ac', 'Kc'],
    strongEquityResponses: { small: 'raise', big: 'raise' },
  },
  'two-tone-dynamic': {
    strongEquityHand: ['Qd', 'Td'],
    strongEquityResponses: { small: 'raise', big: 'raise' },
  },
};

const buildScenarios = (family) => {
  const dynamic = boardScenarioMap[family];
  return [
    {
      key: 'air',
      hand: ['Qd', '4s'],
      handClass: 'pure-air',
      responses: { small: 'fold', big: 'fold' },
      why: 'Pure air with poor backdoors fails minimum continue criteria in the simplified baseline.',
    },
    {
      key: 'overcards-bd',
      hand: ['Ac', '7h'],
      handClass: 'overcards-backdoor',
      responses: { small: 'call', big: 'fold' },
      why: 'Ace-high and backdoor potential can defend small sizing, but big sizing overpressures realization.',
    },
    {
      key: 'weak-pair',
      hand: ['8h', '7s'],
      handClass: 'weak-pair',
      responses: { small: 'call', big: 'fold' },
      why: 'Weak pair strength realizes acceptably versus small bets but usually falls below continue threshold versus big bets.',
    },
    {
      key: 'strong-top',
      hand: ['Ad', 'Jc'],
      handClass: 'strong-top-pair',
      responses: { small: 'call', big: 'call' },
      why: 'Strong one-pair hands mostly prefer calling to realize and bluff-catch without over-polarizing.',
    },
    {
      key: 'strong-equity',
      hand: dynamic.strongEquityHand,
      handClass: 'strong-equity-draw',
      responses: dynamic.strongEquityResponses,
      why: 'High-equity draw structures can pressure folds and deny equity on volatile textures, while calmer textures prefer realization.',
    },
    {
      key: 'nutted',
      hand: ['3h', '3d'],
      handClass: 'nutted-made-hand',
      responses: { small: 'raise', big: 'raise' },
      why: 'Nutted value cleanly raises to build pots and punish continuing ranges.',
    },
    {
      key: 'ambiguous',
      hand: ['Jc', 'Tc'],
      handClass: 'marginal-draw',
      responses: { small: null, big: null },
      rejection: 'Close fold/call or call/raise tradeoff; excluded to keep one clear best simplified action.',
    },
  ];
};

const conflict = (board, hand) => {
  const cards = new Set(board);
  return hand.some((card) => cards.has(card));
};

const all = [];
for (const item of boards) {
  const scenarios = buildScenarios(item.family);
  for (const scenario of scenarios) {
    if (conflict(item.board, scenario.hand)) {
      throw new Error(`Card collision for ${item.family}/${scenario.key}: board=${item.board.join(' ')} hand=${scenario.hand.join(' ')}`);
    }
    for (const bucket of ['small', 'big']) {
      const response = scenario.responses[bucket];
      const accepted = Boolean(response);
      all.push({
        id: `${spotId}-${item.family}-${scenario.key}-${bucket}`,
        drillFamily: 'postflop-facing-flop-cbet',
        drillType: 'facing-flop-cbet-hand-level',
        spot: spotId,
        spotLabel: 'BTN vs CO SRP',
        board: item.board,
        heroHand: scenario.hand,
        cBetSizeBucket: bucket,
        potSizeBb: 10,
        cBetSizeBb: bucket === 'small' ? 3.3 : 6.6,
        recommendedResponse: response,
        explanation: response ? {
          summary: `${scenario.why} ${bucket === 'small' ? 'Small sizing keeps continues wider.' : 'Big sizing tightens thresholds and polarizes responses.'}`,
          bullets: [
            `Hand class: ${scenario.handClass}`,
            `Texture: ${item.family}`,
            response === 'fold'
              ? 'Alternative actions are too loose in this baseline.'
              : response === 'call'
                ? 'Calling protects realization and avoids forcing marginal raises.'
                : 'Raising leverages value or fold equity cleanly in this baseline.',
          ],
          tags: [`family:${item.family}`, `hand:${scenario.handClass}`, `size:${bucket}`, `response:${response}`],
        } : null,
        tags: [`family:${item.family}`, `texture:${item.texture}`, `hand:${scenario.handClass}`, `size:${bucket}`],
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
