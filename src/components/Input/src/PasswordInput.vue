<template>
  <k-input :type="inputType" :autocomplete="autocomplete">
    <template #suffix>
      <k-icon class="cursor-pointer" type="view" v-if="show" :size="18" @click="toggleShow"></k-icon>
      <k-icon class="cursor-pointer" type="view-off" v-else :size="18" @click="toggleShow"></k-icon>
    </template>
  </k-input>
</template>
<script>
export default {
  name: 'KPasswordInput',
}
</script>
<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import KInput from './index.vue'
import KIcon from '@/components/Icon'

defineProps({
  autocomplete: {
      type: String,
      default: 'new-password'
    }
})

const show = ref(false)
const inputType = computed(() => {
  return show.value ? 'text' : 'password'
})
const toggleShow = () => {
  show.value = !show.value
}

onBeforeUnmount(() => {
  show.value = true
})
</script>
