<template>
  <div>
    <div class="text-size-18px mb-10px">Add-ons</div>
    <div v-for="item in items" :key="item.name" class="border-3 rounded-md p-3 mb-3">
      <div class="flex justify-between text-size-18px">
        {{ item.name }}
        <KIcon type="close" class="cursor-pointer" @click="remove(item)"></KIcon>
      </div>
      <YamlConfigForm
        ref="manifest"
        v-model="item.manifest"
        class="col-span-1 sm:col-span-2"
        label="Manifest"
        :options="{ readOnly: true, lint: false }"
      />
      <ArrayListForm
        ref="valuesRef"
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
import { ref, computed, watch, watchEffect, nextTick } from 'vue'
import useAddonStore from '@/store/useAddonStore.js'
import YamlConfigForm from '@/views/components/baseForm/YamlConfigForm.vue'
import ArrayListForm from '@/views/components/baseForm/ArrayListForm.vue'
import { Base64 } from 'js-base64'

const props = defineProps({
  initValues: {
    type: Object,
    default() {
      return {}
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
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const addonStore = useAddonStore()
const items = ref([])
const valuesRef = ref([])
const manifest = ref(null)
watchEffect(() => {
  if (props.visible) {
    nextTick(() => {
      manifest.value?.forEach((item) => item.refresh())
    })
  }
})
watch(
  [() => props.initValues, () => props.initAddons, () => addonStore.data],
  ([v = {}, addons = [], d]) => {
    items.value = d
      .filter((item) => addons?.includes(item.id))
      .map((item) => ({
        ...item,
        manifest: Base64.decode(item.manifest),
        values: Object.entries(v)
          .filter(([k]) => k.split('.')[0] === item.id)
          .map(([k, v = '']) => (v ? `${k.split('.')[1]}=${v}` : k.split('.')[1]))
      }))
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
  items.value.push({
    ...item.raw,
    values: Object.entries(item.raw.values ?? {}).map(([k, v = '']) => (v ? `${k}=${v}` : k)),
    manifest: Base64.decode(item.raw.manifest)
  })
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
      const v = valuesRef.value[i].getForm()?.reduce((t, c) => {
        const [k, v = ''] = c.split('=')
        t[`${a.name}.${k}`] = v
        return t
      }, {})
      if (v && Object.keys(v).length > 0) {
        Object.assign(t.values, v)
      }
      return t
    },
    { enable: [], values: {} }
  )
}

defineExpose({ getForm })
</script>
