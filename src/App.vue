<template>
  <div>
    <router-view />
    <k-notification></k-notification>
  </div>
</template>

<script>
import { watchEffect, defineComponent } from 'vue'
import useThemeStore from '@/store/useThemeStore.js'
import usePackageStore from '@/store/usePackageStore.js'
import useProviderClusterStores from '@/store/useProviderClusterStores.js'
import useTemplateStore from '@/store/useTemplateStore.js'
// import useWindownManagerStore from '@/store/useWindowManagerStore.js'
import useExplorerStore from '@/store/useExplorerStore.js'
import useResourceChangeSocket from '@/composables/useResourceChangeSocket.js'
export default defineComponent({
  name: 'App',
  setup() {
    const providerClusterStores = useProviderClusterStores()
    const templateStore = useTemplateStore()
    const themeStore = useThemeStore()
    const packageStore = usePackageStore()

    watchEffect(() => {
      const removeThemes = themeStore.themes.filter((t) => t !== themeStore.theme)
      document.body.classList.remove(...removeThemes)
      document.body.classList.add(themeStore.theme)
    })

    // const wmStore = useWindownManagerStore()

    const explorerStore = useExplorerStore()

    const { subscribe, connect } = useResourceChangeSocket()
    const clusterMessageHandler = useDebounceMessage(
      handleWebsocketMessage({
        'resource.change': (cluster) => {
          const provider = cluster?.provider
          providerClusterStores[provider]?.update(cluster)
        },
        'resource.create': (cluster) => {
          const provider = cluster?.provider
          providerClusterStores[provider]?.add(cluster)
          // view create logs
          // wmStore.addTab({
          //   id: `log_${cluster.id}`,
          //   component: 'ClusterLogs',
          //   label: `log: ${cluster.name}`,
          //   icon: 'log',
          //   attrs: {
          //     cluster: cluster.id
          //   }
          // })
        },
        'resource.remove': (cluster) => {
          const provider = cluster?.provider
          providerClusterStores[provider]?.remove(cluster?.id)
          explorerStore.remove(cluster?.id)
        }
      })
    )
    subscribe(
      'cluster',
      (msg) => {
        if (
          msg.resourceType === 'cluster' &&
          msg.name &&
          ['resource.change', 'resource.create', 'resource.remove'].includes(msg.name)
        ) {
          clusterMessageHandler(msg)
        }
      },
      () => {
        Object.values(providerClusterStores).forEach((store) => {
          store.loadData()
        })
      }
    )
    const templateMessageHandler = useDebounceMessage(
      handleWebsocketMessage({
        'resource.change': templateStore.update,
        'resource.create': templateStore.add,
        'resource.remove': (t) => {
          templateStore.remove(t?.id)
        }
      })
    )

    const explorerMessageHandler = useDebounceMessage(
      handleWebsocketMessage({
        'resource.change': explorerStore.update,
        'resource.create': explorerStore.add,
        'resource.remove': explorerStore.remove
      })
    )

    const packageMessageHandler = useDebounceMessage(
      handleWebsocketMessage({
        'resource.change': packageStore.update,
        'resource.create': packageStore.add,
        'resource.remove': (t) => {
          packageStore.remove(t?.id)
        }
      })
    )

    subscribe(
      'clusterTemplate',
      (msg) => {
        if (
          msg.resourceType === 'clusterTemplate' &&
          msg.name &&
          ['resource.change', 'resource.create', 'resource.remove'].includes(msg.name)
        ) {
          templateMessageHandler(msg)
        }
      },
      templateStore.loadData
    )
    subscribe(
      'explorer',
      (msg) => {
        if (
          msg.resourceType === 'explorer' &&
          msg.name &&
          ['resource.change', 'resource.create', 'resource.remove'].includes(msg.name)
        ) {
          explorerMessageHandler(msg)
        }
      },
      explorerStore.loadData
    )
    subscribe(
      'package',
      (msg) => {
        if (
          msg.resourceType === 'package' &&
          msg.name &&
          ['resource.change', 'resource.create', 'resource.remove'].includes(msg.name)
        ) {
          packageMessageHandler(msg)
        }
      },
      packageStore.loadData
    )
    connect()
  }
})

function handleWebsocketMessage(messageHandler) {
  return (...messages) => {
    messages.forEach((msg) => {
      messageHandler[msg.name]?.(msg.data)
    })
  }
}

function useDebounceMessage(handler, delay = 300) {
  let cache = []
  let timeout = null
  return (msg) => {
    cache.push(msg)
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      handler(...cache)
      cache = []
    }, delay)
  }
}
</script>

<style></style>
