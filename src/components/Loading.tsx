import { Loader2 } from "lucide-react";

export function TableLoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td className="px-3 py-6 text-center opacity-40" colSpan={colSpan}>
        <Loader2 size={16} className="mx-auto animate-spin" />
      </td>
    </tr>
  );
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center px-4 py-6 opacity-40">
      <Loader2 size={16} className="animate-spin" />
    </div>
  );
}
