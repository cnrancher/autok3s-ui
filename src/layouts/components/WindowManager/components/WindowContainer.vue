<template>
  <div class="h-full">
    <div class="grid grid-rows-[1fr_auto] h-full">
      <div class="p-2px overflow-auto">
        <slot></slot>
      </div>
      <div class="grid grid-flow-col justify-between items-center py-2px px-5px bg-gray-300 border-t">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>
