/**
 * LotController — рівень контролерів (MVC)
 * Обробляє HTTP-запити та делегує логіку сервісному рівню.
 */

const lotService = require('../services/lotService');

// Поточний "сесійний" користувач (заглушка — в реальному застосунку через сесії/JWT)
const CURRENT_USER = { id: 'user-001', name: 'Дмитро Р.' };

// ─── ГОЛОВНА: список активних лотів ──────────────────────────────────────
async function index(req, res) {
  try {
    const query = req.query.q || '';
    const lots = query
      ? await lotService.searchLots(query)
      : await lotService.getActiveLots();

    res.render('lots/index', {
      title: 'Активні аукціони',
      lots,
      query,
      currentUser: CURRENT_USER,
      message: req.query.message || null,
      error: req.query.error || null,
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Помилка', message: err.message });
  }
}

// ─── ДЕТАЛІ ЛОТУ ─────────────────────────────────────────────────────────
async function show(req, res) {
  try {
    const lot = await lotService.getLotById(req.params.id);
    if (!lot) return res.status(404).render('error', { title: 'Не знайдено', message: 'Лот не знайдено' });

    const lotUrl = lotService.generateLotUrl(lot.id, `${req.protocol}://${req.get('host')}`);
    const isOwner = lot.ownerId === CURRENT_USER.id;

    res.render('lots/show', {
      title: lot.title,
      lot,
      lotUrl,
      isOwner,
      currentUser: CURRENT_USER,
      message: req.query.message || null,
      error: req.query.error || null,
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Помилка', message: err.message });
  }
}

// ─── ФОРМА НОВОГО ЛОТУ ────────────────────────────────────────────────────
function newForm(req, res) {
  res.render('lots/new', {
    title: 'Створити лот',
    currentUser: CURRENT_USER,
    error: null,
  });
}

// ─── СТВОРИТИ ЛОТ ────────────────────────────────────────────────────────
async function create(req, res) {
  try {
    const lot = await lotService.createLot({
      ...req.body,
      ownerId: CURRENT_USER.id,
      ownerName: CURRENT_USER.name,
    });
    res.redirect(`/lots/${lot.id}?message=Лот успішно створено`);
  } catch (err) {
    res.render('lots/new', {
      title: 'Створити лот',
      currentUser: CURRENT_USER,
      error: err.message,
    });
  }
}

// ─── ЗРОБИТИ СТАВКУ ──────────────────────────────────────────────────────
async function bid(req, res) {
  try {
    await lotService.placeBid(req.params.id, {
      bidderId: CURRENT_USER.id,
      bidderName: CURRENT_USER.name,
      amount: req.body.amount,
    });
    res.redirect(`/lots/${req.params.id}?message=Ставку прийнято`);
  } catch (err) {
    res.redirect(`/lots/${req.params.id}?error=${encodeURIComponent(err.message)}`);
  }
}

// ─── ВИДАЛИТИ ЛОТ ────────────────────────────────────────────────────────
async function destroy(req, res) {
  try {
    await lotService.deleteLot(req.params.id, CURRENT_USER.id);
    res.redirect('/?message=Лот видалено');
  } catch (err) {
    res.redirect(`/lots/${req.params.id}?error=${encodeURIComponent(err.message)}`);
  }
}

// ─── ЗАПУСТИТИ ТОРГИ ──────────────────────────────────────────────────────
async function startTrading(req, res) {
  try {
    await lotService.startTrading(req.params.id, CURRENT_USER.id);
    res.redirect(`/lots/${req.params.id}?message=Торги розпочато`);
  } catch (err) {
    res.redirect(`/lots/${req.params.id}?error=${encodeURIComponent(err.message)}`);
  }
}

// ─── ЗУПИНИТИ ТОРГИ ───────────────────────────────────────────────────────
async function stopTrading(req, res) {
  try {
    await lotService.stopTrading(req.params.id, CURRENT_USER.id);
    res.redirect(`/lots/${req.params.id}?message=Торги зупинено`);
  } catch (err) {
    res.redirect(`/lots/${req.params.id}?error=${encodeURIComponent(err.message)}`);
  }
}

// ─── МОЇ ЛОТИ ────────────────────────────────────────────────────────────
async function myLots(req, res) {
  try {
    const lots = await lotService.getLotsByOwner(CURRENT_USER.id);
    res.render('lots/my', {
      title: 'Мої лоти',
      lots,
      currentUser: CURRENT_USER,
      message: req.query.message || null,
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Помилка', message: err.message });
  }
}

// ─── ДЕМО МЕТОДІВ ВВ ─────────────────────────────────────────────────────
function ioDemo(req, res) {
  lotService.demoAllIOApproaches((results) => {
    res.render('lots/io-demo', {
      title: 'Демо методів вводу-виводу',
      results,
      currentUser: CURRENT_USER,
    });
  });
}

module.exports = { index, show, newForm, create, bid, destroy, startTrading, stopTrading, myLots, ioDemo };
