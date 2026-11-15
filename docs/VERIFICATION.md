# Verification

With the lockfile dependencies installed, run:

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:browser
php -l wordpress/snippets/by-star-loader.php
```

Set `BY_STAR_BROWSER_CHANNEL=msedge` in the shell to use installed Microsoft Edge for browser tests. The browser suite starts the production preview and checks the same compiled files intended for WordPress.

The unit suite checks schema compatibility, device attribution, time ordering, duplicate packets, missing measurements, grouping by breathing zone, planned task applicability and crew handoff transitions. The browser suite exercises all three pages, persistence across navigation, key controls on a narrow viewport and automated accessibility checks. The GitHub workflow verifies build reproducibility and checks PHP syntax.

On the deployed WordPress theme, confirm that all three child pages load the same asset version, the in-app links point to the correct URLs and the workflow persists through navigation. Review the narrow layout and expanded text on the target device. [Installation and manual walkthrough](WORDPRESS-SETUP.md).
