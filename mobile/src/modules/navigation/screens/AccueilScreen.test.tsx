import { fireEvent, render, screen } from '@testing-library/react-native';
import { pushMock } from '../../../testUtils/expoRouterMocks';
import { AccueilScreen } from './AccueilScreen';

beforeEach(() => {
  pushMock.mockReset();
});

describe('AccueilScreen', () => {
  it('donne accès aux deux univers (joueur et propriétaire/gestionnaire) sans distinction de rôle', () => {
    render(<AccueilScreen />);

    fireEvent.press(screen.getByText(/trouver un terrain/i));
    expect(pushMock).toHaveBeenCalledWith('/recherche');

    fireEvent.press(screen.getByText(/gérer mes annonces/i));
    expect(pushMock).toHaveBeenCalledWith('/mes-annonces');
  });

  it('propose un lien vers mes reversements', () => {
    render(<AccueilScreen />);

    fireEvent.press(screen.getByText(/mes reversements/i));

    expect(pushMock).toHaveBeenCalledWith('/reversements');
  });
});
