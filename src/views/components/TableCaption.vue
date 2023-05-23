<template>
  <div class="grid grid-cols-[1fr,auto,minmax(min-content,200px)] pb-20px gap-x-10px min-h-60px">
    <div>
      <slot name="actions"></slot>
    </div>
    <template v-if="group">
      <KRadioGroup :model-value="groupBy" @update:model-value="$emit('update:groupBy', $event)">
        <KRadioButton label="">
          <KIcon type="category" :color="groupBy === '' ? '#fff' : ''"></KIcon>
        </KRadioButton>
        <KRadioButton :label="group">
          <KIcon type="folder" :color="groupBy === group ? '#fff' : ''"></KIcon>
        </KRadioButton>
      </KRadioGroup>
    </template>
    <div v-else></div>
    <input
      :modelValue="query"
      type="search"
      placeholder="Filter"
      class="focus-visible:outline-none px-12px rounded border hover:bg-gray-100"
      @update:modelValue="$emit('update:query', $event)"
    />
  </div>
</template>

<script setup>
defineProps({
  group: {
    type: String,
    default: ''
  },
  groupBy: {
    type: String,
    default: ''
  },
  query: {
    type: String,
    default: ''
  }
})
defineEmits(['update:query', 'update:groupBy'])
</script>
