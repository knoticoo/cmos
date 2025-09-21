import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import './PatchNotes.css';

const PatchNotes = () => {
  const [patchNotes, setPatchNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatchNotes();
  }, []);

  const fetchPatchNotes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/patch-notes');
      setPatchNotes(response.data.patchNotes || 'No patch notes available.');
    } catch (err) {
      setError('Failed to load patch notes');
      console.error('Patch notes error:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="patch-notes">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading patch notes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patch-notes">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Error Loading Patch Notes</h2>
            <p>{error}</p>
            <button onClick={fetchPatchNotes} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patch-notes">
      <div className="container">
        <div className="patch-notes-header">
          <h1 className="page-title">📝 Patch Notes</h1>
          <p className="page-subtitle">Latest updates and improvements to the Management Web App</p>
        </div>
        
        <div className="patch-notes-content">
          <div className="patch-notes-body">
            {patchNotes && patchNotes !== 'No patch notes available.' ? (
              <div 
                className="patch-notes-text"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(patchNotes) }}
              />
            ) : (
              <div className="patch-notes-empty">
                <div className="empty-icon">📝</div>
                <h3>No patch notes available yet</h3>
                <p>Check back later for updates and improvements!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatchNotes;
