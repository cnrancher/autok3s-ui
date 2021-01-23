import {onBeforeUnmount, ref, watchEffect} from 'vue'
export default function useSocketRetry(connect, disconnect, retryFailed) {
  const maxRetries = ref(3)
  const period = ref(0) // 毫秒
  let retryCount = 0
  let lastCloseTime = null
  let timer = null
  let socket = null
  const tryToConnect = () => {
    const preCloseTime = lastCloseTime
    lastCloseTime = new Date().getTime()
    // first run
    if (!preCloseTime) {
      connectWebSocket(true)
      return
    }
    // run only once
    if (maxRetries.value === 0) {
      stop()
      retryFailed?.()
      return
    }

    // retry forever
    if (maxRetries.value < 0) {
      // limit retry frequency
      if (period.value > 0) {
        if (timer) {
          window.clearTimeout(timer)
          timer = null
        }
        timer = window.setTimeout(() => {
          timer = null
          connectWebSocket()
        }, period.value)
        return
      }
      // run now
      connectWebSocket()
      return
    }

    // retry limit maxRetries
    // stop
    if (retryCount + 1 > maxRetries.value) {
      stop()
      retryFailed?.()
      return
    }
    // limit retry frequency
    if (period.value > 0) {
      if (timer) {
        window.clearTimeout(timer)
        timer = null
      }
      timer = window.setTimeout(() => {
        timer = null
        connectWebSocket()
      }, period.value)
      return
    }
    // run now
    connectWebSocket()
    return
  }
  const resetRetryCount = () => {
    retryCount = 0
  }
  const addEventListener = () => {
    socket?.addEventListener('open', resetRetryCount)
    socket?.addEventListener('close', tryToConnect)
  }
  const removeEventListener = () => {
    socket?.removeEventListener('open', resetRetryCount)
    socket?.removeEventListener('close', tryToConnect)
  }
  const connectWebSocket = (first = false) => {
    if (!first) {
      retryCount++
      console.log(`try to reconnect: ${retryCount}`)
    }
    removeEventListener()
    socket = connect()
    addEventListener()
  }
  const start = () => {
    removeEventListener()
    tryToConnect()
  }
  const stop = () => {
    if (timer) {
      window.clearTimeout(timer)
      timer = null
    }
    retryCount = 0
    lastCloseTime = null
    removeEventListener()
    disconnect()
    socket = null
  }

  onBeforeUnmount(() => {
    stop()
  })

  return {
    maxRetries,
    period,
    start,
    stop,
  }
}