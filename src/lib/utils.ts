import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SIGNER_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', fill: '#3b82f6' },
  { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', fill: '#22c55e' },
  { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-700', fill: '#a855f7' },
  { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', fill: '#f97316' },
  { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-700', fill: '#ec4899' },
  { bg: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-700', fill: '#06b6d4' },
];

export function getSignerColor(index: number) {
  return SIGNER_COLORS[index % SIGNER_COLORS.length];
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
