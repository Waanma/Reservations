'use client';

import React, { useState, useEffect } from 'react';
import { MergeRule } from '@/types/types';

interface ConfigurationProps {
  onClose: () => void;
  figures: { id: number; name: string }[];
  mergeRules: MergeRule[];
  setMergeRules: React.Dispatch<React.SetStateAction<MergeRule[]>>;
}

// Función para convertir una hora "HH:mm" a minutos
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Función para verificar si dos intervalos de tiempo se solapan
const isTimeOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

// Función para comprobar si hay conflicto entre la regla nueva (o editada) y las existentes
const hasConflict = (
  newRule: MergeRule,
  existingRules: MergeRule[]
): boolean => {
  for (const rule of existingRules) {
    // Se revisa si comparten al menos una figure
    const commonFigures = rule.mergeFrom.filter((figureId) =>
      newRule.mergeFrom.includes(figureId)
    );
    if (commonFigures.length > 0) {
      // Si comparten figures, se verifica el solapamiento de horarios
      if (
        isTimeOverlap(
          rule.activeFrom,
          rule.activeTo,
          newRule.activeFrom,
          newRule.activeTo
        )
      ) {
        return true;
      }
    }
  }
  return false;
};

const Configuration: React.FC<ConfigurationProps> = ({
  figures,
  mergeRules,
  setMergeRules,
}) => {
  const [activeTab, setActiveTab] = useState<'pricing' | 'merge'>('merge');

  // Estado para la nueva regla
  const [newRule, setNewRule] = useState<MergeRule>({
    mergeFrom: [],
    newId: 0,
    newName: '',
    newColor: '#ff0000',
    activeFrom: '15:00',
    activeTo: '18:00',
  });

  // Estado para la regla en edición (cuando no es nula, se abre el modal)
  const [editingRule, setEditingRule] = useState<MergeRule | null>(null);

  // Cada vez que cambien las figures (tables), actualizamos las reglas eliminando las que ya no existen
  useEffect(() => {
    const validIds = new Set(figures.map((figure) => figure.id));
    setMergeRules((currentRules) =>
      currentRules
        .map((rule) => ({
          ...rule,
          mergeFrom: rule.mergeFrom.filter((id) => validIds.has(id)),
        }))
        // Opcional: si una regla queda con menos de dos figures, se elimina
        .filter((rule) => rule.mergeFrom.length >= 2)
    );
  }, [figures, setMergeRules]);

  // Manejar cambios en checkbox para la nueva regla
  const handleCheckboxChange = (id: number) => {
    setNewRule((prev) => {
      const isSelected = prev.mergeFrom.includes(id);
      return {
        ...prev,
        mergeFrom: isSelected
          ? prev.mergeFrom.filter((item) => item !== id)
          : [...prev.mergeFrom, id],
      };
    });
  };

  // Manejar cambios en checkbox para la regla en edición
  const handleEditCheckboxChange = (id: number) => {
    if (!editingRule) return;
    const isSelected = editingRule.mergeFrom.includes(id);
    setEditingRule({
      ...editingRule,
      mergeFrom: isSelected
        ? editingRule.mergeFrom.filter((item) => item !== id)
        : [...editingRule.mergeFrom, id],
    });
  };

  // Validación de campos obligatorios
  const validateRule = (rule: MergeRule): boolean => {
    if (
      rule.mergeFrom.length < 2 ||
      !rule.newName.trim() ||
      !rule.activeFrom ||
      !rule.activeTo
    ) {
      return false;
    }
    return true;
  };

  const handleAddRule = () => {
    if (!validateRule(newRule)) {
      alert(
        'Please fill in all required fields and select at least two figures to merge.'
      );
      return;
    }
    // Verificar conflictos con las reglas existentes
    if (hasConflict(newRule, mergeRules)) {
      alert(
        "Conflict: The rule's time overlaps with another rule that uses some of the same figures."
      );
      return;
    }
    const generatedId = Math.max(...figures.map((t) => t.id)) + 1;
    const ruleToAdd: MergeRule = { ...newRule, newId: generatedId };
    setMergeRules([...mergeRules, ruleToAdd]);
    setNewRule({
      mergeFrom: [],
      newId: 0,
      newName: '',
      newColor: '#ff0000',
      activeFrom: '15:00',
      activeTo: '18:00',
    });
  };

  const startEditing = (rule: MergeRule) => {
    // Abrir el modal con una copia de la regla
    setEditingRule({ ...rule });
  };

  const cancelEditing = () => {
    setEditingRule(null);
  };

  const saveEditing = () => {
    if (editingRule) {
      if (!validateRule(editingRule)) {
        alert(
          'Please fill in all required fields and select at least two figures to merge.'
        );
        return;
      }
      // Excluir la regla en edición para evitar compararla consigo misma
      const otherRules = mergeRules.filter(
        (r) => r.newId !== editingRule.newId
      );
      if (hasConflict(editingRule, otherRules)) {
        alert(
          "Conflict: The rule's time overlaps with another rule that uses some of the same figures."
        );
        return;
      }
      setMergeRules(
        mergeRules.map((r) => (r.newId === editingRule.newId ? editingRule : r))
      );
      cancelEditing();
    }
  };

  return (
    <div className="relative p-4 max-h-[80vh] overflow-y-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Configuration
      </h3>

      {/* Tabs internas */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('merge')}
          className={`py-2 px-4 ${
            activeTab === 'merge' ? 'border-b-2 border-blue-500 font-bold' : ''
          }`}
        >
          Merge Rules
        </button>
      </div>

      {activeTab === 'merge' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Merge Rules Configuration
          </h3>

          {/* Mostrar reglas existentes */}
          {mergeRules.map((rule, index) => (
            <div key={index} className="mb-2 p-2 border rounded">
              <div>
                <span className="font-medium">Merge from:</span>{' '}
                {rule.mergeFrom.join(', ')}
              </div>
              <div>
                <span className="font-medium">New ID:</span> {rule.newId}
              </div>
              <div>
                <span className="font-medium">New Name:</span> {rule.newName}
              </div>
              <div>
                <span className="font-medium">New Color:</span>{' '}
                <span style={{ color: rule.newColor }}>{rule.newColor}</span>
              </div>
              <div>
                <span className="font-medium">Active from:</span>{' '}
                {rule.activeFrom} <span className="font-medium">to:</span>{' '}
                {rule.activeTo}
              </div>
              <button
                onClick={() => startEditing(rule)}
                className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Edit
              </button>
            </div>
          ))}

          {/* Formulario para crear una nueva regla de merge */}
          <div className="mt-4 p-2 border rounded">
            <h4 className="font-semibold mb-2">New Merge Rule</h4>

            <div className="mb-2">
              <label className="block text-gray-700 font-medium mb-1">
                Select Figures to Merge:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {figures.map((figure) => (
                  <label key={figure.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newRule.mergeFrom.includes(figure.id)}
                      onChange={() => handleCheckboxChange(figure.id)}
                      className="cursor-pointer"
                    />
                    {figure.id} - {figure.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-gray-700 font-medium mb-1">
                New Name:
              </label>
              <input
                type="text"
                value={newRule.newName}
                onChange={(e) =>
                  setNewRule({ ...newRule, newName: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-2">
              <label className="block text-gray-700 font-medium mb-1">
                New Color:
              </label>
              <input
                type="color"
                value={newRule.newColor}
                onChange={(e) =>
                  setNewRule({ ...newRule, newColor: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-2 flex gap-2">
              <div className="w-1/2">
                <label className="block text-gray-700 font-medium mb-1">
                  Active from:
                </label>
                <input
                  type="time"
                  value={newRule.activeFrom}
                  onChange={(e) =>
                    setNewRule({ ...newRule, activeFrom: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700 font-medium mb-1">
                  Active to:
                </label>
                <input
                  type="time"
                  value={newRule.activeTo}
                  onChange={(e) =>
                    setNewRule({ ...newRule, activeTo: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <button
              onClick={handleAddRule}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Add Merge Rule
            </button>
          </div>
        </div>
      )}

      {/* Modal para editar regla */}
      {editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-11/12 md:w-1/2">
            <h3 className="text-xl font-semibold mb-4">Edit Merge Rule</h3>

            <div className="mb-4">
              <span className="font-medium">Merge from:</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {figures.map((figure) => (
                  <label key={figure.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingRule.mergeFrom.includes(figure.id)}
                      onChange={() => handleEditCheckboxChange(figure.id)}
                      className="cursor-pointer"
                    />
                    {figure.id} - {figure.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="font-medium block mb-1">New Name:</label>
              <input
                type="text"
                value={editingRule.newName}
                onChange={(e) =>
                  setEditingRule({ ...editingRule, newName: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="font-medium block mb-1">New Color:</label>
              <input
                type="color"
                value={editingRule.newColor}
                onChange={(e) =>
                  setEditingRule({ ...editingRule, newColor: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4 flex gap-2">
              <div className="w-1/2">
                <label className="font-medium block mb-1">Active from:</label>
                <input
                  type="time"
                  value={editingRule.activeFrom}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      activeFrom: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-1/2">
                <label className="font-medium block mb-1">Active to:</label>
                <input
                  type="time"
                  value={editingRule.activeTo}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, activeTo: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={saveEditing}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={cancelEditing}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuration;
