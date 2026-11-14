# WordPress installation guide

## 1. Install the shared PHP snippet

1. In GitHub, select branch `fear-free` and open `wordpress/snippets/by-star-app.php`.
2. Open the raw file and copy its complete contents **except the first `<?php` line**.
3. In Code Snippets, create a **PHP** snippet named `BY STAR Mission Health v0.1.0`.
4. Paste the code, select **Run everywhere**, save and activate it.
5. Use only one active BY STAR version. The class guard prevents accidental redeclaration,
   but it cannot decide which version you intend to use.

The free PHP-snippet workflow is sufficient; no separate HTML, CSS or JavaScript snippet is required.
The generated PHP registers all shortcodes and prints shared styles/scripts once in the footer.
Your theme must call `wp_footer()`. A restrictive Content Security Policy may block inline assets;
in that deployment, move assets to enqueued files with the appropriate policy instead.

Alternative: place the generated file in `wp-content/plugins/by-star-mission-health/`
and activate it as a plugin. Do not activate the snippet at the same time.

## 2. Create pages

Create a parent page titled **Mission Health**, slug `mission-health`. It can contain a short
introduction and a link to My status. Create these child pages beneath it:

| Title | Child slug | Shortcode |
| --- | --- | --- |
| My status | `dashboard` | `[star_dashboard]` |
| Daily log | `daily-log` | `[star_daily_log]` |
| Indicators | `indicators` | `[star_indicators]` |
| Alerts & actions | `actions` | `[star_actions]` |
| Environment | `environment` | `[star_environment]` |
| Wellbeing plan | `wellbeing` | `[star_wellbeing]` |
| Health report | `report` | `[star_report]` |
| Profile & mission | `profile` | `[star_profile]` |

Use a WordPress **Shortcode block**, one module per page. Choose a full-width page template
without a theme sidebar. Hide the theme's page title if it duplicates the application's title.
The in-app menu is automatic; optionally add My status to your site's main menu.
Enable a pretty permalink structure so these paths resolve.

All pages must use the same HTTPS origin to share demo storage. WordPress users on the same
browser profile share these records; logging out does not clear them.

## 3. Customize page URLs if needed

If using other slugs or a multilingual URL layout, create a separate PHP snippet:

```php
add_filter( 'by_star_page_urls', function ( $links ) {
    $links['dashboard'] = home_url( '/your-dashboard/' );
    // Override other keys using the slug column above.
    return $links;
} );
```

## 4. Verify the installation

Open Profile & mission and load the fictional week. Navigate through every menu link.
Save a daily log, reload the page, and confirm the entry remains. Test an action checkbox,
export, mobile layout, and keyboard navigation. Environment should show no instrument connected.

If the loading message remains: inspect the browser console, confirm the snippet is active,
check for blocked inline scripts, and temporarily disable script-delay/minification plugins.
Clear WordPress/CDN caches after updates. Do not cache future private API responses.

## 5. Update safely

Edit source locally, run tests and build, then replace the existing snippet with the new generated
file. Back up its previous contents first. Do not edit the generated file as the source of truth.
Storage schema version 1 is retained across rebuilds; future incompatible schemas need migration.

## Official references

- [WordPress Shortcode API](https://developer.wordpress.org/plugins/shortcodes/)
- [WordPress wp_footer hook](https://developer.wordpress.org/reference/hooks/wp_footer/)
