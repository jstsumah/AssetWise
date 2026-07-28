import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Capitalizes the first letter of every word. e.g. "HELLO WORLD" → "Hello World" */
export function toTitleCase(value: string): string {
  if (!value) return value;
  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Converts a string to ALL CAPS. e.g. "sn-001" → "SN-001" */
export function toAllCaps(value: string): string {
  return value.toUpperCase();
}

/**
 * Sentence case: capitalizes the first letter of the string, lowercase rest.
 * e.g. "screen has A SCRATCH" → "Screen has a scratch"
 */
export function toSentenceCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/** Creates an onChange handler that applies a formatter and calls the original onChange. */
export function withFormat(
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
  formatter: (value: string) => string
) {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.value = formatter(e.target.value);
    onChange(e);
  };
}
