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
import useSettingStore from '@/store/useSettingStore.js'
import useProviderClusterStores from '@/store/useProviderClusterStores.js'
import useTemplateStore from '@/store/useTemplateStore.js'
// import useWindownManagerStore from '@/store/useWindowManagerStore.js'
import useExplorerStore from '@/store/useExplorerStore.js'
import useSshKeyStore from '@/store/useSshKeyStore.js'
import useAddonStore from '@/store/useAddonStore.js'
import useResourceChangeSocket from '@/composables/useResourceChangeSocket.js'
export default defineComponent({
  name: 'App',
  setup() {
    const providerClusterStores = useProviderClusterStores()
    const templateStore = useTemplateStore()
    const themeStore = useThemeStore()
    const packageStore = usePackageStore()
    const sshKeyStore = useSshKeyStore()
    const settingStore = useSettingStore()
    const addonStore = useAddonStore()

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
          if (cluster?.status?.status?.toLowerCase() === 'running') {
            providerClusterStores[provider]?.loadData()
          }
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
        return Promise.all(Object.values(providerClusterStores).map((store) => store.loadData()))
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

    const sshKeyMessageHandler = useDebounceMessage(
      handleWebsocketMessage({
        'resource.change': sshKeyStore.update,
        'resource.create': sshKeyStore.add,
        'resource.remove': (t) => {
          sshKeyStore.remove(t?.id)
        }
      })
    )

    const settingMessageHandler = useDebounceMessage(
      handleWebsocketMessage({
        'resource.change': settingStore.update,
        'resource.create': settingStore.add,
        'resource.remove': (t) => {
          settingStore.remove(t?.id)
        }
      })
    )

    const addonMessageHandler = useDebounceMessage(
      handleWebsocketMessage({
        'resource.change': addonStore.update,
        'resource.create': addonStore.add,
        'resource.remove': (t) => {
          addonStore.remove(t?.id)
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

    subscribe(
      'sshKey',
      (msg) => {
        if (
          msg.resourceType === 'sshKey' &&
          msg.name &&
          ['resource.change', 'resource.create', 'resource.remove'].includes(msg.name)
        ) {
          sshKeyMessageHandler(msg)
        }
      },
      sshKeyStore.loadData
    )

    subscribe(
      'setting',
      (msg) => {
        if (
          msg.resourceType === 'setting' &&
          msg.name &&
          ['resource.change', 'resource.create', 'resource.remove'].includes(msg.name)
        ) {
          settingMessageHandler(msg)
        }
      },
      settingStore.loadData
    )

    subscribe(
      'addon',
      (msg) => {
        if (
          msg.resourceType === 'addon' &&
          msg.name &&
          ['resource.change', 'resource.create', 'resource.remove'].includes(msg.name)
        ) {
          addonMessageHandler(msg)
        }
      },
      addonStore.loadData
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
