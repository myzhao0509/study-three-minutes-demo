(function () {
  const STORAGE_TASKS = 'studyThreeMinutes.tasks';
  const STORAGE_COUNT = 'studyThreeMinutes.launchCount';

  const defaultTasks = [
    {
      title: '背 3 个单词',
      desc: '打开单词本，只背 3 个今天最眼熟的词。背完就算完成，不要求继续。'
    },
    {
      title: '读 1 个定义',
      desc: '打开正在学的资料，只读一个定义，并圈出你觉得最关键的 2 个词。'
    },
    {
      title: '写一道题的第一步',
      desc: '不用做完整题，只写出已知条件、要求什么，以及你想到的第一个公式。'
    },
    {
      title: '整理 3 个关键词',
      desc: '从今天要学的内容里挑出 3 个关键词，写在纸上或备忘录里。'
    },
    {
      title: '看 90 秒课程',
      desc: '只看一小段课程视频，并写下一个问题。看到这里就可以停。'
    },
    {
      title: '改一句文字',
      desc: '打开作业、论文或笔记，只修改一句不顺的表达。不要强迫自己写完。'
    }
  ];

  const screens = {
    home: document.getElementById('homeScreen'),
    game: document.getElementById('gameScreen'),
    edit: document.getElementById('editScreen'),
    timer: document.getElementById('timerScreen'),
    result: document.getElementById('resultScreen')
  };

  const els = {
    demoToggle: document.getElementById('demoToggle'),
    demoBadge: document.getElementById('demoBadge'),
    rescueBtn: document.getElementById('rescueBtn'),
    rollBtn: document.getElementById('rollBtn'),
    diceCube: document.getElementById('diceCube'),
    rollHint: document.getElementById('rollHint'),
    taskCard: document.getElementById('taskCard'),
    taskNumber: document.getElementById('taskNumber'),
    taskTitle: document.getElementById('taskTitle'),
    taskDesc: document.getElementById('taskDesc'),
    startStudyBtn: document.getElementById('startStudyBtn'),
    openEditBtn: document.getElementById('openEditBtn'),
    taskInputs: document.getElementById('taskInputs'),
    taskEditor: document.getElementById('taskEditor'),
    resetTasksBtn: document.getElementById('resetTasksBtn'),
    timerTask: document.getElementById('timerTask'),
    timerDisplay: document.getElementById('timerDisplay'),
    unlockHint: document.getElementById('unlockHint'),
    progressBar: document.getElementById('progressBar'),
    finishBtn: document.getElementById('finishBtn'),
    cancelTimerBtn: document.getElementById('cancelTimerBtn'),
    resultBadge: document.getElementById('resultBadge'),
    resultTitle: document.getElementById('resultTitle'),
    resultMessage: document.getElementById('resultMessage'),
    finalTime: document.getElementById('finalTime'),
    launchCount: document.getElementById('launchCount'),
    againBtn: document.getElementById('againBtn'),
    homeBtn: document.getElementById('homeBtn')
  };

  let tasks = loadTasks();
  let selectedIndex = 0;
  let timerId = null;
  let elapsed = 0;
  let demoMode = false;

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_TASKS));
      if (Array.isArray(saved) && saved.length === 6) {
        return saved;
      }
    } catch (error) {
      return defaultTasks.slice();
    }
    return defaultTasks.slice();
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
  }

  function showScreen(name) {
    Object.values(screens).forEach(function (screen) {
      screen.classList.remove('active');
    });
    screens[name].classList.add('active');
  }

  function formatTime(seconds) {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  function renderTaskInputs() {
    els.taskInputs.innerHTML = '';
    tasks.forEach(function (task, index) {
      const item = document.createElement('div');
      item.className = 'task-item';
      item.innerHTML = `
        <label>点数 ${index + 1}</label>
        <input value="${escapeHtml(task.title)}" data-field="title" data-index="${index}" aria-label="点数 ${index + 1} 的任务标题">
        <textarea data-field="desc" data-index="${index}" aria-label="点数 ${index + 1} 的任务描述">${escapeHtml(task.desc)}</textarea>
      `;
      els.taskInputs.appendChild(item);
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rollDice() {
    els.rollBtn.classList.add('rolling');
    els.diceCube.classList.add('rolling');
    els.rollHint.textContent = '骰子正在找一个最小开始方式...';
    els.taskCard.classList.add('hidden');

    let flashes = 0;
    const flashId = setInterval(function () {
      setDiceFace(Math.floor(Math.random() * 6) + 1);
      flashes += 1;
      if (flashes >= 20) {
        clearInterval(flashId);
        selectedIndex = Math.floor(Math.random() * 6);
        setTimeout(function () {
          setDiceFace(selectedIndex + 1);
          revealTask(selectedIndex);
          els.rollBtn.classList.remove('rolling');
          els.diceCube.classList.remove('rolling');
        }, 440);
      }
    }, 82);
  }

  function setDiceFace(number) {
    for (let i = 1; i <= 6; i += 1) {
      els.diceCube.classList.remove(`face-${i}`);
    }
    els.diceCube.classList.add(`face-${number}`);
    els.rollBtn.setAttribute('aria-label', `掷骰子，当前点数 ${number}`);
  }

  function revealTask(index) {
    const task = tasks[index];
    els.rollHint.textContent = '抽到任务卡，可以开始学习了';
    els.taskNumber.textContent = `点数 ${index + 1}`;
    els.taskTitle.textContent = task.title;
    els.taskDesc.textContent = task.desc;
    els.taskCard.classList.remove('hidden');
  }

  function startTimer() {
    clearInterval(timerId);
    elapsed = 0;
    const task = tasks[selectedIndex];
    els.timerTask.textContent = `当前任务：${task.title}`;
    els.timerDisplay.textContent = '00:00';
    els.unlockHint.textContent = demoMode ? '演示模式：显示满 03:00 后可结束' : '满 03:00 后可结束';
    els.progressBar.style.width = '0%';
    els.finishBtn.disabled = true;
    els.finishBtn.classList.add('disabled');
    els.finishBtn.textContent = '还差一点点';
    showScreen('timer');

    timerId = setInterval(function () {
      elapsed += demoMode ? 6 : 1;
      updateTimer();
    }, 1000);
  }

  function updateTimer() {
    els.timerDisplay.textContent = formatTime(elapsed);
    const progress = Math.min((elapsed / 180) * 100, 100);
    els.progressBar.style.width = `${progress}%`;

    if (elapsed >= 180 && els.finishBtn.disabled) {
      els.finishBtn.disabled = false;
      els.finishBtn.classList.remove('disabled');
      els.finishBtn.textContent = '结束学习，看看反馈';
      els.unlockHint.textContent = '已经完成一次启动，可以结束，也可以继续学';
    }

    if (elapsed >= 600 && elapsed < 1500) {
      els.unlockHint.textContent = '你已经超过 10 分钟，学习惯性开始反向帮你了';
    }

    if (elapsed >= 1500) {
      els.unlockHint.textContent = '已经进入 25 分钟专注区，这次启动很漂亮';
    }
  }

  function finishStudy() {
    if (elapsed < 180) return;
    clearInterval(timerId);
    const count = Number(localStorage.getItem(STORAGE_COUNT) || '0') + 1;
    localStorage.setItem(STORAGE_COUNT, String(count));

    const feedback = getFeedback(elapsed);
    els.resultBadge.textContent = feedback.badge;
    els.resultTitle.textContent = feedback.title;
    els.resultMessage.textContent = feedback.message;
    els.finalTime.textContent = formatTime(elapsed);
    els.launchCount.textContent = count;
    showScreen('result');
  }

  function getFeedback(seconds) {
    if (seconds >= 1500) {
      return {
        badge: '专注建造者',
        title: '你把三分钟变成了一段真正的学习',
        message: '这次不只是开始了，你还顺着惯性走了很远。能把注意力留住 25 分钟，本身就是很强的自我夺回。'
      };
    }
    if (seconds >= 600) {
      return {
        badge: '稳定启动者',
        title: '你已经越过了最难的开头',
        message: '10 分钟说明你不只是碰了一下任务，而是真的进入了状态。今天的学习已经有了一个稳定起点。'
      };
    }
    return {
      badge: '微光启动者',
      title: '你完成了一次切换',
      message: '微小的进步，也是铸成大厦的一块砖。今天至少有一刻，你从“停不下来”回到了“我可以选择”。'
    };
  }

  function toggleDemoMode() {
    demoMode = !demoMode;
    els.demoToggle.classList.toggle('active', demoMode);
    els.demoBadge.textContent = demoMode ? '演示模式：30 秒左右解锁' : '真实模式';
  }

  function cancelTimer() {
    clearInterval(timerId);
    showScreen('home');
  }

  els.rescueBtn.addEventListener('click', function () {
    els.taskCard.classList.add('hidden');
    setDiceFace(1);
    els.rollHint.textContent = '点击骰子开始';
    showScreen('game');
  });

  els.rollBtn.addEventListener('click', rollDice);
  els.startStudyBtn.addEventListener('click', startTimer);
  els.finishBtn.addEventListener('click', finishStudy);
  els.cancelTimerBtn.addEventListener('click', cancelTimer);
  els.demoToggle.addEventListener('click', toggleDemoMode);

  els.openEditBtn.addEventListener('click', function () {
    renderTaskInputs();
    showScreen('edit');
  });

  els.taskEditor.addEventListener('submit', function (event) {
    event.preventDefault();
    const next = defaultTasks.map(function (_, index) {
      const title = els.taskInputs.querySelector(`[data-index="${index}"][data-field="title"]`).value.trim();
      const desc = els.taskInputs.querySelector(`[data-index="${index}"][data-field="desc"]`).value.trim();
      return {
        title: title || defaultTasks[index].title,
        desc: desc || defaultTasks[index].desc
      };
    });
    tasks = next;
    saveTasks();
    showScreen('game');
  });

  els.resetTasksBtn.addEventListener('click', function () {
    tasks = defaultTasks.slice();
    saveTasks();
    renderTaskInputs();
  });

  els.againBtn.addEventListener('click', function () {
    els.taskCard.classList.add('hidden');
    setDiceFace(1);
    els.rollHint.textContent = '点击骰子开始';
    showScreen('game');
  });

  els.homeBtn.addEventListener('click', function () {
    showScreen('home');
  });
})();
