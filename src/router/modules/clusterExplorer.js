import Layout from '@/layouts/default/index.vue'

const clusterExplorerRouter = {
  path: '/cluster-explorer',
  component: Layout,
  redirect: '/cluster-explorer/quick-start',
  name: 'ClusterExplorer',
  meta: {
    title: 'AutoK3s UI',
    icon: 'set',
  },
  children: [
    {
      path: 'quick-start',
      component: () => import('@/views/cluster-explorer/quick-start/index.vue'),
      name: 'QuickStart',
      props: (route) => ({
        templateId: route.query.templateId,
        defaultProvider: route.query.defaultProvider,
      }),
      meta: { title: 'Quick start' }
    },
    {
      path: 'core',
      component: () => import('@/views/cluster-explorer/core/index.vue'),
      name: 'ClusterExplorerCore',
      meta: { title: 'Core' },
      children: [
        {
          path: 'clusters',
          component: () => import('@/views/cluster-explorer/core/clusters/index.vue'),
          name: 'ClusterExplorerCoreClusters',
          meta: { title: 'Clusters', icon: 'cluster' },
        },
        {
          path: 'clusters/create',
          component: () => import('@/views/cluster-explorer/core/clusters/create/index.vue'),
          name: 'ClusterExplorerCoreClustersCreate',
          props: (route)=> ({
            clusterId: route.query.clusterId,
            templateId: route.query.templateId,
            defaultProvider: route.query.defaultProvider,
            quickStart: route.query.quickStart
          }),
          hidden: true,
        },
        {
          path: 'clusters/detail/:clusterId',
          component: () => import('@/views/cluster-explorer/core/clusters/detail/index.vue'),
          name: 'ClusterExplorerCoreClustersDetail',
          props: true,
          hidden: true,
        },
      ],
    },
    {
      path: 'settings',
      component: () => import('@/views/cluster-explorer/settings/index.vue'),
      name: 'ClusterExplorerSettings',
      meta: { title: 'Settings' },
      children: [
        {
        path: 'credentials',
        component: () => import('@/views/cluster-explorer/settings/credentials/index.vue'),
        name: 'ClusterExplorerSettingsCredentials',
        meta: { title:'Credentials', icon: 'folder'}
      },
      {
        path: 'credentials/create',
        component: () => import('@/views/cluster-explorer/settings/credentials/create/index.vue'),
        name: 'ClusterExplorerSettingsCreate',
        hidden: true,
      },{
        path: 'credentials/edit/:credentialId',
        component: () => import('@/views/cluster-explorer/settings/credentials/edit/index.vue'),
        name: 'ClusterExplorerSettingsEdit',
        props: true,
        hidden: true,
      },
      {
        path: 'templates',
        component: () => import('@/views/cluster-explorer/settings/templates/index.vue'),
        name: 'ClusterExplorerSettingsTemplates',
        meta: { title: 'Templates', icon: 'cluster' },
      },
      {
        path: 'templates/detail/:templateId',
        component: () => import('@/views/cluster-explorer/settings/templates/detail/index.vue'),
        name: 'ClusterExplorerSettingsTemplatesDetail',
        props: true,
        hidden: true,
      },
      {
        path: 'templates/edit/:templateId',
        component: () => import('@/views/cluster-explorer/settings/templates/edit/index.vue'),
        name: 'ClusterExplorerSettingsTemplatesEdit',
        props: true,
        hidden: true,
      },
      {
        path: 'templates/create',
        component: () => import('@/views/cluster-explorer/settings/templates/create/index.vue'),
        name: 'ClusterExplorerSettingsTemplatesCreate',
        props: (route)=> ({
          clusterId: route.query.clusterId,
          templateId: route.query.templateId,
          defaultProvider: route.query.defaultProvider,
        }),
        hidden: true,
      },
    ],
    }
  ],
}

export default clusterExplorerRouter;