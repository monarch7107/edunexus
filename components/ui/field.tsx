"use client";
import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useState,
} from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const FieldContext = createContext<{
  describedBy?: string;
  required?: boolean;
}>({});
export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  let hasError = false;
  const contents = Children.map(children, (child) => {
    if (
      isValidElement<{ className?: string; id?: string; role?: string }>(
        child,
      ) &&
      child.type === "p" &&
      child.props.className?.includes("text-red")
    ) {
      hasError = true;
      return cloneElement(child, {
        id: htmlFor ? `${htmlFor}-error` : undefined,
        role: "alert",
      });
    }
    return child;
  });
  const describedBy =
    [
      hint && htmlFor ? `${htmlFor}-hint` : "",
      hasError && htmlFor ? `${htmlFor}-error` : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <FieldContext.Provider value={{ describedBy, required }}>
      <div className={cn("space-y-2", className)}>
        {label &&
          (htmlFor ? (
            <label
              htmlFor={htmlFor}
              className="block text-xs font-semibold text-slate-700"
            >
              {label}
              {required && (
                <span className="ml-1 text-brand-600" aria-hidden>
                  *
                </span>
              )}
            </label>
          ) : (
            <span className="block text-xs font-semibold text-slate-700">
              {label}
            </span>
          ))}
        {contents}
        {hint && (
          <p
            id={htmlFor ? `${htmlFor}-hint` : undefined}
            className="text-xs leading-relaxed text-muted"
          >
            {hint}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    const field = useContext(FieldContext);
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        aria-describedby={field.describedBy}
        required={field.required}
        className={cn("input-base", className)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  const field = useContext(FieldContext);
  return (
    <textarea
      ref={ref}
      aria-describedby={field.describedBy}
      required={field.required}
      className={cn("input-base min-h-[100px] resize-y", className)}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => {
    const field = useContext(FieldContext);
    return (
      <div className="relative min-w-0">
        <select
          ref={ref}
          aria-describedby={field.describedBy}
          required={field.required}
          className={cn("input-base appearance-none pr-9", className)}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
      </div>
    );
  },
);
Select.displayName = "Select";
export function PasswordInput(props: Omit<InputProps, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-12", props.className)}
      />
      <button
        type="button"
        className="icon-button absolute right-1 top-1/2 -translate-y-1/2"
        aria-controls={props.id}
        aria-label={`${visible ? "Hide" : "Show"} ${props.id?.includes("confirm") ? "password confirmation" : "password"}`}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
