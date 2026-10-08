const { state, save } = require('../db/database');

/**
 * Expense Entity Model
 * Schema: { id, groupId, title, amount, paidBy, splitAmong, createdAt }
 */
const Expense = {
  findByGroupId(groupId) {
    return state.expenses.filter(e => e.groupId === groupId);
  },

  create({ groupId, title, amount, paidBy, splitAmong = [] }) {
    const newExpense = {
      id: 'exp_' + Date.now() + Math.random().toString(36).substring(2, 6),
      groupId,
      title: title.trim(),
      amount: parseFloat(amount),
      paidBy,
      splitAmong: splitAmong.length > 0 ? splitAmong : [],
      createdAt: new Date().toISOString()
    };
    state.expenses.push(newExpense);
    save();
    return newExpense;
  }
};

module.exports = Expense;

