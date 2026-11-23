import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, daysInMonth, mondayFirstWeekday, parseISODate, toISODate, type ISODate } from '@/lib/dates';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';
import { MONTHS_LONG } from '@/lib/format';

export interface DateRange {
  checkIn: ISODate | null;
  checkOut: ISODate | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  // First date that can be booked (today).
  minDate: ISODate;
  // Last date that can be picked.
  maxDate: ISODate;
  // Nights that are already taken (a stay occupies [check-in, check-out) so check-out may be a taken night).
  blockedNights: ReadonlySet<ISODate>;
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MAX_STAY_SCAN = 400;

// The latest check-out for a stay that starts on `checkIn`: the first taken night on/after it.
function lastCheckOut(checkIn: ISODate, blocked: ReadonlySet<ISODate>, maxDate: ISODate): ISODate {
  let day = checkIn;
  for (let index = 0; index < MAX_STAY_SCAN && day < maxDate; index += 1) {
    if (blocked.has(day)) return day;
    day = addDays(day, 1);
  }
  return maxDate;
}

export function DateRangePicker({ value, onChange, minDate, maxDate, blockedNights }: DateRangePickerProps) {
  const anchor = parseISODate(value.checkIn ?? minDate) ?? parseISODate(minDate);
  const [visible, setVisible] = useState(() => ({ year: anchor?.year ?? 2026, month: anchor?.month ?? 1 }));

  const min = parseISODate(minDate);
  const max = parseISODate(maxDate);
  const canGoPrevious = !!min && (visible.year > min.year || (visible.year === min.year && visible.month > min.month));
  const canGoNext = !!max && (visible.year < max.year || (visible.year === max.year && visible.month < max.month));

  const choosingCheckOut = value.checkIn !== null && value.checkOut === null;
  const limit = useMemo(
    () => (value.checkIn ? lastCheckOut(value.checkIn, blockedNights, maxDate) : null),
    [value.checkIn, blockedNights, maxDate],
  );

  const canStartOn = (date: ISODate) => date >= minDate && date <= maxDate && !blockedNights.has(date);
  const canEndOn = (date: ISODate) =>
    choosingCheckOut && value.checkIn !== null && limit !== null && date > value.checkIn && date <= limit;

  const handlePress = (date: ISODate) => {
    if (canEndOn(date)) {
      onChange({ checkIn: value.checkIn, checkOut: date });
    } else if (canStartOn(date)) {
      onChange({ checkIn: date, checkOut: null });
    }
  };

  const shiftMonth = (delta: number) => {
    setVisible((current) => {
      const index = current.year * 12 + (current.month - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });
  };

  const leading = mondayFirstWeekday(visible.year, visible.month, 1);
  const total = daysInMonth(visible.year, visible.month);
  const cells: (ISODate | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: total }, (_, index) => toISODate(visible.year, visible.month, index + 1)),
  ];

  return (
    <View>
      <View style={styles.monthRow}>
        <Pressable
          onPress={() => shiftMonth(-1)}
          disabled={!canGoPrevious}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          accessibilityState={{ disabled: !canGoPrevious }}
          style={[styles.nav, !canGoPrevious && styles.navDisabled]}
        >
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel} accessibilityRole="header">
          {`${MONTHS_LONG[visible.month - 1]} ${visible.year}`}
        </Text>
        <Pressable
          onPress={() => shiftMonth(1)}
          disabled={!canGoNext}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          accessibilityState={{ disabled: !canGoNext }}
          style={[styles.nav, !canGoNext && styles.navDisabled]}
        >
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date, index) => {
          if (!date) return <View key={`blank-${index}`} style={styles.cell} />;

          const dayNumber = Number(date.slice(8));
          const isStart = date === value.checkIn;
          const isEnd = date === value.checkOut;
          const inside =
            value.checkIn !== null && value.checkOut !== null && date > value.checkIn && date < value.checkOut;
          const enabled = choosingCheckOut ? canEndOn(date) || canStartOn(date) : canStartOn(date);
          const taken = blockedNights.has(date);
          const label = `${dayNumber} de ${MONTHS_LONG[visible.month - 1]} de ${visible.year}`;

          return (
            <View key={date} style={styles.cell}>
              <Pressable
                onPress={() => handlePress(date)}
                disabled={!enabled}
                accessibilityRole="button"
                accessibilityLabel={
                  isStart ? `${label}, entrada` : isEnd ? `${label}, salida` : taken ? `${label}, no disponible` : label
                }
                accessibilityState={{ disabled: !enabled, selected: isStart || isEnd }}
                style={[styles.day, inside && styles.dayInside, (isStart || isEnd) && styles.daySelected]}
              >
                <Text
                  style={[
                    styles.dayText,
                    inside && styles.dayTextInside,
                    (isStart || isEnd) && styles.dayTextSelected,
                    !enabled && styles.dayTextDisabled,
                    !enabled && taken && styles.dayTextTaken,
                  ]}
                >
                  {dayNumber}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  monthLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    textTransform: 'capitalize',
  },
  nav: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navDisabled: { opacity: 0.35 },
  navText: { fontSize: 22, color: colors.forest, lineHeight: 24 },
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: typography.weights.semibold,
    color: colors.muted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  day: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  dayInside: { backgroundColor: colors.amberSoft, borderRadius: radius.sm },
  daySelected: { backgroundColor: colors.forest },
  dayText: { fontSize: typography.sizes.button, color: colors.ink },
  dayTextInside: { color: colors.forestDeep },
  dayTextSelected: { color: colors.surface, fontWeight: typography.weights.bold },
  dayTextDisabled: { color: '#CBD5E1' },
  dayTextTaken: { textDecorationLine: 'line-through' },
});
