import { InputHTMLAttributes, ReactNode, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, trailing, className = "", ...rest }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>}
        <div
          className={`flex items-center gap-2 h-12 px-4 rounded-xl border bg-card ${
            error ? "border-danger" : "border-ink/10 focus-within:border-nexzee"
          } transition-colors`}
        >
          {icon && <span className="text-ink-faint shrink-0">{icon}</span>}
          <input
            ref={ref}
            className={`flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-faint ${className}`}
            {...rest}
          />
          {trailing}
        </div>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
