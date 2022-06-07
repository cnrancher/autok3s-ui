import { set } from 'lodash-es'
import { cloneDeep } from '@/utils'
import { onBeforeUnmount, provide } from 'vue'

import { FORM_MANAGE } from '@/utils/constants.js'

export default function useFormManage() {
  let validateCallbacks = []
  let formCallbacks = []

  const registValidateCallback = (cb) => {
    if (!validateCallbacks.includes(cb)) {
      validateCallbacks.push(cb)
    }
  }
  const registFormCallback = (cb) => {
    if (!formCallbacks.includes(cb)) {
      formCallbacks.push(cb)
    }
  }

  const removeFormCallback = (cb) => {
    const i = formCallbacks.indexOf(cb)
    if (i > -1) {
      formCallbacks.splice(i, 1)
    }
  }
  const removeValidateCallback = (cb) => {
    const i = validateCallbacks.indexOf(cb)
    if (i > -1) {
      validateCallbacks.splice(i, 1)
    }
  }
  const validate = (schema) => {
    return validateCallbacks.reduce((t, c) => {
      const e = c(schema)
      if (e?.length > 0) {
        t.push(...e)
      }
      return t
    }, [])
  }

  const getForm = (initForm = {}) => {
    const form = cloneDeep(initForm)

    formCallbacks.forEach((cb) => {
      cb()?.forEach(({ path, value }) => {
        set(form, path, value)
      })
    })

    return form
  }
  const clear = () => {
    formCallbacks = []
    validateCallbacks = []
  }

  provide(FORM_MANAGE, {
    registValidate: registValidateCallback,
    removeValide: removeValidateCallback,
    registForm: registFormCallback,
    removeForm: removeFormCallback
  })
  onBeforeUnmount(() => {
    clear()
  })

  return {
    getForm,
    validate,
    registValidate: registValidateCallback,
    removeValide: removeValidateCallback,
    registForm: registFormCallback,
    removeForm: removeFormCallback
  }
}
