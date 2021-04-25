<template>
  <window>
    <template #default>
      <div ref="xterm" class="kubectl-shell__body"></div>
    </template>
    <template #footer>
      <k-button class="btn-sm bg-primary" @click="clear">Clear</k-button>
      <div class="kubectl__connect-state" :class="stateToClassMap[readyState]">{{readyState}}</div>
    </template>
  </window>
</template>
<script>
import Window from './Window.vue'
import {defineComponent, nextTick, ref, watchEffect, inject, watch} from 'vue'
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
const defaultWidth = 20
const defaultHeight = 40

export default defineComponent({
  name: 'KubectlShell',
  props: {
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
  },
  setup(props) {
    const wmStore = inject('windowManagerStore')
    const notificationStore = inject('notificationStore')
    const xterm = ref(null)
    const url = `${location.protocol.replace('http', 'ws')}//${location.host}${import.meta.env.VITE_APP_BASE_API}/config/${props.contextId}`
    let lines = []
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
        // if (lines<2 && ['\r\n', '\r', '\n'].includes(msg.slice(-1))) {
        //   lines++
        //   return
        // }
        write(msg)
      },
      open: () => {
        fitTerminal()
        focus()
        lines=0
        // send(textEncoder.encode(`alias kubectl='kubectl --context ${props.contextId}' \n`))
        // send(textEncoder.encode("# If you want to run other command instead of kubectl, for example, if you're going to use `helm`, you can try `helm --kube-context " + props.contextId + "`\n"))
        // send(textEncoder.encode("# If you want to set global kubeconfig context, please run `kubectl config use-context " + props.contextId + "`\n"))
        write("# If you want to run other command instead of kubectl, for example, if you're going to use `helm`, you can try `helm --kube-context " + props.contextId + "`\r\n")
        write("# If you want to set global kubeconfig context, please run `kubectl config use-context " + props.contextId + "`\r\n")
      },
      close: (e) => {
        if (e?.code === 1000) {
          stop()
          wmStore.action.removeTab(`kubectl_${props.contextId}`)
        }
      }
    })
    const {maxRetries, period, start, stop} = useSocketRetry(connect, disconnect, () => {
      notificationStore.action.notify({
        type: 'error',
        duration: 0,
        title: 'Websocket Disconnect',
        content: `Disconnect from autoK3s service(contextId:${props.contextId}). Please confirm whether the autoK3s service is running normally`
      })
    })
    maxRetries.value = 3
    period.value = 3000

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
      start()
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
      if (readyState.value === CLOSED) {
        stop()
        start()
      }
    })

    return {
      xterm,
      readyState,
      clear,
      stateToClassMap
    }
  },
  components: {
    Window,
    KButton,
  }
})
</script>
<style>
.kubectl__connect-state {
  text-transform:capitalize;
}
.kubectl-shell__body {
  height: 100%;
  overflow: hidden;
}
</style>