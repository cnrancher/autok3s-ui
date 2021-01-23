import { onBeforeUnmount } from 'vue'
import useSocket from '@/composables/useSocket.js'
import {CONNECTED} from '@/composables/useSocket.js'
import useSocketRetry from '@/composables/useSocketRetry.js'

export default function useResourceChangeSocket(notify) {
  const url = `${window.location.origin.replace(/^http/, 'ws') }${import.meta.env.VITE_APP_BASE_API}/subscribe`
  // cache: {
	// 	resouceType: {
	// 		subscribed: false,
	// 		listeners: [{callback, synMethod}]
	// 	}
	// }
  let cache = {} 

  const {readyState, connect, send, disconnect} = useSocket(url, {
    open: () => {
      Object.entries(cache).forEach(([resourceType, item]) => {
        const promises = item.listeners.filter(({syncMethod}) => syncMethod && typeof syncMethod === 'function')
          .map(({syncMethod}) => syncMethod())
          Promise.allSettled(promises).then(() => {
            send(JSON.stringify({resourceType: `${resourceType}s`}))
            item.subscribed = true
          })
      })
    },
    message: (e) => {
      const data = e.data
      if (!data) {
        return
      }
      try {
        const msg = JSON.parse(data)
        cache[msg.resourceType]?.listeners?.forEach(({callback}) => {
          callback(msg)
        })
      } catch (err) {
        console.error(error)
      }
    },
    close: () => {
      Object.values(cache).filter((item) => item.subscribed).forEach((item) => {
        item.subscribed = false
      })
    }
  })
  const {maxRetries, period, start, stop} = useSocketRetry(connect, disconnect, () => {
    window.location.reload()
  })
  maxRetries.value = 6
  period.value = 10000

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
        listeners: [],
      }
    }
    if (cache[resourceType].listeners.find(({callback: c, syncMethod: s}) => c === callback && s === syncMethod)) {
      return
    }
    cache[resourceType].listeners.push({callback, syncMethod})
    if (readyState.value !== CONNECTED) {
      return
    }
    if (syncMethod && typeof syncMethod === 'function') {
      syncMethod().finally(() => {
        if (readyState.value !== CONNECTED) {
          return
        }
        if (!cache[resourceType].subscribed) {
          send(JSON.stringify({resourceType: `${resourceType}s`}))
          cache[resourceType].subscribed = true
        }
      })
    } else {
      if (!cache[resourceType].subscribed) {
        send(JSON.stringify({resourceType: `${resourceType}s`}))
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
    cache[resourceType].listeners = stack.filter(({callback: c, syncMethod: s}) => c !== callback && s !== syncMethod)
  }
  const clear = () => {
    cache = {}
    stop()
  }

  onBeforeUnmount(clear)

  return {
    subscribe,
    unsubscribe,
    connect: start,
    disconnect: stop,
    readyState,
  }
}