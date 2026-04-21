"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon } from "@/components/icons";

export type DropdownOption<T extends string = string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
};

type Props<T extends string> = {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  align?: "start" | "end";
};

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Selectează",
  label,
  hint,
  error,
  disabled,
  className,
  buttonClassName,
  align = "start",
}: Props<T>) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = rect.width;
    const left = align === "end" ? rect.right - width : rect.left;
    setCoords({
      top: rect.bottom + window.scrollY + 4,
      left: left + window.scrollX,
      width,
    });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleSelect = (option: DropdownOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      {label && (
        <label htmlFor={id} className="text-text-secondary text-sm font-medium">
          {label}
        </label>
      )}
      <button
        id={id}
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex h-10 items-center justify-between gap-2 rounded-xs border px-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
          error
            ? "border-danger text-foreground"
            : "border-border bg-surface-elevated text-foreground hover:border-primary focus:border-primary focus:outline-none"
        } ${buttonClassName ?? ""}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {selected?.icon}
          <span className={`truncate ${selected ? "" : "text-text-muted"}`}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDownIcon
          className={`text-text-muted h-4 w-4 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {error ? (
        <p className="text-danger text-xs">{error}</p>
      ) : hint ? (
        <p className="text-text-muted text-xs">{hint}</p>
      ) : null}

      {mounted && open
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              style={{ top: coords.top, left: coords.left, minWidth: coords.width }}
              className="border-border bg-surface-elevated animate-fade-in absolute z-50 max-h-72 overflow-y-auto rounded-xs border py-1 shadow-lg"
            >
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={option.disabled}
                    onClick={() => handleSelect(option)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                      active
                        ? "bg-primary-50 text-primary-700"
                        : "text-foreground hover:bg-surface-muted"
                    } ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    {option.icon}
                    <span className="flex-1">
                      <span className="block">{option.label}</span>
                      {option.description && (
                        <span className="text-text-muted block text-xs">{option.description}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
