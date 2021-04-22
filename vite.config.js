import vue from '@vitejs/plugin-vue'
import html from 'vite-plugin-html'
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
      html({
        inject: {
          injectData: {
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
    base: './',
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