<template>
  <div v-if="pageCount > 0" class="k-pagination__page"
    :class="{'k-pagination__current-page': 1 === currentPage}"
    @click="handlePageChange(1)">1</div>
  <div v-if="showPrevMore"
    class="k-pagination__page"
    @click="handlePrevMore"><k-icon type="ellipsis"></k-icon></div>
  <div v-for="pager in pagers" :key="pager"
    class="k-pagination__page"
    :class="{'k-pagination__current-page': pager === currentPage}"
    @click="handlePageChange(pager)">{{pager}}</div>
  <div v-if="showNextMore"
    class="k-pagination__page"
    @click="handleNextMore"><k-icon type="ellipsis"></k-icon></div>
  <div v-if="pageCount > 1" class="k-pagination__page"
     :class="{'k-pagination__current-page': pageCount === currentPage}"
     @click="handlePageChange(pageCount)">{{pageCount}}</div>
</template>
<script>
import { computed, defineComponent } from 'vue'
import KIcon from '@/components/Icon'

export default defineComponent({
  name: 'Pager',
  props: {
    currentPage: {
      type: Number,
      default: 1
    },
    pageCount: {
      type: Number,
      required: true
    },
    pagerCount: {
      type: Number,
      default: 7
    }
  },
  emits: ['change-current-page'],
  inheritAttrs: false,
  setup(props, {emit}) {
    const isOddNumForPagerCount = computed(() => {
      return props.pagerCount % 2 !== 0
    })
    const halfPagerCount = computed(() => {
      return Math.ceil(props.pagerCount/2)
    })
    const innerHalfPagerCount = computed(() => {
      return Math.ceil((props.pagerCount-2)/2)
    })
    const handlePageChange = (page) => {
      emit('change-current-page', page)
    }
    const handlePrevMore = () => {
      const page = Math.min(1, props.currentPage - (props.pagerCount-2))
      if (page === props.currentPage) {
        return
      }
      emit('change-current-page', page)
    }
    const handleNextMore = () => {
      const page = Math.min(props.pageCount, props.currentPage + (props.pagerCount-2))
      if (page === props.currentPage) {
        return
      }
      emit('change-current-page', page)
    }
    // const showPrevMore = computed(() => {
    //   if ( props.pageCount <= props.pagerCount ) {
    //     return false
    //   }
    //   return props.currentPage > halfPagerCount.value
    // })
    // const showNextMore = computed(() => {
    //   if (isOddNumForPagerCount.value) {
    //     return props.currentPage + halfPagerCount.value <= props.pageCount
    //   }
    //   return props.currentPage + halfPagerCount.value < props.pageCount
    // })
    const pagers = computed(() => {
      const arr = []
      let start = Math.max(2, props.currentPage - innerHalfPagerCount.value + 1)
      
      let end = Math.min(props.pageCount, props.currentPage + innerHalfPagerCount.value)
      let diff = end - start
      if (diff < props.pagerCount - 2) {
        start = Math.max(2, start - (props.pagerCount - 2 - diff))
      }
      diff = end - start

      if (diff < props.pagerCount - 2) {
        end = Math.min(props.pageCount, end + (props.pagerCount - 2 - diff))
      }
      for (let i = start; i < end; i++) {
        arr.push(i)
      }
      return arr
    })
    const showPrevMore = computed(() => {
      return pagers.value[0] !== 2 && pagers.value.length > 0
    })
    const showNextMore = computed(() => {
      return pagers.value[pagers.value.length -1] !== props.pageCount - 1 && pagers.value.length > 0
    })
    return {
      pagers,
      showPrevMore,
      showNextMore,
      handlePageChange,
      handlePrevMore,
      handleNextMore,
    }
  },
  components: {
    KIcon,
  }
})
</script>
<style>
.k-pagination__current-page {
  color: var(--primary);
}
.k-pagination__page, .k-pagination__next, .k-pagination__prev {
  padding: 5px 10px;
}
</style>