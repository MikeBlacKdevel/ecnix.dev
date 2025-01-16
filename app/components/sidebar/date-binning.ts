import { format, isAfter, isThisWeek, isThisYear, isToday, isYesterday, subDays } from 'date-fns';
import { es } from 'date-fns/locale'; // Importa el idioma español
import type { ChatHistoryItem } from '~/lib/persistence';

type Bin = { category: string; items: ChatHistoryItem[] };

export function binDates(_list: ChatHistoryItem[]) {
  const list = _list.toSorted((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  const binLookup: Record<string, Bin> = {};
  const bins: Array<Bin> = [];

  list.forEach((item) => {
    const category = dateCategory(new Date(item.timestamp));

    if (!(category in binLookup)) {
      const bin = {
        category,
        items: [item],
      };

      binLookup[category] = bin;

      bins.push(bin);
    } else {
      binLookup[category].items.push(item);
    }
  });

  return bins;
}

function dateCategory(date: Date) {
  if (isToday(date)) {
    return 'Hoy';
  }

  if (isYesterday(date)) {
    return 'Ayer';
  }

  if (isThisWeek(date)) {
    // e.g., "Lunes"
    return format(date, 'eeee', { locale: es });
  }

  const thirtyDaysAgo = subDays(new Date(), 30);

  if (isAfter(date, thirtyDaysAgo)) {
    return 'Últimos 30 días';
  }

  if (isThisYear(date)) {
    // e.g., "Julio"
    return format(date, 'MMMM', { locale: es });
  }

  // e.g., "Julio 2023"
  return format(date, 'MMMM yyyy', { locale: es });
}
