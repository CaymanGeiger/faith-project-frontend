Security compatibility backport of official decode-uri-component 0.5.0.

Source: https://www.npmjs.com/package/decode-uri-component/v/0.5.0
Tarball SHA-1: 4592fa1e1d640ec5e2760e2e168ad2ab5f2c9da1
Only change: replace the ESM default export with module.exports, preserving query-string 7 / Expo Router 57 CommonJS compatibility. Algorithm and license are unchanged. Remove this override when Expo Router ships a compatible patched dependency.
