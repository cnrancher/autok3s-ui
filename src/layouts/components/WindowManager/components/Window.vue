<template>
  <div class="window">
    <div class="window__body">
       <slot></slot>
    </div>
    <div class="window__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
<script>
export default {
  
}
</script>
<style>
.window {
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
}
.window__body {
  padding: calc( 2 * var(--outline-width) );
  overflow: auto;
}
.window__footer {
  display: grid;
  grid-auto-flow: column;
  justify-content: space-between;
  padding: 2px 5px;
  align-items: center;
  background-color: var(--wm-title-bg);
  border-top: 1px solid var(--wm-title-border);
}
</style>