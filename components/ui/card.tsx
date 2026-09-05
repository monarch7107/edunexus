import { cn } from "@/lib/utils";
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card p-5 sm:p-6", className)} {...props}>
      {children}
    </div>
  );
}
export function CardHeader({
  title,
  action,
  icon,
  description,
}: {
  title: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="section-title flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
