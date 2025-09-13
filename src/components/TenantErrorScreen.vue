<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTenantStore } from '@/stores/tenant.store'
import { tenantBootstrapService } from '@/services/tenantBootstrapService'

const tenantStore = useTenantStore()
const isRetrying = ref(false)

const currentHost = computed(() => window.location.hostname)
const isDevelopment = computed(() => import.meta.env.DEV)

async function retryBootstrap() {
  isRetrying.value = true
  try {
    await tenantBootstrapService.forceRefresh()
  }
  catch (error) {
    console.error('Retry failed:', error)
  }
  finally {
    isRetrying.value = false
  }
}

function goToHome() {
  // Redirigir a la página principal del dominio por defecto
  window.location.href = '/'
}

function contactSupport() {
  // Abrir cliente de email o redirigir a página de soporte
  const subject = encodeURIComponent(`Error de dominio: ${currentHost.value}`)

  const body = encodeURIComponent(`
Hola,

Estoy experimentando un error al acceder a la aplicación desde el dominio: ${currentHost.value}

Error: ${tenantStore.error || 'Dominio no reconocido'}

Por favor, ayúdenme a resolver este problema.

Gracias.
  `)

  window.location.href = `mailto:support@aquasoft.com?subject=${subject}&body=${body}`
}
</script>

<template>
  <div
    id="tenant-error-screen"
    class="tenant-error"
  >
    <div class="tenant-error-content">
      <!-- Icono de error -->
      <div class="error-icon">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="2"
          />
          <line
            x1="15"
            y1="9"
            x2="9"
            y2="15"
            stroke="currentColor"
            stroke-width="2"
          />
          <line
            x1="9"
            y1="9"
            x2="15"
            y2="15"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
      </div>

      <!-- Título del error -->
      <h1 class="error-title">
        Dominio no reconocido
      </h1>

      <!-- Mensaje del error -->
      <div class="error-message">
        <p>No se encontró una compañía asociada a este dominio.</p>
        <p
          v-if="currentHost"
          class="error-details"
        >
          Dominio: <code>{{ currentHost }}</code>
        </p>
      </div>

      <!-- Detalles técnicos (solo en desarrollo) -->
      <div
        v-if="isDevelopment && tenantStore.error"
        class="error-technical"
      >
        <details>
          <summary>Detalles técnicos</summary>
          <pre>{{ tenantStore.error }}</pre>
        </details>
      </div>

      <!-- Acciones -->
      <div class="error-actions">
        <button
          class="btn-retry"
          :disabled="isRetrying"
          @click="retryBootstrap"
        >
          <span v-if="isRetrying">Reintentando...</span>
          <span v-else>Reintentar</span>
        </button>

        <button
          class="btn-home"
          @click="goToHome"
        >
          Ir al inicio
        </button>

        <button
          class="btn-support"
          @click="contactSupport"
        >
          Contactar soporte
        </button>
      </div>

      <!-- Información de contacto -->
      <div class="contact-info">
        <p>Si crees que esto es un error, contacta al soporte técnico.</p>
        <p class="support-email">
          Email: <a href="mailto:support@aquasoft.com">support@aquasoft.com</a>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tenant-error {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  block-size: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  inline-size: 100%;
  inset-block-start: 0;
  inset-inline-start: 0;
}

.tenant-error-content {
  padding: 3rem;
  border-radius: 12px;
  background: white;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 10%);
  inline-size: 90%;
  max-inline-size: 500px;
  text-align: center;
}

.error-icon {
  color: #e74c3c;
  margin-block-end: 1.5rem;
}

.error-title {
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 700;
  margin-block-end: 1rem;
}

.error-message {
  color: #7f8c8d;
  line-height: 1.6;
  margin-block-end: 2rem;
}

.error-details {
  font-size: 0.9rem;
  margin-block-start: 0.5rem;
}

.error-details code {
  border-radius: 4px;
  background: #f8f9fa;
  color: #e74c3c;
  font-family: Monaco, Menlo, monospace;
  padding-block: 0.2rem;
  padding-inline: 0.4rem;
}

.error-technical {
  margin-block: 2rem;
  margin-inline: 0;
  text-align: start;
}

.error-technical details {
  cursor: pointer;
}

.error-technical summary {
  color: #34495e;
  font-weight: 600;
  margin-block-end: 0.5rem;
}

.error-technical pre {
  padding: 1rem;
  border-radius: 6px;
  background: #f8f9fa;
  color: #2c3e50;
  font-size: 0.8rem;
  overflow-x: auto;
  white-space: pre-wrap;
}

.error-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-block-end: 2rem;
}

.btn-retry,
.btn-home,
.btn-support {
  display: inline-block;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  padding-block: 0.75rem;
  padding-inline: 1.5rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-retry {
  background: #3498db;
  color: white;
}

.btn-retry:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-retry:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-home {
  background: #2ecc71;
  color: white;
}

.btn-home:hover {
  background: #27ae60;
  transform: translateY(-1px);
}

.btn-support {
  background: #f39c12;
  color: white;
}

.btn-support:hover {
  background: #e67e22;
  transform: translateY(-1px);
}

.contact-info {
  border-block-start: 1px solid #ecf0f1;
  color: #7f8c8d;
  font-size: 0.9rem;
  padding-block-start: 1.5rem;
}

.support-email a {
  color: #3498db;
  text-decoration: none;
}

.support-email a:hover {
  text-decoration: underline;
}

/* Modo oscuro */
.dark .tenant-error-content {
  background: #2c3e50;
  color: #ecf0f1;
}

.dark .error-title {
  color: #ecf0f1;
}

.dark .error-message {
  color: #bdc3c7;
}

.dark .error-details code {
  background: #34495e;
  color: #e74c3c;
}

.dark .error-technical pre {
  background: #34495e;
  color: #ecf0f1;
}

.dark .contact-info {
  border-block-start-color: #34495e;
}

/* Responsive */
@media (max-width: 600px) {
  .tenant-error-content {
    padding-block: 2rem;
    padding-inline: 1.5rem;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .btn-retry,
  .btn-home,
  .btn-support {
    inline-size: 100%;
    max-inline-size: 200px;
  }
}
</style>
