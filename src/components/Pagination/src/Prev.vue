<template>
  <div class="cursor-pointer flex justify-center items-center"
    @click="goToPrevPage">
    <span v-if="prevText ">{{ prevText }}</span><k-icon type="arrow-right" direction="left" :class="[prevDisabled ? 'cursor-not-allowed text-gray-300' : '']"></k-icon>
  </div>
</template>
<script>
export default {
  name: 'KPrev',
}
</script>
<script setup>
import KIcon from '@/components/Icon'
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1,
  },
  prevText: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['change-current-page'])
const prevDisabled = computed(() => {
  return props.currentPage <= 1
})
const goToPrevPage = () => {
  if (prevDisabled.value) {
    return
  }
  emit('change-current-page', props.currentPage - 1)
}
</script>
