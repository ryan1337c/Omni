export default function AppLoading() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div
        role="status"
        aria-label="Loading"
        className="size-8 animate-spin rounded-full border-2 border-violet-500/25 border-t-violet-500 motion-reduce:animate-none dark:border-indigo-400/25 dark:border-t-indigo-400"
      />
    </div>
  );
}