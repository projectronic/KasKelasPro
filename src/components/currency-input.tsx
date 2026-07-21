"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";

function formatThousands(n: number) {
  return n ? n.toLocaleString("id-ID") : "";
}

/**
 * Rupiah input with "." thousand separators (1.000, bukan 1000) as you type.
 * A native <input type="number"> can't show that formatting at all, so this
 * renders a plain text input for display and submits the raw digits through
 * a paired hidden input under `name` — server actions keep doing
 * Number(formData.get(name)) unchanged.
 */
export function CurrencyInput({
  id,
  name,
  value,
  onValueChange,
  defaultValue = 0,
  required,
  disabled,
  placeholder = "0",
  className,
}: {
  id?: string;
  name: string;
  value?: number;
  onValueChange?: (value: number) => void;
  defaultValue?: number;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = isControlled ? value : internal;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    const num = digits ? Number(digits) : 0;
    if (isControlled) {
      onValueChange?.(num);
    } else {
      setInternal(num);
    }
  }

  return (
    <>
      <input type="hidden" name={name} value={current} />
      <Input
        id={inputId}
        inputMode="numeric"
        value={formatThousands(current)}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
      />
    </>
  );
}
