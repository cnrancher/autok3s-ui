<template>
  <div class="k-tabs__nav" :class="tabNavClass">
    <div v-for="t in tabs" :key="t.id"
      class="k-tabs__item"
      :class="{'k-tabs__item--active': t.id === activeTabId, 'k-tabs__item--disabled': t.disabled}" @click="setActiveTab(t)">
      {{t.label}}&nbsp;
      <k-icon v-if="t.closable || tabsClosable" type="close" @click="removeTab(t)"></k-icon>
    </div>
  </div>
</template>
<script>
import KIcon from '@/components/Icon'
import { computed, inject } from 'vue'
export default {
  props: {
    tabPosition: {
      type: String,
      default: 'top'
    }
  },
  setup(props) {
    const tabsStore = inject('tabsStore')
    const tabsEmit = inject('tabsEmit')
    const tabNavClass = computed(() => {
      return [`k-tabs__nav--${props.tabPosition}`, ]
    })
    const activeTabId = computed(()=>tabsStore.state.active)
    const setActiveTab = (t) => {
      if (!t.disabled) {
        tabsStore.action.setActiveTab(t.id)
        tabsEmit('update:modelValue', t.name)
      }
    }
    const removeTab = (t) => {
      !t.disabled && tabsStore.action.removeTab(t.id)
    }
    const tabsClosable = tabsStore.state.closable
    return {
      tabs: tabsStore.state.tabs,
      tabsClosable,
      tabNavClass,
      activeTabId,
      setActiveTab,
      removeTab,
    }
  },
  components: {
    KIcon,
  }
}
</script>
<style>
.k-tabs__nav {
  min-width: 200px;
}
.k-tabs__nav--top,
.k-tabs__nav--bottom {
  display: flex;
  align-items: center;
  & > .k-tabs__item {
    padding: 5px 10px;
  }
  & > .k-tabs__item--active {
    background-color: var(--body-bg);
  }
}
.k-tabs__nav--left,
.k-tabs__nav--right{
  display: flex;
  flex-direction: column;
  & > .k-tabs__item {
    padding: 10px 15px;
    border-left: 5px solid transparent;
  }
  & > .k-tabs__item--active {
    background-color: var(--body-bg);
    border-left: 5px solid var(--primary);
    color: var(--input-label);
  }
}
.k-tabs__item {
  display: flex;
  align-items: center;
  color: var(--primary);
  cursor: pointer;
}

.k-tabs__item--disabled {
  cursor: not-allowed;
}
</style>