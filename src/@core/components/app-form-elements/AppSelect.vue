<script lang="ts" setup>
defineOptions({
  name: 'AppSelect',
  inheritAttrs: false,
})

const elementId = computed(() => {
  const attrs = useAttrs()
  const _elementIdToken = attrs.id || attrs.label

  return _elementIdToken ? `app-select-${_elementIdToken}-${Math.random().toString(36).slice(2, 7)}` : undefined
})

const label = computed(() => useAttrs().label as string | undefined)
</script>

<template>
  <div class="app-select flex-grow-1" :class="$attrs.class">
    <VLabel v-if="label" :for="elementId" class="mb-1 text-body-2" style="line-height: 15px;" :text="label" />
    <VSelect v-bind="{
      ...$attrs,
      class: null,
      label: undefined,
      variant: 'outlined',
      id: elementId,
      menuProps: { contentClass: ['app-inner-list', 'app-select__content', 'v-select__content', $attrs.multiple !== undefined ? 'v-list-select-multiple' : ''] },
    }">
      <template v-if="$slots.prepend" #prepend="{ props }">
        <slot name="prepend" v-bind="props" />
      </template>
      <template v-if="$slots.default" #default="{ props }">
        <slot name="default" v-bind="props" />
      </template>
      <template v-if="$slots.append" #append="{ props }">
        <slot name="append" v-bind="props" />
      </template>
    </VSelect>
  </div>
</template>
