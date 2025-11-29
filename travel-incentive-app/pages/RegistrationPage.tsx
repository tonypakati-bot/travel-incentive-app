import React, { useState, useCallback, useEffect } from 'react';
import { RegistrationFormConfig, FormField, ConditionalFormField, FormSectionConfig, Profile } from '../types';
import { getLegalDocuments } from '../services/documentService';
import { useAuthContext } from '../contexts/AuthContext';
import { AuthHook } from '../hooks/useAuth';

interface RegistrationPageProps {
  formConfig: RegistrationFormConfig;
  onFormSubmit: (data: {[key: string]: any}) => void;
  deadline?: string;
  existingData: {[key: string]: any} | null;
  isSubmitted: boolean;
  isEditing?: boolean;
  onEdit: () => void;
  tripData: any; // TripData
}

// --- Validation Error Modal Component ---
interface ValidationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: string[];
}
const ValidationErrorModal: React.FC<ValidationErrorModalProps> = ({ isOpen, onClose, fields }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="validation-error-title">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
          <h2 id="validation-error-title" className="text-xl font-bold text-gray-800">Campi Obbligatori Mancanti</h2>
          <p className="text-gray-600 mt-2 mb-4">Per procedere, è necessario compilare i seguenti campi:</p>
          <ul className="text-left bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto border border-gray-200">
            {fields.map((field, index) => (
              <li key={index} className="text-sm text-gray-700 font-medium py-1 list-disc list-inside">{field}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 bg-gray-50 border-t rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors duration-200"
          >
            Ho Capito
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Modal Component ---
interface DocModalProps {
  isOpen: boolean;
  onClose: (confirmed: boolean) => void;
  title: string;
  content: string;
}
const DocModal: React.FC<DocModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => onClose(false)} role="dialog" aria-modal="true" aria-labelledby="doc-title">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 id="doc-title" className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={() => onClose(false)} className="text-gray-500 hover:text-gray-800" aria-label="Chiudi">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto" dangerouslySetInnerHTML={{ __html: content }} />
        <div className="p-4 bg-gray-50 border-t rounded-b-xl">
          <button
            onClick={() => onClose(true)}
            className="w-full bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors duration-200"
          >
            Ho Capito
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Reusable Field Components ---

type InputFieldProps = {
  label: React.ReactNode; id: string; name: string; type?: string; required?: boolean; note?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
};
const InputField: React.FC<InputFieldProps> = ({ label, id, name, type = 'text', required = false, note, value, onChange, error, disabled = false }) => (
  <div className="animate-fade-in-up">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <input type={type} id={id} name={name} value={value || ''} onChange={onChange} disabled={disabled}
      className={`mt-1 block w-full px-3 py-2 bg-white border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-900 ${disabled ? 'bg-gray-100 disabled:text-gray-500 cursor-not-allowed' : ''}`}
      style={type === 'date' ? { colorScheme: 'light' } : undefined} />
    {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

type SelectFieldProps = {
  label: React.ReactNode; id: string; name: string; required?: boolean; options: string[]; note?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};
const SelectField: React.FC<SelectFieldProps> = ({ label, id, name, required = false, options, note, value, onChange }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative mt-1">
      <select id={id} name={name} value={value || ''} onChange={onChange}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm appearance-none text-gray-900">
        <option value="">Seleziona un'opzione</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <span className="material-symbols-outlined">expand_more</span>
      </div>
    </div>
    {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
  </div>
);

type CheckboxFieldProps = {
  label: React.ReactNode; id: string; name: string; required?: boolean; checkboxLabel: React.ReactNode;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};
const CheckboxField: React.FC<CheckboxFieldProps> = ({ label, id, name, required = false, checkboxLabel, checked, onChange }) => (
  <div>
    {label && <div className="block text-sm font-medium text-gray-700">{label}</div>}
    <div className={label ? "mt-2" : ""}>
      <div className="flex items-start">
        <input id={id} name={name} type="checkbox" checked={checked} onChange={onChange}
          className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 mt-0.5" />
        <label htmlFor={id} className="ml-3 block text-sm text-gray-900 leading-snug">{checkboxLabel}</label>
      </div>
    </div>
  </div>
);

type RadioGroupFieldProps = {
  label: React.ReactNode; name: string; required?: boolean; options: string[]; note?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};
const RadioGroupField: React.FC<RadioGroupFieldProps> = ({ label, name, required = false, options, note, value, onChange, disabled = false }) => (
  <div>
    <div>
      <div className={`block text-sm font-medium ${disabled ? 'text-gray-500' : 'text-gray-700'}`}>{label}</div>
    </div>

    {note && <div className={`mt-1 text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>{note}</div>}

    <div className="mt-2 flex items-center space-x-6">
      {options.map(option => (
        <div key={option} className="flex items-center">
          <input id={`${name}-${option.replace(/\s/g, '')}`} name={name} type="radio" value={option}
            checked={value === option} onChange={onChange}
            className="h-4 w-4 border-gray-300 text-sky-600 focus:ring-sky-500" disabled={disabled} />
          <label htmlFor={`${name}-${option.replace(/\s/g, '')}`} className={`ml-2 block text-sm ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>{option}</label>
        </div>
      ))}
    </div>
  </div>
);

// --- Helper Functions ---

const initializeState = (config: RegistrationFormConfig, existingData: {[key: string]: any} | null, user: Profile | null): { [key: string]: any } => {
  if (existingData) {
    // Extract form data from the nested structure if it exists
    const formData = existingData.form_data || existingData;
    return { ...formData };
  }
  const state: { [key: string]: any } = {};
  config.forEach(section => {
    section.fields.forEach(field => {
      // Pre-populate user data if available
      if (user && (field.name === 'firstName' || field.name === 'lastName' || field.name === 'email' || field.name === 'mobilePhone')) {
        state[field.name] = user[field.name] || '';
      } else {
        state[field.name] = field.type === 'checkbox' ? false : '';
      }
      if ('controlsFields' in field) {
        (field as ConditionalFormField).controlsFields.forEach(subField => {
          state[subField.name] = subField.type === 'checkbox' ? false : '';
        });
      }
    });
  });
  return state;
};

const isPassportDateValid = (dateString: string): boolean => {
    if (!dateString) return true; // Not required validation's job.

    const expiryDate = new Date(dateString);
    if (isNaN(expiryDate.getTime())) return true; // Invalid date format
    
    // Set hours to 0 to compare dates only
    expiryDate.setHours(0, 0, 0, 0);

    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setHours(0, 0, 0, 0);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    
    return expiryDate >= sixMonthsFromNow;
};

// --- Summary View Component ---
const SummaryView: React.FC<{ data: {[key: string]: any}; onEdit: () => void; formConfig: RegistrationFormConfig }> = ({ data, onEdit, formConfig }) => {
    const getFieldLabel = (fieldName: string) => {
        for (const section of formConfig) {
            for (const field of section.fields) {
                if (field.name === fieldName) return field.label;
                if ('controlsFields' in field) {
                    const subField = (field as ConditionalFormField).controlsFields.find(sf => sf.name === fieldName);
                    if (subField) return subField.label;
                }
            }
        }
        return fieldName;
    };

    const formatValue = (value: any) => {
        if (typeof value === 'boolean') {
            return value ? 'Sì' : 'No';
        }
        if (value instanceof Date) {
            return value.toLocaleDateString('it-IT');
        }
        return value || '-';
    };
    
    const renderSection = (section: FormSectionConfig) => {
        const fieldsToRender = section.fields.flatMap(field => {
            if (field.name === 'hasCompanion') {
                const companionFields = data.form_data?.hasCompanion ? (field as ConditionalFormField).controlsFields : [];
                return [field, ...companionFields];
            }
            return [field];
        }).filter(field => {
            // Access data from the nested form_data structure
            const fieldValue = data.form_data ? data.form_data[field.name] : data[field.name];
            return fieldValue !== '' && fieldValue !== false && fieldValue !== null && fieldValue !== undefined;
        });

        if (fieldsToRender.length === 0) return null;

        return (
            <div key={section.id} className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-[#1A2C47] mb-4 border-b pb-3">{section.title}</h2>
                <div className="space-y-3">
                    {fieldsToRender.map(field => (
                        <div key={field.id} className="text-sm">
                            <span className="font-medium text-gray-600">{getFieldLabel(field.name) || field.checkboxLabel}:</span>
                            <span className="ml-2 text-gray-900">{formatValue(data.form_data ? data.form_data[field.name] : data[field.name])}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="max-w-xl mx-auto">
                <div className="mb-6 text-center">
                    <span className="material-symbols-outlined text-6xl text-green-500 mb-2">task_alt</span>
                    <h1 className="text-3xl font-bold text-gray-800">Registrazione Inviata</h1>
                    <p className="text-gray-600 mt-1">Grazie! Ecco un riepilogo dei dati che hai fornito.</p>
                </div>
                {formConfig.map(renderSection)}
                <div className="mt-6">
                    <button onClick={onEdit} className="w-full bg-gray-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors duration-200 flex items-center justify-center">
                        <span className="material-symbols-outlined mr-2">edit</span>
                        Modifica Dati
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---
const RegistrationPage: React.FC<RegistrationPageProps> = ({ formConfig, onFormSubmit, deadline, existingData, isSubmitted, isEditing, onEdit, tripData }) => {
  const auth = useAuthContext() as AuthHook;
  const { user } = auth;

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});

  const filteredFormConfig = React.useMemo(() => {
    return formConfig.map(section => {
      if (section.id === 'logistics') {
        const fields = section.fields.filter(field => {
          if (field.id === 'businessClass' && tripData?.eventDetails?.allowBusiness !== true) return false;
          if (field.id === 'departureAirport' && (!tripData?.eventDetails?.departureGroup || tripData.eventDetails.departureGroup.length === 0)) return false;
          if (field.id === 'roomType' && (!tripData?.eventDetails?.roomType || tripData.eventDetails.roomType.length === 0)) return false;
          return true;
        }).map(field => {
          if (field.id === 'departureAirport' && tripData?.eventDetails?.departureGroup) {
            return { ...field, options: tripData.eventDetails.departureGroup };
          }
          if (field.id === 'roomType') {
            return { ...field, label: "Tipologia Camera", options: tripData.eventDetails.roomType };
          }
          return field;
        });
        if (fields.length === 0) return null;
        return { ...section, fields };
      }
      if (section.id === 'companion' && tripData?.eventDetails?.allowCompanion !== true) {
        return null;
      }
      return section;
    }).filter(Boolean) as RegistrationFormConfig;
  }, [formConfig, tripData]);

  useEffect(() => {
    const initial = initializeState(filteredFormConfig, existingData, user);
    setFormData(initial);
  }, [filteredFormConfig, existingData, user]);

  const initialState = initializeState(filteredFormConfig, existingData, user);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [docModalContent, setDocModalContent] = useState<{title: string, content: string} | null>(null);
  const [currentOpenDoc, setCurrentOpenDoc] = useState<string | null>(null);
  const [hasViewedPrivacy, setHasViewedPrivacy] = useState(false);
  const [hasViewedTerms, setHasViewedTerms] = useState(false);
  const [validationErrorModalOpen, setValidationErrorModalOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const [legalDocs, setLegalDocs] = useState<{ privacyPolicy: {title: string, content: string}, termsAndConditions: {title: string, content: string} } | null>(null);
  console.log('Auth context:', auth);
  console.log('User from auth:', user);
  console.log('Form config:', formConfig);
  
  // Effect to initialize form data from user profile
  useEffect(() => {
    if (user || existingData) {
      const initialState = initializeState(formConfig, existingData, user);
      setFormData(prev => ({
        ...prev,
        ...initialState
      }));
    }
  }, [existingData, formConfig, user]);

  // Effect to fetch legal documents
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await getLegalDocuments();
        setLegalDocs(docs);
      } catch (error) {
        console.error('Error fetching legal documents:', error);
      }
    };

    if (!legalDocs) {
      fetchDocs();
    }
  }, [legalDocs]);

  useEffect(() => {
    // If we are in edit mode (existingData is present),
    // consider the documents as "viewed" to enable the consent fields immediately.
    if (existingData) {
      setHasViewedPrivacy(true);
      setHasViewedTerms(true);
    }
  }, [existingData]);


  const openDocModal = (docId: string) => {
    setCurrentOpenDoc(docId);
    if (docId === 'privacy' && legalDocs) {
        setDocModalContent(legalDocs.privacyPolicy);
    } else if (docId === 'terms' && legalDocs) {
        setDocModalContent(legalDocs.termsAndConditions);
    }
  };

  const closeDocModal = (confirmed: boolean) => {
    if (confirmed) {
      if (currentOpenDoc === 'privacy') {
          setHasViewedPrivacy(true);
      } else if (currentOpenDoc === 'terms') {
          setHasViewedTerms(true);
      }
    }
    setDocModalContent(null);
    setCurrentOpenDoc(null);
  };

  const parseLabelWithLinks = (label: string) => {
    const parts = label.split(/(\[.*?\]\(.*?\)|(?:\*\*.*?\*\*))/g);
    return (
      <>
        {parts.map((part, index) => {
          if (!part) return null;
          
          const linkMatch = /\[(.*?)\]\((.*?)\)/.exec(part);
          if (linkMatch) {
            const [, text, docId] = linkMatch;
            return <button key={index} type="button" onClick={() => openDocModal(docId)} className="text-sky-600 underline hover:text-sky-800 font-medium">{text}</button>;
          }
          
          const boldMatch = /\*\*(.*?)\*\*/.exec(part);
          if (boldMatch) {
            const [, text] = boldMatch;
            return <strong key={index} className="font-semibold text-gray-900 text-base">{text}</strong>;
          }

          return part;
        })}
      </>
    );
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    const updatedValue = isCheckbox ? checked : value;

    setFormData(prev => {
      const newState = {
        ...prev,
        [name]: updatedValue
      };

      // If checking "passportInRenewal", clear related fields and errors
      if (name === 'passportInRenewal' && checked) {
        newState.passportNumber = '';
        newState.passportIssueDate = '';
        newState.passportExpiryDate = '';
      }
      if (name === 'companionPassportInRenewal' && checked) {
        newState.companionPassportNumber = '';
        newState.companionPassportIssueDate = '';
        newState.companionPassportExpiryDate = '';
      }

      // If unchecking "hasCompanion", clear related fields
      if (name === 'hasCompanion' && !checked) {
        const companionSection = formConfig.find(s => s.id === 'companion');
        const companionField = companionSection?.fields.find(f => f.id === 'hasCompanion') as ConditionalFormField | undefined;
        if (companionField?.controlsFields) {
          companionField.controlsFields.forEach(subField => {
            newState[subField.name] = subField.type === 'checkbox' ? false : '';
          });
        }
        newState['dataProcessingConsentCompanion'] = ''; 
      }
      return newState;
    });
    
    const tempUpdatedState = { ...formData, [name]: updatedValue };
    const passportExpiryError = 'La data di scadenza del passaporto deve essere almeno 6 mesi da oggi.';

    setFormErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        
        // When a renewal checkbox is toggled, clear potential errors
        if (name === 'passportInRenewal') delete newErrors.passportExpiryDate;
        if (name === 'companionPassportInRenewal') delete newErrors.companionPassportExpiryDate;

        const updateError = (fieldName: string, condition: boolean, errorMessage: string) => {
            if (condition) {
                newErrors[fieldName] = errorMessage;
            } else {
                delete newErrors[fieldName];
            }
        };

        if (name === 'passportExpiryDate' || name === 'passportInRenewal') {
            updateError(
                'passportExpiryDate', 
                !tempUpdatedState.passportInRenewal && !!tempUpdatedState.passportExpiryDate && !isPassportDateValid(tempUpdatedState.passportExpiryDate),
                passportExpiryError
            );
        } else if (name === 'companionPassportExpiryDate' || name === 'companionPassportInRenewal' || name === 'hasCompanion') {
             updateError(
                'companionPassportExpiryDate', 
                !!tempUpdatedState.hasCompanion && !tempUpdatedState.companionPassportInRenewal && !!tempUpdatedState.companionPassportExpiryDate && !isPassportDateValid(tempUpdatedState.companionPassportExpiryDate),
                passportExpiryError
            );
        } else if (name === 'hasCompanion' && !checked) {
            delete newErrors.companionPassportExpiryDate;
        } else {
            delete newErrors[name];
        }
        
        return newErrors;
    });
  }, [formConfig, formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const missingFieldsList: string[] = [];
    const addMissingField = (label?: string, checkboxLabel?: string) => {
        let fieldLabel = label || checkboxLabel || '';
        if (fieldLabel && !missingFieldsList.includes(fieldLabel)) {
            missingFieldsList.push(fieldLabel);
        }
    };

    formConfig.forEach(section => {
        section.fields.forEach(field => {
            const isMissing = !formData[field.name];

            if (field.required && isMissing) {
                const participantPassportFields = ['passportNumber', 'passportIssueDate', 'passportExpiryDate'];
                if (formData.passportInRenewal && participantPassportFields.includes(field.name)) {
                  // Don't add to missing list if passport is in renewal
                } else {
                  addMissingField(field.label, field.checkboxLabel);
                }
            }

            if (field.name === 'hasCompanion' && formData.hasCompanion) {
                (field as ConditionalFormField).controlsFields.forEach(subField => {
                    if (subField.required && !formData[subField.name]) {
                        const companionPassportFields = ['companionPassportNumber', 'companionPassportIssueDate', 'companionPassportExpiryDate'];
                         if (formData.companionPassportInRenewal && companionPassportFields.includes(subField.name)) {
                           // Don't add to missing list if passport is in renewal
                         } else {
                           addMissingField(subField.label, subField.checkboxLabel);
                         }
                    }
                });
            }

            if (field.name === 'dataProcessingConsentCompanion' && formData.hasCompanion && !formData.dataProcessingConsentCompanion) {
                addMissingField(field.label);
            }
        });
    });
    
    if (missingFieldsList.length > 0) {
        setMissingFields(missingFieldsList);
        setValidationErrorModalOpen(true);
        setFormErrors({});
        return;
    }
    
    const newFormErrors: { [key: string]: string } = {};
    const passportExpiryError = 'La data di scadenza del passaporto deve essere almeno 6 mesi da oggi.';

    if (!formData.passportInRenewal && formData.passportExpiryDate && !isPassportDateValid(formData.passportExpiryDate)) {
        newFormErrors.passportExpiryDate = passportExpiryError;
    }
    if (formData.hasCompanion && !formData.companionPassportInRenewal && formData.companionPassportExpiryDate && !isPassportDateValid(formData.companionPassportExpiryDate)) {
        newFormErrors.companionPassportExpiryDate = passportExpiryError;
    }
    
    if (Object.keys(newFormErrors).length > 0) {
        setFormErrors(newFormErrors);
        const firstErrorFieldKey = Object.keys(newFormErrors)[0];
        const fieldElement = document.getElementsByName(firstErrorFieldKey)[0];
        fieldElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    
    setFormErrors({});
    setShowConfirmation(true);
    window.scrollTo(0, 0);
  };
  
  const handleConfirmSubmit = () => {
    onFormSubmit(formData);
  };

  const renderField = (field: FormField, section?: FormSectionConfig) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'date': {
        const isRequired = field.required;
        const labelNode = <>{field.label}{isRequired && <span className="text-red-500">*</span>}</>;
        return <InputField key={field.id} id={field.id} name={field.name} label={labelNode} type={field.type} required={false} note={field.note} value={formData[field.name]} onChange={handleChange} error={formErrors[field.name]} />;
      }
      case 'select': {
        const labelNode = <>{field.label}{field.required && <span className="text-red-500">*</span>}</>;
        if (section?.id === 'logistics') {
          if (!field.options || field.options.length === 0) return null;
          const options = field.options;
          return (
            <div key={field.id} className="animate-fade-in-up">
              <label className="block text-sm font-medium text-gray-700">{labelNode}</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {options.map((option: string) => {
                  const selected = formData[field.name] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`px-3 py-1 rounded-full text-sm border ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-800 border-gray-300'} transition`}
                      onClick={() => {
                        const fakeEvent = { target: { name: field.name, value: option } } as React.ChangeEvent<HTMLSelectElement>;
                        handleChange(fakeEvent);
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {field.note && <p className="mt-1 text-sm text-gray-500">{field.note}</p>}
            </div>
          );
        } else {
          return <SelectField key={field.id} id={field.id} name={field.name} label={labelNode} required={field.required} options={field.options || []} note={field.note} value={formData[field.name]} onChange={handleChange} />;
        }
      }
      case 'checkbox': {
        const mainLabelNode = field.label ? (
            <>
                {parseLabelWithLinks(field.label)}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </>
        ) : null;

        const checkboxLabelText = field.checkboxLabel || '';
        const checkboxLabelNode = (
            <>
                {parseLabelWithLinks(checkboxLabelText)}
                {field.required && !field.label && <span className="text-red-500 ml-1">*</span>}
            </>
        );
        
        return <CheckboxField key={field.id} id={field.id} name={field.name} label={mainLabelNode} required={field.required} checkboxLabel={checkboxLabelNode} checked={!!formData[field.name]} onChange={handleChange} />;
      }
      case 'radio': {
        const radioLabelNode = (
            <>
                {parseLabelWithLinks(field.label)}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </>
        );
        let noteNode = field.note ? parseLabelWithLinks(field.note) : undefined;
        let isDisabled = false;
        
        if (field.id === 'dataProcessingConsent') {
            isDisabled = !hasViewedPrivacy && !existingData;
        } else if (field.id === 'consentCompanion') {
            isDisabled = (!formData.hasCompanion || !hasViewedPrivacy) && !existingData;
        } else if (field.id === 'penaltiesAcknowledgement') {
            isDisabled = !hasViewedTerms && !existingData;
        } else if (field.name === 'companionMeeting') {
            isDisabled = formData.companionPassportInRenewal;
        }
        
        return <RadioGroupField key={field.id} name={field.name} label={radioLabelNode} required={field.required} options={field.options || []} value={formData[field.name]} onChange={handleChange} note={noteNode} disabled={isDisabled} />;
      }
      default:
        return null;
    }
  };

  // Mostra solo il riepilogo se la registrazione esiste ed è stata inviata e non stiamo modificando
  if (existingData && isSubmitted && !isEditing) {
    return <SummaryView data={existingData} onEdit={onEdit} formConfig={formConfig} />;
  }

  if (showConfirmation) {
    return (
      <div className="p-4 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-xl shadow-lg">
           <span className="material-symbols-outlined text-6xl text-sky-500 mb-4">send</span>
           <h1 className="text-3xl font-bold text-gray-800 mb-2">Conferma Invio</h1>
           <p className="text-gray-600 mb-6">Sei sicuro di voler inviare la tua scheda di adesione? Potrai modificarla in seguito.</p>
           <div className="flex justify-center gap-4">
             <button onClick={() => setShowConfirmation(false)} className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200">
               Annulla
             </button>
             <button onClick={handleConfirmSubmit} className="w-full bg-sky-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-600 transition-colors duration-200">
               Conferma
             </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ValidationErrorModal
        isOpen={validationErrorModalOpen}
        onClose={() => setValidationErrorModalOpen(false)}
        fields={missingFields}
      />
      <DocModal 
        isOpen={!!docModalContent}
        onClose={closeDocModal}
        title={docModalContent?.title || ''}
        content={docModalContent?.content || ''}
      />
      <div className="p-4 bg-gray-50 min-h-screen">
        <div className="max-w-xl mx-auto">
          {deadline && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md mb-6 flex items-start space-x-3">
                <span className="material-symbols-outlined mt-1">info</span>
                <div>
                    <h3 className="font-bold">Scadenza Compilazione</h3>
                    <p className="text-sm">
                        La scheda di adesione deve essere compilata <strong>entro e non oltre il {deadline}</strong>.
                    </p>
                </div>
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate>
            {filteredFormConfig.map(section => (
              <div key={section.id} className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-[#1A2C47] mb-4 border-b pb-3">{section.title}</h2>
                <div className={section.id === 'consents' ? '' : 'space-y-4'}>
                  {section.fields.map(field => {
                    if (field.id === 'consentCompanion' && !formData.hasCompanion) {
                      return null;
                    }

                    // Hide participant passport fields if renewal is checked
                    const participantPassportFields = ['passportNumber', 'passportIssueDate', 'passportExpiryDate'];
                    if (formData.passportInRenewal && participantPassportFields.includes(field.name)) {
                        return null;
                    }

                    const conditionalField = field as ConditionalFormField;
                    
                    if (section.id === 'consents') {
                      const visibleFields = section.fields.filter(f => !(f.id === 'consentCompanion' && !formData.hasCompanion));
                      const isFirst = visibleFields.findIndex(f => f.id === field.id) === 0;
                      return (
                          <div key={field.id} className={isFirst ? '' : 'pt-4 mt-4 border-t'}>
                              {renderField(field, section)}
                          </div>
                      );
                    }
                    
                    return (
                      <div key={field.id}>
                        {renderField(field, section)}
                        {conditionalField.controlsFields && formData[field.name] && (
                          <div className="space-y-4 pt-4 mt-4 border-t animate-fade-in-up">
                            {conditionalField.controlsFields.map(subField => {
                                // Hide companion passport fields if renewal is checked
                                const companionPassportFields = ['companionPassportNumber', 'companionPassportIssueDate', 'companionPassportExpiryDate'];
                                if (formData.companionPassportInRenewal && companionPassportFields.includes(subField.name)) {
                                    return null;
                                }

                                // Make companion sub-fields required if the main checkbox is checked
                                const effectiveSubField = {...subField, required: subField.required && formData[field.name]};
                                return renderField(effectiveSubField, section);
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="mt-6">
              <button type="submit" className="w-full bg-gray-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors duration-200 flex items-center justify-center">
                <span className="material-symbols-outlined mr-2">send</span>
                Invia Registrazione
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegistrationPage;