// import { debounce, throttle } from 'lodash-es'
import {unref} from 'vue'
export default function useEventListener(option = {
  target: window,
  event: 'click',
  handler() {},
  useCapture: false
}) {
  const { target, event, handler, useCapture } = option;

  if (!target || !event || !handler) {
    return
  }
  unref(target).addEventListener(event, handler, useCapture)
  const removeEvent = () => {
    target.removeEventListener(event, handler, useCapture)
  }
  return {
    removeEvent,
  }
}