<template>
  <slot />
</template>
<script setup>
const props = defineProps({
  result: Object,
  form: Object,
});
</script>
