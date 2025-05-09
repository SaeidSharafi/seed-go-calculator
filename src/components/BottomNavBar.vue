<template>
  <nav
    v-if="show && tabs.length > 0"
    class=" w-full flex bg-green-50 border-t border-green-200 z-40 md:static md:border-0"
    style="backdrop-filter: blur(4px)"
  >
    <button
      v-for="(tab, i) in tabs"
      :key="tab.name + '-nav'"
      @click="$emit('update:activeTab', i)"
      :class="[
        'flex-1 flex flex-col items-center justify-center py-2 transition',
        activeTab === i ? 'text-green-700' : 'text-gray-500',
      ]"
    >
      <component v-if="tab.icon" :is="tab.icon" class="w-5 h-5" />
      <span class="text-xs">{{ tab.name }}</span>
    </button>
  </nav>
</template>
<script setup>
const props = defineProps({
  tabs: Array,
  activeTab: Number,
  show: Boolean,
});
const emit = defineEmits(["update:activeTab"]);
</script>
