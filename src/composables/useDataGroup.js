import {ref, computed} from 'vue'

export default function useDataGroup(data) {
  const groupField = ref('')
  const dataGroup = computed(() => {
    if (!groupField.value) {
      return [{
        group: '',
        children: data.value,
      }]
    }
    const groupMap = data.value.reduce((t, c) => {
      const children = t[c[groupField.value]] ?? []
      children.push(c)
      t[c[groupField.value]] = children
      return t
    }, {})
    return Object.entries(groupMap).map(e => ({
      group: e[0],
      children: e[1]
    }))
  })
  return {
    groupField,
    dataGroup
  }
}
