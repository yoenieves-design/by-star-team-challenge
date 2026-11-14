# Verification

## Automated checks

```sh
npm test
npm run build
node --check dist/app.js
php -l wordpress/snippets/by-star-app.php
```

PHP CLI is optional for local development but required for PHP syntax verification. CI runs this
check independently. Tests cover missing data, rule boundaries, stale records, invalid dates,
numeric validation, synthetic data persistence, storage failures and HTML escaping.
CI also checks that generated artifacts match source. No external npm packages are required.

## WordPress acceptance checklist

- Every shortcode renders and menu links resolve under the selected parent page.
- CSS does not alter the theme outside `.star-app`.
- Save, reload and navigate: observations and follow-up persist on the same origin.
- Select a prior date: existing values load; a new date clears the fields.
- Blank optional values remain unmeasured; out-of-range values do not save.
- Reset and load-scenario operations request confirmation.
- Storage denial/quota failures show an error, never a successful save.
- Keyboard users can reach all controls and see focus.
- At 390px width, navigation and forms fit; the data table can scroll horizontally.
- Report JSON downloads; print summary hides navigation and controls.
- Offline state does not claim that other pages or synchronization are available.

This repository cannot verify the target theme, plugins, CSP or actual WordPress runtime until
installation on the target site. Record those results before calling the integration complete.
