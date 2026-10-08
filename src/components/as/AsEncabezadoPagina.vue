<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/*
 * Encabezado de página del sistema de diseño: título (h1), chips de contexto, descripción corta y acciones a la
 * derecha. Sustituye al bloque copiado en 18 vistas. Jerarquía: título 20 px semibold, descripción 13 px secundaria.
 */
defineProps<{
  titulo: string
  descripcion?: string
  icono?: string

  /** Enlace de regreso ("Todos los reportes"). */
  volver?: { texto: string; to: RouteLocationRaw }
}>()
</script>

<template>
  <header class="as-encabezado mb-4">
    <RouterLink
      v-if="volver"
      :to="volver.to"
      class="as-encabezado__volver text-caption text-decoration-none d-inline-flex align-center gap-1 mb-1"
    >
      <VIcon
        icon="tabler-arrow-left"
        size="14"
      />
      {{ volver.texto }}
    </RouterLink>
    <div class="d-flex flex-wrap align-start justify-space-between gap-x-4 gap-y-2">
      <div class="as-encabezado__principal">
        <div class="d-flex align-center flex-wrap gap-2">
          <VIcon
            v-if="icono"
            :icon="icono"
            size="22"
            class="text-medium-emphasis"
          />
          <h1 class="as-encabezado__titulo mb-0">
            {{ titulo }}
          </h1>
          <slot name="contexto" />
        </div>
        <p
          v-if="descripcion"
          class="as-encabezado__descripcion text-body-2 text-medium-emphasis mb-0 mt-1"
        >
          {{ descripcion }}
        </p>
        <slot />
      </div>
      <div
        v-if="$slots.acciones"
        class="as-encabezado__acciones d-flex flex-wrap align-center gap-2"
      >
        <slot name="acciones" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.as-encabezado__principal {
  min-inline-size: 0;
}

.as-encabezado__titulo {
  font-size: var(--as-fs-xl);
  font-weight: var(--as-peso-semi);
  letter-spacing: -0.005em;
  line-height: 1.4;
}

.as-encabezado__descripcion {
  max-inline-size: 90ch;
}

.as-encabezado__volver {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  transition: color var(--as-dur-rapida) var(--as-ease);
}

.as-encabezado__volver:hover {
  color: rgb(var(--v-theme-primary));
}
</style>
