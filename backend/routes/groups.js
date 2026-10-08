const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Group = require('../models/Group');
const Expense = require('../models/Expense');

/**
 * Calculates net balances and minimal debt settlement recommendations
 */
function calculateGroupStats(group, expenses) {
  const members = group.members || [];
  const netBalances = {};
  members.forEach(m => { netBalances[m] = 0; });

  let totalSpend = 0;

  expenses.forEach(exp => {
    totalSpend += exp.amount;
    const splitMembers = exp.splitAmong && exp.splitAmong.length > 0 ? exp.splitAmong : members;
    const count = splitMembers.length || 1;
    const perHead = exp.amount / count;

    netBalances[exp.paidBy] = (netBalances[exp.paidBy] || 0) + exp.amount;
    splitMembers.forEach(m => {
      netBalances[m] = (netBalances[m] || 0) - perHead;
    });
  });

  // Round balances to 2 decimal places
  for (const m in netBalances) {
    netBalances[m] = Math.round(netBalances[m] * 100) / 100;
  }

  // Calculate who owes whom
  const creditors = [];
  const debtors = [];

  for (const [member, balance] of Object.entries(netBalances)) {
    if (balance > 0.01) creditors.push({ member, amount: balance });
    else if (balance < -0.01) debtors.push({ member, amount: -balance });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let c = 0;
  let d = 0;

  while (c < creditors.length && d < debtors.length) {
    const cred = creditors[c];
    const deb = debtors[d];
    const payAmount = Math.min(cred.amount, deb.amount);

    if (payAmount > 0.01) {
      settlements.push({
        from: deb.member,
        to: cred.member,
        amount: Math.round(payAmount * 100) / 100
      });
    }

    cred.amount -= payAmount;
    deb.amount -= payAmount;

    if (cred.amount <= 0.01) c++;
    if (deb.amount <= 0.01) d++;
  }

  return { totalSpend, netBalances, settlements };
}

/**
 * 3. GET /api/groups
 * Returns all groups for the authenticated user with expenses and balances
 */
router.get('/', requireAuth, (req, res) => {
  const userName = req.user.name;
  const userPhone = req.user.phone;

  // Find groups user is a member of or created
  const userGroups = Group.findForUser(userName)
    .concat(Group.findForUser(userPhone))
    .reduce((acc, curr) => {
      if (!acc.some(g => g.id === curr.id)) acc.push(curr);
      return acc;
    }, []);

  const groupsWithDetails = userGroups.map(group => {
    const expenses = Expense.findByGroupId(group.id);
    const stats = calculateGroupStats(group, expenses);
    return {
      ...group,
      expenses,
      totalSpend: stats.totalSpend,
      balances: stats.netBalances,
      settlements: stats.settlements,
      userBalance: stats.netBalances[userName] ?? stats.netBalances[userPhone] ?? 0
    };
  });

  return res.json({ groups: groupsWithDetails });
});

/**
 * 4. POST /api/groups
 * Creates a new expense group
 * Body: { name, members }
 */
router.post('/', requireAuth, (req, res) => {
  const { name, members } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Group title is required.' });
  }

  const rawMembers = Array.isArray(members) ? members : [];
  const cleanedMembers = rawMembers
    .map(m => (typeof m === 'string' ? m.trim() : ''))
    .filter(Boolean);

  // Ensure current user is part of the members
  const currentUserIdent = req.user.name || req.user.phone;
  if (!cleanedMembers.includes(currentUserIdent)) {
    cleanedMembers.unshift(currentUserIdent);
  }

  if (cleanedMembers.length < 2) {
    return res.status(400).json({
      error: 'Please add at least one other member to split expenses with.'
    });
  }

  const newGroup = Group.create({
    name: name.trim(),
    createdBy: currentUserIdent,
    members: cleanedMembers
  });

  const stats = calculateGroupStats(newGroup, []);

  return res.status(201).json({
    group: {
      ...newGroup,
      expenses: [],
      totalSpend: 0,
      balances: stats.netBalances,
      settlements: [],
      userBalance: 0
    }
  });
});

/**
 * 5. POST /api/groups/:id/expenses
 * Adds an expense to a specific group
 * Body: { title, amount, paidBy, splitAmong }
 */
router.post('/:id/expenses', requireAuth, (req, res) => {
  const { id } = req.params;
  const { title, amount, paidBy, splitAmong } = req.body;

  const group = Group.findById(id);
  if (!group) {
    return res.status(404).json({ error: 'Expense group not found.' });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Expense description/title is required.' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid expense amount greater than 0.' });
  }

  const payer = paidBy && paidBy.trim() ? paidBy.trim() : (req.user.name || req.user.phone);
  if (!group.members.includes(payer)) {
    return res.status(400).json({ error: `Payer "${payer}" is not a member of this group.` });
  }

  const validSplits = Array.isArray(splitAmong) && splitAmong.length > 0
    ? splitAmong.filter(m => group.members.includes(m))
    : group.members;

  if (validSplits.length === 0) {
    return res.status(400).json({ error: 'At least one group member must be included in the split.' });
  }

  const expense = Expense.create({
    groupId: group.id,
    title: title.trim(),
    amount: numericAmount,
    paidBy: payer,
    splitAmong: validSplits
  });

  const allExpenses = Expense.findByGroupId(group.id);
  const stats = calculateGroupStats(group, allExpenses);

  return res.status(201).json({
    expense,
    updatedGroup: {
      ...group,
      expenses: allExpenses,
      totalSpend: stats.totalSpend,
      balances: stats.netBalances,
      settlements: stats.settlements
    }
  });
});

module.exports = router;

