"use client";
import { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react'; // Icon for closing

export default function AddRelativeModal({ isOpen, onClose, sourceNode, onSuccess }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    relationType: 'child' // Default option
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');

    try {
      // Step 1: Create the New Person
      const personRes = await axios.post('http://localhost:8000/api/genealogy/people/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        // We can add fuzzy dates here later
      }, { headers: { Authorization: `Bearer ${token}` }});

      const newPersonId = personRes.data.id;

      // Step 2: Link them based on relation type
      // This is where the logic gets specific

      const payload = {};

      if (formData.relationType === 'spouse') {
        // Create a Horizontal Relationship
        await axios.post('http://localhost:8000/api/genealogy/relationships/', {
          person_a: sourceNode.id,
          person_b: newPersonId,
          relationship_type: 'MAR' // Defaulting to Married for MVP
        }, { headers: { Authorization: `Bearer ${token}` }});

      } else if (formData.relationType === 'child') {
        // Create a Parent-Child Link (Source is Parent, New is Child)
        await axios.post('http://localhost:8000/api/genealogy/parent_links/', {
          child: newPersonId,
          single_parent: sourceNode.id, // Linking to single parent for now
          link_type: 'BIO'
        }, { headers: { Authorization: `Bearer ${token}` }});

      } else if (formData.relationType === 'parent') {
        // Create a Parent-Child Link (Source is Child, New is Parent)
        await axios.post('http://localhost:8000/api/genealogy/parent_links/', {
          child: sourceNode.id,
          single_parent: newPersonId,
          link_type: 'BIO'
        }, { headers: { Authorization: `Bearer ${token}` }});
      }

      // Step 3: Tell the parent component to refresh
      onSuccess();
      onClose();

    } catch (err) {
      console.error("Failed to add relative:", err);
      alert("Error: " + JSON.stringify(err.response?.data));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-96 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-emerald-400">Add Relative</h2>
          <button onClick={onClose}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        <p className="text-gray-400 mb-4 text-sm">
          Adding connection to: <span className="text-white font-bold">{sourceNode?.data?.label}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Relationship</label>
            <select
              className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600"
              value={formData.relationType}
              onChange={e => setFormData({...formData, relationType: e.target.value})}
            >
              <option value="child">Son/Daughter</option>
              <option value="spouse">Spouse/Partner</option>
              <option value="parent">Mother/Father</option>
            </select>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              placeholder="First Name"
              className="w-1/2 bg-gray-900 text-white p-2 rounded border border-gray-600"
              onChange={e => setFormData({...formData, first_name: e.target.value})}
            />
            <input
              placeholder="Last Name"
              className="w-1/2 bg-gray-900 text-white p-2 rounded border border-gray-600"
              onChange={e => setFormData({...formData, last_name: e.target.value})}
            />
          </div>

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded font-bold">
            Add to Tree
          </button>
        </form>
      </div>
    </div>
  );
}
