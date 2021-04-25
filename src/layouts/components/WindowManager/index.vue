<template>
  <div class="wm" v-show="isOpen">
    <div class="wm__header"></div>
    <div class="wm__tabs-nav">
      <div v-for="t in tabs" :key="t.id"
        class="wm__tabs-item"
        :class="{'wm__tabs-item--active': t.id === activeTabId}"
        @click="setActive(t.id)"
      >
        <k-icon v-if="t.icon" :type="t.icon"></k-icon>
        {{t.label}} &nbsp;
        <k-icon type="close" @click="remove(t.id)"></k-icon>
      </div>
    </div>
    <div class="wm__resize" ref="resizer">
      <k-icon type="arrows-resize-v" :size="24" @click="toggleMin"></k-icon>
      <div class="wm__resize-proxy" v-show="draging" :style="{top: `${resizerOffset}px`}"></div>
    </div>
    <div class="wm__tabs-content">
      <div
        v-for="t in tabs"
        :key="t.id"
        class="wm__tab-pane"
        :class="{'wm__tab-pane--active': t.id === activeTabId}"
      >
          <component 
            :is="t.component"
            v-bind="t.attrs"
            :renew-count="t.renewCount"
            :show='t.id === activeTabId'
          >
          </component>
      </div>
    </div>
  </div>
</template>
<script>
import {computed, defineComponent, inject, onBeforeUnmount, onMounted, watchEffect, ref, reactive} from 'vue'
import KIcon from '@/components/Icon'
import ClusterLogs from './components/ClusterLogs.vue'
import KubectlShell from './components/KubectlShell.vue'
import NodeShell from './components/NodeShell.vue'

export default defineComponent({
  name: 'WindownManager',
  setup() {
    const windowManagerStore = inject('windowManagerStore')
    const isOpen = computed(() => {
      return windowManagerStore.state.open
    })
    const minimize = ref(false)
    const tabs = windowManagerStore.state.tabs
    const height = computed(() => {
      if (!isOpen.value) {
        return 0
      }
      if (minimize.value) {
        const docStyle = getComputedStyle(document.querySelector('body'))
        return parseInt(docStyle.getPropertyValue('--wm-tab-height').trim(), 10) + 2
      }
      let h = windowManagerStore.state.userHeight
      if (!h) {
        h = window.innerHeight / 2
      }
      return h
    })
    
    watchEffect(() => {
      document.documentElement.style.setProperty('--wm-height', `${ height.value }px`);
    })
    const activeTabId = computed(() => {
      return windowManagerStore.state.active
    })
    const remove = (id) => {
      windowManagerStore.action.removeTab(id)
    }
    const setActive = (id) => {
      windowManagerStore.action.setActiveTab(id)
    }
    const resizer = ref(null)
    const {draging, resizerOffset} = useEvent(resizer)
    const toggleMin = () => {
      if (draging.value) {
        return
      }
      minimize.value = !minimize.value
    }
    return {
      tabs,
      activeTabId,
      height,
      remove,
      setActive,
      isOpen,
      resizer,
      draging,
      resizerOffset,
      toggleMin,
    }
  },
  components: {
    KIcon,
    ClusterLogs,
    KubectlShell,
    NodeShell,
  }
})

function useEvent(targetRef) {
  const windowManagerStore = inject('windowManagerStore')
  const draging = ref(false)
  const marginTopMin = 100
  const marginBottomMin = 60
  const resizerOffset = ref(0)
  let height = window.innerHeight
  const doc = document.documentElement;
  const preventDefault = (e) => {
    e.preventDefault()
  }
  const updatePosition = (e) => {
    const {clientY} = e
    resizerOffset.value = Math.min(Math.max(marginTopMin, clientY), height - marginBottomMin)
  }
  const updateWMHeight = () => {
    const h = height - resizerOffset.value + 14
    windowManagerStore.action.setUserHeight(h)
    document.documentElement.style.setProperty('--wm-height', `${h}px`)
  }
  const handleMouseDown = (e) => {
    addEvents()
    height = window.innerHeight
  }
  const handleMouseUp = (e) => {
    removeEvents()
    if (draging.value === true) {
      updateWMHeight()
      draging.value = false
    }
  }
  const handleMouseMove = (e) => {
    draging.value = true
    updatePosition(e)
  }
  const handleMouseLeave = (e) => {
    removeEvents()
    draging.value = false
    updateWMHeight()
  }

  const addEvents = () => {
    targetRef.value.addEventListener('mouseup', handleMouseUp)

    doc.addEventListener('mouseup', handleMouseUp)
    doc.addEventListener('mousemove', handleMouseMove)
    doc.addEventListener('mouseleave', handleMouseLeave)
    doc.addEventListener('selectstart', preventDefault)
    doc.addEventListener('dragstart', preventDefault)
  }
  const removeEvents = () => {
    targetRef.value.removeEventListener('mouseup', handleMouseUp)

    doc.removeEventListener('mouseup', handleMouseUp)
    doc.removeEventListener('mousemove', handleMouseMove)
    doc.removeEventListener('mouseleave', handleMouseLeave)
    doc.removeEventListener('selectstart', preventDefault)
    doc.removeEventListener('dragstart', preventDefault)
  }
  onMounted(() => {
    targetRef.value.addEventListener('mousedown', handleMouseDown)
  })
  onBeforeUnmount(() => {
    targetRef.value.removeEventListener('mousedown', handleMouseDown)
    removeEvents()
  })
  return {
    draging,
    resizerOffset,
  }
}
</script>
<style>
.wm {
  position: relative;
  display: grid;
  grid-template-areas: "header header"
                       "tabsNav resize"
                       "tabsContent tabsContent";
  grid-template-rows: auto auto 1fr;
  grid-template-columns: 1fr auto;
  background-color: var(--wm-body-bg);
  height: var(--wm-height);
}
.wm__header {
  grid-area: header;
}
.wm__tabs-nav {
  grid-area: tabsNav;
  display: grid;
  grid-auto-flow: column;
  background-color: var(--wm-tabs-bg);
  /* border-top: 1px solid var(--wm-border); */
  /* border-bottom: 1px solid var(--wm-border); */
  justify-content: start;
  min-height: var(--wm-tab-height);
}
.wm__resize {
  grid-area: resize;
  display: grid;
  grid-auto-flow: column;
  column-gap: 2px;
  align-items: center;
  cursor: row-resize;
  background-color: var(--wm-tabs-bg);
  &:hover {
    background-color: var(--wm-closer-hover-bg);
  }
}
.wm__resize-proxy {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  border-top: 2px solid #ebeef5;
  z-index: 10;
}
.wm__tabs-content {
  grid-area: tabsContent;
  overflow: hidden;
}
.wm__tabs-item {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--wm-border);
  border-right: 1px solid var(--wm-border);
  padding: 5px 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow: hidden;
  min-width: 50px;
  cursor: pointer;
}
.wm__tabs-item--active {
  background-color: var(--wm-body-bg);
  /* outline: 1px solid var(--wm-body-bg); */
}
.wm__tab-pane {
  height: 100%;
  display: none;
  /* visibility: hidden; */
}
.wm__tab-pane--active {
  display: block;
  /* visibility: visible; */
}
</style>