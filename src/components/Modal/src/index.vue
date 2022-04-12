<template>
  <teleport to="body">
    <div v-if="visible" class="grid items-center justify-center z-$modal-z-index overflow-auto absolute top-0 left-0 bottom-0 right-0 bg-[rgba(0,0,0,.5)]">
      <div class="min-w-1/3 bg-white">
        <div class="flex justify-between items-center pt-20px pb-10px px-20px">
          <div class="text-18px">
            <slot name="title">
              <span>{{title}}</span>
            </slot>
          </div>
          <k-icon v-if="showClose" type="close" class="cursor-pointer" @click="close"></k-icon>
        </div>
         <hr>
        <div class="py-30px px-20px">
          <slot></slot>
        </div>
        <div class="py-10px px-20px grid grid-flow-col gap-10px items-center justify-end">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </teleport>
</template>
<script>
export default {
  name: 'KModal',
}
</script>
<script setup>
import { ref, watchEffect } from 'vue'
import KIcon from '@/components/Icon'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  showClose: {
    type: Boolean,
    default: false,
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
