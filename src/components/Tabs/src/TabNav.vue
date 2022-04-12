<template>
  <div class="min-w-200px" :class="tabNavClass">
    <div
v-for="t in tabs" :key="t.id"
      class="k-tabs__item"
      :class="{'k-tabs__item--active': t.id === activeTabId, 'cursor-not-allowed': t.disabled}" @click="setActiveTab(t)">
      {{t.label}}&nbsp;
      <k-icon v-if="t.closable || tabsClosable" type="close" @click="removeTab(t)"></k-icon>
    </div>
  </div>
</template>
<script>
export default {
  name: 'KTabNav',
}
</script>
<script setup>
import KIcon from '@/components/Icon'
import { computed, inject } from 'vue'

const props = defineProps({
  tabPosition: {
    type: String,
    default: 'top'
  }
})
const tabsStore = inject('tabsStore')
const tabsEmit = inject('tabsEmit')
const tabNavClass = computed(() => {
  return [`k-tabs__nav--${props.tabPosition}`, ]
})
const activeTabId = computed(()=>tabsStore.state.active)
const setActiveTab = (t) => {
  if (!t.disabled) {
    tabsStore.action.setActiveTab(t.id)
    tabsEmit('update:modelValue', t.name)
  }
}
const removeTab = (t) => {
  !t.disabled && tabsStore.action.removeTab(t.id)
}
const tabsClosable = tabsStore.state.closable
const tabs = tabsStore.state.tabs
</script>
<style>
.k-tabs__nav--top,
.k-tabs__nav--bottom {
  @apply flex items-center;
  & > .k-tabs__item {
    @apply py-5px px-10px;
  }
  & > .k-tabs__item--active {
    @apply bg-white;
  }
}
.k-tabs__nav--left,
.k-tabs__nav--right{
  @apply flex flex-col;
  & > .k-tabs__item {
    @apply py-7.5px px-15px border-l-5px border-l-transparent;
  }
  & > .k-tabs__item--active {
    @apply bg-white border-l-5px border-l-light-blue-600 text-gray-500;
  }
}
.k-tabs__item {
  @apply flex items-center text-light-blue-500 cursor-pointer;
}

</style>