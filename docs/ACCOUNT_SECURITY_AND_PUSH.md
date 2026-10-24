# Account security and push notifications

Decisions confirmed September 27, 2026: implement password recovery, verified email changes and push alerts. Staff fulfillment and training cancellation/rescheduling rules remain undecided. This change does not define those business rules.

## Implemented behavior

- Forgot password is available from Sign In. An eight-digit email code expires after 15 minutes and allows at most five failed guesses. Repeated requests for the same account are limited to one per minute, with endpoint rate limits as well. Verification uses keyed code hashes. Recovery responses do not disclose whether an account exists. Mail delivery runs from a durable queue outside the public request so SMTP latency does not disclose account existence. Pending delivery codes are authenticated-encrypted in the queue and erased after delivery or expiry.
- New passwords require at least 12 characters and at most 72 UTF-8 bytes to avoid bcrypt truncation. Password resets consume outstanding codes, invalidate previous sessions and remove registered push devices. Existing users are not forced to change their password merely because this feature is added.
- Profile email is read-only in the ordinary details form. Change Email Address requires the current password and a code delivered to the new address. The old address remains active until confirmation. After confirmation, sign in with the new address. Ordinary profile updates cannot bypass verification.
- Future email changes retain previous account email addresses for account-deletion processing. Historical Jotform rows are erased and suppressed using those recorded addresses. This does not reconstruct email history from changes predating this migration or solve the broader audit finding about stable ownership of all imported submissions; that still needs staging/data review.
- Chat push alerts are optional in both dealer and manager profiles. The OS permission prompt appears only after Enable Chat Alerts. The alert contains generic text, not a message body, sender name, email or company. Tapping a notification for the signed-in account opens its chat list. Unrelated notifications cannot choose an arbitrary route.
- Push jobs are created with the message transaction. The backend checks account/session validity, membership, blocks, deletion and read state before delivery. Expo receipts are checked, invalid device registrations removed, transient errors retried and terminal failures logged. Delivery uses leases for multiple server processes; it is at-least-once, so a crash after provider acceptance can still cause a duplicate alert.
- Push registrations expire with the login session. Signed-out users are unregistered when reachable. An offline logout cannot recall an alert already queued by a provider; lock-screen payloads remain generic. Enabling alerts in a new account transfers that installation's token. Resetting a password or confirming an email change deletes all that user's push registrations; the saved opt-in is re-registered after the next sign-in.
- Active HTTP sessions clear rejected credentials on an authenticated 401. Messaging sockets disconnect on authentication failure/expiry and revalidate passive subscribers every 30 seconds, so a security change is noticed even without a new outgoing event.

## Activation requirements — not completed by this change

No production migration, deployment, email, push alert, Apple credential upload or Google credential upload was performed.

1. Review and deploy `backend/prisma/migrations/20260928000000_account_security_push/migration.sql` in staging first, then regenerate/build the backend. It adds tables and a default-zero session version, preserving existing account rows and valid legacy sessions until a security change occurs.
2. Configure a company-approved transactional email sender using `SMTP_HOST`, `SMTP_PORT` (587 STARTTLS or 465 TLS), `SMTP_USER`, `SMTP_PASSWORD`, and `SECURITY_EMAIL_FROM`. Do not put credentials in source control or public mobile environment variables. The runtime requires TLS and does not log codes, addresses or provider error bodies. Without configuration the UI reports that email verification is unavailable. Verify sender authentication, spam-folder behavior, delivery failures and abuse controls. The email worker runs every five seconds in an always-on backend process, with leases and bounded retries. Monitor `SECURITY_EMAIL_WORKER_FAILED`, `SECURITY_EMAIL_DELIVERY_RETRY` and `SECURITY_EMAIL_DELIVERY_FAILED`; after expiry or exhausted delivery attempts the user must request another code. Rotating JWT_SECRET also invalidates pending codes/queued ciphertext, so coordinate rotation with recovery retries.
3. Confirm the permanent iOS bundle identifier and Android package ownership. Configure APNs and FCM v1 for the existing EAS project. Enabling Expo enhanced push security is recommended; put its server-only credential in `EXPO_ACCESS_TOKEN`.
4. Deploy the backend with `PUSH_NOTIFICATIONS_ENABLED=false` first. Enable it only after the migration, credentials, privacy disclosures and signed native builds are ready. The app checks server availability before registering a phone. The worker runs every 15 seconds inside the backend process; use an always-on process and graceful shutdown. Monitor `PUSH_WORKER_FAILED` and `PUSH_DELIVERY_FAILED`. Completed/failed delivery metadata is removed after seven days; account/device deletion cascades associated jobs.
5. Produce new native iOS and Android builds: `expo-notifications` adds native configuration and cannot be activated by a JavaScript-only OTA update to an older binary. Use a new app/runtime version when distributing to already-installed binaries. Expo Go/web previews intentionally do not register push devices or request notification permission. This app currently requires a physical phone for its push opt-in flow.
6. Run the acceptance matrix below against staging, then approve the production rollout. Do not deploy backend email-edit enforcement ahead of an accepted client rollout without coordinating the temporary impact on older clients' direct email-edit form.

Official setup references: [Expo notifications for SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/), [push setup and credentials](https://docs.expo.dev/push-notifications/push-notifications-setup/), [delivery and receipts](https://docs.expo.dev/push-notifications/sending-notifications/).

## Required acceptance matrix

Run these on signed iOS and Android candidates with staging accounts, including a dealer and a manager:

- Reset a password successfully; reject wrong, expired, reused and locked-out codes. Verify old sessions stop working and another user's account is unaffected. Confirm missing/inactive-account responses and production timing/rate-limit behavior.
- Request an email change with a wrong password; request with a correct password; confirm the old email remains usable before verification; confirm the new email works afterward. Test an already-used target email and a competing claim during confirmation. Test repeated changes followed by deletion against known imported records.
- Enable alerts, deny OS permission, enable later in settings, turn alerts off, sign out, switch accounts, rotate tokens, reinstall and reset a password. Confirm no private message text reaches a lock screen. Test foreground, background and cold-start taps.
- Send between two real accounts, with the recipient outside the chat. Confirm Expo tickets and receipts, APNs/FCM delivery, retry behavior, invalid-device cleanup and monitoring. Test blocked users, already-read/removed messages and a stopped/restarted backend worker.
- Recheck current sign-in, invitation registration, profile details, dealer onboarding and manager screens on both platforms. Staff fulfillment and training cancellation/rescheduling remain unchanged.

## Privacy disclosures to approve before enabling delivery

Update the in-app/public notice and store data forms to describe the configured email provider and Expo/APNs/FCM. Include device push tokens, platform, internal recipient IDs, generic notification content and delivery metadata; historical account email addresses and verification challenges; security/push processing purposes and retention. No legal publication or store-form submission is included here. The existing approved notice must not be assumed to cover an unnamed new provider.

## Automated verification

Latest local results: 275 backend tests across 20 suites passed; backend build, full TypeScript check and schema validation passed; new account-security/push files passed lint. Frontend check passed, including 36 tests across its test scripts, type checking and web/iOS/Android JavaScript exports. The refreshed iPhone Expo Go preview showed the new account controls and email-verification form without submitting any credentials or changes; [screen capture](validation/ios-email-verification.png). Actual email/push delivery remains unverified pending configuration and signed native acceptance.

The backend suite includes challenge hashing, account-neutral response content, request cooldown, failed-attempt persistence, expired/locked/revoked/inactive challenges, password reset and code consumption, current-password reauthentication, verified email history, session-version rejection and deletion of recorded aliases. Push tests cover disabled service, generic payloads, invalid/blocked/removed/read recipients, invalid-device cleanup, provider retry and receipt processing.

Frontend tests cover iOS/Android opt-in and opt-out, no automatic prompt, permission denial, unavailable backend delivery, logout cleanup and rejected active sessions. The normal check also type-checks and exports web/iOS/Android. These are mocked-boundary tests and JavaScript exports, not proof of real email delivery, live database races, signed native builds or APNs/FCM delivery.


Follow-up: [Remaining release fixes](RELEASE_FIXES_2026-09-28.md) adds server-side per-token logout revocation, stable imported-record ownership and database-backed security acceptance. Production email and platform-push activation remain pending.
