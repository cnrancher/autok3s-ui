<template>
  <teleport to="body" :disabled="teleportDisabled">
    <div
      v-if="visible"
      class="bg-[rgba(0,0,0,.5)] z-$modal-z-index grid top-0 right-0 bottom-0 left-0 items-center justify-center overflow-auto absolute"
    >
      <div class="bg-white min-w-1/3 max-w-95vw">
        <div class="flex px-20px pt-20px pb-10px justify-between items-center">
          <div class="text-18px">
            <slot name="title">
              <span>{{ title }}</span>
            </slot>
          </div>
          <k-icon v-if="showClose" type="close" class="cursor-pointer" @click="close"></k-icon>
        </div>
        <hr />
        <div class="py-30px px-20px">
          <slot></slot>
        </div>
        <div class="grid grid-flow-col py-10px px-20px gap-10px items-center justify-end">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </teleport>
</template>
<script>
export default {
  name: 'KModal'
}
</script>
<script setup>
import { ref, watchEffect } from 'vue'
import KIcon from '@/components/Icon'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  showClose: {
    type: Boolean,
    default: false
  },
  teleportDisabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
watchEffect(() => {
  visible.value = props.modelValue
})
const close = () => {
  emit('update:modelValue', false)
}
</script>
