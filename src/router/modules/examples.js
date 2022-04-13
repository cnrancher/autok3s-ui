import Layout from '@/layouts/default/index.vue'

const exampleRouter = {
  path: '/examples',
  component: Layout,
  redirect: '/examples/form',
  hidden: import.meta.env.PROD,
  name: 'Examples',
  meta: {
    title: 'Examples'
  },
  children: [
    {
      path: 'form',
      component: () => import('@/views/examples/form/index.vue'),
      name: 'ExamplesForm',
      meta: {
        title: 'Form'
      }
    },
    {
      path: 'table',
      name: 'ExamplesTable',
      component: () => import('@/views/examples/table/index.vue'),
      meta: {
        title: 'Table'
      }
    },
    {
      path: 'tabs',
      name: 'ExamplesTabs',
      component: () => import('@/views/examples/tabs/index.vue'),
      meta: {
        title: 'Tabs'
      }
    },
    {
      path: 'notification',
      name: 'ExamplesNotification',
      component: () => import('@/views/examples/notification/index.vue'),
      meta: {
        title: 'Notification'
      }
    },
    {
      path: 'modal',
      name: 'ExamplesModal',
      component: () => import('@/views/examples/modal/index.vue'),
      meta: {
        title: 'Modal'
      }
    }
  ]
}

export default exampleRouter
