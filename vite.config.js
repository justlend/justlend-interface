// vite.config.js
import { defineConfig } from 'vite';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig(({ command }) => {
  const plugins = [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties', { loose: true }],
        ]
      }
    }),
    nodePolyfills({
      protocolImports: true,
      globals: {
        Buffer: true,
        process: true,
      }
    }),
    viteCommonjs()
  ];

  const postcssPlugins = [];

  if (command === 'build') {
    plugins.push(
      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: 'build/stats.html',
      })
    );
  }

  return {
    base: './',
    plugins: plugins,
    resolve: {
      alias: {
        'scheduler/unstable_mock': 'scheduler',
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 18113,
      open: true
    },
    optimizeDeps: {
      include: ['hash.js', '@binance/w3w-utils', 'buffer', 'echarts', 'node-rsa', '@tronweb3/tronwallet-adapters',
        '@tronweb3/tronwallet-adapter-binance'], // 强制包含深层依赖, 其中 'hash.js', '@binance/w3w-utils' 来自 tronwallet-adapter-binance
      esbuildOptions: {
        define: {
          global: 'globalThis'
        },
      },
      exclude: [
      // '@tronweb3/tronwallet-adapters',
      // '@tronweb3/tronwallet-adapter-binance',
      ]
    },
    define: {
    },
    css: {
      postcss: {
        plugins: postcssPlugins,
      }
    },
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      exclude: ['node_modules', 'build', 'src/token.test.js'],
      setupFiles: './src/setupTests.js',
    },
    build: {
      outDir: 'build',
      commonjsOptions: {
        transformMixedEsModules: true
      },
      rollupOptions: {
        output: {
          manualChunks(id, { getModuleInfo }) {
            const normalizedId = path.normalize(id);
            if (normalizedId.includes('node_modules')) {
              if (normalizedId.includes('node_modules/echarts/')) return 'vendor-echarts';
              if (normalizedId.includes('node_modules/tronweb')) return 'vendor-tronweb';
              if (normalizedId.includes('node_modules/@walletconnect')) return 'vendor-walletconnect';
              if (normalizedId.includes('lodash')) return 'vendor-lodash';
              if (normalizedId.includes('bignumber.js')) return 'vendor-bignumber';
              if (normalizedId.includes('ethers')) return 'vendor-ethers';
              if (normalizedId.includes('node-forge')) return 'vendor-forge';
            }
          }
        }
      }
    }
  };
});
