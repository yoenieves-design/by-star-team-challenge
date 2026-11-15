# Publish the BY STAR demo

The demo uses a [Git-connected Cloudflare Pages project](https://developers.cloudflare.com/pages/get-started/git-integration/) for `yoenieves-design/by-star-team-challenge`. Pages builds the source from `main` and serves the website and JSON fixtures from the generated `dist` directory. Build output is ignored by Git and does not need to be committed. GitHub Actions also runs the browser tests on each push.

| Cloudflare Pages setting | Value |
| --- | --- |
| Production branch for the release | `main` |
| Framework preset | None |
| Root directory | Repository root |
| Build command | `npm ci --include=dev && npm run build:pages` |
| Build output directory | `dist` |
| Build environment variable | `SKIP_DEPENDENCY_INSTALL=1` in Production and Preview |

The build command installs the versions from the lockfile, checks TypeScript, runs unit tests, and builds the site. Cloudflare and GitHub Actions read the Node.js version from `.node-version`.

## Production updates

1. Run `npm run build:pages` and the browser suite before publishing application changes. The build recreates `dist/`, including the HTML entry point, JSON data, media and license notices.
2. Push the reviewed source to `main`. Cloudflare's production branch is configured separately from GitHub's default branch; keep automatic production deployments enabled for `main`.
3. Confirm **Deployments** labels the resulting deployment **Production**, shows source **main**, and reports a successful build for the expected commit. Confirm the GitHub verification workflow also passed.
4. Open [the public demo](https://by-star-team-challenge.pages.dev/) in a fresh browser session. Verify all four routes, JSON feeds, license notices and the [demonstration walkthrough](ROADMAP.md). Compare the published assets with the intended local build when validating a release.

Cloudflare dashboard settings are not stored in the source code. If rebuilding the project, configure the settings above and verify the actual production branch and commit. See [official branch controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/).

## Optional custom domain

The working submission URL is [by-star-team-challenge.pages.dev](https://by-star-team-challenge.pages.dev/). The earlier `by-starteam.byvoxel.com` hostname is optional and should not be submitted until it has been verified to serve the same app.

To connect it later, add the hostname in **Custom domains** and follow the [subdomain setup instructions](https://developers.cloudflare.com/pages/configuration/custom-domains/#add-a-custom-subdomain). Update the existing DNS record only when ready to replace its previous site. Wait for the domain to be active and verify HTTPS in a fresh browser session. Switching domains creates a different browser-storage scope; existing local demo records do not move automatically.

## Future updates

Create a short-lived feature branch from `main`, review its [preview deployment](https://developers.cloudflare.com/pages/configuration/preview-deployments/), and merge only after checks pass. A successful push to the configured production branch updates the same public `pages.dev` address. No Cloudflare API key is required in this repository or the browser application.
