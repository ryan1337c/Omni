export function getBorderClasses(hasError: boolean) {
  return hasError
    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
    : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500";
}

export function clampCount(value: number | string, min: number, max: number) {
  let val = Number(value);
  if (val < min) val = min;
  if (val > max) val = max;
  return val;
}
