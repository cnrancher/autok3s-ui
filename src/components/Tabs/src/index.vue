<template>
  <div class="k-tabs" :class="tabsClass">
    <div class="bg-gray-100">
      <k-tab-nav :tab-position="tabPosition"></k-tab-nav>
    </div>

    <div class="k-tabs__content">
      <slot></slot>
    </div>
  </div>
</template>
<script>
export default {
  name: 'KTabs'
}
</script>
<script setup>
import KTabNav from './TabNav.vue'

import { computed, provide, watchEffect } from 'vue'
import useTabsStore from './store/useTabsStore.js'

const props = defineProps({
  closable: {
    type: Boolean,
    default: false
  },
  tabPosition: {
    type: String,
    default: 'top' // 'top', 'bottom', 'left', 'right'
  },
  modelValue: {
    default: null,
    type: [String, Number]
  }
})

const emit = defineEmits(['update:modelValue', 'tab-remove', 'tab-click'])
const tabsStore = useTabsStore()
tabsStore.action.setClosable(props.closable)
provide('tabsStore', tabsStore)
provide('tabsEmit', emit)
const tabsClass = computed(() => {
  return [`k-tabs--${props.tabPosition}`]
})
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
</script>
<style>
.k-tabs {
  display: grid;
  box-shadow: 0 0 20px #e4e4e7;
  &.k-tabs--top {
    grid-template-areas:
      'header'
      'content';
    grid-template-rows: auto 1fr;
  }
  &.k-tabs--bottom {
    grid-template-areas:
      'content'
      'header';
    grid-template-rows: 1fr auto;
  }
  &.k-tabs--left {
    grid-template-areas: 'header content';
    grid-template-columns: auto 1fr;
  }
  &.k-tabs--right {
    grid-template-areas: 'content header';
    grid-template-columns: 1fr auto;
  }
}
.k-tabs__content {
  @apply bg-white p-20px;
}
</style>
