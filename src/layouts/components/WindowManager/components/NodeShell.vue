<template>
  <window>
    <template #default>
      <div ref="xterm" class="h-full overflow-hidden"></div>
    </template>
    <template #footer>
      <k-button class="btn-sm role-primary" @click="clear">Clear</k-button>
      <div class="capitalize" :class="stateToClassMap[status]">{{readyState}}</div>
    </template>
  </window>
</template>
<script>
import Window from './Window.vue'
import {defineComponent, computed, ref, watchEffect, nextTick, inject, watch} from 'vue'
import KButton from '@/components/Button'
import useTerminal from '@/composables/useTerminal.js'
import { useResizeObserver } from '@vueuse/core'
import {DONE} from '@/composables/useTerminal.js'
import { useWebSocket } from '@vueuse/core'
import useNotificationStore from '@/store/useNotificationStore.js'
import useWindownManagerStore from '@/store/useWindowManagerStore.js'

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

export default defineComponent({
  name: 'NodeShell',
  props: {
    clusterId: {
      type: String,
      required: true,
    },
    nodeId: {
      type: String,
      required: true,
    },
    provider: {
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
  },
  setup(props) {
    const wmStore = useWindownManagerStore()
    const notificationStore = useNotificationStore()
    const xterm = ref(null)
    const url = `${location.protocol.replace('http', 'ws')}//${location.host}${import.meta.env.VITE_APP_BASE_API}/mutual?provider=${props.provider}&cluster=${props.clusterId}&node=${props.nodeId}`

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
              content: `Disconnect from the node(${props.nodeId}). Please confirm whether the related service is running normally`
            })
          }
        },
        onConnected() {
          fitTerminal()
          focus()
        },
        async onMessage(_, e) {
          const msg = await e.data.text()
          write(msg)
        },
        onDisconnected(_, e) {
          if (e?.code === 1000) {
            close()
            wmStore.removeTab(`node-shell_${props.nodeId}`)
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
      // const dimensions = fit()
      // let p = {width: defaultWidth, height: defaultHeight}
      // if (dimensions) {
      //   p.width = dimensions.cols
      //   p.height = dimensions.rows
      // }
      // setQuery(p)
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
      if ( status.value === 'CLOSED') {
        close()
        open()
      }
    })

    return {
      xterm,
      readyState,
      status,
      clear,
      stateToClassMap,
    }
  },
  components: {
    Window,
    KButton,
  }
})
</script>
