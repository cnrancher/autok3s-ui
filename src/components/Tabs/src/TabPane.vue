<template>
  <div v-if="shouldBeRender" v-show="active" class="k-tabs__pane">
    <slot></slot>
  </div>
</template>
<script>
import { computed, inject, toRef, watchEffect, ref } from 'vue'
import useIdGenrator from '@/composables/useIdGenerator.js'
const {next: nextId, reset: resetId } = useIdGenrator()
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: true,
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
      default: false,
    }
  },
  setup(props, context) {
    const tabsStore = inject('tabsStore')
    const tab = ['disabled', 'name', 'closable', 'lazy', 'label'].reduce((t, c) => {
      t[c] = toRef(props, c)
      return t
    }, { id: nextId()})
    tabsStore.action.addTab(tab)
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
      return (!props.lazy || loaded.value) || active.value
    })
    return {
      active,
      shouldBeRender,
    }
  }
}
</script>
<style>
.k-tabs__pane {
}
</style>