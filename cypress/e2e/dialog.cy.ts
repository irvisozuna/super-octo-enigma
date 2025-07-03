describe('Dialog Functionality', () => {
  it('should open and close dialog', () => {
    cy.visit('/')
    cy.get('[data-test="open-dialog"]').click()
    cy.get('.dialog').should('be.visible')
    cy.get('[data-test="close-dialog"]').click()
    cy.get('.dialog').should('not.exist')
  })
})
