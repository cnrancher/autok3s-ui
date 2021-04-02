<template>
  <div class="template-filter">
    <input
      ref="inputRef"
      class="k-input-search template-filter__search"
      type="search"
      :placeholder="placeholder"
      :disabled="loading || disabled"
      v-model="searchQuery"
      @focus="handleFocus"
      @keydown.down.prevent="handleKeyDown"
      @keydown.up.prevent="handleKeyUp"
      @keydown.esc.stop.prevent="handleKeyESC"
      @keydown.enter.stop.prevent="handleKeyEnter">
      <div class="template-filter__display-value" v-show="!show">{{templateDisplayValue}}</div>
      <button class="btn bg-primary btn-sm template-filter__btn"
        :disabled="!currentTemplate || loading || disabled"
        @click="handleApplyTemplate">Fill Form</button>
      <teleport to="body">
        <div ref="resultRef" class="template-filter__content" :class="{'template-filter--active': show}" @click.prevent.stop="handlePopperClick">
          <div v-if="loading"><k-icon type="loading"></k-icon>Loading...</div>
            <div v-else-if="error">{{error}}</div>
            <div v-else-if="noResult">
              No Results
            </div>
            <div v-else-if="noData">
              No Data
            </div>
            <div v-else class="template-filter__result">
              <template v-for="d in dataGroup" :key="d.group">
                <div class="template-filter__title"><span class="template-filter__group-name">Provider:</span> <span>{{d.group}}</span></div>
                <div class="template-filter__row-wrap"
                  :class="{'template-filter--selected': c.id === currentTemplate?.id, 'template-filter--hover': c.id === hoverTemplate?.id}"
                  v-for="c in d.children"
                  :key="c.id"
                  @click="handleSelect(c)">
                  <div>{{c.name}}</div>
                  <div>{{c.options.region}}</div>
                  <div>{{c.options.zone}}</div>
                </div>
              </template>
            </div>
        </div>
      </teleport>
  </div>
</template>
<script>

import {computed, defineComponent, inject, nextTick, ref, toRefs, watch, watchEffect} from 'vue'
import KIcon from '@/components/Icon'
import useDataSearch from '@/composables/useDataSearch.js'
import useDataGroup from '@/composables/useDataGroup.js'
import usePopper from '@/composables/usePopper.js'
import useClickOutside from '@/composables/useClickOutside.js'
const popperOption = {
  placement: 'bottom-start'
}
export default defineComponent({
  props: {
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
      default: '',
    }
  },
  emits: ['update:modelValue', 'apply-template'],
  setup(props, {emit}) {
    const templateStore = inject('templateStore')
    const inputRef = ref(null)
    const resultRef = ref(null)
    const show = ref(false)
    const currentTemplate = ref(null)
    

    const { create, remove, update } = usePopper(inputRef, resultRef, popperOption)
    useClickOutside(inputRef, () => {
      show.value = false
    })
    const { loading, templates, error } = toRefs(templateStore.state)
    const providerTemplates = computed(() => {
      if (props.provider) {
        return templates.value.filter((t) => t.provider === props.provider)
      }
      return templates.value
    })
    const {searchQuery, searchFields, dataMatchingSearchQuery} = useDataSearch(providerTemplates)
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
      return t ? `${t.provider} | ${t.name} | ${t.options.region} | ${t.options.zone}` : ''
    })
    watchEffect(() => {
      currentTemplate.value = props.modelValue
    })

    const handleFocus = () => {
      searchQuery.value = ''
      show.value = true
    }

    const handleSelect = (template)=> {
      currentTemplate.value = template
      show.value = false
      emit('update:modelValue', template.id)
    }
    const handlePopperClick = (e) => {
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
    const createPopper = () => {
      create()
      update()
    }
    watch(show, () => {
      if (show.value) {
        nextTick(() => {
          createPopper()
        })
        return
      }
      remove()
    })
    watch(dataGroup, () => {
      if (show.value) {
        nextTick(() => {
          update()
        })
      }
    })
    watch(() => props.provider, () => {
      currentTemplate.value = null
    })
    return {
      placeholder,
      searchQuery,
      handleFocus,
      handleSelect,
      handleApplyTemplate,
      loading,
      error,
      noResult,
      noData,
      dataGroup,
      show,
      inputRef,
      resultRef,
      templateDisplayValue,
      currentTemplate,
      handlePopperClick,
      handleKeyDown,
      handleKeyUp,
      handleKeyESC,
      handleKeyEnter,
      hoverTemplate,
    }
  },
  components: {
    KIcon
  }
})
</script>
<style>
.template-filter__result {
  display: grid;
  grid-template-columns: "name region zone";
  row-gap: 6px;
}
.template-filter__title {
  grid-column: 1 / span 3;
  font-size: 12px;
  padding: 10px 20px 0 20px;
  &:not(:first-child) {
    border-top: 1px solid var(--border);;
  }
}
.template-filter__row-wrap {
  position: relative;
  display: contents;
  &:hover > div, &.template-filter--selected > div, &.template-filter--hover > div {
    cursor: pointer;
    color: var(--dropdown-hover-text);
    background: var(--dropdown-hover-bg);
  }
  & > div {
    padding: 4px 6px;
  }
  & > div:first-child {
    padding-left: 20px;
  }
  & > div:last-child {
    padding-right: 20px;
  }
}
.template-filter__content {
  display: none;
  position: absolute;
  background-color: var(--dropdown-bg);
  z-index: var(--popper-z-index);
  border: 1px solid var(--dropdown-border);
  border-radius: var(--border-radius);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  box-shadow: 0 5px 20px var(--shadow);
  max-height: 90vh;
  overflow: auto;
  min-width: 324px;
}
.template-filter--active {
  display: block;
}
.template-filter {
  width: 400px;
  display: grid;
  grid-template-areas: "search btn";
  grid-template-columns: 1fr auto;
  column-gap: 6px;
  align-items: center;
}
.template-filter__search {
  grid-area: search;
}
.template-filter__display-value {
  grid-area: search;
  pointer-events: none;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 10px;
}
.template-filter__btn {
  grid-area: btn;
  height: 40px;
}
.template-filter__group-name {
  color: var(--sortable-table-group-label);
  text-transform: capitalize;
}
</style>
