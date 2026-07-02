import { useState } from 'react';
import { X } from 'lucide-react';
import { GlassButton } from './GlassButton';
import type { Person } from '../types/accident-report';

interface AddPersonModalProps {
  person: Person | null;
  onSave: (person: Person) => void;
  onClose: () => void;
}

export function AddPersonModal({ person, onSave, onClose }: AddPersonModalProps) {
  const [formData, setFormData] = useState<Partial<Person>>(
    person || {
      role: 'Passenger',
      name: '',
      injury_level: 'None',
      transported_to_hospital: false,
      hospital_name: '',
    }
  );

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!formData.name) return;

    onSave({
      id: person?.id || `person-${Date.now()}`,
      role: formData.role as any,
      name: formData.name,
      injury_level: formData.injury_level as any,
      transported_to_hospital: formData.transported_to_hospital || false,
      hospital_name: formData.transported_to_hospital ? formData.hospital_name : undefined,
    });
  };

  const canSave = formData.name && 
    (!formData.transported_to_hospital || formData.hospital_name);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto sleek-scrollbar animate-in fade-in zoom-in-95 duration-300">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-slate-900 font-['Poppins']">{person ? 'Edit person' : 'Add person'}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-2 font-['Poppins']">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role || 'Passenger'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] focus:border-[#007DBA] bg-white text-slate-800 transition-all min-h-[44px] font-['Poppins']"
            >
              <option value="Passenger">Passenger</option>
              <option value="Operator">Operator</option>
              <option value="Pedestrian">Pedestrian</option>
              <option value="Other driver">Other driver</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-2 font-['Poppins']">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] focus:border-[#007DBA] bg-white text-slate-800 placeholder:text-slate-400 transition-all min-h-[44px] font-['Poppins']"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-2 font-['Poppins']">
              Injury level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['None', 'Minor', 'Serious', 'Fatal'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, injury_level: level as any })}
                  className={`
                    px-4 py-3 rounded-lg border-2 text-sm transition-all min-h-[44px]
                    focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']
                    ${formData.injury_level === level
                      ? 'border-[#007DBA] bg-[#E6F4FB] text-[#00205B] font-medium'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }
                  `}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-2 font-['Poppins']">
              Transported to hospital?
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, transported_to_hospital: true })}
                className={`
                  flex-1 px-4 py-3 rounded-lg border-2 text-sm transition-all min-h-[44px]
                  focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']
                  ${formData.transported_to_hospital
                    ? 'border-[#007DBA] bg-[#E6F4FB] text-[#00205B] font-medium'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, transported_to_hospital: false, hospital_name: '' })}
                className={`
                  flex-1 px-4 py-3 rounded-lg border-2 text-sm transition-all min-h-[44px]
                  focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']
                  ${!formData.transported_to_hospital
                    ? 'border-[#007DBA] bg-[#E6F4FB] text-[#00205B] font-medium'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                No
              </button>
            </div>
          </div>

          {formData.transported_to_hospital && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm text-slate-700 mb-2 font-['Poppins']">
                Hospital name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.hospital_name || ''}
                onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                placeholder="Enter hospital name"
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] focus:border-[#007DBA] bg-white text-slate-800 placeholder:text-slate-400 transition-all min-h-[44px] font-['Poppins']"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <GlassButton variant="secondary" onClick={onClose}>
              Cancel
            </GlassButton>
            <GlassButton 
              variant="primary" 
              onClick={handleSubmit}
              disabled={!canSave}
            >
              {person ? 'Update' : 'Add'} person
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}