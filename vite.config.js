import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { createHtmlPlugin } from 'vite-plugin-html'
import WindiCSS from 'vite-plugin-windicss'
import { loadEnv } from 'vite'
import { fileURLToPath, URL } from 'url'
import legacy from '@vitejs/plugin-legacy'

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
      }),
      legacy({
        targets: ['defaults', 'not IE 11']
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
        },
        '/meta/proxy': {
          target: 'http://localhost:8080'
        },
        '/k8s/proxy': {
          target: 'http://localhost:8080'
        }
      }
    },
    build: {
      outDir: 'dist/static'
    },
    test: {
      // 启用类似 jest 的全局测试 API
      globals: true,
      // 使用 happy-dom 模拟 DOM
      // 这需要你安装 happy-dom 作为对等依赖（peer dependency）
      environment: 'happy-dom'
    }
  }
}
