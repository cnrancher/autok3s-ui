<template>
  <div>
    <div
      class="k-collapse-item grid grid-cols-[1fr,auto] items-center min-h-48px cursor-pointer"
      :class="{ 'k-collapse-item--active': active }"
      @click="toggleActiveName(name)"
    >
      <div>
        <slot name="title" :active="active">{{ title }}</slot>
      </div>
      <k-icon type="arrow-right" :direction="active ? 'down' : ''"></k-icon>
    </div>
    <div v-show="active" class="border pb-18px" :class="{ 'k-collapse-item--active': active }">
      <slot></slot>
    </div>
  </div>
</template>
<script>
import useIdGenerator from '@/composables/useIdGenerator.js'

const { next: nextId } = useIdGenerator()
const prefix = 'collapse_item_'

export default {
  name: 'KCollapseItem'
}
</script>
<script setup>
import { computed, inject } from 'vue'
import KIcon from '@/components/Icon'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  name: {
    type: [String, Number],
    default() {
      return `${prefix}${nextId()}`
    }
  }
})

const activeNames = inject('activeNames')
const active = computed(() => {
  return activeNames.value.indexOf(props.name) > -1
})
const toggleActiveName = inject('toggleActiveName')
</script>
<style>
.k-collapse-item:last-child {
  margin-bottom: -1px;
}
</style>
