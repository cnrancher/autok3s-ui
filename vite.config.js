import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { createHtmlPlugin } from 'vite-plugin-html'
import WindiCSS from 'vite-plugin-windicss'
import { loadEnv } from 'vite'
import { fileURLToPath, URL } from 'url'

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
      vueJsx(),
      WindiCSS(),
      createHtmlPlugin({
        inject: {
          data: {
            title: env.VITE_APP_TITLE,
            basePath: env.VITE_APP_BASE_PATH
          }
        },
        minify: isBuild
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    define: {
      __VERSION__: JSON.stringify(packageVersion)
    },
    // base: './',
    base: process.env.UI_BASE_PATH ? process.env.UI_BASE_PATH : './',
    server: {
      proxy: {
        '/v1': {
          target: 'http://localhost:8080',
          ws: true
        }
      }
    },
    build: {
      outDir: 'dist/static'
    }
  }
}
