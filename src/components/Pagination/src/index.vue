<script>
import Pager from './Pager.vue'
import Next from './Next.vue'
import Prev from './Prev.vue'
import { computed, defineComponent, ref, h, watchEffect, withDirectives, vShow } from 'vue'

export default defineComponent({
  name: 'KPagination',
  props: {
    layout: {
      type: String,
      default: 'prev,pager,next'
    },
    total: {
      type: Number,
      required: true,
    },
    pageSize: {
      type: Number,
      default: 10
    },
    pagerCount: {
      type: Number,
      default: 7
    },
    currentPage: {
      type: Number,
      default: 1
    },
    prevText: {
      type: String,
      default: '',
    },
    nextText: {
      type: String,
      default: '',
    },
    hideOnSinglePage: {
      type: Boolean,
      default: true
    }
  },
  emits: ['current-change', 'update:current-change'],
  setup(props, {emit}) {
    const pageCount = computed(() => {
      if (props.total <= 0) {
        return 1
      }
      if (props.pageSize <= 0) {
        return 1
      }
      return Math.ceil(props.total/props.pageSize)
    })
    const innerCurrentPage = ref(Math.min(props.currentPage, pageCount.value))
    watchEffect(() => {
      innerCurrentPage.value = props.currentPage
    })
    const handlePageChange = (page) => {
      innerCurrentPage.value = page
      emit('update:current-change', page)
      emit('current-change', page)
    }
    const templateMap = {
      pager: () => h(Pager, {
        currentPage: innerCurrentPage.value,
        pagerCount: props.pagerCount,
        pageCount: pageCount.value,
        onChangeCurrentPage: handlePageChange
      }),
      next: () => h(Next, {
        currentPage: innerCurrentPage.value,
        nextText: props.nextText,
        pageCount: pageCount.value,
        onChangeCurrentPage: handlePageChange,
        // onChange: handlePageChange
      }),
      prev:() => h(Prev, {
        currentPage: innerCurrentPage.value,
        prevText: props.prevText,
        onChangeCurrentPage: handlePageChange
      })
    }
    const rootChildren = computed(() => {
      const rootChildren = []
      props.layout.split(',').map((c) => c.trim()).forEach((c) => {
        const render = templateMap[c]
        if (render) {
          rootChildren.push(render())
        }
      })
      return rootChildren
    })
    return () => withDirectives(h('div', {class: 'k-pagination'}, rootChildren.value), [[vShow, !props.hideOnSinglePage]])
  },
})
</script>
<style>
.k-pagination {
  display: grid;
  /* grid-template-columns: repeat(auto-fill, minmax(28px, max-content)); */
  grid-template-rows: 28px;
  column-gap: 5px;
  grid-auto-flow: column;
  align-items: center;
  justify-content: end;
}
.k-pagination__page {
  cursor: pointer;
}
.k-pagination__current-page {
   cursor: default;
}
</style>