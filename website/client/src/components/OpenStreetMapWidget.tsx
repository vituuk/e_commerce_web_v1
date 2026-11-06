import React, { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Layers,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Repeat,
  Route,
  Search,
  Store,
  Truck,
  X,
} from 'lucide-react'
import type { Address } from '@/types/address'
import '@/styles/components/store-locator.css'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletGlobal = any

export interface MapLocationSelection {
  street?: string
  city?: string
  lat?: number
  lng?: number
  displayName?: string
  isLiveGps?: boolean
}

export interface AddressMapPickerProps {
  street?: string
  city?: string
  title?: string
  compact?: boolean
  onSelectLocation?: (location: MapLocationSelection) => void
}

export interface DeliveryRouteMapProps {
  address?: Address | null
  orderNumber?: string
  status?: string
  onUpdateDestination?: (location: MapLocationSelection) => void
}

export interface StoreLocatorSectionProps {
  onShopAction?: () => void
}

export interface MapTileLayerConfig {
  id: string
  label: string
  shortLabel: string
  url: string
  attribution: string
  maxZoom: number
}

export interface QuickDeliveryHub {
  id: string
  label: string
  street: string
  city: string
  lat: number
  lng: number
}

export interface FlagshipStore {
  id: string
  name: string
  badge: string
  street: string
  city: string
  phone: string
  hours: string
  services: string[]
  lat: number
  lng: number
}

interface ResolvedPlacePoint {
  lat: number
  lng: number
  displayName: string
  fullDisplayName?: string
  street: string
  city: string
  source?: string
  label?: string
  isLiveGps?: boolean
}

interface NominatimRawItem {
  place_id: string | number
  lat: number | string
  lon: number | string
  display_name?: string
  type?: string
  address?: {
    road?: string
    pedestrian?: string
    suburb?: string
    neighbourhood?: string
    quarter?: string
    village?: string
    house_number?: string
    city?: string
    town?: string
    state?: string
    province?: string
    county?: string
    country?: string
  }
}

interface RouteMetrics {
  distanceKm: string
  durationMins: number
  fromLabel?: string
  toLabel?: string
}

interface MapPickedEventPayload {
  target: 'start' | 'destination'
  place: ResolvedPlacePoint
  timestamp: number
}

// Ensure Leaflet CSS & JS are loaded even during Vite HMR without full page refresh
let leafletLoadPromise: Promise<LeafletGlobal> | null = null
function ensureLeafletLoaded(): Promise<LeafletGlobal> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  const win = window as Window & { L?: LeafletGlobal }
  if (win.L) return Promise.resolve(win.L)
  if (leafletLoadPromise) return leafletLoadPromise

  leafletLoadPromise = new Promise((resolve) => {
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const existingScript = document.querySelector('script[src*="leaflet.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(win.L))
      setTimeout(() => resolve(win.L), 800)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => resolve(win.L)
    script.onerror = () => resolve(null)
    document.head.appendChild(script)
  })

  return leafletLoadPromise
}

// ==================== MAP TILE LAYERS CATALOG ====================
export const MAP_TILE_LAYERS: MapTileLayerConfig[] = [
  {
    id: 'standard',
    label: 'Standard Street',
    shortLabel: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    id: 'hot',
    label: 'Detailed Roads (HOT)',
    shortLabel: 'Detailed',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution:
      '&copy; OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team',
    maxZoom: 19,
  },
  {
    id: 'satellite',
    label: 'Satellite Imagery',
    shortLabel: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  {
    id: 'topo',
    label: 'Terrain / Topo',
    shortLabel: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
    maxZoom: 17,
  },
  {
    id: 'light',
    label: 'Minimal Light',
    shortLabel: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19,
  },
  {
    id: 'dark',
    label: 'Dark Mode',
    shortLabel: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19,
  },
]

// Attach all base layers + native Leaflet layer control to a map instance
function attachBaseLayersWithControl(
  L: LeafletGlobal,
  map: LeafletGlobal,
  initialLayerId = 'standard',
  extraOverlays: Record<string, LeafletGlobal> = {},
) {
  const baseLayersMap: Record<string, LeafletGlobal> = {}
  const layerInstancesById: Record<string, LeafletGlobal> = {}

  MAP_TILE_LAYERS.forEach((cfg) => {
    const tl = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom || 19,
      attribution: cfg.attribution,
    })
    baseLayersMap[cfg.label] = tl
    layerInstancesById[cfg.id] = tl
  })

  const defaultLayer = layerInstancesById[initialLayerId] || layerInstancesById.standard
  defaultLayer.addTo(map)

  const layerControl = L.control
    .layers(baseLayersMap, extraOverlays, {
      position: 'topright',
      collapsed: true,
    })
    .addTo(map)

  return { layerInstancesById, layerControl }
}

// Switch active tile layer programmatically when user clicks UI layer pills
function switchMapTileLayer(
  map: LeafletGlobal,
  layerInstancesRef: React.MutableRefObject<Record<string, LeafletGlobal>>,
  targetLayerId: string,
) {
  if (!map || !layerInstancesRef.current) return
  Object.entries(layerInstancesRef.current).forEach(([id, layerObj]) => {
    if (id === targetLayerId) {
      if (!map.hasLayer(layerObj)) {
        map.addLayer(layerObj)
      }
    } else if (map.hasLayer(layerObj)) {
      map.removeLayer(layerObj)
    }
  })
}

// Reverse-geocode helper via OpenStreetMap Nominatim
async function fetchReverseGeocode(lat: number, lng: number): Promise<ResolvedPlacePoint> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } },
    )
    const data = await response.json()
    if (data && data.address) {
      const addr = data.address
      const roadPart =
        addr.road ||
        addr.pedestrian ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.quarter ||
        addr.village ||
        ''
      const housePart = addr.house_number ? `No. ${addr.house_number}, ` : ''
      const suburbPart = addr.suburb && addr.suburb !== roadPart ? `, ${addr.suburb}` : ''
      const street =
        `${housePart}${roadPart}${suburbPart}`.trim() ||
        (data.display_name ? data.display_name.split(',').slice(0, 2).join(',').trim() : '') ||
        `Live GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      const city =
        addr.city || addr.town || addr.state || addr.province || addr.county || 'Phnom Penh'
      return {
        street,
        city,
        displayName: `${street}, ${city}`,
        lat: Number(lat),
        lng: Number(lng),
      }
    }
  } catch {
    // fallback below
  }
  return {
    street: `Pinned Coordinates (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
    city: 'Phnom Penh',
    displayName: `Live Location (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
    lat: Number(lat),
    lng: Number(lng),
  }
}

// Fetch real driving route geometry & metrics from OpenStreetMap OSRM router
async function fetchOsrmDrivingRoute(
  fromPoint: { lat: number; lng: number },
  toPoint: { lat: number; lng: number },
) {
  const directKm = Math.max(
    0.4,
    Math.hypot((toPoint.lat - fromPoint.lat) * 111, (toPoint.lng - fromPoint.lng) * 108),
  )
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromPoint.lng},${fromPoint.lat};${toPoint.lng},${toPoint.lat}?overview=full&geometries=geojson`
    const res = await fetch(url)
    const data = await res.json()
    if (data && data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0]
      const coordsLatLng: Array<[number, number]> = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng],
      )
      const distanceKm = (route.distance / 1000).toFixed(2)
      const durationMins = Math.max(2, Math.round(route.duration / 60))
      return {
        coordinates: coordsLatLng,
        distanceKm,
        durationMins,
        isRoadRoute: true,
      }
    }
  } catch {
    // fallback to straight line if OSRM is unreachable
  }
  return {
    coordinates: [
      [fromPoint.lat, fromPoint.lng],
      [toPoint.lat, toPoint.lng],
    ] as Array<[number, number]>,
    distanceKm: directKm.toFixed(2),
    durationMins: Math.max(5, Math.round(directKm * 4 + 5)),
    isRoadRoute: false,
  }
}

// Preset quick-pick hubs & districts for fast 1-click pin selection
export const QUICK_DELIVERY_HUBS: QuickDeliveryHub[] = [
  {
    id: 'bkk1',
    label: 'BKK1, Phnom Penh',
    street: 'Street 310, Boeung Keng Kang 1',
    city: 'Phnom Penh',
    lat: 11.5514,
    lng: 104.9282,
  },
  {
    id: 'daunpenh',
    label: 'Riverside / Daun Penh',
    street: 'Street 240, Sangkat Chaktomuk',
    city: 'Phnom Penh',
    lat: 11.5625,
    lng: 104.9301,
  },
  {
    id: 'tuolkork',
    label: 'Tuol Kork',
    street: 'Street 315, Boeung Kak 1, Tuol Kork',
    city: 'Phnom Penh',
    lat: 11.5761,
    lng: 104.8998,
  },
  {
    id: 'sensok',
    label: 'Sen Sok (Aeon 2 Area)',
    street: 'Street 1003, Sangkat Phnom Penh Thmey',
    city: 'Phnom Penh',
    lat: 11.5988,
    lng: 104.8854,
  },
  {
    id: 'siemreap',
    label: 'Siem Reap Central',
    street: 'Pokambor Ave, Old French Quarter',
    city: 'Siem Reap',
    lat: 13.3588,
    lng: 103.8565,
  },
]

// Flagship store locations for the Interactive Store Locator
export const FLAGSHIP_STORES: FlagshipStore[] = [
  {
    id: 'atelier-bkk1',
    name: 'AURA ATELIER — BKK1 Flagship Studio',
    badge: 'Flagship & Fulfillment Hub',
    street: 'No. 42, Street 306, Boeung Keng Kang 1',
    city: 'Phnom Penh',
    phone: '+855 23 998 410',
    hours: 'Mon – Sun: 9:30 AM – 9:00 PM',
    services: ['In-Store Pickup', 'Private Styling', 'Same-Day Dispatch', 'Tailoring'],
    lat: 11.5528,
    lng: 104.9265,
  },
  {
    id: 'atelier-240',
    name: 'AURA ATELIER — Street 240 Concept Boutique',
    badge: 'Editorial Concept Store',
    street: 'No. 18, Street 240, Daun Penh (Near Royal Palace)',
    city: 'Phnom Penh',
    phone: '+855 12 840 240',
    hours: 'Mon – Sun: 10:00 AM – 8:30 PM',
    services: ['In-Store Pickup', 'Capsule Exclusives', 'Gift Wrapping'],
    lat: 11.5612,
    lng: 104.9296,
  },
  {
    id: 'atelier-tk',
    name: 'AURA ATELIER — Tuol Kork Showroom',
    badge: 'Showroom & Pickup Point',
    street: 'No. 88, Street 315, Boeung Kak 1, Tuol Kork',
    city: 'Phnom Penh',
    phone: '+855 15 315 880',
    hours: 'Mon – Sun: 9:00 AM – 8:30 PM',
    services: ['In-Store Pickup', 'Easy Returns', 'Express Fitting'],
    lat: 11.5768,
    lng: 104.8992,
  },
  {
    id: 'atelier-sr',
    name: 'AURA ATELIER — Siem Reap Heritage Resort Lounge',
    badge: 'Resort & Linen Edit',
    street: 'Pokambor Avenue, Riverside Quarter',
    city: 'Siem Reap',
    phone: '+855 63 965 210',
    hours: 'Mon – Sun: 10:00 AM – 9:00 PM',
    services: ['Resort Collection', 'Hotel Delivery', 'In-Store Pickup'],
    lat: 13.3592,
    lng: 103.8568,
  },
]

// Helper to estimate coordinates from city/street text when displaying saved addresses
export function resolveAddressCoordinates(
  street = '',
  city = '',
): { lat: number; lng: number } {
  const combined = `${street} ${city}`.toLowerCase()
  if (combined.includes('siem reap') || combined.includes('pokambor')) {
    return { lat: 13.3588, lng: 103.8565 }
  }
  if (combined.includes('tuol kork') || combined.includes('315')) {
    return { lat: 11.5761, lng: 104.8998 }
  }
  if (combined.includes('sen sok') || combined.includes('1003')) {
    return { lat: 11.5988, lng: 104.8854 }
  }
  if (
    combined.includes('240') ||
    combined.includes('daun penh') ||
    combined.includes('riverside')
  ) {
    return { lat: 11.5612, lng: 104.9296 }
  }
  if (combined.includes('sihanouk')) {
    return { lat: 10.6275, lng: 103.5221 }
  }
  if (combined.includes('battambang')) {
    return { lat: 13.0957, lng: 103.2022 }
  }
  return { lat: 11.5528, lng: 104.9265 }
}

interface MapLayerToolbarProps {
  activeLayer: string
  onSelectLayer: (layerId: string) => void
  showOverlayToggle?: boolean
  overlayEnabled?: boolean
  onToggleOverlay?: () => void
  overlayLabel?: string
}

/**
 * Reusable Map Layer Switcher Bar
 */
function MapLayerToolbar({
  activeLayer,
  onSelectLayer,
  showOverlayToggle,
  overlayEnabled,
  onToggleOverlay,
  overlayLabel,
}: MapLayerToolbarProps) {
  return (
    <div className="nx-osm-layers-bar">
      <div className="nx-osm-layers-label">
        <Layers size={13} />
        <span>Map Layers:</span>
      </div>
      <div className="nx-osm-layers-pills">
        {MAP_TILE_LAYERS.map((layer) => (
          <button
            key={layer.id}
            type="button"
            className={`nx-osm-layer-pill ${activeLayer === layer.id ? 'active' : ''}`}
            onClick={() => onSelectLayer(layer.id)}
            title={layer.label}
          >
            {layer.shortLabel}
          </button>
        ))}
        {showOverlayToggle && (
          <button
            type="button"
            className={`nx-osm-layer-pill is-overlay ${overlayEnabled ? 'active' : ''}`}
            onClick={onToggleOverlay}
          >
            {overlayLabel || 'Delivery Zone'}
          </button>
        )}
      </div>
    </div>
  )
}

interface NominatimAutocompleteInputProps {
  value: string
  onChangeText: (val: string) => void
  placeholder?: string
  badgeText?: string
  badgeClass?: string
  onSelectResult?: (result: ResolvedPlacePoint) => void
  onUseLiveGps?: () => void
  isLocatingGps?: boolean
  actionButtonLabel?: string
}

/**
 * Single Autocomplete Input used inside both Mode 1 (Single Place) and Mode 2 (From A -> To B)
 */
function NominatimAutocompleteInput({
  value,
  onChangeText,
  placeholder,
  badgeText,
  badgeClass = '',
  onSelectResult,
  onUseLiveGps,
  isLocatingGps,
  actionButtonLabel,
}: NominatimAutocompleteInputProps) {
  const [results, setResults] = useState<NominatimRawItem[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const normalizeNominatimItem = (item: NominatimRawItem): ResolvedPlacePoint => {
    const addr = item.address || {}
    const streetPart =
      addr.road ||
      addr.pedestrian ||
      addr.suburb ||
      addr.neighbourhood ||
      (item.display_name ? item.display_name.split(',')[0] : '') ||
      ''
    const cityPart =
      addr.city ||
      addr.town ||
      addr.state ||
      addr.province ||
      addr.country ||
      'Phnom Penh'
    const shortName = item.display_name
      ? item.display_name.split(',').slice(0, 2).join(', ')
      : `${streetPart}, ${cityPart}`
    return {
      lat: Number(item.lat),
      lng: Number(item.lon),
      displayName: shortName,
      fullDisplayName: item.display_name || shortName,
      street: streetPart,
      city: cityPart,
    }
  }

  const buildLocalPresetMatches = (query: string): NominatimRawItem[] => {
    const qLower = query.toLowerCase()
    const localMatches: NominatimRawItem[] = []
    QUICK_DELIVERY_HUBS.forEach((hub) => {
      if (
        hub.label.toLowerCase().includes(qLower) ||
        hub.street.toLowerCase().includes(qLower) ||
        hub.city.toLowerCase().includes(qLower)
      ) {
        localMatches.push({
          place_id: `preset-hub-${hub.id}`,
          lat: hub.lat,
          lon: hub.lng,
          display_name: `${hub.label}, ${hub.street}, ${hub.city}, Cambodia`,
          type: 'delivery_hub',
          address: { road: hub.street, city: hub.city },
        })
      }
    })
    FLAGSHIP_STORES.forEach((st) => {
      if (
        st.name.toLowerCase().includes(qLower) ||
        st.street.toLowerCase().includes(qLower) ||
        st.city.toLowerCase().includes(qLower)
      ) {
        localMatches.push({
          place_id: `preset-store-${st.id}`,
          lat: st.lat,
          lon: st.lng,
          display_name: `${st.name}, ${st.street}, ${st.city}, Cambodia`,
          type: 'boutique_studio',
          address: { road: st.street, city: st.city },
        })
      }
    })
    return localMatches
  }

  const performSearch = async (searchQuery?: string, autoSelectFirst = false) => {
    const q = (searchQuery ?? value).trim()
    if (!q) {
      setResults([])
      return
    }
    setSearching(true)
    const presetItems = buildLocalPresetMatches(q)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q,
        )}&limit=6&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } },
      )
      const data = await res.json()
      const apiItems: NominatimRawItem[] = Array.isArray(data) ? data : []
      const combined = [...presetItems, ...apiItems].slice(0, 7)

      if (autoSelectFirst) {
        if (combined.length > 0) {
          const picked = normalizeNominatimItem(combined[0])
          setResults([])
          onChangeText(picked.displayName)
          if (onSelectResult) onSelectResult(picked)
        } else {
          const fallbackCoords = resolveAddressCoordinates(q, 'Phnom Penh')
          const fallbackPlace: ResolvedPlacePoint = {
            lat: fallbackCoords.lat,
            lng: fallbackCoords.lng,
            displayName: `${q}, Phnom Penh`,
            fullDisplayName: `${q}, Phnom Penh, Cambodia`,
            street: q,
            city: 'Phnom Penh',
          }
          setResults([])
          onChangeText(fallbackPlace.displayName)
          if (onSelectResult) onSelectResult(fallbackPlace)
        }
      } else {
        setResults(combined)
      }
    } catch {
      if (autoSelectFirst) {
        const fallbackCoords = resolveAddressCoordinates(q, 'Phnom Penh')
        const fallbackPlace: ResolvedPlacePoint =
          presetItems.length > 0
            ? normalizeNominatimItem(presetItems[0])
            : {
                lat: fallbackCoords.lat,
                lng: fallbackCoords.lng,
                displayName: `${q}, Phnom Penh`,
                fullDisplayName: `${q}, Phnom Penh, Cambodia`,
                street: q,
                city: 'Phnom Penh',
              }
        setResults([])
        onChangeText(fallbackPlace.displayName)
        if (onSelectResult) onSelectResult(fallbackPlace)
      } else {
        setResults(presetItems)
      }
    } finally {
      setSearching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChangeText(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        void performSearch(val, false)
      }, 260)
    } else {
      setResults([])
    }
  }

  return (
    <div className="nx-osm-search-box-wrap">
      <div className="nx-osm-search-row">
        <div className="nx-osm-search-input-wrap">
          {badgeText ? (
            <span className={`nx-osm-point-tag ${badgeClass}`}>{badgeText}</span>
          ) : (
            <Search size={15} />
          )}
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (debounceRef.current) clearTimeout(debounceRef.current)
                void performSearch(value, true)
              }
            }}
          />
          {value && (
            <button
              type="button"
              className="nx-osm-search-clear-btn"
              onClick={() => {
                onChangeText('')
                setResults([])
              }}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {onUseLiveGps && (
          <button
            type="button"
            className="nx-osm-inline-gps-btn"
            onClick={onUseLiveGps}
            disabled={isLocatingGps}
            title="Catch my current live GPS location"
          >
            <LocateFixed size={14} />
            <span>{isLocatingGps ? 'Catching GPS...' : 'My Live Location'}</span>
          </button>
        )}

        <button
          type="button"
          className="nx-btn nx-btn-dark nx-btn-sm"
          onClick={() => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
            void performSearch(value, true)
          }}
          disabled={searching}
        >
          <Search size={13} />
          <span>{searching ? 'Searching...' : actionButtonLabel || 'Search'}</span>
        </button>
      </div>

      {results.length > 0 && (
        <div className="nx-osm-search-results">
          {results.map((item) => {
            const normalized = normalizeNominatimItem(item)
            return (
              <button
                key={item.place_id}
                type="button"
                className="nx-osm-search-result-item"
                onClick={() => {
                  setResults([])
                  onChangeText(normalized.displayName)
                  if (onSelectResult) {
                    onSelectResult(normalized)
                  }
                }}
              >
                <MapPin size={14} />
                <div className="nx-osm-search-result-text">
                  <strong>{normalized.displayName}</strong>
                  <span>{item.display_name}</span>
                </div>
                {item.type && (
                  <code className="nx-osm-result-type-badge">
                    {String(item.type).replace(/_/g, ' ')}
                  </code>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface SingleAutoLocationSearchPanelProps {
  onPickLocation?: (place: ResolvedPlacePoint) => void
  onUseLiveGps?: () => void
  onCatchLiveForDirection?: () => Promise<ResolvedPlacePoint | null>
  onCalculateRoute?: (
    fromPt: ResolvedPlacePoint,
    toPt: ResolvedPlacePoint,
  ) => Promise<RouteMetrics | null>
  onClearRoute?: () => void
  onActivateMapPick?: (target: 'start' | 'destination' | null) => void
  mapPickTarget?: 'start' | 'destination' | null
  mapPickedEvent?: MapPickedEventPayload | null
  externalSearchedPlace?: ResolvedPlacePoint | null
  isLocatingGps?: boolean
  liveLocationInfo?: ResolvedPlacePoint | null
  gpsError?: string | null
  placeholder?: string
}

/**
 * INTERACTIVE LOCATION SEARCH & DIRECTION PROCESS PANEL
 */
function SingleAutoLocationSearchPanel({
  onPickLocation,
  onUseLiveGps,
  onCatchLiveForDirection,
  onCalculateRoute,
  onClearRoute,
  onActivateMapPick,
  mapPickTarget,
  mapPickedEvent,
  externalSearchedPlace,
  isLocatingGps,
  liveLocationInfo,
  gpsError,
  placeholder = 'Search location, street, or city...',
}: SingleAutoLocationSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchedLocation, setSearchedLocation] = useState<ResolvedPlacePoint | null>(null)
  const [isDirectionOpen, setIsDirectionOpen] = useState(false)
  const [showStartOptions, setShowStartOptions] = useState(false)
  const [startLocation, setStartLocation] = useState<ResolvedPlacePoint | null>(null)
  const [destinationLocation, setDestinationLocation] = useState<ResolvedPlacePoint | null>(null)
  const [showDirectionSearchBox, setShowDirectionSearchBox] = useState(false)
  const [directionSearchQuery, setDirectionSearchQuery] = useState('')
  const [directionSearchTarget, setDirectionSearchTarget] = useState<'destination' | 'start'>(
    'destination',
  )
  const [routeSummary, setRouteSummary] = useState<RouteMetrics | null>(null)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)

  useEffect(() => {
    if (!externalSearchedPlace) return
    const formatted: ResolvedPlacePoint = {
      lat: Number(externalSearchedPlace.lat),
      lng: Number(externalSearchedPlace.lng),
      displayName:
        externalSearchedPlace.displayName ||
        `${externalSearchedPlace.street || 'Pinned Location'}, ${
          externalSearchedPlace.city || 'Phnom Penh'
        }`,
      street: externalSearchedPlace.street || 'Pinned Location',
      city: externalSearchedPlace.city || 'Phnom Penh',
    }
    setSearchedLocation(formatted)
    setDestinationLocation(formatted)
  }, [externalSearchedPlace])

  const triggerRouteCalculation = async (
    fromPt: ResolvedPlacePoint | null,
    toPt: ResolvedPlacePoint | null,
  ) => {
    if (!fromPt || !toPt || !onCalculateRoute) return
    setIsCalculatingRoute(true)
    try {
      const metrics = await onCalculateRoute(fromPt, toPt)
      if (metrics) {
        setRouteSummary(metrics)
      }
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  useEffect(() => {
    if (!mapPickedEvent || !mapPickedEvent.place) return
    const picked = mapPickedEvent.place
    const formattedPoint: ResolvedPlacePoint = {
      lat: Number(picked.lat),
      lng: Number(picked.lng),
      displayName:
        picked.displayName || `${picked.street || 'Map Point'}, ${picked.city || 'Phnom Penh'}`,
      street: picked.street || 'Map Point',
      city: picked.city || 'Phnom Penh',
      source: 'map',
      label: `Chosen on map: ${picked.street || picked.displayName}`,
    }

    if (mapPickedEvent.target === 'destination') {
      setDestinationLocation(formattedPoint)
      setSearchedLocation(formattedPoint)
      const effectiveStart: ResolvedPlacePoint | null =
        startLocation ||
        (liveLocationInfo
          ? {
              ...liveLocationInfo,
              source: 'live',
              label: `Your location (${liveLocationInfo.street || liveLocationInfo.displayName})`,
            }
          : null)
      if (effectiveStart) {
        if (!startLocation) setStartLocation(effectiveStart)
        void triggerRouteCalculation(effectiveStart, formattedPoint)
      }
    } else {
      setStartLocation(formattedPoint)
      const effectiveDest = destinationLocation || searchedLocation
      if (effectiveDest) {
        void triggerRouteCalculation(formattedPoint, effectiveDest)
      }
    }

    if (onActivateMapPick) onActivateMapPick(null)
  }, [mapPickedEvent])

  const handleSelectSearchedLocation = (place: ResolvedPlacePoint) => {
    const formatted: ResolvedPlacePoint = {
      lat: Number(place.lat),
      lng: Number(place.lng),
      displayName:
        place.displayName || `${place.street || 'Searched Place'}, ${place.city || 'Phnom Penh'}`,
      street: place.street || place.displayName || 'Searched Place',
      city: place.city || 'Phnom Penh',
    }
    setSearchedLocation(formatted)
    setDestinationLocation(formatted)
    if (onPickLocation) onPickLocation(formatted)

    if (isDirectionOpen && startLocation) {
      void triggerRouteCalculation(startLocation, formatted)
    }
  }

  const handleClickDirection = () => {
    const targetDest: ResolvedPlacePoint =
      searchedLocation ||
      destinationLocation ||
      (liveLocationInfo
        ? {
            lat: liveLocationInfo.lat,
            lng: liveLocationInfo.lng,
            displayName: liveLocationInfo.displayName,
            street: liveLocationInfo.street,
            city: liveLocationInfo.city,
          }
        : {
            lat: QUICK_DELIVERY_HUBS[0].lat,
            lng: QUICK_DELIVERY_HUBS[0].lng,
            displayName: QUICK_DELIVERY_HUBS[0].label,
            street: QUICK_DELIVERY_HUBS[0].street,
            city: QUICK_DELIVERY_HUBS[0].city,
          })
    if (!searchedLocation) setSearchedLocation(targetDest)
    setDestinationLocation(targetDest)
    setIsDirectionOpen(true)
    setShowStartOptions(false)
    setShowDirectionSearchBox(false)
  }

  const handleToggleChooseStart = () => {
    setShowStartOptions((prev) => !prev)
    setShowDirectionSearchBox(false)
    if (onActivateMapPick) onActivateMapPick(null)
  }

  const handleSelectOptionYourLocation = async () => {
    setShowStartOptions(false)
    setShowDirectionSearchBox(false)
    if (onActivateMapPick) onActivateMapPick(null)

    let livePt = liveLocationInfo || null
    if (onCatchLiveForDirection) {
      const caught = await onCatchLiveForDirection()
      if (caught) livePt = caught
    } else if (!livePt && onUseLiveGps) {
      onUseLiveGps()
    }

    if (livePt) {
      const startPt: ResolvedPlacePoint = {
        lat: Number(livePt.lat),
        lng: Number(livePt.lng),
        displayName:
          livePt.displayName ||
          `${livePt.street || 'Live Location'}, ${livePt.city || 'Phnom Penh'}`,
        street: livePt.street || 'Live Location Staying',
        city: livePt.city || 'Phnom Penh',
        source: 'live',
        label: `Your location — ${livePt.street || livePt.displayName} (Live Staying)`,
      }
      setStartLocation(startPt)
      const targetDest = destinationLocation || searchedLocation
      if (targetDest) {
        await triggerRouteCalculation(startPt, targetDest)
      }
    }
  }

  const handleSelectOptionChooseOnMap = () => {
    setShowStartOptions(false)
    setShowDirectionSearchBox(false)
    if (onActivateMapPick) {
      onActivateMapPick('start')
    }
  }

  const handleSelectOptionSearchLocation = () => {
    setShowStartOptions(false)
    if (onActivateMapPick) onActivateMapPick(null)
    setDirectionSearchTarget('destination')
    setShowDirectionSearchBox(true)
  }

  const handleSelectDirectionSearchedPlace = async (place: ResolvedPlacePoint) => {
    const formatted: ResolvedPlacePoint = {
      lat: Number(place.lat),
      lng: Number(place.lng),
      displayName:
        place.displayName ||
        `${place.street || 'Searched Location'}, ${place.city || 'Phnom Penh'}`,
      street: place.street || place.displayName || 'Searched Location',
      city: place.city || 'Phnom Penh',
    }

    if (directionSearchTarget === 'start') {
      const startPt: ResolvedPlacePoint = {
        ...formatted,
        source: 'search',
        label: `Searched Start: ${formatted.displayName}`,
      }
      setStartLocation(startPt)
      setShowDirectionSearchBox(false)
      setDirectionSearchQuery('')
      const targetDest = destinationLocation || searchedLocation
      if (targetDest) {
        await triggerRouteCalculation(startPt, targetDest)
      }
      return
    }

    const destPt: ResolvedPlacePoint = {
      ...formatted,
      source: 'search',
      label: formatted.displayName,
    }
    setDestinationLocation(destPt)
    setSearchedLocation(destPt)
    setSearchQuery(destPt.displayName)
    setShowDirectionSearchBox(false)
    setDirectionSearchQuery('')

    if (onPickLocation) {
      onPickLocation(destPt)
    }

    if (startLocation) {
      await triggerRouteCalculation(startLocation, destPt)
    } else if (liveLocationInfo) {
      const autoLiveStart: ResolvedPlacePoint = {
        lat: Number(liveLocationInfo.lat),
        lng: Number(liveLocationInfo.lng),
        displayName: liveLocationInfo.displayName,
        street: liveLocationInfo.street,
        city: liveLocationInfo.city,
        source: 'live',
        label: `Your location — ${
          liveLocationInfo.street || liveLocationInfo.displayName
        } (Live Staying)`,
      }
      setStartLocation(autoLiveStart)
      await triggerRouteCalculation(autoLiveStart, destPt)
    }
  }

  const handleSwapDirectionPoints = () => {
    if (!startLocation || !destinationLocation) return
    const prevStart = startLocation
    const prevDest = destinationLocation
    setStartLocation({
      ...prevDest,
      label: prevDest.displayName,
    })
    setDestinationLocation({
      ...prevStart,
      label: prevStart.displayName,
    })
    setSearchedLocation(prevStart)
    void triggerRouteCalculation(prevDest, prevStart)
  }

  const handleCloseDirectionPanel = () => {
    setIsDirectionOpen(false)
    setShowStartOptions(false)
    setShowDirectionSearchBox(false)
    setRouteSummary(null)
    if (onActivateMapPick) onActivateMapPick(null)
    if (onClearRoute) onClearRoute()
  }

  const activeDest = destinationLocation || searchedLocation

  return (
    <div className="nx-osm-single-search-panel">
      {/* Main Search Input */}
      <NominatimAutocompleteInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={placeholder}
        onUseLiveGps={onUseLiveGps}
        isLocatingGps={isLocatingGps}
        actionButtonLabel="Search Place"
        onSelectResult={handleSelectSearchedLocation}
      />

      {/* Step 1 Result: When a location is searched/ready, show location info + "Direction" text button */}
      {searchedLocation && (
        <div className="nx-osm-searched-ready-card">
          <div className="nx-osm-searched-ready-info">
            <span className="nx-osm-ready-pin-badge">
              <MapPin size={13} />
              <span>Location Ready</span>
            </span>
            <div className="nx-osm-searched-ready-text">
              <strong>{searchedLocation.displayName}</strong>
              <span>
                {searchedLocation.street}, {searchedLocation.city}
              </span>
            </div>
          </div>

          <button
            type="button"
            className={`nx-osm-direction-btn ${isDirectionOpen ? 'active' : ''}`}
            onClick={handleClickDirection}
            title="Show Direction options for this searched location"
          >
            <Navigation size={14} />
            <span>Direction</span>
          </button>
        </div>
      )}

      {/* Step 2 & 3: After clicking "Direction", show "Choose start location" and the "Location that I had searched" */}
      {isDirectionOpen && (
        <div className="nx-osm-direction-panel">
          <div className="nx-osm-direction-head">
            <div className="nx-osm-direction-title">
              <Route size={15} />
              <span>Direction — Choose Start Location &amp; Destination</span>
            </div>
            <div className="nx-osm-direction-head-actions">
              {startLocation && destinationLocation && (
                <button
                  type="button"
                  className="nx-osm-direction-swap-btn"
                  onClick={handleSwapDirectionPoints}
                  title="Swap Start and Destination"
                >
                  <Repeat size={13} />
                  <span>Swap A ⇄ B</span>
                </button>
              )}
              <button
                type="button"
                className="nx-osm-direction-close-btn"
                onClick={handleCloseDirectionPanel}
                aria-label="Close Direction panel"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="nx-osm-direction-rows">
            {/* ROW A: Choose Start Location */}
            <div className="nx-osm-direction-start-wrap">
              <button
                type="button"
                className={`nx-osm-direction-row is-start ${showStartOptions ? 'is-open' : ''} ${
                  startLocation ? 'is-filled' : ''
                }`}
                onClick={handleToggleChooseStart}
              >
                <span className="nx-osm-point-tag is-origin">A</span>
                <div className="nx-osm-direction-row-body">
                  <small>
                    {startLocation
                      ? 'START LOCATION (CLICK TO CHOOSE START LOCATION AGAIN)'
                      : 'START LOCATION'}
                  </small>
                  <strong>
                    {startLocation
                      ? startLocation.label || startLocation.displayName
                      : 'Choose start location'}
                  </strong>
                </div>
                <span className="nx-osm-direction-action-pill">
                  Choose start location {showStartOptions ? '▴' : '▾'}
                </span>
              </button>

              {showStartOptions && (
                <div className="nx-osm-start-options-menu">
                  <div className="nx-osm-start-options-title">Choose how to set location:</div>
                  <div className="nx-osm-start-options-grid">
                    <button
                      type="button"
                      className={`nx-osm-start-option-btn ${
                        startLocation?.source === 'live' ? 'active' : ''
                      }`}
                      onClick={() => void handleSelectOptionYourLocation()}
                    >
                      <span className="nx-osm-start-option-icon is-live">
                        <LocateFixed size={15} />
                      </span>
                      <div className="nx-osm-start-option-text">
                        <strong>Your location</strong>
                        <span>
                          {liveLocationInfo
                            ? `Catch live staying: ${
                                liveLocationInfo.street || liveLocationInfo.displayName
                              }`
                            : "Catch live location that we're staying"}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`nx-osm-start-option-btn ${mapPickTarget ? 'active' : ''}`}
                      onClick={handleSelectOptionChooseOnMap}
                    >
                      <span className="nx-osm-start-option-icon is-map">
                        <Compass size={15} />
                      </span>
                      <div className="nx-osm-start-option-text">
                        <strong>Choose on map</strong>
                        <span>Click directly on map to pick point</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`nx-osm-start-option-btn ${
                        showDirectionSearchBox ? 'active' : ''
                      }`}
                      onClick={handleSelectOptionSearchLocation}
                    >
                      <span className="nx-osm-start-option-icon is-search">
                        <Search size={15} />
                      </span>
                      <div className="nx-osm-start-option-text">
                        <strong>Search location</strong>
                        <span>Catch location will go</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Map-Click Selection Active Banner */}
            {mapPickTarget && (
              <div className="nx-osm-map-pick-banner">
                <div className="nx-osm-map-pick-banner-text">
                  <Compass size={15} />
                  <span>
                    Click anywhere on the map below to choose{' '}
                    <strong>
                      {mapPickTarget === 'start'
                        ? 'Start Location (A)'
                        : 'Location Will Go (Destination B)'}
                    </strong>
                  </span>
                </div>
                <div className="nx-osm-map-pick-banner-actions">
                  <button
                    type="button"
                    className={`nx-osm-pick-target-pill ${
                      mapPickTarget === 'start' ? 'active' : ''
                    }`}
                    onClick={() => onActivateMapPick && onActivateMapPick('start')}
                  >
                    Pick Start (A)
                  </button>
                  <button
                    type="button"
                    className={`nx-osm-pick-target-pill ${
                      mapPickTarget === 'destination' ? 'active' : ''
                    }`}
                    onClick={() => onActivateMapPick && onActivateMapPick('destination')}
                  >
                    Pick Location Will Go (B)
                  </button>
                  <button
                    type="button"
                    className="nx-osm-pick-cancel-btn"
                    onClick={() => onActivateMapPick && onActivateMapPick(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Inline Search Box */}
            {showDirectionSearchBox && (
              <div className="nx-osm-direction-search-box">
                <div className="nx-osm-direction-search-head">
                  <span>
                    {directionSearchTarget === 'destination'
                      ? 'Search location — Catch location will go (Destination B):'
                      : 'Search location — Catch Start location (A):'}
                  </span>
                  <div className="nx-osm-direction-search-target-tabs">
                    <button
                      type="button"
                      className={`nx-osm-target-tab ${
                        directionSearchTarget === 'destination' ? 'active' : ''
                      }`}
                      onClick={() => setDirectionSearchTarget('destination')}
                    >
                      Catch Location Will Go (B)
                    </button>
                    <button
                      type="button"
                      className={`nx-osm-target-tab ${
                        directionSearchTarget === 'start' ? 'active' : ''
                      }`}
                      onClick={() => setDirectionSearchTarget('start')}
                    >
                      Catch Start Location (A)
                    </button>
                  </div>
                </div>

                <NominatimAutocompleteInput
                  value={directionSearchQuery}
                  onChangeText={setDirectionSearchQuery}
                  badgeText={directionSearchTarget === 'destination' ? 'B' : 'A'}
                  badgeClass={directionSearchTarget === 'destination' ? 'is-dest' : 'is-origin'}
                  placeholder={
                    directionSearchTarget === 'destination'
                      ? 'Type destination place or street (Location will go)...'
                      : 'Type start location or street...'
                  }
                  actionButtonLabel={
                    directionSearchTarget === 'destination'
                      ? 'Catch Location Will Go'
                      : 'Catch Start'
                  }
                  onSelectResult={(p) => void handleSelectDirectionSearchedPlace(p)}
                />
              </div>
            )}

            {/* ROW B: Searched Location / Location Will Go */}
            <button
              type="button"
              className="nx-osm-direction-row is-dest is-filled"
              onClick={() => {
                setShowStartOptions(false)
                setDirectionSearchTarget('destination')
                setShowDirectionSearchBox((prev) => !prev)
              }}
              title="Click to search or change the location you will go"
            >
              <span className="nx-osm-point-tag is-dest">B</span>
              <div className="nx-osm-direction-row-body">
                <small>LOCATION THAT YOU SEARCHED (LOCATION WILL GO)</small>
                <strong>{activeDest?.displayName || 'Search location will go'}</strong>
                {activeDest && (
                  <span>
                    {activeDest.street}, {activeDest.city}
                  </span>
                )}
              </div>
              <span className="nx-osm-direction-action-pill is-dest-pill">
                <Search size={12} />
                <span>Search location will go</span>
              </span>
            </button>
          </div>

          {/* Active Route Summary Footer */}
          {(isCalculatingRoute || routeSummary) && (
            <div className="nx-osm-active-route-banner">
              <div className="nx-osm-active-route-info">
                <CheckCircle2 size={15} color="#16a34a" />
                <div>
                  <strong>
                    {isCalculatingRoute
                      ? 'Calculating road direction on OpenStreetMap...'
                      : `Direction Active: ${
                          startLocation?.street || startLocation?.displayName || 'Start'
                        } → ${
                          destinationLocation?.street ||
                          destinationLocation?.displayName ||
                          'Destination'
                        }`}
                  </strong>
                  {routeSummary && (
                    <span>
                      Road Distance: <strong>~{routeSummary.distanceKm} km</strong> · Est. Travel
                      Time: <strong>~{routeSummary.durationMins} mins</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Location Staying Status Bar */}
      {liveLocationInfo && (
        <div className="nx-osm-live-staying-banner">
          <div className="nx-osm-live-staying-info">
            <span className="nx-osm-live-pulse-dot" />
            <span className="nx-osm-live-tag">LIVE LOCATION STAYING</span>
            <strong>{liveLocationInfo.displayName || liveLocationInfo.street}</strong>
          </div>
          <button
            type="button"
            className="nx-osm-redirect-live-btn"
            onClick={onUseLiveGps}
            disabled={isLocatingGps}
            title="Redirect map to your current live location"
          >
            <LocateFixed size={13} />
            <span>{isLocatingGps ? 'Redirecting...' : 'Redirect to My Live'}</span>
          </button>
        </div>
      )}

      {gpsError && <div className="nx-osm-gps-error">{gpsError}</div>}
    </div>
  )
}

/**
 * 1. INTERACTIVE OPENSTREETMAP DELIVERY PIN PICKER
 */
export function AddressMapPicker({
  street = '',
  city = '',
  onSelectLocation,
  title = 'Pin Your Exact Delivery Location (OpenStreetMap)',
  compact = false,
}: AddressMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<LeafletGlobal>(null)
  const markerRef = useRef<LeafletGlobal>(null)
  const livePulseCircleRef = useRef<LeafletGlobal>(null)
  const liveStayingMarkerRef = useRef<LeafletGlobal>(null)
  const routeLayerGroupRef = useRef<LeafletGlobal>(null)
  const layerInstancesRef = useRef<Record<string, LeafletGlobal>>({})
  const storesOverlayGroupRef = useRef<LeafletGlobal>(null)
  const mapPickTargetRef = useRef<'start' | 'destination' | null>(null)

  const initialCoords = resolveAddressCoordinates(street, city)
  const [coords, setCoords] = useState(initialCoords)
  const [activeLayer, setActiveLayer] = useState('standard')
  const [showStorePinsOverlay, setShowStorePinsOverlay] = useState(true)
  const [reverseStatus, setReverseStatus] = useState('')
  const [liveLocationInfo, setLiveLocationInfo] = useState<ResolvedPlacePoint | null>(null)
  const [isLocatingGps, setIsLocatingGps] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [mapPickTarget, setMapPickTarget] = useState<'start' | 'destination' | null>(null)
  const [mapPickedEvent, setMapPickedEvent] = useState<MapPickedEventPayload | null>(null)
  const [externalSearchedPlace, setExternalSearchedPlace] = useState<ResolvedPlacePoint | null>(
    null,
  )

  const handleActivateMapPick = (targetMode: 'start' | 'destination' | null) => {
    mapPickTargetRef.current = targetMode
    setMapPickTarget(targetMode)
  }

  const renderLiveStayingMarkerOnMap = (
    latitude: number,
    longitude: number,
    streetText?: string,
    cityText?: string,
  ) => {
    const L = (window as Window & { L?: LeafletGlobal }).L
    const map = mapInstanceRef.current
    if (!map || !L) return

    if (livePulseCircleRef.current) {
      map.removeLayer(livePulseCircleRef.current)
    }
    livePulseCircleRef.current = L.circle([latitude, longitude], {
      radius: 120,
      color: '#2563eb',
      weight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.25,
    }).addTo(map)

    if (liveStayingMarkerRef.current) {
      map.removeLayer(liveStayingMarkerRef.current)
    }
    const liveIcon = L.divIcon({
      className: 'nx-osm-custom-pin',
      html: `<div class="nx-osm-pin-bubble is-live-staying" title="Your Live Location (Staying)"><span></span></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    })
    liveStayingMarkerRef.current = L.marker([latitude, longitude], { icon: liveIcon })
      .bindPopup(
        `<b>📍 Your Current Live Location (Staying)</b><br/>${
          streetText || 'Preah Norodom Blvd'
        }, ${cityText || 'Phnom Penh'}`,
      )
      .addTo(map)
  }

  const reverseGeocodeAndFill = async (
    lat: number,
    lng: number,
    isLiveGps = false,
  ): Promise<ResolvedPlacePoint> => {
    setCoords({ lat, lng })
    setReverseStatus('Fetching street & city from OpenStreetMap...')
    const res = await fetchReverseGeocode(lat, lng)
    setReverseStatus(`${isLiveGps ? 'Live GPS Caught' : 'Pinned'}: ${res.street}, ${res.city}`)
    if (onSelectLocation) {
      onSelectLocation({
        street: res.street,
        city: res.city,
        lat: res.lat,
        lng: res.lng,
      })
    }
    return res
  }

  const detectLiveLocation = (autoRedirect = false): Promise<ResolvedPlacePoint> => {
    setIsLocatingGps(true)
    setGpsError(null)

    const applyFallbackLiveLocation = (): ResolvedPlacePoint => {
      setIsLocatingGps(false)
      const fallbackLat = 11.5564
      const fallbackLng = 104.9282
      const fallbackInfo: ResolvedPlacePoint = {
        lat: fallbackLat,
        lng: fallbackLng,
        displayName: 'Preah Norodom Blvd, Phnom Penh',
        street: 'Preah Norodom Blvd (Live Staying)',
        city: 'Phnom Penh',
      }
      setLiveLocationInfo(fallbackInfo)
      renderLiveStayingMarkerOnMap(
        fallbackLat,
        fallbackLng,
        fallbackInfo.street,
        fallbackInfo.city,
      )
      if (autoRedirect) {
        const map = mapInstanceRef.current
        if (map && markerRef.current) {
          map.flyTo([fallbackLat, fallbackLng], 15, { duration: 0.85 })
          markerRef.current.setLatLng([fallbackLat, fallbackLng])
          markerRef.current
            .bindPopup(
              `<b>📍 Your Live Delivery Pin (Staying)</b><br/>${fallbackInfo.street}, ${fallbackInfo.city}`,
            )
            .openPopup()
        }
        setCoords({ lat: fallbackLat, lng: fallbackLng })
        setReverseStatus(`Live Location Staying: ${fallbackInfo.street}, ${fallbackInfo.city}`)
      }
      return fallbackInfo
    }

    if (!navigator.geolocation) {
      return Promise.resolve(applyFallbackLiveLocation())
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setIsLocatingGps(false)
          const { latitude, longitude } = pos.coords
          const rev = await fetchReverseGeocode(latitude, longitude)
          const info: ResolvedPlacePoint = {
            lat: latitude,
            lng: longitude,
            displayName: `${rev.street || 'Live Location'}, ${rev.city || 'Phnom Penh'}`,
            street: rev.street,
            city: rev.city,
          }
          setLiveLocationInfo(info)
          renderLiveStayingMarkerOnMap(latitude, longitude, rev.street, rev.city)

          const map = mapInstanceRef.current
          if (map && autoRedirect) {
            map.flyTo([latitude, longitude], 16, { duration: 0.85 })
            if (markerRef.current) {
              markerRef.current.setLatLng([latitude, longitude])
              markerRef.current
                .bindPopup(`<b>📍 Your Live Delivery Pin (Staying)</b><br/>${rev.street}, ${rev.city}`)
                .openPopup()
            }
            setCoords({ lat: latitude, lng: longitude })
            setReverseStatus(`Live GPS Auto-Detected: ${rev.street}, ${rev.city}`)
            if (onSelectLocation) {
              onSelectLocation({
                street: rev.street,
                city: rev.city,
                lat: latitude,
                lng: longitude,
              })
            }
          }
          resolve(info)
        },
        () => {
          resolve(applyFallbackLiveLocation())
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 },
      )
    })
  }

  const handleCalculateDirectionRoute = async (
    fromPt: ResolvedPlacePoint,
    toPt: ResolvedPlacePoint,
  ): Promise<RouteMetrics | null> => {
    const L = (window as Window & { L?: LeafletGlobal }).L
    const map = mapInstanceRef.current
    const routeGroup = routeLayerGroupRef.current
    if (!L || !map || !routeGroup) return null

    routeGroup.clearLayers()
    const osrm = await fetchOsrmDrivingRoute(fromPt, toPt)

    const originIcon = L.divIcon({
      className: 'nx-osm-custom-pin',
      html: `<div class="nx-osm-pin-bubble is-origin-a"><span>A</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    })

    const destIcon = L.divIcon({
      className: 'nx-osm-custom-pin',
      html: `<div class="nx-osm-pin-bubble is-dest-b"><span>B</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    })

    L.marker([fromPt.lat, fromPt.lng], { icon: originIcon })
      .bindPopup(
        `<b>Start Location (A):</b><br/>${fromPt.label || fromPt.displayName || fromPt.street}`,
      )
      .addTo(routeGroup)

    L.marker([toPt.lat, toPt.lng], { icon: destIcon })
      .bindPopup(
        `<b>Location Will Go (B):</b><br/>${toPt.displayName || toPt.street}<br/>Distance: ${
          osrm.distanceKm
        } km (~${osrm.durationMins} mins)`,
      )
      .addTo(routeGroup)
      .openPopup()

    const poly = L.polyline(osrm.coordinates, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.9,
    }).addTo(routeGroup)

    if (markerRef.current) {
      markerRef.current.setLatLng([toPt.lat, toPt.lng])
    }
    setCoords({ lat: Number(toPt.lat), lng: Number(toPt.lng) })
    setReverseStatus(
      `Direction Route: ${fromPt.street || fromPt.displayName} → ${
        toPt.street || toPt.displayName
      } (~${osrm.distanceKm} km, ${osrm.durationMins} mins)`,
    )

    if (onSelectLocation) {
      onSelectLocation({
        street: toPt.street || toPt.displayName,
        city: toPt.city || 'Phnom Penh',
        lat: Number(toPt.lat),
        lng: Number(toPt.lng),
      })
    }

    map.fitBounds(poly.getBounds(), { padding: [46, 46], maxZoom: 16 })
    return {
      distanceKm: osrm.distanceKm,
      durationMins: osrm.durationMins,
    }
  }

  const handleClearDirectionRoute = () => {
    if (routeLayerGroupRef.current) {
      routeLayerGroupRef.current.clearLayers()
    }
  }

  useEffect(() => {
    let isMounted = true

    void ensureLeafletLoaded().then((L) => {
      if (!isMounted || !L || !mapContainerRef.current) return
      if (mapInstanceRef.current) return

      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 15,
        scrollWheelZoom: true,
      })

      const storesGroup = L.layerGroup()
      const storeIcon = L.divIcon({
        className: 'nx-osm-custom-pin',
        html: `<div class="nx-osm-pin-bubble is-store"><span></span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      })

      FLAGSHIP_STORES.forEach((st) => {
        L.marker([st.lat, st.lng], { icon: storeIcon })
          .bindPopup(`<b>${st.name}</b><br/>${st.street}, ${st.city}`)
          .addTo(storesGroup)
      })
      storesGroup.addTo(map)
      storesOverlayGroupRef.current = storesGroup

      const routeGroup = L.layerGroup().addTo(map)
      routeLayerGroupRef.current = routeGroup

      const { layerInstancesById } = attachBaseLayersWithControl(L, map, activeLayer, {
        'AURA Store Hubs': storesGroup,
      })
      layerInstancesRef.current = layerInstancesById

      const pinIcon = L.divIcon({
        className: 'nx-osm-custom-pin',
        html: `<div class="nx-osm-pin-bubble"><span></span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      })

      const marker = L.marker([coords.lat, coords.lng], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map)

      marker
        .bindPopup('<b>Delivery Pin</b><br/>Drag me or click anywhere on the map')
        .openPopup()

      map.on('click', async (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng
        if (mapPickTargetRef.current) {
          const activeTarget = mapPickTargetRef.current
          const rev = await fetchReverseGeocode(lat, lng)
          if (activeTarget === 'destination') {
            marker.setLatLng([lat, lng])
          }
          setMapPickedEvent({
            target: activeTarget,
            place: rev,
            timestamp: Date.now(),
          })
          return
        }
        marker.setLatLng([lat, lng])
        const rev = await reverseGeocodeAndFill(lat, lng)
        if (rev) {
          setExternalSearchedPlace(rev)
        }
      })

      marker.on('dragend', async () => {
        const pos = marker.getLatLng()
        const rev = await reverseGeocodeAndFill(pos.lat, pos.lng)
        if (rev) {
          setExternalSearchedPlace(rev)
        }
      })

      mapInstanceRef.current = map
      markerRef.current = marker

      const hasSpecificAddress = Boolean(street && street.length > 2)
      void detectLiveLocation(!hasSpecificAddress)

      setTimeout(() => {
        map.invalidateSize()
      }, 200)
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        livePulseCircleRef.current = null
        liveStayingMarkerRef.current = null
        routeLayerGroupRef.current = null
      }
    }
  }, [])

  const handleSelectLayer = (layerId: string) => {
    setActiveLayer(layerId)
    switchMapTileLayer(mapInstanceRef.current, layerInstancesRef, layerId)
  }

  const handleToggleStoresOverlay = () => {
    const map = mapInstanceRef.current
    const grp = storesOverlayGroupRef.current
    if (!map || !grp) return
    if (showStorePinsOverlay) {
      map.removeLayer(grp)
      setShowStorePinsOverlay(false)
    } else {
      map.addLayer(grp)
      setShowStorePinsOverlay(true)
    }
  }

  const flyToCoordinates = (
    lat: number,
    lng: number,
    customStreet?: string,
    customCity?: string,
    isLiveGps = false,
  ) => {
    const numLat = Number(lat)
    const numLng = Number(lng)
    setCoords({ lat: numLat, lng: numLng })
    const map = mapInstanceRef.current

    if (map && markerRef.current) {
      map.flyTo([numLat, numLng], 16, { duration: 0.85 })
      markerRef.current.setLatLng([numLat, numLng])
      markerRef.current
        .bindPopup(
          isLiveGps
            ? `<b>📍 Your Current Live Location (Staying)</b><br/>${customStreet || ''}, ${
                customCity || ''
              }`
            : `<b>Selected Location</b><br/>${customStreet || ''}, ${customCity || ''}`,
        )
        .openPopup()
    }

    if (customStreet && customCity) {
      setReverseStatus(
        `${isLiveGps ? 'Live GPS Caught' : 'Pinned'}: ${customStreet}, ${customCity}`,
      )
      if (onSelectLocation) {
        onSelectLocation({
          street: customStreet,
          city: customCity,
          lat: numLat,
          lng: numLng,
        })
      }
    } else {
      void reverseGeocodeAndFill(numLat, numLng, isLiveGps)
    }
  }

  const handleRedirectToLiveLocation = () => {
    if (liveLocationInfo && mapInstanceRef.current) {
      flyToCoordinates(
        liveLocationInfo.lat,
        liveLocationInfo.lng,
        liveLocationInfo.street,
        liveLocationInfo.city,
        true,
      )
      return
    }
    void detectLiveLocation(true)
  }

  const handleCatchLiveForDirection = async (): Promise<ResolvedPlacePoint> => {
    if (liveLocationInfo) {
      renderLiveStayingMarkerOnMap(
        liveLocationInfo.lat,
        liveLocationInfo.lng,
        liveLocationInfo.street,
        liveLocationInfo.city,
      )
      return liveLocationInfo
    }
    const detected = await detectLiveLocation(false)
    return detected
  }

  return (
    <div className={`nx-osm-picker-card ${compact ? 'is-compact' : ''}`}>
      <div className="nx-osm-picker-head">
        <div className="nx-osm-picker-title-wrap">
          <span className="nx-osm-badge">
            <MapPin size={13} /> OpenStreetMap Live Auto-Location &amp; Delivery Pin
          </span>
          <h4>{title}</h4>
          <p>
            Search any location to show <strong>Direction</strong>, then choose your start location (
            <strong>Your location</strong>, <strong>Choose on map</strong>, or{' '}
            <strong>Search location</strong>) to route to the location you will go.
          </p>
        </div>
      </div>

      <SingleAutoLocationSearchPanel
        onPickLocation={(place) => {
          flyToCoordinates(
            place.lat,
            place.lng,
            place.street,
            place.city,
            Boolean(place.isLiveGps),
          )
        }}
        onUseLiveGps={handleRedirectToLiveLocation}
        onCatchLiveForDirection={handleCatchLiveForDirection}
        onCalculateRoute={handleCalculateDirectionRoute}
        onClearRoute={handleClearDirectionRoute}
        onActivateMapPick={handleActivateMapPick}
        mapPickTarget={mapPickTarget}
        mapPickedEvent={mapPickedEvent}
        externalSearchedPlace={externalSearchedPlace}
        isLocatingGps={isLocatingGps}
        liveLocationInfo={liveLocationInfo}
        gpsError={gpsError}
        placeholder="Search any place, street, or city..."
      />

      <MapLayerToolbar
        activeLayer={activeLayer}
        onSelectLayer={handleSelectLayer}
        showOverlayToggle
        overlayEnabled={showStorePinsOverlay}
        onToggleOverlay={handleToggleStoresOverlay}
        overlayLabel="Store Pins"
      />

      <div className="nx-osm-quick-hubs">
        <span className="nx-osm-quick-label">Quick Pin:</span>
        {QUICK_DELIVERY_HUBS.map((hub) => (
          <button
            key={hub.id}
            type="button"
            className="nx-osm-hub-pill"
            onClick={() => {
              flyToCoordinates(hub.lat, hub.lng, hub.street, hub.city, false)
              setExternalSearchedPlace({
                lat: hub.lat,
                lng: hub.lng,
                displayName: hub.label,
                street: hub.street,
                city: hub.city,
              })
            }}
          >
            <Navigation size={11} />
            {hub.label}
          </button>
        ))}
      </div>

      <div className={`nx-osm-map-frame ${mapPickTarget ? 'is-picking-on-map' : ''}`}>
        <div
          ref={mapContainerRef}
          className="nx-osm-leaflet-container"
          style={{ height: compact ? '440px' : '500px' }}
        />
      </div>

      <div className="nx-osm-picker-foot">
        <div className="nx-osm-coord-readout">
          <CheckCircle2 size={14} color="#16a34a" />
          <span>
            {reverseStatus ||
              `Active Pin: ${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E`}
          </span>
        </div>
        <a
          href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=17/${coords.lat}/${coords.lng}`}
          target="_blank"
          rel="noreferrer"
          className="nx-osm-external-link"
        >
          <span>View larger on OpenStreetMap</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}

/**
 * 2. LIVE DELIVERY ROUTE & DESTINATION MAP PREVIEW
 */
export function DeliveryRouteMap({
  address,
  orderNumber,
  status = 'pending',
  onUpdateDestination,
}: DeliveryRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<LeafletGlobal>(null)
  const originMarkerRef = useRef<LeafletGlobal>(null)
  const destMarkerRef = useRef<LeafletGlobal>(null)
  const livePulseCircleRef = useRef<LeafletGlobal>(null)
  const liveStayingMarkerRef = useRef<LeafletGlobal>(null)
  const routeLineRef = useRef<LeafletGlobal>(null)
  const layerInstancesRef = useRef<Record<string, LeafletGlobal>>({})
  const zoneOverlayRef = useRef<LeafletGlobal>(null)
  const mapPickTargetRef = useRef<'start' | 'destination' | null>(null)

  const hub = FLAGSHIP_STORES[0]
  const initialDest = resolveAddressCoordinates(address?.street || '', address?.city || '')

  const [originPoint, setOriginPoint] = useState<ResolvedPlacePoint>({
    lat: hub.lat,
    lng: hub.lng,
    displayName: hub.name,
    street: hub.street,
    city: hub.city,
  })
  const [destCoords, setDestCoords] = useState(initialDest)
  const [customDestLabel, setCustomDestLabel] = useState('')
  const [activeLayer, setActiveLayer] = useState('standard')
  const [showZoneOverlay, setShowZoneOverlay] = useState(true)
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null)
  const [liveLocationInfo, setLiveLocationInfo] = useState<ResolvedPlacePoint | null>(null)
  const [isLocatingGps, setIsLocatingGps] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [mapPickTarget, setMapPickTarget] = useState<'start' | 'destination' | null>(null)
  const [mapPickedEvent, setMapPickedEvent] = useState<MapPickedEventPayload | null>(null)

  const handleActivateMapPick = (targetMode: 'start' | 'destination' | null) => {
    mapPickTargetRef.current = targetMode
    setMapPickTarget(targetMode)
  }

  useEffect(() => {
    setDestCoords(resolveAddressCoordinates(address?.street || '', address?.city || ''))
    setCustomDestLabel('')
  }, [address?.street, address?.city])

  const fallbackDistKm = Math.max(
    1.2,
    Math.hypot((destCoords.lat - originPoint.lat) * 111, (destCoords.lng - originPoint.lng) * 108),
  ).toFixed(1)
  const distKm = routeMetrics?.distanceKm || fallbackDistKm
  const estMinutes =
    routeMetrics?.durationMins || Math.min(180, Math.max(15, Math.round(Number(distKm) * 5 + 10)))

  const renderLiveStayingOnRouteMap = (
    latitude: number,
    longitude: number,
    streetText?: string,
    cityText?: string,
  ) => {
    const L = (window as Window & { L?: LeafletGlobal }).L
    const map = mapInstanceRef.current
    if (!map || !L) return

    if (livePulseCircleRef.current) {
      map.removeLayer(livePulseCircleRef.current)
    }
    livePulseCircleRef.current = L.circle([latitude, longitude], {
      radius: 120,
      color: '#2563eb',
      weight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.25,
    }).addTo(map)

    if (liveStayingMarkerRef.current) {
      map.removeLayer(liveStayingMarkerRef.current)
    }
    const liveIcon = L.divIcon({
      className: 'nx-osm-custom-pin',
      html: `<div class="nx-osm-pin-bubble is-live-staying" title="Your Live Location (Staying)"><span></span></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    })
    liveStayingMarkerRef.current = L.marker([latitude, longitude], { icon: liveIcon })
      .bindPopup(
        `<b>📍 Your Current Live Location (Staying)</b><br/>${
          streetText || 'Preah Norodom Blvd'
        }, ${cityText || 'Phnom Penh'}`,
      )
      .addTo(map)
  }

  const handleUpdateDestination = async (toPt: ResolvedPlacePoint) => {
    setDestCoords({ lat: toPt.lat, lng: toPt.lng })
    const toLabel = `${toPt.street || toPt.displayName}, ${toPt.city || 'Phnom Penh'}`
    setCustomDestLabel(toLabel)

    const osrm = await fetchOsrmDrivingRoute(originPoint, toPt)
    setRouteMetrics({
      distanceKm: osrm.distanceKm,
      durationMins: osrm.durationMins,
      fromLabel: originPoint.displayName,
      toLabel: toPt.displayName || toPt.street,
    })

    if (mapInstanceRef.current && destMarkerRef.current && routeLineRef.current) {
      destMarkerRef.current.setLatLng([toPt.lat, toPt.lng])
      destMarkerRef.current
        .bindPopup(
          toPt.isLiveGps
            ? `<b>📍 Destination (B) — Your Live Location (Staying):</b><br/>${toLabel}<br/>Distance: ${osrm.distanceKm} km (~${osrm.durationMins} mins)`
            : `<b>To Destination (B):</b><br/>${toLabel}<br/>Distance: ${osrm.distanceKm} km (~${osrm.durationMins} mins)`,
        )
        .openPopup()

      routeLineRef.current.setLatLngs(osrm.coordinates)
      mapInstanceRef.current.fitBounds(routeLineRef.current.getBounds(), {
        padding: [44, 44],
        maxZoom: 15,
      })
    }

    if (onUpdateDestination) {
      onUpdateDestination({
        lat: toPt.lat,
        lng: toPt.lng,
        street: toPt.street,
        city: toPt.city,
      })
    }
  }

  const detectLiveLocationAndRoute = (autoRedirect = true): Promise<ResolvedPlacePoint> => {
    setIsLocatingGps(true)
    setGpsError(null)

    const applyFallbackLive = (): ResolvedPlacePoint => {
      setIsLocatingGps(false)
      const fallbackInfo: ResolvedPlacePoint = {
        lat: 11.5564,
        lng: 104.9282,
        displayName: 'Preah Norodom Blvd, Phnom Penh',
        street: 'Preah Norodom Blvd (Live Staying)',
        city: 'Phnom Penh',
      }
      setLiveLocationInfo(fallbackInfo)
      renderLiveStayingOnRouteMap(
        fallbackInfo.lat,
        fallbackInfo.lng,
        fallbackInfo.street,
        fallbackInfo.city,
      )
      return fallbackInfo
    }

    if (!navigator.geolocation) {
      return Promise.resolve(applyFallbackLive())
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setIsLocatingGps(false)
          const { latitude, longitude } = pos.coords
          const rev = await fetchReverseGeocode(latitude, longitude)
          const liveInfo: ResolvedPlacePoint = {
            lat: latitude,
            lng: longitude,
            displayName: `${rev.street || 'Live Location'}, ${rev.city || 'Phnom Penh'}`,
            street: rev.street,
            city: rev.city,
          }
          setLiveLocationInfo(liveInfo)
          renderLiveStayingOnRouteMap(latitude, longitude, rev.street, rev.city)

          if (autoRedirect) {
            await handleUpdateDestination({
              lat: latitude,
              lng: longitude,
              displayName: liveInfo.displayName,
              street: rev.street,
              city: rev.city,
              isLiveGps: true,
            })
          }
          resolve(liveInfo)
        },
        () => {
          resolve(applyFallbackLive())
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 },
      )
    })
  }

  useEffect(() => {
    let isMounted = true

    void ensureLeafletLoaded().then(async (L) => {
      if (!isMounted || !L || !mapContainerRef.current) return
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const map = L.map(mapContainerRef.current, {
        center: [(originPoint.lat + destCoords.lat) / 2, (originPoint.lng + destCoords.lng) / 2],
        zoom: 13,
        scrollWheelZoom: true,
      })

      const zoneGroup = L.layerGroup()
      L.circle([hub.lat, hub.lng], {
        radius: 4500,
        color: '#b45309',
        weight: 1.5,
        fillColor: '#f59e0b',
        fillOpacity: 0.08,
      })
        .bindPopup('<b>Same-Day Express Delivery Zone</b><br/>Phnom Penh Metro Area')
        .addTo(zoneGroup)
      zoneGroup.addTo(map)
      zoneOverlayRef.current = zoneGroup

      const { layerInstancesById } = attachBaseLayersWithControl(L, map, activeLayer, {
        'Express Delivery Zone': zoneGroup,
      })
      layerInstancesRef.current = layerInstancesById

      const storeIcon = L.divIcon({
        className: 'nx-osm-custom-pin',
        html: `<div class="nx-osm-pin-bubble is-origin-a"><span>A</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      })

      const destIcon = L.divIcon({
        className: 'nx-osm-custom-pin',
        html: `<div class="nx-osm-pin-bubble is-dest-b"><span>B</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      })

      const storeMarker = L.marker([originPoint.lat, originPoint.lng], {
        icon: storeIcon,
        draggable: true,
      }).addTo(map)
      storeMarker.bindPopup(`<b>From Start (A):</b><br/>${originPoint.displayName}`)

      const destMarker = L.marker([destCoords.lat, destCoords.lng], {
        icon: destIcon,
        draggable: true,
      }).addTo(map)
      destMarker
        .bindPopup(
          `<b>To Destination (B):</b><br/>${
            customDestLabel ||
            (address
              ? `${address.receiver_name || 'Customer'} — ${address.street}, ${address.city}`
              : 'Phnom Penh Delivery Zone')
          }`,
        )
        .openPopup()

      const osrm = await fetchOsrmDrivingRoute(originPoint, destCoords)
      if (!isMounted) return
      setRouteMetrics({
        distanceKm: osrm.distanceKm,
        durationMins: osrm.durationMins,
      })

      const routeLine = L.polyline(osrm.coordinates, {
        color: '#2563eb',
        weight: 4.5,
        opacity: 0.88,
      }).addTo(map)

      map.on('click', async (e: { latlng: { lat: number; lng: number } }) => {
        if (!mapPickTargetRef.current) return
        const activeTarget = mapPickTargetRef.current
        const { lat, lng } = e.latlng
        const rev = await fetchReverseGeocode(lat, lng)
        setMapPickedEvent({
          target: activeTarget,
          place: rev,
          timestamp: Date.now(),
        })
      })

      destMarker.on('dragend', async () => {
        const pos = destMarker.getLatLng()
        const originPos = storeMarker.getLatLng()
        setDestCoords({ lat: pos.lat, lng: pos.lng })
        const updatedRoute = await fetchOsrmDrivingRoute(
          { lat: originPos.lat, lng: originPos.lng },
          { lat: pos.lat, lng: pos.lng },
        )
        routeLine.setLatLngs(updatedRoute.coordinates)
        setRouteMetrics({
          distanceKm: updatedRoute.distanceKm,
          durationMins: updatedRoute.durationMins,
        })
      })

      storeMarker.on('dragend', async () => {
        const originPos = storeMarker.getLatLng()
        const pos = destMarker.getLatLng()
        const rev = await fetchReverseGeocode(originPos.lat, originPos.lng)
        setOriginPoint({
          lat: originPos.lat,
          lng: originPos.lng,
          displayName: rev.displayName,
          street: rev.street,
          city: rev.city,
        })
        const updatedRoute = await fetchOsrmDrivingRoute(
          { lat: originPos.lat, lng: originPos.lng },
          { lat: pos.lat, lng: pos.lng },
        )
        routeLine.setLatLngs(updatedRoute.coordinates)
        setRouteMetrics({
          distanceKm: updatedRoute.distanceKm,
          durationMins: updatedRoute.durationMins,
        })
      })

      map.fitBounds(routeLine.getBounds(), { padding: [42, 42], maxZoom: 15 })
      mapInstanceRef.current = map
      originMarkerRef.current = storeMarker
      destMarkerRef.current = destMarker
      routeLineRef.current = routeLine

      const hasSpecificAddress = Boolean(address?.street && address.street.length > 2)
      void detectLiveLocationAndRoute(!hasSpecificAddress)

      setTimeout(() => {
        map.invalidateSize()
      }, 200)
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        originMarkerRef.current = null
        destMarkerRef.current = null
        routeLineRef.current = null
        livePulseCircleRef.current = null
        liveStayingMarkerRef.current = null
      }
    }
  }, [address?.street, address?.city])

  const handleSelectLayer = (layerId: string) => {
    setActiveLayer(layerId)
    switchMapTileLayer(mapInstanceRef.current, layerInstancesRef, layerId)
  }

  const handleToggleZoneOverlay = () => {
    const map = mapInstanceRef.current
    const grp = zoneOverlayRef.current
    if (!map || !grp) return
    if (showZoneOverlay) {
      map.removeLayer(grp)
      setShowZoneOverlay(false)
    } else {
      map.addLayer(grp)
      setShowZoneOverlay(true)
    }
  }

  const handleCalculateCustomRoute = async (
    fromPt: ResolvedPlacePoint,
    toPt: ResolvedPlacePoint,
  ): Promise<RouteMetrics> => {
    setOriginPoint({
      lat: Number(fromPt.lat),
      lng: Number(fromPt.lng),
      displayName: fromPt.displayName || fromPt.street,
      street: fromPt.street || fromPt.displayName,
      city: fromPt.city || 'Phnom Penh',
    })
    setDestCoords({ lat: Number(toPt.lat), lng: Number(toPt.lng) })
    const toLabel = `${toPt.street || toPt.displayName}, ${toPt.city || 'Phnom Penh'}`
    setCustomDestLabel(toLabel)

    const osrm = await fetchOsrmDrivingRoute(fromPt, toPt)
    setRouteMetrics({
      distanceKm: osrm.distanceKm,
      durationMins: osrm.durationMins,
      fromLabel: fromPt.displayName || fromPt.street,
      toLabel: toPt.displayName || toPt.street,
    })

    if (
      mapInstanceRef.current &&
      originMarkerRef.current &&
      destMarkerRef.current &&
      routeLineRef.current
    ) {
      originMarkerRef.current.setLatLng([fromPt.lat, fromPt.lng])
      originMarkerRef.current.bindPopup(
        `<b>Start Location (A):</b><br/>${fromPt.label || fromPt.displayName || fromPt.street}`,
      )
      destMarkerRef.current.setLatLng([toPt.lat, toPt.lng])
      destMarkerRef.current
        .bindPopup(
          `<b>Location Will Go (B):</b><br/>${toLabel}<br/>Distance: ${osrm.distanceKm} km (~${osrm.durationMins} mins)`,
        )
        .openPopup()
      routeLineRef.current.setLatLngs(osrm.coordinates)
      mapInstanceRef.current.fitBounds(routeLineRef.current.getBounds(), {
        padding: [44, 44],
        maxZoom: 15,
      })
    }

    return {
      distanceKm: osrm.distanceKm,
      durationMins: osrm.durationMins,
    }
  }

  const handleRedirectToLiveDestination = () => {
    if (liveLocationInfo) {
      void handleUpdateDestination({
        lat: liveLocationInfo.lat,
        lng: liveLocationInfo.lng,
        displayName: liveLocationInfo.displayName,
        street: liveLocationInfo.street,
        city: liveLocationInfo.city,
        isLiveGps: true,
      })
      return
    }
    void detectLiveLocationAndRoute(true)
  }

  const handleCatchLiveForRouteMap = async (): Promise<ResolvedPlacePoint> => {
    if (liveLocationInfo) return liveLocationInfo
    return await detectLiveLocationAndRoute(false)
  }

  return (
    <div className="nx-osm-route-card">
      <div className="nx-osm-route-header">
        <div>
          <span className="nx-osm-badge">
            <Truck size={13} /> OpenStreetMap Live Auto-Location &amp; Delivery Route
          </span>
          <h4>
            {orderNumber
              ? `Order ${orderNumber} — Delivery Route & Tracking Map`
              : 'Live Delivery Dispatch & Location Map'}
          </h4>
        </div>
        <div className="nx-osm-route-metrics">
          <span>
            Distance: <strong>~{distKm} km</strong>
          </span>
          <span>
            Est. Travel Time: <strong>{estMinutes} mins</strong>
          </span>
          {status && (
            <span className={`nx-status-badge ${status}`}>Status: {status.toUpperCase()}</span>
          )}
        </div>
      </div>

      <SingleAutoLocationSearchPanel
        onPickLocation={(p) => void handleUpdateDestination(p)}
        onUseLiveGps={handleRedirectToLiveDestination}
        onCatchLiveForDirection={handleCatchLiveForRouteMap}
        onCalculateRoute={handleCalculateCustomRoute}
        onActivateMapPick={handleActivateMapPick}
        mapPickTarget={mapPickTarget}
        mapPickedEvent={mapPickedEvent}
        isLocatingGps={isLocatingGps}
        liveLocationInfo={liveLocationInfo}
        gpsError={gpsError}
        placeholder="Search any place or address — or redirect to live location..."
      />

      <MapLayerToolbar
        activeLayer={activeLayer}
        onSelectLayer={handleSelectLayer}
        showOverlayToggle
        overlayEnabled={showZoneOverlay}
        onToggleOverlay={handleToggleZoneOverlay}
        overlayLabel="Express Zone"
      />

      <div className={`nx-osm-map-frame ${mapPickTarget ? 'is-picking-on-map' : ''}`}>
        <div
          ref={mapContainerRef}
          className="nx-osm-leaflet-container"
          style={{ height: '460px' }}
        />
      </div>

      <div className="nx-osm-route-stops">
        <div className="nx-osm-stop-item">
          <span className="nx-osm-stop-dot is-origin" />
          <div>
            <small>FROM START LOCATION (A)</small>
            <strong>{originPoint.displayName}</strong>
            <span>
              {originPoint.street}, {originPoint.city}
            </span>
          </div>
        </div>
        <div className="nx-osm-stop-item">
          <span className="nx-osm-stop-dot is-dest" />
          <div>
            <small>TO LOCATION WILL GO (B)</small>
            <strong>
              {address?.receiver_name
                ? `${address.receiver_name} (${address.phone || ''})`
                : 'Customer Delivery Destination'}
            </strong>
            <span>
              {customDestLabel ||
                (address ? `${address.street}, ${address.city}` : 'Auto-detected live location')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 3. INTERACTIVE STORE LOCATOR & FLAGSHIP BOUTIQUES SECTION (HOME PAGE)
 */
export function StoreLocatorSection(_props: StoreLocatorSectionProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<LeafletGlobal>(null)
  const markersMapRef = useRef<Record<string, LeafletGlobal>>({})
  const searchedMarkerRef = useRef<LeafletGlobal>(null)
  const livePulseCircleRef = useRef<LeafletGlobal>(null)
  const liveStayingMarkerRef = useRef<LeafletGlobal>(null)
  const routeLayerGroupRef = useRef<LeafletGlobal>(null)
  const layerInstancesRef = useRef<Record<string, LeafletGlobal>>({})
  const zoneOverlayRef = useRef<LeafletGlobal>(null)
  const mapPickTargetRef = useRef<'start' | 'destination' | null>(null)

  const [activeStoreId, setActiveStoreId] = useState(FLAGSHIP_STORES[0].id)
  const [activeLayer, setActiveLayer] = useState('standard')
  const [showRadiusOverlay, setShowRadiusOverlay] = useState(true)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [searchedPlaceInfo, setSearchedPlaceInfo] = useState<{
    label: string
    nearestStoreName: string
    distanceKm: string
  } | null>(null)
  const [liveLocationInfo, setLiveLocationInfo] = useState<ResolvedPlacePoint | null>(null)
  const [isLocatingGps, setIsLocatingGps] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [mapPickTarget, setMapPickTarget] = useState<'start' | 'destination' | null>(null)
  const [mapPickedEvent, setMapPickedEvent] = useState<MapPickedEventPayload | null>(null)
  const [externalSearchedPlace, setExternalSearchedPlace] = useState<ResolvedPlacePoint | null>(
    null,
  )

  const activeStore =
    FLAGSHIP_STORES.find((s) => s.id === activeStoreId) || FLAGSHIP_STORES[0]

  const handleActivateMapPick = (targetMode: 'start' | 'destination' | null) => {
    mapPickTargetRef.current = targetMode
    setMapPickTarget(targetMode)
  }

  const renderLiveStayingOnStoreMap = (
    latitude: number,
    longitude: number,
    streetText?: string,
    cityText?: string,
  ) => {
    const L = (window as Window & { L?: LeafletGlobal }).L
    const activeMap = mapInstanceRef.current
    if (!activeMap || !L) return

    if (livePulseCircleRef.current) {
      activeMap.removeLayer(livePulseCircleRef.current)
    }
    livePulseCircleRef.current = L.circle([latitude, longitude], {
      radius: 120,
      color: '#2563eb',
      weight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.25,
    }).addTo(activeMap)

    if (liveStayingMarkerRef.current) {
      activeMap.removeLayer(liveStayingMarkerRef.current)
    }
    const liveIcon = L.divIcon({
      className: 'nx-osm-custom-pin',
      html: `<div class="nx-osm-pin-bubble is-live-staying" title="Your Live Location (Staying)"><span></span></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    })
    liveStayingMarkerRef.current = L.marker([latitude, longitude], { icon: liveIcon })
      .bindPopup(
        `<b>📍 Your Current Live Location (Staying)</b><br/>${
          streetText || 'Preah Norodom Blvd'
        }, ${cityText || 'Phnom Penh'}`,
      )
      .addTo(activeMap)
  }

  const handleSearchLocationOnStoreMap = ({
    lat,
    lng,
    street,
    city,
    isLiveGps,
  }: ResolvedPlacePoint) => {
    setUserCoords({ lat, lng })

    let closest = FLAGSHIP_STORES[0]
    let minKm = Infinity
    FLAGSHIP_STORES.forEach((st) => {
      const km = Math.hypot((st.lat - lat) * 111, (st.lng - lng) * 108)
      if (km < minKm) {
        minKm = km
        closest = st
      }
    })

    setActiveStoreId(closest.id)
    setSearchedPlaceInfo({
      label: isLiveGps ? `Current Live Location (${street}, ${city})` : `${street}, ${city}`,
      nearestStoreName: closest.name,
      distanceKm: minKm.toFixed(1),
    })

    if (!isLiveGps && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 0.85 })
    }
  }

  useEffect(() => {
    let isMounted = true

    void ensureLeafletLoaded().then((L) => {
      if (!isMounted || !L || !mapContainerRef.current) return
      if (mapInstanceRef.current) return

      const map = L.map(mapContainerRef.current, {
        center: [activeStore.lat, activeStore.lng],
        zoom: 14,
        scrollWheelZoom: true,
      })

      const radiusGroup = L.layerGroup()
      FLAGSHIP_STORES.forEach((st) => {
        L.circle([st.lat, st.lng], {
          radius: 1800,
          color: '#b45309',
          weight: 1.5,
          fillColor: '#f59e0b',
          fillOpacity: 0.08,
        }).addTo(radiusGroup)
      })
      radiusGroup.addTo(map)
      zoneOverlayRef.current = radiusGroup

      const routeGroup = L.layerGroup().addTo(map)
      routeLayerGroupRef.current = routeGroup

      const { layerInstancesById } = attachBaseLayersWithControl(L, map, activeLayer, {
        'Boutique Pickup Zones': radiusGroup,
      })
      layerInstancesRef.current = layerInstancesById

      const storeIcon = L.divIcon({
        className: 'nx-osm-custom-pin',
        html: `<div class="nx-osm-pin-bubble is-store"><span></span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      })

      FLAGSHIP_STORES.forEach((store) => {
        const marker = L.marker([store.lat, store.lng], { icon: storeIcon }).addTo(map)
        marker.bindPopup(
          `<div style="min-width:190px">
            <strong style="font-size:13px">${store.name}</strong><br/>
            <span style="font-size:12px;color:#4b5563">${store.street}, ${store.city}</span><br/>
            <span style="font-size:11px;color:#111827;font-weight:600">${store.hours}</span>
          </div>`,
        )
        marker.on('click', () => {
          setActiveStoreId(store.id)
        })
        markersMapRef.current[store.id] = marker
      })

      if (markersMapRef.current[activeStore.id]) {
        markersMapRef.current[activeStore.id].openPopup()
      }

      map.on('click', async (e: { latlng: { lat: number; lng: number } }) => {
        if (!mapPickTargetRef.current) return
        const activeTarget = mapPickTargetRef.current
        const { lat, lng } = e.latlng
        const rev = await fetchReverseGeocode(lat, lng)
        setMapPickedEvent({
          target: activeTarget,
          place: rev,
          timestamp: Date.now(),
        })
      })

      mapInstanceRef.current = map

      const applyFallbackStoreLive = () => {
        if (!isMounted) return
        setIsLocatingGps(false)
        const fallbackInfo: ResolvedPlacePoint = {
          lat: 11.5564,
          lng: 104.9282,
          displayName: 'Preah Norodom Blvd, Phnom Penh',
          street: 'Preah Norodom Blvd (Live Staying)',
          city: 'Phnom Penh',
        }
        setLiveLocationInfo(fallbackInfo)
        renderLiveStayingOnStoreMap(
          fallbackInfo.lat,
          fallbackInfo.lng,
          fallbackInfo.street,
          fallbackInfo.city,
        )
      }

      if (navigator.geolocation) {
        setIsLocatingGps(true)
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            if (!isMounted) return
            setIsLocatingGps(false)
            const { latitude, longitude } = pos.coords
            const rev = await fetchReverseGeocode(latitude, longitude)
            const liveInfo: ResolvedPlacePoint = {
              lat: latitude,
              lng: longitude,
              displayName: `${rev.street || 'Live Location'}, ${rev.city || 'Phnom Penh'}`,
              street: rev.street,
              city: rev.city,
            }
            setLiveLocationInfo(liveInfo)
            renderLiveStayingOnStoreMap(latitude, longitude, rev.street, rev.city)

            handleSearchLocationOnStoreMap({
              lat: latitude,
              lng: longitude,
              displayName: liveInfo.displayName,
              street: rev.street,
              city: rev.city,
              isLiveGps: true,
            })
          },
          () => {
            applyFallbackStoreLive()
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 },
        )
      } else {
        applyFallbackStoreLive()
      }

      setTimeout(() => {
        map.invalidateSize()
      }, 250)
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersMapRef.current = {}
        livePulseCircleRef.current = null
        liveStayingMarkerRef.current = null
      }
    }
  }, [])

  const handleSelectLayer = (layerId: string) => {
    setActiveLayer(layerId)
    switchMapTileLayer(mapInstanceRef.current, layerInstancesRef, layerId)
  }

  const handleToggleRadiusOverlay = () => {
    const map = mapInstanceRef.current
    const grp = zoneOverlayRef.current
    if (!map || !grp) return
    if (showRadiusOverlay) {
      map.removeLayer(grp)
      setShowRadiusOverlay(false)
    } else {
      map.addLayer(grp)
      setShowRadiusOverlay(true)
    }
  }

  const handleSelectStore = (store: FlagshipStore) => {
    setActiveStoreId(store.id)
    setExternalSearchedPlace({
      lat: store.lat,
      lng: store.lng,
      displayName: store.name,
      street: store.street,
      city: store.city,
    })
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([store.lat, store.lng], 15, { duration: 0.9 })
      const marker = markersMapRef.current[store.id]
      if (marker) {
        marker.openPopup()
      }
    }
  }

  const handleDrawStoreRoute = async (
    fromPt: ResolvedPlacePoint,
    toPt: ResolvedPlacePoint,
  ): Promise<RouteMetrics | null> => {
    const L = (window as Window & { L?: LeafletGlobal }).L
    const map = mapInstanceRef.current
    const routeGroup = routeLayerGroupRef.current
    if (!L || !map || !routeGroup) return null

    routeGroup.clearLayers()
    if (searchedMarkerRef.current) {
      map.removeLayer(searchedMarkerRef.current)
      searchedMarkerRef.current = null
    }

    const osrm = await fetchOsrmDrivingRoute(fromPt, toPt)

    const originIcon = L.divIcon({
      className: 'nx-osm-custom-pin',
      html: `<div class="nx-osm-pin-bubble is-origin-a"><span>A</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    })

    const destIcon = L.divIcon({
      className: 'nx-osm-custom-pin',
      html: `<div class="nx-osm-pin-bubble is-dest-b"><span>B</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    })

    L.marker([fromPt.lat, fromPt.lng], { icon: originIcon })
      .bindPopup(
        `<b>Start Location (A):</b><br/>${fromPt.label || fromPt.displayName || fromPt.street}`,
      )
      .addTo(routeGroup)

    L.marker([toPt.lat, toPt.lng], { icon: destIcon })
      .bindPopup(
        `<b>Location Will Go (B):</b><br/>${toPt.displayName || toPt.street}<br/>Distance: ${
          osrm.distanceKm
        } km (~${osrm.durationMins} mins)`,
      )
      .addTo(routeGroup)
      .openPopup()

    const poly = L.polyline(osrm.coordinates, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.88,
    }).addTo(routeGroup)

    map.fitBounds(poly.getBounds(), { padding: [46, 46], maxZoom: 15 })
    return {
      distanceKm: osrm.distanceKm,
      durationMins: osrm.durationMins,
    }
  }

  const handleClearStoreRoute = () => {
    if (routeLayerGroupRef.current) {
      routeLayerGroupRef.current.clearLayers()
    }
  }

  const handleCatchLiveForStoreMap = async (): Promise<ResolvedPlacePoint> => {
    if (liveLocationInfo) {
      renderLiveStayingOnStoreMap(
        liveLocationInfo.lat,
        liveLocationInfo.lng,
        liveLocationInfo.street,
        liveLocationInfo.city,
      )
      return liveLocationInfo
    }
    const fallbackInfo: ResolvedPlacePoint = {
      lat: 11.5564,
      lng: 104.9282,
      displayName: 'Preah Norodom Blvd, Phnom Penh',
      street: 'Preah Norodom Blvd (Live Staying)',
      city: 'Phnom Penh',
    }
    setLiveLocationInfo(fallbackInfo)
    renderLiveStayingOnStoreMap(
      fallbackInfo.lat,
      fallbackInfo.lng,
      fallbackInfo.street,
      fallbackInfo.city,
    )
    return fallbackInfo
  }

  const handleRedirectToLiveStoreMap = async () => {
    const livePt = await handleCatchLiveForStoreMap()
    if (livePt && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([livePt.lat, livePt.lng], 15, { duration: 0.85 })
    }
  }

  return (
    <section className="nx-container nx-store-locator-section" id="nx-store-locator">
      <div className="nx-store-locator-header">
        <div>
          <span className="nx-eyebrow">
            <Compass size={13} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            OPENSTREETMAP BOUTIQUE &amp; ROUTE LOCATOR
          </span>
          <h2 className="nx-section-title">Visit Our Flagship Studios &amp; Pickup Hubs</h2>
          <p className="nx-muted">
            Search any location to show <strong>Direction</strong>, then choose your start location (
            <strong>Your location</strong>, <strong>Choose on map</strong>, or{' '}
            <strong>Search location</strong>) to route to the location you will go.
          </p>
        </div>

        <div className="nx-store-locator-actions">
          <button
            type="button"
            className="nx-osm-gps-btn"
            onClick={() => void handleRedirectToLiveStoreMap()}
            disabled={isLocatingGps}
          >
            <LocateFixed size={15} />
            <span>{isLocatingGps ? 'Locating...' : 'Redirect to My Live & Nearest Studio'}</span>
          </button>
        </div>
      </div>

      <div className="nx-store-locator-grid">
        <div className="nx-store-cards-list">
          {FLAGSHIP_STORES.map((store) => {
            const isSelected = store.id === activeStoreId
            return (
              <div
                key={store.id}
                className={`nx-store-card ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectStore(store)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleSelectStore(store)
                }}
              >
                <div className="nx-store-card-top">
                  <span className="nx-store-badge">
                    <Store size={12} /> {store.badge}
                  </span>
                  {isSelected && <span className="nx-store-active-pill">Selected on Map</span>}
                </div>

                <h3>{store.name}</h3>
                <p className="nx-store-addr">
                  <MapPin size={14} />
                  <span>
                    {store.street}, {store.city}
                  </span>
                </p>

                <div className="nx-store-meta-row">
                  <span>
                    <Clock size={13} /> {store.hours}
                  </span>
                  <span>
                    <Phone size={13} /> {store.phone}
                  </span>
                </div>

                <div className="nx-store-services">
                  {store.services.map((srv) => (
                    <span key={srv} className="nx-store-service-tag">
                      {srv}
                    </span>
                  ))}
                </div>

                <div className="nx-store-card-foot">
                  <a
                    href={`https://www.openstreetmap.org/directions?from=${
                      userCoords ? `${userCoords.lat},${userCoords.lng}` : ''
                    }&to=${store.lat},${store.lng}#map=15/${store.lat}/${store.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="nx-store-direction-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Navigation size={13} />
                    <span>Get Directions on OpenStreetMap</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        <div className="nx-store-map-panel">
          <SingleAutoLocationSearchPanel
            onPickLocation={handleSearchLocationOnStoreMap}
            onUseLiveGps={() => void handleRedirectToLiveStoreMap()}
            onCatchLiveForDirection={handleCatchLiveForStoreMap}
            onCalculateRoute={handleDrawStoreRoute}
            onClearRoute={handleClearStoreRoute}
            onActivateMapPick={handleActivateMapPick}
            mapPickTarget={mapPickTarget}
            mapPickedEvent={mapPickedEvent}
            externalSearchedPlace={externalSearchedPlace}
            isLocatingGps={isLocatingGps}
            liveLocationInfo={liveLocationInfo}
            gpsError={gpsError}
            placeholder="Search any place or address to show Direction..."
          />

          <MapLayerToolbar
            activeLayer={activeLayer}
            onSelectLayer={handleSelectLayer}
            showOverlayToggle
            overlayEnabled={showRadiusOverlay}
            onToggleOverlay={handleToggleRadiusOverlay}
            overlayLabel="Pickup Zones"
          />

          {searchedPlaceInfo && (
            <div className="nx-osm-searched-banner">
              <CheckCircle2 size={14} color="#16a34a" />
              <span>
                Origin: <strong>{searchedPlaceInfo.label}</strong> · Nearest Boutique:{' '}
                <strong>{searchedPlaceInfo.nearestStoreName}</strong> (~
                {searchedPlaceInfo.distanceKm} km)
              </span>
            </div>
          )}

          <div className={`nx-store-map-frame ${mapPickTarget ? 'is-picking-on-map' : ''}`}>
            <div
              ref={mapContainerRef}
              className="nx-osm-leaflet-container"
              style={{ height: '600px' }}
            />
          </div>

          <div className="nx-store-map-caption">
            <div>
              <strong>{activeStore.name}</strong>
              <span>
                {activeStore.street}, {activeStore.city} · {activeStore.hours}
              </span>
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${activeStore.lat}&mlon=${activeStore.lng}#map=16/${activeStore.lat}/${activeStore.lng}`}
              target="_blank"
              rel="noreferrer"
              className="nx-btn nx-btn-outline nx-btn-sm"
            >
              <span>Open Full Map</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

