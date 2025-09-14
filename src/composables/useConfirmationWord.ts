import { ref } from 'vue'

export function useConfirmationWord() {
  const confirmationWord = ref('')
  const userInput = ref('')
  const isWordValid = ref(false)

  // Palabras de confirmación disponibles
  const confirmationWords = [
    'ELIMINAR',
    'BORRAR',
    'CONFIRMAR',
    'CONTINUAR',
    'PROCEDER',
    'EJECUTAR',
    'FINALIZAR',
    'COMPLETAR',
  ]

  // Generar una palabra aleatoria
  function generateRandomWord() {
    const randomIndex = Math.floor(Math.random() * confirmationWords.length)

    confirmationWord.value = confirmationWords[randomIndex]

    // Limpiar el input del usuario y resetear validación
    userInput.value = ''
    isWordValid.value = false

    // Debug logs
    console.log('=== NEW WORD GENERATED ===')
    console.log('New confirmation word:', `"${confirmationWord.value}"`)
    console.log('User input cleared:', `"${userInput.value}"`)
    console.log('Is valid reset:', isWordValid.value)
    console.log('==========================')

    return confirmationWord.value
  }

  // Validar la palabra ingresada por el usuario
  function validateWord(input: string) {
    userInput.value = input.toUpperCase().trim()
    isWordValid.value = userInput.value === confirmationWord.value

    // Debug logs
    console.log('=== VALIDATION DEBUG ===')
    console.log('User input:', `"${userInput.value}"`)
    console.log('Confirmation word:', `"${confirmationWord.value}"`)
    console.log('Are equal:', userInput.value === confirmationWord.value)
    console.log('Is valid:', isWordValid.value)
    console.log('========================')

    return isWordValid.value
  }

  // Resetear el estado
  function reset() {
    confirmationWord.value = ''
    userInput.value = ''
    isWordValid.value = false
  }

  // Limpiar solo el input del usuario (mantener la palabra generada)
  function clearUserInput() {
    userInput.value = ''
    isWordValid.value = false
  }

  return {
    confirmationWord,
    userInput,
    isWordValid,
    generateRandomWord,
    validateWord,
    reset,
    clearUserInput,
  }
}
