/**
 * Operator notes: where **database / audit logs** live for this stack (Neon Postgres).
 *
 * Application code must not print raw SQL bind values or decrypted PII - use `lib/safe-log`.
 *
 * ## Neon (typical setup for this repo)
 *
 * 1. Open [Neon Console](https://console.neon.tech) → select your project.
 * 2. Use **Monitoring**, **Logs**, or **Branches → … → Logs** (labels vary by Neon UI version)
 *    to stream **Postgres** / **compute** logs (connections, errors, optional audit lines).
 * 3. For **compliance-style audit** (DDL/DML auditing, PGAudit-related features), see Neon’s
 *    current docs on **audit logging** and plan eligibility - options expanded over 2025.
 *    Blog reference: [Postgres logging vs PGAudit](https://neon.com/blog/postgres-logging-vs-pgaudit).
 *
 * 4. Prefer Neon / Postgres settings that **avoid logging bind parameters** (`log_parameter` off)
 *    when statements could reference sensitive columns, unless you have a controlled SIEM.
 *
 * ## Backups & retention
 *
 * Configure Neon **retention** and **branch** strategy per your compliance needs; audit streams
 * may need export to your log vendor (Datadog, etc.) separately.
 */
export const NEON_CONSOLE_URL = "https://console.neon.tech" as const;
