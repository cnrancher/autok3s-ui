<template>
  <WindowContainer>
    <template #default>
      <div ref="logsRef" class="h-full overflow-auto">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-for="(log, index) in logs" :key="index" class="whitespace-nowrap" v-html="log">
        </div>
      </div>
    </template>
    <template #footer>
      <div>
        <k-button class="btn-sm role-primary" :disabled="isFollowing" @click="follow">Follow</k-button>
        &nbsp;
        <k-button class="btn-sm role-primary" @click="clear">Clear</k-button>
      </div>
      <div class="capitalize" :class="stateToClassMap[readyState]">{{readyState}}</div>
    </template>
  </WindowContainer>
</template>
<script>
import AnsiUp from 'ansi_up';
const ansiup = new AnsiUp();
const stateToClassMap = {
  [CLOSED]: 'text-error',
  [CONNECTING]: 'text-info',
  [CONNECTED]: 'text-success',
}
export default {
  name: 'ClusterLogs',
}
</script>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import KButton from '@/components/Button'
import WindowContainer from './WindowContainer.vue'
import useEventSource from '@/composables/useEventSource.js'
import {CLOSED, CONNECTING, CONNECTED} from '@/composables/useEventSource.js'

const props = defineProps({
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
})

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
</script>
