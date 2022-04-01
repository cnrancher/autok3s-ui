import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from 'vite-plugin-html'
import WindiCSS from 'vite-plugin-windicss'
import { loadEnv } from 'vite'
import { resolve } from 'path'

/**
 * @type {import('vite').UserConfig}
 */
export default ({ command, mode }) => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const isBuild = command === 'build'
  const packageVersion = process.env.VITE_ENV_version || process.env.npm_package_version
  return {
    plugins: [
      vue(),
      WindiCSS(),
      createHtmlPlugin({
        inject: {
          data: {
            title: env.VITE_APP_TITLE,
            basePath: env.VITE_APP_BASE_PATH,
          },
        },
        minify: isBuild,
      }),
    ],
    resolve: {
      alias: [{ find: '@', replacement: resolve(__dirname, './src') }]
    },
    define: {
      '__VERSION__': JSON.stringify(packageVersion)
    },
    // base: './',
    base: process.env.UI_BASE_PATH ? process.env.UI_BASE_PATH : './',
    server: {
      proxy: {
        '/v1': {
          target: 'http://localhost:8080',
          ws: true,
        },
      }
    },
    build: {
      outDir: 'dist/static'
    }
  }
}