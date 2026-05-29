import { fromZonedTime, toZonedTime, format } from "date-fns-tz";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMinutes,
} from "date-fns";

// Todas as visões (Diária/Semanal/Mensal) e os disparos agendados precisam
// respeitar o FUSO DO USUÁRIO. O banco guarda UTC; aqui convertemos.
// Estratégia: levar "agora" para o fuso, achar o limite do dia/semana/mês
// no calendário local e converter de volta para UTC para consultar o banco.

export const DEFAULT_TZ =
  process.env.APP_DEFAULT_TIMEZONE ?? "America/Maceio";

type Range = { startUtc: Date; endUtc: Date };

function rangeIn(
  tz: string,
  ref: Date,
  startFn: (d: Date) => Date,
  endFn: (d: Date) => Date,
): Range {
  const local = toZonedTime(ref, tz);
  const startLocal = startFn(local);
  const endLocal = endFn(local);
  return {
    startUtc: fromZonedTime(startLocal, tz),
    endUtc: fromZonedTime(endLocal, tz),
  };
}

export function dayRange(tz = DEFAULT_TZ, ref = new Date()): Range {
  return rangeIn(tz, ref, startOfDay, endOfDay);
}

// Semana de segunda (weekStartsOn: 1) a domingo.
export function weekRange(tz = DEFAULT_TZ, ref = new Date()): Range {
  return rangeIn(
    tz,
    ref,
    (d) => startOfWeek(d, { weekStartsOn: 1 }),
    (d) => endOfWeek(d, { weekStartsOn: 1 }),
  );
}

export function monthRange(tz = DEFAULT_TZ, ref = new Date()): Range {
  return rangeIn(tz, ref, startOfMonth, endOfMonth);
}

// Converte "HH:mm" (no fuso do usuário, hoje) para o próximo horário UTC.
// Usado pelo agendamento do resumo matinal.
export function nextLocalTimeToUtc(
  hhmm: string,
  tz = DEFAULT_TZ,
  ref = new Date(),
): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const local = toZonedTime(ref, tz);
  local.setHours(h, m, 0, 0);
  let utc = fromZonedTime(local, tz);
  if (utc.getTime() <= ref.getTime()) {
    // já passou hoje -> agenda para amanhã
    utc = addMinutes(utc, 24 * 60);
  }
  return utc;
}

// Formata uma data UTC no fuso do usuário (ex.: "29/05 14:30").
export function formatInTz(
  date: Date,
  tz = DEFAULT_TZ,
  pattern = "dd/MM HH:mm",
): string {
  return format(toZonedTime(date, tz), pattern, { timeZone: tz });
}
