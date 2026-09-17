import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

/**
 * AAAA-MM-JJTHH:MM (heure locale, sans fuseau) — format exact attendu par
 * validateCreateCreneauPayload (packages/annonces-core/src/validation.ts, `DATETIME_REGEX`), déjà
 * produit par l'input HTML `datetime-local` côté web. Formaté à partir des accesseurs locaux de
 * `Date` (`getFullYear`/`getHours`...), pas `toISOString()` (UTC, avec secondes et `Z`).
 */
function formatDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * `new Date("AAAA-MM-JJTHH:MM")` (sans fuseau) est interprété comme une heure locale par le
 * moteur JS — cohérent avec le parsing déjà fait dans validation.ts
 * (`new Date(payload.fin) <= new Date(payload.debut)`), pas une nouvelle hypothèse introduite ici.
 */
function parseDatetimeLocal(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export interface DateTimePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * US-05 (module Annonces & Créneaux) : remplace la saisie en texte libre par un vrai sélecteur
 * natif (@react-native-community/datetimepicker) pour "Début"/"Fin" d'un créneau — équivalent
 * mobile de l'input HTML `datetime-local` déjà utilisé côté web (CreneauxManager, aucun changement
 * nécessaire de ce côté). Le contrat de données (AAAA-MM-JJTHH:MM, packages/annonces-core) reste
 * inchangé : seule l'UI de saisie change, la validation/l'appel API ignorent totalement comment la
 * chaîne a été produite.
 *
 * Android n'a pas de mode "datetime" combiné (contrairement à iOS) : le sélecteur natif ne montre
 * que la date OU l'heure à la fois, via une boîte de dialogue qui se referme seule à chaque choix
 * — deux étapes séquentielles enchaînées automatiquement (date puis heure), la valeur finale
 * n'étant reconstruite qu'une fois les deux connues. iOS combine les deux dans un seul spinner
 * (`mode="datetime"`), qui reste affiché tant que l'utilisateur n'a pas validé (pas d'auto-fermeture
 * native pour ce mode d'affichage) — d'où le bouton "Valider" affiché uniquement sur iOS.
 */
export function DateTimePickerField({ label, value, onChange, error }: DateTimePickerFieldProps) {
  const [visible, setVisible] = useState(false);
  const [androidStep, setAndroidStep] = useState<'date' | 'time'>('date');
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  const current = parseDatetimeLocal(value);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setVisible(false);

      if (event.type !== 'set' || !selected) {
        setAndroidStep('date');
        setPendingDate(null);
        return;
      }

      if (androidStep === 'date') {
        // Étape 1/2 : la date est choisie, on enchaîne immédiatement sur l'heure — l'utilisateur
        // ne voit jamais un état intermédiaire incomplet (`onChange` du champ n'est appelé qu'une
        // fois les deux connues).
        setPendingDate(selected);
        setAndroidStep('time');
        setVisible(true);
        return;
      }

      // Étape 2/2 : combine la date choisie à l'étape 1 avec l'heure choisie ici.
      const combined = new Date(pendingDate ?? current);
      combined.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      onChange(formatDatetimeLocal(combined));
      setAndroidStep('date');
      setPendingDate(null);
      return;
    }

    // iOS : mode "datetime" unique, la valeur finale arrive directement à chaque défilement du
    // spinner — appliquée en direct, le bouton "Valider" ne fait que refermer le sélecteur.
    if (selected) onChange(formatDatetimeLocal(selected));
  };

  return (
    <View className="gap-1">
      <Text className="text-sm font-medium">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => {
          setAndroidStep('date');
          setVisible(true);
        }}
        className="rounded border border-gray-300 px-3 py-2"
      >
        <Text>{formatDatetimeLocal(current)}</Text>
      </Pressable>
      {error && <Text className="text-sm text-red-600">{error}</Text>}
      {visible && (
        <View>
          <DateTimePicker
            value={androidStep === 'time' && pendingDate ? pendingDate : current}
            mode={Platform.OS === 'ios' ? 'datetime' : androidStep}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Valider la date"
              onPress={() => setVisible(false)}
              className="mt-1 self-end rounded bg-blue-600 px-3 py-1"
            >
              <Text className="text-sm text-white">Valider</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
