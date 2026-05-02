const express = require('express');
const router = express.Router();
const { 
    getPersonalFinances, 
    createPersonalFinance, 
    updatePersonalFinance,
    deletePersonalFinance,
    getPersonalCategories,
    createPersonalCategory,
    deletePersonalCategory,
    getPersonalGoals,
    createPersonalGoal,
    updatePersonalGoal,
    deletePersonalGoal,
    contributeToGoal
} = require('../controllers/personalFinanceController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// Finanzas
router.get('/', getPersonalFinances);
router.post('/', createPersonalFinance);
router.put('/:id', updatePersonalFinance);
router.delete('/:id', deletePersonalFinance);

// Categorías
router.get('/categories', getPersonalCategories);
router.post('/categories', createPersonalCategory);
router.delete('/categories/:id', deletePersonalCategory);

// Metas
router.get('/goals', getPersonalGoals);
router.post('/goals', createPersonalGoal);
router.put('/goals/:id', updatePersonalGoal);
router.delete('/goals/:id', deletePersonalGoal);
router.post('/goals/:id/contribute', contributeToGoal);

module.exports = router;
