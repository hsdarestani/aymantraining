// Older registrations stored the built-in plan's English session title.
export function displayWorkoutTitle(title: string) {
  return title.replace(/^Athlete Base · Session ([A-C])$/, "Basis · Einheit $1");
}
