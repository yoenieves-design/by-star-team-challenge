<?php
/**
 * BY STAR Mission Health Demo v0.2.0.
 * Paste into a PHP snippet without the opening PHP tag.
 * Upload dist/ contents to the configured versioned asset directory.
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! function_exists( 'by_star_demo_config' ) ) {
    function by_star_demo_config() {
        $uploads = wp_upload_dir( null, false );
        return array(
            'asset_base' => trailingslashit( $uploads['baseurl'] ) . 'by-star/v0.2.0/',
            'version'    => '0.2.0',
            // Use full page paths relative to this WordPress site's home.
            'paths'      => array(
                'health'   => 'mission-health/health',
                'assist'   => 'mission-health/assist',
                'exercise' => 'mission-health/exercise',
                'profiles' => 'mission-health/profiles',
            ),
        );
    }

    function by_star_demo_enqueue() {
        $config = by_star_demo_config();
        $base = trailingslashit( $config['asset_base'] );
        wp_enqueue_style( 'by-star-demo', $base . 'assets/by-star-app.css', array(), $config['version'] );
        wp_enqueue_script( 'by-star-demo', $base . 'assets/by-star-app.js', array(), $config['version'], true );
    }

    function by_star_demo_maybe_enqueue() {
        $post = get_queried_object();
        if ( ! is_singular() || ! ( $post instanceof WP_Post ) ) {
            return;
        }
        foreach ( array_keys( by_star_demo_config()['paths'] ) as $page ) {
            if ( has_shortcode( $post->post_content, 'by_star_' . $page ) ) {
                by_star_demo_enqueue();
                return;
            }
        }
    }

    function by_star_demo_register() {
        foreach ( array_keys( by_star_demo_config()['paths'] ) as $page ) {
            add_shortcode( 'by_star_' . $page, function () use ( $page ) {
                $config = by_star_demo_config();
                $links = array();
                foreach ( $config['paths'] as $key => $path ) {
                    $path = trim( $path, '/' );
                    $post = get_page_by_path( $path, OBJECT, 'page' );
                    $links[$key] = $post ? get_permalink( $post ) : home_url( '/' . $path . '/' );
                }
                // Also enqueue for shortcodes rendered through templates or reusable blocks.
                by_star_demo_enqueue();
                return sprintf(
                    '<div class="bs-app alignwide" lang="en" data-page="%1$s" data-asset-base="%2$s" data-links="%3$s"><p>Loading BY STAR. JavaScript is required.</p></div>',
                    esc_attr( $page ),
                    esc_url( trailingslashit( $config['asset_base'] ) ),
                    esc_attr( wp_json_encode( $links ) )
                );
            } );
        }
    }

    add_action( 'init', 'by_star_demo_register' );
    add_action( 'wp_enqueue_scripts', 'by_star_demo_maybe_enqueue' );
}
