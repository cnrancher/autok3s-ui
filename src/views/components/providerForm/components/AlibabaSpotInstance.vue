<script setup>
import NumberForm from '@/views/components/baseForm/NumberForm.vue'
import useFormRegist from '@/composables/useFormRegist.js'
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  initValue: {
    type: Object,
    required: true
  },
  desc: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const options = reactive({})

const optionFields = ['spot-strategy', 'spot-duration', 'spot-price-limit']

watch(
  optionFields.map((k) => {
    return () => props.initValue.options[k]
  }),
  () => {
    optionFields.forEach((k) => {
      options[k] = props.initValue.options[k]
    })
  },
  { immediate: true }
)

const showDuration = computed(() => {
  return ['SpotWithPriceLimit', 'SpotAsPriceGo'].includes(options['spot-strategy'])
})
const showPriceLimit = computed(() => {
  return 'SpotWithPriceLimit' === options['spot-strategy']
})

const getForm = () => {
  const parts = [{ path: ['options', 'spot-strategy'], value: options['spot-strategy'] }]
  if (showDuration.value) {
    parts.push({
      path: ['options', 'spot-duration'],
      value: options['spot-duration']
    })
  }
  if (showPriceLimit.value) {
    parts.push({
      path: ['options', 'spot-price-limit'],
      value: options['spot-price-limit']
    })
  }

  return parts
}
useFormRegist(getForm)
</script>
<template>
  <KSelect
    v-model="options['spot-strategy']"
    :desc="desc.options['spot-strategy']"
    label="Spot Strategy"
    :disabled="readonly"
    placeholder="No Spot"
  >
    <KOption value="NoSpot" label="No Spot"></KOption>
    <KOption value="SpotWithPriceLimit" label="Spot With Price Limit"></KOption>
    <KOption value="SpotAsPriceGo" label="Spot As Price Go"></KOption>
  </KSelect>
  <NumberForm
    v-show="showDuration"
    v-model.number="options['spot-duration']"
    :min="0"
    :max="6"
    label="Spot Duration"
    :desc="desc.options['spot-duration']"
    :readonly="readonly"
  ></NumberForm>
  <NumberForm
    v-show="showPriceLimit"
    v-model.number="options['spot-price-limit']"
    :min="0"
    :precision="3"
    label="Spot Price Limit"
    :desc="desc.options['spot-price-limit']"
    :readonly="readonly"
  ></NumberForm>
</template>
