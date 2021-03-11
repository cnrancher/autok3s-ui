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
import {defineComponent, nextTick, ref, watchEffect} from 'vue'
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
  name: 'KubectlShell',
  props: {
    contextId: {
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
    const url = `${location.protocol.replace('http', 'ws')}//${location.host}${import.meta.env.VITE_APP_BASE_API}/config/${props.contextId}&width=150&height=300`
    let firstLine = true
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
        if (firstLine && msg.slice(-1)=== '\n') {
          firstLine = false
          return
        }
        if (firstLine) {
          return
        }
        write(msg)
      },
      open: () => {
        fit()
        focus()
        firstLine = true
        send(textEncoder.encode(`alias kubectl='kubectl --context ${props.contextId}' \n`))
        send(textEncoder.encode("# If you want to run other command instead of kubectl, for example, if you're going to use `helm`, you can try `helm --kube-context " + props.contextId + "`\n"))
        send(textEncoder.encode("# If you want to set global kubeconfig context, please run `kubectl config use-context " + props.contextId + "`\n"))
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