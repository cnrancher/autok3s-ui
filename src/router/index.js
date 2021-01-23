import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layouts/default/index.vue'
import NotFound from '@/views/error-page/NotFound.vue'
import clusterExplorerRouter from './modules/clusterExplorer.js'
import examplesRouter from './modules/examples.js'

export const constantRoutes = [
  {
    path: '/',
    component: Layout,
    redirect: '/cluster-explorer',
    hidden: true
  },
  examplesRouter,
  clusterExplorerRouter,
  { path: '/:pathMatch(.*)*', name: 'not-found', hidden: true, component: NotFound },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes,
})

export default router