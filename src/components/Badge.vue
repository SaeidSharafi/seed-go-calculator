<template>
  <span :class="badgeClass">
    <span v-if="icon" class="mr-1 flex items-center">{{ icon }}</span>
    <span class="mr-1">{{ label }}</span>
    <span>{{ value }}</span>
  </span>
</template>

<script setup>
const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  color: { type: String, default: "gray" }, // gray, green, blue, red, yellow
  icon: { type: String, default: "" },
});

const colorClasses = {
  gray: "bg-gray-200 text-gray-800",
  green: "bg-green-200 text-green-800",
  blue: "bg-blue-200 text-blue-800",
  red: "bg-red-200 text-red-800",
  yellow: "bg-yellow-200 text-yellow-800",
  orange: "bg-orange-200 text-orange-800",
};

const badgeClass = `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
  colorClasses[props.color] || colorClasses.gray
}`;
</script>

<style scoped></style>
