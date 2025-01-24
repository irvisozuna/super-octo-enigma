// Prueba para el composable
import { describe, it, expect } from 'vitest';
import { useTemplateHelpers } from '../composables/useTemplateHelpers';

describe('Template Helpers', () => {
  it('debería formatear nombres correctamente', () => {
    const { formatTemplateName } = useTemplateHelpers();
    const result = formatTemplateName(' ejemplo ');
    expect(result).toBe('EJEMPLO');
  });

  it('debería devolver el Template por defecto', () => {
    const { getDefaultTemplate } = useTemplateHelpers();
    const result = getDefaultTemplate();
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
import TemplateAddDialog from '../components/TemplateAddDialog.vue';
import TemplateEditDialog from '../components/TemplateEditDialog.vue';
import TemplateTable from '../components/TemplateTable.vue';

describe('Template Components', () => {
  it('TemplateAddDialog debería renderizar correctamente', () => {
    const wrapper = mount(TemplateAddDialog);
    expect(wrapper.html()).toContain('Add Template');
  });

  it('TemplateEditDialog debería renderizar correctamente', () => {
    const wrapper = mount(TemplateEditDialog, {
      props: { user: { id: '1', name: 'Test User' } },
    });
    expect(wrapper.html()).toContain('Edit Template');
  });

  it('TemplateTable debería renderizar columnas correctamente', () => {
    const wrapper = mount(TemplateTable, {
      props: {
        headers: [{ title: 'Name', key: 'name' }],
        items: [{ id: '1', name: 'Test Item' }],
      },
    });
    expect(wrapper.html()).toContain('Name');
    expect(wrapper.html()).toContain('Test Item');
  });
});
