<template>
  <window>
    <template #default>
      <div ref="logsRef" class="cluster-logs__content">
        <div v-for="(log, index) in logs" :key="index" v-html="log">
        </div>
      </div>
    </template>
    <template #footer>
      <div>
        <k-button class="btn-sm bg-primary" :disabled="isFollowing" @click="follow">Follow</k-button>
        &nbsp;
        <k-button class="btn-sm bg-primary" @click="clear">Clear</k-button>
      </div>
      <div class="cluster-logs__connect-state" :class="stateToClassMap[readyState]">{{readyState}}</div>
    </template>
  </window>
</template>
<script>
import AnsiUp from 'ansi_up';
import { defineComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import KButton from '@/components/Button'
import Window from './Window.vue'
import useEventSource from '@/composables/useEventSource.js'
import {CLOSED, CONNECTING, CONNECTED} from '@/composables/useEventSource.js'
const ansiup = new AnsiUp();
const stateToClassMap = {
  [CLOSED]: 'text-error',
  [CONNECTING]: 'text-info',
  [CONNECTED]: 'text-success',
}

export default defineComponent({
  name: 'ClusterLogs',
  props: {
    cluster: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      default: '',
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
    // const wmStore = inject('windowManagerStore')
    const logsRef = ref(null)
    const logs = ref([])
    const isFollowing = ref(true)
    
    const url = `${location.protocol}//${location.host}${import.meta.env.VITE_APP_BASE_API}/logs?cluster=${props.cluster}${props.provider ? `&provider=${props.provider}` : ''}`
    const {readyState, connect} = useEventSource(url, {
      message: (e) => {
        const msg = ansiup.ansi_to_html(e.data)
        logs.value.push(msg)
        if (isFollowing.value) {
          nextTick(() => {
            follow()
          })
        }
      },
    })
    const follow = () => {
      const el = logsRef.value
      el.scrollTop = el.scrollHeight
    }
    const clear = () => {
      logs.value = []
    }
    const updateFollowing = (e) => {
      const el = e.target;
      isFollowing.value = el.scrollTop + el.clientHeight + 2 >= el.scrollHeight
    }

    watch(() => props.renewCount, () => {
      if (readyState.value === CLOSED) {
        logs.value = []
        connect()
      }
    })

    onMounted(()=> {
      connect()
      logsRef.value.addEventListener('scroll', updateFollowing)
    })
    onBeforeUnmount(() => {
      logsRef.value.removeEventListener('scroll', updateFollowing)
    })

    return {
      readyState,
      stateToClassMap,
      logs,
      logsRef,
      follow,
      isFollowing,
      clear,
    }
  },
  components: {
    KButton,
    Window
  }
})
</script>
<style>
.cluster-logs__content {
  height: 100%;
  overflow: auto;
  & > div {
    white-space: nowrap;
  }
}
.cluster-logs__connect-state {
  text-transform:capitalize;
}
</style>