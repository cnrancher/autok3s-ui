<template>
  <div class="k-pagination__next"
    :class="{'k-pagination__next--disabled': nextDisabled}"
    @click="goToNextPage">
    <span v-if="nextText ">{{ nextText }}</span><k-icon type="arrow-right"></k-icon>
  </div>
</template>
<script>
import KIcon from '@/components/Icon'
import { computed, defineComponent } from 'vue'
export default defineComponent({
  name: 'Next',
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
<style>
.k-pagination__next {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}
.k-pagination__next--disabled {
  cursor: not-allowed;
  & i {
    background-color: var(--disabled-text);
  }
}
</style>