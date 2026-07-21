<template>
    <div class="relative flex min-h-screen w-full flex-col">
        <!-- Backend Status Notification removed -->
        
        
        <HeaderComponent v-if="!isAdminRoute" />
        <main class="flex-grow">
            <router-view />
        </main>
        <FooterComponent v-if="!isAdminRoute" />
        
        <!-- API Debugger for development -->
        <ApiDebugger v-if="isDevelopment" />
        
        <!-- Data Source Indicator -->
        <!-- <DataSourceIndicator v-if="isDevelopment" /> -->
    </div>
</template>

<script>
import { computed } from "vue";
import { useRoute } from "vue-router";
import HeaderComponent from "./components/HeaderComponent.vue";
import FooterComponent from "./components/FooterComponent.vue";
import ApiDebugger from "./components/ApiDebugger.vue";
// import BackendStatus from "./components/BackendStatus.vue"; // Removed - not useful
import DataSourceIndicator from "./components/DataSourceIndicator.vue";

export default {
    name: "App",
    components: {
        HeaderComponent,
        FooterComponent,
        ApiDebugger,
        // BackendStatus, // Removed - not useful
        DataSourceIndicator,
    },
    setup() {
        const route = useRoute();

        // Check if current route is admin route
        const isAdminRoute = computed(() => {
            return route.path.startsWith("/admin");
        });

        // Check if in development mode
        const isDevelopment = computed(() => {
            return import.meta.env.DEV;
        });

        return {
            isAdminRoute,
            isDevelopment,
        };
    },
};
</script>

<style>
/* Global styles if needed */
</style>
