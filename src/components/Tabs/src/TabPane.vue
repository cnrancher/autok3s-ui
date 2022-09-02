<template>
  <div v-if="shouldBeRender" v-show="active" class="k-tabs__pane">
    <slot></slot>
  </div>
</template>
<script>
import useIdGenrator from '@/composables/useIdGenerator.js'
const { next: nextId } = useIdGenrator()
export default {
  name: 'KTabPane'
}
</script>
<script setup>
import { computed, inject, toRef, watchEffect, ref, onBeforeUnmount } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  closable: {
    type: Boolean,
    default: false
  },
  lazy: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  }
})

const tabsStore = inject('tabsStore')
const tab = ['disabled', 'name', 'closable', 'lazy', 'label', 'error'].reduce(
  (t, c) => {
    t[c] = toRef(props, c)
    return t
  },
  { id: nextId() }
)
tabsStore.action.addTab(tab)

onBeforeUnmount(() => {
  tabsStore.action.removeTab(tab.id)
})
const loaded = ref(false)
const active = computed(() => {
  return tabsStore.state.active === tab.id
})
watchEffect(() => {
  if (active.value) {
    loaded.value = true
  }
})
const shouldBeRender = computed(() => {
  return !props.lazy || loaded.value || active.value
})
</script>
