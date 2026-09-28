/* ============================================================
   js/views/learn.js
   The topic learning page - the heart of the learning platform.

   Route: #/learn?topic=<topicId>&view=<step>
   Steps: lesson | examples | practice | check | explain | challenge | mastery

   Draft answers and results live in module state (not the store) so a
   re-render never loses what you are typing.
   ============================================================ */
window.App = window.App || {};
App.views = App.views || {};

App.views.learn = (function () {
  'use strict';

  var U = App.utils, C = App.charts, icon = App.icons, HL = App.highlight;

  var meta = { title: 'Learning', subtitle: '' };

  /* Transient UI state - deliberately not persisted. */
  var ui = {
    topicId: null,
    view: 'lesson',
    level: 2,
    openExamples: {},
    drafts: {},        // exerciseId -> current answer in the editor
    results: {},       // exerciseId -> last evaluation result
    hintsShown: {},    // exerciseId -> number of hints revealed
    solutionShown: {}, // exerciseId -> bool
    running: {},       // exerciseId -> bool (a run is in flight)
    kcAnswers: {},     // questionId -> answer
    kcResult: null,
    challengeStart: null
  };

  /* ---------- Page-time tracking ---------- */
  var timer = { id: null, topicId: null, seconds: 0 };

  function startTimer(topicId) {
    if (timer.id && timer.topicId === topicId) return;
    stopTimer();
    timer.topicId = topicId;
    timer.seconds = 0;
    timer.id = setInterval(function () {
      // Only count while this topic's page is actually open.
      if (App.router.route() !== 'learn' || App.router.params().topic !== timer.topicId) {
        stopTimer();
        return;
      }
      timer.seconds += 1;
      // Flush every 30s WITHOUT notifying, so nobody loses focus mid-sentence.
      if (timer.seconds % 30 === 0) flushTime(true);
    }, 1000);
  }

  function flushTime(silent) {
    if (!timer.topicId || !timer.seconds) return;
    var topicId = timer.topicId, secs = timer.seconds;
    timer.seconds = 0;
    App.store.update(function (s) {
      var t = s.topics.filter(function (x) { return x.id === topicId; })[0];
      if (t && t.learning) t.learning.seconds += secs;
    }, { silent: !!silent });
  }

  function stopTimer() {
    if (timer.id) { flushTime(true); clearInterval(timer.id); timer.id = null; }
  }

  /* ============================================================
     Render
     ============================================================ */

  function render(root) {
    var params = App.router.params();
    var topicId = params.topic;
    var topic = topicId ? App.store.topicById(topicId) : null;

    if (!topic) {
      root.innerHTML = App.ui.emptyState('Topic not found',
        'That topic no longer exists. Pick one from the roadmap.',
        '<button class="btn btn--primary btn--sm" data-goto="roadmap">Open the roadmap</button>');
      wireGlobal(root);
      return;
    }

    // Switching topic resets the transient state.
    if (ui.topicId !== topicId) {
      ui = Object.assign(ui, {
        topicId: topicId, view: params.view || 'lesson', level: 2,
        lastParamView: params.view || null,
        openExamples: {}, drafts: {}, results: {}, hintsShown: {},
        solutionShown: {}, running: {}, kcAnswers: {}, kcResult: null, challengeStart: null
      });
    } else if (params.view && params.view !== ui.lastParamView) {
      // A NEW ?view= in the URL wins once. Without the lastParamView guard,
      // every in-page re-render would drag you back to the view in the URL.
      ui.view = params.view;
      ui.lastParamView = params.view;
    }

    var lesson = App.lessons.get(topicId);
    meta.title = topic.name;
    meta.subtitle = (App.PHASE_BY_ID[topic.phaseId] || {}).name || '';

    startTimer(topicId);

    if (!lesson) {
      root.innerHTML = noLessonPage(topic);
      wireGlobal(root);
      return;
    }

    var flow = App.lessons.steps(topic);

    root.innerHTML =
      '<div class="learn">' +
        '<aside class="learn__side">' + sideNav(topic, flow) + '</aside>' +
        '<div class="learn__main">' +
          header(topic, lesson, flow) +
          '<div id="learn-body">' + body(topic, lesson, flow) + '</div>' +
          footerNav(topic) +
        '</div>' +
      '</div>';

    wireGlobal(root);
    wireBody(root, topic, lesson);
  }

  /* ---------- Header ---------- */

  function header(topic, lesson, flow) {
    var phase = App.PHASE_BY_ID[topic.phaseId] || {};
    var mins = App.lessons.remainingMinutes(topic);
    var manual = App.mastery.isManual(topic);

    return '<div class="lhead">' +
      '<div class="lhead__crumbs">' +
        '<a href="#/roadmap?phase=' + U.escapeHtml(topic.phaseId) + '">' + U.escapeHtml(phase.name || '') + '</a>' +
        ' › ' + U.escapeHtml(topic.name) +
      '</div>' +
      '<h1>' + U.escapeHtml(lesson.title) + '</h1>' +
      '<div class="lhead__meta">' +
        App.ui.statusBadge(topic.status) +
        (manual ? '<span class="badge badge--warn" title="You set this status by hand">Manual override</span>' : '') +
        '<span class="badge badge--muted">' + U.escapeHtml(lesson.difficulty) + '</span>' +
        '<span class="badge badge--muted">' + icon('clock', 11) + ' ~' + lesson.estimatedMinutes + ' min</span>' +
        '<span class="badge badge--accent">Level ' + (topic.learning.level || 1) + ' of 5</span>' +
        (topic.learning.needsRevision ? '<span class="badge badge--danger">Needs revision</span>' : '') +
      '</div>' +
      '<div class="lhead__bar">' +
        C.progressBar(flow.percent, 'var(--accent)', true) +
        '<span class="lhead__pct">' + flow.percent + '%</span>' +
      '</div>' +
      '<div class="small faint" style="margin-top:7px">' +
        'Spent ' + U.fmtDuration(mins.spent) + ' of ~' + mins.estimate + ' min' +
        (flow.next ? ' · next: <b>' + U.escapeHtml(App.lessons.nextActionLabel(topic)) + '</b>' : ' · all steps complete') +
      '</div>' +
    '</div>';
  }

  /* ---------- Side navigation ---------- */

  function sideNav(topic, flow) {
    var viewOf = { lesson: 'lesson', examples: 'examples', guided: 'practice',
                   independent: 'practice', applied: 'practice', knowledge: 'check',
                   explain: 'explain', challenge: 'challenge' };
    var levelOf = { guided: 2, independent: 3, applied: 4 };

    var items = flow.steps.map(function (s) {
      var view = viewOf[s.id];
      var isActive = ui.view === view &&
        (levelOf[s.id] === undefined || ui.level === levelOf[s.id]);
      return '<button class="lstep' + (s.complete ? ' is-done' : s.started ? ' is-partial' : '') +
        (isActive ? ' is-active' : '') + '" data-step="' + s.id + '">' +
        '<span class="lstep__mark">' + (s.complete ? icon('check', 11) : '') + '</span>' +
        '<span>' + U.escapeHtml(s.label) + '</span>' +
        (s.total > 1 ? '<span class="lstep__count">' + s.done + '/' + s.total + '</span>' : '') +
      '</button>';
    }).join('');

    return '<div class="learn__steps">' + items +
      '<button class="lstep' + (ui.view === 'mastery' ? ' is-active' : '') + '" data-step="mastery">' +
        '<span class="lstep__mark">' + icon('award', 11) + '</span><span>Mastery</span></button>' +
      '</div>' +
      '<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border-soft)">' +
        runnerBadge() +
      '</div>';
  }

  function runnerBadge() {
    var s = App.runner.status();
    if (s.available) {
      return '<div class="small" style="color:var(--ok);display:flex;gap:6px;align-items:flex-start">' +
        icon('check', 13) + '<span>C# runner connected<br><span class="faint">.NET ' +
        U.escapeHtml(s.version || '') + ' · code really compiles</span></span></div>';
    }
    return '<div class="small faint" style="display:flex;gap:6px;align-items:flex-start">' +
      icon('info', 13) + '<span>Static checks only.<br>Start <code>./start-runner.command</code> to compile and run real C#.</span></div>';
  }

  /* ---------- Body router ---------- */

  function body(topic, lesson, flow) {
    switch (ui.view) {
      case 'examples':  return examplesView(topic, lesson);
      case 'practice':  return practiceView(topic, lesson);
      case 'check':     return knowledgeCheckView(topic, lesson);
      case 'explain':   return explainView(topic, lesson);
      case 'challenge': return challengeView(topic, lesson);
      case 'mastery':   return masteryView(topic, lesson, flow);
      default:          return lessonView(topic, lesson);
    }
  }

  /* ============================================================
     1. Lesson
     ============================================================ */

  function lessonView(topic, lesson) {
    var L = topic.learning;

    var objectives = '<div class="card section">' +
      '<div class="card__head">' + icon('target', 16) + '<h2>What you will learn</h2></div>' +
      '<ul class="obj-list">' + lesson.objectives.map(function (o) {
        return '<li><span class="mark">' + icon('check', 14) + '</span><span>' + U.escapeHtml(o) + '</span></li>';
      }).join('') + '</ul>' +
      (lesson.prerequisites.length
        ? '<div class="small faint" style="margin-top:12px">Assumes you know: ' +
          lesson.prerequisites.map(function (id) {
            return '<a href="#/learn?topic=' + U.escapeHtml(id) + '">' +
              U.escapeHtml(App.store.topicName(id)) + '</a>';
          }).join(', ') + '</div>'
        : '') +
    '</div>';

    var sections = lesson.sections.map(function (sec, i) {
      var read = L.sectionsRead.indexOf(sec.id) > -1;
      return '<section class="lsec' + (read ? ' is-read' : '') + '" id="sec-' + U.escapeHtml(sec.id) + '">' +
        '<div class="lsec__head">' +
          '<span class="lsec__num">' + (read ? icon('check', 12) : (i + 1)) + '</span>' +
          '<h2>' + U.escapeHtml(sec.title) + '</h2>' +
        '</div>' +
        '<div class="prose">' + sec.blocks.map(renderBlock).join('') + '</div>' +
        '<div style="margin-top:12px">' +
          '<button class="btn btn--sm' + (read ? '' : ' btn--primary') + '" data-read="' + U.escapeHtml(sec.id) + '">' +
            (read ? icon('check', 13) + ' Marked as read' : 'Mark as read') + '</button>' +
        '</div>' +
      '</section>';
    }).join('');

    var mistakes = lesson.commonMistakes.length
      ? '<div class="card section"><div class="card__head">' + icon('alert', 16) +
        '<h2>Common mistakes</h2></div>' +
        lesson.commonMistakes.map(function (m) {
          return '<div class="mistake">' +
            '<div class="mistake__what">' + U.escapeHtml(m.mistake) + '</div>' +
            '<div class="mistake__why">Why it happens: ' + U.escapeHtml(m.why) + '</div>' +
            '<div class="mistake__fix">Fix: ' + U.escapeHtml(m.fix) + '</div>' +
          '</div>';
        }).join('') + '</div>'
      : '';

    var realWorld = lesson.realWorld.length
      ? '<div class="card section"><div class="card__head">' + icon('trending', 16) +
        '<h2>Where you meet this in real work</h2></div>' +
        '<ul class="prose" style="margin:0;padding-left:18px">' +
          lesson.realWorld.map(function (r) { return '<li>' + U.escapeHtml(r) + '</li>'; }).join('') +
        '</ul></div>'
      : '';

    return objectives + sections + mistakes + realWorld +
      '<div class="row" style="margin-top:18px">' +
        '<button class="btn btn--primary" data-step="examples">See the examples ' + icon('chevron', 14) + '</button>' +
      '</div>';
  }

  /** One lesson content block -> HTML. Lesson text is always escaped. */
  function renderBlock(b) {
    switch (b.type) {
      case 'code':
        return HL.block(b.code, { caption: b.caption });
      case 'list':
        return '<ul>' + (b.items || []).map(function (i) {
          return '<li>' + inlineMarkup(i) + '</li>';
        }).join('') + '</ul>';
      case 'analogy':
        return callout('analogy', 'Analogy', b.text);
      case 'warning':
        return callout('warning', 'Watch out', b.text);
      case 'note':
        return callout('note', 'Note', b.text);
      case 'whenNot':
        return callout('whennot', 'When not to use it', b.text);
      case 'table':
        return '<div class="table-wrap"><table class="ltable"><thead><tr>' +
          (b.head || []).map(function (h) { return '<th>' + U.escapeHtml(h) + '</th>'; }).join('') +
          '</tr></thead><tbody>' +
          (b.rows || []).map(function (r) {
            return '<tr>' + r.map(function (c) { return '<td>' + inlineMarkup(c) + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>';
      default:
        return '<p>' + inlineMarkup(b.text || '') + '</p>';
    }
  }

  function callout(kind, label, text) {
    return '<div class="callout callout--' + kind + '">' +
      '<span class="callout__label">' + U.escapeHtml(label) + '</span>' + inlineMarkup(text) + '</div>';
  }

  /**
   * Lesson text may use `code` and **bold**. Everything is escaped first,
   * so only these two markers can ever produce markup.
   */
  function inlineMarkup(text) {
    return U.escapeHtml(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  /* ============================================================
     2. Examples
     ============================================================ */

  function examplesView(topic, lesson) {
    var L = topic.learning;
    if (!lesson.examples.length) {
      return App.ui.emptyState('No examples for this topic', 'Move on to the exercises.');
    }

    return '<div class="section"><div class="section__head"><h2>Worked examples</h2>' +
      '<span class="spacer small faint">Open each one - the walkthrough explains it line by line</span></div>' +
      lesson.examples.map(function (ex) {
        var viewed = L.examplesViewed.indexOf(ex.id) > -1;
        var open = ui.openExamples[ex.id];
        return '<div class="example' + (open ? ' is-open' : '') + '">' +
          '<button class="example__head" data-example="' + U.escapeHtml(ex.id) + '">' +
            '<span class="lsec__num">' + (viewed ? icon('check', 12) : icon('book', 12)) + '</span>' +
            '<h3>' + U.escapeHtml(ex.title) + '</h3>' +
            '<span class="chev">' + icon('chevron', 16) + '</span>' +
          '</button>' +
          '<div class="example__body">' +
            HL.block(ex.code) +
            (ex.walkthrough.length
              ? '<ul class="walk">' + ex.walkthrough.map(function (w) {
                  return '<li><code>' + HL.highlight(w.line) + '</code><span>' + inlineMarkup(w.note) + '</span></li>';
                }).join('') + '</ul>'
              : '') +
            (ex.output
              ? '<div class="output-box"><span class="output-box__label">Output</span>' +
                U.escapeHtml(ex.output) + '</div>'
              : '') +
            (ex.takeaway ? callout('note', 'Takeaway', ex.takeaway) : '') +
          '</div>' +
        '</div>';
      }).join('') +
      '<div class="row" style="margin-top:18px">' +
        '<button class="btn btn--primary" data-step="guided">Start practising ' + icon('chevron', 14) + '</button>' +
      '</div></div>';
  }

  /* ============================================================
     3-5. Practice (levels 2, 3, 4)
     ============================================================ */

  function practiceView(topic, lesson) {
    var level = ui.level;
    var levelInfo = App.LEVELS.filter(function (l) { return l.level === level; })[0];
    var list = App.lessons.exercisesByLevel(lesson, level);

    if (!list.length) {
      return App.ui.emptyState('Nothing at this level', 'This lesson has no level-' + level + ' exercises.');
    }

    var tabs = [2, 3, 4].filter(function (l) {
      return App.lessons.exercisesByLevel(lesson, l).length > 0;
    }).map(function (l) {
      var info = App.LEVELS.filter(function (x) { return x.level === l; })[0];
      return '<button class="btn btn--sm' + (l === level ? ' btn--primary' : '') +
        '" data-level="' + l + '">Level ' + l + ' · ' + info.label + '</button>';
    }).join('');

    return '<div class="row" style="margin-bottom:14px">' + tabs + '</div>' +
      '<div class="callout callout--note" style="margin-bottom:18px">' +
        '<span class="callout__label">' + U.escapeHtml(levelInfo.label) + '</span>' +
        U.escapeHtml(levelInfo.blurb) +
        (level === 3 ? ' Hints are still available, but using one means this does not count as an independent solve.' : '') +
      '</div>' +
      list.map(function (ex, i) { return exerciseCard(topic, ex, i + 1); }).join('');
  }

  /* ---------- One exercise ---------- */

  function exerciseCard(topic, ex, index) {
    var state = App.lessons.exerciseState(topic.learning, ex.id);
    var result = ui.results[ex.id];
    var typeInfo = App.EXERCISE_TYPES[ex.type] || { label: ex.type };

    return '<div class="ex' + (state.passed ? ' is-passed' : '') + '" data-exercise="' + U.escapeHtml(ex.id) + '">' +
      '<div class="ex__head">' +
        '<div style="flex:1;min-width:0">' +
          '<div class="ex__title">' + index + '. ' + U.escapeHtml(typeInfo.label) + '</div>' +
          '<div class="ex__meta">' +
            '<span class="badge badge--muted">' + U.escapeHtml(ex.difficulty) + '</span>' +
            (state.passed ? '<span class="badge badge--ok">' + icon('check', 10) + ' Passed</span>' : '') +
            (state.attempts ? '<span class="badge badge--muted">' + U.pluralize(state.attempts, 'attempt') + '</span>' : '') +
            (state.independent ? '<span class="badge badge--accent">Solved unaided</span>' : '') +
            (state.hintsUsed ? '<span class="badge badge--warn">' + U.pluralize(state.hintsUsed, 'hint') + ' used</span>' : '') +
            (state.solutionViewed ? '<span class="badge badge--danger">Solution viewed</span>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ex__body">' +
        '<div class="ex__prompt">' + inlineMarkup(ex.prompt) + '</div>' +
        answerInput(ex) +
        hintArea(ex) +
        (result ? feedback(result) : '') +
      '</div>' +
      '<div class="ex__foot">' + exerciseButtons(ex, state) + '</div>' +
    '</div>';
  }

  function exerciseButtons(ex, state) {
    var isCode = ex.type === 'coding' || ex.type === 'refactor';
    var hintCount = (ex.hints || []).length;
    var shown = ui.hintsShown[ex.id] || 0;
    var runnerOn = App.runner.isAvailable();

    return (isCode && runnerOn
        ? '<button class="btn btn--sm" data-run="' + U.escapeHtml(ex.id) + '"' +
          (ui.running[ex.id] ? ' disabled' : '') + '>' + icon('play', 13) + ' ' +
          (ui.running[ex.id] ? 'Running...' : 'Run') + '</button>'
        : '') +
      '<button class="btn btn--sm btn--primary" data-check="' + U.escapeHtml(ex.id) + '">' +
        icon('check', 13) + ' ' + (isCode && runnerOn ? 'Run &amp; check' : 'Check answer') + '</button>' +
      (hintCount && shown < hintCount
        ? '<button class="btn btn--sm" data-hint="' + U.escapeHtml(ex.id) + '">' +
          'Show hint ' + (shown + 1) + ' of ' + hintCount + '</button>'
        : '') +
      (isCode ? '<button class="btn btn--sm btn--ghost" data-reset-code="' + U.escapeHtml(ex.id) + '">Reset code</button>' : '') +
      '<span class="spacer"></span>' +
      (ex.solution && !ui.solutionShown[ex.id]
        ? '<button class="btn btn--sm btn--ghost" data-solution="' + U.escapeHtml(ex.id) + '">Reveal solution</button>'
        : '');
  }

  /* ---------- Answer inputs, per exercise type ---------- */

  function answerInput(ex) {
    switch (ex.type) {
      case 'mcq':
        return mcqInput(ex.id, ex.options, ui.drafts[ex.id]);

      case 'predict-output':
        return (ex.code ? HL.block(ex.code, { caption: 'What does this print?' }) : '') +
          '<input type="text" class="input" data-answer="' + U.escapeHtml(ex.id) +
            '" placeholder="The exact output" value="' + U.escapeHtml(ui.drafts[ex.id] || '') + '">';

      case 'fill-blank':
        return (ex.code ? HL.block(ex.code, { caption: 'Fill in the blanks' }) : '') +
          '<div class="stack">' + (ex.blanks || []).map(function (b, i) {
            var val = (ui.drafts[ex.id] || [])[i] || '';
            return '<div class="field"><label>Blank ' + (i + 1) +
              (b.label ? ' — ' + U.escapeHtml(b.label) : '') + '</label>' +
              '<input type="text" class="input" data-blank="' + U.escapeHtml(ex.id) + '|' + i +
              '" value="' + U.escapeHtml(val) + '"></div>';
          }).join('') + '</div>';

      case 'explain':
      case 'design':
        return '<textarea class="textarea" rows="6" data-answer="' + U.escapeHtml(ex.id) +
          '" placeholder="Write it in your own words - no copying">' +
          U.escapeHtml(ui.drafts[ex.id] || '') + '</textarea>';

      case 'debug':
        return debugInput(ex);

      default: // coding, refactor
        return editor(ex.id, ui.drafts[ex.id] !== undefined ? ui.drafts[ex.id] : (ex.starterCode || ''));
    }
  }

  function mcqInput(id, options, current, namePrefix) {
    return '<div class="opts">' + (options || []).map(function (o, i) {
      var checked = String(current) === String(i);
      return '<label class="opt">' +
        '<input type="radio" name="' + U.escapeHtml((namePrefix || 'mcq-') + id) + '" ' +
          'data-choice="' + U.escapeHtml(id) + '" value="' + i + '"' + (checked ? ' checked' : '') + '>' +
        '<span>' + inlineMarkup(o) + '</span></label>';
    }).join('') + '</div>';
  }

  function debugInput(ex) {
    return (ex.brokenCode ? HL.block(ex.brokenCode, { caption: 'This code is wrong' }) : '') +
      (ex.steps || []).map(function (st, i) {
        var draft = (ui.drafts[ex.id] || {})[st.id];
        var input;
        if (st.type === 'mcq') {
          input = mcqInput(ex.id + '|' + st.id, st.options, draft, 'dbg-');
        } else if (st.type === 'coding') {
          input = editor(ex.id + '|' + st.id, draft !== undefined ? draft : (st.starterCode || ex.brokenCode || ''));
        } else {
          input = '<textarea class="textarea" rows="3" data-step-answer="' + U.escapeHtml(ex.id + '|' + st.id) +
            '" placeholder="In your own words">' + U.escapeHtml(draft || '') + '</textarea>';
        }
        return '<div style="margin-bottom:16px">' +
          '<div class="kc__num">Step ' + (i + 1) + '</div>' +
          '<div class="kc__prompt">' + inlineMarkup(st.question) + '</div>' + input +
        '</div>';
      }).join('');
  }

  /**
   * The code editor: a transparent textarea over a highlighted layer,
   * with a line-number gutter. Tab inserts spaces instead of moving focus.
   */
  function editor(id, code) {
    var lines = String(code).split('\n');
    return '<div class="editor" data-editor="' + U.escapeHtml(id) + '">' +
      '<div class="editor__bar">' + icon('topics', 12) + ' Program.cs' +
        '<span class="spacer"></span>' +
        '<button type="button" class="btn btn--sm btn--ghost" data-copy-editor="' + U.escapeHtml(id) + '">Copy</button>' +
      '</div>' +
      '<div class="editor__wrap">' +
        '<pre class="editor__gutter" data-gutter>' +
          lines.map(function (_, i) { return i + 1; }).join('\n') + '</pre>' +
        '<div class="editor__area">' +
          '<pre class="editor__hl" data-hl aria-hidden="true">' + HL.highlight(code) + '</pre>' +
          '<textarea class="editor__input" data-code="' + U.escapeHtml(id) + '" spellcheck="false" ' +
            'autocapitalize="off" autocomplete="off">' + U.escapeHtml(code) + '</textarea>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------- Hints and solution ---------- */

  function hintArea(ex) {
    var shown = ui.hintsShown[ex.id] || 0;
    var html = '';

    if (shown > 0) {
      html += '<div class="hints">' + (ex.hints || []).slice(0, shown).map(function (h, i) {
        return '<div class="hint"><span class="hint__label">Hint ' + (i + 1) + '</span>' + inlineMarkup(h) + '</div>';
      }).join('') + '</div>';
    }

    if (ui.solutionShown[ex.id] && ex.solution) {
      html += '<div class="solution">' +
        '<div class="solution__warn">' + icon('alert', 13) +
          ' You have seen the solution. This exercise now counts as assisted, not independent.</div>' +
        HL.block(ex.solution) +
        (ex.explanation ? '<div class="prose" style="margin-top:6px"><p>' + inlineMarkup(ex.explanation) + '</p></div>' : '') +
      '</div>';
    }
    return html;
  }

  /* ---------- Feedback ---------- */

  function feedback(result) {
    var cls = result.passed ? 'feedback--pass' : 'feedback--fail';
    var kindCls = result.kind === 'executed' ? 'kind-badge--executed'
                : result.kind === 'self-assessed' ? 'kind-badge--self' : '';

    return '<div class="feedback ' + cls + '">' +
      '<div class="feedback__head">' +
        (result.passed ? icon('check', 16) : icon('x', 16)) +
        '<span>' + U.escapeHtml(result.message || (result.passed ? 'Passed' : 'Not yet')) + '</span>' +
        '<span class="spacer"></span>' +
        '<span class="kind-badge ' + kindCls + '">' + U.escapeHtml(App.exercises.kindLabel(result.kind)) + '</span>' +
      '</div>' +
      (result.results && result.results.length
        ? '<ul class="feedback__list">' + result.results.map(function (r) {
            return '<li class="' + (r.ok ? 'ok' : 'no') + '"><span class="mark">' +
              icon(r.ok ? 'check' : 'x', 13) + '</span><span>' + U.escapeHtml(r.label) + '</span></li>';
          }).join('') + '</ul>'
        : '') +
      (result.stdout !== undefined && result.stdout !== null && result.stdout !== ''
        ? '<div class="output-box" style="margin-top:10px"><span class="output-box__label">Program output</span>' +
          U.escapeHtml(result.stdout) + '</div>'
        : '') +
      (result.diagnostics && result.diagnostics.length
        ? '<div class="output-box output-box--error" style="margin-top:10px">' +
          '<span class="output-box__label">Compiler</span>' +
          result.diagnostics.map(function (d) {
            return U.escapeHtml('Line ' + d.line + ': ' + d.code + ' — ' + d.message);
          }).join('\n') + '</div>'
        : '') +
      (result.runtimeError
        ? '<div class="output-box output-box--error" style="margin-top:10px">' +
          '<span class="output-box__label">Runtime error</span>' + U.escapeHtml(result.runtimeError) + '</div>'
        : '') +
      (result.expected !== undefined && !result.passed
        ? '<div class="output-box" style="margin-top:10px"><span class="output-box__label">Expected output</span>' +
          U.escapeHtml(result.expected) + '</div>'
        : '') +
    '</div>';
  }

  /* ============================================================
     6. Knowledge check
     ============================================================ */

  function knowledgeCheckView(topic, lesson) {
    var L = topic.learning;
    var pass = lesson.mastery.knowledgeCheckPass;

    if (!lesson.knowledgeChecks.length) {
      return App.ui.emptyState('No knowledge check', 'This lesson has no end-of-topic questions.');
    }

    var scoreCard = ui.kcResult
      ? '<div class="card section ' + (ui.kcResult.passed ? '' : '') + '">' +
          '<div class="kc-score">' +
            '<div class="kc-score__big" style="color:' + (ui.kcResult.passed ? 'var(--ok)' : 'var(--danger)') + '">' +
              ui.kcResult.score + '%</div>' +
            '<div><div style="font-weight:650">' +
              (ui.kcResult.passed ? 'Passed' : 'Not passed yet') + '</div>' +
              '<div class="small muted">' + ui.kcResult.correct + ' of ' + ui.kcResult.total +
              ' correct · ' + pass + '% needed</div></div>' +
            '<span class="spacer"></span>' +
            '<button class="btn btn--sm" data-kc-retry>Try again</button>' +
          '</div>' +
        '</div>'
      : '';

    var previous = L.knowledgeCheck.attempts
      ? '<div class="small faint" style="margin-bottom:14px">Best so far: <b>' +
        L.knowledgeCheck.bestScore + '%</b> over ' + U.pluralize(L.knowledgeCheck.attempts, 'attempt') + '.</div>'
      : '<div class="small faint" style="margin-bottom:14px">Answer from memory. Do not scroll back to the lesson.</div>';

    var questions = lesson.knowledgeChecks.map(function (q, i) {
      var answered = ui.kcResult && ui.kcResult.perQuestion[q.id];
      return '<div class="kc__q">' +
        '<div class="kc__num">Question ' + (i + 1) + ' · ' +
          U.escapeHtml((App.EXERCISE_TYPES[q.type] || {}).label || q.type) + '</div>' +
        '<div class="kc__prompt">' + inlineMarkup(q.prompt) + '</div>' +
        (q.code ? HL.block(q.code) : '') +
        kcInput(q) +
        (answered
          ? '<div class="feedback ' + (answered.ok ? 'feedback--pass' : 'feedback--fail') + '" style="margin-top:10px">' +
              '<div class="feedback__head">' + icon(answered.ok ? 'check' : 'x', 15) +
              '<span>' + (answered.ok ? 'Correct' : 'Not correct') + '</span></div>' +
              (q.explanation ? '<div class="small">' + inlineMarkup(q.explanation) + '</div>' : '') +
            '</div>'
          : '') +
      '</div>';
    }).join('');

    return scoreCard + previous +
      '<div class="card"><div class="card__head">' + icon('award', 16) + '<h2>Knowledge check</h2>' +
        '<span class="spacer badge badge--muted">' + lesson.knowledgeChecks.length + ' questions</span></div>' +
        questions +
      '</div>' +
      '<div class="row" style="margin-top:16px">' +
        '<button class="btn btn--primary" data-kc-submit>Submit answers</button>' +
        '<span class="small faint">You need ' + pass + '% to pass.</span>' +
      '</div>';
  }

  function kcInput(q) {
    if (q.type === 'mcq') return mcqInput(q.id, q.options, ui.kcAnswers[q.id], 'kc-');
    return '<textarea class="textarea" rows="' + (q.type === 'explain' ? 4 : 2) +
      '" data-kc="' + U.escapeHtml(q.id) + '" placeholder="' +
      U.escapeHtml(q.placeholder || 'Your answer') + '">' +
      U.escapeHtml(ui.kcAnswers[q.id] || '') + '</textarea>';
  }

  /* ============================================================
     7. Explain it / notes
     ============================================================ */

  function explainView(topic, lesson) {
    var L = topic.learning;
    var len = L.explanation.trim().length;

    return '<div class="card section">' +
      '<div class="card__head">' + icon('book', 16) + '<h2>Explain it in your own words</h2></div>' +
      '<p class="small muted">If you cannot explain it simply, you do not understand it yet. ' +
        'Write as if you were teaching a colleague who has never seen ' + U.escapeHtml(lesson.title) + '. ' +
        'This is required for mastery.</p>' +
      '<textarea class="textarea" rows="7" data-explanation placeholder="' +
        U.escapeHtml('What is it? Why does it exist? When would you use it, and when would you not?') + '">' +
        U.escapeHtml(L.explanation) + '</textarea>' +
      '<div class="row" style="margin-top:10px">' +
        '<button class="btn btn--primary btn--sm" data-save-explanation>Save explanation</button>' +
        '<span class="small faint">' + len + ' characters · 80 needed</span>' +
      '</div>' +
    '</div>' +

    '<div class="card section">' +
      '<div class="card__head">' + icon('alert', 16) + '<h2>What I still don\'t understand</h2></div>' +
      '<p class="small muted">Being unsure is not failure - it is the most useful thing you can write down. ' +
        'It becomes the starting point of your next session.</p>' +
      '<textarea class="textarea" rows="4" data-unclear placeholder="' +
        U.escapeHtml('e.g. I still cannot predict when a value type gets copied') + '">' +
        U.escapeHtml(L.stillUnclear) + '</textarea>' +
      '<div class="row" style="margin-top:10px">' +
        '<button class="btn btn--sm" data-save-unclear>Save</button>' +
        '<label class="check-row"><input type="checkbox" data-needs-revision ' +
          (L.needsRevision ? 'checked' : '') + '> <span>Flag this topic as needing revision</span></label>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card__head">' + icon('edit', 16) + '<h2>Personal notes</h2>' +
        '<button class="btn btn--sm spacer" data-edit-topic="' + U.escapeHtml(topic.id) + '">Edit all topic fields</button></div>' +
      (topic.notes ? '<div class="note-box">' + U.escapeHtml(topic.notes) + '</div>'
                   : '<p class="small faint">No notes yet.</p>') +
      (topic.mistakes ? '<div class="stat__label" style="margin:12px 0 5px">Your recorded mistakes</div>' +
        '<div class="note-box">' + U.escapeHtml(topic.mistakes) + '</div>' : '') +
    '</div>';
  }

  /* ============================================================
     8. No-help challenge
     ============================================================ */

  function challengeView(topic, lesson) {
    var L = topic.learning;
    var list = App.lessons.exercisesByLevel(lesson, 5);
    if (!list.length) return App.ui.emptyState('No challenge', 'This lesson has no no-help challenge.');
    var ex = list[0];

    if (!ui.challengeStart && !L.challenge.passed) {
      return '<div class="challenge-rules">' +
          '<h3>' + icon('target', 15) + ' No-help challenge</h3>' +
          '<ul>' +
            '<li>No AI assistance.</li>' +
            '<li>No hints - they are switched off for this exercise.</li>' +
            '<li>No solution until you have finished and asked for it.</li>' +
            '<li>No copying from the lesson or your notes.</li>' +
            '<li>Solve it independently. That is the whole point.</li>' +
          '</ul>' +
          '<p class="small" style="margin-top:10px;color:var(--text-muted)">' +
            'Your time and attempts are recorded, pass or fail. Failing honestly is worth ' +
            'more than passing with help.</p>' +
        '</div>' +
        (L.challenge.attempts
          ? '<div class="small faint" style="margin-bottom:14px">' +
            U.pluralize(L.challenge.attempts, 'previous attempt') + ', not yet passed.</div>'
          : '') +
        '<button class="btn btn--primary" data-challenge-start>' + icon('play', 14) + ' Start the challenge</button>';
    }

    var state = App.lessons.exerciseState(L, ex.id);
    var result = ui.results[ex.id];

    return (L.challenge.passed
        ? '<div class="callout callout--note" style="border-left-color:var(--ok)">' +
          '<span class="callout__label" style="color:var(--ok)">Passed</span>' +
          'You completed this challenge' +
          (L.challenge.bestSeconds ? ' in ' + U.fmtDuration(Math.round(L.challenge.bestSeconds / 60)) : '') +
          ' after ' + U.pluralize(L.challenge.attempts, 'attempt') + '.</div>'
        : '<div class="row" style="margin-bottom:14px">' +
          '<span class="badge badge--danger">No-help mode</span>' +
          '<span class="challenge-timer" id="challenge-timer">00:00</span>' +
          '<span class="spacer"></span>' +
          '<span class="small faint">Hints are disabled</span></div>') +

      '<div class="ex' + (state.passed ? ' is-passed' : '') + '" data-exercise="' + U.escapeHtml(ex.id) + '">' +
        '<div class="ex__head"><div style="flex:1"><div class="ex__title">' +
          U.escapeHtml(ex.title || 'Challenge') + '</div>' +
          '<div class="ex__meta"><span class="badge badge--muted">' + U.escapeHtml(ex.difficulty) + '</span>' +
          (state.passed ? '<span class="badge badge--ok">Passed</span>' : '') + '</div></div></div>' +
        '<div class="ex__body">' +
          '<div class="ex__prompt">' + inlineMarkup(ex.prompt) + '</div>' +
          answerInput(ex) +
          (ui.solutionShown[ex.id] && ex.solution
            ? '<div class="solution" style="margin-top:12px">' + HL.block(ex.solution) +
              (ex.explanation ? '<div class="prose"><p>' + inlineMarkup(ex.explanation) + '</p></div>' : '') + '</div>'
            : '') +
          (result ? feedback(result) : '') +
        '</div>' +
        '<div class="ex__foot">' +
          (App.runner.isAvailable() && (ex.type === 'coding' || ex.type === 'refactor')
            ? '<button class="btn btn--sm" data-run="' + U.escapeHtml(ex.id) + '">' + icon('play', 13) + ' Run</button>' : '') +
          '<button class="btn btn--sm btn--primary" data-challenge-submit="' + U.escapeHtml(ex.id) + '">' +
            'Submit challenge</button>' +
          '<span class="spacer"></span>' +
          ((state.attempts || L.challenge.passed) && ex.solution && !ui.solutionShown[ex.id]
            ? '<button class="btn btn--sm btn--ghost" data-solution="' + U.escapeHtml(ex.id) + '">Show solution</button>'
            : '<span class="small faint">Solution unlocks after your first submission</span>') +
        '</div>' +
      '</div>';
  }

  /* ============================================================
     9. Mastery panel
     ============================================================ */

  function masteryView(topic, lesson, flow) {
    var m = App.mastery.evaluate(topic);
    var d = m.demonstrated;
    var L = topic.learning;

    var scoreRow = function (label, stored, demo) {
      return '<tr><td>' + U.escapeHtml(label) + '</td>' +
        '<td>' + C.pips(stored, C.scoreTone(stored)) + ' <span class="small faint tnum">' + stored + '</span></td>' +
        '<td>' + (demo === null
          ? '<span class="faint small">no evidence yet</span>'
          : C.pips(demo, C.scoreTone(demo)) + ' <span class="small faint tnum">' + demo + '</span>') + '</td></tr>';
    };

    var ladder = App.LEVELS.map(function (l) {
      var reached = (L.level || 1) >= l.level;
      return '<div class="ladder__row' + (reached ? ' is-reached' : '') +
        ((L.level || 1) === l.level ? ' is-current' : '') + '">' +
        '<span class="ladder__dot">' + l.level + '</span>' +
        '<div><b>' + U.escapeHtml(l.label) + '</b><br><small>' + U.escapeHtml(l.blurb) + '</small></div></div>';
    }).join('');

    var reqList = function (reqs) {
      return '<ul class="reqs">' + reqs.map(function (r) {
        return '<li class="' + (r.met ? 'met' : '') + '"><span class="mark">' +
          icon(r.met ? 'check' : 'x', 13) + '</span><span>' + U.escapeHtml(r.label) + '</span></li>';
      }).join('') + '</ul>';
    };

    return '<div class="grid grid--2 section">' +
      '<div class="card"><div class="card__head">' + icon('award', 16) + '<h2>Comfortable</h2>' +
        '<span class="spacer badge badge--' + (m.comfortable.met ? 'ok' : 'muted') + '">' +
          (m.comfortable.met ? 'Earned' : 'Not yet') + '</span></div>' +
        reqList(m.comfortable.requirements) + '</div>' +
      '<div class="card"><div class="card__head">' + icon('award', 16) + '<h2>Mastered</h2>' +
        '<span class="spacer badge badge--' + (m.mastered.met ? 'ok' : 'muted') + '">' +
          (m.mastered.met ? 'Earned' : 'Not yet') + '</span></div>' +
        reqList(m.mastered.requirements) + '</div>' +
    '</div>' +

    '<div class="card section"><div class="card__head">' + icon('statistics', 16) + '<h2>Scores</h2>' +
      '<span class="spacer small faint">Stored vs demonstrated</span></div>' +
      '<div class="table-wrap"><table class="tbl">' +
        '<thead><tr><th>Skill</th><th>Stored</th><th>Demonstrated by your work</th></tr></thead><tbody>' +
        scoreRow('Understanding', topic.understanding, d.understanding) +
        scoreRow('Coding', topic.coding, d.coding) +
        scoreRow('Problem solving', topic.problemSolving, d.problemSolving) +
        scoreRow('Debugging', topic.debugging, d.debugging) +
        '</tbody></table></div>' +
      '<p class="small faint" style="margin-top:12px">Demonstrated scores come only from exercises you passed, ' +
        'the knowledge check and the challenge. Time spent reading never changes them. ' +
        'A demonstrated score raises the stored score but never lowers it.</p>' +
    '</div>' +

    '<div class="grid grid--2">' +
      '<div class="card"><div class="card__head">' + icon('roadmap', 16) + '<h2>Difficulty progression</h2></div>' +
        '<div class="ladder">' + ladder + '</div></div>' +
      '<div class="card"><div class="card__head">' + icon('settings', 16) + '<h2>Status</h2></div>' +
        '<p class="small muted">Status is earned from evidence. You can still set it by hand - it will be ' +
          'labelled as a manual override everywhere it appears.</p>' +
        '<div class="row" style="margin-top:12px">' +
          '<select class="select" data-manual-status style="max-width:200px">' +
            App.STATUSES.map(function (s) {
              return '<option value="' + s.id + '"' + (topic.status === s.id ? ' selected' : '') + '>' +
                s.label + '</option>';
            }).join('') +
          '</select>' +
          (App.mastery.isManual(topic)
            ? '<button class="btn btn--sm" data-clear-manual>Use earned status (' +
              U.escapeHtml((App.STATUS_BY_ID[m.earnedStatus] || {}).label || m.earnedStatus) + ')</button>'
            : '<span class="small faint">Earned: ' +
              U.escapeHtml((App.STATUS_BY_ID[m.earnedStatus] || {}).label || m.earnedStatus) + '</span>') +
        '</div>' +
        '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border-soft)">' +
          '<div class="stat__label" style="margin-bottom:8px">Review</div>' +
          (topic.nextReview
            ? '<p class="small">Next review <b>' + U.relativeDay(topic.nextReview) + '</b> (' +
              U.fmtDate(topic.nextReview) + ')</p>'
            : '<p class="small faint">Not scheduled yet.</p>') +
          '<button class="btn btn--sm btn--primary" style="margin-top:8px" data-rate-topic>' +
            'Rate difficulty and schedule review</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------- No lesson yet ---------- */

  function noLessonPage(topic) {
    var phase = App.PHASE_BY_ID[topic.phaseId] || {};
    return '<div class="learn__main" style="max-width:720px">' +
      '<div class="lhead">' +
        '<div class="lhead__crumbs"><a href="#/roadmap?phase=' + U.escapeHtml(topic.phaseId) + '">' +
          U.escapeHtml(phase.name || '') + '</a> › ' + U.escapeHtml(topic.name) + '</div>' +
        '<h1>' + U.escapeHtml(topic.name) + '</h1>' +
        '<div class="lhead__meta">' + App.ui.statusBadge(topic.status) +
          '<span class="lesson-pill lesson-pill--none">Lesson not written yet</span></div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card__head">' + icon('info', 16) + '<h2>This topic is on the roadmap, but has no lesson yet</h2></div>' +
        '<p class="small muted">The curriculum lists all ' + App.store.get().topics.length +
          ' topics. Written lessons currently cover <b>' + App.lessons.all().length +
          '</b> of them. You can still track this topic by hand - set its status, scores, ' +
          'notes and review dates exactly as before.</p>' +
        '<div class="row" style="margin-top:14px">' +
          '<button class="btn btn--primary" data-edit-topic="' + U.escapeHtml(topic.id) + '">Track it manually</button>' +
          '<button class="btn" data-goto="roadmap">Back to roadmap</button>' +
        '</div>' +
        '<p class="small faint" style="margin-top:14px">Lessons live in <code>js/data/lessons/</code>. ' +
          'The README explains how to add one.</p>' +
      '</div>' +
    '</div>';
  }

  /* ---------- Footer navigation ---------- */

  function footerNav(topic) {
    var n = App.lessons.neighbours(topic.id);
    return '<div class="learn__nav">' +
      (n.prev ? '<button class="btn" data-goto-topic="' + U.escapeHtml(n.prev.id) + '">' +
        '← ' + U.escapeHtml(n.prev.name) + '</button>' : '') +
      '<span class="spacer"></span>' +
      (n.next ? '<button class="btn btn--primary" data-goto-topic="' + U.escapeHtml(n.next.id) + '">' +
        U.escapeHtml(n.next.name) + ' →</button>' : '') +
    '</div>';
  }

  /* ============================================================
     Events
     ============================================================ */

  function refresh() { App.router.refresh(); }

  function findExercise(lesson, id) {
    return lesson.exercises.filter(function (x) { return x.id === id; })[0];
  }

  /** Links that work even when there is no lesson. */
  function wireGlobal(root) {
    root.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-goto]'))) {
        App.router.go(t.getAttribute('data-goto'));
      } else if ((t = e.target.closest('[data-goto-topic]'))) {
        flushTime(true);
        App.router.go('learn', { topic: t.getAttribute('data-goto-topic') });
      } else if ((t = e.target.closest('[data-edit-topic]'))) {
        App.topicForm.open(t.getAttribute('data-edit-topic'));
      } else if ((t = e.target.closest('[data-copy-code]'))) {
        var code = t.closest('.codeblock').querySelector('.codeblock__code').textContent;
        copyText(code, t);
      }
    });
  }

  function copyText(text, button) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        App.ui.toast('Copied', 'ok', 1200);
        if (button) { var old = button.innerHTML; button.innerHTML = 'Copied'; 
          setTimeout(function () { button.innerHTML = old; }, 1200); }
      }).catch(function () { App.ui.toast('Could not copy', 'warn'); });
    } else {
      App.ui.toast('Clipboard not available in this browser', 'warn');
    }
  }

  function wireBody(root, topic, lesson) {
    /* ---- clicks ---- */
    root.addEventListener('click', function (e) {
      var t;

      if ((t = e.target.closest('[data-step]'))) {
        var step = t.getAttribute('data-step');
        var map = { lesson: ['lesson'], examples: ['examples'], guided: ['practice', 2],
                    independent: ['practice', 3], applied: ['practice', 4],
                    knowledge: ['check'], explain: ['explain'], challenge: ['challenge'],
                    mastery: ['mastery'] };
        var target = map[step];
        if (target) {
          ui.view = target[0];
          if (target[1]) ui.level = target[1];
          refresh();
          document.getElementById('view').scrollIntoView({ block: 'start' });
        }
        return;
      }

      if ((t = e.target.closest('[data-level]'))) {
        ui.level = Number(t.getAttribute('data-level'));
        refresh();
        return;
      }

      if ((t = e.target.closest('[data-read]'))) {
        var secId = t.getAttribute('data-read');
        App.store.updateLearning(topic.id, function (L) {
          L.lessonViewed = true;
          if (L.sectionsRead.indexOf(secId) === -1) L.sectionsRead.push(secId);
        });
        App.mastery.recompute(topic.id);
        return;
      }

      if ((t = e.target.closest('[data-example]'))) {
        var exId = t.getAttribute('data-example');
        ui.openExamples[exId] = !ui.openExamples[exId];
        if (ui.openExamples[exId]) {
          App.store.updateLearning(topic.id, function (L) {
            if (L.examplesViewed.indexOf(exId) === -1) L.examplesViewed.push(exId);
          });
        } else {
          refresh();
        }
        return;
      }

      if ((t = e.target.closest('[data-hint]'))) {
        var hid = t.getAttribute('data-hint');
        ui.hintsShown[hid] = (ui.hintsShown[hid] || 0) + 1;
        // Using a hint is recorded immediately, even if you never submit.
        App.store.recordExerciseHint(topic.id, hid, ui.hintsShown[hid]);
        return;
      }

      if ((t = e.target.closest('[data-solution]'))) {
        var sid = t.getAttribute('data-solution');
        App.ui.confirm({
          title: 'Reveal the solution?',
          message: 'This exercise will be recorded as assisted, and will no longer count as an independent solve.',
          confirmLabel: 'Show me', danger: true
        }).then(function (ok) {
          if (!ok) return;
          ui.solutionShown[sid] = true;
          App.store.recordExerciseSolutionViewed(topic.id, sid);
        });
        return;
      }

      if ((t = e.target.closest('[data-reset-code]'))) {
        var rid = t.getAttribute('data-reset-code');
        var rex = findExercise(lesson, rid);
        delete ui.drafts[rid];
        if (rex) ui.drafts[rid] = rex.starterCode || '';
        refresh();
        return;
      }

      if ((t = e.target.closest('[data-copy-editor]'))) {
        var cid = t.getAttribute('data-copy-editor');
        var area = root.querySelector('[data-code="' + cssEscape(cid) + '"]');
        if (area) copyText(area.value, t);
        return;
      }

      if ((t = e.target.closest('[data-run]'))) {
        runOnly(root, topic, lesson, t.getAttribute('data-run'));
        return;
      }

      if ((t = e.target.closest('[data-check]'))) {
        checkExercise(root, topic, lesson, t.getAttribute('data-check'));
        return;
      }

      if (e.target.closest('[data-kc-submit]')) { submitKnowledgeCheck(root, topic, lesson); return; }
      if (e.target.closest('[data-kc-retry]')) { ui.kcResult = null; ui.kcAnswers = {}; refresh(); return; }

      if (e.target.closest('[data-save-explanation]')) {
        var ta = root.querySelector('[data-explanation]');
        App.store.updateLearning(topic.id, function (L) { L.explanation = ta.value; });
        App.mastery.recompute(topic.id);
        App.ui.toast('Explanation saved', 'ok');
        return;
      }

      if (e.target.closest('[data-save-unclear]')) {
        var tu = root.querySelector('[data-unclear]');
        App.store.updateLearning(topic.id, function (L) { L.stillUnclear = tu.value; });
        App.ui.toast('Saved - this will be waiting for you next session', 'ok');
        return;
      }

      if (e.target.closest('[data-challenge-start]')) {
        ui.challengeStart = Date.now();
        refresh();
        startChallengeTimer();
        return;
      }

      if ((t = e.target.closest('[data-challenge-submit]'))) {
        submitChallenge(root, topic, lesson, t.getAttribute('data-challenge-submit'));
        return;
      }

      if (e.target.closest('[data-clear-manual]')) {
        App.mastery.clearManualStatus(topic.id);
        App.ui.toast('Status is back to what your evidence supports', 'ok');
        return;
      }

      if (e.target.closest('[data-rate-topic]')) {
        App.reviewFlow.open(topic.id);
        return;
      }
    });

    /* ---- typing: keep drafts in sync without re-rendering ---- */
    root.addEventListener('input', function (e) {
      var el = e.target, id;

      if ((id = el.getAttribute && el.getAttribute('data-code'))) {
        ui.drafts[id] = el.value;
        syncEditor(el);
      } else if ((id = el.getAttribute && el.getAttribute('data-answer'))) {
        ui.drafts[id] = el.value;
      } else if ((id = el.getAttribute && el.getAttribute('data-blank'))) {
        var parts = id.split('|');
        ui.drafts[parts[0]] = ui.drafts[parts[0]] || [];
        ui.drafts[parts[0]][Number(parts[1])] = el.value;
      } else if ((id = el.getAttribute && el.getAttribute('data-step-answer'))) {
        var sp = id.split('|');
        ui.drafts[sp[0]] = ui.drafts[sp[0]] || {};
        ui.drafts[sp[0]][sp[1]] = el.value;
      } else if ((id = el.getAttribute && el.getAttribute('data-kc'))) {
        ui.kcAnswers[id] = el.value;
      }
    });

    root.addEventListener('change', function (e) {
      var el = e.target, id;

      if ((id = el.getAttribute && el.getAttribute('data-choice'))) {
        if (id.indexOf('|') > -1) {
          var dp = id.split('|');
          ui.drafts[dp[0]] = ui.drafts[dp[0]] || {};
          ui.drafts[dp[0]][dp[1]] = el.value;
        } else if (el.name.indexOf('kc-') === 0) {
          ui.kcAnswers[id] = el.value;
        } else {
          ui.drafts[id] = el.value;
        }
        return;
      }

      if (el.matches('[data-needs-revision]')) {
        App.store.updateLearning(topic.id, function (L) { L.needsRevision = el.checked; });
        App.ui.toast(el.checked ? 'Flagged as needing revision' : 'Revision flag cleared', 'ok');
        return;
      }

      if (el.matches('[data-manual-status]')) {
        App.mastery.setManualStatus(topic.id, el.value);
        App.ui.toast('Status set manually to ' + App.STATUS_BY_ID[el.value].label, 'warn');
        return;
      }
    });

    /* ---- Tab indents instead of leaving the editor ---- */
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var el = e.target;
      if (!el.getAttribute || !el.getAttribute('data-code')) return;
      e.preventDefault();
      var start = el.selectionStart, end = el.selectionEnd;
      el.value = el.value.slice(0, start) + '    ' + el.value.slice(end);
      el.selectionStart = el.selectionEnd = start + 4;
      ui.drafts[el.getAttribute('data-code')] = el.value;
      syncEditor(el);
    });

    if (ui.challengeStart) startChallengeTimer();
  }

  /** Attribute selectors need quoting-safe values; ids contain ':' and '#'. */
  function cssEscape(value) { return String(value).replace(/"/g, '\\"'); }

  /** Repaint the highlight layer and line numbers under the textarea. */
  function syncEditor(textarea) {
    var wrap = textarea.closest('.editor');
    if (!wrap) return;
    var hl = wrap.querySelector('[data-hl]');
    var gutter = wrap.querySelector('[data-gutter]');
    var value = textarea.value;
    if (hl) hl.innerHTML = HL.highlight(value) + '\n';
    if (gutter) {
      gutter.textContent = value.split('\n').map(function (_, i) { return i + 1; }).join('\n');
    }
  }

  /* ---------- Reading an answer out of the page ---------- */

  function readResponse(root, ex) {
    var sel = function (q) { return root.querySelector(q); };
    switch (ex.type) {
      case 'mcq': {
        var picked = sel('input[data-choice="' + cssEscape(ex.id) + '"]:checked');
        return picked ? Number(picked.value) : null;
      }
      case 'fill-blank': {
        var inputs = root.querySelectorAll('[data-blank^="' + cssEscape(ex.id) + '|"]');
        return Array.prototype.map.call(inputs, function (i) { return i.value; });
      }
      case 'debug': {
        var out = {};
        (ex.steps || []).forEach(function (st) {
          if (st.type === 'mcq') {
            var p = sel('input[data-choice="' + cssEscape(ex.id + '|' + st.id) + '"]:checked');
            out[st.id] = p ? Number(p.value) : null;
          } else if (st.type === 'coding') {
            var c = sel('[data-code="' + cssEscape(ex.id + '|' + st.id) + '"]');
            out[st.id] = c ? c.value : '';
          } else {
            var a = sel('[data-step-answer="' + cssEscape(ex.id + '|' + st.id) + '"]');
            out[st.id] = a ? a.value : '';
          }
        });
        return out;
      }
      case 'coding':
      case 'refactor': {
        var code = sel('[data-code="' + cssEscape(ex.id) + '"]');
        return code ? code.value : '';
      }
      default: {
        var field = sel('[data-answer="' + cssEscape(ex.id) + '"]');
        return field ? field.value : '';
      }
    }
  }

  /* ---------- Running and checking ---------- */

  /** Run the code and show the output, without grading it. */
  function runOnly(root, topic, lesson, exId) {
    var ex = findExercise(lesson, exId);
    if (!ex) return;
    var code = readResponse(root, ex);
    ui.running[exId] = true;
    refresh();

    App.runner.run(code).then(function (run) {
      ui.running[exId] = false;
      ui.results[exId] = runToResult(run, null);
      refresh();
    });
  }

  /** Turn a runner response into something feedback() can display. */
  function runToResult(run, graded) {
    if (run.unavailable) {
      return { passed: false, kind: 'checked', results: [],
               message: 'The local C# runner is not running, so the code was not compiled.' };
    }
    if (!run.compiled) {
      return {
        passed: false, kind: 'executed', results: [{ ok: false, label: 'The code did not compile' }],
        message: run.timedOut ? 'The build timed out.' : 'Compilation failed.',
        diagnostics: run.diagnostics
      };
    }
    var base = graded || {
      passed: run.ok, kind: 'executed',
      results: [{ ok: run.ok, label: run.ok ? 'Compiled and ran without errors' : 'The program threw an error' }],
      message: run.ok ? 'Compiled and executed locally.' : 'It compiled, but crashed while running.'
    };
    return Object.assign({}, base, {
      kind: 'executed',
      stdout: run.stdout,
      diagnostics: run.diagnostics,
      runtimeError: (run.exitCode !== 0 || run.timedOut) ? run.stderr : ''
    });
  }

  function checkExercise(root, topic, lesson, exId) {
    var ex = findExercise(lesson, exId);
    if (!ex) return;
    var response = readResponse(root, ex);
    var isCode = ex.type === 'coding' || ex.type === 'refactor';
    var staticResult = App.exercises.evaluate(ex, response);

    if (isCode && App.runner.isAvailable()) {
      ui.running[exId] = true;
      refresh();
      App.runner.run(response).then(function (run) {
        ui.running[exId] = false;
        var merged;
        if (run.unavailable || !run.compiled) {
          merged = runToResult(run, null);
          if (run.unavailable) merged = staticResult;   // fall back honestly
        } else {
          var outputResult = App.exercises.gradeOutput(ex, run.stdout);
          var combined = outputResult
            ? App.exercises.combine(staticResult, outputResult)
            : Object.assign({}, staticResult, {
                kind: 'executed',
                message: staticResult.passed
                  ? 'Compiled, ran and passed every check.'
                  : staticResult.message
              });
          if (!run.ok) {
            combined = Object.assign({}, combined, {
              passed: false,
              message: 'It compiled, but crashed while running.'
            });
          }
          merged = runToResult(run, combined);
        }
        finishExercise(topic, ex, merged, response);
      });
      return;
    }

    finishExercise(topic, ex, staticResult, response);
  }

  function finishExercise(topic, ex, result, response) {
    ui.results[ex.id] = result;
    App.store.recordExercise(topic.id, ex.id, {
      passed: result.passed,
      hintsUsed: ui.hintsShown[ex.id] || 0,
      solutionViewed: !!ui.solutionShown[ex.id],
      response: typeof response === 'string' ? String(response).slice(0, 4000) : response
    });
    var before = topic.status;
    App.mastery.recompute(topic.id);
    var after = App.store.topicById(topic.id).status;
    if (result.passed) {
      App.ui.toast(after !== before
        ? 'Passed - status is now ' + App.STATUS_BY_ID[after].label
        : 'Exercise passed', 'ok');
    }
  }

  /* ---------- Knowledge check ---------- */

  function submitKnowledgeCheck(root, topic, lesson) {
    var perQuestion = {};
    var correct = 0;

    lesson.knowledgeChecks.forEach(function (q) {
      var answer;
      if (q.type === 'mcq') {
        var picked = root.querySelector('input[data-choice="' + cssEscape(q.id) + '"]:checked');
        answer = picked ? Number(picked.value) : null;
      } else {
        var field = root.querySelector('[data-kc="' + cssEscape(q.id) + '"]');
        answer = field ? field.value : '';
      }
      ui.kcAnswers[q.id] = answer;
      var r = App.exercises.evaluate(q, answer);
      perQuestion[q.id] = { ok: r.passed };
      if (r.passed) correct += 1;
    });

    var total = lesson.knowledgeChecks.length;
    var score = total ? Math.round((correct / total) * 100) : 0;
    var passed = score >= lesson.mastery.knowledgeCheckPass;

    ui.kcResult = { score: score, correct: correct, total: total, passed: passed, perQuestion: perQuestion };

    App.store.updateLearning(topic.id, function (L) {
      L.knowledgeCheck.attempts += 1;
      L.knowledgeCheck.bestScore = Math.max(L.knowledgeCheck.bestScore, score);
      L.knowledgeCheck.passed = L.knowledgeCheck.passed || passed;
      L.knowledgeCheck.lastAt = U.today();
    });
    App.mastery.recompute(topic.id);
    App.ui.toast(passed ? 'Knowledge check passed with ' + score + '%'
                        : 'Scored ' + score + '% - ' + lesson.mastery.knowledgeCheckPass + '% needed',
                 passed ? 'ok' : 'warn');
  }

  /* ---------- Challenge ---------- */

  var challengeTimerId = null;

  function startChallengeTimer() {
    if (challengeTimerId) clearInterval(challengeTimerId);
    challengeTimerId = setInterval(function () {
      var el = document.getElementById('challenge-timer');
      if (!el || !ui.challengeStart) { clearInterval(challengeTimerId); challengeTimerId = null; return; }
      var secs = Math.floor((Date.now() - ui.challengeStart) / 1000);
      el.textContent = U.fmtClock(secs).slice(3);
    }, 1000);
  }

  function submitChallenge(root, topic, lesson, exId) {
    var ex = findExercise(lesson, exId);
    if (!ex) return;
    var seconds = ui.challengeStart ? Math.round((Date.now() - ui.challengeStart) / 1000) : 0;
    var response = readResponse(root, ex);
    var isCode = ex.type === 'coding' || ex.type === 'refactor';

    var record = function (result) {
      ui.results[exId] = result;
      App.store.recordExercise(topic.id, exId, {
        passed: result.passed, hintsUsed: 0, solutionViewed: false,
        seconds: seconds, response: typeof response === 'string' ? response.slice(0, 4000) : response
      });
      App.store.updateLearning(topic.id, function (L) {
        L.challenge.attempts += 1;
        L.challenge.lastAt = U.today();
        if (result.passed) {
          L.challenge.passed = true;
          if (!L.challenge.bestSeconds || seconds < L.challenge.bestSeconds) L.challenge.bestSeconds = seconds;
        }
      });

      // A no-help challenge is also a challenge record on the Challenges page.
      App.store.addChallenge({
        name: (ex.title || lesson.title + ' challenge'),
        date: U.today(), topicId: topic.id,
        difficulty: ex.difficulty === 'Hard' ? 'Hard' : ex.difficulty === 'Easy' ? 'Easy' : 'Medium',
        outcome: result.passed ? 'completed' : 'failed',
        timeTakenMinutes: Math.max(1, Math.round(seconds / 60)),
        notes: 'Logged automatically from the lesson challenge.',
        gotWrong: result.passed ? '' : (result.results || [])
          .filter(function (r) { return !r.ok; })
          .map(function (r) { return r.label; }).join('; '),
        retryDate: result.passed ? '' : U.addDays(U.today(), 3)
      });

      ui.challengeStart = null;
      App.mastery.recompute(topic.id);
      App.ui.toast(result.passed ? 'Challenge passed with no help. That counts.'
                                 : 'Not passed - a retry has been booked in 3 days.',
                   result.passed ? 'ok' : 'warn', 4000);
    };

    var staticResult = App.exercises.evaluate(ex, response);
    if (isCode && App.runner.isAvailable()) {
      ui.running[exId] = true; refresh();
      App.runner.run(response).then(function (run) {
        ui.running[exId] = false;
        if (run.unavailable) return record(staticResult);
        if (!run.compiled) return record(runToResult(run, null));
        var outputResult = App.exercises.gradeOutput(ex, run.stdout);
        var combined = outputResult ? App.exercises.combine(staticResult, outputResult)
                                    : Object.assign({}, staticResult, { kind: 'executed' });
        if (!run.ok) combined = Object.assign({}, combined, { passed: false });
        record(runToResult(run, combined));
      });
      return;
    }
    record(staticResult);
  }

  return { meta: meta, render: render, ui: ui, stopTimer: stopTimer, flushTime: flushTime };
})();
