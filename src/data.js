export const RARITY_DATA = [
    { name: "Common", minBase: 1, maxBase: 10, bonusPts: 4 },
    { name: "Uncommon", minBase: 8, maxBase: 18, bonusPts: 6 },
    { name: "Rare", minBase: 15, maxBase: 35, bonusPts: 8 },
    { name: "Epic", minBase: 28, maxBase: 63, bonusPts: 10 },
    { name: "Legendary", minBase: 50, maxBase: 112, bonusPts: 12 },
];

export const ENDURANCE_COST_MULTIPLIER = {
    Common: {
        0: 0.2, 1: 0.31, 2: 0.32, 3: 0.33, 4: 0.35, 5: 0.36, 6: 0.37, 7: 0.38, 8: 0.4, 9: 0.41, 10: 0.42, 11: 0.44, 12: 0.46, 13: 0.48, 14: 0.5, 15: 0.52, 16: 0.54, 17: 0.56, 18: 0.58, 19: 0.6, 20: 0.62, 21: 0.64, 22: 0.67, 23: 0.7, 24: 0.72, 25: 0.75, 26: 0.78, 27: 0.81, 28: 0.83, 29: 0.87, 30: 0.9
    },
    Uncommon: {
        0: 0.3, 1: 0.41, 2: 0.43, 3: 0.45, 4: 0.46, 5: 0.48, 6: 0.5, 7: 0.51, 8: 0.53, 9: 0.55, 10: 0.68, 11: 0.72, 12: 0.74, 13: 0.77, 14: 0.79, 15: 0.83, 16: 0.85, 17: 0.89, 18: 0.92, 19: 0.96, 20: 1, 21: 1.03, 22: 1.07, 23: 1.1, 24: 1.14, 25: 1.2, 26: 1.24, 27: 1.27, 28: 1.33, 29: 1.38, 30: 1.44
    },
    Rare: {
        0: 0.4, 1: 0.51, 2: 0.54, 3: 0.57, 4: 0.59, 5: 0.61, 6: 0.63, 7: 0.65, 8: 0.67, 9: 0.69, 10: 0.936, 11: 0.98, 12: 1.01, 13: 1.05, 14: 1.09, 15: 1.13, 16: 1.17, 17: 1.22, 18: 1.26, 19: 1.3, 20: 1.56, 21: 1.62, 22: 1.68, 23: 1.74, 24: 1.8, 25: 1.88, 26: 1.95, 27: 2.01, 28: 2.09, 29: 2.18, 30: 2.25
    },
    Epic: {
        0: 0.5, 1: 0.61, 2: 0.64, 3: 0.67, 4: 0.69, 5: 0.71, 6: 0.73, 7: 0.76, 8: 0.79, 9: 0.82, 10: 1.28, 11: 1.34, 12: 1.4, 13: 1.46, 14: 1.5, 15: 1.56, 16: 1.62, 17: 1.68, 18: 1.74, 19: 1.8, 20: 2.48, 21: 2.58, 22: 2.68, 23: 2.78, 24: 2.9, 25: 3, 26: 3.1, 27: 3.22, 28: 3.34, 29: 3.46, 30: 3.6
    },
    Legendary: {
        0: 0.6, 1: 0.71, 2: 0.74, 3: 0.77, 4: 0.79, 5: 0.81, 6: 0.83, 7: 0.88, 8: 0.92, 9: 0.96, 10: 1.68, 11: 1.74, 12: 1.8, 13: 1.96, 14: 2.1, 15: 2.16, 16: 2.22, 17: 2.28, 18: 2.34, 19: 2.4, 20: 3.48, 21: 3.58, 22: 3.68, 23: 3.83, 24: 4.1, 25: 4.2, 26: 4.3, 27: 4.52, 28: 4.64, 29: 4.76, 30: 5
    }
};

export const LEVEL_UP_DATA = [
    { level: "0", priceSlove: "0", priceSeed: "0", timeHour: "0" },
    { level: "1", priceSlove: "1", priceSeed: "10", timeHour: "1" },
    { level: "2", priceSlove: "2", priceSeed: "20", timeHour: "2" },
    { level: "3", priceSlove: "3", priceSeed: "30", timeHour: "3" },
    { level: "4", priceSlove: "4", priceSeed: "40", timeHour: "4" },
    { level: "5", priceSlove: "20", priceSeed: "100", timeHour: "5" },
    { level: "6", priceSlove: "9", priceSeed: "69", timeHour: "6" },
    { level: "7", priceSlove: "10.5", priceSeed: "105", timeHour: "7" },
    { level: "8", priceSlove: "12", priceSeed: "120", timeHour: "8" },
    { level: "9", priceSlove: "13.5", priceSeed: "135", timeHour: "9" },
    { level: "10", priceSlove: "30", priceSeed: "300", timeHour: "10" },
    { level: "11", priceSlove: "16.5", priceSeed: "165", timeHour: "11" },
    { level: "12", priceSlove: "18", priceSeed: "180", timeHour: "12" },
    { level: "13", priceSlove: "19.5", priceSeed: "195", timeHour: "13" },
    { level: "14", priceSlove: "21", priceSeed: "210", timeHour: "14" },
    { level: "15", priceSlove: "22.5", priceSeed: "225", timeHour: "15" },
    { level: "16", priceSlove: "24", priceSeed: "240", timeHour: "16" },
    { level: "17", priceSlove: "25.5", priceSeed: "255", timeHour: "17" },
    { level: "18", priceSlove: "27", priceSeed: "270", timeHour: "18" },
    { level: "19", priceSlove: "28.5", priceSeed: "285", timeHour: "19" },
    { level: "20", priceSlove: "60", priceSeed: "600", timeHour: "20" },
    { level: "21", priceSlove: "31.5", priceSeed: "315", timeHour: "21" },
    { level: "22", priceSlove: "33", priceSeed: "330", timeHour: "22" },
    { level: "23", priceSlove: "34.5", priceSeed: "345", timeHour: "23" },
    { level: "24", priceSlove: "36", priceSeed: "360", timeHour: "24" },
    { level: "25", priceSlove: "37.5", priceSeed: "375", timeHour: "25" },
    { level: "26", priceSlove: "39", priceSeed: "390", timeHour: "26" },
    { level: "27", priceSlove: "40.5", priceSeed: "405", timeHour: "27" },
    { level: "28", priceSlove: "42", priceSeed: "420", timeHour: "28" },
    { level: "29", priceSlove: "43.5", priceSeed: "435", timeHour: "29" },
    { level: "30", priceSlove: "100", priceSeed: "1000", timeHour: "30" }
];

export const FIBONACCI_REDUCTION_PERCENT = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 79];
export const BOOST_COST_DATA = [
    { level: 1, slove: 6 },
    { level: 2, slove: 12 },
    { level: 3, slove: 18 },
    { level: 4, slove: 24 },
    { level: 5, slove: 30 },
    { level: 6, slove: 36 },
    { level: 7, slove: 42 },
    { level: 8, slove: 48 },
    { level: 9, slove: 54 },
    { level: 10, slove: 60 },
    { level: 11, slove: 66 },
    { level: 12, slove: 72 },
    { level: 13, slove: 78 },
    { level: 14, slove: 84 },
    { level: 15, slove: 90 },
    { level: 16, slove: 96 },
    { level: 17, slove: 102 },
    { level: 18, slove: 108 },
    { level: 19, slove: 114 },
    { level: 20, slove: 120 },
    { level: 21, slove: 126 },
    { level: 22, slove: 132 },
    { level: 23, slove: 138 },
    { level: 24, slove: 144 },
    { level: 25, slove: 150 },
    { level: 26, slove: 156 },
    { level: 27, slove: 162 },
    { level: 28, slove: 168 },
    { level: 29, slove: 174 },
    { level: 30, slove: 180 }
];