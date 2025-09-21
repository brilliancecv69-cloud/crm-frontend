import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaTrash, FaPen, FaHistory } from 'react-icons/fa';

// Reusable Modal Component
const Modal = ({ show, onClose, children }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="card w-full max-w-lg max-h-full overflow-y-auto">
        <div className="flex justify-end">
          <button onClick={onClose} className="icon-btn">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Form for creating/editing templates
const TemplateForm = ({ onSave, closeForm, templateToEdit }) => {
  const [name, setName] = useState('');
  const [messages, setMessages] = useState([{ delay: 24, message: '' }]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (templateToEdit) {
      setName(templateToEdit.name);
      setMessages(templateToEdit.messages);
    } else {
      setName('');
      setMessages([{ delay: 24, message: '' }]);
    }
  }, [templateToEdit]);

  const handleMessageChange = (index, field, value) => {
    const newMessages = [...messages];
    newMessages[index][field] = value;
    setMessages(newMessages);
  };

  const addMessageStep = () => {
    if (messages.length < 5) {
      setMessages([...messages, { delay: 24, message: '' }]);
    }
  };

  const removeMessageStep = (index) => {
    if (messages.length > 1) {
      setMessages(messages.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Template name is required.');
      return;
    }
    if (messages.some(m => !m.message.trim() || !m.delay)) {
      setError('All message fields and delays are required.');
      return;
    }
    try {
      const payload = { name, messages };
      if (templateToEdit) {
        await axios.put(`/follow-up-templates/${templateToEdit._id}`, payload);
      } else {
        await axios.post('/follow-up-templates', payload);
      }
      onSave();
      closeForm();
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while saving the template.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">{templateToEdit ? 'Edit Template' : 'Create New Template'}</h2>
      {error && <p className="text-danger mb-4">{error}</p>}

      <div className="field mb-4">
        <span>Template Name</span>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="input"
          placeholder="e.g., 3-Day Follow-Up"
          required
        />
      </div>

      <h3 className="text-lg font-semibold mb-2">Message Sequence</h3>
      {messages.map((step, index) => (
        <div key={index} className="card mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Step {index + 1}</label>
            {messages.length > 1 && (
              <button type="button" onClick={() => removeMessageStep(index)} className="btn danger btn-sm">
                Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <span className="text-xs font-medium">Delay (hours)</span>
              <input
                type="number"
                value={step.delay}
                onChange={e => handleMessageChange(index, 'delay', parseInt(e.target.value))}
                className="input"
                min="1"
                required
              />
            </div>
            <div className="md:col-span-3">
              <span className="text-xs font-medium">Message</span>
              <textarea
                rows="3"
                value={step.message}
                onChange={e => handleMessageChange(index, 'message', e.target.value)}
                className="input"
                placeholder="e.g., Hi {{contact.name}}, just following up..."
                required
              ></textarea>
            </div>
          </div>
        </div>
      ))}

      {messages.length < 5 && (
        <button type="button" onClick={addMessageStep} className="btn secondary w-full mb-4">
          <FaPlus className="mr-2" /> Add Step
        </button>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <button type="button" onClick={closeForm} className="btn secondary">Cancel</button>
        <button type="submit" className="btn primary">Save Template</button>
      </div>
    </form>
  );
};

export default function FollowUpTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState(null);
  const { user } = useAuth();

  const fetchTemplates = () => {
    setLoading(true);
    axios.get('/follow-up-templates')
      .then(res => setTemplates(res.data.data))
      .catch(err => console.error("Failed to fetch templates", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setTemplateToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (template) => {
    setTemplateToEdit(template);
    setIsModalOpen(true);
  };

  const handleDelete = async (templateId) => {
    if (window.confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      try {
        await axios.delete(`/follow-up-templates/${templateId}`);
        fetchTemplates();
      } catch (error) {
        console.error("Failed to delete template", error);
        alert(error.response?.data?.error || "Could not delete the template.");
      }
    }
  };

  if (loading) return <div className="p-4">Loading templates...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Follow-up Templates</h1>
        <button onClick={openCreateModal} className="btn primary">
          <FaPlus className="mr-2" /> Create Template
        </button>
      </div>

      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <TemplateForm onSave={fetchTemplates} closeForm={() => setIsModalOpen(false)} templateToEdit={templateToEdit} />
      </Modal>

      {templates.length === 0 ? (
        <div className="card text-center p-10 text-gray-500">
          <FaHistory className="mx-auto text-5xl mb-4" />
          <p className="mb-4">No follow-up templates found. Create your first one to get started!</p>
          <button onClick={openCreateModal} className="btn primary">Create Template</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template._id} className="card p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold mb-2">{template.name}</h2>
                  <span className={`badge ${template.createdBy.role === 'admin' ? 'info' : ''}`}>
                    {template.createdBy.role === 'admin' ? 'Team' : 'Personal'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">Created by: {template.createdBy.name}</p>
                <ul className="space-y-2">
                  {template.messages.map((msg, index) => (
                    <li key={index} className="card p-2 text-sm">
                      <strong>After {msg.delay} hours:</strong> "{msg.message.substring(0, 50)}..."
                    </li>
                  ))}
                </ul>
              </div>
              {(user?.id === template.createdBy._id || user?.role === 'admin') && (
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <button onClick={() => openEditModal(template)} className="icon-btn" title="Edit"><FaPen /></button>
                  <button onClick={() => handleDelete(template._id)} className="icon-btn" title="Delete"><FaTrash /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
