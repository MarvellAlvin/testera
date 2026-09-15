--- src/utils/formatters.ts (原始)


+++ src/utils/formatters.ts (修改后)
// Formatting utilities
// Follows spec: IDR "Rp150.000", no decimals for IDR

export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  if (currency === 'IDR') {
    const rounded = Math.round(amount);
    if (rounded < 0) {
      return `-Rp${Math.abs(rounded).toLocaleString('id-ID')}`;
    }
    return `Rp${rounded.toLocaleString('id-ID')}`;
  }
  // USD
  return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}jt`;
  }
  if (Math.abs(amount) >= 1000) {
    return `${(amount / 1000).toFixed(0)}rb`;
  }
  return amount.toString();
}

export function formatDate(dateStr: string, lang: 'id' | 'en' = 'id'): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const txDate = new Date(dateStr + 'T00:00:00');
  txDate.setHours(0, 0, 0, 0);

  if (txDate.getTime() === today.getTime()) return lang === 'id' ? 'Hari ini' : 'Today';
  if (txDate.getTime() === yesterday.getTime()) return lang === 'id' ? 'Kemarin' : 'Yesterday';

  const months = lang === 'id'
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}
