<template>
  <header class="page-header">
    <h1 class="page-head__title"><slot name="title"></slot></h1>
    <div class="page-header__subtitle"><slot name="subtitle"></slot></div>
    <div class="page-header__actions">
      <slot name="actions"></slot>
    </div>
  </header>
</template>
<style>
.page-header {
  display: grid;
  grid-template-areas: "title actions"
                       "subtitle actions";
  grid-template-columns: 1fr auto;
  margin-bottom: 20px;
  align-items: center;
}
.page-head__title {
  grid-area: title;
  & a {
    color: var(--link-text);
  }
}
.page-header__subtitle {
  grid-area: subtitle;
  color: var(--input-label);
}
.page-header__actions {
  grid-area: actions;
  display: grid;
  grid-auto-flow: column;
  column-gap: 10px;
  & button.btn{
    color: var(--link-text);
    border: thin solid var(--link-text);
    background: var(--tooltip-bg);
  }
}
</style>