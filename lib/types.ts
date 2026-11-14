export type Role = "ADMIN" | "USER";

export interface DevUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type BillingPeriod = "MINUTE" | "HOUR" | "DAY";

/** Global billing rules set by admins; they apply to every customer. */
export interface BillingSettings {
  enabled: boolean;
  amountKobo: number;
  period: BillingPeriod;
  windowStart: number | null;
  windowEnd: number | null;
  timezone: string;
}

export interface Me {
  id: string;
  email: string;
  name: string;
  role: Role;
  balanceKobo: number;
  billing: BillingSettings;
}

export type TransactionType = "TOPUP" | "DEBIT" | "ADJUSTMENT";

export interface LedgerEntry {
  id: string;
  type: TransactionType;
  amountKobo: number;
  balanceAfterKobo: number;
  description?: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  balanceKobo: number;
  online: boolean;
  /** ISO time of the customer's last debit, or null if never charged. */
  lastDebitAt: string | null;
}

export interface FeedItem {
  id: string;
  kind: TransactionType;
  userId: string;
  name: string;
  amountKobo: number;
  balanceAfterKobo: number;
  at: string;
}

export type BillingPatch = Partial<BillingSettings>;
