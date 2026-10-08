const { state, save } = require('../db/database');

/**
 * User Entity Model
 * Schema: { id, phone, name, createdAt }
 */
const User = {
  findByPhone(phone) {
    return state.users.find(u => u.phone === phone) || null;
  },

  findById(id) {
    return state.users.find(u => u.id === id) || null;
  },

  create({ phone, name }) {
    const newUser = {
      id: 'usr_' + Date.now() + Math.random().toString(36).substring(2, 6),
      phone,
      name: name || `User ${phone.slice(-4)}`,
      createdAt: new Date().toISOString()
    };
    state.users.push(newUser);
    save();
    return newUser;
  },

  updateName(id, name) {
    const user = this.findById(id);
    if (user && name) {
      user.name = name;
      save();
    }
    return user;
  }
};

module.exports = User;

