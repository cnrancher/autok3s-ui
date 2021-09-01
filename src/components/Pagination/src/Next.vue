<template>
  <div class="cursor-pointer flex justify-center items-center"
    @click="goToNextPage">
    <span v-if="nextText ">{{ nextText }}</span><k-icon type="arrow-right" :class="[nextDisabled ? 'cursor-not-allowed text-gray-300' : '']"></k-icon>
  </div>
</template>
<script>
import KIcon from '@/components/Icon'
import { computed, defineComponent } from 'vue'
export default defineComponent({
  name: 'KNext',
  props: {
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
  },
  emits: ['change-current-page'],
  setup(props, {emit}) {
    const nextDisabled = computed(() => {
      return props.currentPage >= props.pageCount
    })
    const goToNextPage = () => {
      if (nextDisabled.value) {
        return
      }
      emit('change-current-page', props.currentPage + 1)
    }
    return {
      nextDisabled,
      goToNextPage
    }
  },
  components: {
    KIcon
  }
})
</script>
