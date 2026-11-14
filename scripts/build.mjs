import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pages } from '../src/config.js';

/** Small dependency-free bundler for this project's flat, named ESM modules.
 * Keep imports on one line. Do not add default exports or duplicate top-level names.
 * Generated files are deployment artifacts; edit src/ and rebuild instead.
 */
const sources = ['config.js', 'core/model.js', 'core/storage.js', 'core/ui.js', ...['dashboard', 'daily-log', 'indicators', 'actions', 'environment', 'wellbeing', 'report', 'profile'].map(name => `modules/${name}.js`), 'app.js'];
const css = await readFile('src/styles.css', 'utf8');
const chunks = await Promise.all(sources.map(async path => `// Source: src/${path}\n` + (await readFile(`src/${path}`, 'utf8')).replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '')));
const js = `(() => {\n'use strict';\n${chunks.join('\n')}\n})();`;
if (js.includes('</script') || css.includes('</style')) throw new Error('Unsafe inline closing tag in source.');
const phpPages = pages.map(([key, label, shortcode]) => `        '${key}' => array( 'label' => '${label}', 'shortcode' => '${shortcode}' ),`).join('\n');
const php = `<?php
/**
 * BY STAR Mission Health v0.1.0 — generated WordPress snippet.
 * Paste without the opening PHP tag into a PHP snippet; run everywhere.
 * Alternatively install this file as a plugin. Never enable both methods.
 * Plugin Name: BY STAR Mission Health Demo
 * Description: Modular browser-local health monitoring demonstration.
 * Version: 0.1.0
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! class_exists( 'By_Star_Mission_Health_V1' ) ) {
final class By_Star_Mission_Health_V1 {
    private static $used = false;
    public static function pages() {
        return array(
${phpPages}
        );
    }
    public static function register() {
        foreach ( self::pages() as $key => $definition ) {
            add_shortcode( $definition['shortcode'], function () use ( $key ) {
                self::$used = true;
                $links = array();
                foreach ( self::pages() as $slug => $page ) {
                    $links[$slug] = home_url( '/mission-health/' . $slug . '/' );
                }
                // Override URL mapping in a separate snippet when using different slugs.
                $links = apply_filters( 'by_star_page_urls', $links );
                return '<div class="star-app" data-page="' . esc_attr( $key ) . '" data-links="' . esc_attr( wp_json_encode( $links ) ) . '"><p>Loading mission health demo… JavaScript is required.</p></div>';
            } );
        }
    }
    public static function assets() {
        if ( ! self::$used ) { return; }
        // One shared asset payload per request, even with multiple shortcodes.
        echo <<<'BY_STAR_CSS'
<style id="by-star-styles">
${css}
</style>
BY_STAR_CSS;
        echo <<<'BY_STAR_JS'
<script id="by-star-app">
${js}
</script>
BY_STAR_JS;
    }
}
add_action( 'init', array( 'By_Star_Mission_Health_V1', 'register' ) );
add_action( 'wp_footer', array( 'By_Star_Mission_Health_V1', 'assets' ), 30 );
}
`;
await mkdir('wordpress/snippets', { recursive: true });
await mkdir('dist', { recursive: true });
await writeFile('wordpress/snippets/by-star-app.php', php);
await writeFile('dist/app.js', js);
await writeFile('dist/styles.css', css);
await writeFile('dist/index.html', '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BY STAR · Mission Health</title><link rel="stylesheet" href="styles.css"></head><body style="margin:0;background:#0c1423"><div class="star-app" data-preview></div><script src="app.js" defer></script></body></html>\n');
console.log('Built WordPress snippet and standalone preview.');
