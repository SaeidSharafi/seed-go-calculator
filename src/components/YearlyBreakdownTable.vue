<template>
   <div
      v-if="scenarioResults.leader.error"
     id="results-table-container" class="bg-green-50 rounded-xl p-4 shadow flex flex-col gap-2 border border-green-100 text-red-500"
    >
      <p class="font-semibold">Error</p>
      <p>Impossible to Level up</p>
    </div>
 <div v-else id="results-table-container" class="mb-4 animate-fade-in">
    <div
      v-if="
        result.yearlyBreakdown &&
        result.yearlyBreakdown.length > 0 &&
        form.currentAge !== form.targetAge
      "
      class="bg-yellow-50/80 border border-yellow-200 rounded-2xl shadow p-4 overflow-x-auto text-xs md:text-base"
    >
      <h3 class="font-bold mb-2 flex items-center gap-2 text-yellow-700">
        <svg
          class="w-5 h-5 text-yellow-400"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path d="M8 17l4 4 4-4m0-5V3" />
        </svg>
        SLOV Earnings by Age
      </h3>
      <table class="min-w-full text-sm rounded-xl overflow-hidden text-center">
        <thead class="bg-yellow-100 text-yellow-900">
          <tr>
            <th class="p-2 font-semibold">Age</th>
            <th class="p-2 font-semibold">End Level</th>
            <th class="p-2 font-semibold">Avg SLOV/Hunt</th>
            <th class="p-2 font-semibold">Avg Endurance Used</th>
            <th class="p-2 font-semibold">Avg Rec Cost</th>
            <th class="p-2 font-semibold">Hunts</th>
            <th class="p-2 font-semibold">Total SLOV</th>
            <th class="p-2 font-semibold">End Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="year in result.yearlyBreakdown"
            :key="year.age"
            class="even:bg-yellow-50 hover:bg-yellow-100 transition"
          >
            <td class="p-2">Year {{ year.age }}</td>
            <td class="p-2">Lv {{ year.level }}</td>
            <td class="p-2">{{ year.slovePerHunt }}</td>
            <td class="p-2">{{ year.endurancePerHunt }}</td>
            <td class="p-2">{{ year.recoveryCostPerhunt }}</td>
            <td class="p-2">{{ year.huntsInYear }}</td>
            <td class="p-2">{{ year.totalSloveInYear }}</td>
            <td class="p-2">{{ year.sloveBalance ?? 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p
      v-else-if="form.currentAge !== form.targetAge"
      class="text-gray-500 text-center py-4 bg-yellow-50 rounded-xl"
    >
      Year-by-year earnings data not available.
    </p>
  </div>
</template>
<script setup>
const props = defineProps({
  result: Object,
  scenarioResults: Object,
  form: Object,
});
</script>
<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (max-width: 640px) {
  table,
  thead,
  tbody,
  th,
  td,
  tr {
    display: block;
  }
  thead tr {
    display: none;
  }
  tbody tr {
    margin-bottom: 1rem;
    border-radius: 1rem;
    box-shadow: 0 1px 4px #facc15;
    background: #fef9c3;
  }
  td {
    padding-left: 70%;
    position: relative;
    min-height: 2.5rem;
    border: none;
  }
  td:before {
    position: absolute;
    left: 1rem;
    top: 0.5rem;
    width: 70%;
    text-align: left;
    white-space: nowrap;
    font-weight: bold;
    color: #b45309;
  }
  
  td:nth-of-type(1):before {
    content: "Age";
  }
  td:nth-of-type(2):before {
    content: "End Level";
  }
  td:nth-of-type(3):before {
    content: "Avg SLOV/Hunt";
  }
    td:nth-of-type(4):before {
    content: "Avg Endurance Used";
  }
  td:nth-of-type(5):before {
    content: "Avg Rec Cost";
  }
  td:nth-of-type(6):before {
    content: "Hunts";
  }
  td:nth-of-type(7):before {
    content: "Total SLOV";
  }
  td:nth-of-type(8):before {
    content: "End Balance";
  }
}
</style>
