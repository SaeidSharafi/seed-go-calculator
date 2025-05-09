<script setup>
const props = defineProps({
  title: { type: String, required: true },
  icon: { type: [Object, Function], default: null },
});
</script>
<template>
  <div
    class="bg-white/90 rounded-xl shadow p-4 flex flex-col items-center mb-2"
  >
    <div class="flex items-center gap-2 mb-2">
      <component v-if="icon" :is="icon" class="w-5 h-5" />
      <span class="text-base font-bold text-gray-700">{{ title }}</span>
    </div>
    <div class="w-full">
      <slot />
    </div>
  </div>
</template>
