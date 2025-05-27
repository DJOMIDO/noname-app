<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import { LMap, LTileLayer, LPolyline, LMarker, LPopup, LTooltip } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import airportData from '@/assets/data/airports.json'
import airportIcon from '@/assets/images/airport.png'
import airportIconLight from '@/assets/images/airport_white.png'
import L from 'leaflet'
import * as turf from '@turf/turf'

const isDark = ref(false)

onMounted(() => {
    const checkDark = () => {
        isDark.value = document.documentElement.classList.contains('dark')
    }

    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

const tileUrl = computed(() =>
    isDark.value
        ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
)

const customIcon = computed(() =>
    L.icon({
        iconUrl: isDark.value ? airportIconLight : airportIcon,
        iconSize: [12, 12],
        iconAnchor: [10, 10],
    })
)

const props = defineProps<{ flights: any[] }>()

const center = ref<[number, number]>([30, 10])
const zoom = ref(2)
const routes = ref<Array<{ coords: [number, number][], label: string }>>([])
const markers = ref<Array<{ lat: number, lng: number, label: string }>>([])

function generateGreatCirclePath(dep: { lat: number, lng: number }, arr: { lat: number, lng: number }) {
    const from = [dep.lng, dep.lat]
    const to = [arr.lng, arr.lat]

    const greatCircle = turf.greatCircle(
        turf.point(from),
        turf.point(to),
        { npoints: 100 }
    )

    return greatCircle.geometry.coordinates.map(coord => [coord[1], coord[0]] as [number, number])
}

function deduplicateMarkers(arr: typeof markers.value) {
    const seen = new Set<string>()
    return arr.filter(m => {
        const key = `${m.lat},${m.lng}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

watch(
    () => props.flights,
    () => {
        const points: typeof markers.value = []
        routes.value = []

        props.flights.forEach(flight => {
            const dep = airportData.find(a => a.iata === flight.departure_airport)
            const arr = airportData.find(a => a.iata === flight.arrival_airport)

            if (
                dep && arr &&
                typeof dep.lat === 'number' && typeof dep.lng === 'number' &&
                typeof arr.lat === 'number' && typeof arr.lng === 'number'
            ) {
                const path = generateGreatCirclePath(dep, arr)

                routes.value.push({
                    coords: path,
                    label: `${dep.city} → ${arr.city}`
                })

                points.push(
                    { lat: dep.lat, lng: dep.lng, label: `${dep.iata} (${dep.city}, ${dep.country})` },
                    { lat: arr.lat, lng: arr.lng, label: `${arr.iata} (${arr.city}, ${arr.country})` }
                )
            }
        })

        markers.value = deduplicateMarkers(points)
    },
    { immediate: true }
)

onMounted(() => {
    nextTick(() => {
        window.dispatchEvent(new Event('resize'))
    })
})
</script>

<template>
    <div class="map-container">
        <LMap :zoom="zoom" :center="center" class="z-10">
            <LTileLayer :key="tileUrl" :url="tileUrl" />

            <LPolyline v-for="(route, index) in routes" :key="'route-' + index" :lat-lngs="route.coords"
                :color="isDark ? 'white' : 'black'" :weight="1.5" :opacity="0.5" :smooth-factor="1">
                <LTooltip sticky>{{ route.label }}</LTooltip>
            </LPolyline>

            <LMarker v-for="(m, index) in markers" :key="'marker-' + index" :lat-lng="[m.lat, m.lng]"
                :icon="customIcon">
                <LPopup>{{ m.label }}</LPopup>
            </LMarker>
        </LMap>
    </div>
</template>

<style scoped>
.map-container {
    height: 400px;
    width: 100%;
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
</style>
