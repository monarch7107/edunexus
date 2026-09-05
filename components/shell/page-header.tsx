export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
        <h1 className="font-display text-[27px] font-bold leading-tight tracking-[-.045em] text-ink sm:text-[32px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex max-w-full flex-wrap items-center gap-2">
          {action}
        </div>
      )}
    </header>
  );
}
