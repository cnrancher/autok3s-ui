<template>
  <div v-if="pageCount > 0" class="py-5px px-10px"
    :class="[1 === currentPage ? 'text-light-blue-500 cursor-default' : 'cursor-pointer']"
    @click="handlePageChange(1)">1</div>
  <div v-if="showPrevMore"
    class="py-5px px-10px"
    @click="handlePrevMore"><k-icon type="ellipsis"></k-icon></div>
  <div v-for="pager in pagers" :key="pager"
    class="py-5px px-10px"
    :class="[pager === currentPage ? 'text-light-blue-500 cursor-default' : 'cursor-pointer']"
    @click="handlePageChange(pager)">{{pager}}</div>
  <div v-if="showNextMore"
    class="py-5px px-10px"
    @click="handleNextMore"><k-icon type="ellipsis"></k-icon></div>
  <div v-if="pageCount > 1" class="py-5px px-10px"
     :class="[pageCount === currentPage ? 'text-light-blue-500 cursor-default' : 'cursor-pointer']"
     @click="handlePageChange(pageCount)">{{pageCount}}</div>
</template>

<script>
export default {
  name: 'KPager'
}
</script>
<script setup>
import { computed, defineProps, defineEmits } from 'vue'
import KIcon from '@/components/Icon'

const props = defineProps({
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
})

const emit = defineEmits(['change-current-page'])
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
</script>
