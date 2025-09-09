// src/pages/MyTasks.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from '../axios'; 
import { toast } from 'react-toastify';
import { FaTasks, FaComment, FaCalendarAlt, FaUser, FaPlus } from 'react-icons/fa';

// CreateTaskModal
const CreateTaskModal = ({ onClose, onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        ...(dueDate && { dueDate }),
      };
      const response = await axios.post('/tasks/my', payload);
      onTaskCreated(response.data.data);
      toast.success('Task created successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to create task', error);
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Create New Task</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="task-title">Title *</label>
              <input 
                type="text" 
                id="task-title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="task-description">Description</label>
              <textarea 
                id="task-description" 
                rows="3" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="task-duedate">Due Date (Optional)</label>
              <input 
                type="date" 
                id="task-duedate" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// UpdateTaskModal
const UpdateTaskModal = ({ task, onClose, onTaskUpdate }) => {
  const [status, setStatus] = useState(task.status);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        status,
        ...(comment.trim() && { comment: comment.trim() }),
      };
      const response = await axios.patch(`/tasks/${task._id}`, payload); // ✅ شيلت /api
      onTaskUpdate(response.data.data);
      toast.success('Task updated successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to update task', error);
      toast.error(error.response?.data?.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Update Task Status</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input type="text" value={task.title} disabled />
            </div>
            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select id="task-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="task-comment">Add a Comment (Optional)</label>
              <textarea
                id="task-comment"
                rows="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any notes or comments here..."
              ></textarea>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// MyTasks
export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedUpdateTask, setSelectedUpdateTask] = useState(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    setError(null); 
    setLoading(true);
    try {
      const { data } = await axios.get('/tasks/my'); // ✅ شيلت /api
      if (data.ok) {
        setTasks(data.data || []);
      } else {
         throw new Error(data.message || "Failed to fetch tasks");
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to load tasks. Please try again later.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prevTasks =>
      prevTasks.map(task => (task._id === updatedTask._id ? updatedTask : task))
    );
  };

  const handleTaskCreated = (newTask) => {
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  if (loading) return <div className="loading">Loading your tasks...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><FaTasks /> My Tasks</h1>
        <button className="btn" onClick={() => setCreateModalOpen(true)}>
          <FaPlus /> Create New Task
        </button>
      </div>

      <div className="tasks-layout">
        <section>
          <h2>Pending Tasks ({pendingTasks.length})</h2>
          {pendingTasks.length > 0 ? (
            <div className="tasks-grid">
              {pendingTasks.map(task => (
                <div key={task._id} className="card task-card">
                  <h4>{task.title}</h4>
                  <p className="task-description">{task.description}</p>
                  <div className="task-meta">
                    <span>
                      <FaUser /> By: {task.createdBy?.name || 'N/A'}
                    </span>
                    {task.dueDate && (
                      <span>
                        <FaCalendarAlt /> Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {task.comments && task.comments.length > 0 && (
                    <div className="task-comments">
                      <h5><FaComment /> Recent Comments:</h5>
                      <ul>
                        {task.comments.slice(-2).map(comment => (
                          <li key={comment._id}>
                            <strong>{comment.userName}:</strong> {comment.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="task-actions">
                    <button className="btn btn-sm" onClick={() => setSelectedUpdateTask(task)}>Update Status</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No pending tasks. Great job!</p>
          )}
        </section>

        <section>
          <h2>Completed Tasks ({completedTasks.length})</h2>
          {completedTasks.length > 0 ? (
            <div className="tasks-grid">
              {completedTasks.map(task => (
                <div key={task._id} className="card task-card is-completed">
                  <h4>{task.title}</h4>
                  <p className="task-description">{task.description}</p>
                   <div className="task-meta">
                    <span>
                      <FaUser /> By: {task.createdBy?.name || 'N/A'}
                    </span>
                    {task.dueDate && (
                      <span>
                        <FaCalendarAlt /> Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No tasks have been completed yet.</p>
          )}
        </section>
      </div>
      
      {selectedUpdateTask && (
        <UpdateTaskModal 
          task={selectedUpdateTask} 
          onClose={() => setSelectedUpdateTask(null)}
          onTaskUpdate={handleTaskUpdate}
        />
      )}

      {isCreateModalOpen && (
        <CreateTaskModal 
          onClose={() => setCreateModalOpen(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}
