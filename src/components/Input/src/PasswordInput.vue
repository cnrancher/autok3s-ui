<template>
  <k-input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" :style="inputStyle">
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
import { computed, ref } from 'vue'
import KInput from './index.vue'
import KIcon from '@/components/Icon'

const show = ref(false)

const toggleShow = () => {
  show.value = !show.value
}

const inputStyle = computed(() => {
  if (show.value) {
    return {}
  }
  return {
    fontFamily: 'dotsfont',
    fontSize: '12px'
  }
})
</script>
