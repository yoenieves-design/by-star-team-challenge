# Publish the BY STAR demo

Use a [Git-connected Cloudflare Pages project](https://developers.cloudflare.com/pages/get-started/git-integration/) for `yoenieves-design/by-star-team-challenge`. Pages serves the built website and its JSON fixtures from `dist`. GitHub Actions also runs the browser tests on each push.

| Cloudflare Pages setting | Value |
| --- | --- |
| Initial production branch | `fear-free` |
| Framework preset | None |
| Root directory | Repository root |
| Build command | `npm ci --include=dev && npm run build:pages` |
| Build output directory | `dist` |
| Build environment variable | `SKIP_DEPENDENCY_INSTALL=1` in Production and Preview |

The build command installs the versions from the lockfile, checks TypeScript, runs unit tests, and builds the site. Cloudflare and GitHub Actions read the Node.js version from `.node-version`.

1. Create the Pages project with `fear-free` as its initial production branch. This branch contains the demo. Use the project's `pages.dev` address for review. Each push to `fear-free` updates that address after a successful build.
2. Open the review URL in a fresh browser session. Check that **Health** opens with six crew members and the cabin alert. Select **Review incident**, start a check in **Assist**, and open **Profiles**. Follow the [full demo walkthrough](ROADMAP.md) for the handoff and replay.
3. When the review is complete, change the [production branch](https://developers.cloudflare.com/pages/configuration/branch-build-controls/) to `main` and enable automatic production deployments. Enable preview deployments for `fear-free` if review work will continue. Merge the approved `fear-free` version into `main` and check that the production deployment shows that commit and passes the browser walkthrough.
4. Add `by-starteam.byvoxel.com` in the project's **Custom domains** settings. Follow the [subdomain setup instructions](https://developers.cloudflare.com/pages/configuration/custom-domains/#add-a-custom-subdomain) at the current DNS provider. If the hostname already serves a site, switch its DNS record when the production demo is ready. Wait for the domain to be active, then open the HTTPS URL in a fresh browser session to verify the submission link.

After the switch to `main`, the next successful deployment of `fear-free` has a [branch preview address](https://developers.cloudflare.com/pages/configuration/preview-deployments/#preview-aliases) at `fear-free.<project>.pages.dev`.
