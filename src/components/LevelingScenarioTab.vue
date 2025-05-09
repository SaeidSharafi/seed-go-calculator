<template>
  <slot />
</template>
<script setup>
const props = defineProps({
  scenarioResults: Object,
  utils: Object,
});
</script>
