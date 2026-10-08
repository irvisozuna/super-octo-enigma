<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RebillingItem } from '../../types/RebillingItem'
import { entero, fechaHora, moneda } from '@/utils/formato'

/* Refacturaciones de una lectura: valores anteriores y nuevos, quién la hizo y por qué. */
defineProps<{
  abierto: boolean
  datos: RebillingItem[]
}>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
}>()

const { t } = useI18n()
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="t('support.refacturacion.titulo')"
    tamano="md"
    variante="informativo"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <section
      v-for="(r, i) in datos"
      :key="r.rowid"
      class="refacturacion"
    >
      <h3 class="as-seccion">
        <span>{{ t('support.refacturacion.numero', { n: i + 1 }) }}</span>
        <VChip
          size="small"
          label
          variant="tonal"
          color="warning"
        >
          {{ r.type_log }}
        </VChip>
      </h3>
      <div class="refacturacion__columnas">
        <div>
          <div class="as-sobrelinea mb-2">
            {{ t('support.refacturacion.antes') }}
          </div>
          <dl class="as-datos refacturacion__datos">
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('support.refacturacion.consumo') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ entero(r.old_intake) }} m³
              </dd>
            </div>
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('support.refacturacion.lecturaAnterior') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ entero(r.old_past_intake) }}
              </dd>
            </div>
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('support.refacturacion.lecturaActual') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ entero(r.old_hydrometer) }}
              </dd>
            </div>
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('support.refacturacion.costo') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ moneda(r.old_cost) }}
              </dd>
            </div>
          </dl>
        </div>
        <div class="refacturacion__nuevo">
          <div class="as-sobrelinea text-success mb-2">
            {{ t('support.refacturacion.despues') }}
          </div>
          <dl class="as-datos refacturacion__datos">
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('support.refacturacion.consumo') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ entero(r.new_intake) }} m³
              </dd>
            </div>
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('support.refacturacion.lecturaAnterior') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ entero(r.new_past_intake) }}
              </dd>
            </div>
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('support.refacturacion.lecturaActual') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ entero(r.new_hydrometer) }}
              </dd>
            </div>
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('support.refacturacion.costo') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ moneda(r.new_cost) }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <dl class="as-datos mt-3 mb-0">
        <div class="as-dato">
          <dt class="as-etiqueta">
            {{ t('support.refacturacion.fecha') }}
          </dt>
          <dd class="as-valor as-num mb-0">
            {{ fechaHora(r.date_creation) }}
          </dd>
        </div>
        <div class="as-dato">
          <dt class="as-etiqueta">
            {{ t('support.refacturacion.creadoPor') }}
          </dt>
          <dd class="as-valor mb-0">
            {{ r.created_by_name || '—' }}
          </dd>
        </div>
        <div class="as-dato refacturacion__comentarios">
          <dt class="as-etiqueta">
            {{ t('support.refacturacion.comentarios') }}
          </dt>
          <dd class="as-valor mb-0">
            {{ r.comments || '—' }}
          </dd>
        </div>
      </dl>
    </section>
  </AsDialogo>
</template>

<style scoped>
.refacturacion + .refacturacion {
  border-block-start: var(--as-borde);
  margin-block-start: var(--as-sp-4);
  padding-block-start: var(--as-sp-2);
}

.refacturacion__columnas {
  display: grid;
  gap: var(--as-sp-4);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.refacturacion__nuevo {
  border-inline-start: 3px solid rgb(var(--v-theme-success));
  padding-inline-start: var(--as-sp-3);
}

.refacturacion__datos {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.refacturacion__comentarios {
  grid-column: 1 / -1;
}
</style>
