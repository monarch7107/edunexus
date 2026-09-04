import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("card p-4 sm:p-5", className)}>{children}</div>;
}

export function CardHeader({
  title,
  action,
  icon,
}: {
  title: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        {icon}
        {title}
      </h3>
      {action}
    </div>
  );
}
