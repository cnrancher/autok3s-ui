<template>
<div class="grid grid-cols-[auto,1fr] gap-10px items-center">
  <div class="text-size-18px">
    <slot name="title"></slot>
  </div>
  <div class="grid grid-flow-col items-center justify-between cursor-pointer" v-if="closable" @click="toggleVisible">
    <a class="text-light-blue-500">{{visible ? 'Hide':'Show'}}</a>
    <k-icon type="arrow-right" :direction="visible ? 'down' : ''"></k-icon>
  </div>
  <small class="col-span-2" v-if="$slots.subtitle"><slot name="subtitle"></slot></small>
  <div class="col-span-2" v-show="show">
    <slot></slot>
  </div>
</div>
 
</template>
<script>
import {computed, defineComponent, ref} from 'vue'
export default defineComponent({
  name: 'FormGroup',
  props: {
    closable: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
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
    return {
      visible,
      show,
      toggleVisible,
    }
  },
})
</script>
