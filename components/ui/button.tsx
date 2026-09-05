import { forwardRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingLabel?: string;
}
const variants: Record<Variant, string> = {
  primary:
    "border border-transparent bg-brand-600 text-on-accent shadow-sm hover:bg-brand-700 hover:shadow-lifted",
  secondary: "border border-transparent bg-ink text-surface hover:opacity-90",
  ghost:
    "border border-transparent text-slate-600 hover:bg-slate-100 hover:text-ink",
  danger: "border border-transparent bg-red-600 text-surface hover:opacity-90",
  outline:
    "border border-slate-300 bg-surface text-slate-700 shadow-sm hover:border-brand-300 hover:bg-slate-50",
};
const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 text-xs gap-1.5",
  md: "min-h-10 px-4 py-2 text-[13px] gap-2",
  lg: "min-h-12 px-5 py-3 text-sm gap-2.5",
  icon: "h-10 w-10 shrink-0",
};
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "btn inline-flex items-center justify-center rounded-lg font-semibold leading-snug disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading,
      loadingLabel,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      )}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  ),
);
Button.displayName = "Button";

export function ButtonLink({
  href,
  children,
  variant,
  size,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {children}
    </Link>
  );
}
