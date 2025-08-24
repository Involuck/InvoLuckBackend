/**
 * Maizzle configuration for InvoLuck Backend
 * Email template compilation and development server setup
 */

const path = require('path');

export default {
  // Build configuration
  build: {
    // Templates source directory
    templates: {
      source: path.resolve(__dirname, 'src'),
      destination: {
        path: path.resolve(__dirname, '../compiled'),
      },
    },

    // Layout options
    layouts: {
      source: path.resolve(__dirname, 'src/layouts'),
    },

    // Components
    components: {
      source: path.resolve(__dirname, 'src/components'),
    },

    // Tailwind CSS configuration
    tailwind: {
      css: path.resolve(__dirname, 'tailwind.config.cjs'),
    },

    // PostCSS configuration
    postcss: {
      config: path.resolve(__dirname, 'postcss.config.cjs'),
    },
  },

  // Environment configurations
  environments: {
    // Development configuration
    local: {
      build: {
        // Watch for changes
        watch: ['src/**/*'],

        // Serve files for development
        serve: {
          port: 3001,
          host: 'localhost',
        },
      },

      // Disable minification for development
      minify: false,
      prettify: true,

      // CSS inlining options
      inlineCSS: {
        enabled: true,
        keepOnlyAttributeSizes: {
          width: ['TABLE', 'TD', 'TH', 'IMG', 'VIDEO'],
          height: ['TABLE', 'TD', 'TH', 'IMG', 'VIDEO'],
        },
      },

      // Remove unused CSS
      removeUnusedCSS: {
        enabled: false, // Disabled for development
      },
    },

    // Production configuration
    production: {
      // Enable all optimizations for production
      minify: true,
      prettify: false,

      // CSS inlining for email clients
      inlineCSS: {
        enabled: true,
        mergeLonghand: true,
        keepOnlyAttributeSizes: {
          width: ['TABLE', 'TD', 'TH', 'IMG', 'VIDEO'],
          height: ['TABLE', 'TD', 'TH', 'IMG', 'VIDEO'],
        },
      },

      // Remove unused CSS for smaller file sizes
      removeUnusedCSS: {
        enabled: true,
        removeCSSComments: true,
        doNotRemoveCSS: ['.button', '.footer', '.container', '[class*="col-"]'],
      },

      // Transform for email clients
      applyTransformers: true,

      // Optimize for email clients
      cleanup: {
        removeEmptyElements: true,
        stripEmptyAttributes: true,
      },
    },
  },

  // Global data available in all templates
  data: {
    // Company information
    company: {
      name: 'InvoLuck',
      email: 'hello@involuck.dev',
      website: 'https://involuck.dev',
      address: {
        street: '123 Business St',
        city: 'Business City',
        state: 'BC',
        zip: '12345',
        country: 'United States',
      },
    },

    // Social links
    social: {
      twitter: 'https://twitter.com/involuck',
      linkedin: 'https://linkedin.com/company/involuck',
      github: 'https://github.com/involuck',
    },

    // Brand colors
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      light: '#f8f9fa',
      dark: '#343a40',
    },

    // Common strings
    strings: {
      unsubscribe: 'If you no longer wish to receive these emails, you can unsubscribe here.',
      privacyPolicy: 'Read our Privacy Policy',
      termsOfService: 'Terms of Service',
    },
  },

  // Transformers configuration
  transformers: {
    // Ensure compatibility with email clients
    ensureHtmlStructure: true,

    // Add missing attributes
    addAttributes: {
      table: {
        cellpadding: 0,
        cellspacing: 0,
        role: 'presentation',
      },
      img: {
        alt: '',
      },
    },

    // Outlook specific transformations
    outlook: {
      tag: 'o:outlook',
    },
  },

  // Juice options for CSS inlining
  juice: {
    applyStyleTags: true,
    removeStyleTags: true,
    applyLinkTags: true,
    removeLinkTags: true,
    preserveMediaQueries: true,
    preserveFontFaces: true,
    preserveKeyFrames: true,
    preservePseudos: true,
    insertPreservedExtraCss: true,
    applyWidthAttributes: true,
    applyHeightAttributes: true,
    applyAttributesTableElements: true,
    inlinePseudoElements: true,
    xmlMode: true,
    preserveImportant: true,
  },

  // Markdown configuration
  markdown: {
    root: './src',
    markdownItOptions: {
      html: true,
      breaks: true,
      linkify: true,
    },
  },

  // File extensions to process
  fileExtensions: {
    templates: 'html',
    layouts: 'html',
    components: 'html',
  },

  // Skip these files/folders during build
  skip: ['node_modules/**', 'src/assets/**', '*.DS_Store'],
};
