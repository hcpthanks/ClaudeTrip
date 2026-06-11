/* ═══════════════════════════════════════════════════════
   ⑩ 学习考核系统 — 5题 / 80%达标 / 冷却选择 / 手写模式
   ═══════════════════════════════════════════════════════ */

/* ══════ 内联防盗锁 — 非官方域名拦截付费入口 ══════ */
(function () {
  'use strict';
  var CFG = (window.CC_SITE_CONFIG && window.CC_SITE_CONFIG.allowedDomains)
    ? window.CC_SITE_CONFIG
    : {
        allowedDomains: ['hcpthanks.github.io', 'hcpthanks.com', 'www.hcpthanks.com', 'localhost', '127.0.0.1'],
        officialPayUrl: 'https://www.hcpthanks.com/pay/pay.html'
      };
  var DOMAINS = CFG.allowedDomains;
  var PAY_URL = CFG.officialPayUrl;
  var host = (window.location.hostname || '').toLowerCase();

  function isOfficial() {
    for (var i = 0; i < DOMAINS.length; i++) {
      if (host === DOMAINS[i] || host.endsWith('.' + DOMAINS[i])) return true;
    }
    return host === '';
  }

  if (!isOfficial()) {
    // 拦截所有指向 pay/pay.html 的链接点击，重定向到官方支付页
    document.addEventListener('click', function (e) {
      var el = e.target;
      while (el && el.tagName !== 'A') el = el.parentElement;
      if (!el) return;
      var href = el.getAttribute('href') || '';
      if (href.indexOf('pay/pay.html') === -1 && href.indexOf('pay%2Fpay.html') === -1) return;

      e.preventDefault();
      // 提取原始参数
      var m = href.match(/plan=([^&]+)/);
      var plan = m ? decodeURIComponent(m[1]) : 'all';
      m = href.match(/topic=([^&]+)/);
      var topic = m ? decodeURIComponent(m[1]) : '';

      var url = PAY_URL + '?plan=' + encodeURIComponent(plan);
      if (topic) url += '&topic=' + encodeURIComponent(topic);
      url += '&ref=' + encodeURIComponent(host) + '&hijacked=1';

      if (confirm('⚠️ 当前网站（' + host + '）非官方站点。\n即将跳转到官方支付页面，付款直接付给原作者。\n是否继续？')) {
        window.location.href = url;
      }
    }, true);
    console.log('[quiz内联防护] anti-theft.js 缺失，已启用付费入口保护');
  }
})();
/* ════════════════════════════════════════════════════════════ */

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
    'pc-basics': {
      handwritingContent: [
        '桌面就是开机后看到的整个画面，上面有图标（快捷方式）',
        '开始菜单在屏幕左下角，点一下能看到电脑里所有程序',
        '文件夹就像抽屉，里面可以放文件和其他文件夹；文件夹是黄色图标',
        '双击文件夹可以打开它，点 ✕ 可以关掉，关掉不等于删除'
      ],
      questions: [
        { q: '开始菜单在屏幕的哪里？',
          opts: ['右上角', '左下角', '正中间', '没有这个东西'],
          ans: 1 },
        { q: '桌面上的小图标叫什么？',
          opts: ['按钮', '快捷方式', '文件夹（不是所有图标都是文件夹）', '菜单'],
          ans: 1 },
        { q: '文件夹像什么？',
          opts: ['一张纸', '一个抽屉——里面可以放文件', '一个按钮', '一个开关'],
          ans: 1 },
        { q: '怎么打开一个文件夹？',
          opts: ['点一下', '快速点两下（双击）', '点右键', '按回车'],
          ans: 1 },
        { q: '点窗口右上角的 ✕ 会怎样？',
          opts: ['删掉这个文件夹', '关掉这个窗口——文件还在', '电脑关机', '什么都不会发生'],
          ans: 1 }
      ]
    },
    'open-ps': {
      handwritingContent: [
        'PowerShell 是给电脑发指令的窗口，就像跟电脑发微信',
        '打开方法一：点任务栏搜索框→输入powershell→点图标（最简单）',
        '打开方法二：右键点开始菜单图标→选择Windows PowerShell',
        '打开后看到蓝色/黑色窗口+闪烁光标=成功了，那个光标就是你打字的地方'
      ],
      questions: [
        { q: 'PowerShell 是做什么的？',
          opts: ['上网用的', '给电脑发指令的窗口', '写文档用的', '画图工具'],
          ans: 1 },
        { q: '最简单打开 PowerShell 的方法是什么？',
          opts: ['去文件夹里找', '搜索框输入 powershell 然后点图标', '右键桌面', '按键盘上的电源键'],
          ans: 1 },
        { q: 'PowerShell 打开后是什么颜色的？',
          opts: ['一定是黑色', '蓝色或黑色', '白色', '红色'],
          ans: 1 },
        { q: '如果搜不到 PowerShell 怎么办？',
          opts: ['电脑坏了', '检查拼写（powershell），或者用右键开始菜单', '重装系统', '放弃'],
          ans: 1 },
        { q: '打开 PowerShell 后，光标在哪里闪烁？',
          opts: ['在窗口顶部', '在窗口最下面一行 > 符号后面', '在任务栏上', '在桌面上'],
          ans: 1 }
      ]
    },
    'install-cc': {
      handwritingContent: [
        '装 Claude Code 前必须先装 Node.js——就跟盖房子要先打地基',
        '装 Node.js：浏览器打开 nodejs.org→点绿色LTS按钮下载→双击安装（一路点Next）',
        '验证 Node.js：PowerShell输入 node --version（看到版本号=成功）',
        '装 Claude Code：PowerShell输入 npm install -g @anthropic-ai/claude-code'
      ],
      questions: [
        { q: '装 Claude Code 之前必须先装什么？',
          opts: ['微信', 'Chrome 浏览器', 'Node.js', '不需要装别的'],
          ans: 2 },
        { q: 'Node.js 在哪里下载？',
          opts: ['微信小程序里', 'nodejs.org 网站', 'Windows 应用商店', '百度网盘'],
          ans: 1 },
        { q: '安装 Node.js 的时候要注意什么？',
          opts: ['把所有选项都勾上', '一路点 Next，用默认设置就行', '必须改安装路径', '要先卸载其他程序'],
          ans: 1 },
        { q: '怎么验证 Node.js 装好了？',
          opts: ['看桌面有没有图标', 'PowerShell里输入 node --version 看有没有版本号', '重启电脑', '打开浏览器看'],
          ans: 1 },
        { q: '安装 Claude Code 的命令是什么？',
          opts: ['npm install claude', 'npm install -g @anthropic-ai/claude-code', 'pip install claude-code', 'brew install claude'],
          ans: 1 }
      ]
    },
    'first-chat': {
      handwritingContent: [
        '启动 Claude Code：打开PowerShell→输入claude→按回车',
        '第一次可能需登录：复制提示中的网址到浏览器打开→完成登录',
        '跟AI说话用中文，就像发微信一样，不用特殊格式',
        '退出对话：输入/exit然后回车，或者直接关窗口'
      ],
      questions: [
        { q: '怎么启动 Claude Code？',
          opts: ['双击桌面图标', 'PowerShell 里输入 claude 按回车', '打开浏览器', '按 F5'],
          ans: 1 },
        { q: '跟 Claude Code 说话要用什么语言？',
          opts: ['必须用英文', '中文就可以，就像发微信', '必须用代码', '用拼音'],
          ans: 1 },
        { q: '输入消息后 AI 没立刻回复——为什么？',
          opts: ['AI 坏了', 'AI 在思考，需要等几秒', '电脑死机了', '网络断了'],
          ans: 1 },
        { q: '怎么退出 Claude Code？',
          opts: ['直接拔电源', '输入 /exit 然后回车', '按 ESC 键', '必须等它自己结束'],
          ans: 1 },
        { q: '如果你不知道跟 AI 说什么，可以怎么办？',
          opts: ['关掉窗口', '试试说"你好，请介绍一下你自己"', '一直等着', '重装软件'],
          ans: 1 }
      ]
    },
    'file-basics': {
      handwritingContent: [
        '路径就是文件在电脑里的地址，像一个快递地址一层一层定位',
        'pwd = 查看当前在哪个文件夹（像手机地图上的"你在这里"）',
        'ls = 列出当前文件夹里有什么（像打开抽屉看一眼）',
        'cd 文件夹名 = 进入那个文件夹；cd .. = 回到上一级'
      ],
      questions: [
        { q: '"路径"可以理解为什么？',
          opts: ['电脑的开机时间', '文件在电脑里的地址', '电脑的型号', '键盘的布局'],
          ans: 1 },
        { q: 'pwd 命令的作用是什么？',
          opts: ['删除文件', '显示你当前在哪个文件夹', '创建新文件夹', '关机'],
          ans: 1 },
        { q: 'ls 命令的作用是什么？',
          opts: ['列出文件夹里有什么', '删除文件夹', '重命名文件', '打开浏览器'],
          ans: 0 },
        { q: 'cd Desktop 做了什么？',
          opts: ['删除了桌面', '进入了桌面文件夹', '创建了一个叫 Desktop 的文件', '什么都没做'],
          ans: 1 },
        { q: 'cd .. 做了什么？',
          opts: ['向前走', '回到上一级文件夹', '删除当前文件夹', '打开一个新窗口'],
          ans: 1 }
      ]
    },
    troubleshoot: {
      handwritingContent: [
        '遇到错误三步法：①截图保存→②读Error后面的关键信息→③复制发给AI分析',
        '报错不是"你做错了"——是电脑在告诉你"我不知道怎么继续了"',
        '重启能解决约50%的奇怪问题，重装能解决约70%',
        '/clear 命令可以清空 Claude Code 的对话上下文，重新开始'
      ],
      questions: [
        { q: '遇到红色报错，第一步应该做什么？',
          opts: ['立刻关掉窗口', '截图保存', '砸键盘', '假装没看到'],
          ans: 1 },
        { q: '遇到报错后，错误信息里最关键的是哪部分？',
          opts: ['前面的一大堆路径', '"Error" 后面的那行说明', '版本号', '时间戳'],
          ans: 1 },
        { q: '如果所有方法都试了还不行，可以怎么办？',
          opts: ['把电脑扔了', '把报错截图发给AI（Claude或网页版）让它分析', '自己乱试', '等它自己好'],
          ans: 1 },
        { q: '重启电脑大概能解决多少问题？',
          opts: ['0%——重启没用', '约 50%——很多问题重启就好', '100%——重启万能', '10%'],
          ans: 1 },
        { q: '/clear 命令的作用是什么？',
          opts: ['清除电脑上的所有文件', '清空 Claude Code 的对话上下文，重新开始', '删除 PowerShell', '格式化硬盘'],
          ans: 1 }
      ]
    },
    deepseek: {
      handwritingContent: [
        'Agent产品 = "壳" + "大脑"：Claude Code是壳（负责干活），DeepSeek是大脑（负责思考）',
        '用Workbuddy装Node.js/Git/Claude Code：说人话"帮我安装XXX"，它帮你执行',
        'ccswitch = 模型转换器，DeepSeek API Key = 钥匙，模型名要改成 deepseek-v4-flash[1m]',
        'VS Code + Claude Code插件 = 可视化驾驶舱，CLAUDE.md = AI的员工档案，权限模式 = 安全锁'
      ],
      questions: [
        { q: 'Claude Code 是"壳"，那"大脑"（大模型）可以是哪个？',
          opts: ['只能是 Claude', 'DeepSeek 或其他大模型都可以', '只能是 ChatGPT', '不需要大模型'],
          ans: 1 },
        { q: 'API Key 创建后，关掉弹窗之前必须做什么？',
          opts: ['截图发朋友圈', '马上复制保存到记事本——关了再也看不到了', '不用管它', '拍照留念'],
          ans: 1 },
        { q: 'ccswitch 里 DeepSeek 的模型名应该改成什么？',
          opts: ['DeepSeek-V3.2', 'claude-opus-4-8', 'deepseek-v4-flash[1m]', 'gpt-4o'],
          ans: 2 },
        { q: '怎么验证 DeepSeek 已经接入成功了？',
          opts: ['看桌面有没有新图标', '问 AI "你是什么模型？"，回答提到 DeepSeek', '重启电脑', '检查网速'],
          ans: 1 },
        { q: 'CLAUDE.md 文件的作用是什么？',
          opts: ['只是装饰文件', '告诉 AI 你的习惯和偏好——就像一份员工档案', '存密码用的', '写日记用的'],
          ans: 1 }
      ]
    },
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
    },
    'ai-for-business': {
      handwritingContent: [
        'AI 不是万能的，但它能帮你写文案、回消息、整理信息、算账、做图',
        '不需要学英语、不需要学写代码，用中文跟 AI 聊天就行',
        'AI 就像一个"不要工资的小工"——你告诉他做什么，他帮你做',
        '最重要的不是 AI 多厉害，而是你要敢试——试了才知道它能帮你什么'
      ],
      questions: [
        { q: 'AI 能帮你做什么？（选一个最对的）',
          opts: ['只能写代码', '写文案、回消息、整理信息、算账——很多事', '只能聊天', '只能做数学题'],
          ans: 1 },
        { q: '跟 AI 聊天需要会英语吗？',
          opts: ['需要', '不需要——用中文就行', '需要日语', '需要法语'],
          ans: 1 },
        { q: 'AI 可以帮个体户做什么？',
          opts: ['只能写论文', '写朋友圈卖货文案、回客户消息、整理账目', '只能写诗', '什么都不会'],
          ans: 1 },
        { q: '用好 AI 最关键的是什么？',
          opts: ['会写代码', '敢试——先试了再说', '英语好', '数学好'],
          ans: 1 },
        { q: 'AI 写出来的东西你能直接用吗？',
          opts: ['不能', '可以——但最好是你看一遍改一改再用', 'AI不让用', '需要付费才能用'],
          ans: 1 }
      ]
    },
    'talk-to-ai': {
      handwritingContent: [
        '跟 AI 说话的三句话公式：①我是谁 ②我要什么 ③要什么样的结果',
        '举例：我是五金店主→帮我写一段卖螺丝刀的文案→要口语化、50字左右',
        '说清楚"背景+目标+要求"，AI 就能一次答对；说得越模糊，AI 越乱猜',
        'AI 不是读心术——你给的信息越多，它回的越准。不要怕啰嗦'
      ],
      questions: [
        { q: '跟 AI 说话的"三句话公式"是哪三句？',
          opts: ['你好+再见+谢谢', '我是谁+我要什么+要什么样的结果', '今天+明天+后天', '过去+现在+将来'],
          ans: 1 },
        { q: '"帮我写个文案"——这句话有什么问题？',
          opts: ['没问题，AI应该能懂', '太模糊了——没说卖什么、什么风格、多长', '太长了', '用英语说更好'],
          ans: 1 },
        { q: '让 AI 一次就答对的关键是什么？',
          opts: ['运气', '背景+目标+要求说清楚', '多给钱', '多试几次猜'],
          ans: 1 },
        { q: '跟 AI 说话怕啰嗦怎么办？',
          opts: ['尽量少说', '不用怕——信息越多它回得越准', '只发图片', '只发语音'],
          ans: 1 },
        { q: '下面哪句话 AI 最容易听懂？',
          opts: ['"帮我写个东西"', '"我是卖茶叶的，帮我写一段朋友圈文案介绍新到的龙井，要口语化、80字左右"', '"写"', '"hello"'],
          ans: 1 }
      ]
    },
    'ai-writing': {
      handwritingContent: [
        '用 Claude Code 写文案：打开 PowerShell→输入需求→AI 写出文案→改到满意',
        '写文案要告诉 AI：卖什么东西、卖给谁、什么风格、多少字',
        'AI 写的第一版不满意很正常——告诉它哪里不好，让它改，改到满意为止',
        '改文案的万能话术："这个太官方了，改成口语化的" / "太长了，缩到50字" / "加一个吸引人的开头"'
      ],
      questions: [
        { q: '让 AI 写朋友圈卖货文案，第一步是什么？',
          opts: ['直接让AI写', '想清楚：卖什么、卖给谁、什么风格、多少字', '先学语文', '先学英语'],
          ans: 1 },
        { q: 'AI 写的第一版不满意怎么办？',
          opts: ['算了不用了', '告诉 AI 哪里不好，让它改——很正常', '骂 AI', '换一个 AI'],
          ans: 1 },
        { q: '想让文案更口语化，应该怎么说？',
          opts: ['"改"', '"这个太官方了，改成像跟朋友聊天那样"', '"重写"', '"不好"'],
          ans: 1 },
        { q: '用 Claude Code 写文案需要在哪个窗口操作？',
          opts: ['浏览器', 'PowerShell（黑窗口/蓝窗口）', 'Word文档', 'Excel表格'],
          ans: 1 },
        { q: 'AI 写的文案能直接发朋友圈吗？',
          opts: ['不能', '可以——但最好自己看一遍改一改再用', 'AI禁止商用', '需要标注是AI写的'],
          ans: 1 }
      ]
    },
    'bridge-to-coding': {
      handwritingContent: [
        '你已经学会跟 AI 聊天、让它帮你写文案——这就是用 AI 的核心能力',
        '接下来你可以学更多：快捷键让你更快、对话技巧让 AI 更听你的',
        '入门课 6 节会把你的 AI 能力再提升一个台阶——从"会聊天"到"会用AI干活"',
        '不用急，一节一节来。每学完一节做 5 道题，过关了再学下一节'
      ],
      questions: [
        { q: '学完应用课，你已经掌握了什么？',
          opts: ['会写代码了', '会用 AI 聊天、让 AI 帮你写文案了', '会修电脑了', '会做网站了'],
          ans: 1 },
        { q: '接下来应该学什么？',
          opts: ['直接跳到专家课', '按顺序学入门课的 6 节', '不用学了', '随便点一个'],
          ans: 1 },
        { q: '每学完一节课，怎么知道自己过关了？',
          opts: ['自己觉得会了就行', '做 5 道题，至少对 4 道（80分）', '问AI', '不用检查'],
          ans: 1 },
        { q: '入门课主要教什么？',
          opts: ['怎么做饭', '快捷键、对话技巧、日常工作流——让AI更听你的', '怎么开车', '怎么种地'],
          ans: 1 },
        { q: '学不会怎么办？',
          opts: ['算了', '回预备课再看一遍，或者直接问 AI "我不懂这个，帮我解释"', '骂人', '放弃'],
          ans: 1 }
      ]
    },
    'core-commands': {
      handwritingContent: [
        '七个核心命令：/plan做事前先计划、/tdd测试驱动开发、/code-review代码审查、/build-fix自动修构建、/verify全面验证、/save-session保存会话、/learn-eval提取经验',
        '标准开发流顺序：/plan → 确认 → /tdd → /code-review → /verify → /save-session，早上打开电脑按这个走',
        '/plan的核心价值是防止AI一上来就写偏——计划改起来比代码快10倍',
        '/code-review审查四个等级：CRITICAL安全漏洞必须修、HIGH应该修、MEDIUM建议修、LOW可选'
      ],
      questions: [
        { q: '开始一个新任务之前，应该先用哪个命令？',
          opts: ['直接让 AI 写代码', '/plan 先做计划', '/clear 清空', '什么都不做'],
          ans: 1 },
        { q: '/code-review 发现的 CRITICAL 级别问题，应该怎么处理？',
          opts: ['忽略，不重要', '必须修——这是安全漏洞或数据丢失风险', '下个月再修', '随便看看'],
          ans: 1 },
        { q: '标准开发流中，/tdd 之后应该做什么？',
          opts: ['直接提交代码', '/code-review 代码审查', '关掉电脑', '发朋友圈'],
          ans: 1 },
        { q: '构建报错了（红色错误），应该敲什么？',
          opts: ['/build-fix 让 AI 自动修', '自己慢慢看', '不管它继续写', '重装系统'],
          ans: 0 },
        { q: '下班之前，应该敲什么命令保存进度？',
          opts: ['直接关窗口', '/save-session', '/exit', '/clear'],
          ans: 1 }
      ]
    },
    'context-cost': {
      handwritingContent: [
        '上下文就是AI能记住的最近对话——窗口200K tokens（约15万中文字），满了AI会"忘记"前面的内容',
        '省钱口诀：日常用Sonnet（性价比最高），简单用Haiku（便宜快速），搞不定再上Opus（推理最强）',
        '节省上下文6个方法：关掉不用的MCP、打Checkpoint存档、手动/compact压缩、分叉/fork对话、新开会话、精准@引用文件',
        '/context-budget查看已用多少上下文，/checkpoint在关键节点存档防丢失'
      ],
      questions: [
        { q: 'Claude Code 的上下文窗口大概多大？',
          opts: ['1000 tokens', '200K tokens（约15万中文字）', '无限大', '1万 tokens'],
          ans: 1 },
        { q: '日常写代码、做审查，应该选哪个模型？',
          opts: ['必须用 Opus（最贵）', 'Sonnet——性价比最高，90%任务都胜任', '只能用 Haiku', '随便选'],
          ans: 1 },
        { q: 'MCP 插件开多了会有什么问题？',
          opts: ['没有任何影响', '严重占用上下文——开了20个可能只剩70K给你用', '会让电脑变快', '会让AI变聪明'],
          ans: 1 },
        { q: '感觉 Claude "变笨了"、开始忘事，第一件事应该做什么？',
          opts: ['骂它', '敲 /context-budget 看看上下文是不是满了', '重装 Claude Code', '换一台电脑'],
          ans: 1 },
        { q: '做了重要功能后，应该敲什么防止丢失？',
          opts: ['什么都不做', '/checkpoint 存档', '/clear 清空', '/exit 退出'],
          ans: 1 }
      ]
    },
    'workflow-patterns': {
      handwritingContent: [
        '四种工作流模式：A标准开发流（/plan→/tdd→/code-review→/verify→/save-session）、B快速修复流（描述Bug→分析→/tdd复现测试→修复→/verify）、C学习研究流（问问题→讲解→练习→/learn-eval→/evolve）、D日常运维流（!命令→@文件名→/docs→/@git log）',
        '模式A最推荐：先计划不会跑偏、TDD有测试保护改不坏、审查抓低级错误、验证确认能跑、保存明天继续',
        '模式B关键一步：先写复现测试——确保Bug以后不会再偷偷回来',
        '遇到新任务第一步：判断场景→选对应模式→按流程走，不是所有情况都适合标准开发流'
      ],
      questions: [
        { q: '要加一个新功能，应该用哪个工作流模式？',
          opts: ['模式 B：快速修复流', '模式 A：标准开发流（/plan→/tdd→/code-review→/verify）', '模式 D：日常运维流', '乱做就行'],
          ans: 1 },
        { q: '线上出 Bug 了，模式 B 最关键的一步是什么？',
          opts: ['直接改代码', '先写复现测试——确保 Bug 不会再回来', '先重启服务器', '先通知所有人'],
          ans: 1 },
        { q: '学了新技术后，模式 C 最后一步应该做什么？',
          opts: ['忘掉它', '/learn-eval 提取知识点保存', '关掉电脑', '再学一遍'],
          ans: 1 },
        { q: '"!npm install" 中感叹号的作用是什么？',
          opts: ['表示很激动', '直接在终端执行命令，不让 AI 思考', '表示危险操作', '没有特殊含义'],
          ans: 1 },
        { q: '不确定该用哪个模式时，怎么办？',
          opts: ['随便选一个', '看场景——新功能用A、修Bug用B、学东西用C、杂活用D', '全部都用一遍', '放弃'],
          ans: 1 }
      ]
    },
    '21-day-plan': {
      handwritingContent: [
        '21天计划分三周：第一周基础入门（7个核心命令用顺手）、第二周进阶技能（高级功能）、第三周高手之路（自由组合）',
        '每天只做1-2项，每项约10-15分钟，不要跳——第一周必须打牢后面才跟得上',
        '勾了才算完成——每做完一项立刻勾上，看进度条涨有成就感。忘了一天别放弃，第二天补上就行',
        '21天后这些命令会形成肌肉记忆，你不再是一个"会用电脑的人"，而是一个"能指挥AI干活的人"'
      ],
      questions: [
        { q: '21天计划第一周的主要目标是什么？',
          opts: ['做大项目', '把7个核心命令用顺手——打牢基本功', '学完全部高级功能', '随便看看'],
          ans: 1 },
        { q: '每天应该做几项任务？',
          opts: ['能做的全做了', '每天只做1-2项——每项约10-15分钟', '一口气做7项', '不用做'],
          ans: 1 },
        { q: '忘了一天没打卡怎么办？',
          opts: ['从头开始', '第二天补上就行——不用从头来', '放弃整个计划', '骂自己'],
          ans: 1 },
        { q: '21天后你会变成什么样？',
          opts: ['跟现在一样', '能指挥AI干活——命令变成肌肉记忆，不用想就能用', '会写操作系统', '变成程序员'],
          ans: 1 },
        { q: '第一周第7天的最后一步是什么？',
          opts: ['关掉电脑', '/pr 创建第一个Pull Request', '重装系统', '删除所有代码'],
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

    // (¥1 force unlock removed — quiz pass or handwrite required)

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
      '<!-- ¥1 跳过已移除 -->' +
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
        '<!-- ¥1 跳过已移除 -->' +
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
    var nextPage = nextId ? (window.topicPagePath ? window.topicPagePath(nextId) : '../beginner/' + TOPIC_PAGES[nextId]) : '../index.html';
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
