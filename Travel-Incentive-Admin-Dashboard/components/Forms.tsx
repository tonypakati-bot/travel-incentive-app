
import React from 'react';
import { SearchIcon, PencilIcon, TrashIcon } from './icons';

export type Form = {
    id: string | number;
    name: string;
    trip: string;
    responses: string;
};

interface FormsProps {
  onCreateForm: () => void;
  forms: Form[];
}

const Forms: React.FC<FormsProps> = ({ onCreateForm, forms }) => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Forms</h1>
        <p className="text-gray-500 mt-1">Create and manage forms to collect information from participants.</p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                type="text" 
                placeholder="Search forms..."
                className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
            </div>
            <button 
                onClick={onCreateForm}
                className="bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Create New Form
            </button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-4">Form Name</th>
                        <th scope="col" className="px-6 py-4">Trip</th>
                        <th scope="col" className="px-6 py-4">Registrations</th>
                        <th scope="col" className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {forms.map((form) => (
                        <tr key={form.id} className="bg-white border-b last:border-b-0 hover:bg-gray-50">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                {form.name}
                            </th>
                            <td className="px-6 py-4">{form.trip}</td>
                            <td className="px-6 py-4">{form.responses}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end space-x-3">
                                    <button className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md transition-colors hover:bg-gray-100" aria-label="Edit form">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button className="p-1.5 text-red-500 hover:text-red-700 rounded-md transition-colors hover:bg-red-100" aria-label="Delete form">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Forms;
