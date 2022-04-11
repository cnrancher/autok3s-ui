import {ref, computed, unref} from 'vue'

export default function useDataGroup(data) {
  const groupField = ref('')
  const dataGroup = computed(() => {
    const groupBy = groupField.value
    const d = unref(data)
    if (!groupBy) {
      return [{
        group: '',
        children: d,
      }]
    }
    const groupMap = d.reduce((t, c) => {
      const children = t[c[groupBy]] ?? []
      children.push(c)
      t[c[groupBy]] = children
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
