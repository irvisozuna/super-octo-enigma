export default {
  tableName: 'paymentmandates',
  schema: 'id', // Índices de la tabla
}

// Contract Registry configuration
export const contractRegistryConfig = {
  tableName: 'contractRegistry',
  schema: 'id, controlNumber, contractNumber, name, cardNumber, maxAmount, expirationDate, bank, accountType, registrationDate, chargeFrequency, phone, createdAt, updatedAt',
}
