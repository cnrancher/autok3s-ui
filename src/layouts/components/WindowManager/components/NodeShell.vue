<template>
  <window>
    <template #default>
      <div ref="xterm" class="node-shell__body"></div>
    </template>
    <template #footer>
      <k-button class="btn-sm bg-primary" @click="clear">Clear</k-button>
      <div class="node-shell__connect-state" :class="stateToClassMap[readyState]">{{readyState}}</div>
    </template>
  </window>
</template>
<script>
import Window from './Window.vue'
import {defineComponent, ref, watchEffect, nextTick} from 'vue'
import KButton from '@/components/Button'
import {CLOSED, CONNECTING, CONNECTED} from '@/composables/useSocket.js'
import useSocket from '@/composables/useSocket.js'
import useSocketRetry from '@/composables/useSocketRetry.js'
import useTerminal from '@/composables/useTerminal.js'
import useResizeObserver from '@/composables/useResizeObserver.js'
import {DONE} from '@/composables/useTerminal.js'

const stateToClassMap = {
  [CLOSED]: 'text-error',
  [CONNECTING]: 'text-info',
  [CONNECTED]: 'text-success',
}

const textEncoder = new TextEncoder()

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
    }
  },
  setup(props) {
    const xterm = ref(null)
    const url = `${location.protocol.replace('http', 'ws')}//${location.host}${import.meta.env.VITE_APP_BASE_API}/mutual?provider=${props.provider}&cluster=${props.clusterId}&node=${props.nodeId}&width=150&height=300`

    const {clear, focus, write, fit, readyState: xtermReadyState} = useTerminal(xterm, (input) => {
      const d = textEncoder.encode(input)
      send(d)
    }, {
        cursorBlink:  true,
        useStyle:     true,
        fontSize:     12,
      })

    const {readyState, connect, send, disconnect} = useSocket(url, {
      message: async (e) => {
        const msg = await e.data.text()
        if (msg === 'ping') {
          return;
        }
        write(msg)
      },
      open: () => {
        fit()
        focus()
      }
    })
    const {maxRetries, period, start, stop} = useSocketRetry(connect, disconnect)
    maxRetries.value = -1
    period.value === 3000

    let stopWatch = watchEffect(() => {
      if (xtermReadyState.value !== DONE) {
        return
      }
      
      start()
      stopWatch()
      stopWatch = null
    })
    watchEffect(() => {
      if (props.show) {
        nextTick(() => {
          fit()
        })
      }
    })
    useResizeObserver(xterm, () => {
      if (props.show) {
        fit()
      }
    })
    return {
      xterm,
      readyState,
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
<style>
.node-shell__connect-state {
  text-transform:capitalize;
}
.node-shell__body {
  height: 100%;
  overflow: hidden;
}
</style>