# Android data inventory addendum — September 27, 2026

Engineering input to the release worklist, based on current frontend code, backend Prisma models, user/messaging services and `backend/docs/jotform-dealer-registration.md`. This is not a completed Play Data Safety declaration or approved retention policy. Operations must confirm deployed configuration, recipients, retention periods and provider contracts.

| Flow | Data and destination | Purpose / release verification |
| --- | --- | --- |
| Account and profile | Name, email, optional phone, company, role/status, password hash, acceptance timestamps and assigned manager in application backend/database | Authentication, dealer access and account servicing; verify role boundaries and deletion |
| Account security (new, activation pending) | Keyed verification-code hashes, target email, expiry/attempt counts, session version and historical account emails; requested codes and recipient address sent through approved SMTP service | Password recovery, verified email changes, session invalidation and privacy processing; approve provider and disclosures before rollout |
| Optional chat push (new, activation pending) | Device push token, platform, session expiry, internal recipient ID and generic alert through Expo/APNs/FCM; delivery job/receipt metadata in backend | Opt-in message alerts; no message body/sender/company in payload. Verify credentials, receipts, logout and deletion on signed devices before enabling |
| Dealer activity | Onboarding, class enrollment, equipment records, tasks, marketing consultations and lead records in backend/database | Program workflows; verify which records are preferences/local records versus completed external submissions |
| Messaging and moderation | Message body, participants, read/typing events, message IDs, reports/reasons and block relationships through backend/WebSocket/database | Dealer-manager communication and abuse handling; verify two real sessions, authorization and operator queues |
| Local storage | Session token and onboarding draft via SecureStore when available, with existing AsyncStorage fallback/migration paths | Session restoration and draft recovery; test process death, logout/deletion and installed-app storage behavior |
| Jotform external form | User opens the provider form in an external handler; provider receives the form answers directly | Dealer registration; provider-side collection/retention must be inventoried separately |
| Jotform backend synchronization, if enabled | Backend authenticates webhooks and retrieves canonical submissions using a server-only API key. Stores form/submission IDs, normalized email/company, optional dealer number, vendor/workflow status/timestamps, digest and processing metadata | Reconciliation and review. Raw answers, name/address/phone, applicant IP and API bodies are not retained by this integration. Confirm enabled mode, mapping and provider region |
| Operations webhooks | Deletion request ID or moderation report ID plus generic operational text; Jotform operational events use PII-free alert metadata/event IDs | Alerting. Confirm receiver/operator ownership, access controls and retention; IDs can still link to private records |
| Expo update delivery | App checks the configured EAS update service; provider receives network/update request metadata | Version delivery; verify actual SDK/provider behavior and privacy disclosures, including infrastructure logs |
| External links | HTTPS browser destinations, phone/email handlers and linked training/equipment/marketing/warranty services | User-initiated workflows; inventory each provider's actual collection instead of assuming all forms submit through this backend |

No notification SDK was added. In-app notifications do not establish background push delivery. This code review does not establish the absence of host analytics, access logs or crash collection outside the checked source.

## Deletion and retention items requiring operational decisions

The prospect deletion service deletes conversations, cascades associated user data and clears matching locally synchronized Jotform identity fields while marking them privacy-erased. It retains the deletion-request record (including email, identifiers and timestamps) and Jotform processing metadata. Manager deletion involves access closure and reassignment/completion. Public deletion requests require identity verification.

Application deletion does not prove deletion at Jotform or other external providers. Confirm provider-side handling, backups, log retention, legal exceptions, operator access, and prevention of reimport after deletion. Assign concrete retention periods and publish accurate wording before submission. Do not claim that all data disappears immediately.

Confirm the actual distribution route before completing Play declarations. Use the [current Google Data Safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469) and [account-deletion guidance](https://support.google.com/googleplay/android-developer/answer/13327111); an internal-test upload does not establish public-release compliance.
