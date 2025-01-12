export interface location {
  lat: number
  lng: number
}
export interface UserInfoType {
  firstName: string
  lastName: string
  contact: string | null
  profileImage: string | null
}

export interface CompanyInfoType {
  companyName: string;
  activity: string;
  address: string;
  location: location;
}

export interface PropertyListingData {
  userInfo: UserInfoType,
  companyInfo: CompanyInfoType
}


export interface User {
  id: string
  email: string
  firstName: string
  role: string
  avatar: string
  lastName: string
  username: string
  wizardStep: number
  roles: Role[]
}

export interface Role {
  id: string;
  name: string;
}

export interface WidgetData {
  title: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  change?: string;
  desc?: string;
}
export interface DialogOptions {
  component: any; // Componente que se mostrará en el diálogo
  props?: Record<string, any>; // Props que se pasarán al componente
  width?: string; // Ancho del diálogo (e.g., '700px')
  maxWidth?: string; // Ancho máximo
  fullscreen?: boolean; // Mostrar el diálogo en pantalla completa
  persistent?: boolean; // Evitar que el diálogo se cierre al hacer clic fuera
  scrollable?: boolean; // Permitir el desplazamiento dentro del diálogo
  hideOverlay?: boolean; // Ocultar el fondo gris detrás del diálogo
  position?: 'center' | 'top' | 'bottom'; // Posición del diálogo
  transition?: string; // Transición de entrada/salida
  closeOnEsc?: boolean; // Cerrar el diálogo al presionar ESC
  closeOnBackdropClick?: boolean; // Cerrar al hacer clic fuera
  actions?: { label: string; action: () => void; color?: string }[]; // Botones de acción en el diálogo
  theme?: 'light' | 'dark'; // Tema del diálogo
  resolve?: (result: 'submit' | 'cancel' | 'close') => void;
}



export interface DialogAction {
  label: string;
  color?: string;
  action: () => void;
}

export interface ApiOptions {
  method?: string
  params?: Record<string, any>
  body?: any
  headers?: Record<string, string>
  responseType?: 'json' | 'blob' | 'text'
}





export interface UserProfileMenuItem {
  type: 'divider' | 'navItem';
  icon?: string;
  title?: string;
  to?: { name: string; params?: Record<string, any> };
  badgeProps?: { color: string; content: string };
}
