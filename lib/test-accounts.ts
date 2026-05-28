import {
  ALL_TEST_EMAILS,
  isAllowedUniversityEmail,
  isTestEmail,
  normalizeUniversityEmail
} from "@/lib/university";

export const TEST_ACCOUNTS = ALL_TEST_EMAILS;

export const TEST_ACCOUNT_PASSWORD = "Cortex123";

export function normalizeCortexEmail(email: string) {
  return normalizeUniversityEmail(email);
}

export function isWhitelistedTestEmail(email: string) {
  return isTestEmail(email);
}

export function isAllowedCortexEmail(email: string) {
  return isAllowedUniversityEmail(email);
}

export function usesFixedTestAccountPassword(email: string) {
  return isWhitelistedTestEmail(email);
}
