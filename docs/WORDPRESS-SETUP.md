# Install BY STAR 0.2.0 in WordPress

## 1. Upload the compiled files

Download branch `fear-free` as a ZIP from GitHub or use the prepared WordPress ZIP.

- **From the repository ZIP**, upload the contents of `dist/` into `wp-content/uploads/by-star/v0.2.0/` using your hosting file manager or SFTP. Keep the `assets/`, `data/`, `media/` and `simulation/` directories intact.
- **From the WordPress ZIP**, upload the included `by-star/` directory into `wp-content/uploads/`. Keep `by-star-loader.php` and this guide available on your computer.

The site must be able to serve `assets/by-star-app.js` and `simulation/streams/personal.json` under that URL. Opening either URL in a new tab is a quick check. Use the same HTTPS host as the three pages. The files are compiled already, so the WordPress host needs no Node.js build step.

## 2. Create or reuse three pages

Create a parent page with slug `mission-health` if it does not exist. Use a full-width layout for each child page, with one **Shortcode** block per page.

| Page title | Path from the site home | Shortcode |
| --- | --- | --- |
| Health | `mission-health/health` | `[by_star_health]` |
| Assist | `mission-health/assist` | `[by_star_assist]` |
| Profiles | `mission-health/profiles` | `[by_star_profiles]` |

You can reuse the earlier **My status**, **Alerts & actions** and **Profile & mission** pages by updating their slugs and shortcodes. To keep existing URLs, put their actual paths into the `paths` array in the loader. The app renders its own menu. Update the site's public menu to point to the new Health page if needed.

## 3. Activate the shared snippet

1. Open `by-star-loader.php` from the package or from [wordpress/snippets/](../wordpress/snippets/) in the repository.
2. In **Code Snippets**, create a **PHP** snippet called **BY STAR Mission Health 0.2.0**.
3. Copy the complete file after its first `<?php` line and paste it into the snippet editor.
4. The default `asset_base` uses the site's WordPress uploads URL. If you placed the files elsewhere, set it to the same-origin URL of the version folder, including the trailing slash. Adjust the three paths if you reused different page slugs.
5. Select **Run everywhere**, save and activate. Once the new pages work, deactivate the 0.1.0 snippet and update links to the superseded pages.

## 4. Walk through the demo

1. Open **Health** at the new site URL. The replay starts paused at **01:48** on a fresh browser. The crew overview shows six profiles and a **Cabin CO₂ change needs review** incident.
2. Open **Review incident**, expand **Evidence and timing**, and **Start guided check**. Complete the first step and choose **I can’t do this now**.
3. Visit **Profiles**, then return to **Assist**. The paused step should still be available. Select Noah in **Crew handoff**, request support, then select Noah in the top bar to confirm receipt.
4. Return to **Health**, select Maya and advance with **Next event**. The UI shows when the Earth relay becomes unavailable and when Maya's wrist signal returns.
5. Test **I need help** and **Simplified view** on a phone. Open **Health → View sensors** to check the device list. Visit **Profiles → Mission & schedule → NASA data & references** to open the historical JSON.

Changes are stored in the browser and shared by the three pages on the same origin. **Restart replay** returns to the beginning and clears actions for that replay after confirmation. A private window starts a fresh session. The previous version's local records use a separate storage key.

## If a page does not load

| What you see | What to check |
| --- | --- |
| Shortcode text remains visible | Confirm the PHP snippet is active and the page uses a Shortcode block. |
| Loading text remains | Check that the script URL returns JavaScript and the theme calls the WordPress footer hook. Exclude the bundle from script optimization if a plugin prevents it from running. |
| An HTTP or JSON error | Verify the version folder, capitalization, same-origin URL and all JSON subdirectories. |
| Menu opens a different page | Check the full path in the snippet, including the parent slug. Clear site caches after updating. |
| Layout is too narrow | Switch to a full-width template or place the shortcode in a wide group. |

For a new deployment, upload a fresh version directory and update the asset base and version together so cached pages and JSON stay compatible.
