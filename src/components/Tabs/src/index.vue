<template>
  <div class="k-tabs" :class="tabsClass">
    <div class="k-tabs__header">
      <k-tab-nav :tab-position="tabPosition"></k-tab-nav>
    </div>

    <div class="k-tabs__content">
       <slot></slot>
    </div>
  </div>
</template>
<script>
import KTabNav from './TabNav.vue'
import KTabPane from './TabPane.vue'

import { computed, provide, watch, watchEffect } from 'vue'
import useTabsStore from './store/useTabsStore.js'

export default {
  props: {
    closable: {
      type: Boolean,
      default: false,
    },
    tabPosition: {
      type: String,
      default: 'top', // 'top', 'bottom', 'left', 'right'
    },
    modelValue: {
      default: null,
      type: [String, Number]
    }
  },
  emits: ['update:modelValue', 'tab-remove', 'tab-click'],
  setup(props, {emit}) {
    const tabsStore = useTabsStore()
    tabsStore.action.setClosable(props.closable)
    provide('tabsStore', tabsStore)
    provide('tabsEmit', emit)
    const tabsClass = computed(() => {
      return [`k-tabs--${props.tabPosition}`]
    })
    // watch([() => props.modelValue, () => tabsStore.state.active, () => tabsStore.state.tabs.length], ([v, active, len]) => {
    //   if (v === null && active === null && len > 0) {
    //     tabsStore.action.setActiveTab(tabsStore.state.tabs[0].id)
    //   }
    //   if (v) {
    //     const id = tabsStore.state.tabs.find((t) => t.name === v)?.id
    //     tabsStore.action.setActiveTab(id)
    //   }
    // })
    watchEffect(() => {
      if (props.modelValue === null && tabsStore.state.active === null && tabsStore.state.tabs.length > 0) {
        tabsStore.action.setActiveTab(tabsStore.state.tabs[0].id)
        return
      }
      if (props.modelValue === tabsStore.state.active) {
        return
      }
      if (props.modelValue) {
        const id = tabsStore.state.tabs.find((t) => t.name === props.modelValue)?.id
        tabsStore.action.setActiveTab(id)
      }
    })
    return {
      tabsClass,
      tabs: tabsStore.state.data
    }
  },
  components: {
    KTabNav,
    KTabPane
  }
}
</script>
<style>
.k-tabs {
  display: grid;
  box-shadow: 0 0 20px var(--shadow);
  border-radius: calc(var(--border-radius)*2);
  background-color: var(--tabbed-sidebar-bg);
  &.k-tabs--top {
    grid-template-areas: "header"
                         "content";
    grid-template-rows: auto 1fr;
  }
  &.k-tabs--bottom {
    grid-template-areas: "content"
                         "header";
    grid-template-rows: 1fr auto;
  }
  &.k-tabs--left {
    grid-template-areas: "header content";
    grid-template-columns: auto 1fr;
  }
  &.k-tabs--right {
    grid-template-areas: "content header";
    grid-template-columns: 1fr auto;
  }
}
.k-tabs__content {
  background-color: var(--body-bg);
  padding: 20px;
}
</style>