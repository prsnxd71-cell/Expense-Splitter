import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Current view: 'groups' | 'group-detail'
  const [currentPage, setCurrentPage] = useState('groups');
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      setUser(null);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('groups');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSelectedGroup(null);
    setCurrentPage('groups');
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setCurrentPage('group-detail');
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setCurrentPage('groups');
  };

  const handleGroupUpdated = (updatedGroup) => {
    setSelectedGroup(updatedGroup);
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-brand" onClick={user ? handleBackToGroups : undefined} style={{ cursor: user ? 'pointer' : 'default' }}>
          <div className="brand-icon">₹</div>
          <span>Expense Splitter</span>
        </div>

        {user && (
          <div className="nav-user">
            <span className="user-badge">
              👤 {user.name || user.phone}
            </span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="main-content">
        {!user ? (
          /* Page 1: Auth */
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        ) : currentPage === 'groups' ? (
          /* Page 2: Groups Dashboard */
          <GroupsPage
            user={user}
            onSelectGroup={handleSelectGroup}
          />
        ) : (
          /* Page 3: Group Detail & Settlement */
          <GroupDetailPage
            group={selectedGroup}
            currentUser={user}
            onBack={handleBackToGroups}
            onGroupUpdated={handleGroupUpdated}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer style={{ textAlign: 'center', padding: '16px', color: 'var(--text-light)', fontSize: '0.8rem', borderTop: '1px solid var(--border)' }}>
        Expense Splitter • 45-Minute Full-Stack Workshop Project
      </footer>
    </div>
  );
}

