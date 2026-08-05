import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { RatingMeter } from './RatingMeter';
import { RATING_MAX, type Rating } from '../data/library';
import { renderWithLocale } from '../test-utils';

const RATINGS: Rating[] = [1, 2, 3, 4, 5];

describe('RatingMeter', () => {
  it('always draws the whole scale, whatever the rating', () => {
    for (const rating of RATINGS) {
      const { container, unmount } = renderWithLocale(<RatingMeter rating={rating} />);
      expect(container.querySelectorAll('[data-testid="rating-meter"] > span')).toHaveLength(RATING_MAX);
      unmount();
    }
  });

  // The property the component exists for. Asserted by COUNTING the filled squares rather than by
  // reading the label — a meter whose label says 4 and whose squares say 2 is exactly the defect a
  // label-only assertion cannot see, and the label is checked separately below.
  it('fills exactly `rating` squares and leaves the rest muted', () => {
    for (const rating of RATINGS) {
      const { container, unmount } = renderWithLocale(<RatingMeter rating={rating} />);
      const squares = [...container.querySelectorAll('[data-testid="rating-meter"] > span')];
      const filled = squares.filter((s) => s.className.includes('bg-foreground'));
      const muted = squares.filter((s) => s.className.includes('bg-border'));
      expect(filled, `rating ${rating} must fill ${rating} squares`).toHaveLength(rating);
      expect(muted, `rating ${rating} must leave ${RATING_MAX - rating} muted`).toHaveLength(RATING_MAX - rating);
      unmount();
    }
  });

  // Not a decorative span: a sighted reader gets the rating from the fill, and this is the only way
  // anyone else does. `role="img"` + a name is the same contract `LevelMeter` uses on /me.
  it('exposes the rating to assistive tech as a named image', () => {
    renderWithLocale(<RatingMeter rating={4} />);
    const meter = screen.getByRole('img');
    expect(meter).toHaveAccessibleName('Nota 4 de 5');
  });

  // THE DEFECT NOT COPIED FROM `LevelMeter`, whose label is a hardcoded English literal. Asserted in
  // both editions, and each assertion also checks the OTHER locale's wording is absent — a fallback
  // rendering English under a pt provider would pass a laxer check.
  it('announces the rating in the reader’s language, not in English regardless', () => {
    const pt = renderWithLocale(<RatingMeter rating={3} />, { locale: 'pt' });
    expect(screen.getByRole('img')).toHaveAccessibleName('Nota 3 de 5');
    expect(screen.getByRole('img')).not.toHaveAccessibleName(/Rated/);
    pt.unmount();

    renderWithLocale(<RatingMeter rating={3} />, { locale: 'en' });
    expect(screen.getByRole('img')).toHaveAccessibleName('Rated 3 out of 5');
    expect(screen.getByRole('img')).not.toHaveAccessibleName(/Nota/);
  });

  // Both placeholders are substituted. Without this, a catalog entry that lost `{max}` would ship the
  // literal token into a screen reader — invisible on screen, and only the one reader who cannot check
  // would meet it.
  it('leaves no unsubstituted placeholder in the label', () => {
    renderWithLocale(<RatingMeter rating={2} />);
    const name = screen.getByRole('img').getAttribute('aria-label') ?? '';
    expect(name).not.toMatch(/[{}]/);
  });
});
