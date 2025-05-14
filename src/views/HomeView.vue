<template>
    <div class="flex w-full h-screen overflow-hidden bg-gray-100">
      <!-- Sidebar for categories -->
      <div class="w-64 min-w-64 bg-white shadow-lg overflow-y-auto p-4">
        <div class="mb-6">
          <h1 class="text-xl font-bold text-gray-800">Icon Browser</h1>
          <div class="mt-4 relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3">
              <i class="fa fa-search text-gray-400"></i>
            </span>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search icons..."
              class="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <ul class="space-y-2">
          <li 
            v-for="(category, key) in iconData" 
            :key="key" 
            @click="selectCategory(key)"
            class="cursor-pointer p-2 rounded hover:bg-gray-200"
            :class="{'bg-blue-100 font-semibold': selectedCategory === key}"
          >
            <span>{{ category.label }} ({{ category.icons.length }})</span>
          </li>
        </ul>
      </div>
      
      <!-- Main content area for icons -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-800">
            {{ selectedCategoryLabel }} Icons
            <span class="text-sm font-normal text-gray-500">
              ({{ filteredIcons.length }} icons)
            </span>
          </h2>
        </div>
        
        <!-- Icon grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div 
            v-for="(icon, index) in visibleIcons" 
            :key="index"
            class="flex flex-col items-center justify-center p-4 rounded-lg bg-white shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div class="text-3xl mb-2 h-12 flex items-center justify-center">
              <i :class="`fa fa-${icon}`"></i>
            </div>
            <div class="text-xs text-center text-gray-600 truncate w-full">{{ icon }}</div>
          </div>
        </div>
        
        <!-- Load more button -->
        <div v-if="visibleIcons.length < filteredIcons.length" class="flex justify-center mt-8">
          <button 
            @click="loadMoreIcons"
            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Load More Icons
          </button>
        </div>
  
        <!-- No results message -->
        <div v-if="filteredIcons.length === 0" class="flex flex-col items-center justify-center p-10">
          <i class="fa fa-search text-gray-300 text-5xl mb-4"></i>
          <p class="text-lg text-gray-500">No icons found. Try another search query.</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  //@ts-ignore
  import { getYamlData } from '@/unit/initData';
  
  interface IconCategory {
    icons: string[];
    label: string;
  }
  
  interface IconData {
    [key: string]: IconCategory;
  }
  
  // State
  const iconData = ref<IconData>({});
  const selectedCategory = ref<string>('');
  const searchQuery = ref<string>('');
  const visibleIconCount = ref<number>(30);
  const isLoading = ref<boolean>(true);
  
  // Load initial data
  onMounted(async () => {
    iconData.value = await getYamlData();
    
    // Select the first category by default
    if (Object.keys(iconData.value).length > 0) {
      selectedCategory.value = Object.keys(iconData.value)[0];
    }
    
    isLoading.value = false;
  });
  
  // Computed properties
  const selectedCategoryLabel = computed(() => {
    if (!selectedCategory.value || !iconData.value[selectedCategory.value]) return '';
    return iconData.value[selectedCategory.value].label;
  });
  
  const filteredIcons = computed(() => {
    if (!selectedCategory.value || !iconData.value[selectedCategory.value]) return [];
    
    const icons = iconData.value[selectedCategory.value].icons;
    
    if (!searchQuery.value.trim()) {
      return icons;
    }
    
    const query = searchQuery.value.toLowerCase();
    return icons.filter(icon => icon.toLowerCase().includes(query));
  });
  
  const visibleIcons = computed(() => {
    return filteredIcons.value.slice(0, visibleIconCount.value);
  });
  
  // Methods
  const selectCategory = (category: string) => {
    selectedCategory.value = category;
    visibleIconCount.value = 30; // Reset visible count when changing categories
  };
  
  const loadMoreIcons = () => {
    visibleIconCount.value += 30;
  };
  
  // Reset visible count when search query changes
  watch(searchQuery, () => {
    visibleIconCount.value = 30;
  });
  </script>