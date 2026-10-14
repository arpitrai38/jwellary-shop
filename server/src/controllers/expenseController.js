import { Expense } from '../models/Expense.js';
import { logAudit } from '../utils/auditLogger.js';

export const getExpenses = async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;
    const query = {};

    if (category) query.category = category;

    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.expenseDate.$lte = end;
      }
    }

    const expenses = await Expense.find(query).sort({ expenseDate: -1 });
    const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

    res.json({
      success: true,
      data: expenses,
      totalAmount
    });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const { title, category, amount, paymentMethod, expenseDate, notes } = req.body;

    const expense = await Expense.create({
      title,
      category,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'CASH',
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      notes: notes || '',
      loggedBy: req.user?._id,
      loggedByName: req.user?.name || 'Staff'
    });

    await logAudit({
      req,
      action: 'EXPENSE_RECORDED',
      resource: 'Expense',
      resourceId: expense._id,
      details: { title, category, amount }
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};
