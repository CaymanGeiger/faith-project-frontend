# Release audit fixes — September 28, 2026

Implemented the remaining locally actionable engineering fixes from the September 27 audit. Staff request fulfillment and training cancellation/rescheduling are intentionally excluded, following the user's decisions. This is **not** production launch approval: external configuration, approved operating procedures and signed-device acceptance remain gates.

## Audit disposition

| Finding | Change / remaining dependency |
| --- | --- |
| R01: imported-data deletion | Stable, verified submission ownership; historical identity handling; ownership-safe erasure; pending review for ambiguous matches; replay tombstones; operator binding and verified-record erasure tools. Fixed a real PostgreSQL/Prisma privacy-lock failure discovered during acceptance tests. Existing source identities and Jotform-side erasure still require company privacy review. |
| R02: expired/revoked chat sockets | Expiry disconnects, periodic revocation/status checks and server-side token revocation on logout. Real socket expiry tested. |
| R03: session recovery | Foreground session checks and consistent rejected-session cleanup. Previously approved password recovery/verified email changes remain implemented; SMTP activation is pending. |
| R04: staff fulfillment | **Excluded — business workflow undecided.** |
| R05: production onboarding | First-manager bootstrap with concurrency protection and recipient-bound invites; real new-manager/new-dealer registration tested. Dealer-request approval and invitation delivery decisions remain excluded. |
| R06: dependencies | Patched backend dependencies and targeted frontend overrides; zero vulnerabilities in both current dependency trees. Preserved Expo SDK 57. The official decoder 0.5.0 algorithm is vendored with only its export adapted to CommonJS for Expo Router compatibility; license/source and consumer tests included. Clean locked install verified. |
| R07: training | Future available sessions separated from saved history, including compatibility with the existing older API; changed selections save; selecting another session preserves earned certification; related writes are atomic. **Cancellation/rescheduling policy remains excluded.** Selecting another class does not cancel prior preferences. |
| R08: notifications/inbox | Per-user socket invalidations update unopened conversations; foreground/reconnect and active polling refresh inboxes. Approved push delivery implementation is retained; platform credentials and physical-device delivery are pending. |
| R09: chat history/read/typing | Older-page loading, stable tied-timestamp pagination, authoritative refresh removing moderated messages, validated message-based monotonic read receipts, throttled typing and stale typing expiry. Concurrent send retries are idempotent. |
| R10: save consistency | Transactions for training, equipment and JB progress; safe retry of identical equipment submissions; owner-only correction of unapproved equipment records; manager data refreshes on foreground and every minute while active. Approved records require Hercules correction. |
| R11: request timeout | Deadline includes response-body reading and composes caller cancellation; independent callers cannot cancel each other's request. |
| R12: quality gates | Non-mutating backend lint, full typecheck, CI and PostgreSQL-backed HTTP/socket acceptance coverage. Corrected fixtures and existing lint failures. |

Additional operations work: database-aware readiness, shutdown cleanup, a scheduled Jotform worker entry using existing durable leases/alerts, bulk unread/block queries instead of per-conversation query chains, migration/restore rehearsal, and documented rollout/rollback procedures. No customer records were edited, no production migrations were applied, and no app was published.

## Verification

- Backend: 275 unit tests; 14 real-database/HTTP/socket acceptance tests; lint, full typecheck, production build and Prisma validation passed.
- Frontend: 42 automated checks (10 store/launcher, 9 API, 21 runtime, 2 dependency compatibility); typecheck and web/iOS/Android JavaScript exports passed. These are not signed native builds.
- Clean frontend dependency installation succeeded. Current backend and frontend dependency scans report zero vulnerabilities.
- PostgreSQL: fresh migrations passed; upgrade from the first six migrations preserved a synthetic account; backup restored to another test database; first-manager bootstrap and duplicate protection passed.
- iPhone 16 / iOS 18.1 / Expo Go: app loaded successfully after clearing the stale preview cache; training showed an empty upcoming list and preserved saved historical training against the existing backend. This is a limited preview smoke check, not full native or latest-OS acceptance.
- Android JavaScript export passed. This change set does not add signed Android, native plugin, physical-device or platform-push acceptance evidence.

## Required before launch

1. Review/deploy the backend and migrations before publishing the corresponding mobile release. Existing production configuration was not changed. See [backend operations](../../backend/docs/release-fix-operations.md).
2. Resolve the two intentionally pending business workflows and assign privacy/moderation/operations owners. Review imported ownership and legacy identity records; approve retention and source-system erasure procedures.
3. Configure and verify SMTP, sender/domain, APNs/FCM/Expo push, Jotform integration and operational alerts in staging/production. Enable the maintenance worker or scheduler.
4. Complete existing store/account gates: preserve the verified Apple bundle identity, company Play access/distribution, signing, supported Xcode/toolchain, store declarations and any required Play testing period. The earlier cloud source-upload approval block was not retried.
5. Build signed iOS/Android candidates and complete real-device journeys, native upgrades, 16 KB Android checks, latest/oldest supported OS versions, keyboard/small-screen/large-font/accessibility, foreground/background/reinstall and real push/email delivery.
6. Approve current classes, resources, benefits and contacts; confirm production contains no demo accounts/content. Validate production backup/restore/monitoring and expected-volume load. Current realtime adapter/rate limits require one web process until multi-process support is configured and tested.

References: [original audit](RELEASE_READINESS_AUDIT_2026-09-27.md), [account security and push](ACCOUNT_SECURITY_AND_PUSH.md), [release operations](RELEASE_OPERATIONS.md), [backend operations](../../backend/docs/release-fix-operations.md).
