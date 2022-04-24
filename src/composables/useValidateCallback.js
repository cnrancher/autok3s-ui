import { inject, onBeforeUnmount } from 'vue'

export default function useValidateCallback(callback) {
  const registValidateCallback = inject('registValidateCallback')
  const removeValidateCallback = inject('removeValidateCallback')
  const emptyArgs = [
    { arg: registValidateCallback, name: 'registValidateCallback' },
    { args: removeValidateCallback, name: 'removeValidateCallback' },
    { arg: callback, name: 'callback' }
  ].filter((item) => !item.arg)
  if (emptyArgs.length > 0) {
    console.warn(`${emptyArgs.map((item) => item.name).join(', ')} not provided`)
    return
  }

  registValidateCallback(callback)
  onBeforeUnmount(() => {
    removeValidateCallback(callback)
  })
}
