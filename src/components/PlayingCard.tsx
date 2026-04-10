import { parseCard } from '../domain/postflop/cards';
import type { Card } from '../domain/postflop/types';
import { cardAriaLabel, isRedSuit, SUIT_SYMBOL } from './cardUtils';

type PlayingCardSize = 'sm' | 'md';

type PlayingCardProps = {
  card: Card | string;
  size?: PlayingCardSize;
  className?: string;
  dimmed?: boolean;
};


export function PlayingCard({ card, size = 'sm', className, dimmed = false }: PlayingCardProps) {
  const parsed = typeof card === 'string' ? parseCard(card) : card;
  const suitSymbol = SUIT_SYMBOL[parsed.suit];
  const redSuit = isRedSuit(parsed.suit);

  return (
    <span
      className={`playing-card playing-card-${size}${redSuit ? ' suit-red' : ' suit-black'}${dimmed ? ' dimmed' : ''}${className ? ` ${className}` : ''}`}
      aria-label={cardAriaLabel(parsed)}
      role="img"
    >
      <span className="playing-card-corner">
        <span className="playing-card-rank">{parsed.rank}</span>
        <span className="playing-card-suit">{suitSymbol}</span>
      </span>
      <span className="playing-card-center" aria-hidden="true">{suitSymbol}</span>
      <span className="playing-card-corner mirrored" aria-hidden="true">
        <span className="playing-card-rank">{parsed.rank}</span>
        <span className="playing-card-suit">{suitSymbol}</span>
      </span>
    </span>
  );
}

type CardRowProps = {
  cards: Array<Card | string>;
  size?: PlayingCardSize;
  className?: string;
  label?: string;
};

export function CardRow({ cards, size = 'sm', className, label }: CardRowProps) {
  return (
    <span className={`card-row${className ? ` ${className}` : ''}`} aria-label={label}>
      {cards.map((card, index) => (
        <PlayingCard key={typeof card === 'string' ? `${card}-${index}` : `${card.rank}${card.suit}-${index}`} card={card} size={size} />
      ))}
    </span>
  );
}
