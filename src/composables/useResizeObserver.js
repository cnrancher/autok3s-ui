import { debounce } from 'lodash-es'
import { onBeforeUnmount, onMounted, unref } from 'vue'

export default function useResizeObserver(target, handler, wait = 300) {
  const debounceHandler = debounce(handler, wait)
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      debounceHandler(entry)
    }
  })
  onMounted(() => {
    resizeObserver.observe(unref(target))
  })
  onBeforeUnmount(() => {
    resizeObserver.disconnect()
  })
}