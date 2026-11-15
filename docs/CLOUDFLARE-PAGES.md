# Publish the BY STAR demo

Use a [Git-connected Cloudflare Pages project](https://developers.cloudflare.com/pages/get-started/git-integration/) for `yoenieves-design/by-star-team-challenge`. Pages serves the built website and its JSON fixtures from `dist`. GitHub Actions also runs the browser tests on each push.

| Cloudflare Pages setting | Value |
| --- | --- |
| Production branch for the release | `main` |
| Framework preset | None |
| Root directory | Repository root |
| Build command | `npm ci --include=dev && npm run build:pages` |
| Build output directory | `dist` |
| Build environment variable | `SKIP_DEPENDENCY_INSTALL=1` in Production and Preview |

The build command installs the versions from the lockfile, checks TypeScript, runs unit tests, and builds the site. Cloudflare and GitHub Actions read the Node.js version from `.node-version`.

## Release transition

The project originally published `fear-free`. Changing the default GitHub branch does not change Cloudflare's production branch. These are separate settings.

1. Finish the source, licenses and documentation. Run `npm run build:pages` and the browser suite. Push the reviewed version and preserve the same history when advancing `main`.
2. In Cloudflare, open **Workers & Pages → by-star-team-challenge → Settings → Builds & deployments → Configure Production deployments**. Set **Production branch** to **main**, keep automatic production branch deployments enabled, and save. The setting name may appear under the project's build configuration in the current dashboard.
3. Trigger a new push to `main` after that setting is saved. Confirm **Deployments** labels the resulting deployment **Production**, shows source **main**, and reports a successful build for the expected commit.
4. Open [the public demo](https://by-star-team-challenge.pages.dev/) in a fresh browser session. Verify all four routes, JSON feeds and the [demonstration walkthrough](ROADMAP.md). Compare the published JS, CSS and JSON with the intended build. Confirm the GitHub verification workflow also passed for the final commit.
5. Once production is confirmed on `main`, delete an obsolete development branch only after confirming its tip is contained in `main`. Removing the branch reference preserves commits already merged into `main`. Keep a release tag for the submitted source. Do not delete the branch Cloudflare still uses for production.

Cloudflare dashboard changes are not part of the source code. This guide describes the target configuration; check the dashboard's actual source branch and commit before considering the transition complete. [Official branch controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/).

## Optional custom domain

The working submission URL is [by-star-team-challenge.pages.dev](https://by-star-team-challenge.pages.dev/). The earlier `by-starteam.byvoxel.com` hostname is optional and should not be submitted until it has been verified to serve the same app.

To connect it later, add the hostname in **Custom domains** and follow the [subdomain setup instructions](https://developers.cloudflare.com/pages/configuration/custom-domains/#add-a-custom-subdomain). Update the existing DNS record only when ready to replace its previous site. Wait for the domain to be active and verify HTTPS in a fresh browser session. Switching domains creates a different browser-storage scope; existing local demo records do not move automatically.

## Future updates

Create a short-lived feature branch from `main`, review its [preview deployment](https://developers.cloudflare.com/pages/configuration/preview-deployments/), and merge only after checks pass. A successful push to the configured production branch updates the same public `pages.dev` address. No Cloudflare API key is required in this repository or the browser application.
