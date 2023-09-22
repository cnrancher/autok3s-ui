<template>
  <div class="template-filter">
    <input
      ref="inputRef"
      v-model="searchQuery"
      class="template-filter__search p-8px rounded border-solid border-1 border-gray-300 focus-visible:outline-none hover:bg-gray-100"
      type="search"
      :placeholder="placeholder"
      :disabled="loading || disabled"
      @click.prevent="handleFocus"
      @keydown.down.prevent="handleKeyDown"
      @keydown.up.prevent="handleKeyUp"
      @keydown.esc.stop.prevent="handleKeyESC"
      @keydown.tab="handleKeyESC"
      @keydown.enter.stop.prevent="handleKeyEnter"
    />
    <div v-show="!show" class="template-filter__display-value pointer-events-none overflow-hidden truncate p-10px">
      {{ templateDisplayValue }}
    </div>
    <button
      class="btn role-primary btn-sm template-filter__btn"
      :disabled="!currentTemplate || loading || disabled"
      @click="handleApplyTemplate"
    >
      Fill Form
    </button>
    <teleport to="body">
      <div
        ref="resultRef"
        class="absolute bg-white z-$popper-z-index border-solid border-1 rounded shadow max-h-90vh overflow-auto min-w-324px"
        :class="[show ? 'block' : 'hidden']"
        :style="floatingStyles"
        @click.prevent.stop="handlePopperClick"
      >
        <div v-if="loading">
          <k-icon type="loading"></k-icon>
          Loading...
        </div>
        <div v-else-if="error">{{ error }}</div>
        <div v-else-if="noResult">No Results</div>
        <div v-else-if="noData">No Data</div>
        <div v-else class="template-filter__result">
          <template v-for="d in dataGroup" :key="d.group">
            <div class="col-span-3 text-size-12px pt-10px pb-0 px-20px">
              <span class="template-filter__group-name">Provider:</span>
              <span>{{ d.group }}</span>
            </div>
            <div
              v-for="c in d.children"
              :key="c.id"
              class="template-filter__row-wrap relative contents"
              :class="{
                'template-filter--selected': c.id === currentTemplate?.id,
                'template-filter--hover': c.id === hoverTemplate?.id
              }"
              @click="handleSelect(c)"
            >
              <div>{{ c.name }}</div>
              <div>{{ c.options.region }}</div>
              <div>{{ c.options.zone }}</div>
            </div>
          </template>
        </div>
      </div>
    </teleport>
  </div>
</template>
<script>
export default {
  name: 'TemplateFilter'
}
</script>

<script setup>
import { computed, ref, watch } from 'vue'
import useDataSearch from '@/composables/useDataSearch.js'
import useDataGroup from '@/composables/useDataGroup.js'
import { onClickOutside } from '@vueuse/core'
import useTemplateStore from '@/store/useTemplateStore.js'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { offset, flip, shift, useFloating, autoUpdate } from '@floating-ui/vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  provider: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'apply-template'])
const route = useRoute()
const templateStore = useTemplateStore()
const inputRef = ref(null)
const resultRef = ref(null)
const show = ref(false)
const currentTemplate = ref(null)

const middleware = ref([offset(10), flip(), shift()])
const { floatingStyles } = useFloating(inputRef, resultRef, {
  placement: 'bottom-start',
  whileElementsMounted: autoUpdate,
  middleware
})

onClickOutside(resultRef, () => {
  show.value = false
})
const { loading, data: templates, error } = storeToRefs(templateStore)
const providerTemplates = computed(() => {
  if (props.provider) {
    return templates.value.filter((t) => t.provider === props.provider && !t.status)
  }
  return templates.value.filter((t) => !t.status)
})
const { searchQuery, searchFields, dataMatchingSearchQuery } = useDataSearch(providerTemplates)
const hoverIndex = ref(-1)
const resultLength = computed(() => {
  return dataMatchingSearchQuery.value.length
})
const hoverTemplate = computed(() => {
  return dataMatchingSearchQuery.value[hoverIndex.value]
})
searchFields.value = ['provider', 'name', 'options.region', 'options.zone']
const { groupField, dataGroup } = useDataGroup(dataMatchingSearchQuery)
groupField.value = 'provider'

const placeholder = computed(() => {
  if (show.value || !currentTemplate.value) {
    return 'Place select a template'
  }
  return ''
})

const noResult = computed(() => {
  if (templates.value.length > 0 && dataMatchingSearchQuery.value.length === 0) {
    return true
  }
  return false
})
const noData = computed(() => {
  return templates.length === 0
})
const templateDisplayValue = computed(() => {
  if (!currentTemplate.value) {
    return ''
  }
  const t = currentTemplate.value
  if (!t) {
    return ''
  }
  if (['native', 'k3d', 'harvester'].includes(t.provider)) {
    return `${t.provider} | ${t.name}`
  }
  return `${t.provider} | ${t.name} | ${t.options.region} | ${t.options.zone}`
})

watch(
  [() => props.modelValue, () => route, templates],
  ([v, r, data]) => {
    if (v) {
      const t = data.find((t) => t.id === v)
      if (t) {
        currentTemplate.value = t
      }
    } else if (r.query.templateId) {
      const id = r.query.templateId
      const t = data.find((t) => t.id === id)
      if (t) {
        currentTemplate.value = t
      }
    }
  },
  { immediate: true }
)

const handleFocus = () => {
  searchQuery.value = ''
  show.value = true
}

const handleSelect = (template) => {
  currentTemplate.value = template
  show.value = false
  emit('update:modelValue', template.id)
}
const handlePopperClick = () => {
  // do nothing
}
const handleKeyDown = () => {
  if (!show.value) {
    return
  }
  if (resultLength.value === 0) {
    return
  }
  hoverIndex.value = (hoverIndex.value + 1) % resultLength.value
}
const handleKeyUp = () => {
  if (!show.value) {
    return
  }
  if (resultLength.value === 0) {
    return
  }
  hoverIndex.value = (hoverIndex.value - 1 + resultLength.value) % resultLength.value
}
const handleKeyESC = () => {
  show.value = false
}
const handleKeyEnter = () => {
  if (!show.value) {
    return
  }
  if (hoverTemplate.value) {
    currentTemplate.value = hoverTemplate.value
    emit('update:modelValue', hoverTemplate.value.id)
  }
  inputRef.value.blur()
  show.value = false
}
const handleApplyTemplate = () => {
  emit('apply-template', currentTemplate.value.id)
}
watch(show, () => {
  hoverIndex.value = -1
  searchQuery.value = ''
})
</script>
<style>
.template-filter__result {
  display: grid;
  grid-template-columns: 'name region zone';
  row-gap: 6px;
}
.template-filter__row-wrap {
  &:hover > div,
  &.template-filter--selected > div,
  &.template-filter--hover > div {
    @apply cursor-pointer text-white bg-$primary;
  }
  & > div {
    padding: 2px 6px;
  }
  & > div:first-child {
    padding-left: 20px;
  }
  & > div:last-child {
    padding-right: 20px;
  }
}

.template-filter {
  width: 400px;
  display: grid;
  grid-template-areas: 'search btn';
  grid-template-columns: 1fr auto;
  column-gap: 6px;
  align-items: center;
}
.template-filter__search {
  grid-area: search;
}
.template-filter__display-value {
  grid-area: search;
}
.template-filter__btn {
  grid-area: btn;
  height: 40px;
}
.template-filter__group-name {
  @apply text-gray-500 capitalize;
}
</style>
