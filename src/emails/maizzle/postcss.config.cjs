/**
 * PostCSS configuration for Maizzle email templates
 * Processes CSS for email client compatibility
 */

module.exports = {
  plugins: [
    // Tailwind CSS processing
    require('tailwindcss')('./src/emails/maizzle/tailwind.config.cjs'),

    // Autoprefixer for vendor prefixes
    require('autoprefixer')({
      // Email client specific prefixes
      overrideBrowserslist: [
        'last 2 versions',
        'iOS >= 10',
        'Android >= 4.4',
        'Outlook 2007',
        'Outlook 2010',
        'Outlook 2013',
        'Outlook 2016',
        'Outlook 2019',
      ],
    }),

    // PostCSS Preset Env for modern CSS features
    require('postcss-preset-env')({
      stage: 1,
      features: {
        // Disable features that aren't email-safe
        'nesting-rules': false,
        'custom-properties': false,
        'custom-selectors': false,
        'media-query-ranges': false,
        'custom-media-queries': false,
        'gap-properties': false,
        'place-properties': false,
        'logical-properties-and-values': false,
        'is-pseudo-class': false,
        'focus-within-pseudo-class': false,
        'focus-visible-pseudo-class': false,
        'any-link-pseudo-class': false,
        'prefers-color-scheme-query': false,
        'prefers-reduced-motion-query': false,
      },
    }),

    // Remove unused CSS (will be handled by Maizzle)
    ...(process.env.NODE_ENV === 'production'
      ? [
          require('@fullhuman/postcss-purgecss')({
            content: ['./src/emails/maizzle/src/**/*.html'],
            defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
            safelist: [
              // Preserve Maizzle specific classes
              /^maizzle-/,
              // Preserve responsive classes
              /^sm:/,
              /^md:/,
              /^lg:/,
              /^xl:/,
              // Preserve state classes
              /^hover:/,
              /^focus:/,
              /^active:/,
              // Preserve email-specific classes
              'email-body',
              'email-container',
              'email-button',
              'email-responsive',
              'table-fixed-layout',
              'table-auto-layout',
              'mso-hide',
              'outlook-hide',
            ],
          }),
        ]
      : []),

    // CSS Nano for production minification
    ...(process.env.NODE_ENV === 'production'
      ? [
          require('cssnano')({
            preset: [
              'default',
              {
                // Email-safe optimizations
                discardComments: {
                  removeAll: true,
                },
                normalizeWhitespace: true,
                colormin: true,
                convertValues: {
                  length: false, // Don't convert px to other units for email compatibility
                },
                mergeRules: false, // Don't merge rules to avoid specificity issues
                mergeLonghand: false, // Keep longhand properties for email client compatibility
                discardUnused: false, // Let Maizzle handle unused CSS removal
                autoprefixer: false, // We handle autoprefixer separately
                cssDeclarationSorter: false, // Don't sort declarations
              },
            ],
          }),
        ]
      : []),
  ],
};
