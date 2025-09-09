import React, { useState, useEffect } from 'react';
import axios from '../../axios';
import { FaPlus, FaTasks } from 'react-icons/fa';

// Modal Component
const Modal = ({ show, onClose, children }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-end">
          <button onClick={onClose} className="action-link delete text-lg">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [comment, setComment] = useState('');
  const [salesUsers, setSalesUsers] = useState([]);

  // ✅ state جديد للتاسك
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', assignedTo: '' });

  useEffect(() => {
    fetchTasks();
    fetchSalesUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get('/tasks');
      setTasks(res.data.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesUsers = async () => {
    try {
      const res = await axios.get('/auth/users?role=sales');
      setSalesUsers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch sales users", err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      setSelectedTask(null);
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const handleUpdateTask = async (id, updates) => {
    try {
      const { data } = await axios.patch(`/tasks/${id}`, updates);
      setTasks(prev => prev.map(t => t._id === id ? data.data : t));
      setSelectedTask(data.data);
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    await handleUpdateTask(selectedTask._id, { comment });
    setComment('');
  };

  const handleReassign = async (newUserId) => {
    await handleUpdateTask(selectedTask._id, { assignedTo: newUserId });
  };

  // ✅ إنشاء تاسك جديد
  const handleCreateTask = async () => {
    try {
      const { data } = await axios.post('/tasks', newTask);
      setTasks(prev => [...prev, data.data]);
      setIsNewTaskOpen(false);
      setNewTask({ title: '', description: '', dueDate: '', assignedTo: '' });
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Task Management</h1>
        <button onClick={() => setIsNewTaskOpen(true)} className="btn primary">
          <FaPlus className="mr-2" /> New Task
        </button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0 ? tasks.map((task) => (
              <tr key={task._id}>
                <td>
                  <div className="text-sm font-medium">{task.title}</div>
                  <div className="text-sm text-gray-500">{task.description?.substring(0, 40)}...</div>
                </td>
                <td>{task.assignedTo?.name}</td>
                <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <span className={`badge ${task.status === 'completed' ? 'success' : 'warning'}`}>
                    {task.status}
                  </span>
                </td>
                <td className="space-x-2">
                  <button onClick={() => setSelectedTask(task)} className="action-link view">View</button>
                  <button onClick={() => handleDeleteTask(task._id)} className="action-link delete">Delete</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500">
                  <FaTasks className="mx-auto text-4xl mb-2" />
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Task Details Modal */}
      <Modal show={!!selectedTask} onClose={() => setSelectedTask(null)}>
        {selectedTask && (
          <div>
            <h2 className="text-xl font-bold mb-2">{selectedTask.title}</h2>
            <p className="mb-2">{selectedTask.description}</p>
            <p><strong>Assigned To:</strong> {selectedTask.assignedTo?.name}</p>
            <p><strong>Status:</strong> {selectedTask.status}</p>
            <p><strong>Due Date:</strong> {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'N/A'}</p>

            {/* Comments */}
            <div className="mt-4">
              <h3 className="font-semibold">Comments</h3>
              <ul className="text-sm mb-2 max-h-40 overflow-y-auto">
                {selectedTask.comments?.length > 0 ? selectedTask.comments.map(c => (
                  <li key={c._id} className="border-b py-1">
                    <strong>{c.userName}:</strong> {c.text}
                  </li>
                )) : <li className="text-gray-400">No comments yet.</li>}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="input"
                />
                <button onClick={handleAddComment} className="btn primary">Add</button>
              </div>
            </div>

            {/* Reassign */}
            <div className="mt-4">
              <label className="field-label">Reassign Task</label>
              <select
                value={selectedTask.assignedTo?._id || ''}
                onChange={(e) => handleReassign(e.target.value)}
                className="input"
              >
                <option value="">Select user</option>
                {salesUsers.map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn secondary" onClick={() => setSelectedTask(null)}>Close</button>
              <button className="btn danger" onClick={() => handleDeleteTask(selectedTask._id)}>Delete</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ✅ New Task Modal */}
      <Modal show={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Create New Task</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="Title"
            className="input"
          />
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="Description"
            className="input"
          />
          <input
            type="date"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            className="input"
          />
          <select
            value={newTask.assignedTo}
            onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
            className="input"
          >
            <option value="">Assign to</option>
            {salesUsers.map(user => (
              <option key={user._id} value={user._id}>{user.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn secondary" onClick={() => setIsNewTaskOpen(false)}>Cancel</button>
          <button className="btn primary" onClick={handleCreateTask}>Create</button>
        </div>
      </Modal>
    </div>
  );
}
