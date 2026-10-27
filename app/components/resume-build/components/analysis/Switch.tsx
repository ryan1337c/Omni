type SwitchTone = 'sky' | 'amber';

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name; omit when a wrapping `<label>` names the switch. */
  label?: string;
  /** Track color when on. Default sky; amber matches the Required callout. */
  tone?: SwitchTone;
};

const TONE_CLASS: Record<SwitchTone, { on: string; hover: string }> = {
  sky: {
    on: 'bg-sky-600 dark:bg-sky-500',
    hover: 'hover:ring-sky-500 dark:hover:ring-offset-slate-800',
  },
  amber: {
    on: 'bg-yellow-500 dark:bg-yellow-400',
    hover: 'hover:ring-yellow-500 hover:ring-offset-yellow-50 dark:hover:ring-offset-yellow-950',
  },
};

export default function Switch({ checked, onChange, label, tone = 'sky' }: SwitchProps) {
  const { on, hover } = TONE_CLASS[tone];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none hover:ring-1 hover:ring-offset-2 ${hover} ${
        checked ? on : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
