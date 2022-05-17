import { onBeforeUnmount, ref } from 'vue'

const defaultOptions = { immediate: true, ignoreAbortError: true, initialData: {} }

export default function useRequest(req, options = {}) {
  options = Object.assign({}, defaultOptions, options)
  const loading = ref(false)
  const data = ref(options.initialData)
  const error = ref(null)
  const aborted = ref(false)
  let controller = null
  const abort = () => {
    controller?.abort()
  }
  const doRequest = async () => {
    controller = new AbortController()
    controller.signal.onabort = () => {
      aborted.value = true
    }
    loading.value = true
    aborted.value = false
    error.value = null

    try {
      //req method: last param is consotroll signal
      const resp = await req(controller.signal)
      data.value = resp
      if (options.afterFetch) {
        options.afterFetch(resp)
      }
    } catch (err) {
      if (err.name === 'AbortError' && options.ignoreAbortError) {
        // do nothing
      } else {
        error.value = err
        if (options.onFetchError) {
          options.onFetchError(err)
        }
      }
    }
    loading.value = false
  }
  if (options.immediate) {
    doRequest()
  }
  onBeforeUnmount(() => {
    abort()
  })

  return {
    data,
    loading,
    aborted,
    error,
    abort,
    refetch: doRequest
  }
}
