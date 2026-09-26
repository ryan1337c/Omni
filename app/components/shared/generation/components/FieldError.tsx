import { AlertTriangle } from "lucide-react";

export default function FieldError({ message }: { message: string }) {
  return (
    <p className="text-xs text-red-500 font-medium animate-fade-in-sm flex items-center gap-1">
      <AlertTriangle size={12} /> {message}
    </p>
  );
}
