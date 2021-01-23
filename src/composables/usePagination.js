import { computed, ref } from "vue"

export default function usePagination(data) {
  const pageSize = ref(20)
  const currentPage = ref(1)
  const total = computed(() => data.value.length)
  const pageCount = computed(() => {
    if (pageSize.value <= 0 || total.value === 0) {
      return 1
    }
    return Math.ceil(total.value/pageSize.value)
  })
  const nextPage = () => {
    if (currentPage.value >= total.value) {
      return currentPage
    }
    currentPage.value++
    return currentPage
  }
  const prePage = () => {
    if (currentPage.value <= 1) {
      return currentPage
    }
    currentPage.value--
    return currentPage
  }
  const goToPage = (p) => {
    if (p<=1 && p >= total.value) {
      currentPage.value = p
    }
  }
  const pageData = computed(() => {
    return data.value.slice(currentPage.value - 1, pageSize.value)
  })
  return {
    goToPage,
    nextPage,
    prePage,
    pageData,
    currentPage,
    total,
    pageCount
  }
}