// Ольга Сибирь — лендинг. Без внешних библиотек, без сетевых запросов.
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- Переключатель темы (только для примерки) ---------- */
  var themeButtons = document.querySelectorAll('.theme-btn');

  function setTheme(value) {
    if (value === 'evening') {
      root.setAttribute('data-theme', 'evening');
    } else {
      root.removeAttribute('data-theme');
    }
    themeButtons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-theme-value') === value);
    });
  }

  themeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTheme(btn.getAttribute('data-theme-value'));
    });
  });

  /* ---------- Reveal-анимации на скролле ---------- */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');

  if (!prefersReduced && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    // Без анимаций контент виден сразу
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Демо-обработка формы ---------- */
  var form = document.getElementById('lead-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      // TODO: подключить отправку на email Ольги (адрес уточняется)
      var done = document.createElement('div');
      done.className = 'form-done';
      done.setAttribute('role', 'status');
      done.textContent = 'Спасибо! Я свяжусь с вами в ближайшее время.';
      form.replaceWith(done);
    });
  }

  /* ---------- Квиз-подбор с ветвлением (демо-режим) ---------- */
  var quizSteps = document.querySelectorAll('.quiz-step');
  if (quizSteps.length) {
    var quizBar = document.getElementById('quizBar');
    var quizStepNum = document.getElementById('quizStepNum');
    var quizDone = document.getElementById('quizDone');
    var quizDoneText = document.getElementById('quizDoneText');
    var quizForm = document.getElementById('quizForm');
    var quizFormTitle = document.getElementById('quizFormTitle');
    var quizSubmit = document.getElementById('quizSubmit');

    // Обе ветки (покупатель/продавец) всегда длиной 5 шагов
    var PATH_LEN = 5;

    // Индекс шагов по строковому id + ответы, привязанные к шагу (не «навсегда»)
    var stepById = {};
    var answerByStep = {}; // { goal: {q:'Цель', v:'…'}, … }
    quizSteps.forEach(function (s) { stepById[s.getAttribute('data-step')] = s; });

    // Стек истории пройденных шагов; последний — текущий
    var history = ['goal'];

    var isSellerPath = function () { return history.indexOf('sell') !== -1; };

    // Тексты шага form и done-панели зависят от ветки
    var applyBranchTexts = function () {
      var seller = isSellerPath();
      if (quizFormTitle) {
        quizFormTitle.textContent = seller ? 'Куда прислать оценку вашего объекта?' : 'Куда прислать подборку?';
      }
      if (quizSubmit) {
        quizSubmit.textContent = seller ? 'Получить оценку от Ольги' : 'Получить подборку от Ольги';
      }
    };

    var render = function () {
      var id = history[history.length - 1];
      quizSteps.forEach(function (s) {
        s.classList.toggle('is-active', s.getAttribute('data-step') === id);
      });
      var n = history.length;
      if (quizBar) { quizBar.style.width = (n / PATH_LEN) * 100 + '%'; }
      if (quizStepNum) { quizStepNum.textContent = 'Шаг ' + n + ' из ' + PATH_LEN; }
      applyBranchTexts();
    };

    document.querySelectorAll('.quiz-opt').forEach(function (opt) {
      opt.addEventListener('click', function () {
        var step = opt.closest('.quiz-step');
        if (!step) { return; }
        var id = step.getAttribute('data-step');
        var question = step.getAttribute('data-question');
        if (question) {
          answerByStep[id] = { q: question, v: opt.getAttribute('data-value') || opt.textContent.trim() };
        }
        // Подсветка выбранного — видна при возврате «Назад»
        step.querySelectorAll('.quiz-opt').forEach(function (o) {
          o.classList.toggle('is-selected', o === opt);
        });
        // Переход: приоритет у data-goto на опции, иначе data-next шага
        var next = opt.getAttribute('data-goto') || step.getAttribute('data-next');
        if (next && stepById[next]) { history.push(next); render(); }
      });
    });

    document.querySelectorAll('.quiz-back[data-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (history.length > 1) { history.pop(); render(); }
      });
    });

    if (quizForm) {
      quizForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!quizForm.checkValidity()) {
          quizForm.reportValidity();
          return;
        }
        // Итоговые ответы — только по актуальному стеку (без «отрезанной» ветки)
        var answers = {};
        history.forEach(function (id) {
          var a = answerByStep[id];
          if (a) { answers[a.q] = a.v; }
        });
        // TODO: подключить отправку на email Ольги (заявка = имя, телефон + ответы квиза)
        if (quizDoneText) {
          quizDoneText.textContent = isSellerPath()
            ? 'Я свяжусь с вами в ближайшее время — пришлю оценку и план продажи.'
            : 'Я свяжусь с вами в ближайшее время — пришлю подборку и расчёт по вашей программе.';
        }
        quizSteps.forEach(function (s) { s.classList.remove('is-active'); });
        if (quizBar) { quizBar.style.width = '100%'; }
        if (quizStepNum) { quizStepNum.textContent = 'Готово'; }
        if (quizDone) { quizDone.classList.add('is-active'); }
      });
    }

    render(); // синхронизировать шаг/прогресс со стартом (goal, 20%)
  }
})();
