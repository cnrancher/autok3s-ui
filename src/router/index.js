import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layouts/default/index.vue'
import NotFound from '@/views/error-page/NotFound.vue'
import clusterExplorerRouter from './modules/clusterExplorer.js'
import examplesRouter from './modules/examples.js'
import { getBasePath } from '@/utils/index.js'

export const constantRoutes = [
  {
    path: '/',
    component: Layout,
    redirect: '/cluster-explorer',
    hidden: true
  },
  clusterExplorerRouter,
  { path: '/:pathMatch(.*)*', name: 'not-found', hidden: true, component: NotFound },
]

if (!import.meta.env.PROD) {
  constantRoutes.splice(1, 0, examplesRouter)
}

const router = createRouter({
  history: createWebHistory(getBasePath()),
  routes: constantRoutes,
})

export default router