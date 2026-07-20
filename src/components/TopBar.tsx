export function TopBar({ title }: { title: string }) {
  return (
    <div
      data-tauri-drag-region
      className="flex h-11 shrink-0 items-center justify-center border-b border-black/10 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#1e1e1e]/80"
    >
      <h1 className="text-[13px] font-semibold">{title}</h1>
    </div>
  );
}
