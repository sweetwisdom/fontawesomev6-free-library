<template>
  <div class="flex flex-col w-full h-screen overflow-hidden bg-gray-100">
    <!-- Top search bar -->
    <div class="w-full bg-white shadow-md p-4 z-10">
      <div class="container mx-auto flex flex-col md:flex-row items-center gap-4">
        <h1 class="text-2xl font-bold text-gray-800 whitespace-nowrap">Icon Browser</h1>
        <div class="relative flex-grow">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3">
            <i class="fa fa-search text-gray-400"></i>
          </span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search icons..."
            class="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="flex items-center space-x-4">
          <div class="flex space-x-2">
            <button
              v-for="(color, index) in colorThemes"
              :key="index"
              @click="currentTheme = color.value"
              class="w-8 h-8 rounded-full border-2 border-gray-300"
              :class="{ 'ring-2 ring-offset-2 ring-blue-500': currentTheme === color.value }"
              :style="{ backgroundColor: color.bg }"
            ></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar for categories -->
      <div class="w-64 min-w-64 bg-white shadow-lg overflow-y-auto">
        <div class="p-4">
          <h2 class="text-lg font-bold text-gray-800 mb-4">Categories</h2>
          <ul class="space-y-2">
            <li
              v-for="(category, key) in iconData"
              :key="key + '-aa'"
              @click="selectCategory(key)"
              class="cursor-pointer p-2 rounded hover:bg-gray-200 transition-colors"
              :class="{ 'bg-blue-100 font-semibold': selectedCategory === key }"
            >
              <span>{{ category.label }} ({{ category.icons.length }})🎉</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Main content area for icons -->
      <div class="flex-1 overflow-hidden overflow-y-auto  p-6">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-800">
            {{ selectedCategoryLabel }} Icons
            <span class="text-sm font-normal text-gray-500">
              ({{ filteredIcons.length }} icons)
            </span>
          </h2>
        </div>

        <!-- Icon grid -->
        <div class="grid grid-cols-2 overflow-hidden sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div
            v-for="(icon, index) in visibleIcons"
            :key="index"
            @click="copyIconCode(icon)"
            class="flex relative flex-col items-center justify-center p-4 rounded-lg bg-white shadow hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer border border-gray-200 group"
          >
            <div
              class="text-3xl mb-3 h-12 flex items-center justify-center"
              :style="{ color: getThemeColor() }"
            >
              <i :class="`fa fa-${icon}`"></i>
            </div>
            <div class="text-xs text-center text-gray-600 truncate w-full">{{ icon }}</div>
            <div
              class="absolute inset-0 bg-gray-900 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
            >
              <span class="bg-gray-900 text-white text-xs px-2 py-1 rounded">Click to copy</span>
            </div>
          </div>
        </div>

        <!-- Load more button -->
        <div v-if="visibleIcons.length < filteredIcons.length" class="flex justify-center mt-8">
          <button
            @click="loadMoreIcons"
            class="px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
            :style="{ backgroundColor: getThemeColor(), color: 'white' }"
          >
            Load More Icons
          </button>
        </div>

        <!-- No results message -->
        <div
          v-if="filteredIcons.length === 0"
          class="flex flex-col items-center justify-center p-10"
        >
          <i class="fa fa-search text-gray-300 text-5xl mb-4"></i>
          <p class="text-lg text-gray-500">No icons found. Try another search query.</p>
        </div>
      </div>
    </div>

    <!-- Notification for copy success -->
    <div
      v-if="showCopyNotification"
      class="fixed bottom-6 right-6 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg flex items-center notification-fade"
      @animationend="showCopyNotification = false"
    >
      <i class="fa fa-check mr-2"></i> Copied to clipboard!
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getYamlData } from '@/unit/initData'

interface IconCategory {
  icons: string[]
  label: string
}

interface IconData {
  [key: string]: IconCategory
}

interface ColorTheme {
  name: string
  value: string
  bg: string
}

// Color themes
const colorThemes = [
  { name: 'Blue', value: 'blue', bg: '#3b82f6' },
  { name: 'Red', value: 'red', bg: '#ef4444' },
  { name: 'Green', value: 'green', bg: '#10b981' },
  { name: 'Purple', value: 'purple', bg: '#8b5cf6' },
  { name: 'Orange', value: 'orange', bg: '#f97316' },
  { name: 'Pink', value: 'pink', bg: '#ec4899' },
]

// State
const iconData = ref<IconData>({})
const selectedCategory = ref<string>('')
const searchQuery = ref<string>('')
const visibleIconCount = ref<number>(30)
const isLoading = ref<boolean>(true)
const currentTheme = ref<string>('blue')
const showCopyNotification = ref<boolean>(false)

// Load initial data
onMounted(async () => {
  iconData.value = await getYamlData()

  // Select the first category by default
  if (Object.keys(iconData.value).length > 0) {
    selectedCategory.value = Object.keys(iconData.value)[0]
  }

  isLoading.value = false
})

// Computed properties
const selectedCategoryLabel = computed(() => {
  if (!selectedCategory.value || !iconData.value[selectedCategory.value]) return ''
  return iconData.value[selectedCategory.value].label
})

const filteredIcons = computed(() => {
  if (!selectedCategory.value || !iconData.value[selectedCategory.value]) return []

  const icons = iconData.value[selectedCategory.value].icons

  if (!searchQuery.value.trim()) {
    return icons
  }

  const query = searchQuery.value.toLowerCase()
  return icons.filter((icon) => icon.toLowerCase().includes(query))
})

const visibleIcons = computed(() => {
  return filteredIcons.value.slice(0, visibleIconCount.value)
})

// Methods
const getThemeColor = () => {
  const theme = colorThemes.find((t) => t.value === currentTheme.value)
  return theme ? theme.bg : '#3b82f6'
}

const selectCategory = (category: string) => {
  selectedCategory.value = category
  visibleIconCount.value = 30 // Reset visible count when changing categories
}

const loadMoreIcons = () => {
  visibleIconCount.value += 30
}

const copyIconCode = (icon: string) => {
  // Copy icon HTML to clipboard
  const iconHTML = `<i class="fa fa-${icon}"></i>`
  navigator.clipboard.writeText(iconHTML)

  // Show notification
  showCopyNotification.value = true
  setTimeout(() => {
    showCopyNotification.value = false
  }, 2000)
}

// Reset visible count when search query changes
watch(searchQuery, () => {
  visibleIconCount.value = 30
})
</script>

<style>
.notification-fade {
  animation: fadeInOut 2s ease-in-out;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  15% {
    opacity: 1;
    transform: translateY(0);
  }
  85% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}
</style>
