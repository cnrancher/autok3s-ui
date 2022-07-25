<template>
  <k-input :type="inputType" autocomplete="off" autocapitalize="off">
    <template #suffix>
      <k-icon v-if="show" class="cursor-pointer" type="view" :size="18" @click="toggleShow"></k-icon>
      <k-icon v-else class="cursor-pointer" type="view-off" :size="18" @click="toggleShow"></k-icon>
    </template>
  </k-input>
</template>
<script>
export default {
  name: 'KPasswordInput'
}
</script>
<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import KInput from './index.vue'
import KIcon from '@/components/Icon'

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
