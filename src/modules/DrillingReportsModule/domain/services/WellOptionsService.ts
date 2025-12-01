import { WELL_DIAMETER_OPTIONS, WELL_STATUS, WELL_TYPES } from '../../shared/constants/WellConstants'

/**
 * Servicio de dominio para opciones de pozos
 * Encapsula la lógica de negocio para obtener opciones de formularios
 */
export class WellOptionsService {
  /**
   * Obtiene las opciones de estado de pozo para formularios
   */
  static getStatusOptions() {
    return WELL_STATUS.map(status => ({
      title: status.label,
      value: status.value,
    }))
  }

  /**
   * Obtiene las opciones de tipo de perforación para formularios
   */
  static getDrillingTypeOptions() {
    return WELL_TYPES.map(type => ({
      title: type.label,
      value: type.value,
    }))
  }

  /**
   * Obtiene las opciones de diámetro de pozo para formularios
   */
  static getHoleDiameterOptions() {
    return WELL_DIAMETER_OPTIONS.map(option => ({
      title: option.label,
      value: option.code,
    }))
  }

  /**
   * Obtiene todas las opciones de pozo para formularios
   */
  static getAllOptions() {
    return {
      status: this.getStatusOptions(),
      drillingTypes: this.getDrillingTypeOptions(),
      holeDiameter: this.getHoleDiameterOptions(),
    }
  }
}
