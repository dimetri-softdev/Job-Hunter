const MIN_PASSWORD_LENGTH = 7;
const MAX_PASSWORD_LENGTH = 128;
const PASSWORD_SYMBOLS = "!@#$%^&*()_+-=[]{};':\"|<>?,./`~\\";

export function validatePassword(password: string): string | null {
  const length = Array.from(password).length;
  if (length < MIN_PASSWORD_LENGTH) {
    return "Password must be at least 7 characters long.";
  }
  if (length > MAX_PASSWORD_LENGTH) {
    return "Password must be 128 characters or fewer.";
  }
  if (!/\d/.test(password)) {
    return "Password must include at least one number.";
  }
  if (![...password].some((character) => PASSWORD_SYMBOLS.includes(character))) {
    return "Password must include at least one symbol, such as ! or #.";
  }
  return null;
}
