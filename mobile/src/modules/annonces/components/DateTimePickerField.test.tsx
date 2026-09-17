import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DateTimePickerField } from './DateTimePickerField';

// Même mock que CreneauxScreen.test.tsx (US-05) — voir son commentaire pour le détail.
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: { onChange: (event: { type: string }, date?: Date) => void }) => (
      <View testID="mock-datetimepicker" onChange={props.onChange} />
    ),
  };
});

describe('DateTimePickerField', () => {
  it('affiche la valeur initiale formatée et masque le sélecteur tant que le champ n\'est pas pressé', async () => {
    await render(<DateTimePickerField label="Début" value="2026-09-01T18:00" onChange={jest.fn()} />);

    expect(screen.getByText('2026-09-01T18:00')).toBeTruthy();
    expect(screen.queryByTestId('mock-datetimepicker')).toBeNull();
  });

  it('affiche une erreur de validation quand elle est fournie', async () => {
    await render(<DateTimePickerField label="Début" value="2026-09-01T18:00" onChange={jest.fn()} error="Date invalide" />);

    expect(screen.getByText('Date invalide')).toBeTruthy();
  });

  describe('sur iOS (mode "datetime" combiné)', () => {
    const platformOsOriginal = Platform.OS;
    beforeEach(() => {
      Platform.OS = 'ios';
    });
    afterAll(() => {
      Platform.OS = platformOsOriginal;
    });

    it('met à jour la valeur au premier changement puis referme au clic sur "Valider"', async () => {
      const onChange = jest.fn();
      await render(<DateTimePickerField label="Début" value="2026-09-01T18:00" onChange={onChange} />);

      await fireEvent.press(screen.getByLabelText('Début'));
      expect(screen.getByTestId('mock-datetimepicker')).toBeTruthy();

      await fireEvent(screen.getByTestId('mock-datetimepicker'), 'change', { type: 'set' }, new Date(2026, 8, 2, 10, 30));

      expect(onChange).toHaveBeenCalledWith('2026-09-02T10:30');

      await fireEvent.press(screen.getByLabelText('Valider la date'));
      expect(screen.queryByTestId('mock-datetimepicker')).toBeNull();
    });
  });

  describe('sur Android (date puis heure, deux boîtes de dialogue séquentielles)', () => {
    const platformOsOriginal = Platform.OS;
    beforeEach(() => {
      Platform.OS = 'android';
    });
    afterAll(() => {
      Platform.OS = platformOsOriginal;
    });

    it("n'appelle onChange qu'une fois la date ET l'heure choisies", async () => {
      const onChange = jest.fn();
      await render(<DateTimePickerField label="Début" value="2026-09-01T18:00" onChange={onChange} />);

      await fireEvent.press(screen.getByLabelText('Début'));
      // Étape 1/2 : date seule choisie — pas encore de valeur finale, pas de bouton "Valider"
      // (spécifique à iOS), et le sélecteur reste ouvert pour l'étape heure.
      await fireEvent(screen.getByTestId('mock-datetimepicker'), 'change', { type: 'set' }, new Date(2026, 8, 2, 0, 0));
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.queryByLabelText('Valider la date')).toBeNull();
      expect(screen.getByTestId('mock-datetimepicker')).toBeTruthy();

      // Étape 2/2 : heure choisie — combine avec la date de l'étape 1.
      await fireEvent(screen.getByTestId('mock-datetimepicker'), 'change', { type: 'set' }, new Date(2000, 0, 1, 14, 45));

      expect(onChange).toHaveBeenCalledWith('2026-09-02T14:45');
      expect(screen.queryByTestId('mock-datetimepicker')).toBeNull();
    });

    it("n'appelle jamais onChange si l'utilisateur annule la boîte de dialogue", async () => {
      const onChange = jest.fn();
      await render(<DateTimePickerField label="Début" value="2026-09-01T18:00" onChange={onChange} />);

      await fireEvent.press(screen.getByLabelText('Début'));
      await fireEvent(screen.getByTestId('mock-datetimepicker'), 'change', { type: 'dismissed' }, undefined);

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.queryByTestId('mock-datetimepicker')).toBeNull();
    });
  });
});
