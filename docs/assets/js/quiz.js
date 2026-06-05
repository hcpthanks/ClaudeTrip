/* ═══════════════════════════════════════════════════════
   ⑩ 学习考核系统 — 5题 / 80%达标 / 冷却选择 / 手写模式
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var PASS_THRESHOLD = 4; // 5题中至少对4题 (80%)
  var LS_QUIZ = 'cc-learn-quiz';
  var LS_COOLDOWN = 'cc-learn-cooldown';
  var LS_HANDWRITE = 'cc-handwrite-';

  var TOPIC_ORDER = window.TOPIC_ORDER;
  var TOPIC_PAGES = window.TOPIC_PAGES;
  var TOPIC_NAMES = window.TOPIC_NAMES;

  /* ══════ Question Bank ══════ */
  var QUIZ_DATA = {
    intro: {
      handwritingContent: [
        '核心概念：Claude Code = AI模型 + Harness（运行环境），运行在终端里，可以直接读写文件、执行命令',
        '主要命令：claude（启动）/ claude -p "问题"（单次）/ /plan（做计划）/ /code-review（审查）/ /clear（清空）',
        '最重要3点：1.先读文件再提问 2.每次编码后用/code-review审查 3.新功能先用/plan做计划',
        '最易犯3错：1.当搜索引擎用 2.不审查就提交 3.一个会话堆太多任务'
      ],
      questions: [
        { q: 'Claude Code 和网页版 Claude 最大的区别是什么？',
          opts: ['价格不同', 'CLI 可以直接读写文件和执行命令', '界面更漂亮', '支持更多语言'],
          ans: 1 },
        { q: '启动 Claude Code 的命令是什么？',
          opts: ['npm start', 'claude', 'code-claude', 'cc start'],
          ans: 1 },
        { q: '写代码之前应该先做什么？',
          opts: ['直接让 AI 写', '用 /plan 做计划', '先百度搜索', '先写测试'],
          ans: 1 },
        { q: '代码写完后应该立刻做什么？',
          opts: ['git commit', '/code-review 审查', '关掉终端', '发朋友圈'],
          ans: 1 },
        { q: '什么时候应该用 /clear？',
          opts: ['每次发消息前', '连续纠正3次还不对或上下文混乱时', '每天一次', '从来不用'],
          ans: 1 }
      ]
    },
    plan: {
      handwritingContent: [
        '核心概念：/plan 让 AI 先做实现计划再等你确认，避免理解错需求就狂写代码',
        '使用方式：/plan [需求描述] → AI出计划 → 你审查 → yes确认 → AI实现',
        '最重要3点：1.多文件修改必须/plan 2.计划出来认真看，别习惯性yes 3.不满意说modify:',
        '最易犯3错：1.简单任务也用/plan 2.扫一眼就yes 3.不满意也不说'
      ],
      questions: [
        { q: '/plan 命令的核心作用是什么？',
          opts: ['让 AI 写得更快', '先做计划再等你确认，避免方向错误', '格式化代码', '自动提交代码'],
          ans: 1 },
        { q: 'AI 给出了计划，你觉得第二步不对，应该说什么？',
          opts: ['取消重来', 'modify: 第二步应该...', '随便，先做再说', '/clear'],
          ans: 1 },
        { q: '下面哪个场景不需要用 /plan？',
          opts: ['新增导出 CSV 功能', '把 JS 重构为 TS', '修一个函数名的拼写错误', '决定用 Redis 还是内存缓存'],
          ans: 2 },
        { q: '/plan 可以和 PRD 文件配合使用吗？',
          opts: ['不可以', '可以，/plan docs/xxx.prd.md', '只能纯文本', '需要用其他命令'],
          ans: 1 },
        { q: '计划确认后 AI 开始实现，发现方向偏了怎么办？',
          opts: ['让它继续', '直接纠正说"不对，我要的是XX"', '放弃这个功能', '重新安装 Claude Code'],
          ans: 1 }
      ]
    },
    shortcuts: {
      handwritingContent: [
        '核心概念：键盘快捷键让 Claude Code 操作效率翻 3 倍，告别鼠标',
        '必记快捷键：Enter=发送 / Esc=中断 / Shift+Insert=粘贴 / Alt+T=切换思考 / Ctrl+O=查看思考',
        '最重要3点：1.粘贴用Shift+Insert不是Ctrl+V 2.Esc可以中断AI跑偏 3.Alt+T切换扩展思考模式',
        '最易犯3错：1.狂按Ctrl+V没反应 2.不知道Esc中断 3.不知道Alt+T开关思考'
      ],
      questions: [
        { q: '在命令行中粘贴内容应该用什么？',
          opts: ['Ctrl+V', 'Shift+Insert 或右键', 'Ctrl+Shift+V', '鼠标中键'],
          ans: 1 },
        { q: 'AI 输出跑偏了，应该按什么键中断？',
          opts: ['Enter', 'Esc', 'Tab', 'Delete'],
          ans: 1 },
        { q: '切换扩展思考模式的快捷键是什么？',
          opts: ['Ctrl+T', 'Alt+T（Windows）/ Option+T（Mac）', 'Shift+T', 'Ctrl+Enter'],
          ans: 1 },
        { q: '发送消息用什么键？',
          opts: ['Tab', 'Space', 'Enter', 'Ctrl+S'],
          ans: 2 },
        { q: '保存当前会话供下次继续的命令是什么？',
          opts: ['/save', '/save-session', '/keep', '/store'],
          ans: 1 }
      ]
    },
    convo: {
      handwritingContent: [
        '核心概念：万能提问公式 = 背景 + 目标 + 约束。上下文越具体，AI产出越准确',
        '公式拆解：[背景]在XX项目用YY技术栈 [目标]实现AA功能 [约束]要求/不要/注意',
        '最重要3点：1.提问前提文件路径 2.纠错时具体说哪里不对 3.上下文混乱果断/clear',
        '最易犯3错：1.一句话抛给AI不给上下文 2.会话堆满任务 3.纠错只说"错了"'
      ],
      questions: [
        { q: '跟 Claude Code 对话的万能公式是什么？',
          opts: ['请帮我 + 谢谢', '背景 + 目标 + 约束', '越快越好 + 越多越好', '随便说就行'],
          ans: 1 },
        { q: '下面哪个是好的提问方式？',
          opts: ['"帮我看看"', '"先读 auth.ts，在登录页加记住我功能"', '"优化一下"', '"改一下"'],
          ans: 1 },
        { q: 'AI 连续 3 次纠正都不对，应该怎么办？',
          opts: ['继续纠正第4次', '/clear 清空上下文重新来', '换一个问题', '放弃'],
          ans: 1 },
        { q: '纠错时最好的说法是？',
          opts: ['"你又错了"', '"不对，我要的是XX不是YY。重来"', '什么都不说直接/clear', '"算了"'],
          ans: 1 },
        { q: '新任务应该怎么做？',
          opts: ['在旧会话里继续聊', '新开一个会话，重新给上下文', '直接说新需求', '关掉重装'],
          ans: 1 }
      ]
    },
    init: {
      handwritingContent: [
        '核心概念：Claude Code 10分钟搭好新项目完整骨架，包括配置文件、目录结构、CLAUDE.md',
        '创建方式：1.从零生成 2.克隆模板后定制 3.参考已有项目结构',
        '最重要3点：1.创建完立刻build验证 2.第一时间生成CLAUDE.md 3.别忘了git init',
        '最易犯3错：1.描述太模糊 2.建完不验证 3.不写CLAUDE.md'
      ],
      questions: [
        { q: '用 Claude Code 初始化项目后，第一件事应该做什么？',
          opts: ['立刻写功能代码', 'npm install + npm run build 验证能跑', '先写 README', '配置 CI/CD'],
          ans: 1 },
        { q: 'CLAUDE.md 的作用是什么？',
          opts: ['只是装饰文件', '告诉 Claude Code 项目结构、规范、命令的说明书', '用来写日记', '存密码'],
          ans: 1 },
        { q: '创建项目时哪种描述最好？',
          opts: ['"搭个项目"', '"React+TS+Vite，ESLint airbnb，Vitest测试"', '"随便"', '"你看着办"'],
          ans: 1 },
        { q: 'Claude 生成项目后，配置文件应该？',
          opts: ['全部接受', '逐一检查是否符合团队规范', '删掉不用', '全部重写'],
          ans: 1 },
        { q: '初始化新项目最容易被忽略的一步是什么？',
          opts: ['创建 src 目录', 'git init + 首次提交', '安装依赖', '写 README'],
          ans: 1 }
      ]
    },
    workflow: {
      handwritingContent: [
        '核心概念：六步开发闭环 = plan→编码→review→测试→diff→commit，每个环节都做到才能零事故',
        '六步详解：①/plan做计划 ②AI编码 ③/code-review审查 ④build+test验证 ⑤git diff确认 ⑥commit提交',
        '最重要3点：1.每次必/code-review 2.build+test不通过不提交 3.commit message写清楚',
        '最易犯3错：1.跳过code review 2.跳过测试验证 3.小改动不走流程'
      ],
      questions: [
        { q: '标准六步开发闭环中，编码之后的下一步是什么？',
          opts: ['git commit', '/code-review 审查代码', '写文档', '部署上线'],
          ans: 1 },
        { q: 'git commit 之前必须做什么？',
          opts: ['发邮件', 'git diff 确认改动文件', '关掉编辑器', '重启电脑'],
          ans: 1 },
        { q: '下面哪个是好的 commit message？',
          opts: ['"update"', '"feat: 添加导出CSV功能，支持时间范围筛选"', '"fix"', '"改了"'],
          ans: 1 },
        { q: '测试没通过可以提交吗？',
          opts: ['可以，小改动没关系', '不可以，build+test必须通过', '看心情', '可以，测试不重要'],
          ans: 1 },
        { q: '"这次改动很小，不用审查了"——这句话的问题是什么？',
          opts: ['没问题，确实不用审', '绝大多数Bug就出在"改动很小"的时候', '只有大改动才需要审', '审查浪费时间'],
          ans: 1 }
      ]
    }
  };

  /* ══════ State ══════ */
  function getQuizState() {
    try { return JSON.parse(localStorage.getItem(LS_QUIZ) || '{}'); } catch(e) { return {}; }
  }

  function getCooldown() {
    try { return JSON.parse(localStorage.getItem(LS_COOLDOWN) || '{}'); } catch(e) { return {}; }
  }

  function getHandwriteState(topicId) {
    try { return JSON.parse(localStorage.getItem(LS_HANDWRITE + topicId) || 'null'); } catch(e) { return null; }
  }

  function isTopicUnlockedByProgress(topicId) {
    var idx = TOPIC_ORDER.indexOf(topicId);
    if (idx <= 0) return true; // first topic always unlocked
    var prevTopic = TOPIC_ORDER[idx - 1];

    // Check if passed quiz
    var quizState = getQuizState();
    if (quizState[prevTopic] && quizState[prevTopic].passed) return true;

    // Check if cooldown expired
    var cooldown = getCooldown();
    if (cooldown[prevTopic]) {
      var expiry = new Date(cooldown[prevTopic]).getTime();
      if (Date.now() >= expiry) return true;
    }

    // Check handwriting
    var hw = getHandwriteState(prevTopic);
    if (hw && hw.completed) return true;

    // Check if previous topic was paid (force unlock via pay.html)
    if (quizState[prevTopic] && quizState[prevTopic].forceUnlocked) return true;

    return false;
  }

  function getLockReason(topicId) {
    var idx = TOPIC_ORDER.indexOf(topicId);
    if (idx <= 0) return null;
    var prevTopic = TOPIC_ORDER[idx - 1];
    var cooldown = getCooldown();
    if (cooldown[prevTopic]) {
      var remaining = new Date(cooldown[prevTopic]).getTime() - Date.now();
      if (remaining > 0) {
        var hours = Math.ceil(remaining / 3600000);
        return '冷却中，约 ' + hours + ' 小时后解锁';
      }
    }
    return '请先完成「' + TOPIC_NAMES[prevTopic] + '」的考核';
  }

  /* ══════ Render Quiz ══════ */
  function renderQuiz(topicId) {
    var container = document.getElementById('quiz-container');
    if (!container) return;

    var data = QUIZ_DATA[topicId];
    if (!data) return;

    var quizState = getQuizState();
    var existing = quizState[topicId];

    // Already passed — show result
    if (existing && existing.passed) {
      container.innerHTML = renderPassedResult(topicId, existing);
      return;
    }

    // Failed but cooldown active — show cooldown panel
    var cooldown = getCooldown();
    if (cooldown[topicId]) {
      var remaining = new Date(cooldown[topicId]).getTime() - Date.now();
      if (remaining > 0) {
        container.innerHTML = renderCooldownPanel(topicId, existing, remaining);
        bindCooldownEvents(topicId);
        return;
      }
    }

    // Handwriting check
    var hw = getHandwriteState(topicId);
    if (hw && hw.completed) {
      container.innerHTML = renderPassedResult(topicId, {score: 0, total: 5, passed: true, method: 'handwrite'});
      return;
    }

    // Show quiz
    renderQuizQuestions(container, data, topicId, existing);
  }

  function renderQuizQuestions(container, data, topicId, existing) {
    var html = '<h2>⑩ 学习考核 <span style="color:var(--text-muted);font-size:0.7em;">（5题，答对4题即通过）</span></h2>';

    data.questions.forEach(function (q, i) {
      html += '<div class="quiz-q" id="q-' + i + '">' +
        '<span class="q-num">' + (i + 1) + '</span>' +
        '<p class="q-text">' + q.q + '</p>' +
        '<div class="quiz-options">';
      q.opts.forEach(function (opt, j) {
        var label = String.fromCharCode(65 + j); // A, B, C, D
        html += '<button class="quiz-opt" data-q="' + i + '" data-a="' + j + '">' +
          '<strong>' + label + '.</strong> ' + opt + '</button>';
      });
      html += '</div></div>';
    });

    html += '<div class="quiz-submit-wrap">' +
      '<button class="quiz-submit" id="quiz-submit-btn" disabled>提交考核</button>' +
      '</div>' +
      '<div class="quiz-retry">' +
        (existing ? '<p style="color:var(--text-muted);font-size:0.85em;">上次成绩：' + existing.score + '/' + existing.total + '，未通过</p>' : '') +
      '</div>' +
      '<div class="quiz-result" id="quiz-result"></div>';

    container.innerHTML = html;

    bindQuizEvents(container, data, topicId);
  }

  function bindQuizEvents(container, data, topicId) {
    var selections = {};
    var submitBtn = document.getElementById('quiz-submit-btn');

    container.querySelectorAll('.quiz-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var qIdx = parseInt(this.dataset.q);
        var aIdx = parseInt(this.dataset.a);

        // Deselect previous
        container.querySelectorAll('.quiz-opt[data-q="' + qIdx + '"]').forEach(function (b) {
          b.classList.remove('selected');
        });

        this.classList.add('selected');
        selections[qIdx] = aIdx;

        // Enable submit when all answered
        submitBtn.disabled = Object.keys(selections).length < data.questions.length;
      });
    });

    submitBtn.addEventListener('click', function () {
      var score = 0;
      data.questions.forEach(function (q, i) {
        if (selections[i] === q.ans) score++;
      });

      var passed = score >= PASS_THRESHOLD;
      var quizState = getQuizState();
      quizState[topicId] = {
        score: score, total: data.questions.length,
        passed: passed, date: new Date().toISOString()
      };
      localStorage.setItem(LS_QUIZ, JSON.stringify(quizState));

      // Highlight answers
      data.questions.forEach(function (q, i) {
        var qEl = document.getElementById('q-' + i);
        qEl.classList.add('submitted');
        qEl.querySelectorAll('.quiz-opt').forEach(function (btn) {
          var aIdx = parseInt(btn.dataset.a);
          if (aIdx === q.ans) btn.classList.add('correct');
          else if (aIdx === selections[i] && aIdx !== q.ans) btn.classList.add('wrong');
        });
      });

      submitBtn.style.display = 'none';

      var resultEl = document.getElementById('quiz-result');

      if (passed) {
        resultEl.className = 'quiz-result show passed';
        resultEl.innerHTML =
          '<div class="result-icon">🎉</div>' +
          '<div class="result-title">通过！' + score + '/' + data.questions.length + ' 题正确</div>' +
          '<div class="result-score">✅ 下一个主题已解锁</div>' +
          '<a href="../index.html" class="result-next">返回首页 →</a>';
      } else {
        resultEl.className = 'quiz-result show failed';
        resultEl.innerHTML =
          '<div class="result-icon">📅</div>' +
          '<div class="result-title">' + score + '/' + data.questions.length + ' 题，未达标（需 ' + PASS_THRESHOLD + '/' + data.questions.length + '）</div>' +
          '<div class="result-score">选择一个方式解锁下一主题：</div>' +
          renderCooldownOptions(topicId);

        bindCooldownEvents(topicId);
      }
    });
  }

  /* ══════ Cooldown Options ══════ */
  function renderCooldownOptions(topicId) {
    return '<div class="cooldown-options">' +
      '<div class="cooldown-grid">' +
        '<div class="cooldown-opt" data-choice="1day">' +
          '<div class="co-icon">⏰</div>' +
          '<div class="co-label">1 天后解锁</div>' +
          '<div class="co-desc">明天再来，顺便复习</div>' +
        '</div>' +
        '<div class="cooldown-opt recommend selected" data-choice="3day">' +
          '<div class="co-icon">⏰</div>' +
          '<div class="co-label">3 天后解锁</div>' +
          '<div class="co-desc">隔几天再学，记忆更牢固</div>' +
        '</div>' +
      '</div>' +
      '<a class="cooldown-pay" href="../pay/pay.html?plan=force&topic=' + encodeURIComponent(topicId) + '">' +
        '💰 ¥1 立即解锁（不想等）' +
      '</a>' +
      '<div style="margin-top:12px;text-align:center;">' +
        '<button class="handwrite-toggle-btn" style="background:none;border:1px solid var(--border);color:var(--text-muted);padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.85em;">' +
          '✍️ 或者手写 2 遍，拍照提交 →' +
        '</button>' +
      '</div>' +
      '<div class="handwrite-area" id="handwrite-area">' +
        renderHandwriteContent(topicId) +
      '</div>' +
      '<div style="margin-top:14px;text-align:center;">' +
        '<a href="javascript:location.reload()" style="color:var(--accent);font-size:0.85em;">💡 不服？重新做一遍考核</a>' +
      '</div>' +
    '</div>';
  }

  function bindCooldownEvents(topicId) {
    var cooldownGrid = document.querySelector('.cooldown-grid');
    if (cooldownGrid) {
      cooldownGrid.querySelectorAll('.cooldown-opt').forEach(function (opt) {
        opt.addEventListener('click', function () {
          cooldownGrid.querySelectorAll('.cooldown-opt').forEach(function (o) { o.classList.remove('selected'); });
          this.classList.add('selected');
          var choice = this.dataset.choice;
          var days = choice === '1day' ? 1 : 3;
          var expiry = new Date(Date.now() + days * 86400000).toISOString();
          var cooldown = getCooldown();
          cooldown[topicId] = expiry;
          localStorage.setItem(LS_COOLDOWN, JSON.stringify(cooldown));
          location.reload();
        });
      });
    }

    var hwToggle = document.querySelector('.handwrite-toggle-btn');
    var hwArea = document.getElementById('handwrite-area');
    if (hwToggle && hwArea) {
      hwToggle.addEventListener('click', function () {
        var isOpen = hwArea.classList.contains('show');
        hwArea.classList.toggle('show', !isOpen);
        hwToggle.textContent = isOpen ? '✍️ 或者手写 2 遍，拍照提交 →' : '✍️ 收起手写区';
        hwToggle.style.color = isOpen ? 'var(--text-muted)' : 'var(--accent)';
        hwToggle.style.borderColor = isOpen ? 'var(--border)' : 'var(--accent)';
      });
    }

    bindHandwriteEvents(topicId);
  }

  function renderCooldownPanel(topicId, existing, remaining) {
    var hours = Math.ceil(remaining / 3600000);
    var cooldown = getCooldown();
    var expiryDate = new Date(cooldown[topicId]);

    return '<div class="quiz-result show failed" style="display:block;">' +
      '<div class="result-icon">⏳</div>' +
      '<div class="result-title">冷却中 · 约 ' + hours + ' 小时后自动解锁</div>' +
      '<div class="result-score">解锁时间：' + expiryDate.toLocaleDateString('zh-CN') + ' ' + expiryDate.toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}) + '</div>' +
      '<div style="margin-top:20px;">' +
        '<a class="cooldown-pay" href="../pay/pay.html?plan=force&topic=' + encodeURIComponent(topicId) + '" style="display:inline-block;padding:10px 30px;">' +
          '💰 ¥1 不等了，立即解锁' +
        '</a>' +
      '</div>' +
      '<div style="margin-top:14px;text-align:center;">' +
        '<button class="handwrite-toggle-btn" style="background:none;border:1px solid var(--border);color:var(--text-muted);padding:8px 20px;border-radius:6px;cursor:pointer;font-size:0.85em;">' +
          '✍️ 或者手写 2 遍，拍照提交 →' +
        '</button>' +
      '</div>' +
      '<div class="handwrite-area" id="handwrite-area">' +
        renderHandwriteContent(topicId) +
      '</div>' +
      '<div style="margin-top:14px;text-align:center;">' +
        '<a href="javascript:location.reload()" style="color:var(--accent);font-size:0.85em;">💡 重新做一遍考核</a>' +
      '</div>' +
    '</div>';
  }

  /* ══════ Handwriting Mode ══════ */
  function renderHandwriteContent(topicId) {
    var data = QUIZ_DATA[topicId];
    if (!data || !data.handwritingContent) return '';

    var hw = getHandwriteState(topicId);
    if (hw && hw.completed) {
      return '<div style="text-align:center;padding:16px;color:var(--green);font-weight:700;">' +
        '✅ 手写已提交 · ' + new Date(hw.date).toLocaleDateString('zh-CN') + '</div>';
    }

    return '<div class="handwrite-content">' +
      '<h4>📋 请将以下内容在纸上手写 2 遍，然后拍照提交：</h4>' +
      '<ol>' +
        data.handwritingContent.map(function (item) { return '<li>' + item + '</li>'; }).join('') +
      '</ol>' +
    '</div>' +
    '<div class="photo-upload" id="photo-upload">' +
      '<div class="pu-icon">📱</div>' +
      '<div class="pu-text">点击拍照或选择照片</div>' +
      '<div class="pu-hint">照片仅存本地，不上传服务器 · 荣誉系统</div>' +
      '<input type="file" accept="image/*" capture="environment" id="photo-input" style="display:none;">' +
      '<img class="photo-preview" id="photo-preview" alt="手写预览">' +
    '</div>' +
    '<button class="handwrite-submit" id="handwrite-submit" disabled>我已写完并拍照，提交 →</button>';
  }

  function bindHandwriteEvents(topicId) {
    var photoUpload = document.getElementById('photo-upload');
    var photoInput = document.getElementById('photo-input');
    var photoPreview = document.getElementById('photo-preview');
    var submitBtn = document.getElementById('handwrite-submit');

    if (!photoUpload || !photoInput || !submitBtn) return;

    photoUpload.addEventListener('click', function () {
      photoInput.click();
    });

    photoInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function (e) {
        photoPreview.src = e.target.result;
        photoPreview.classList.add('show');
        photoUpload.classList.add('done');
        photoUpload.querySelector('.pu-text').textContent = '✅ 照片已选择';
        photoUpload.querySelector('.pu-hint').textContent = file.name;
        submitBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    });

    submitBtn.addEventListener('click', function () {
      // Save handwriting state
      var hwData = {
        completed: true,
        date: new Date().toISOString(),
        photoPreview: photoPreview.src ? photoPreview.src.substring(0, 100) : ''
      };
      localStorage.setItem(LS_HANDWRITE + topicId, JSON.stringify(hwData));

      // Also mark quiz as passed via handwriting
      var quizState = getQuizState();
      quizState[topicId] = {
        score: 0, total: 5, passed: true,
        date: new Date().toISOString(), method: 'handwrite'
      };
      localStorage.setItem(LS_QUIZ, JSON.stringify(quizState));

      location.reload();
    });
  }

  /* ══════ Passed Result ══════ */
  function renderPassedResult(topicId, result) {
    var method = result.method === 'handwrite' ? '（手写提交）' : '';
    var idx = TOPIC_ORDER.indexOf(topicId);
    var nextId = idx >= 0 && idx < TOPIC_ORDER.length - 1 ? TOPIC_ORDER[idx + 1] : null;
    var nextPage = nextId ? '../beginner/' + TOPIC_PAGES[nextId] : '../index.html';
    var nextName = nextId ? TOPIC_NAMES[nextId] : '首页';
    var btnLabel = nextId ? '进入下一课：' + nextName + ' →' : '🎉 全部完成！返回首页 →';

    return '<div class="quiz-result show passed" style="display:block;">' +
      '<div class="result-icon">🎉</div>' +
      '<div class="result-title">已通过！' + result.score + '/' + result.total + ' 题正确 ' + method + '</div>' +
      '<div class="result-score">✅ ' + (nextId ? '下一课「' + nextName + '」已解锁' : '入门全部课程已完成！') + ' · ' + new Date(result.date).toLocaleDateString('zh-CN') + '</div>' +
      '<a href="' + nextPage + '" class="result-next">' + btnLabel + '</a>' +
    '</div>';
  }

  /* ══════ Export for homepage ══════ */
  window.getQuizState = getQuizState;
  window.getCooldown = getCooldown;
  window.isTopicUnlockedByProgress = isTopicUnlockedByProgress;
  window.getLockReason = getLockReason;

  /* ══════ Auto-init on topic pages ══════ */
  var QUIZ_TOPIC = document.querySelector('.quiz-section') ?
    document.querySelector('.quiz-section').dataset.topic : null;

  if (QUIZ_TOPIC) {
    document.addEventListener('DOMContentLoaded', function () {
      renderQuiz(QUIZ_TOPIC);
    });
  }
})();
