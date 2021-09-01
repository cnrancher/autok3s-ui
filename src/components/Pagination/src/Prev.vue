<template>
  <div class="cursor-pointer flex justify-center items-center"
    @click="goToPrevPage">
    <span v-if="prevText ">{{ prevText }}</span><k-icon type="arrow-right" direction="left" :class="[prevDisabled ? 'cursor-not-allowed text-gray-300' : '']"></k-icon>
  </div>
</template>
<script>
import KIcon from '@/components/Icon'
import { computed, defineComponent } from 'vue'
export default defineComponent({
  name: 'KPrev',
  props: {
    currentPage: {
      type: Number,
      default: 1,
    },
    prevText: {
      type: String,
      default: '',
    },
  },
  emits: ['change-current-page'],
  setup(props, {emit}) {
    const prevDisabled = computed(() => {
      return props.currentPage <= 1
    })
    const goToPrevPage = () => {
      if (prevDisabled.value) {
        return
      }
      emit('change-current-page', props.currentPage - 1)
    }
    return {
      prevDisabled,
      goToPrevPage
    }
  },
  components: {
    KIcon
  }
})
</script>
