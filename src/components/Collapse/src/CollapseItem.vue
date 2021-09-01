<template>
  <div>
    <div class="k-collapse-item grid grid-cols-[1fr,auto] items-center min-h-48px cursor-pointer" :class="{'k-collapse-item--active': active}" @click="toggleActiveName(name)">
      <div><slot name="title" :active="active">{{title}}</slot></div>
      <k-icon type="arrow-right" :direction="active ? 'down' : ''"></k-icon>
    </div>
    <div class="border pb-18px" :class="{'k-collapse-item--active': active}" v-show="active">
      <slot></slot>
    </div>
  </div>
</template>
<script>
import {computed, defineComponent, inject, ref} from 'vue'
import KIcon from '@/components/Icon'
import useIdGenerator from '@/composables/useIdGenerator.js'

const {next: nextId} = useIdGenerator()
const prefix = 'collapse_item_'

export default defineComponent({
  name: 'KCollapseItem',
  props: {
    title: {
      type: String,
      default: '',
    },
    name: {
      type: [String, Number],
      default() {
        return `${prefix}${nextId()}`
      },
    },
  },
  setup(props) {
    const activeNames = inject('activeNames')
    const active = computed(() => {
      return activeNames.value.indexOf(props.name) > -1
    })
    const toggleActiveName = inject('toggleActiveName')
    return {
      active,
      toggleActiveName,
    }
  },
  components: {
    KIcon,
  }
})
</script>
<style>
.k-collapse-item:last-child {
  margin-bottom: -1px;
}
</style>