// Prueba para el composable
import { describe, it, expect } from 'vitest';
import { useSupportHelpers } from '../composables/useSupportHelpers';

describe('Support Helpers', () => {
  it('debería formatear nombres correctamente', () => {
    const { formatSupportName } = useSupportHelpers();
    const result = formatSupportName(' ejemplo ');
    expect(result).toBe('EJEMPLO');
  });

  it('debería devolver el Support por defecto', () => {
    const { getDefaultSupport } = useSupportHelpers();
    const result = getDefaultSupport();
    expect(result).toEqual({
      id: '',
      name: '',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
});

// Pruebas para los componentes
import { mount } from '@vue/test-utils';
import SupportAddDialog from '../components/SupportAddDialog.vue';
import SupportEditDialog from '../components/SupportEditDialog.vue';
import SupportTable from '../components/SupportTable.vue';

describe('Support Components', () => {
  it('SupportAddDialog debería renderizar correctamente', () => {
    const wrapper = mount(SupportAddDialog);
    expect(wrapper.html()).toContain('Add Support');
  });

  it('SupportEditDialog debería renderizar correctamente', () => {
    const wrapper = mount(SupportEditDialog, {
      props: { user: { id: '1', name: 'Test User' } },
    });
    expect(wrapper.html()).toContain('Edit Support');
  });

  it('SupportTable debería renderizar columnas correctamente', () => {
    const wrapper = mount(SupportTable, {
      props: {
        headers: [{ title: 'Name', key: 'name' }],
        items: [{ id: '1', name: 'Test Item' }],
      },
    });
    expect(wrapper.html()).toContain('Name');
    expect(wrapper.html()).toContain('Test Item');
  });
});
