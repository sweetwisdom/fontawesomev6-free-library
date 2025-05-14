<template>
  <div class="flex flex-col w-full h-screen overflow-hidden bg-gray-100">
    <!-- Top search bar -->
    <div class="w-full bg-white shadow-md p-4 z-10">
      <div class=" mx-auto flex flex-col md:flex-row items-center justify-arround gap-4">
        <a  target="_blank" class="decoration-0"  href="https://fontawesome.com/search?ic=free"> <h1 class=" text-2xl font-bold text-gray-800 whitespace-nowrap">Font-awesome Library(6.7.2)</h1></a>
       
        <div class="relative flex-grow">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3">
            <i class="fa fa-search text-gray-400 "></i>
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
              @click="selectCategory('all')"
              class="cursor-pointer p-2 rounded hover:bg-gray-200 transition-colors"
              :class="{ 'bg-blue-100 font-semibold': selectedCategory === 'all' }"
            >
              <span>All Icons ({{ totalIconCount }})🔍</span>
            </li>
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
      <div
        class="flex-1 overflow-hidden overflow-y-auto p-6"
        ref="iconsContainer"
        @scroll="handleScroll"
      >
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-800">
            {{ currentCategoryLabel }} Icons
            <span class="text-sm font-normal text-gray-500">
              ({{ filteredIcons.length }} icons)
            </span>
          </h2>
        </div>

        <!-- Icon grid -->
        <div
          class="grid grid-cols-2 overflow-hidden sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          <div
            v-for="(icon, index) in visibleIcons"
            :key="index"
            @click="copyIconCode(icon.name, icon.category)"
            class="flex relative flex-col items-center justify-center p-4 rounded-lg bg-white shadow hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer border border-gray-200 group"
          >
            <div
              class="text-3xl mb-3 h-12 flex items-center justify-center"
              :style="{ color: getThemeColor() }"
            >
              <i :class="`fa fa-${icon.name}`"></i>
            </div>
            <div class="text-xs text-center text-gray-600 truncate w-full">{{ icon.name }}</div>
            <div
              v-if="selectedCategory === 'all' || isSearchActive"
              class="text-xs text-center text-gray-400 truncate w-full mt-1"
            >
              {{ getCategoryLabel(icon.category) }}
            </div>
            <div
              class="absolute inset-0 bg-gray-900 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
            >
              <span class="bg-gray-900 text-white text-xs px-2 py-1 rounded">Click to copy</span>
            </div>
          </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoadingMore" class="flex justify-center mt-8">
          <div class="flex items-center space-x-2">
            <div
              class="animate-spin rounded-full h-6 w-6 border-b-2"
              :style="{ borderColor: getThemeColor() }"
            ></div>
            <span class="text-gray-600">Loading more icons...</span>
          </div>
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
      <i class="fa fa-check mr-2"></i> {{ copyMessage }}
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

interface IconItem {
  name: string
  category: string
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
const selectedCategory = ref<string>('all')
const searchQuery = ref<string>('')
const visibleIconCount = ref<number>(60)
const isLoading = ref<boolean>(true)
const isLoadingMore = ref<boolean>(false)
const currentTheme = ref<string>('blue')
const showCopyNotification = ref<boolean>(false)
const copyMessage = ref<string>('')
const iconsContainer = ref<HTMLElement | null>(null)
const scrollThreshold = 200 // px from bottom to trigger loadMore

// Load initial data
onMounted(async () => {
  iconData.value = await getYamlData()
  isLoading.value = false
})

// Computed properties
const totalIconCount = computed(() => {
  return Object.values(iconData.value).reduce((total, category) => total + category.icons.length, 0)
})

const currentCategoryLabel = computed(() => {
  if (selectedCategory.value === 'all') return 'All'
  if (!iconData.value[selectedCategory.value]) return ''
  return iconData.value[selectedCategory.value].label
})

const isSearchActive = computed(() => {
  return searchQuery.value.trim().length > 0
})

const allIcons = computed((): IconItem[] => {
  const result: IconItem[] = []

  // Gather all icons from all categories
  Object.keys(iconData.value).forEach((categoryKey) => {
    iconData.value[categoryKey].icons.forEach((iconName) => {
      result.push({
        name: iconName,
        category: categoryKey,
      })
    })
  })

  return result
})

const filteredIcons = computed(() => {
  // If no search query and viewing a specific category
  if (!isSearchActive.value && selectedCategory.value !== 'all') {
    if (!iconData.value[selectedCategory.value]) return []
    return iconData.value[selectedCategory.value].icons.map((name) => ({
      name,
      category: selectedCategory.value,
    }))
  }

  // If searching or viewing all icons
  const allIconsList = allIcons.value

  if (!isSearchActive.value) {
    return allIconsList // Return all icons when no search query is active
  }

  // Filter by search query
  const query = searchQuery.value.toLowerCase()
  return allIconsList.filter((icon) => icon.name.toLowerCase().includes(query))
})

const visibleIcons = computed(() => {
  return filteredIcons.value.slice(0, visibleIconCount.value)
})

// Methods
const getThemeColor = () => {
  const theme = colorThemes.find((t) => t.value === currentTheme.value)
  return theme ? theme.bg : '#3b82f6'
}

const getCategoryLabel = (categoryKey: string) => {
  return iconData.value[categoryKey]?.label || categoryKey
}

const selectCategory = (category: string) => {
  if (searchQuery.value) {
    searchQuery.value = ''
  }
  selectedCategory.value = category
  visibleIconCount.value = 60 // Reset visible count when changing categories
  // Scroll to top when changing categories
  if (iconsContainer.value) {
    iconsContainer.value.scrollTop = 0
  }
}

const loadMoreIcons = () => {
  if (visibleIcons.value.length >= filteredIcons.value.length) return

  isLoadingMore.value = true

  // Simulate loading delay for better UX
  setTimeout(() => {
    visibleIconCount.value += 60
    isLoadingMore.value = false
  }, 300)
}

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target

  // Check if we're near the bottom of the scroll
  if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
    if (!isLoadingMore.value && visibleIcons.value.length < filteredIcons.value.length) {
      loadMoreIcons()
    }
  }
}

const copyIconCode = (iconName: string, categoryKey: string) => {
  // Copy icon HTML to clipboard
  const iconHTML = `<i class="fa fa-${iconName}"></i>`
  navigator.clipboard.writeText(iconHTML)

  // Show notification
  copyMessage.value = `Copied ${iconName} to clipboard!`
  showCopyNotification.value = true
  setTimeout(() => {
    showCopyNotification.value = false
  }, 2000)
}

// Reset visible count when search query changes
watch(searchQuery, () => {
  if (searchQuery.value) {
    selectedCategory.value = 'all'
  }
  visibleIconCount.value = 60
  // Scroll to top when search changes
  if (iconsContainer.value) {
    iconsContainer.value.scrollTop = 0
  }
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
