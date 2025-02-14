// Prueba para el composable
import { describe, it, expect } from 'vitest';
import { useUserHelpers } from '../composables/useUserHelpers';

describe('User Helpers', () => {
  it('debería formatear nombres correctamente', () => {
    const { formatUserName } = useUserHelpers();
    const result = formatUserName(' ejemplo ');
    expect(result).toBe('EJEMPLO');
  });

  it('debería devolver el User por defecto', () => {
    const { getDefaultUser } = useUserHelpers();
    const result = getDefaultUser();
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
import UserAddDialog from '../components/UserAddDialog.vue';
import UserEditDialog from '../components/UserEditDialog.vue';
import UserTable from '../components/UserTable.vue';

describe('User Components', () => {
  it('UserAddDialog debería renderizar correctamente', () => {
    const wrapper = mount(UserAddDialog);
    expect(wrapper.html()).toContain('Add User');
  });

  it('UserEditDialog debería renderizar correctamente', () => {
    const wrapper = mount(UserEditDialog, {
      props: { user: { id: '1', name: 'Test User' } },
    });
    expect(wrapper.html()).toContain('Edit User');
  });

  it('UserTable debería renderizar columnas correctamente', () => {
    const wrapper = mount(UserTable, {
      props: {
        headers: [{ title: 'Name', key: 'name' }],
        items: [{ id: '1', name: 'Test Item' }],
      },
    });
    expect(wrapper.html()).toContain('Name');
    expect(wrapper.html()).toContain('Test Item');
  });
});
