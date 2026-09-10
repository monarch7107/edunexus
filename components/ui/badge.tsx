import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
  variant = "default",
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "destructive";
}) {
  const styles = { default: "bg-brand-100 text-brand-800", secondary: "bg-slate-100 text-slate-700", outline: "border border-line text-muted", destructive: "bg-red-100 text-red-700" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        styles[variant || "default"],
        className,
      )}
    >
      {children}
    </span>
  );
}
