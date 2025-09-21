import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import UserModal from './UserModal';
import FeedbackModal from './FeedbackModal';
import './Admin.css';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [patchNotes, setPatchNotes] = useState('');
  const [editingPatchNotes, setEditingPatchNotes] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, feedbackRes, statsRes] = await Promise.all([
        api.get('/api/auth/users'),
        api.get('/api/feedback'),
        api.get('/api/feedback/stats')
      ]);
      setUsers(usersRes.data.users);
      setFeedback(feedbackRes.data.feedback);
      setStats(statsRes.data.stats);
      
      // Fetch patch notes separately (optional)
      try {
        const patchNotesRes = await api.get('/api/patch-notes');
        setPatchNotes(patchNotesRes.data.patchNotes || '');
      } catch (patchNotesErr) {
        console.warn('Failed to load patch notes:', patchNotesErr);
        setPatchNotes(''); // Set empty if patch notes fail
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This will also delete their database.')) {
      try {
        await api.delete(`/api/auth/users/${id}`);
        setMessage('User deleted successfully');
        fetchData();
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleModalSave = () => {
    setMessage(editingUser ? 'User updated successfully' : 'User created successfully');
    fetchData();
    handleModalClose();
  };

  const handleViewFeedback = (feedbackItem) => {
    setSelectedFeedback(feedbackItem);
    setShowFeedbackModal(true);
  };

  const handleFeedbackModalClose = () => {
    setShowFeedbackModal(false);
    setSelectedFeedback(null);
  };

  const handleUpdatePatchNotes = async () => {
    try {
      console.log('Updating patch notes:', patchNotes);
      const response = await api.put('/api/patch-notes', { patchNotes });
      console.log('Patch notes update response:', response.data);
      setMessage('Patch notes updated successfully!');
      setEditingPatchNotes(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Patch notes update error:', err);
      setError('Failed to update patch notes: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatPatchNotes = (text) => {
    if (!text) return text;
    
    // Split into lines
    const lines = text.split('\n');
    const formattedLines = [];
    let isFirstHeader = true;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) {
        formattedLines.push('');
        continue;
      }
      
      // Check if line looks like a page/section header (no bullet, not indented, ends with "page" or similar)
      if (!line.startsWith('-') && !line.startsWith('*') && !line.startsWith('•') && 
          (line.toLowerCase().includes('page') || line.toLowerCase().includes('section') || 
           line.toLowerCase().includes('feature') || line.toLowerCase().includes('update') ||
           line.toLowerCase().includes('dashboard') || line.toLowerCase().includes('alliances') ||
           line.toLowerCase().includes('players') || line.toLowerCase().includes('events'))) {
        
        // First header gets h1, others get h2
        if (isFirstHeader) {
          formattedLines.push(`# ${line}`);
          isFirstHeader = false;
        } else {
          formattedLines.push(`\n## ${line}`);
        }
      }
      // Check if line looks like a bullet point (starts with dash, asterisk, or bullet)
      else if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
        // Ensure proper bullet formatting
        const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
        if (cleanLine) {
          formattedLines.push(`- ${cleanLine}`);
        }
      }
      // Check if line looks like a sub-bullet (starts with spaces or tabs)
      else if (line.match(/^\s+/) && (line.includes('-') || line.includes('*') || line.includes('•'))) {
        const indent = line.match(/^(\s+)/)[1];
        const cleanLine = line.replace(/^\s*[-*•]\s*/, '').trim();
        if (cleanLine) {
          formattedLines.push(`${indent}- ${cleanLine}`);
        }
      }
      // Regular line - keep as is
      else {
        formattedLines.push(line);
      }
    }
    
    return formattedLines.join('\n');
  };

  const handlePatchNotesChange = (e) => {
    const newValue = e.target.value;
    setPatchNotes(newValue);
  };

  const handlePatchNotesKeyDown = (e) => {
    // Auto-format on Enter key
    if (e.key === 'Enter') {
      const textarea = e.target;
      const cursorPos = textarea.selectionStart;
      const textBefore = patchNotes.substring(0, cursorPos);
      const textAfter = patchNotes.substring(cursorPos);
      
      // Check if we're at the end of a line that should be formatted
      const lines = textBefore.split('\n');
      const currentLine = lines[lines.length - 1].trim();
      
      // If current line looks like a section header, format it
      if (currentLine && !currentLine.startsWith('-') && !currentLine.startsWith('*') && 
          !currentLine.startsWith('•') && !currentLine.startsWith('#') &&
          (currentLine.toLowerCase().includes('page') || currentLine.toLowerCase().includes('section') || 
           currentLine.toLowerCase().includes('feature') || currentLine.toLowerCase().includes('update') ||
           currentLine.toLowerCase().includes('dashboard') || currentLine.toLowerCase().includes('alliances') ||
           currentLine.toLowerCase().includes('players') || currentLine.toLowerCase().includes('events'))) {
        
        e.preventDefault();
        
        // Determine if this should be h1 or h2
        const isFirstHeader = !textBefore.includes('#');
        const headerPrefix = isFirstHeader ? '# ' : '## ';
        
        // Replace the current line with formatted version
        const newTextBefore = textBefore.replace(currentLine, headerPrefix + currentLine);
        const newText = newTextBefore + '\n' + textAfter;
        
        setPatchNotes(newText);
        
        // Set cursor position after the formatted section
        setTimeout(() => {
          const newCursorPos = newTextBefore.length + 1;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return text;
    
    // Split into lines for better processing
    const lines = text.split('\n');
    const processedLines = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Headers
      if (line.match(/^### (.*)$/)) {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(`<h3>${line.replace(/^### /, '')}</h3>`);
      } else if (line.match(/^## (.*)$/)) {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(`<h2>${line.replace(/^## /, '')}</h2>`);
      } else if (line.match(/^# (.*)$/)) {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(`<h1>${line.replace(/^# /, '')}</h1>`);
      }
      // Bullet points
      else if (line.match(/^- (.*)$/)) {
        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
        }
        const content = line.replace(/^- /, '');
        processedLines.push(`<li>${content}</li>`);
      }
      // Empty line
      else if (line.trim() === '') {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push('<br>');
      }
      // Regular line
      else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        // Process bold and italic
        let processedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        processedLines.push(processedLine + '<br>');
      }
    }
    
    // Close any open list
    if (inList) {
      processedLines.push('</ul>');
    }
    
    return processedLines.join('');
  };

  const handleFeedbackUpdate = () => {
    setMessage('Feedback updated successfully');
    fetchData();
    handleFeedbackModalClose();
  };

  const handleDeleteFeedback = async (id) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await api.delete(`/api/feedback/${id}`);
        setMessage('Feedback deleted successfully');
        fetchData();
      } catch (err) {
        setError('Failed to delete feedback');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin">
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Manage users, feedback, and platform settings</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={`tab-button ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          Feedback ({feedback.filter(f => f.status === 'new').length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'patch-notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('patch-notes')}
        >
          Patch Notes
        </button>
      </div>

      {message && (
        <div className="alert alert-success">
          {message}
          <button 
            type="button" 
            className="alert-close"
            onClick={() => setMessage('')}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
          <button 
            type="button" 
            className="alert-close"
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">User Management</h2>
            <button 
              onClick={handleAddUser}
              className="btn btn-primary"
            >
              Add New User
            </button>
          </div>

        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3 className="empty-state-title">No users yet</h3>
            <p className="empty-state-text">Add your first user to get started</p>
            <button 
              onClick={handleAddUser}
              className="btn btn-primary"
            >
              Add User
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Database</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info">
                        <span className="username">{user.username}</span>
                        {user.is_admin && <span className="admin-badge">Admin</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${user.is_admin ? 'admin' : 'user'}`}>
                        {user.is_admin ? 'Administrator' : 'User'}
                      </span>
                    </td>
                    <td>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="database-info">
                        {user.database_name || 'Default'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="btn btn-sm btn-secondary"
                        >
                          Edit
                        </button>
                        {!user.is_admin && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="btn btn-sm btn-danger"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Feedback Management</h2>
            <div className="feedback-stats">
              <span className="stat-item">Total: {stats.total || 0}</span>
              <span className="stat-item">New: {stats.new_count || 0}</span>
              <span className="stat-item">Donations: ${stats.total_donations || 0}</span>
            </div>
          </div>

          {feedback.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <h3 className="empty-state-title">No feedback yet</h3>
              <p className="empty-state-text">User feedback will appear here</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>From</th>
                    <th>Status</th>
                    <th>Donation</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.map(fb => (
                    <tr key={fb.id}>
                      <td>
                        <span className={`feedback-type ${fb.feedback_type}`}>
                          {fb.feedback_type}
                        </span>
                      </td>
                      <td>
                        <div className="feedback-subject">
                          {fb.subject || 'No subject'}
                        </div>
                      </td>
                      <td>
                        <div className="feedback-from">
                          {fb.name || 'Anonymous'}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${fb.status}`}>
                          {fb.status}
                        </span>
                      </td>
                      <td>
                        {fb.donation_amount ? `$${fb.donation_amount}` : '-'}
                      </td>
                      <td>
                        {new Date(fb.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleViewFeedback(fb)}
                            className="btn btn-sm btn-primary"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteFeedback(fb.id)}
                            className="btn btn-sm btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'patch-notes' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Patch Notes Management</h2>
            <div className="patch-notes-actions">
              {!editingPatchNotes ? (
                <button 
                  onClick={() => setEditingPatchNotes(true)}
                  className="btn btn-primary"
                >
                  Edit Patch Notes
                </button>
              ) : (
                <div className="edit-actions">
                  <button 
                    onClick={() => setPatchNotes(formatPatchNotes(patchNotes))}
                    className="btn btn-info"
                    title="Auto-format the text"
                  >
                    Format Text
                  </button>
                  <button 
                    onClick={handleUpdatePatchNotes}
                    className="btn btn-success"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={() => setEditingPatchNotes(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="patch-notes-editor">
            {editingPatchNotes ? (
              <textarea
                value={patchNotes}
                onChange={handlePatchNotesChange}
                onKeyDown={handlePatchNotesKeyDown}
                placeholder="Enter patch notes here... Auto-formatting will help structure your content.

Examples:
- Type 'Dashboard page' and press Enter → becomes '# Dashboard page' (h1)
- Type '- Changed xxx' → becomes properly formatted bullet point
- Type 'Alliances page' and press Enter → becomes '## Alliances page' (h2)
- Type '- Added new feature' → becomes properly formatted bullet point

The first page/section becomes h1, subsequent ones become h2."
                className="patch-notes-textarea"
                rows="20"
              />
            ) : (
              <div className="patch-notes-preview">
                {patchNotes ? (
                  <div 
                    className="patch-notes-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(patchNotes) }}
                  />
                ) : (
                  <div className="patch-notes-empty">No patch notes available.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">System Information</h2>
        </div>
        
        <div className="system-info">
          <div className="info-item">
            <span className="info-label">Total Users:</span>
            <span className="info-value">{users.length}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Admin Users:</span>
            <span className="info-value">{users.filter(u => u.is_admin).length}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Regular Users:</span>
            <span className="info-value">{users.filter(u => !u.is_admin).length}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Feedback:</span>
            <span className="info-value">{stats.total || 0}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Donations:</span>
            <span className="info-value">${stats.total_donations || 0}</span>
          </div>
        </div>
      </div>

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}

      {showFeedbackModal && selectedFeedback && (
        <FeedbackModal
          feedback={selectedFeedback}
          onClose={handleFeedbackModalClose}
          onSave={handleFeedbackUpdate}
        />
      )}
    </div>
  );
};

export default Admin;
