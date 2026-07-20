import { ChevronsUpDown } from "lucide-react";

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#34C759]" : "bg-black/15 dark:bg-white/20"
      }`}
    >
      <span
        className={`absolute left-0 top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

export function NativeSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className={`relative inline-flex items-center ${disabled ? "opacity-40" : ""}`}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-md border border-black/10 bg-black/[0.04] py-1 pl-2.5 pr-7 text-[12.5px] outline-none disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/[0.08]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronsUpDown size={11} className="pointer-events-none absolute right-2 opacity-40" />
    </div>
  );
}

export function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-lg bg-black/[0.06] p-0.5 dark:bg-white/[0.08]">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 text-[12px] transition-colors ${
            value === o.value
              ? "bg-white shadow-sm dark:bg-white/25"
              : "opacity-60 hover:opacity-90"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
