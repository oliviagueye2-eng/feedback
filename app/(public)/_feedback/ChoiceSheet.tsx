import styles from "./screen.module.css";

/**
 * One white sheet, one line per choice, separated by faint rules (« feuille
 * légère », as on the topics screen). Real radio buttons: the whole line is
 * the touch target; the chosen one gets the green tint and a green check.
 * With `value` and `onPick`, the choice is held by the caller.
 */
export function ChoiceSheet({
  name,
  choices,
  checked,
  required,
  value,
  onPick,
}: {
  name: string;
  choices: { value: string; label: string }[];
  checked?: string;
  required?: boolean;
  value?: string;
  onPick?: (value: string) => void;
}) {
  return (
    <div className={styles.choiceSheet}>
      {choices.map((choice) => (
        <label key={choice.value} className={styles.choice}>
          <input
            type="radio"
            name={name}
            value={choice.value}
            required={required}
            {...(onPick
              ? { checked: value === choice.value, onChange: () => onPick(choice.value) }
              : { defaultChecked: checked === choice.value })}
          />
          <span>{choice.label}</span>
          <span className={styles.choiceMark} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-10" />
            </svg>
          </span>
        </label>
      ))}
    </div>
  );
}
