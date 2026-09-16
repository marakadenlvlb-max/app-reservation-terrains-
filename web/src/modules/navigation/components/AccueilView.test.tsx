import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccueilView } from './AccueilView';

describe('AccueilView', () => {
  it('donne accès aux deux univers (joueur et propriétaire/gestionnaire) sans distinction de rôle', () => {
    render(<AccueilView />);

    expect(screen.getByRole('link', { name: /trouver un terrain/i })).toHaveAttribute('href', '/recherche');
    expect(screen.getByRole('link', { name: /gérer mes annonces/i })).toHaveAttribute('href', '/mes-annonces');
  });
});
