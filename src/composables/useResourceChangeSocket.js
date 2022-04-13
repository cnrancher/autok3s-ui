import { onBeforeUnmount } from 'vue'
import { getRootPath } from '@/utils/index.js'
import { useWebSocket } from '@vueuse/core'

export default function useResourceChangeSocket() {
  const url = `${window.location.origin.replace(/^http/, 'ws')}${getRootPath()}${
    import.meta.env.VITE_APP_BASE_API
  }/subscribe`
  // cache: {
  // 	resouceType: {
  // 		subscribed: false,
  // 		listeners: [{callback, synMethod}]
  // 	}
  // }
  let cache = {}

  const { open, close, send, status } = useWebSocket(url, {
    immediate: false,
    autoReconnect: {
      retries: 6,
      delay: 10000,
      onFailed() {
        window.location.reload()
      }
    },
    onConnected() {
      Object.entries(cache).forEach(([resourceType, item]) => {
        const promises = item.listeners
          .filter(({ syncMethod }) => syncMethod && typeof syncMethod === 'function')
          .map(({ syncMethod }) => syncMethod())
        Promise.allSettled(promises).then(() => {
          send(JSON.stringify({ resourceType: `${resourceType}s` }))
          item.subscribed = true
        })
      })
    },
    onDisconnected() {
      Object.values(cache)
        .filter((item) => item.subscribed)
        .forEach((item) => {
          item.subscribed = false
        })
    },
    onMessage(_, e) {
      const data = e.data
      if (!data) {
        return
      }
      try {
        const msg = JSON.parse(data)
        cache[msg.resourceType]?.listeners?.forEach(({ callback }) => {
          callback(msg)
        })
      } catch (err) {
        console.error(err)
      }
    }
  })

  const checkArgs = (resourceType, callback) => {
    if (!resourceType || !callback || typeof callback !== 'function') {
      throw new Error('resourceType, callback and syncMethod are required, callback must be a function')
    }
  }
  const subscribe = (resourceType, callback, syncMethod) => {
    checkArgs(resourceType, callback, syncMethod)
    if (!Reflect.has(cache, resourceType)) {
      cache[resourceType] = {
        subscribed: false,
        listeners: []
      }
    }
    if (cache[resourceType].listeners.find(({ callback: c, syncMethod: s }) => c === callback && s === syncMethod)) {
      return
    }
    cache[resourceType].listeners.push({ callback, syncMethod })
    if (status.value !== 'OPEN') {
      return
    }
    if (syncMethod && typeof syncMethod === 'function') {
      syncMethod().finally(() => {
        if (status.value !== 'OPEN') {
          return
        }
        if (!cache[resourceType].subscribed) {
          send(JSON.stringify({ resourceType: `${resourceType}s` }))
          cache[resourceType].subscribed = true
        }
      })
    } else {
      if (!cache[resourceType].subscribed) {
        send(JSON.stringify({ resourceType: `${resourceType}s` }))
        cache[resourceType].subscribed = true
      }
    }
  }
  const unsubscribe = (resourceType, callback, syncMethod) => {
    checkArgs(resourceType, callback)
    if (!Reflect.has(cache, resourceType)) {
      return
    }
    const stack = cache[resourceType].listeners
    cache[resourceType].listeners = stack.filter(({ callback: c, syncMethod: s }) => c !== callback && s !== syncMethod)
  }
  const clear = () => {
    cache = {}
    close()
  }

  onBeforeUnmount(clear)

  return {
    subscribe,
    unsubscribe,
    connect: open,
    disconnect: close,
    readyState: status
  }
}
