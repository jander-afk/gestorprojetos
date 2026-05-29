// util mínima para juntar classes condicionalmente (sem dependência extra).
export function cn(
  ...args: Array<string | false | null | undefined>
): string {
  return args.filter(Boolean).join(" ");
}
