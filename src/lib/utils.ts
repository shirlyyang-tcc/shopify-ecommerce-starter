import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(
  price: number | string,
  currencyCode: string = "USD",
  locale: string = "en-US"
): string {
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numericPrice)) {
    return "Invalid price";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2, // Ensure two decimal places
    maximumFractionDigits: 2, // Ensure two decimal places
  }).format(numericPrice);
}
