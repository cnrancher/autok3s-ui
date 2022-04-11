<template>
  <div class="cursor-pointer flex justify-center items-center"
    @click="goToNextPage">
    <span v-if="nextText ">{{ nextText }}</span><k-icon type="arrow-right" :class="[nextDisabled ? 'cursor-not-allowed text-gray-300' : '']"></k-icon>
  </div>
</template>
<script>
export default {
  name: 'KNext',
}
</script>
<script setup>
import KIcon from '@/components/Icon'
import { computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1,
  },
  pageCount: {
    type: Number,
    requird: true
  },
  nextText: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['change-current-page'])

const nextDisabled = computed(() => {
  return props.currentPage >= props.pageCount
})
const goToNextPage = () => {
  if (nextDisabled.value) {
    return
  }
  emit('change-current-page', props.currentPage + 1)
}
</script>
