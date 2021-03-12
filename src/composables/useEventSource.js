import { onBeforeUnmount, ref } from 'vue'
export const CLOSED = 'disconnect'
export const CONNECTING = 'connecting'
export const CONNECTED = 'connected'
export const ERROR = 'error'

export default function useEventSource(url, eventCallback) {
  const readyState = ref(CLOSED)
  let eventSource = null
  const onClose = (e) => {
    close(e)
  }
  const onError = (e) => {
    readyState.value = ERROR
    console.log(`EventSource error(${url}):`, e)
    eventCallback?.error?.(e)
  }
  const onMessage = (e) => {
    eventCallback?.message?.(e)
  }
  const onOpen = (e) => {
    readyState.value=CONNECTED
    console.log(`EventSource open: ${url}`)
    eventCallback?.open?.(e)
  }
  const connect = () => {
    if (eventSource) {
      return eventSource
    }
    readyState.value = CONNECTING
    eventSource = new EventSource(url)
    eventSource.addEventListener('close', onClose)
    eventSource.addEventListener('error', onError)
    eventSource.addEventListener('message', onMessage)
    eventSource.addEventListener('open', onOpen)
    return eventSource
  }
  const close = (e) => {
    readyState.value = CLOSED
    if (eventSource) {
      console.log(`EventSource close: ${url}`)
      eventSource.removeEventListener('close', onClose)
      eventSource.removeEventListener('error', onError)
      eventSource.removeEventListener('message', onMessage)
      eventSource.removeEventListener('open', onOpen)
      eventSource.close()
      eventSource = null
      eventCallback?.close?.(e)
    }
  }
  onBeforeUnmount(close)
  return {
    readyState,
    connect,
    close
  }
}