import { h, render, onBeforeUnmount, mergeProps, getCurrentInstance } from 'vue'

export default function useModal(component, props = {}, options = {}) {
  const inst = getCurrentInstance()
  const { appendTo, appContext } = Object.assign(
    {},
    { appendTo: document.body, immediate: false, appContext: inst.appContext },
    options
  )
  const container = document.createElement('div')

  const onClose = () => {
    close()
  }
  const show = (p = {}) => {
    const merged = mergeProps(props, p, { onClose, teleportDisabled: false, modelValue: true, visible: true })
    const vn = h(component, merged)
    vn.appContext = appContext
    render(vn, container)
    if (container.firstElementChild) {
      appendTo.appendChild(container.firstElementChild)
    }
  }
  const close = () => {
    render(null, container)
  }

  onBeforeUnmount(() => {
    close()
  })

  return {
    show,
    close
  }
}
