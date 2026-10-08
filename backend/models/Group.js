const { state, save } = require('../db/database');

/**
 * Group Entity Model
 * Schema: { id, name, createdBy, members, createdAt }
 */
const Group = {
  findById(id) {
    return state.groups.find(g => g.id === id) || null;
  },

  findForUser(userNameOrPhone) {
    return state.groups.filter(g =>
      g.members.includes(userNameOrPhone) || g.createdBy === userNameOrPhone
    );
  },

  create({ name, createdBy, members = [] }) {
    // Ensure creator is included in the members list
    const uniqueMembers = Array.from(new Set([createdBy, ...members])).filter(Boolean);

    const newGroup = {
      id: 'grp_' + Date.now() + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      createdBy,
      members: uniqueMembers,
      createdAt: new Date().toISOString()
    };
    state.groups.push(newGroup);
    save();
    return newGroup;
  }
};

module.exports = Group;

