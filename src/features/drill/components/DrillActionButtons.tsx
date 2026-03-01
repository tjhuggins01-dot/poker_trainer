import type { DrillAction } from '../../../lib/types';

type Props = {
  hasPolicy: boolean;
  isFacingOpen: boolean;
  isThreeBet: boolean;
  isLimpIso: boolean;
  isVsIso: boolean;
  heroPos: string;
  onAnswer: (action: DrillAction) => void;
};

export function DrillActionButtons({ hasPolicy, isFacingOpen, isThreeBet, isLimpIso, isVsIso, heroPos, onAnswer }: Props) {
  return (
    <div className="actions">
      {!hasPolicy ? (
        <p className="muted">No range data for this format/stack spot yet.</p>
      ) : isFacingOpen || isThreeBet ? (
        <>
          <button className="fold" onClick={() => onAnswer('FOLD')}>FOLD</button>
          <button className="open" onClick={() => onAnswer('CALL')}>CALL</button>
          <button className="primary" onClick={() => onAnswer(isThreeBet ? '4BET' : '3BET')}>
            {isThreeBet ? '4BET' : '3BET'}
          </button>
        </>
      ) : isLimpIso ? (
        <>
          <button className="open" onClick={() => onAnswer('CHECK')}>CHECK</button>
          <button className="primary" onClick={() => onAnswer('ISO')}>ISO</button>
        </>
      ) : isVsIso ? (
        <>
          <button className="fold" onClick={() => onAnswer('FOLD')}>FOLD</button>
          <button className="open" onClick={() => onAnswer('CALL')}>CALL</button>
          <button className="primary" onClick={() => onAnswer('3BET')}>3BET</button>
        </>
      ) : (
        <>
          <button className="open" onClick={() => onAnswer('RAISE')}>RAISE</button>
          {heroPos === 'SB' && <button className="primary" onClick={() => onAnswer('LIMP')}>LIMP</button>}
          <button className="fold" onClick={() => onAnswer('FOLD')}>FOLD</button>
        </>
      )}
    </div>
  );
}
