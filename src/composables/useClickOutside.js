// import { debounce } from 'lodash-es'
import useEventListener from './useEventListener'
import {onBeforeUnmount, unref} from 'vue'

export default function useClickOutside(container, onClickOutside, event = 'click') {
  const handler = (e) => {
    const el = unref(container)
    if (el && e.target && !el.contains(e.target)) {
      onClickOutside(e)
    }
  }
  const {removeEvent} = useEventListener({
    target: document,
    // handler: debounce(handler, 300),
    handler: handler,
    event,
  })
  onBeforeUnmount(() => {
    removeEvent()
  })
}