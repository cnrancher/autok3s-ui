<template>
  <WindowContainer>
    <template #default>
      <div ref="xterm" class="h-full overflow-hidden"></div>
    </template>
    <template #footer>
      <k-button class="btn-sm role-primary" @click="clear">Clear</k-button>
      <div class="capitalize" :class="stateToClassMap[status]">{{readyState}}</div>
    </template>
  </WindowContainer>
</template>
<script>
const stateToClassMap = {
  CLOSED: 'text-error',
  CONNECTING: 'text-info',
  OPEN: 'text-success',
}
const stateMap = {
  CLOSED: 'Close',
  CONNECTING: 'Connecting',
  OPEN: 'Connected',
}

const textEncoder = new TextEncoder()
const defaultWidth = 20
const defaultHeight = 40

export default {
  name: 'KubectlShell',
}
</script>
<script setup>
import WindowContainer from './WindowContainer.vue'
import { computed, nextTick, ref, watchEffect, watch} from 'vue'
import KButton from '@/components/Button'
import useTerminal from '@/composables/useTerminal.js'
import { useResizeObserver } from '@vueuse/core'
import {DONE} from '@/composables/useTerminal.js'
import { useWebSocket } from '@vueuse/core'
import useNotificationStore from '@/store/useNotificationStore.js'
import useWindownManagerStore from '@/store/useWindowManagerStore.js'

const props = defineProps({
  contextId: {
    type: String,
    required: true,
  },
  show: {
    type: Boolean,
    required: true,
  },
  renewCount: {
    type: [Number],
    default: 0
  }
})

const wmStore = useWindownManagerStore()
const notificationStore = useNotificationStore()
const xterm = ref(null)
const url = `${location.protocol.replace('http', 'ws')}//${location.host}${import.meta.env.VITE_APP_BASE_API}/config/${props.contextId}`
// let lines = []
const {clear, focus, write, fit, readyState: xtermReadyState} = useTerminal(xterm, (input) => {
  const d = textEncoder.encode(input)
  send(d)
}, {
    cursorBlink:  true,
    useStyle:     true,
    fontSize:     12,
  })
const { status, send, open, close } = useWebSocket(url, {
  immediate: false,
  autoReconnect: {
    retries: 3,
    delay: 3000,
    onFailed() {
      notificationStore.notify({
        type: 'error',
        duration: 0,
        title: 'Websocket Disconnect',
        content: `Disconnect from autoK3s service(contextId:${props.contextId}). Please confirm whether the autoK3s service is running normally`
      })
    }
  },
  onConnected() {
    fitTerminal()
    focus()
    // lines=0
    // send(textEncoder.encode(`alias kubectl='kubectl --context ${props.contextId}' \n`))
    // send(textEncoder.encode("# If you want to run other command instead of kubectl, for example, if you're going to use `helm`, you can try `helm --kube-context " + props.contextId + "`\n"))
    // send(textEncoder.encode("# If you want to set global kubeconfig context, please run `kubectl config use-context " + props.contextId + "`\n"))
    write("# If you want to run other command instead of kubectl, for example, if you're going to use `helm`, you can try `helm --kube-context " + props.contextId + "`\r\n")
    write("# If you want to set global kubeconfig context, please run `kubectl config use-context " + props.contextId + "`\r\n")
  },
  async onMessage(_, e) {
    const msg = await e.data.text()
    // if (lines<2 && ['\r\n', '\r', '\n'].includes(msg.slice(-1))) {
    //   lines++
    //   return
    // }
    write(msg)
  },
  onDisconnected(_, e) {
    if (e?.code === 1000) {
      close()
      wmStore.removeTab(`kubectl_${props.contextId}`)
    }
  }
})

const readyState = computed(() => {
  return stateMap[status.value]
})
const fitTerminal = () => {
  const dimensions = fit()
  if (!dimensions) {
    return
  }
  const { rows=defaultHeight, cols=defaultWidth } = dimensions
  send(JSON.stringify({
    width:  Math.floor(cols),
    height: Math.floor(rows),
  }))
}

let stopWatch = watchEffect(() => {
  if (xtermReadyState.value !== DONE) {
    return
  }
  open()
  stopWatch()
  stopWatch = null
})
watchEffect(() => {
  if (props.show) {
    nextTick(() => {
      fitTerminal()
    })
  }
})
useResizeObserver(xterm, () => {
  if (props.show) {
    fitTerminal()
  }
})

watch(() => props.renewCount, () => {
  if (status.value === 'CLOSED') {
    close()
    open()
  }
})
</script>
