<template>
<div>
  <router-view/>
  <k-notification></k-notification>
</div>
</template>

<script>
import { provide, watchEffect, defineComponent } from 'vue'
import useThemeStore from '@/store/useThemeStore.js'
import useNotificationStore from '@/store/useNotificationStore.js'
import useClusterStore from '@/store/useClusterStore.js'
import useTemplateStore from '@/store/useTemplateStore.js'
import useWindownManagerStore from '@/store/useWindowManagerStore.js'
import useExplorerStore from '@/store/useExplorerStore.js'
import useResourceChangeSocket from '@/composables/useResourceChangeSocket.js'
export default defineComponent({
  name: 'App',
  setup() {
    const {state} = useThemeStore()
    watchEffect(() => {
      const removeThemes = state.themes.filter((t) => t !== state.theme);
      document.body.classList.remove(...removeThemes);
      document.body.classList.add(state.theme);
    })
    provide('theme', state)
    const notificationStore = useNotificationStore()
    provide('notificationStore', notificationStore)
    const windowManagerStore = useWindownManagerStore()
    provide('windowManagerStore', windowManagerStore)
    const clusterStore = useClusterStore(windowManagerStore)
    provide('clusterStore', clusterStore)
    const templateStore = useTemplateStore()
    provide('templateStore', templateStore)
    const explorerStore = useExplorerStore()
    provide('explorerStore', explorerStore)

    const {subscribe, connect} = useResourceChangeSocket()
    const clusterMessageHandler = useDebounceMessage(handleWebsocketMessage({
      'resource.change': clusterStore.action.updateCluster,
      'resource.create': clusterStore.action.addCluster,
      'resource.remove': (data) => {
        clusterStore.action.removeCluster(data);
        explorerStore.action.removeExplorer(data);
      },
    }))
    subscribe('cluster', (msg) => {
      if (msg.resourceType === 'cluster'
        && msg.name 
        && ['resource.change', 'resource.create', 'resource.remove'].includes(msg.name)) {
          clusterMessageHandler(msg)
      }
    }, clusterStore.action.syncClusters)
    const templateMessageHandler = useDebounceMessage(handleWebsocketMessage({
      'resource.change': templateStore.action.updateTemplate,
      'resource.create': templateStore.action.addTemplate,
      'resource.remove': templateStore.action.removeTemplate,
    }))

    const explorerMessageHandler = useDebounceMessage(handleWebsocketMessage({
      'resource.change': explorerStore.action.updateExplorer,
      'resource.create': explorerStore.action.addExplorer,
      'resource.remove': explorerStore.action.removeExplorer,
    }))

    subscribe('clusterTemplate', (msg) => {
      if (msg.resourceType === 'clusterTemplate'
        && msg.name 
        && ['resource.change', 'resource.create', 'resource.remove'].includes(msg.name)) {
          templateMessageHandler(msg)
      }
    }, templateStore.action.syncTemplates)
    subscribe('explorer', (msg) => {
      if (msg.resourceType === 'explorer'
        && msg.name
        && ['resource.change', 'resource.create', 'resource.remove'].includes(msg.name)) {
          explorerMessageHandler(msg)
      }
    }, explorerStore.action.syncExplorers)
    connect()
  },
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

<style>

</style>