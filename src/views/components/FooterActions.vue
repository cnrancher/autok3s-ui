<template>
  <div class="footer-actions">
    <slot></slot>
  </div>
</template>
<style>
.footer-actions {
  display: grid;
  column-gap: 20px;
  margin-top: 20px;
  grid-auto-flow: column;
  justify-content: end;
}
</style>