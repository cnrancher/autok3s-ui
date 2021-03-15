import {onBeforeUnmount, ref, readonly} from 'vue'

const encoder = new TextEncoder() 
const encode = (data) => {
  return encoder.encode(data)
}
export const CLOSED = 'disconnect'
export const CONNECTING = 'connecting'
export const CONNECTED = 'connected'
export const ERROR = 'error'


export default function useSocket(socketUrl, eventCallback) {
  
  if (!socketUrl) {
    throw new Error('WebSocket url is required')
  }
  let socket = null
  const readyState = ref(CLOSED)
  // const cache = []
  const onClose = (e) => {
    close(e)
  }
  const onOpen = (e) => {
    readyState.value = CONNECTED
    console.log(`socket open: ${socketUrl}`)
    eventCallback?.open?.(e)
  }
  const onMessage =  (e) => {
    eventCallback?.message?.(e)
  }
  const onError = (e) => {
    readyState.value = ERROR
    console.log(`socket error(${socketUrl}):`, e)
    eventCallback?.error?.(e)
  }
  const close = (e) => {
    readyState.value = CLOSED
    if (socket) {
      console.log(`socket close: ${socketUrl}`)
      socket.removeEventListener('close', onClose)
      socket.removeEventListener('error', onError)
      socket.removeEventListener('message', onMessage)
      socket.removeEventListener('open', onOpen)
      socket.close(1000)
      socket = null
      eventCallback?.close?.(e)
    }
  }
  onBeforeUnmount(close)
  const disconnect = () => {
    close()
  }
  const connect = () => {
    if (socket) {
      return socket
    }
    console.log(`socket connecting: ${socketUrl}`)
    readyState.value = CONNECTING
    socket = new WebSocket(socketUrl)
    socket.addEventListener('close', onClose)
    socket.addEventListener('error', onError)
    socket.addEventListener('message',onMessage)
    socket.addEventListener('open', onOpen)
    return socket
  }
  const send = (msg) => {
    if (readyState.value !== CONNECTED) {
      return
    }
    socket?.send(msg)
  }
  return {
    readyState: readonly(readyState),
    connect,
    send,
    disconnect
  }
}