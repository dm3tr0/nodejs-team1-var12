/**
 * LotController — рівень контролерів (MVC)
 * Обробляє HTTP-запити та делегує логіку сервісному рівню.
 */

const lotService = require('../services/lotService');

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
      currentUser: req.user || null,
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
    const isOwner = req.user && lot.ownerId === req.user.id;

    res.render('lots/show', {
      title: lot.title,
      lot,
      lotUrl,
      isOwner,
      currentUser: req.user || null,
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
    currentUser: req.user || null,
    error: null,
  });
}

// ─── СТВОРИТИ ЛОТ ────────────────────────────────────────────────────────
async function create(req, res) {
  try {
    const lot = await lotService.createLot({
      ...req.body,
      ownerId: req.user.id,
      ownerName: req.user.name,
    });
    res.redirect(`/lots/${lot.id}?message=Лот успішно створено`);
  } catch (err) {
    res.render('lots/new', {
      title: 'Створити лот',
      currentUser: req.user || null,
      error: err.message,
    });
  }
}

// ─── ЗРОБИТИ СТАВКУ ──────────────────────────────────────────────────────
async function bid(req, res) {
  try {
    await lotService.placeBid(req.params.id, {
      bidderId: req.user.id,
      bidderName: req.user.name,
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
    await lotService.deleteLot(req.params.id, req.user.id);
    res.redirect('/?message=Лот видалено');
  } catch (err) {
    res.redirect(`/lots/${req.params.id}?error=${encodeURIComponent(err.message)}`);
  }
}

// ─── ЗАПУСТИТИ ТОРГИ ──────────────────────────────────────────────────────
async function startTrading(req, res) {
  try {
    await lotService.startTrading(req.params.id, req.user.id);
    res.redirect(`/lots/${req.params.id}?message=Торги розпочато`);
  } catch (err) {
    res.redirect(`/lots/${req.params.id}?error=${encodeURIComponent(err.message)}`);
  }
}

// ─── ЗУПИНИТИ ТОРГИ ───────────────────────────────────────────────────────
async function stopTrading(req, res) {
  try {
    await lotService.stopTrading(req.params.id, req.user.id);
    res.redirect(`/lots/${req.params.id}?message=Торги зупинено`);
  } catch (err) {
    res.redirect(`/lots/${req.params.id}?error=${encodeURIComponent(err.message)}`);
  }
}

// ─── МОЇ ЛОТИ ────────────────────────────────────────────────────────────
async function myLots(req, res) {
  try {
    const lots = await lotService.getLotsByOwner(req.user.id);
    res.render('lots/my', {
      title: 'Мої лоти',
      lots,
      currentUser: req.user || null,
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
      currentUser: req.user || null,
    });
  });
}

module.exports = { index, show, newForm, create, bid, destroy, startTrading, stopTrading, myLots, ioDemo };
