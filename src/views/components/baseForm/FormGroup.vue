<template>
  <div class="grid grid-cols-[auto_1fr] gap-10px items-center">
    <div v-if="closable" class="grid grid-flow-col items-center justify-between cursor-pointer" @click="toggleVisible">
      <a class="text-light-blue-500">
        {{ visible ? 'Hide' : 'Show' }}
        <span>
          <slot name="title"></slot>
        </span>
      </a>
      <k-icon type="arrow-right" :direction="visible ? 'down' : ''"></k-icon>
    </div>
    <div v-else>
      <slot name="title"></slot>
    </div>
    <small v-if="$slots.subtitle" class="col-span-2"><slot name="subtitle"></slot></small>
    <div v-show="show" class="col-span-2">
      <slot></slot>
    </div>
  </div>
</template>
<script>
import { computed, defineComponent, ref, watch } from 'vue'
export default defineComponent({
  name: 'FormGroup',
  props: {
    closable: {
      type: Boolean,
      default: false
    },
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'on-show'],
  setup(props, { emit }) {
    const visible = ref(props.modelValue)
    const show = computed(() => {
      if (props.closable) {
        return visible.value
      }
      return true
    })
    const toggleVisible = () => {
      visible.value = !visible.value
      emit('update:modelValue', visible.value)
    }
    watch(
      show,
      (v) => {
        if (v) {
          emit('on-show', v)
        }
      },
      { immediate: true }
    )
    return {
      visible,
      show,
      toggleVisible
    }
  }
})
</script>
