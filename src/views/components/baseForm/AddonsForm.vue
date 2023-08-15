<template>
  <div>
    <div class="text-size-18px mb-10px">Add-ons</div>
    <div v-for="item in items" :key="item.name" class="border-3 rounded-md p-3 mb-3">
      <div class="flex justify-between text-size-18px">
        {{ item.name }}
        <KIcon type="close" class="cursor-pointer" @click="remove(item)"></KIcon>
      </div>
      <YamlConfigForm
        v-model="item.manifest"
        class="col-span-1 sm:col-span-2"
        label="Manifest"
        :options="{ readOnly: true, lint: false }"
      />
      <ArrayListForm
        ref="values"
        :init-value="item.values"
        :readonly="readonly"
        label="Values"
        placeholder="e.g. foo=bar"
        action-label="Add Value"
      />
    </div>

    <KDropdown>
      <KButton class="btn role-primary" :disabled="addOns.length === 0">
        Add
        <KIcon type="arrow-right-blod" direction="down"></KIcon>
      </KButton>
      <template #content>
        <KDropdownMenu>
          <KDropdownMenuItem v-for="item in addOns" :key="item.id" @click="handleItemClick(item)">
            {{ item.label }}
          </KDropdownMenuItem>
        </KDropdownMenu>
      </template>
    </KDropdown>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import useAddonStore from '@/store/useAddonStore.js'
import YamlConfigForm from '@/views/components/baseForm/YamlConfigForm.vue'
import ArrayListForm from '@/views/components/baseForm/ArrayListForm.vue'
import { Base64 } from 'js-base64'

const props = defineProps({
  initValues: {
    type: Array,
    default() {
      return []
    }
  },
  initAddons: {
    type: Array,
    default() {
      return []
    }
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const addonStore = useAddonStore()
const items = ref([])
const values = ref([])
watch(
  [() => props.initValue, () => addonStore.data],
  (v, d) => {
    items.value = d
      .filter((item) => v.includes(item.id))
      .map((item) => ({ ...item, manifest: Base64.decode(item.manifest), values: [] }))
  },
  {
    immediate: true
  }
)

const addOns = computed(() => {
  const d = items.value.map((item) => item.id)
  return addonStore.data
    .filter((item) => !d.includes(item.id))
    .map((item) => ({ label: item.name, value: item.id, raw: item }))
})

const handleItemClick = (item) => {
  items.value.push({ ...item.raw, values: [], manifest: Base64.decode(item.raw.manifest) })
}
const remove = (item) => {
  const i = items.value.findIndex((i) => i === item)

  if (i > -1) {
    items.value.splice(i, 1)
  }
}

const getForm = () => {
  return items.value.reduce(
    (t, a, i) => {
      t.enable.push(a.name)
      const v = values.value[i].getForm()?.map((v) => `${a.name}.${v}`)
      if (v?.length > 0) {
        t.values.push(...v)
      }
      return t
    },
    { enable: [], values: [] }
  )
}

defineExpose({ getForm })
</script>
