<template>
  <div>
    <k-tabs>
      <k-tab-pane name="test" label="label1" closable>
        <div>pane 1</div>
      </k-tab-pane>
      <k-tab-pane name="test2" label="label2">
        <div>pane 2</div>
      </k-tab-pane>
    </k-tabs>
    <k-tabs tab-position="left">
      <k-tab-pane name="test" label="label1">
        <div>pane 1</div>
      </k-tab-pane>
      <k-tab-pane name="test2" label="label2">
        <div>pane 2</div>
      </k-tab-pane>
    </k-tabs>
  </div>
</template>
<script>
export default {
  name: 'ExamplesTabs'
}
</script>