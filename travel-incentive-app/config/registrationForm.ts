import { RegistrationFormConfig, ConditionalFormField } from '../types';

export const registrationFormConfig: RegistrationFormConfig = [
    {
      id: 'participantData',
      title: 'Dati Partecipante',
      fields: [
        { id: 'companyName', name: 'companyName', label: 'Ragione Sociale', type: 'text', required: true },
        { id: 'firstName', name: 'firstName', label: 'Nome', type: 'text', required: true },
        { id: 'lastName', name: 'lastName', label: 'Cognome', type: 'text', required: true },
        { id: 'birthDate', name: 'birthDate', label: 'Data di Nascita', type: 'date', required: true },
        { id: 'nationality', name: 'nationality', label: 'Nazionalità', type: 'text', required: true },
        { id: 'mobilePhone', name: 'mobilePhone', label: 'N. Tel. Cellulare', type: 'tel', required: true },
        { id: 'email', name: 'email', label: 'E-mail', type: 'email', required: true },
        {
          id: 'passportInRenewal',
          name: 'passportInRenewal',
          label: '',
          type: 'checkbox',
          checkboxLabel: 'Passaporto in fase di rinnovo',
          required: false,
        },
        {
          id: 'passportNumber',
          name: 'passportNumber',
          label: 'N. Passaporto',
          type: 'text',
          required: true,
        },
        { id: 'passportIssueDate', name: 'passportIssueDate', label: 'Data di Emissione (Passaporto)', type: 'date', required: true },
        { 
          id: 'passportExpiryDate', 
          name: 'passportExpiryDate', 
          label: 'Data di Scadenza (Passaporto)', 
          type: 'date', 
          required: true,
        },
        { 
          id: 'foodRequirements', 
          name: 'foodRequirements', 
          label: 'Esigenze Alimentari', 
          type: 'text', 
          required: false,
          note: 'Es. eventuali allergie, dieta vegetariana, vegana, gluten free ecc'
        },
      ]
    },
    {
      id: 'logistics',
      title: 'Logistica',
      fields: [
        {
          id: 'roomType',
          name: 'roomType',
          label: 'Tipologia Camera',
          type: 'select',
          required: true,
          options: []
        },
        {
          id: 'departureAirport',
          name: 'departureAirport',
          label: "Selezionare l'Aeroporto di Partenza",
          type: 'select',
          required: true,
          options: ['Milano Malpensa', 'Roma Fiumicino', 'Venezia'],
          note: "I voli diretti sono previsti da Milano e Roma. La partenza da Venezia potrebbe comportare uno scalo e un supplemento di costo."
        },
        {
          id: 'businessClass',
          name: 'businessClass',
          label: 'Indicare se si desidera viaggiare in Business',
          type: 'select',
          required: true,
          options: ['Sì (con supplemento)', 'No']
        }
      ]
    },
    {
      id: 'companion',
      title: 'Accompagnatore (Opzionale)',
      fields: [
        {
          id: 'hasCompanion',
          name: 'hasCompanion',
          label: 'Selezionare per inserire i dati dell\'accompagnatore.',
          type: 'checkbox',
          checkboxLabel: 'Sì, verrò accompagnato/a.',
          controlsFields: [
            { id: 'companionFirstName', name: 'companionFirstName', label: 'Nome Accompagnatore', type: 'text', required: true },
            { id: 'companionLastName', name: 'companionLastName', label: 'Cognome Accompagnatore', type: 'text', required: true },
            { id: 'companionBirthDate', name: 'companionBirthDate', label: 'Data di Nascita Accompagnatore', type: 'date', required: true },
            { id: 'companionNationality', name: 'companionNationality', label: 'Nazionalità Accompagnatore', type: 'text', required: true },
            {
              id: 'companionPassportInRenewal',
              name: 'companionPassportInRenewal',
              label: '',
              type: 'checkbox',
              checkboxLabel: 'Passaporto in fase di rinnovo',
              required: false,
            },
            {
              id: 'companionPassportNumber',
              name: 'companionPassportNumber',
              label: 'N. Passaporto Accompagnatore',
              type: 'text',
              required: true,
            },
            { id: 'companionPassportIssueDate', name: 'companionPassportIssueDate', label: 'Data di Emissione (Passaporto) Accompagnatore', type: 'date', required: true },
            { 
              id: 'companionPassportExpiryDate', 
              name: 'companionPassportExpiryDate', 
              label: 'Data di Scadenza (Passaporto) Accompagnatore', 
              type: 'date', 
              required: true,
            },
            { 
              id: 'companionFoodRequirements', 
              name: 'companionFoodRequirements', 
              label: 'Esigenze Alimentari Accompagnatore', 
              type: 'text', 
              required: false,
              note: 'Es. eventuali allergie, dieta vegetariana, vegana, gluten free ecc'
            },
            {
              id: 'companionMeeting',
              name: 'companionMeeting',
              label: 'Meeting Beverage Network (per Accompagnatore)',
              type: 'radio',
              required: true,
              options: ['Sì, partecipo', 'No, non partecipo'],
              note: 'Campo richiesto solo per l\'eventuale accompagnatore'
            }
          ]
        } as ConditionalFormField
      ]
    },
    {
      id: 'consents',
      title: 'Consensi',
      fields: [
        {
          id: 'dataProcessingConsent',
          name: 'dataProcessingConsent',
          label: 'Consenso Trattamento Dati Personali (Partecipante)',
          type: 'radio',
          required: true,
          options: ['Acconsento', 'Non Acconsento'],
          note: 'Per procedere, è necessario prendere visione dell\'[Informativa sulla Privacy](privacy).'
        },
        {
          id: 'consentCompanion',
          name: 'dataProcessingConsentCompanion',
          label: 'Consenso Trattamento Dati Personali (Accompagnatore)',
          type: 'radio',
          required: false,
          options: ['Acconsento', 'Non Acconsento'],
          note: 'Per procedere, è necessario prendere visione dell\'[Informativa sulla Privacy](privacy).'
        },
        {
          id: 'penaltiesAcknowledgement',
          name: 'penaltiesAcknowledgement',
          label: 'Presa Visione di Penali, Rimborsi e Assicurazioni',
          type: 'radio',
          required: true,
          options: ['Sì', 'No'],
          note: 'Per procedere, è necessario prendere visione dei [Termini e Condizioni](terms).'
        }
      ]
    },
    {
      id: 'billing',
      title: 'Fatturazione',
      fields: [
        { id: 'billingName', name: 'billingName', label: 'Intestatario Fattura', type: 'text', required: true },
        { id: 'billingAddress', name: 'billingAddress', label: 'Indirizzo di Fatturazione', type: 'text', required: true },
        { id: 'billingVat', name: 'billingVat', label: 'Partita IVA', type: 'text', required: true },
        { id: 'billingSdi', name: 'billingSdi', label: 'Codice SDI', type: 'text', required: true },
      ]
    }
];