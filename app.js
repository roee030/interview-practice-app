(function () {
  "use strict";

  var STORAGE_KEY = "interviewTerminal.v2";
  var ALL_CARDS = window.CARDS || [];

  // ---------------- state ----------------
  var state = {
    guide: "all",
    topic: "all",
    pattern: "all",
    level: "all",
    search: "",
    hideDone: false,
    shuffle: false,
    reviewed: {},
    currentId: null,
    answerOpen: false,
    explainOpen: false,
    howToOpen: false,
    dryRunOpen: false,
    pitfallsOpen: false,
    dryRunFrame: 0,
    progressPanelOpen: false,
    shuffleOrder: null
  };

  var RESET_ON_LOAD = {
    answerOpen: false, explainOpen: false, howToOpen: false,
    dryRunOpen: false, pitfallsOpen: false, dryRunFrame: 0
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      Object.assign(state, saved, RESET_ON_LOAD);
    } catch (e) { /* ignore corrupt storage */ }
  }

  function saveState() {
    var toSave = {
      guide: state.guide, topic: state.topic, pattern: state.pattern, level: state.level,
      hideDone: state.hideDone, shuffle: state.shuffle,
      reviewed: state.reviewed, currentId: state.currentId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }

  // ---------------- topics & patterns ----------------
  var TOPICS = {}; // guide -> {topic: topicNum}
  var PATTERN_SET = {};
  ALL_CARDS.forEach(function (c) {
    if (!TOPICS[c.guide]) TOPICS[c.guide] = {};
    TOPICS[c.guide][c.topic] = c.topicNum;
    if (c.pattern) PATTERN_SET[c.pattern] = true;
  });
  var TOPIC_LIST = {};
  Object.keys(TOPICS).forEach(function (g) {
    TOPIC_LIST[g] = Object.keys(TOPICS[g]).sort(function (a, b) {
      return TOPICS[g][a] - TOPICS[g][b];
    });
  });
  var PATTERN_LIST = Object.keys(PATTERN_SET).sort();

  // ---------------- filtering ----------------
  function matchesFilters(c) {
    if (state.guide !== "all" && c.guide !== state.guide) return false;
    if (state.topic !== "all" && c.topic !== state.topic) return false;
    if (state.pattern !== "all" && c.pattern !== state.pattern) return false;
    if (state.level !== "all" && c.level !== state.level) return false;
    if (state.hideDone && state.reviewed[c.id]) return false;
    if (state.search) {
      var q = state.search.toLowerCase();
      var hay = (c.question + " " + c.topic + " " + (c.pattern || "") + " " + (c.badge || "")).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function getFilteredList() {
    var base = ALL_CARDS.filter(matchesFilters);
    if (state.shuffle) {
      if (!state.shuffleOrder || state.shuffleOrder.length !== base.length) {
        state.shuffleOrder = shuffleArray(base.map(function (c) { return c.id; }));
      }
      var byId = {};
      base.forEach(function (c) { byId[c.id] = c; });
      return state.shuffleOrder.map(function (id) { return byId[id]; }).filter(Boolean);
    }
    return base;
  }

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  // ---------------- code highlighting ----------------
  var KEYWORDS = ("function const let var return if else for while class new this typeof instanceof " +
    "extends static async await try catch finally throw switch case break continue import export " +
    "default from yield of in do null undefined true false void delete get set super constructor").split(" ");
  var KEYWORD_SET = {};
  KEYWORDS.forEach(function (k) { KEYWORD_SET[k] = true; });

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlightCode(code) {
    var out = [];
    var i = 0, n = code.length;
    while (i < n) {
      var ch = code[i];

      if (ch === "/" && code[i + 1] === "/") {
        var end = code.indexOf("\n", i);
        if (end === -1) end = n;
        out.push('<span class="tok-com">' + escapeHtml(code.slice(i, end)) + "</span>");
        i = end;
        continue;
      }
      if (ch === "/" && code[i + 1] === "*") {
        var end2 = code.indexOf("*/", i + 2);
        end2 = end2 === -1 ? n : end2 + 2;
        out.push('<span class="tok-com">' + escapeHtml(code.slice(i, end2)) + "</span>");
        i = end2;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === "`") {
        var quote = ch, j = i + 1;
        while (j < n && code[j] !== quote) {
          if (code[j] === "\\") j++;
          j++;
        }
        j = Math.min(j + 1, n);
        out.push('<span class="tok-str">' + escapeHtml(code.slice(i, j)) + "</span>");
        i = j;
        continue;
      }
      if (/[0-9]/.test(ch) && !/[A-Za-z_$]/.test(code[i - 1] || "")) {
        var k = i;
        while (k < n && /[0-9.xXa-fA-F]/.test(code[k])) k++;
        out.push('<span class="tok-num">' + escapeHtml(code.slice(i, k)) + "</span>");
        i = k;
        continue;
      }
      if (/[A-Za-z_$]/.test(ch)) {
        var m = i;
        while (m < n && /[A-Za-z0-9_$]/.test(code[m])) m++;
        var word = code.slice(i, m);
        if (KEYWORD_SET[word]) {
          out.push('<span class="tok-kw">' + escapeHtml(word) + "</span>");
        } else if (code[m] === "(") {
          out.push('<span class="tok-fn">' + escapeHtml(word) + "</span>");
        } else {
          out.push(escapeHtml(word));
        }
        i = m;
        continue;
      }
      out.push(escapeHtml(ch));
      i++;
    }
    return out.join("");
  }

  // ---------------- DOM refs ----------------
  var $guideTabs = document.getElementById("guideTabs");
  var $topicSelect = document.getElementById("topicSelect");
  var $patternSelect = document.getElementById("patternSelect");
  var $levelChips = document.getElementById("levelChips");
  var $searchInput = document.getElementById("searchInput");
  var $hideDoneBtn = document.getElementById("hideDoneBtn");
  var $shuffleBtn = document.getElementById("shuffleBtn");
  var $resetFiltersBtn = document.getElementById("resetFiltersBtn");
  var $flashcard = document.getElementById("flashcard");
  var $prevBtn = document.getElementById("prevBtn");
  var $nextBtn = document.getElementById("nextBtn");
  var $reviewBtn = document.getElementById("reviewBtn");
  var $reviewBtnLabel = document.getElementById("reviewBtnLabel");
  var $progressToggle = document.getElementById("progressToggle");
  var $progressPanel = document.getElementById("progressPanel");
  var $progressList = document.getElementById("progressList");
  var $ringFill = document.getElementById("ringFill");
  var $ringLabel = document.getElementById("ringLabel");
  var $cntAll = document.getElementById("cnt-all");
  var $cntInterview = document.getElementById("cnt-interview");
  var $cntAlgo = document.getElementById("cnt-algo");

  var RING_CIRC = 119.4;

  // ---------------- render: topic & pattern selects ----------------
  function renderTopicSelect() {
    var guides = state.guide === "all" ? Object.keys(TOPIC_LIST) : [state.guide];
    var html = '<option value="all">All topics</option>';
    guides.forEach(function (g) {
      html += '<optgroup label="' + escapeHtml(g) + '">';
      TOPIC_LIST[g].forEach(function (t) {
        var selected = state.topic === t ? " selected" : "";
        html += '<option value="' + escapeHtml(t) + '"' + selected + ">" + escapeHtml(t) + "</option>";
      });
      html += "</optgroup>";
    });
    $topicSelect.innerHTML = html;
    if (state.topic !== "all" && !guides.some(function (g) { return TOPIC_LIST[g].indexOf(state.topic) !== -1; })) {
      state.topic = "all";
    }
    $topicSelect.value = state.topic;
  }

  function renderPatternSelect() {
    var html = '<option value="all">All patterns</option>';
    PATTERN_LIST.forEach(function (p) {
      var selected = state.pattern === p ? " selected" : "";
      html += '<option value="' + escapeHtml(p) + '"' + selected + ">" + escapeHtml(p) + "</option>";
    });
    $patternSelect.innerHTML = html;
    $patternSelect.value = state.pattern;
  }

  // ---------------- render: header counts / ring ----------------
  function renderHeaderStats() {
    var totalAll = ALL_CARDS.length;
    var doneAll = ALL_CARDS.filter(function (c) { return state.reviewed[c.id]; }).length;
    var interviewCards = ALL_CARDS.filter(function (c) { return c.guide === "Interview Guide"; });
    var algoCards = ALL_CARDS.filter(function (c) { return c.guide === "Algorithms Guide"; });
    var doneInterview = interviewCards.filter(function (c) { return state.reviewed[c.id]; }).length;
    var doneAlgo = algoCards.filter(function (c) { return state.reviewed[c.id]; }).length;

    $cntAll.textContent = doneAll + "/" + totalAll;
    $cntInterview.textContent = doneInterview + "/" + interviewCards.length;
    $cntAlgo.textContent = doneAlgo + "/" + algoCards.length;

    var pct = totalAll ? doneAll / totalAll : 0;
    $ringFill.style.strokeDashoffset = String(RING_CIRC * (1 - pct));
    $ringLabel.textContent = Math.round(pct * 100) + "%";
  }

  // ---------------- render: progress panel ----------------
  function renderProgressPanel() {
    var html = "";
    Object.keys(TOPIC_LIST).forEach(function (g) {
      html += '<div class="progress-group-label">' + escapeHtml(g) + "</div>";
      TOPIC_LIST[g].forEach(function (t) {
        var cards = ALL_CARDS.filter(function (c) { return c.guide === g && c.topic === t; });
        var done = cards.filter(function (c) { return state.reviewed[c.id]; }).length;
        var pct = cards.length ? Math.round((done / cards.length) * 100) : 0;
        var isActive = state.topic === t;
        var isComplete = done === cards.length;
        html += '<button class="progress-item' + (isActive ? " active-topic" : "") + (isComplete ? " complete" : "") +
          '" data-guide="' + escapeHtml(g) + '" data-topic="' + escapeHtml(t) + '">' +
          '<span class="progress-item-top"><span>' + escapeHtml(t) + '</span><span class="done">' + done + "/" + cards.length + "</span></span>" +
          '<span class="progress-bar-track"><span class="progress-bar-fill" style="width:' + pct + '%"></span></span>' +
          "</button>";
      });
    });
    $progressList.innerHTML = html;

    $progressList.querySelectorAll(".progress-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.guide = btn.getAttribute("data-guide");
        state.topic = btn.getAttribute("data-topic");
        state.shuffleOrder = null;
        syncGuideTabs();
        renderTopicSelect();
        jumpToFirstUnreviewedOrFirst();
        renderAll();
      });
    });
  }

  function syncGuideTabs() {
    $guideTabs.querySelectorAll(".tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-guide") === state.guide);
    });
  }

  // ---------------- render: flashcard ----------------
  function getCurrentList() {
    return getFilteredList();
  }

  function jumpToFirstUnreviewedOrFirst() {
    var list = getCurrentList();
    if (!list.length) { state.currentId = null; return; }
    var firstUnreviewed = list.find(function (c) { return !state.reviewed[c.id]; });
    state.currentId = (firstUnreviewed || list[0]).id;
  }

  function renderDryRunPanel(card) {
    var dr = card.dryRun;
    if (!dr || !dr.frames || !dr.frames.length) {
      return '<p class="no-code-note">No dry run for this one — it&#39;s a concept without a step-by-step trace.</p>';
    }
    var total = dr.frames.length;
    if (state.dryRunFrame >= total) state.dryRunFrame = total - 1;
    if (state.dryRunFrame < 0) state.dryRunFrame = 0;
    var frameText = dr.frames[state.dryRunFrame];

    var html = '<div class="dryrun-box">';
    if (dr.input) html += '<div class="dryrun-input"><span class="dryrun-tag">INPUT</span>' + escapeHtml(dr.input) + "</div>";
    html += '<div class="dryrun-frame">' +
      '<div class="dryrun-frame-head">' +
        '<span class="dryrun-frame-label">FRAME ' + (state.dryRunFrame + 1) + " / " + total + "</span>" +
        '<div class="dryrun-frame-nav">' +
          '<button id="dryRunPrevFrame" class="dryrun-nav-btn"' + (state.dryRunFrame === 0 ? " disabled" : "") + ' aria-label="Previous frame">&larr;</button>' +
          '<button id="dryRunNextFrame" class="dryrun-nav-btn"' + (state.dryRunFrame === total - 1 ? " disabled" : "") + ' aria-label="Next frame">&rarr;</button>' +
        "</div>" +
      "</div>" +
      '<div class="dryrun-frame-dots">';
    for (var i = 0; i < total; i++) {
      html += '<span class="dryrun-dot' + (i === state.dryRunFrame ? " active" : "") + (i < state.dryRunFrame ? " past" : "") + '" data-frame="' + i + '"></span>';
    }
    html += "</div>" +
      '<div class="dryrun-frame-text">' + escapeHtml(frameText) + "</div>" +
    "</div>";
    if (dr.result) html += '<div class="dryrun-result"><span class="dryrun-tag">RESULT</span>' + escapeHtml(dr.result) + "</div>";
    html += "</div>";
    return html;
  }

  function renderFlashcard() {
    var list = getCurrentList();

    if (!list.length) {
      $flashcard.innerHTML =
        '<div class="empty-state"><h3>No matches</h3>' +
        "<p>Nothing fits the current filters.<br>Try widening your search.</p>" +
        '<button id="emptyResetBtn">Reset filters</button></div>';
      document.getElementById("emptyResetBtn").addEventListener("click", resetFilters);
      $prevBtn.disabled = true;
      $nextBtn.disabled = true;
      $reviewBtn.style.display = "none";
      return;
    }
    $reviewBtn.style.display = "";

    var idx = list.findIndex(function (c) { return c.id === state.currentId; });
    if (idx === -1) { idx = 0; state.currentId = list[0].id; }
    var card = list[idx];

    var guideSlug = card.guide === "Interview Guide" ? "interview-prep" : "algorithms";
    var topicSlug = card.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    var isDone = !!state.reviewed[card.id];

    var tagRow =
      '<span class="tag ' + (card.guide === "Interview Guide" ? "tag-guide-interview" : "tag-guide-algo") + '">' +
        escapeHtml(card.guide === "Interview Guide" ? "Interview Prep" : "Algorithm") + "</span>" +
      '<span class="tag tag-level-' + card.level + '">' + card.level + "</span>" +
      '<span class="tag tag-topic">' + escapeHtml(card.topic) + "</span>" +
      (card.pattern ? '<span class="tag tag-pattern">' + escapeHtml(card.pattern) + "</span>" : "") +
      (isDone ? '<span class="tag tag-reviewed">&#10003; reviewed</span>' : "");

    var badgeLine = card.badge ? '<div class="badge-line">' + escapeHtml(card.badge) + "</div>" : "";

    var takeawayStrip = card.patternTakeaway
      ? '<div class="takeaway-strip"><span class="takeaway-icon">&#129504;</span><span>' + escapeHtml(card.patternTakeaway) + "</span></div>"
      : "";

    var codeContent = card.code
      ? '<pre class="code-box">' + highlightCode(card.code) + "</pre>"
      : '<p class="no-code-note">No code for this one — it&#39;s a conceptual / system-design question.</p>';

    var explanationContent = card.explanation
      ? '<div class="explanation-box">' + escapeHtml(card.explanation) + "</div>"
      : '<p class="no-code-note">No written explanation for this entry.</p>';

    var howToContent = card.howTo
      ? '<div class="howto-box">' + escapeHtml(card.howTo) + "</div>"
      : '<p class="no-code-note">No walkthrough yet for this entry.</p>';

    var pitfallsContent;
    if (card.pitfalls && card.pitfalls.length) {
      pitfallsContent = '<ul class="pitfalls-list">' +
        card.pitfalls.map(function (p) { return '<li><span class="pitfall-icon">&#9888;</span>' + escapeHtml(p) + "</li>"; }).join("") +
        "</ul>";
    } else {
      pitfallsContent = '<p class="no-code-note">No pitfalls noted for this one.</p>';
    }

    var dryRunContent = renderDryRunPanel(card);

    $flashcard.innerHTML =
      '<div class="card-chrome">' +
        '<div class="chrome-dots"><span></span><span></span><span></span></div>' +
        '<div class="chrome-path">~/prep/' + guideSlug + "/" + topicSlug + ".js</div>" +
        '<div class="chrome-index">Q<b>' + (idx + 1) + "</b> / " + list.length + "</div>" +
      "</div>" +
      '<div class="card-body">' +
        '<div class="tag-row">' + tagRow + "</div>" +
        badgeLine +
        '<h2 class="question-text">' + escapeHtml(card.question) + "</h2>" +
        takeawayStrip +
        '<div class="action-row">' +
          '<button class="reveal-btn howto' + (state.howToOpen ? " active" : "") + '" id="howToBtn">' +
            (state.howToOpen ? "hide_how_to_solve" : "how_to_solve_it") +
          "</button>" +
          '<button class="reveal-btn dryrun' + (state.dryRunOpen ? " active" : "") + '" id="dryRunBtn">' +
            "&#127916; " + (state.dryRunOpen ? "hide_dry_run" : "dry_run") +
          "</button>" +
          '<button class="reveal-btn pitfalls' + (state.pitfallsOpen ? " active" : "") + '" id="pitfallsBtn">' +
            "&#9888; " + (state.pitfallsOpen ? "hide_pitfalls" : "pitfalls") +
          "</button>" +
          '<button class="reveal-btn explain' + (state.explainOpen ? " active" : "") + '" id="explainBtn">' +
            (state.explainOpen ? "hide_explanation" : "show_explanation") +
          "</button>" +
          '<button class="reveal-btn' + (state.answerOpen ? " active" : "") + '" id="answerBtn">' +
            (state.answerOpen ? "hide_answer" : "show_answer") +
          "</button>" +
        "</div>" +
        '<div class="reveal-panel' + (state.howToOpen ? " open" : "") + '"><div class="reveal-panel-inner">' +
          '<p class="panel-label">How to solve it &mdash; the thinking, step by step</p>' + howToContent +
        "</div></div>" +
        '<div class="reveal-panel' + (state.dryRunOpen ? " open" : "") + '"><div class="reveal-panel-inner">' +
          '<p class="panel-label">&#127916; Dry Run &mdash; watch it run, frame by frame</p>' + dryRunContent +
        "</div></div>" +
        '<div class="reveal-panel' + (state.pitfallsOpen ? " open" : "") + '"><div class="reveal-panel-inner">' +
          '<p class="panel-label">&#9888; Pitfalls &mdash; small things people forget</p>' + pitfallsContent +
        "</div></div>" +
        '<div class="reveal-panel' + (state.explainOpen ? " open" : "") + '"><div class="reveal-panel-inner">' +
          '<p class="panel-label">Explanation</p>' + explanationContent +
        "</div></div>" +
        '<div class="reveal-panel' + (state.answerOpen ? " open" : "") + '"><div class="reveal-panel-inner">' +
          '<p class="panel-label">Answer / Solution</p>' + codeContent +
        "</div></div>" +
      "</div>";

    document.getElementById("howToBtn").addEventListener("click", function () {
      state.howToOpen = !state.howToOpen;
      renderFlashcard();
    });
    document.getElementById("dryRunBtn").addEventListener("click", function () {
      state.dryRunOpen = !state.dryRunOpen;
      renderFlashcard();
    });
    document.getElementById("pitfallsBtn").addEventListener("click", function () {
      state.pitfallsOpen = !state.pitfallsOpen;
      renderFlashcard();
    });
    document.getElementById("answerBtn").addEventListener("click", function () {
      state.answerOpen = !state.answerOpen;
      renderFlashcard();
    });
    document.getElementById("explainBtn").addEventListener("click", function () {
      state.explainOpen = !state.explainOpen;
      renderFlashcard();
    });

    var $drPrev = document.getElementById("dryRunPrevFrame");
    var $drNext = document.getElementById("dryRunNextFrame");
    if ($drPrev) $drPrev.addEventListener("click", function () { state.dryRunFrame--; renderFlashcard(); });
    if ($drNext) $drNext.addEventListener("click", function () { state.dryRunFrame++; renderFlashcard(); });
    $flashcard.querySelectorAll(".dryrun-dot").forEach(function (dot) {
      dot.addEventListener("click", function () {
        state.dryRunFrame = parseInt(dot.getAttribute("data-frame"), 10);
        renderFlashcard();
      });
    });

    $prevBtn.disabled = idx === 0;
    $nextBtn.disabled = idx === list.length - 1;
    $reviewBtn.classList.toggle("done", isDone);
    $reviewBtnLabel.textContent = isDone ? "Reviewed" : "Mark as reviewed";
  }

  function renderAll() {
    renderHeaderStats();
    renderProgressPanel();
    renderFlashcard();
    saveState();
  }

  function goTo(offset) {
    var list = getCurrentList();
    if (!list.length) return;
    var idx = list.findIndex(function (c) { return c.id === state.currentId; });
    var next = Math.min(Math.max(idx + offset, 0), list.length - 1);
    state.currentId = list[next].id;
    state.answerOpen = false;
    state.explainOpen = false;
    state.howToOpen = false;
    state.dryRunOpen = false;
    state.pitfallsOpen = false;
    state.dryRunFrame = 0;
    renderAll();
  }

  function resetFilters() {
    state.guide = "all";
    state.topic = "all";
    state.pattern = "all";
    state.level = "all";
    state.search = "";
    state.hideDone = false;
    state.shuffle = false;
    state.shuffleOrder = null;
    $searchInput.value = "";
    syncGuideTabs();
    renderTopicSelect();
    renderPatternSelect();
    syncLevelChips();
    syncToggle($hideDoneBtn, false);
    syncToggle($shuffleBtn, false);
    jumpToFirstUnreviewedOrFirst();
    renderAll();
  }

  function syncLevelChips() {
    $levelChips.querySelectorAll(".chip").forEach(function (chip) {
      chip.classList.toggle("active", chip.getAttribute("data-level") === state.level);
    });
  }

  function syncToggle(btn, on) {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  // ---------------- events ----------------
  $guideTabs.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      state.guide = tab.getAttribute("data-guide");
      state.topic = "all";
      state.shuffleOrder = null;
      syncGuideTabs();
      renderTopicSelect();
      jumpToFirstUnreviewedOrFirst();
      renderAll();
    });
  });

  $topicSelect.addEventListener("change", function () {
    state.topic = $topicSelect.value;
    state.shuffleOrder = null;
    jumpToFirstUnreviewedOrFirst();
    renderAll();
  });

  $patternSelect.addEventListener("change", function () {
    state.pattern = $patternSelect.value;
    state.shuffleOrder = null;
    jumpToFirstUnreviewedOrFirst();
    renderAll();
  });

  $levelChips.querySelectorAll(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      state.level = chip.getAttribute("data-level");
      state.shuffleOrder = null;
      syncLevelChips();
      jumpToFirstUnreviewedOrFirst();
      renderAll();
    });
  });

  var searchDebounce;
  $searchInput.addEventListener("input", function () {
    clearTimeout(searchDebounce);
    var val = $searchInput.value;
    searchDebounce = setTimeout(function () {
      state.search = val;
      state.shuffleOrder = null;
      jumpToFirstUnreviewedOrFirst();
      renderAll();
    }, 150);
  });

  $hideDoneBtn.addEventListener("click", function () {
    state.hideDone = state.hideDone !== true;
    syncToggle($hideDoneBtn, state.hideDone);
    state.shuffleOrder = null;
    jumpToFirstUnreviewedOrFirst();
    renderAll();
  });

  $shuffleBtn.addEventListener("click", function () {
    state.shuffle = state.shuffle !== true;
    state.shuffleOrder = null;
    syncToggle($shuffleBtn, state.shuffle);
    renderAll();
  });

  $resetFiltersBtn.addEventListener("click", resetFilters);

  $prevBtn.addEventListener("click", function () { goTo(-1); });
  $nextBtn.addEventListener("click", function () { goTo(1); });

  $reviewBtn.addEventListener("click", function () {
    if (!state.currentId) return;
    if (state.reviewed[state.currentId]) {
      delete state.reviewed[state.currentId];
    } else {
      state.reviewed[state.currentId] = Date.now();
      $reviewBtn.classList.add("pulse");
      setTimeout(function () { $reviewBtn.classList.remove("pulse"); }, 400);
    }
    renderAll();
  });

  $progressToggle.addEventListener("click", function () {
    state.progressPanelOpen = !state.progressPanelOpen;
    $progressPanel.classList.toggle("open", state.progressPanelOpen);
    $progressToggle.setAttribute("aria-expanded", state.progressPanelOpen ? "true" : "false");
  });

  document.addEventListener("keydown", function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
      if (e.key === "Escape") document.activeElement.blur();
      return;
    }
    if (e.key === "/") { e.preventDefault(); $searchInput.focus(); return; }
    if (e.key === "ArrowLeft") { goTo(-1); return; }
    if (e.key === "ArrowRight") { goTo(1); return; }
    if (e.key.toLowerCase() === "a") { document.getElementById("answerBtn") && document.getElementById("answerBtn").click(); return; }
    if (e.key.toLowerCase() === "e") { document.getElementById("explainBtn") && document.getElementById("explainBtn").click(); return; }
    if (e.key.toLowerCase() === "h") { document.getElementById("howToBtn") && document.getElementById("howToBtn").click(); return; }
    if (e.key.toLowerCase() === "r") { document.getElementById("dryRunBtn") && document.getElementById("dryRunBtn").click(); return; }
    if (e.key.toLowerCase() === "p") { document.getElementById("pitfallsBtn") && document.getElementById("pitfallsBtn").click(); return; }
    if (e.key.toLowerCase() === "d") { $reviewBtn.click(); return; }
  });

  // ---------------- init ----------------
  function init() {
    loadState();
    syncGuideTabs();
    renderTopicSelect();
    renderPatternSelect();
    syncLevelChips();
    syncToggle($hideDoneBtn, state.hideDone);
    syncToggle($shuffleBtn, state.shuffle);
    if (state.progressPanelOpen) {
      $progressPanel.classList.add("open");
      $progressToggle.setAttribute("aria-expanded", "true");
    }

    var list = getCurrentList();
    if (!state.currentId || !list.some(function (c) { return c.id === state.currentId; })) {
      jumpToFirstUnreviewedOrFirst();
    }
    renderAll();
  }

  init();
})();
