/* ==================== 有米角色图片渲染 ==================== */
function createYouniImg(containerId, poseName) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  var img = document.createElement('img');
  img.src = 'youni/' + poseName + '.png';
  img.style.cssText = 'width:140px; height:auto; position:absolute; bottom:0; left:0; pointer-events:none;';
  container.appendChild(img);
  applyOutfit(containerId);
}

function setYouniPose(containerId, poseName) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var img = container.querySelector('img');
  if (img) {
    img.src = 'youni/' + poseName + '.png';
  }
  applyOutfit(containerId);
}

function applyOutfit(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var img = container.querySelector('img');
  if (!img) return;
  /* 围裙颜色：CSS hue-rotate */
  img.style.filter = state.outfit.apronHue ? 'hue-rotate(' + state.outfit.apronHue + 'deg)' : '';
  /* 清除旧配饰 */
  container.querySelectorAll('.outfit-overlay').forEach(function(el) { el.remove(); });
  /* 眼镜 */
  if (state.outfit.glasses !== 'none') {
    var glasses = document.createElement('div');
    glasses.className = 'outfit-overlay outfit-glasses';
    glasses.textContent = state.outfit.glasses;
    container.appendChild(glasses);
  }
  /* 帽子 */
  if (state.outfit.hat !== 'none') {
    var hat = document.createElement('div');
    hat.className = 'outfit-overlay outfit-hat';
    hat.textContent = state.outfit.hat;
    container.appendChild(hat);
  }
}

function showYouniPoseSeq(containerId, sequence) {
  return sequence.reduce(function(promise, step) {
    return promise.then(function() {
      return new Promise(function(resolve) {
        setYouniPose(containerId, step.pose);
        setTimeout(resolve, step.duration);
      });
    });
  }, Promise.resolve());
}

function startYouniIdle(containerId) {
  var blinkTimer = setInterval(function() {
    var container = document.getElementById(containerId);
    if (!container) { clearInterval(blinkTimer); return; }
    var img = container.querySelector('img');
    if (!img) return;
    var currentSrc = img.src;
    img.src = 'youni/11-idle-blink.png';
    setTimeout(function() {
      if (img) img.src = currentSrc;
    }, 200);
  }, 5000 + Math.random() * 3000);
  return blinkTimer;
}


/* ==================== 浮尘粒子 ==================== */
/* ==================== 全局状态与工具 ==================== */
var state = {
  preferences: { spicy: null, soup: null, taboo: '', staple: null, flavor: null },
  history: [],
  unlocked: 0,
  currentResult: null,
  currentOptions: [],
  currentWeights: [],
  currentWeather: '',
  currentPage: 0,
  spinTimestamps: [],
  achievements: [],
  outfit: { apronHue: 0, glasses: 'none', hat: 'none' }
};

var DIALOGUES = {
  stage3_intro: [
    '大人驾到！有米已经根据您的口味备好菜单啦，要不要转一转？',
    '来啦来啦~ 有米精心挑选了几个选项，看看有没有让大人心动的？',
    '欢迎光临有米小馆！今天也在努力猜大人想吃什么呢~',
    '大人今天想吃点啥？有米这就帮您安排！',
    '叮~ 今日推荐已就位！让有米帮大人决定今天的美味吧！'
  ],
  stage3_reshuffle: [
    '好嘞！有米这就去换一批新鲜的~ 看看这次合不合心意？',
    '没问题！有米马上帮大人重新挑选！',
    '不合心意吗？有米再去搜罗搜罗好吃的！',
    '收到！有米这就换一批更棒的推荐来！',
    '好哒！让有米再想想还有什么好吃的等着大人~'
  ],
  stage3_spin_first: [
    '哇哦！转到了「{result}」！这可是有米的得意推荐呢！',
    '太棒啦！是「{result}」！大人简直太会选了~',
    '耶！转到「{result}」啦！有米早就觉得这个最适合大人！',
    '天呐！是「{result}」！大人的运气也太好了吧~',
    '完美！「{result}」可是有米偷偷藏在转盘里的惊喜呢！'
  ],
  stage3_spin_other: [
    '当当~ 转盘停在了「{result}」，今天就吃这个吧！',
    '转到「{result}」啦！有米觉得这个也很不错呢~',
    '是「{result}」哦！希望大人吃得开心！',
    '哇~ 结果是「{result}」！快去享受美味吧！',
    '「{result}」！有米觉得这个和今天的天气超配的！'
  ],
  stage4_good: [
    '耶耶耶！有米好开心！大人喜欢就是最大的动力~',
    '真的吗！有米要开心到转圈啦！下次还要给大人推荐！',
    '嘿嘿~ 果然还是有米最懂大人的口味！',
    '太棒啦！有米已经把这个记在小本本上啦！',
    '哇哦~ 大人喜欢就好！有米今天也超级满足！'
  ],
  stage4_ok: [
    '嗯...一般般吗？有米记下了，下次一定更努力！',
    '这样啊... 有米会继续学习大人的口味哒！',
    '下次有米一定推荐更合胃口的！包大人满意！',
    '收到~ 有米会再接再厉的！',
    '好哒！有米记住了，下次给大人惊喜！'
  ],
  stage4_bad: [
    '呜...有米搞砸了... 大人对不起...',
    '呜呜~ 是有米不好，让大人失望了...',
    '对、对不起... 有米下次一定更仔细！',
    '呜哇~ 大人不要生气呀... 有米会好好反省的...',
    '对不起对不起！有米这就把教训写在小本本上！'
  ],
  stage4_bad_after: [
    '有米记住了！下次一定不会再让大人失望！',
    '收到！有米都记在小本本上了！',
    '好的... 有米会好好反省，下次一定改进！',
    '大人的话有米都记住了！下次绝不再犯！',
    '嗯！有米会加油的，下次一定让大人满意！'
  ],
  stage5_intro: [
    '当当！这是有米为大人记录的美食图鉴！',
    '看~ 这都是有米一笔一划认真记下来的哦！',
    '大人的每一次选择，有米都记得清清楚楚呢~',
    '这是有米的小本本，里面全是和大人的美味回忆！',
    '来看看吧~ 有米偷偷记录了好多好多有趣的事情呢！'
  ]
};

function pickDialogue(key, vars) {
  var list = DIALOGUES[key];
  if (!list || list.length === 0) return '';
  var text = list[Math.floor(Math.random() * list.length)];
  if (vars) {
    for (var k in vars) {
      text = text.replace('{' + k + '}', vars[k]);
    }
  }
  return text;
}

/* ==================== 成就系统 ==================== */
var ACHIEVEMENTS = [
  { id: 'first_spin', name: '初次转动', desc: '第一次转动转盘', icon: '🎡' },
  { id: 'spin_10', name: '选择困难症', desc: '累计转动转盘10次', icon: '🎲' },
  { id: 'dishes_10', name: '美食探险家', desc: '尝试10种不同美食', icon: '🗺️' },
  { id: 'good_5', name: '好评达人', desc: '给出5次好评', icon: '⭐' },
  { id: 'night_owl', name: '夜猫子', desc: '深夜来访小馆', icon: '🌙' },
  { id: 'perfect_match', name: '完美推荐', desc: '获得高权重推荐', icon: '🎯' },
  { id: 'share_note', name: '分享小纸条', desc: '保存一张推荐小纸条', icon: '📝' },
  { id: 'regular_5', name: '有米的老朋友', desc: '来访5天', icon: '🤝' }
];

function unlockAchievement(id) {
  if (state.achievements.indexOf(id) >= 0) return;
  var ach = ACHIEVEMENTS.find(function(a) { return a.id === id; });
  if (!ach) return;
  state.achievements.push(id);
  saveData();
  showAchievementPopup(ach);
  SoundManager.eureka();
}

function showAchievementPopup(ach) {
  var popup = document.getElementById('achievementPopup');
  if (!popup) return;
  var icon = popup.querySelector('.ach-icon');
  var name = popup.querySelector('.ach-name');
  var desc = popup.querySelector('.ach-desc');
  if (icon) icon.textContent = ach.icon;
  if (name) name.textContent = ach.name;
  if (desc) desc.textContent = ach.desc;
  popup.classList.remove('hidden');
  popup.classList.add('show');
  /* 星星特效 */
  var stage = document.querySelector('.stage.active') || document.body;
  for (var i = 0; i < 8; i++) {
    setTimeout(function() { createStars(stage, 1); }, i * 100);
  }
  setTimeout(function() {
    popup.classList.remove('show');
    setTimeout(function() { popup.classList.add('hidden'); }, 400);
  }, 3500);
}

function checkAchievements(context) {
  /* first_spin: 第一次转动 */
  if (context === 'spin') {
    if (state.spinTimestamps.length >= 1) unlockAchievement('first_spin');
  }
  /* spin_10 / dishes_10 / good_5: 基于历史记录 */
  if (context === 'feedback') {
    if (state.history.length >= 1) unlockAchievement('first_spin');
    if (state.history.length >= 10) unlockAchievement('spin_10');
    var uniqueDishes = [];
    state.history.forEach(function(h) {
      if (h.result && uniqueDishes.indexOf(h.result) < 0) uniqueDishes.push(h.result);
    });
    if (uniqueDishes.length >= 10) unlockAchievement('dishes_10');
    var goodCount = state.history.filter(function(h) { return h.rating === 'good'; }).length;
    if (goodCount >= 5) unlockAchievement('good_5');
  }
  /* night_owl / regular_5: 进入 Stage3 时检查 */
  if (context === 'enter_stage3') {
    if (isLateNight()) unlockAchievement('night_owl');
    var uniqueDays = [];
    state.history.forEach(function(h) {
      if (h.date && uniqueDays.indexOf(h.date) < 0) uniqueDays.push(h.date);
    });
    if (uniqueDays.length >= 5) unlockAchievement('regular_5');
  }
}

/* ==================== 音效管理器 ==================== */
var SoundManager = (function() {
  var audioContext = null;
  var sfxEnabled = true;
  var bgmEnabled = true;
  var sfxVolume = 0.6;
  var bgmVolume = 0.25;
  var currentBgm = null;
  var bgmGain = null;
  var bgmOscillators = [];
  var bgmTimer = null;
  var bgmNoteIdx = 0;
  var currentStage = 'stage1';

  var STORAGE_KEY = 'youmi_sound_settings';

  var BGM_MELODIES = {
    stage1: {
      notes: [
        { f: 330, d: 0.5 }, { f: 392, d: 0.5 }, { f: 440, d: 0.5 }, { f: 523, d: 0.5 },
        { f: 494, d: 0.5 }, { f: 440, d: 0.5 }, { f: 392, d: 1 },
        { f: 349, d: 0.5 }, { f: 440, d: 0.5 }, { f: 523, d: 0.5 }, { f: 659, d: 0.5 },
        { f: 587, d: 0.5 }, { f: 523, d: 0.5 }, { f: 440, d: 1 }
      ],
      tempo: 0.35,
      type: 'triangle'
    },
    stage2: {
      notes: [
        { f: 262, d: 0.4 }, { f: 330, d: 0.4 }, { f: 392, d: 0.4 },
        { f: 349, d: 0.4 }, { f: 294, d: 0.4 }, { f: 262, d: 0.8 },
        { f: 294, d: 0.4 }, { f: 349, d: 0.4 }, { f: 440, d: 0.4 },
        { f: 392, d: 0.4 }, { f: 330, d: 0.4 }, { f: 262, d: 0.8 }
      ],
      tempo: 0.3,
      type: 'sine'
    },
    stage3: {
      notes: [
        { f: 523, d: 0.3 }, { f: 587, d: 0.3 }, { f: 659, d: 0.3 }, { f: 784, d: 0.6 },
        { f: 659, d: 0.3 }, { f: 784, d: 0.3 }, { f: 880, d: 0.3 }, { f: 1047, d: 0.6 },
        { f: 784, d: 0.3 }, { f: 880, d: 0.3 }, { f: 784, d: 0.3 }, { f: 659, d: 0.6 },
        { f: 587, d: 0.3 }, { f: 659, d: 0.3 }, { f: 587, d: 0.3 }, { f: 523, d: 0.6 }
      ],
      tempo: 0.25,
      type: 'sine'
    },
    stage4: {
      notes: [
        { f: 523, d: 0.5 }, { f: 659, d: 0.5 }, { f: 784, d: 1 },
        { f: 659, d: 0.5 }, { f: 523, d: 0.5 }, { f: 440, d: 1 },
        { f: 494, d: 0.5 }, { f: 587, d: 0.5 }, { f: 740, d: 1 },
        { f: 587, d: 0.5 }, { f: 494, d: 0.5 }, { f: 392, d: 1 }
      ],
      tempo: 0.3,
      type: 'sine'
    },
    stage5: {
      notes: [
        { f: 330, d: 0.6 }, { f: 392, d: 0.6 }, { f: 494, d: 0.6 }, { f: 659, d: 0.6 },
        { f: 587, d: 0.6 }, { f: 494, d: 0.6 }, { f: 392, d: 1.2 },
        { f: 349, d: 0.6 }, { f: 440, d: 0.6 }, { f: 523, d: 0.6 }, { f: 698, d: 0.6 },
        { f: 587, d: 0.6 }, { f: 523, d: 0.6 }, { f: 440, d: 1.2 }
      ],
      tempo: 0.3,
      type: 'triangle'
    }
  };

  function loadSettings() {
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        var obj = JSON.parse(s);
        if (typeof obj.sfxEnabled !== 'undefined') sfxEnabled = obj.sfxEnabled;
        if (typeof obj.bgmEnabled !== 'undefined') bgmEnabled = obj.bgmEnabled;
        if (typeof obj.sfxVolume !== 'undefined') sfxVolume = obj.sfxVolume;
        if (typeof obj.bgmVolume !== 'undefined') bgmVolume = obj.bgmVolume;
      }
    } catch (e) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        sfxEnabled: sfxEnabled,
        bgmEnabled: bgmEnabled,
        sfxVolume: sfxVolume,
        bgmVolume: bgmVolume
      }));
    } catch (e) {}
  }

  function init() {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        sfxEnabled = false;
        bgmEnabled = false;
        return;
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }

  function playWarmTone(freq, duration, vol, attack, release, pan) {
    if (!sfxEnabled) return;
    init();
    if (!audioContext) return;

    attack = attack || 0.02;
    release = release || 0.1;
    duration = Math.max(duration, attack + release + 0.01);

    var osc1 = audioContext.createOscillator();
    var osc2 = audioContext.createOscillator();
    var gain = audioContext.createGain();
    var filter = audioContext.createBiquadFilter();
    var panner = null;

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, audioContext.currentTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, audioContext.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 4, audioContext.currentTime);
    filter.Q.value = 1;

    if (typeof pan !== 'undefined' && audioContext.createStereoPanner) {
      panner = audioContext.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
    }

    var t = audioContext.currentTime;
    var peakVol = vol * sfxVolume;
    var attackTime = t + Math.min(attack, duration * 0.3);
    var sustainTime = Math.max(attackTime + 0.001, t + duration - release);
    var endTime = Math.max(sustainTime + 0.001, t + duration);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peakVol, attackTime);
    gain.gain.linearRampToValueAtTime(peakVol * 0.7, sustainTime);
    gain.gain.exponentialRampToValueAtTime(0.001, endTime);

    var osc2Gain = audioContext.createGain();
    osc2Gain.gain.value = 0.3;

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(gain);

    if (panner) {
      gain.connect(panner);
      panner.connect(audioContext.destination);
    } else {
      gain.connect(audioContext.destination);
    }

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
  }

  function playNoise(duration, vol, filterFreq, pan) {
    if (!sfxEnabled) return;
    init();
    if (!audioContext) return;

    var bufferSize = audioContext.sampleRate * duration;
    var buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    var source = audioContext.createBufferSource();
    source.buffer = buffer;

    var filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq || 2000;

    var gain = audioContext.createGain();
    var panner = null;
    var t = audioContext.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol * sfxVolume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    if (typeof pan !== 'undefined' && audioContext.createStereoPanner) {
      panner = audioContext.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
    }

    source.connect(filter);
    filter.connect(gain);
    if (panner) {
      gain.connect(panner);
      panner.connect(audioContext.destination);
    } else {
      gain.connect(audioContext.destination);
    }

    source.start(t);
  }

  var CROSSFADE_DURATION = 2.0;

  function stopBgm() {
    if (bgmTimer) {
      clearTimeout(bgmTimer);
      bgmTimer = null;
    }
    if (bgmGain) {
      var oldGain = bgmGain;
      var t = audioContext.currentTime;
      oldGain.gain.cancelScheduledValues(t);
      var currentVol = oldGain.gain.value;
      oldGain.gain.setValueAtTime(currentVol, t);
      oldGain.gain.linearRampToValueAtTime(0, t + CROSSFADE_DURATION);
      setTimeout(function() {
        bgmOscillators.forEach(function(o) {
          try { o.stop(); } catch (e) {}
        });
        bgmOscillators = [];
        try { oldGain.disconnect(); } catch (e) {}
      }, CROSSFADE_DURATION * 1000 + 100);
    }
    currentBgm = null;
    bgmGain = null;
  }

  function playBgmNote(melody, noteIdx) {
    if (!bgmEnabled || !audioContext) return;
    if (currentBgm !== melody) return;
    if (!bgmGain) return;

    var note = melody.notes[noteIdx % melody.notes.length];
    var noteDur = note.d * melody.tempo;
    var gapDur = noteDur * 0.6;
    var totalDur = noteDur + gapDur;

    var osc = audioContext.createOscillator();
    osc.type = melody.type;
    osc.frequency.setValueAtTime(note.f, audioContext.currentTime);

    var filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = note.f * 3;
    filter.Q.value = 0.5;

    var gain = audioContext.createGain();
    var t = audioContext.currentTime;
    var noteVol = bgmVolume * 0.35;
    var attack = noteDur * 0.2;
    var release = noteDur * 0.3;
    var attackTime = t + attack;
    var sustainTime = Math.max(attackTime + 0.001, t + noteDur - release);
    var endTime = Math.max(sustainTime + 0.001, t + noteDur);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(noteVol, attackTime);
    gain.gain.linearRampToValueAtTime(noteVol * 0.5, sustainTime);
    gain.gain.exponentialRampToValueAtTime(0.001, endTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(bgmGain);
    osc.start(t);
    osc.stop(t + noteDur + 0.05);

    bgmOscillators.push(osc);

    bgmNoteIdx = noteIdx + 1;
    bgmTimer = setTimeout(function() {
      playBgmNote(melody, bgmNoteIdx);
    }, totalDur * 1000);
  }

  function startBgm(stage) {
    init();
    if (!audioContext || !bgmEnabled) return;

    var melody = BGM_MELODIES[stage];
    if (!melody) return;

    if (currentBgm === melody) return;

    var oldGain = bgmGain;

    var newGain = audioContext.createGain();
    newGain.gain.value = 0;
    newGain.connect(audioContext.destination);

    var t = audioContext.currentTime;

    if (oldGain) {
      oldGain.gain.cancelScheduledValues(t);
      var currentVol = oldGain.gain.value;
      oldGain.gain.setValueAtTime(currentVol, t);
      oldGain.gain.linearRampToValueAtTime(0, t + CROSSFADE_DURATION);
      var oldGainRef = oldGain;
      setTimeout(function() {
        try { oldGainRef.disconnect(); } catch (e) {}
      }, CROSSFADE_DURATION * 1000 + 100);
    }

    if (bgmTimer) {
      clearTimeout(bgmTimer);
      bgmTimer = null;
    }

    bgmGain = newGain;
    currentBgm = melody;
    bgmNoteIdx = 0;

    newGain.gain.linearRampToValueAtTime(1, t + CROSSFADE_DURATION);

    setTimeout(function() {
      if (currentBgm === melody && bgmGain === newGain) {
        playBgmNote(melody, 0);
      }
    }, CROSSFADE_DURATION * 0.5 * 1000);
  }

  function setBgmStage(stage) {
    currentStage = stage;
    startBgm(stage);
  }

  function getWheelPan(angle) {
    return Math.sin(angle);
  }

  loadSettings();

  return {
    init: init,
    saveSettings: saveSettings,

    setSfxEnabled: function(val) { sfxEnabled = val; saveSettings(); },
    getSfxEnabled: function() { return sfxEnabled; },
    setBgmEnabled: function(val) {
      bgmEnabled = val;
      saveSettings();
      if (!val) { stopBgm(); }
      else { startBgm(currentStage); }
    },
    getBgmEnabled: function() { return bgmEnabled; },
    setSfxVolume: function(val) { sfxVolume = Math.max(0, Math.min(1, val)); saveSettings(); },
    getSfxVolume: function() { return sfxVolume; },
    setBgmVolume: function(val) {
      bgmVolume = Math.max(0, Math.min(1, val));
      saveSettings();
      if (bgmGain) {
        bgmGain.gain.setTargetAtTime(bgmVolume, audioContext.currentTime, 0.3);
      }
    },
    getBgmVolume: function() { return bgmVolume; },

    setStage: setBgmStage,
    stopBgm: stopBgm,

    buttonClick: function() {
      playWarmTone(660, 0.06, 0.25);
    },

    stageTransition: function() {
      playWarmTone(440, 0.25, 0.15);
      setTimeout(function() { playWarmTone(554, 0.2, 0.12); }, 120);
    },

    bubbleShow: function() {
      playWarmTone(523, 0.08, 0.12);
      setTimeout(function() { playWarmTone(659, 0.06, 0.08); }, 60);
    },

    typewriter: function() {
      playWarmTone(900 + Math.random() * 300, 0.02, 0.06, 0.005, 0.01);
    },

    thinking: function() {
      playWarmTone(300, 0.4, 0.08, 0.1, 0.2);
    },

    yawning: function() {
      playWarmTone(220, 0.6, 0.1, 0.1, 0.3, 0);
      setTimeout(function() { playWarmTone(180, 0.4, 0.06, 0.05, 0.2); }, 200);
    },

    happy: function() {
      var notes = [523, 659, 784, 1047];
      notes.forEach(function(n, i) {
        setTimeout(function() { playWarmTone(n, 0.18, 0.2); }, i * 90);
      });
    },

    surprised: function() {
      playWarmTone(784, 0.1, 0.22);
      setTimeout(function() { playWarmTone(988, 0.15, 0.18); }, 80);
    },

    eureka: function() {
      var notes = [392, 523, 659, 784];
      notes.forEach(function(n, i) {
        setTimeout(function() { playWarmTone(n, 0.12, 0.2); }, i * 80);
      });
    },

    wheelStart: function() {
      playWarmTone(150, 0.3, 0.2, 0.02, 0.15);
      setTimeout(function() { playWarmTone(200, 0.25, 0.15, 0.02, 0.1); }, 50);
    },

    wheelTick: function(pan, volMul) {
      volMul = volMul || 1;
      playWarmTone(330 + Math.random() * 80, 0.05, 0.05 * volMul, 0.008, 0.02, pan);
    },

    wheelStop: function() {
      playWarmTone(200, 0.4, 0.2, 0.02, 0.25);
      playNoise(0.25, 0.1, 800);
    },

    success: function() {
      playWarmTone(523, 0.08, 0.18);
      setTimeout(function() { playWarmTone(659, 0.08, 0.18); }, 90);
      setTimeout(function() { playWarmTone(784, 0.18, 0.22); }, 180);
    },

    error: function() {
      playWarmTone(294, 0.12, 0.18);
      setTimeout(function() { playWarmTone(220, 0.2, 0.15); }, 100);
    },

    eggClick: function() {
      init();
      playWarmTone(600, 0.12, 0.4);
      playNoise(0.1, 0.3, 3000);
    },

    eggCrack: function() {
      init();
      playNoise(0.15, 0.5, 2000);
      playNoise(0.12, 0.45, 3500, -0.3);
      playNoise(0.1, 0.4, 2500, 0.3);
      playWarmTone(200, 0.35, 0.25, 0.01, 0.12);
      playWarmTone(150, 0.25, 0.2, 0.01, 0.1);
    },

    eggHatch: function() {
      init();
      playNoise(0.25, 0.6, 1500);
      playNoise(0.2, 0.55, 2800, -0.4);
      playNoise(0.22, 0.5, 2000, 0.4);
      playNoise(0.15, 0.45, 3500);
      playWarmTone(100, 0.4, 0.2, 0.02, 0.2);
      setTimeout(function() { playWarmTone(180, 0.3, 0.25, 0.01, 0.15); }, 60);
    },

    youniAppear: function() {
      var notes = [440, 554, 659];
      notes.forEach(function(n, i) {
        setTimeout(function() { playWarmTone(n, 0.22, 0.18); }, i * 130);
      });
    },

    addOption: function() {
      playWarmTone(523, 0.06, 0.12);
    },

    removeOption: function() {
      playWarmTone(392, 0.06, 0.08);
    },

    keyboard: function() {
      playWarmTone(880, 0.04, 0.1, 0.005, 0.01);
    },

    sigh: function() {
      playWarmTone(180, 0.5, 0.06, 0.15, 0.4, 0);
      setTimeout(function() { playWarmTone(140, 0.3, 0.04, 0.1, 0.2, 0); }, 200);
    },

    doorCreak: function() {
      init();
      playWarmTone(120, 0.6, 0.12, 0.05, 0.5, 0);
      playNoise(0.4, 0.08, 600);
    },

    ambient: function() {
      if (!sfxEnabled) return;
      init();
      var ctx = audioContext;
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.015 * sfxVolume, now + 1.5);
      gain.gain.linearRampToValueAtTime(0, now + 4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 4.2);
    }
  };
})();

function getTimeGreeting() {
  var hour = new Date().getHours();
  if (hour >= 6 && hour < 10) {
    return '大人早上好！有米准备了早餐选项~';
  } else if (hour >= 10 && hour < 14) {
    return '中午到啦！大人想吃点什么？';
  } else if (hour >= 14 && hour < 17) {
    return '下午好~ 要不要来个下午茶？';
  } else if (hour >= 17 && hour < 22) {
    return '大人辛苦了一天，有米准备了好吃的！';
  } else if (hour >= 22 || hour < 6) {
    return '夜深了，大人要不要来点夜宵？';
  }
  return null;
}

function isLateNight() {
  var hour = new Date().getHours();
  return hour >= 23 || hour < 5;
}

var STORAGE_KEY = 'youni_data';

function loadData() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      var data = JSON.parse(raw);
      state.preferences = data.preferences || state.preferences;
      state.history = data.history || [];
      state.unlocked = data.unlocked || 0;
      state.achievements = data.achievements || [];
      state.outfit = data.outfit || { apronHue: 0, glasses: 'none', hat: 'none' };
    }
  } catch (e) { console.warn('loadData error', e); }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      preferences: state.preferences,
      history: state.history,
      unlocked: state.unlocked,
      achievements: state.achievements,
      outfit: state.outfit
    }));
  } catch (e) { console.warn('saveData error', e); }
}

function getToday() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

var cachedWeather = null;

function getWeather() {
  if (cachedWeather) return cachedWeather;
  var d = new Date();
  var seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  var hash = (seed * 9301 + 49297) % 233280;
  var rnd = hash / 233280;
  if (rnd < 0.35) return '晴';
  if (rnd < 0.6) return '多云';
  if (rnd < 0.8) return '阴';
  return '雨';
}

function mapWeatherCode(code) {
  code = parseInt(code);
  if (code === 113) return '晴';
  if (code === 116) return '多云';
  if ([119, 122, 143, 248, 260].indexOf(code) >= 0) return '阴';
  if ([176, 200, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 317, 350, 353, 356, 359, 362, 365, 386, 389, 392, 395].indexOf(code) >= 0) return '雨';
  if ([179, 182, 185, 227, 230, 320, 323, 326, 329, 332, 335, 338, 368, 371, 374, 377].indexOf(code) >= 0) return '阴';
  return '多云';
}

function fetchWeather() {
  return new Promise(function(resolve) {
    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, 5000);
    fetch('https://wttr.in/?format=j1', { signal: controller.signal })
      .then(function(resp) { return resp.json(); })
      .then(function(data) {
        clearTimeout(timeoutId);
        var current = data.current_condition && data.current_condition[0];
        if (current && current.weatherCode) {
          cachedWeather = mapWeatherCode(current.weatherCode);
        }
        resolve(getWeather());
      })
      .catch(function(e) {
        clearTimeout(timeoutId);
        resolve(getWeather());
      });
  });
}

/* 打字机效果 */
var activeTypewriters = new Map();

function typeText(element, text, speed) {
  speed = speed || 50;
  return new Promise(function(resolve) {
    if (activeTypewriters.has(element)) {
      var oldCtrl = activeTypewriters.get(element);
      oldCtrl.cancelled = true;
      if (oldCtrl.timerId) clearTimeout(oldCtrl.timerId);
      if (oldCtrl.resolve) oldCtrl.resolve();
      activeTypewriters.delete(element);
    }
    element.textContent = '';
    element.classList.add('typing');
    var i = 0;
    var ctrl = { cancelled: false, timerId: null, resolve: resolve };
    activeTypewriters.set(element, ctrl);
    function step() {
      if (ctrl.cancelled) return;
      if (i < text.length) {
        element.textContent += text.charAt(i);
        SoundManager.typewriter();
        i++;
        ctrl.timerId = setTimeout(step, speed);
      } else {
        element.classList.remove('typing');
        if (activeTypewriters.get(element) === ctrl) activeTypewriters.delete(element);
        resolve();
      }
    }
    step();
  });
}

/* 场景切换 */
var transitioning = false;
var isPopstateNav = false; /* 标记当前是否由浏览器回退触发 */

function showStage(id) {
  if (transitioning) return;
  var currentActive = document.querySelector('.stage.active');
  var nextStage = document.getElementById(id);
  if (!nextStage) return;

  if (id === 'stage1') {
    resetStage1();
  }

  if (currentActive === nextStage) return;

  SoundManager.stageTransition();
  if (id === 'stage3' || id === 'stage5') SoundManager.doorCreak();
  SoundManager.setStage(id);

  /* 浏览器历史管理：前进时 pushState，回退时不推 */
  /* stage2 的历史由 askQuestion 子步骤管理，不在此推 */
  if (!isPopstateNav && id !== 'stage2') {
    history.pushState({ stageId: id }, '', '#' + id);
  }

  /* 预加载下一阶段图片 */
  var nextStageMap = { 'stage1': 'stage2', 'stage2': 'stage3', 'stage3': 'stage4', 'stage4': 'stage5' };
  if (nextStageMap[id]) {
    setTimeout(function() { preloadStageImages(nextStageMap[id]); }, 500);
  }

  if (currentActive && currentActive.id !== 'stage1') {
    transitioning = true;
    currentActive.classList.add('slide-out');
    nextStage.style.display = 'flex';
    nextStage.classList.add('active');
    nextStage.classList.add('slide-in');
    currentActive.addEventListener('animationend', function handler() {
      currentActive.removeEventListener('animationend', handler);
      currentActive.classList.remove('slide-out', 'active');
      currentActive.style.display = 'none';
      transitioning = false;
    }, { once: true });
    nextStage.addEventListener('animationend', function handler2() {
      nextStage.removeEventListener('animationend', handler2);
      nextStage.classList.remove('slide-in');
    }, { once: true });
  } else {
    document.querySelectorAll('.stage').forEach(function(s) {
      s.classList.remove('active');
      s.style.display = 'none';
    });
    nextStage.style.display = 'flex';
    nextStage.classList.add('active');
  }
}

function createStars(container, count) {
  count = count || 4;
  for (var i = 0; i < count; i++) {
    var star = document.createElement('div');
    star.className = 'star';
    star.style.left = (20 + Math.random() * 80) + 'px';
    star.style.top = (-20 + Math.random() * 100) + 'px';
    star.style.animationDelay = (i * 0.1) + 's';
    container.appendChild(star);
    (function(s) { setTimeout(function() { s.remove(); }, 1000); })(star);
  }
}

function createWarmFlash(stageId) {
  var stage = document.getElementById(stageId);
  if (!stage) return;
  var flash = document.createElement('div');
  flash.className = 'warm-flash-overlay';
  stage.appendChild(flash);
  setTimeout(function() { flash.remove(); }, 1000);
}

function createSadOverlay(stageId) {
  var existing = document.getElementById('sadOverlay');
  if (existing) existing.remove();
  var stage = document.getElementById(stageId);
  if (!stage) return;
  var overlay = document.createElement('div');
  overlay.className = 'sad-bg-overlay';
  overlay.id = 'sadOverlay';
  stage.appendChild(overlay);
}

function removeSadOverlay() {
  var overlay = document.getElementById('sadOverlay');
  if (overlay) overlay.remove();
}

/* ==================== 菜品数据库 ==================== */
var DISH_DB = {
  rainy: ['麻辣烫','酸辣粉','火锅','拉面','热汤面','关东煮','牛肉面','馄饨','螺蛳粉','冒菜','老鸭汤','牛腩煲','砂锅粥'],
  sunny: ['沙拉','寿司','凉面','凉皮','冰粉','轻食碗','三明治','冷面','刨冰','抹茶拿铁','手冲咖啡','水果沙拉','凉皮卷','麻酱拌面'],
  cloudy: ['盖浇饭','煲仔饭','拉面','炒饭','炒面','汉堡','寿司','麻辣烫','焗饭','咖喱饭','卤肉饭','炒河粉','螺蛳粉','石锅拌饭'],
  overcast: ['汤面','馄饨','煲仔饭','粥品','牛肉面','云吞面','炒饭','烩饭','皮蛋瘦肉粥','鱼片粥','南瓜粥','砂锅米线','老鸭粉丝汤','菌菇汤'],
  spicy: ['麻辣烫','火锅','酸辣粉','麻辣香锅','重庆小面','剁椒鱼头','辣子鸡','螺蛳粉','冒菜','串串香','干锅牛蛙','酸辣汤','麻辣拌','川菜'],
  mild: ['白粥','清汤面','蒸蛋','小馄饨','煲仔饭','广式茶点','云吞面','肠粉','虾饺','叉烧包','糯米鸡','艇仔粥','奶黄包','蛋挞'],
  soup: ['拉面','馄饨','汤饭','粥品','麻辣烫','牛肉汤','酸辣汤','鸡汤面','排骨汤','老鸭汤','菌菇汤','海鲜粥','疙瘩汤','养生汤'],
  nosoup: ['炒饭','炒面','煎饼','汉堡','烧烤','盖浇饭','煲仔饭','炸鸡','薯条','寿司','披萨','三明治','沙拉','手抓饼'],
  /* 场景模板 */
  breakfast: ['豆浆油条','小笼包','煎饼果子','白粥','肠粉','包子','三明治','燕麦牛奶','手抓饼','鸡蛋灌饼','生煎包','烧麦','豆花','米线'],
  lunch: ['盖浇饭','炒饭','炒面','拉面','咖喱饭','卤肉饭','煲仔饭','石锅拌饭','焗饭','炒河粉','便当','排骨饭','鸡腿饭','牛肉饭'],
  dinner: ['火锅','烧烤','麻辣香锅','干锅','红烧肉','糖醋排骨','清蒸鱼','宫保鸡丁','麻婆豆腐','水煮鱼','烤鸭','回锅肉','酸菜鱼','铁板烧'],
  lateNight: ['烧烤','串串香','麻辣烫','小龙虾','烤鱼','炒河粉','泡面','馄饨','砂锅粥','关东煮','炸鸡','烤冷面','臭豆腐','毛豆'],
  quickMeal: ['炒饭','三明治','盖浇饭','泡面','煎饼','手抓饼','饭团','汉堡','卷饼','便当','炒面','速冻水饺','微波意面','肉夹馍'],
  weekend: ['火锅','日料','牛排','烤肉','海鲜大餐','披萨','寿司拼盘','小龙虾','酸菜鱼','佛跳墙','北京烤鸭','泰式料理','韩式烤肉','椰子鸡'],
  soloDining: ['面条','盖浇饭','粥','馄饨','三明治','便当','饭团','沙拉','汤面','煲仔饭','卤肉饭','牛肉面','炒饭','卷饼'],
  gathering: ['火锅','烧烤','串串香','烤鱼','小龙虾','麻辣香锅','干锅牛蛙','酸菜鱼','水煮鱼','辣子鸡','啤酒鸭','毛血旺','冒菜','大盘鸡']
};

function getMealScene() {
  var hour = new Date().getHours();
  var isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
  if (hour >= 6 && hour < 10) return { key: 'breakfast', label: '早餐时光' };
  if (hour >= 11 && hour < 14) return { key: 'lunch', label: '午餐时刻' };
  if (hour >= 17 && hour < 21) return { key: 'dinner', label: '晚餐时间' };
  if (hour >= 22 || hour < 5) return { key: 'lateNight', label: '夜宵时段' };
  if (isWeekend) return { key: 'weekend', label: '周末犒劳' };
  return { key: 'quickMeal', label: '快手简餐' };
}

function generateRecommendations(exclude, count) {
  var spicy = state.preferences.spicy, soup = state.preferences.soup, taboo = state.preferences.taboo;
  var weather = state.currentWeather;
  var pool = [];
  var weatherKey = 'sunny';
  if (weather === '雨') weatherKey = 'rainy';
  else if (weather === '多云') weatherKey = 'cloudy';
  else if (weather === '阴') weatherKey = 'overcast';
  pool = pool.concat(DISH_DB[weatherKey]);
  var spicyKey = spicy === 'high' ? 'spicy' : 'mild';
  pool = pool.concat(DISH_DB[spicyKey]);
  var soupKey = soup === 'yes' ? 'soup' : 'nosoup';
  pool = pool.concat(DISH_DB[soupKey]);
  /* 场景模板加权 */
  var scene = getMealScene();
  if (DISH_DB[scene.key]) pool = pool.concat(DISH_DB[scene.key]);

  var counts = {};
  pool.forEach(function(dish) { counts[dish] = (counts[dish] || 0) + 1; });
  var unique = Object.keys(counts).sort(function(a, b) { return counts[b] - counts[a]; });

  if (taboo) { unique = unique.filter(function(d) { return !d.includes(taboo); }); }

  var excludeSet = new Set(exclude || []);
  unique = unique.filter(function(d) { return !excludeSet.has(d); });

  var allDishes = [];
  Object.values(DISH_DB).forEach(function(arr) { allDishes = allDishes.concat(arr); });
  var seen = new Set(unique);
  excludeSet.forEach(function(d) { seen.add(d); });
  var extras = allDishes.filter(function(d) { return !seen.has(d) && (!taboo || !d.includes(taboo)); });
  for (var i = extras.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = extras[i]; extras[i] = extras[j]; extras[j] = tmp;
  }
  var result = unique.slice();
  while (result.length < (count || 5) && extras.length > 0) { result.push(extras.pop()); }
  for (var k = result.length - 1; k > 0; k--) {
    var m = Math.floor(Math.random() * (k + 1));
    var t = result[k]; result[k] = result[m]; result[m] = t;
  }
  return result.slice(0, count || 5);
}

/* ==================== 第一阶段：孵化 ==================== */
var stage1 = document.getElementById('stage1');
var eggContainer = document.getElementById('eggContainer');
var egg = document.getElementById('egg');
var goldenGlow = document.getElementById('goldenGlow');
var goldenParticles = document.getElementById('goldenParticles');
var lightBurst = document.getElementById('lightBurst');
var hatchedYouni = document.getElementById('hatchedYouni');
var stage1Bubble = document.getElementById('stage1Bubble');
var startFirstBtn = document.getElementById('startFirstBtn');
var stage1Clicked = false;

stage1.addEventListener('click', async function() {
  if (stage1Clicked) return;
  stage1Clicked = true;

  /* 点击后立即隐藏引导提示和暖光 */
  document.getElementById('eggHint').classList.add('hidden');
  document.getElementById('eggWarmth').classList.add('hidden');

  try {
    SoundManager.eggClick();
  eggContainer.classList.add('egg-cracked');
  goldenGlow.classList.add('active');
  spawnEnhancedGoldenParticles();
  spawnLightBurst();
  await wait(500);

  var appWrapper = document.getElementById('app-wrapper');
  appWrapper.style.animation = 'hatchShake 0.4s ease-in-out';
  appWrapper.addEventListener('animationend', function() { appWrapper.style.animation = ''; }, { once: true });

  SoundManager.eggCrack();
  eggContainer.classList.add('egg-hatched');
  await wait(300);

  /* 蛋壳裂开时淡出标题和星星 */
  document.getElementById('openingOverlay').classList.add('fade-out');

  SoundManager.eggHatch();
  await wait(300);

  eggContainer.style.display = 'none';
  createYouniImg('hatchedYouni', '19-hatch-cowering');
  hatchedYouni.classList.add('show');
  await wait(1000);

  hatchedYouni.classList.remove('show');
  hatchedYouni.classList.add('shrink');
  await wait(500);

  createYouniImg('hatchedYouni', '20-hatch-standing-shake');
  await wait(600);

  createYouniImg('hatchedYouni', '21-hatch-confident-ready');
  await wait(600);

  SoundManager.youniAppear();
  // 显示酒馆背景
  stage1.classList.add('hatched-bg');
  await wait(400);

  stage1Bubble.classList.remove('hidden');
  SoundManager.bubbleShow();
  await typeText(stage1Bubble, '大人好！我是有米，从今天起负责帮您决定吃什么。');
  await wait(500);

  SoundManager.setStage('stage1');

  startFirstBtn.classList.remove('hidden');
  } catch(e) {
    console.error('Stage1 animation error:', e);
  }
});

startFirstBtn.addEventListener('click', function() {
  SoundManager.buttonClick();
  SoundManager.stageTransition();
  showStage('stage2');
  initStage2();
});

function wait(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function spawnEnhancedGoldenParticles() {
  var container = goldenParticles;
  var colors = ['#FFD700', '#FFF8F0', '#F5A623', '#FFD700', '#FFF8F0'];
  var count = 6;
  for (var i = 0; i < count; i++) {
    (function(idx) {
      var isStar = idx % 3 === 0;
      var particle = document.createElement('div');
      particle.className = isStar ? 'golden-star-particle' : 'golden-particle';
      if (!isStar) {
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.boxShadow = '0 0 6px ' + colors[Math.floor(Math.random() * colors.length)];
        var sz = 3 + Math.random() * 4;
        particle.style.width = sz + 'px'; particle.style.height = sz + 'px';
      } else {
        particle.style.background = '#FFD700';
        particle.style.width = '8px'; particle.style.height = '8px';
      }
      var angle = (Math.PI * 2 * idx) / count + (Math.random() - 0.5) * 0.3;
      var dist = 40 + Math.random() * 70;
      particle.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      particle.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      particle.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';
      container.appendChild(particle);
      setTimeout(function() { particle.remove(); }, 1500);
    })(i);
  }
}

function spawnLightBurst() {
  var container = lightBurst;
  var count = 4;
  for (var i = 0; i < count; i++) {
    (function(idx) {
      var ray = document.createElement('div');
      ray.className = 'light-ray';
      var angle = (360 * idx) / count;
      ray.style.setProperty('--angle', angle + 'deg');
      ray.style.transform = 'rotate(' + angle + 'deg)';
      ray.style.animationDelay = (idx * 0.05) + 's';
      ray.style.height = (40 + Math.random() * 30) + 'px';
      ray.style.width = (2 + Math.random() * 2) + 'px';
      container.appendChild(ray);
      setTimeout(function() { ray.remove(); }, 1200);
    })(i);
  }
}

/* ==================== 第二阶段：偏好采集 ==================== */
var stage2Bubble = document.getElementById('stage2Bubble');
var questionTitle = document.getElementById('questionTitle');
var questionContent = document.getElementById('questionContent');
var blackboardContent = document.getElementById('blackboardContent');
var editPrefBtn = document.getElementById('editPrefBtn');
var propChili = document.getElementById('propChili');
var propBowl = document.getElementById('propBowl');
var editingFromStage3 = false;

function updateBlackboard() {
  var s = state.preferences.spicy !== null ? (state.preferences.spicy === 'high' ? '爱吃辣' : '怕辣') : '待了解';
  var p = state.preferences.soup !== null ? (state.preferences.soup === 'yes' ? '爱喝汤' : '不喝汤') : '待了解';
  var t = state.preferences.taboo || '无';
  var st = state.preferences.staple !== null ? (state.preferences.staple === 'rice' ? '米饭' : state.preferences.staple === 'noodle' ? '面食' : '都行') : '待了解';
  var fl = state.preferences.flavor !== null ? (state.preferences.flavor === 'heavy' ? '重口味' : state.preferences.flavor === 'light' ? '清淡' : '都行') : '待了解';
  blackboardContent.innerHTML = '辣度：' + s + '<br>汤类：' + p + '<br>主食：' + st + '<br>口味：' + fl + '<br>忌口：' + t;
}

async function initStage2() {
  createYouniImg('youniStage2', '01-default-stand');
  startYouniIdle('youniStage2');
  updateBlackboard();
  await askQuestion1();
}

/* ==================== 偏好问题子步骤历史管理 ==================== */
/* 问题顺序: Q1辣度 → Q2汤类 → Q4主食 → Q5口味 → Q3忌口 → 完成 */
var QUESTION_FLOW = ['q1', 'q2', 'q4', 'q5', 'q3'];
var isSubPopstate = false; /* 标记子步骤回退 */

function pushQuestionStep(stepId) {
  if (!isSubPopstate) {
    history.pushState({ stageId: 'stage2', step: stepId }, '', '#stage2-' + stepId);
  }
}

function restoreQuestionStep(stepId) {
  isSubPopstate = true;
  if (stepId === 'q1') askQuestion1();
  else if (stepId === 'q2') askQuestion2();
  else if (stepId === 'q3') askQuestion3();
  else if (stepId === 'q4') askQuestion4();
  else if (stepId === 'q5') askQuestion5();
  isSubPopstate = false;
}

async function askQuestion1() {
  pushQuestionStep('q1');
  propChili.style.display = 'block';
  propBowl.style.display = 'none';
  questionTitle.textContent = '问题一：辣度偏好';
  questionContent.innerHTML = '<div style="color:#FFF8F0;font-size:14px;margin-bottom:16px;">有米端来一颗辣椒糖...</div><div class="choice-buttons"><button class="choice-btn" id="q1a">咬开它</button><button class="choice-btn" id="q1b">只舔一下</button></div>';
  await typeText(stage2Bubble, '大人，您敢咬开这颗辣椒糖吗？');
  document.getElementById('q1a').addEventListener('click', function() {
    SoundManager.buttonClick();
    state.preferences.spicy = 'high'; updateBlackboard(); askQuestion2();
  });
  document.getElementById('q1b').addEventListener('click', function() {
    SoundManager.buttonClick();
    state.preferences.spicy = 'low'; updateBlackboard(); askQuestion2();
  });
}

async function askQuestion2() {
  pushQuestionStep('q2');
  propChili.style.display = 'none';
  propBowl.style.display = 'block';
  questionTitle.textContent = '问题二：汤类偏好';
  questionContent.innerHTML = '<div style="color:#FFF8F0;font-size:14px;margin-bottom:16px;">🍜 有米端出一碗热汤...</div><div class="choice-buttons"><button class="choice-btn" id="q2a">会喝完</button><button class="choice-btn" id="q2b">不喝了</button></div>';
  await typeText(stage2Bubble, '大人，店里的汤您会喝完吗？');
  document.getElementById('q2a').addEventListener('click', function() {
    SoundManager.buttonClick();
    state.preferences.soup = 'yes'; updateBlackboard(); askQuestion4();
  });
  document.getElementById('q2b').addEventListener('click', function() {
    SoundManager.buttonClick();
    state.preferences.soup = 'no'; updateBlackboard(); askQuestion4();
  });
}

async function askQuestion3() {
  pushQuestionStep('q3');
  propBowl.style.display = 'none';
  questionTitle.textContent = '问题五：忌口备注';
  questionContent.innerHTML = '<div style="color:#FFF8F0;font-size:14px;margin-bottom:16px;">🚫 有什么是不吃的吗？</div><input type="text" class="taboo-input" id="tabooInput" placeholder="例如：芹菜、香菜"><div style="margin-top:12px;"><button class="skip-btn" id="skipTaboo">跳过</button><button class="choice-btn" id="confirmTaboo" style="margin-left:10px;padding:8px 20px;">确认</button></div>';
  await typeText(stage2Bubble, '大人有什么忌口吗？告诉有米，有米会记住的。');
  var input = document.getElementById('tabooInput');
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('confirmTaboo').click(); }
  });
  document.getElementById('skipTaboo').addEventListener('click', function() { SoundManager.buttonClick(); finishStage2(); });
  document.getElementById('confirmTaboo').addEventListener('click', function() {
    SoundManager.buttonClick();
    state.preferences.taboo = input.value.trim(); updateBlackboard(); finishStage2();
  });
}

async function askQuestion4() {
  pushQuestionStep('q4');
  questionTitle.textContent = '问题三：主食偏好';
  questionContent.innerHTML = '<div style="color:#FFF8F0;font-size:14px;margin-bottom:16px;">🍚 有米端来一碗米饭和一盘面条...</div><div class="choice-buttons"><button class="choice-btn" id="q4a">米饭为主</button><button class="choice-btn" id="q4b">面食为主</button><button class="choice-btn" id="q4c">都行</button></div>';
  await typeText(stage2Bubble, '大人平时更爱吃米饭还是面食？');
  document.getElementById('q4a').addEventListener('click', function() { SoundManager.buttonClick(); state.preferences.staple = 'rice'; updateBlackboard(); askQuestion5(); });
  document.getElementById('q4b').addEventListener('click', function() { SoundManager.buttonClick(); state.preferences.staple = 'noodle'; updateBlackboard(); askQuestion5(); });
  document.getElementById('q4c').addEventListener('click', function() { SoundManager.buttonClick(); state.preferences.staple = 'both'; updateBlackboard(); askQuestion5(); });
}

async function askQuestion5() {
  pushQuestionStep('q5');
  questionTitle.textContent = '问题四：口味偏好';
  questionContent.innerHTML = '<div style="color:#FFF8F0;font-size:14px;margin-bottom:16px;">🧂 有米拿出两份菜单...</div><div class="choice-buttons"><button class="choice-btn" id="q5a">重口味</button><button class="choice-btn" id="q5b">清淡点</button><button class="choice-btn" id="q5c">都行</button></div>';
  await typeText(stage2Bubble, '大人喜欢重口味还是清淡些？');
  document.getElementById('q5a').addEventListener('click', function() { SoundManager.buttonClick(); state.preferences.flavor = 'heavy'; updateBlackboard(); askQuestion3(); });
  document.getElementById('q5b').addEventListener('click', function() { SoundManager.buttonClick(); state.preferences.flavor = 'light'; updateBlackboard(); askQuestion3(); });
  document.getElementById('q5c').addEventListener('click', function() { SoundManager.buttonClick(); state.preferences.flavor = 'both'; updateBlackboard(); askQuestion3(); });
}

async function finishStage2() {
  questionContent.innerHTML = '';
  questionTitle.textContent = '';
  editPrefBtn.classList.remove('hidden');
  await typeText(stage2Bubble, '有米大概了解大人了！我们开始第一次决策吧。');
  await wait(600);
  var btn = document.createElement('button');
  btn.className = 'start-btn'; btn.textContent = '开始第一次决策'; btn.style.marginTop = '20px';
  btn.onclick = function() { saveData(); showStage('stage3'); initStage3(); };
  questionContent.appendChild(btn);
}

/* ---- 黑板偏好编辑 ---- */
editPrefBtn.addEventListener('click', function() { enterBlackboardEditMode(false); });

function enterBlackboardEditMode(fromStage3) {
  editingFromStage3 = fromStage3 || false;
  editPrefBtn.classList.add('hidden');
  questionContent.innerHTML = '';
  questionTitle.textContent = '';
  propChili.style.display = 'none';
  propBowl.style.display = 'none';
  renderBlackboardEditor();
  typeText(stage2Bubble, '大人想改什么？有米重新记一下～');
}

function renderBlackboardEditor() {
  var s = state.preferences.spicy;
  var p = state.preferences.soup;
  var s2 = state.preferences.staple;
  var fl = state.preferences.flavor;
  var t = (state.preferences.taboo || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  blackboardContent.innerHTML =
    '<div class="pref-edit-section">' +
      '<div class="pref-edit-row"><span class="pref-label">辣度</span>' +
        '<button class="pref-toggle' + (s === 'high' ? ' pref-on' : '') + '" data-pref="spicy" data-val="high">爱吃辣' + (s === 'high' ? ' ✓' : '') + '</button>' +
        '<button class="pref-toggle' + (s === 'low' ? ' pref-on' : '') + '" data-pref="spicy" data-val="low">怕辣' + (s === 'low' ? ' ✓' : '') + '</button>' +
      '</div>' +
      '<div class="pref-edit-row"><span class="pref-label">汤类</span>' +
        '<button class="pref-toggle' + (p === 'yes' ? ' pref-on' : '') + '" data-pref="soup" data-val="yes">爱喝汤' + (p === 'yes' ? ' ✓' : '') + '</button>' +
        '<button class="pref-toggle' + (p === 'no' ? ' pref-on' : '') + '" data-pref="soup" data-val="no">不喝汤' + (p === 'no' ? ' ✓' : '') + '</button>' +
      '</div>' +
      '<div class="pref-edit-row"><span class="pref-label">主食</span>' +
        '<button class="pref-toggle' + (s2 === 'rice' ? ' pref-on' : '') + '" data-pref="staple" data-val="rice">米饭为主' + (s2 === 'rice' ? ' ✓' : '') + '</button>' +
        '<button class="pref-toggle' + (s2 === 'noodle' ? ' pref-on' : '') + '" data-pref="staple" data-val="noodle">面食为主' + (s2 === 'noodle' ? ' ✓' : '') + '</button>' +
        '<button class="pref-toggle' + (s2 === 'both' ? ' pref-on' : '') + '" data-pref="staple" data-val="both">都行' + (s2 === 'both' ? ' ✓' : '') + '</button>' +
      '</div>' +
      '<div class="pref-edit-row"><span class="pref-label">口味</span>' +
        '<button class="pref-toggle' + (fl === 'heavy' ? ' pref-on' : '') + '" data-pref="flavor" data-val="heavy">重口味' + (fl === 'heavy' ? ' ✓' : '') + '</button>' +
        '<button class="pref-toggle' + (fl === 'light' ? ' pref-on' : '') + '" data-pref="flavor" data-val="light">清淡点' + (fl === 'light' ? ' ✓' : '') + '</button>' +
        '<button class="pref-toggle' + (fl === 'both' ? ' pref-on' : '') + '" data-pref="flavor" data-val="both">都行' + (fl === 'both' ? ' ✓' : '') + '</button>' +
      '</div>' +
      '<div class="pref-edit-row"><span class="pref-label">忌口</span>' +
        '<input type="text" id="editTabooInput" class="taboo-input" value="' + t + '" placeholder="如：芹菜">' +
      '</div>' +
      '<button class="choice-btn" id="finishEditBtn" style="margin-top:8px;">完成修改</button>' +
    '</div>';
  blackboardContent.querySelectorAll('.pref-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      state.preferences[btn.dataset.pref] = btn.dataset.val;
      renderBlackboardEditor();
    });
  });
  document.getElementById('finishEditBtn').addEventListener('click', finishEditPref);
}

function finishEditPref() {
  var input = document.getElementById('editTabooInput');
  if (input) state.preferences.taboo = input.value.trim();
  saveData();
  updateBlackboard();
  editPrefBtn.classList.remove('hidden');
  if (editingFromStage3) {
    editingFromStage3 = false;
    transitioning = false;
    showStage('stage3');
    initStage3();
  } else {
    typeText(stage2Bubble, '改好啦！大人现在可以开始决策了～');
    questionContent.innerHTML = '';
    var btn = document.createElement('button');
    btn.className = 'start-btn'; btn.textContent = '开始第一次决策'; btn.style.marginTop = '20px';
    btn.onclick = function() { saveData(); showStage('stage3'); initStage3(); };
    questionContent.appendChild(btn);
  }
}

/* ==================== 第三阶段：智能决策 ==================== */
var stage3Bubble = document.getElementById('stage3Bubble');
var wheelArea = document.getElementById('wheelArea');
var wheelCanvas = document.getElementById('wheelCanvas');
var inputArea = document.getElementById('inputArea');
var optionsInput = document.getElementById('optionsInput');
var analyzeBtn = document.getElementById('analyzeBtn');
var spinBtn = document.getElementById('spinBtn');
var addMoreBtn = document.getElementById('addMoreBtn');
var reshuffleBtn = document.getElementById('reshuffleBtn');
var customPickBtn = document.getElementById('customPickBtn');
var wheelCounter = document.getElementById('wheelCounter');
var WHEEL_MAX = 12;
var analyzingOverlay = document.getElementById('analyzingOverlay');
var thinkText = document.getElementById('thinkText');
var receiptOverlay = document.getElementById('receiptOverlay');
var receiptResult = document.getElementById('receiptResult');
var receiptDate = document.getElementById('receiptDate');
var receiptNote = document.getElementById('receiptNote');
var weatherBoard = document.getElementById('weatherBoard');
var wheelPulse = document.getElementById('wheelPulse');

var wheelRotation = 0;
var wheelSpinning = false;
var WHEEL_COLORS = ['#E88D3C', '#D4A574', '#C49A6C', '#B8956A', '#A88550', '#E0A060', '#D09050', '#C08040'];

function getSectorAtMouse(mouseX, mouseY) {
  var rect = wheelCanvas.getBoundingClientRect();
  var cx = rect.width / 2;
  var cy = rect.height / 2;
  var scaleX = wheelCanvas.width / rect.width;
  var scaleY = wheelCanvas.height / rect.height;
  var x = (mouseX - rect.left) * scaleX - cx;
  var y = (mouseY - rect.top) * scaleY - cy;
  var dist = Math.sqrt(x * x + y * y);
  var radius = Math.min(wheelCanvas.width, wheelCanvas.height) / 2 - 10;
  if (dist > radius || dist < 20) return -1;
  var angle = Math.atan2(y, x) - wheelRotation;
  while (angle < -Math.PI / 2) angle += Math.PI * 2;
  while (angle > Math.PI * 1.5) angle -= Math.PI * 2;
  var opts = state.currentOptions;
  var weights = state.currentWeights;
  var totalWeight = weights.reduce(function(a, b) { return a + b; }, 0);
  var startAngle = -Math.PI / 2;
  for (var i = 0; i < opts.length; i++) {
    var sliceAngle = (weights[i] / totalWeight) * Math.PI * 2;
    var endAngle = startAngle + sliceAngle;
    var normAngle = angle;
    var normStart = startAngle;
    var normEnd = endAngle;
    while (normStart < -Math.PI) { normStart += Math.PI * 2; normEnd += Math.PI * 2; }
    while (normAngle < normStart) normAngle += Math.PI * 2;
    if (normAngle >= normStart && normAngle < normEnd) return i;
    startAngle = endAngle;
  }
  return -1;
}

function initWheelTooltip() {
  var tooltip = document.getElementById('wheelTooltip');
  if (!tooltip || tooltip._inited) return;
  tooltip._inited = true;
  wheelCanvas.addEventListener('mousemove', function(e) {
    if (wheelSpinning) { tooltip.classList.remove('show'); return; }
    var idx = getSectorAtMouse(e.clientX, e.clientY);
    if (idx >= 0 && state.currentOptions[idx]) {
      tooltip.textContent = state.currentOptions[idx];
      var rect = wheelCanvas.getBoundingClientRect();
      var areaRect = wheelArea.getBoundingClientRect();
      tooltip.style.left = (e.clientX - areaRect.left + 12) + 'px';
      tooltip.style.top = (e.clientY - areaRect.top - 30) + 'px';
      tooltip.classList.add('show');
    } else {
      tooltip.classList.remove('show');
    }
  });
  wheelCanvas.addEventListener('mouseleave', function() {
    tooltip.classList.remove('show');
  });
}

function updateWheelCounter() {
  var count = state.currentOptions.length;
  wheelCounter.textContent = count + '/' + WHEEL_MAX;
  if (count >= WHEEL_MAX) {
    addMoreBtn.disabled = true;
    addMoreBtn.textContent = '已满';
  } else {
    addMoreBtn.disabled = false;
    addMoreBtn.textContent = '加一批';
  }
}

function addMoreRecommendations() {
  var current = state.currentOptions;
  if (current.length >= WHEEL_MAX) {
    typeText(stage3Bubble, '大人，转盘已经装不下了，先转吧！');
    return;
  }
  var need = Math.min(3, WHEEL_MAX - current.length);
  var newOnes = generateRecommendations(current, need);
  if (newOnes.length === 0) {
    typeText(stage3Bubble, '有米已经把所有知道的菜都放上去了！');
    return;
  }
  state.currentOptions = current.concat(newOnes);
  calculateWeights();
  drawWheel();
  playWheelBounce();
  updateWheelCounter();
  var names = newOnes.join('、');
  typeText(stage3Bubble, '有米又想到几个：' + names + '，大人看看！');
}

var stage3IdleState = { timer: null, blinkTimer: null, listeners: [] };
var lateNightWoken = false;

function setupLateNightScene() {
  createYouniImg('youniStage3', '04-sleepy');
  var stage3 = document.getElementById('stage3');
  var youniEl = document.getElementById('youniStage3');
  var tavernScene = stage3.querySelector('.tavern-scene');

  /* 暗色遮罩 */
  var overlay = document.createElement('div');
  overlay.className = 'late-night-overlay';
  overlay.id = 'lateNightOverlay';
  if (tavernScene) tavernScene.appendChild(overlay);

  /* Zzz 动画 */
  var zzzContainer = document.createElement('div');
  zzzContainer.className = 'zzz-container';
  zzzContainer.id = 'zzzContainer';
  zzzContainer.style.cssText = 'left:65px; bottom:145px;';
  zzzContainer.innerHTML = '<span class="zzz">Z</span><span class="zzz">z</span><span class="zzz">z</span>';
  stage3.appendChild(zzzContainer);

  /* 废稿散落 */
  ['p1', 'p2', 'p3'].forEach(function(p) {
    var paper = document.createElement('div');
    paper.className = 'scattered-paper ' + p;
    paper.id = 'scatteredPaper_' + p;
    stage3.appendChild(paper);
  });

  typeText(stage3Bubble, 'Zzz... 大人这么晚还没睡呀... 有米先眯一会儿... (点击有米唤醒)', 45);

  /* 点击唤醒 */
  youniEl.style.cursor = 'pointer';
  youniEl.style.pointerEvents = 'auto';
  function wakeHandler(e) {
    e.stopPropagation();
    youniEl.removeEventListener('click', wakeHandler);
    youniEl.style.cursor = '';
    youniEl.style.pointerEvents = 'none';
    wakeUpYouni();
  }
  youniEl.addEventListener('click', wakeHandler);
}

function wakeUpYouni() {
  var stage3 = document.getElementById('stage3');

  /* 移除 Zzz */
  var zzz = document.getElementById('zzzContainer');
  if (zzz) zzz.remove();

  /* 移除废稿 */
  ['p1', 'p2', 'p3'].forEach(function(p) {
    var el = document.getElementById('scatteredPaper_' + p);
    if (el) el.remove();
  });

  /* 闪光 */
  var flash = document.createElement('div');
  flash.className = 'wake-flash';
  stage3.appendChild(flash);
  requestAnimationFrame(function() { flash.classList.add('flash'); });
  setTimeout(function() { flash.classList.remove('flash'); }, 350);
  setTimeout(function() { if (flash.parentNode) flash.remove(); }, 900);

  /* 亮灯 */
  var overlay = document.getElementById('lateNightOverlay');
  if (overlay) overlay.classList.add('brighten');
  setTimeout(function() { if (overlay && overlay.parentNode) overlay.remove(); }, 1600);

  /* 惊醒 */
  setYouniPose('youniStage3', '05-surprised');
  SoundManager.surprised();
  typeText(stage3Bubble, '啊！大人！对不起，有米不小心睡着了... 这么晚了想吃点夜宵吗？有米这就起来！', 45);

  lateNightWoken = true;

  setTimeout(function() {
    setYouniPose('youniStage3', '01-default-stand');
    initStage3();
  }, 2800);
}

function initStage3() {
  if (stage3IdleState.timer) clearTimeout(stage3IdleState.timer);
  if (stage3IdleState.blinkTimer) clearInterval(stage3IdleState.blinkTimer);
  stage3IdleState.listeners.forEach(function(fn) { fn(); });
  stage3IdleState.listeners = [];

  /* 深夜彩蛋：23:00-5:00 有米趴吧台睡觉 */
  if (isLateNight() && !lateNightWoken) {
    setupLateNightScene();
    return;
  }

  checkAchievements('enter_stage3');
  createYouniImg('youniStage3', '01-default-stand');
  state.currentWeather = getWeather();
  var weatherEmoji = { '晴': ' 🌞', '雨': ' 🌧️', '多云': ' ⛅', '阴': ' ☁️' };
  weatherBoard.textContent = state.currentWeather + (weatherEmoji[state.currentWeather] || '');
  var sceneLabel = document.getElementById('sceneLabel');
  var scene = getMealScene();
  if (sceneLabel) sceneLabel.textContent = scene.label;
  fetchWeather().then(function(w) {
    if (w !== state.currentWeather) {
      state.currentWeather = w;
      weatherBoard.textContent = w + (weatherEmoji[w] || '');
    }
  });
  var recommendations = generateRecommendations();
  state.currentOptions = recommendations;
  calculateWeights();
  wheelArea.style.display = 'block';
  inputArea.style.display = 'none';
  wheelCounter.style.display = 'block';
  drawWheel();
  playWheelBounce();
  initWheelTooltip();
  updateWheelCounter();
  spinBtn.style.display = 'inline-block'; spinBtn.disabled = false;
  addMoreBtn.style.display = 'inline-block';
  reshuffleBtn.style.display = 'inline-block';
  customPickBtn.style.display = 'inline-block';
  spinBtn.onclick = spinWheel;
  addMoreBtn.onclick = addMoreRecommendations;

  var touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  wheelCanvas.ontouchstart = function(e) {
    if (wheelSpinning) return;
    var touch = e.touches[0];
    var rect = wheelCanvas.getBoundingClientRect();
    touchStartX = touch.clientX - rect.left;
    touchStartY = touch.clientY - rect.top;
    touchStartTime = Date.now();
  };
  wheelCanvas.ontouchend = function(e) {
    if (wheelSpinning) return;
    var touch = e.changedTouches[0];
    var rect = wheelCanvas.getBoundingClientRect();
    var endX = touch.clientX - rect.left;
    var endY = touch.clientY - rect.top;
    var endTime = Date.now();
    var dx = endX - touchStartX;
    var dy = endY - touchStartY;
    var dt = endTime - touchStartTime;
    if (dt > 50 && dt < 1000) {
      var distance = Math.sqrt(dx * dx + dy * dy);
      var speed = distance / dt;
      if (speed > 0.3 && distance > 30) {
        spinWheel();
      }
    }
  };
  reshuffleBtn.onclick = function() {
    var recs = generateRecommendations(); state.currentOptions = recs; calculateWeights(); drawWheel();
    playWheelBounce();
    updateWheelCounter();
    typeText(stage3Bubble, pickDialogue('stage3_reshuffle'));
  };
  customPickBtn.onclick = function() {
    wheelArea.style.display = 'none'; inputArea.style.display = 'block';
    wheelCounter.style.display = 'none';
    optionsInput.value = ''; analyzeBtn.textContent = '让有米分析'; analyzeBtn.disabled = false;
  };
  document.getElementById('editPrefStage3Btn').onclick = function() {
    showStage('stage2');
    enterBlackboardEditMode(true);
  };
  var timeGreeting = getTimeGreeting();
  var taboo = state.preferences.taboo;
  if (timeGreeting && taboo) {
    typeText(stage3Bubble, timeGreeting + '大人不吃' + taboo + '，有米已经把它拿掉了~');
  } else if (timeGreeting) {
    typeText(stage3Bubble, timeGreeting);
  } else if (taboo) {
    typeText(stage3Bubble, pickDialogue('stage3_intro') + '对了，大人不吃' + taboo + '，有米记着呢~');
  } else {
    typeText(stage3Bubble, pickDialogue('stage3_intro'));
  }

  stage3IdleState.blinkTimer = startYouniIdle('youniStage3');
  /* 随机环境音 */
  if (Math.random() < 0.4) SoundManager.ambient();
  function resetIdleTimer() {
    if (stage3IdleState.timer) clearTimeout(stage3IdleState.timer);
    stage3IdleState.timer = setTimeout(playIdleAction, 10000);
  }
  function playIdleAction() {
    var stage3 = document.getElementById('stage3');
    if (!stage3 || !stage3.classList.contains('active')) return;
    if (wheelSpinning) { resetIdleTimer(); return; }
    var weather = state.currentWeather;
    var youniEl = document.getElementById('youniStage3');
    if (!youniEl) return;
    var actions = ['pocket', 'yawn', 'look', 'tea', 'happy', 'think', 'expect', 'proud', 'surprise'];
    var action = actions[Math.floor(Math.random() * actions.length)];
    if (action === 'pocket') {
      setYouniPose('youniStage3', '09-tea-time');
      setTimeout(function() { typeText(stage3Bubble, '嗯？有米在掏围裙口袋...什么都没找到。'); }, 800);
      setTimeout(function() { setYouniPose('youniStage3', '01-default-stand'); resetIdleTimer(); }, 2500);
    } else if (action === 'yawn') {
      setYouniPose('youniStage3', '04-sleepy');
      SoundManager.yawning();
      setTimeout(function() { typeText(stage3Bubble, '哈欠~ 大人还在吗？有米稍微眯了一下...'); }, 800);
      setTimeout(function() { setYouniPose('youniStage3', '01-default-stand'); resetIdleTimer(); }, 2500);
    } else if (action === 'look') {
      setYouniPose('youniStage3', '12-notice-curious');
      var weatherDialogues = {
        '晴': '今天天气真好呢~',
        '雨': '下雨了呢，大人带伞了吗？',
        '多云': '多云的天气，好舒服~'
      };
      setTimeout(function() { typeText(stage3Bubble, weatherDialogues[weather] || '外面好像阴天呢...'); }, 1500);
      setTimeout(function() { setYouniPose('youniStage3', '01-default-stand'); resetIdleTimer(); }, 3500);
    } else if (action === 'tea') {
      setYouniPose('youniStage3', '09-tea-time');
      setTimeout(function() { typeText(stage3Bubble, '呼~ 有米泡了杯茶歇口气。大人要不要也来一杯？'); }, 800);
      setTimeout(function() { setYouniPose('youniStage3', '01-default-stand'); resetIdleTimer(); }, 3000);
    } else if (action === 'happy') {
      setYouniPose('youniStage3', '02-happy-stars');
      SoundManager.happy();
      setTimeout(function() { typeText(stage3Bubble, '嘿嘿~ 想到大人上次吃得开心的样子，有米就好高兴！'); }, 600);
      setTimeout(function() { setYouniPose('youniStage3', '01-default-stand'); resetIdleTimer(); }, 3000);
    } else if (action === 'think') {
      setYouniPose('youniStage3', '03-thinking');
      SoundManager.thinking();
      SoundManager.sigh();
      setTimeout(function() { typeText(stage3Bubble, '嗯...有米在想，明天给大人推荐点什么新花样呢...'); }, 1000);
      setTimeout(function() { setYouniPose('youniStage3', '01-default-stand'); resetIdleTimer(); }, 3500);
    } else if (action === 'expect') {
      setYouniPose('youniStage3', '14-expecting-anticipation');
      setTimeout(function() { typeText(stage3Bubble, '大人什么时候来呢... 有米把菜单都准备好了！'); }, 800);
      setTimeout(function() { setYouniPose('youniStage3', '01-default-stand'); resetIdleTimer(); }, 3000);
    } else if (action === 'proud') {
      setYouniPose('youniStage3', '15-recommend-proud');
      setTimeout(function() { typeText(stage3Bubble, '哼哼~ 有米今天的推荐可是一绝！大人快转转看！'); }, 600);
      setTimeout(function() { setYouniPose('youniStage3', '01-default-stand'); resetIdleTimer(); }, 3000);
    } else {
      setYouniPose('youniStage3', '05-surprised');
      SoundManager.surprised();
      setTimeout(function() { typeText(stage3Bubble, '啊！有米突然想到一道好菜... 等大人转到了就知道了！'); }, 500);
      setTimeout(function() { setYouniPose('youniStage3', '01-default-stand'); resetIdleTimer(); }, 2800);
    }
  }
  var idleEvents = ['click', 'touchstart', 'keydown', 'mousemove'];
  function onUserActivity() {
    setYouniPose('youniStage3', '01-default-stand');
    resetIdleTimer();
  }
  idleEvents.forEach(function(ev) {
    var target = document.getElementById('stage3');
    target.addEventListener(ev, onUserActivity);
    stage3IdleState.listeners.push(function() {
      target.removeEventListener(ev, onUserActivity);
    });
  });
  resetIdleTimer();
}

document.addEventListener('keydown', function(e) {
  var stage1 = document.getElementById('stage1');
  var stage3 = document.getElementById('stage3');

  if (stage1 && stage1.classList.contains('active')) {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      stage1.click();
    }
    return;
  }

  if (!stage3 || !stage3.classList.contains('active')) return;
  if (wheelSpinning) return;
  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault();
    SoundManager.keyboard();
    spinWheel();
  } else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    SoundManager.keyboard();
    reshuffleBtn.click();
  }
});

async function onAnalyzeClick() {
  var raw = optionsInput.value.trim();
  if (!raw) return;
  var options = raw.split(/[,，、\s]+/).map(function(s) { return s.trim(); }).filter(function(s) { return s; });
  var isAppend = analyzeBtn.textContent === '追加';
  var existing = isAppend ? state.currentOptions : [];
  var combined = existing.concat(options);
  var uniqueCombined = [];
  var seen = new Set();
  combined.forEach(function(d) { if (!seen.has(d)) { seen.add(d); uniqueCombined.push(d); } });
  if (uniqueCombined.length < 2) { typeText(stage3Bubble, '大人至少给有米两个选项嘛...'); return; }
  if (uniqueCombined.length > WHEEL_MAX) { typeText(stage3Bubble, '大人，转盘最多装' + WHEEL_MAX + '个选项哦！'); return; }
  state.currentOptions = uniqueCombined;
  analyzeBtn.disabled = true;
  var youniEl = document.getElementById('youniStage3');
  analyzingOverlay.classList.add('show');
  setYouniPose('youniStage3', '03-thinking');
  await wait(800);
  thinkText.textContent = '有米在托下巴思考...';
  await wait(800);
  thinkText.textContent = '有米在算权重...';
  await wait(600);
  analyzingOverlay.classList.remove('show');
  setYouniPose('youniStage3', '01-default-stand');
  calculateWeights();
  inputArea.style.display = 'none'; wheelArea.style.display = 'block'; wheelCounter.style.display = 'block'; drawWheel();
  updateWheelCounter();
  var explain = generateExplanation();
  await typeText(stage3Bubble, explain);
  spinBtn.style.display = 'inline-block'; spinBtn.disabled = false;
  addMoreBtn.style.display = 'inline-block';
  addMoreBtn.textContent = '再加几个';
  addMoreBtn.onclick = function() {
    wheelArea.style.display = 'none'; inputArea.style.display = 'block'; wheelCounter.style.display = 'none';
    optionsInput.value = ''; optionsInput.placeholder = '输入要追加的选项，如：粥品、烧烤';
    analyzeBtn.textContent = '追加';
    analyzeBtn.disabled = false;
  };
  reshuffleBtn.style.display = 'none'; customPickBtn.style.display = 'none';
  spinBtn.onclick = spinWheel;
}

analyzeBtn.addEventListener('click', onAnalyzeClick);
optionsInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') { e.preventDefault(); onAnalyzeClick(); }
});
document.getElementById('backToRecommendBtn').addEventListener('click', function() {
  inputArea.style.display = 'none';
  wheelArea.style.display = 'block';
  wheelCounter.style.display = 'block';
  var recs = generateRecommendations();
  state.currentOptions = recs;
  calculateWeights();
  drawWheel();
  updateWheelCounter();
  optionsInput.placeholder = '输入选项，如：麻辣烫、寿司、沙拉';
  analyzeBtn.textContent = '让有米分析';
  spinBtn.style.display = 'inline-block'; spinBtn.disabled = false;
  addMoreBtn.style.display = 'inline-block'; addMoreBtn.textContent = '加一批'; addMoreBtn.onclick = addMoreRecommendations;
  reshuffleBtn.style.display = 'inline-block';
  customPickBtn.style.display = 'inline-block';
  spinBtn.onclick = spinWheel;
  typeText(stage3Bubble, '好嘞~ 有米继续为大人推荐！');
});

function getDishHistoryScore(dishName) {
  var score = 0;
  var count = 0;
  state.history.forEach(function(entry) {
    if (entry.result === dishName) {
      if (entry.rating === 'good') score += 1.0;
      else if (entry.rating === 'ok') score += 0.2;
      else if (entry.rating === 'bad') score -= 0.8;
      count++;
    }
  });
  if (count === 0) return 0;
  var avg = score / count;
  var confidence = Math.min(count / 3, 1);
  return avg * confidence;
}

function getBadReasonAdjustments() {
  var adjustments = { spicy: 0, bland: 0, soup: 0, quality: 0 };
  state.history.forEach(function(entry) {
    if (entry.rating === 'bad' && entry.reason) {
      if (entry.reason === 'too_spicy') adjustments.spicy -= 0.15;
      if (entry.reason === 'too_bland') adjustments.bland -= 0.1;
      if (entry.reason === 'not_tasty') adjustments.spicy -= 0.05;
    }
    if (entry.rating === 'good') {
      if (entry.result.includes('辣') || entry.result.includes('火锅') || entry.result.includes('麻辣')) adjustments.spicy += 0.08;
      if (entry.result.includes('汤') || entry.result.includes('面')) adjustments.soup += 0.05;
    }
  });
  return adjustments;
}

function calculateWeights() {
  var opts = state.currentOptions;
  var badAdj = getBadReasonAdjustments();
  var weights = opts.map(function(opt, i) {
    var w = 1.0;
    w += (opts.length - i) * 0.15;
    if (state.currentWeather === '雨') {
      if (opt.includes('汤') || opt.includes('火锅') || opt.includes('面') || opt.includes('馄饨') || opt.includes('关东煮')) w += 0.4;
      if (opt.includes('冰') || opt.includes('凉') || opt.includes('沙拉') || opt.includes('冷')) w -= 0.3;
    } else if (state.currentWeather === '晴') {
      if (opt.includes('凉') || opt.includes('冰') || opt.includes('沙拉') || opt.includes('冷')) w += 0.3;
    } else if (state.currentWeather === '阴' || state.currentWeather === '多云') {
      if (opt.includes('面') || opt.includes('饭')) w += 0.15;
    }
    var isSpicy = opt.includes('辣') || opt.includes('火锅') || opt.includes('麻辣烫') || opt.includes('麻辣');
    if (state.preferences.spicy === 'high' && isSpicy) w += 0.5;
    if (state.preferences.spicy === 'low' && isSpicy) w -= 0.4;
    if (badAdj.spicy !== 0 && isSpicy) w += badAdj.spicy;
    var isSoup = opt.includes('汤') || opt.includes('面') || opt.includes('粥') || opt.includes('馄饨');
    if (state.preferences.soup === 'yes' && isSoup) w += 0.3;
    if (state.preferences.soup === 'no' && opt.includes('汤')) w -= 0.2;
    if (badAdj.soup !== 0 && isSoup) w += badAdj.soup;
    var isRice = opt.includes('饭') || opt.includes('炒饭') || opt.includes('拌饭') || opt.includes('丼');
    var isNoodle = opt.includes('面') || opt.includes('粉') || opt.includes('河粉');
    if (state.preferences.staple === 'rice' && isRice) w += 0.2;
    if (state.preferences.staple === 'rice' && isNoodle) w -= 0.1;
    if (state.preferences.staple === 'noodle' && isNoodle) w += 0.2;
    if (state.preferences.staple === 'noodle' && isRice) w -= 0.1;
    var isHeavy = opt.includes('麻辣') || opt.includes('火锅') || opt.includes('烤') || opt.includes('炸') || opt.includes('红烧') || opt.includes('辣');
    var isLight = opt.includes('清蒸') || opt.includes('白灼') || opt.includes('凉拌') || opt.includes('粥') || opt.includes('清');
    if (state.preferences.flavor === 'heavy' && isHeavy) w += 0.2;
    if (state.preferences.flavor === 'light' && isLight) w += 0.2;
    if (state.preferences.taboo && opt.includes(state.preferences.taboo)) w = 0.05;
    var historyScore = getDishHistoryScore(opt);
    if (historyScore !== 0) {
      w += historyScore * 0.6;
    }
    return Math.max(0.05, w);
  });
  state.currentWeights = weights;
}

function generateExplanation() {
  var maxW = Math.max.apply(null, state.currentWeights);
  var maxIdx = state.currentWeights.indexOf(maxW);
  var maxOpt = state.currentOptions[maxIdx];
  var reasons = [];
  if (maxIdx === 0) reasons.push('第一个选项通常是大人心里的首选');
  if (state.currentWeather === '雨') reasons.push('今天下雨，有米觉得热乎的更好');
  else if (state.currentWeather === '晴') reasons.push('今天天气不错');
  else reasons.push('今天天气阴沉沉的');
  if (state.preferences.spicy === 'high') reasons.push('大人爱吃辣');
  if (state.preferences.soup === 'yes') reasons.push('大人爱喝汤');
  var historyScore = getDishHistoryScore(maxOpt);
  if (historyScore > 0.3) reasons.push('大人之前说过这个好吃');
  else if (historyScore < -0.3) reasons.push('虽然之前踩过雷，但偶尔换换口味也不错');
  var badAdj = getBadReasonAdjustments();
  if (badAdj.spicy < -0.2) reasons.push('有米记得大人说过太辣了');
  return '「' + maxOpt + '」扇区最大，因为' + reasons[0] + '。';
}

function getContrastColor(hexColor) {
  var r = parseInt(hexColor.slice(1, 3), 16);
  var g = parseInt(hexColor.slice(3, 5), 16);
  var b = parseInt(hexColor.slice(5, 7), 16);
  var brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#2C1810' : '#FFF8F0';
}

function getWheelFontSize(opts, weights, radius) {
  var count = opts.length;
  var maxLen = 0;
  opts.forEach(function(o) { if (o.length > maxLen) maxLen = o.length; });
  var totalWeight = weights.reduce(function(a, b) { return a + b; }, 0);
  var minSliceAngle = Math.PI * 2;
  weights.forEach(function(w) {
    var a = (w / totalWeight) * Math.PI * 2;
    if (a < minSliceAngle) minSliceAngle = a;
  });
  var minSliceDeg = (minSliceAngle / Math.PI) * 180;
  var size = 12;
  if (count > 10) size = 9;
  else if (count > 8) size = 10;
  else if (count > 6) size = 11;
  if (maxLen > 5 && minSliceDeg < 30) size = Math.max(8, size - 1);
  if (maxLen > 7 && count > 8) size = Math.max(8, size - 1);
  return size;
}

function shadeColor(hex, percent) {
  var num = parseInt(hex.replace('#', ''), 16);
  var r = (num >> 16) + Math.round(255 * percent / 100);
  var g = ((num >> 8) & 0xFF) + Math.round(255 * percent / 100);
  var b = (num & 0xFF) + Math.round(255 * percent / 100);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function drawWheel(highlightIdx) {
  if (highlightIdx === undefined) highlightIdx = -1;
  var ctx = wheelCanvas.getContext('2d');
  var w = wheelCanvas.width, h = wheelCanvas.height;
  var cx = w / 2, cy = h / 2;
  var radius = Math.min(w, h) / 2 - 10;
  var opts = state.currentOptions;
  var weights = state.currentWeights;
  var totalWeight = weights.reduce(function(a, b) { return a + b; }, 0);
  var fontSize = getWheelFontSize(opts, weights, radius);
  var lineGap = fontSize * 0.7;
  ctx.clearRect(0, 0, w, h); ctx.save();
  if (highlightIdx >= 0) {
    ctx.translate(cx, cy); ctx.rotate(wheelRotation); ctx.translate(-cx, -cy);
  }
  ctx.beginPath(); ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
  ctx.fillStyle = '#8B4513'; ctx.fill();
  for (var ti = 0; ti < 20; ti++) {
    var ta = (Math.PI * 2 * ti) / 20;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ta) * (radius + 2), cy + Math.sin(ta) * (radius + 2));
    ctx.lineTo(cx + Math.cos(ta) * (radius + 5), cy + Math.sin(ta) * (radius + 5));
    ctx.strokeStyle = '#A0522D'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  var startAngle = -Math.PI / 2;
  opts.forEach(function(opt, i) {
    var sliceAngle = (weights[i] / totalWeight) * Math.PI * 2;
    var endAngle = startAngle + sliceAngle;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle); ctx.closePath();
    var isHighlight = (i === highlightIdx);
    if (isHighlight) {
      ctx.fillStyle = '#FFD700'; ctx.shadowColor = 'rgba(255,215,0,0.6)'; ctx.shadowBlur = 20;
    } else {
      /* 渐变扇形 */
      var baseColor = WHEEL_COLORS[i % WHEEL_COLORS.length];
      var grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
      grad.addColorStop(0, baseColor);
      grad.addColorStop(1, shadeColor(baseColor, -15));
      ctx.fillStyle = grad; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    }
    ctx.fill(); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    if (isHighlight) { ctx.strokeStyle = '#F5A623'; ctx.lineWidth = 4; }
    else { ctx.strokeStyle = '#FFF8F0'; ctx.lineWidth = 2; }
    ctx.stroke();
    var midAngle = startAngle + sliceAngle / 2;
    var textR = radius * 0.65;
    var tx = cx + Math.cos(midAngle) * textR;
    var ty = cy + Math.sin(midAngle) * textR;
    ctx.save(); ctx.translate(tx, ty); ctx.rotate(midAngle + Math.PI / 2);
    var bgColor = isHighlight ? '#FFD700' : WHEEL_COLORS[i % WHEEL_COLORS.length];
    ctx.fillStyle = getContrastColor(bgColor);
    ctx.font = 'bold ' + fontSize + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var display = opt;
    var angleDeg = (sliceAngle / Math.PI) * 180;
    if (display.length > 5 && angleDeg < 45) {
      var mid = Math.ceil(display.length / 2);
      ctx.fillText(display.slice(0, mid), 0, -lineGap);
      ctx.fillText(display.slice(mid), 0, lineGap);
    } else if (display.length > 7) {
      var mid = Math.ceil(display.length / 2);
      ctx.fillText(display.slice(0, mid), 0, -lineGap);
      ctx.fillText(display.slice(mid), 0, lineGap);
    } else {
      ctx.fillText(display, 0, 0);
    }
    ctx.restore();
    startAngle = endAngle;
  });
  /* 装饰指针 */
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 2);
  ctx.lineTo(cx - 10, cy - radius - 18);
  ctx.lineTo(cx + 10, cy - radius - 18);
  ctx.closePath();
  ctx.fillStyle = '#C44536';
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  ctx.fill(); ctx.stroke();
  /* 中心圆 */
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF8F0'; ctx.fill(); ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#F5A623'; ctx.fill();
  ctx.restore();
}

function playWheelBounce() {
  wheelCanvas.classList.remove('wheel-bounce-in');
  void wheelCanvas.offsetWidth;
  wheelCanvas.classList.add('wheel-bounce-in');
}

function highlightWheelSector(winnerIdx) {
  drawWheel(winnerIdx);
  wheelPulse.classList.add('active');
}

function spinWheel() {
  if (wheelSpinning) return;
  var now = Date.now();
  state.spinTimestamps = state.spinTimestamps.filter(function(t) { return now - t < 5 * 60 * 1000; });
  var isSpinningTooFast = state.spinTimestamps.length >= 3;
  state.spinTimestamps.push(now);
  checkAchievements('spin');
  wheelSpinning = true; spinBtn.disabled = true; wheelPulse.classList.remove('active');
  SoundManager.wheelStart();
  var youniEl = document.getElementById('youniStage3');
  setYouniPose('youniStage3', '14-expecting-anticipation');
  if (isSpinningTooFast) {
    typeText(stage3Bubble, '大人转得太快啦，有米都晕了~ 要不先尝尝这个？');
  } else {
    typeText(stage3Bubble, '转转转~有米好期待呀！');
  }
  var opts = state.currentOptions;
  var weights = state.currentWeights;
  var totalWeight = weights.reduce(function(a, b) { return a + b; }, 0);
  var rand = Math.random() * totalWeight;
  var winnerIdx = 0;
  for (var i = 0; i < weights.length; i++) { rand -= weights[i]; if (rand <= 0) { winnerIdx = i; break; } }
  var startAngle = -Math.PI / 2;
  var targetAngle = 0;
  for (var j = 0; j < opts.length; j++) {
    var sliceAngle = (weights[j] / totalWeight) * Math.PI * 2;
    if (j === winnerIdx) { targetAngle = startAngle + sliceAngle / 2; break; }
    startAngle += sliceAngle;
  }
  var extraSpins = 5 + Math.random() * 3;
  var currentNormalized = wheelRotation % (Math.PI * 2);
  var delta = (-Math.PI / 2 - targetAngle - currentNormalized) + extraSpins * Math.PI * 2;
  while (delta < Math.PI * 4) delta += Math.PI * 2;
  var duration = 3000;
  var startTime = performance.now();
  var startRot = wheelRotation;
  var radius = Math.min(wheelCanvas.width, wheelCanvas.height) / 2 - 10;
  var spinFontSize = getWheelFontSize(opts, weights, radius);
  var lineGap = spinFontSize * 0.7;
  var lastSectorIdx = Math.floor(((wheelRotation + Math.PI / 2) % (Math.PI * 2)) / (Math.PI * 2 / opts.length));

  function elasticOut(t) {
    var p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  }
  var lastPose = '14-expecting-anticipation';
  function animate(now) {
    var elapsed = now - startTime;
    var t = Math.min(elapsed / duration, 1);
    var ease = elasticOut(t);
    wheelRotation = startRot + delta * ease;
    var speed = (delta * 3 * Math.pow(1 - t, 2)) / duration * 1000;
    var speedRatio = Math.min(1, speed / 10);

    if (t < 0.4) {
      if (lastPose !== '14-expecting-anticipation') {
        setYouniPose('youniStage3', '14-expecting-anticipation');
        lastPose = '14-expecting-anticipation';
      }
    } else if (t < 0.75) {
      if (lastPose !== '24-wheel-tense') {
        setYouniPose('youniStage3', '24-wheel-tense');
        lastPose = '24-wheel-tense';
      }
    } else if (t < 1) {
      if (lastPose !== '05-surprised') {
        setYouniPose('youniStage3', '05-surprised');
        lastPose = '05-surprised';
      }
    }

    var normalizedAngle = (wheelRotation + Math.PI / 2) % (Math.PI * 2);
    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;
    var currentSector = Math.floor(normalizedAngle / (Math.PI * 2 / opts.length));
    if (currentSector !== lastSectorIdx) {
      if (speedRatio > 0.15) {
        var panVal = Math.sin(wheelRotation);
        SoundManager.wheelTick(panVal, speedRatio * 0.7);
      }
      lastSectorIdx = currentSector;
    }
    var ctx = wheelCanvas.getContext('2d');
    var w = wheelCanvas.width, h = wheelCanvas.height;
    var cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h); ctx.save();
    ctx.translate(cx, cy); ctx.rotate(wheelRotation); ctx.translate(-cx, -cy);
    ctx.beginPath(); ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = '#8B4513'; ctx.fill();
    for (var ti = 0; ti < 20; ti++) {
      var ta = (Math.PI * 2 * ti) / 20;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ta) * (radius + 2), cy + Math.sin(ta) * (radius + 2));
      ctx.lineTo(cx + Math.cos(ta) * (radius + 5), cy + Math.sin(ta) * (radius + 5));
      ctx.strokeStyle = '#A0522D'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    var sa = -Math.PI / 2;
    opts.forEach(function(opt, i) {
      var sliceAngle = (weights[i] / totalWeight) * Math.PI * 2;
      var ea = sa + sliceAngle;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, sa, ea); ctx.closePath();
      var spinBaseColor = WHEEL_COLORS[i % WHEEL_COLORS.length];
      var spinGrad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
      spinGrad.addColorStop(0, spinBaseColor);
      spinGrad.addColorStop(1, shadeColor(spinBaseColor, -15));
      ctx.fillStyle = spinGrad; ctx.fill();
      ctx.strokeStyle = '#FFF8F0'; ctx.lineWidth = 2; ctx.stroke();
      var midAngle = sa + sliceAngle / 2;
      var textR = radius * 0.65;
      var tx = cx + Math.cos(midAngle) * textR;
      var ty = cy + Math.sin(midAngle) * textR;
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(midAngle + Math.PI / 2);
      ctx.fillStyle = getContrastColor(WHEEL_COLORS[i % WHEEL_COLORS.length]);
      ctx.font = 'bold ' + spinFontSize + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var display = opt;
      var angleDeg = (sliceAngle / Math.PI) * 180;
      if (display.length > 5 && angleDeg < 45) {
        var mid = Math.ceil(display.length / 2);
        ctx.fillText(display.slice(0, mid), 0, -lineGap);
        ctx.fillText(display.slice(mid), 0, lineGap);
      } else if (display.length > 7) {
        var mid = Math.ceil(display.length / 2);
        ctx.fillText(display.slice(0, mid), 0, -lineGap);
        ctx.fillText(display.slice(mid), 0, lineGap);
      } else {
        ctx.fillText(display, 0, 0);
      }
      ctx.restore();
      sa = ea;
    });
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF8F0'; ctx.fill(); ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#F5A623'; ctx.fill();
    ctx.restore();
    /* 指针（不随转盘旋转） */
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius - 2);
    ctx.lineTo(cx - 10, cy - radius - 18);
    ctx.lineTo(cx + 10, cy - radius - 18);
    ctx.closePath();
    ctx.fillStyle = '#C44536';
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
    if (t < 1) { requestAnimationFrame(animate); }
    else {
      wheelSpinning = false;
      SoundManager.wheelStop();
      var actualWinnerIdx = getActualWinnerIdx();
      highlightWheelSector(actualWinnerIdx);
      showResult(opts[actualWinnerIdx], actualWinnerIdx);
    }
  }
  requestAnimationFrame(animate);
}

function getActualWinnerIdx() {
  var opts = state.currentOptions;
  var weights = state.currentWeights;
  var totalWeight = weights.reduce(function(a, b) { return a + b; }, 0);
  var pointerAngle = (-Math.PI / 2 - wheelRotation) % (Math.PI * 2);
  if (pointerAngle < 0) pointerAngle += Math.PI * 2;
  var sa = -Math.PI / 2;
  for (var i = 0; i < opts.length; i++) {
    var sliceAngle = (weights[i] / totalWeight) * Math.PI * 2;
    var ea = sa + sliceAngle;
    var normPointer = pointerAngle;
    var normSa = sa; var normEa = ea;
    while (normSa < 0) { normSa += Math.PI * 2; normEa += Math.PI * 2; }
    while (normPointer < normSa) normPointer += Math.PI * 2;
    if (normPointer >= normSa && normPointer < normEa) return i;
    sa = ea;
  }
  return 0;
}

async function showResult(result, idx) {
  state.currentResult = result;
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
  await wait(400);
  var youni = document.getElementById('youniStage3');
  var weights = state.currentWeights;
  var totalWeight = weights.reduce(function(a, b) { return a + b; }, 0);
  var weightRatio = weights[idx] / totalWeight;
  var avgRatio = 1 / weights.length;
  if (weightRatio > avgRatio * 1.5) {
    setYouniPose('youniStage3', '02-happy-stars');
    createStars(youni, 8);
    createWarmFlash('stage3');
    unlockAchievement('perfect_match');
    await typeText(stage3Bubble, pickDialogue('stage3_spin_first', { result: result }));
  } else if (weightRatio > avgRatio * 1.2) {
    setYouniPose('youniStage3', '15-recommend-proud');
    await typeText(stage3Bubble, pickDialogue('stage3_spin_first', { result: result }));
  } else if (weightRatio < avgRatio * 0.6) {
    setYouniPose('youniStage3', '06-sad');
    await typeText(stage3Bubble, '呜...转到这个了，有米再帮大人看看？');
  } else if (weightRatio < avgRatio * 0.85) {
    setYouniPose('youniStage3', '03-thinking');
    await typeText(stage3Bubble, '嗯...这个也不错呢，大人觉得怎么样？');
  } else {
    setYouniPose('youniStage3', '01-default-stand');
    await typeText(stage3Bubble, pickDialogue('stage3_spin_other', { result: result }));
  }
  await wait(500);
  receiptResult.textContent = result;
  receiptDate.textContent = getToday() + ' ' + state.currentWeather;
  var note = '';
  if (state.preferences.spicy === 'high') note += '大人爱吃辣，有米记住了。';
  if (state.preferences.soup === 'yes') note += '大人爱喝汤。';
  if (state.preferences.taboo) note += '忌口：' + state.preferences.taboo + '。';
  receiptNote.textContent = note || '有米会不断学习大人的口味~';
  receiptOverlay.classList.add('show');
}

document.getElementById('receiptClose').addEventListener('click', function() {
  receiptOverlay.classList.remove('show');
  wheelPulse.classList.remove('active');
  var youni = document.getElementById('youniStage3');
  setYouniPose('youniStage3', '01-default-stand');
  stage4Init();
});

/* ==================== 小纸条分享 ==================== */
function drawNoteStar(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (var i = 0; i < 5; i++) {
    var angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    var px = x + Math.cos(angle) * size;
    var py = y + Math.sin(angle) * size;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawNotePaw(ctx, x, y) {
  ctx.fillStyle = 'rgba(210, 180, 140, 0.35)';
  ctx.beginPath(); ctx.ellipse(x, y, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - 8, y - 8, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y - 12, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 8, y - 8, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
}

function wrapNoteText(ctx, text, x, y, maxWidth, lineHeight) {
  var chars = text.split('');
  var line = '';
  for (var i = 0; i < chars.length; i++) {
    var testLine = line + chars[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = chars[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function generateShareNote() {
  var canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 520;
  var ctx = canvas.getContext('2d');

  /* 羊皮纸底色 */
  ctx.fillStyle = '#FFF8F0';
  ctx.fillRect(0, 0, 400, 520);

  /* 纹理颗粒 */
  for (var i = 0; i < 250; i++) {
    ctx.fillStyle = 'rgba(210, 180, 140, ' + (Math.random() * 0.06) + ')';
    ctx.fillRect(Math.random() * 400, Math.random() * 520, 2, 2);
  }

  /* 虚线边框 */
  ctx.strokeStyle = '#D4A574';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(20, 20, 360, 480);
  ctx.setLineDash([]);

  /* 标题 */
  ctx.fillStyle = '#2C1810';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('有米的小馆', 200, 62);

  /* 分割线 */
  ctx.strokeStyle = '#D4A574';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(70, 80); ctx.lineTo(330, 80);
  ctx.stroke();

  /* 副标题 */
  ctx.fillStyle = '#8B7355';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('— 今日推荐 —', 200, 104);

  /* 菜名 */
  var result = state.currentResult || '美味';
  ctx.fillStyle = '#F5A623';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText(result, 200, 165);

  /* 左右星标 */
  var nameWidth = ctx.measureText(result).width;
  drawNoteStar(ctx, 200 - nameWidth / 2 - 18, 155, 7, '#F5A623');
  drawNoteStar(ctx, 200 + nameWidth / 2 + 18, 155, 7, '#F5A623');

  /* 日期天气 */
  ctx.fillStyle = '#5C3A1E';
  ctx.font = '14px Georgia, serif';
  ctx.fillText(getToday() + '  ' + state.currentWeather, 200, 200);

  /* 寄语 */
  ctx.fillStyle = '#8B7355';
  ctx.font = '13px Georgia, serif';
  var note = receiptNote.textContent || '有米会不断学习大人的口味~';
  wrapNoteText(ctx, note, 200, 235, 300, 22);

  /* 印章 */
  ctx.save();
  ctx.translate(200, 410);
  ctx.rotate(-0.08);
  ctx.strokeStyle = '#C44536';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-36, -36, 72, 72);
  ctx.fillStyle = '#C44536';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText('有米', 0, -6);
  ctx.font = '11px Georgia, serif';
  ctx.fillText('推荐', 0, 14);
  ctx.restore();

  /* 爪印装饰 */
  drawNotePaw(ctx, 65, 470);
  drawNotePaw(ctx, 335, 470);

  /* 底部签名 */
  ctx.fillStyle = '#8B7355';
  ctx.font = 'italic 11px Georgia, serif';
  ctx.fillText('— 有米的小馆 · 陪你吃好每一顿 —', 200, 492);

  /* 复制到剪贴板 */
  canvas.toBlob(async function(blob) {
    try {
      var item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      SoundManager.success();
      unlockAchievement('share_note');
      showFloatingHint('已复制到剪贴板，去粘贴吧~');
    } catch(e) {
      /* 降级：下载图片 */
      var link = document.createElement('a');
      link.download = '有米推荐_' + getToday() + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      SoundManager.success();
      unlockAchievement('share_note');
      showFloatingHint('已保存图片到下载');
    }
  }, 'image/png');
}

function showFloatingHint(text) {
  var hint = document.createElement('div');
  hint.textContent = text;
  hint.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(44,24,16,0.9);color:#F5A623;padding:12px 24px;border-radius:12px;font-size:14px;z-index:9999;animation:popIn 0.3s;pointer-events:none;';
  document.body.appendChild(hint);
  setTimeout(function() { hint.style.opacity = '0'; hint.style.transition = 'opacity 0.5s'; }, 1500);
  setTimeout(function() { hint.remove(); }, 2200);
}

document.getElementById('receiptSaveBtn').addEventListener('click', function() {
  SoundManager.buttonClick();
  generateShareNote();
});

/* ==================== 第四阶段：反馈 ==================== */
function stage4Init() {
  showStage('stage4');
  createYouniImg('youniStage4', '01-default-stand');
  startYouniIdle('youniStage4');
  var feedbackTitle = document.getElementById('feedbackTitle');
  var feedbackBtns = document.getElementById('feedbackBtns');
  var skipFeedbackBtn = document.getElementById('skipFeedbackBtn');
  var attributionBox = document.getElementById('attributionBox');
  var goToBookBtn = document.getElementById('goToBookBtn');
  var stage4Bubble = document.getElementById('stage4Bubble');
  var youni = document.getElementById('youniStage4');
  feedbackTitle.textContent = '吃完记得回来告诉有米哦~';
  feedbackBtns.style.display = 'none';
  skipFeedbackBtn.style.display = 'none';
  attributionBox.classList.remove('show');
  goToBookBtn.classList.add('hidden');
  removeSadOverlay();
  typeText(stage4Bubble, '大人吃完啦？快告诉有米味道怎么样！');
  var existingReturn = document.getElementById('simulateReturn');
  if (existingReturn) existingReturn.remove();
  var returnBtn = document.createElement('button');
  returnBtn.className = 'return-btn'; returnBtn.id = 'simulateReturn';
  returnBtn.textContent = '模拟吃完回来';
  returnBtn.onclick = function() {
    SoundManager.buttonClick();
    returnBtn.remove();
    feedbackTitle.textContent = '这顿吃得怎么样？';
    feedbackBtns.style.display = 'flex';
    skipFeedbackBtn.style.display = 'inline-block';
    typeText(stage4Bubble, '大人，这顿吃得怎么样？');
  };
  document.getElementById('feedbackArea').insertBefore(returnBtn, feedbackTitle.nextSibling);

  document.querySelectorAll('.feedback-btn').forEach(function(btn) {
    btn.onclick = async function() {
      SoundManager.buttonClick();
      var rating = btn.dataset.rating;
      feedbackBtns.style.display = 'none';
      if (rating === 'good') {
        SoundManager.happy();
        setYouniPose('youniStage4', '02-happy-stars');
        createStars(youni, 6);
        createWarmFlash('stage4');
        await typeText(stage4Bubble, pickDialogue('stage4_good'));
        await wait(500);
        saveHistory('good');
        state.unlocked = Math.max(state.unlocked, 1);
        saveData();
        checkAchievements('feedback');
        goToBookBtn.classList.remove('hidden');
      } else if (rating === 'ok') {
        SoundManager.success();
        await typeText(stage4Bubble, pickDialogue('stage4_ok'));
        await wait(500);
        saveHistory('ok');
        state.unlocked = Math.max(state.unlocked, 1);
        saveData();
        checkAchievements('feedback');
        goToBookBtn.classList.remove('hidden');
      } else {
        SoundManager.error();
        setYouniPose('youniStage4', '06-sad');
        createSadOverlay('stage4');
        await typeText(stage4Bubble, pickDialogue('stage4_bad'));
        await wait(300);
        attributionBox.classList.add('show');
      }
    };
  });

  var selectedReason = '';
  document.querySelectorAll('.att-tag').forEach(function(tag) {
    tag.onclick = function() {
      SoundManager.buttonClick();
      document.querySelectorAll('.att-tag').forEach(function(t) { t.classList.remove('selected'); });
      tag.classList.add('selected');
      selectedReason = tag.dataset.reason;
    };
  });

  document.getElementById('confirmBadBtn').onclick = async function() {
    SoundManager.buttonClick();
    saveHistory('bad', selectedReason);
    state.unlocked = Math.max(state.unlocked, 1);
    saveData();
    attributionBox.classList.remove('show');
    removeSadOverlay();
    var youni2 = document.getElementById('youniStage4');
    setYouniPose('youniStage4', '01-default-stand');
    await typeText(stage4Bubble, pickDialogue('stage4_bad_after'));
    await wait(400);
    goToBookBtn.classList.remove('hidden');
  };

  skipFeedbackBtn.onclick = async function() {
    SoundManager.buttonClick();
    feedbackBtns.style.display = 'none';
    skipFeedbackBtn.style.display = 'none';
    saveHistory('ok');
    state.unlocked = Math.max(state.unlocked, 1);
    saveData();
    await typeText(stage4Bubble, '好的大人~ 下次再告诉有米吧！');
    await wait(500);
    goToBookBtn.classList.remove('hidden');
  };

  goToBookBtn.onclick = function() {
    SoundManager.buttonClick();
    removeSadOverlay();
    var youni3 = document.getElementById('youniStage4');
    setYouniPose('youniStage4', '01-default-stand');
    showStage('stage5');
    initStage5();
  };
}

function saveHistory(rating, reason) {
  state.history.push({
    date: getToday(), weather: state.currentWeather,
    options: state.currentOptions, result: state.currentResult,
    rating: rating, reason: reason || '', weights: state.currentWeights
  });
}

/* ==================== 第五阶段：图鉴 ==================== */
function initStage5() {
  createYouniImg('youniStage5', '01-default-stand');
  startYouniIdle('youniStage5');
  var stage5Bubble = document.getElementById('stage5Bubble');
  var bookPage = document.getElementById('bookPage');
  var bookNav = document.getElementById('bookNav');
  typeText(stage5Bubble, pickDialogue('stage5_intro'));
  if (state.history.length === 0) {
    bookPage.innerHTML = '<div class="collection-empty"><div class="empty-sleep-hamster"><img src="youni/04-sleepy.png" alt="有米在睡觉"></div><div class="empty-sleep-text">还没有记录呢，快去转一次吧~</div><button class="menu-btn" id="emptyGoSpinBtn" style="background:#F5A623;color:#2C1810;border-color:#F5A623;">去转转</button></div>';
    bookNav.style.display = 'none';
    document.getElementById('emptyGoSpinBtn').onclick = function() {
      showStage('stage3');
      initStage3();
    };
  } else {
    bookNav.style.display = 'flex';
    var latestPage = Math.max(0, state.history.length - 1);
    state.currentPage = latestPage;
    renderBookPage(latestPage);
  }
  document.getElementById('prevPage').onclick = function() { if (state.currentPage > 0) { state.currentPage--; renderBookPage(state.currentPage); } };
  document.getElementById('nextPage').onclick = function() { if (state.currentPage < state.history.length - 1) { state.currentPage++; renderBookPage(state.currentPage); } };
}

function renderBookPage(page) {
  var bookPage = document.getElementById('bookPage');
  var prevBtn = document.getElementById('prevPage');
  var nextBtn = document.getElementById('nextPage');
  prevBtn.disabled = page <= 0;
  nextBtn.disabled = page >= state.history.length - 1;
  if (page >= state.history.length) {
    bookPage.innerHTML = '<div class="silhouette"><div class="silhouette-icon">&#10067;</div><div class="silhouette-text">第 ' + (page + 1) + ' 页<br>待解锁...</div></div>';
    return;
  }
  var entry = state.history[page];
  var ratingEmoji = entry.rating === 'good' ? '&#128523; 好吃' : entry.rating === 'ok' ? '&#128528; 一般' : '&#128555; 踩雷';
  var comment = entry.rating === 'good' ? '大人吃得很开心，有米也开心！下次还要推荐好吃的！' :
    entry.rating === 'ok' ? '这次一般般，有米会继续努力的。' :
    '有米记下了' + (entry.reason ? '（' + getReasonText(entry.reason) + '）' : '') + '，下次一定更仔细！';
  bookPage.innerHTML = '<div class="book-page-title">第 ' + (page + 1) + ' 次决策记录</div>' +
    '<div class="book-entry"><label>日期</label>' + entry.date + ' ' + entry.weather + '</div>' +
    '<div class="book-entry"><label>选项</label>' + entry.options.join('、') + '</div>' +
    '<div class="book-entry"><label>结果</label><strong style="color:#F5A623;">' + entry.result + '</strong></div>' +
    '<div class="book-entry"><label>评价</label>' + ratingEmoji + '</div>' +
    '<div class="book-comment">"' + comment + '"</div>';
}

function getReasonText(r) {
  var map = { too_spicy: '太辣', too_bland: '太淡', bad_quality: '食材', too_slow: '等待', not_tasty: '口味', other: '其他' };
  return map[r] || r;
}

document.getElementById('backToWheelBtn').onclick = function() {
  var youni = document.getElementById('youniStage5');
  setYouniPose('youniStage5', '01-default-stand');
  showStage('stage3'); initStage3();
};

function showStatistics() {
  var bookPage = document.getElementById('bookPage');
  var bookNav = document.getElementById('bookNav');
  bookNav.style.display = 'none';

  var history = state.history;
  var goodCount = history.filter(function(h) { return h.rating === 'good'; }).length;
  var okCount = history.filter(function(h) { return h.rating === 'ok'; }).length;
  var badCount = history.filter(function(h) { return h.rating === 'bad'; }).length;
  var totalCount = history.length;

  /* 菜品频次 */
  var dishMap = {};
  history.forEach(function(h) {
    if (h.result) dishMap[h.result] = (dishMap[h.result] || 0) + 1;
  });
  var dishList = Object.keys(dishMap).map(function(k) { return { name: k, count: dishMap[k] }; });
  dishList.sort(function(a, b) { return b.count - a.count; });
  var topDishes = dishList.slice(0, 5);

  /* 好评率 */
  var goodRate = totalCount > 0 ? Math.round(goodCount / totalCount * 100) : 0;

  bookPage.innerHTML =
    '<div class="stats-header">有米的饮食统计</div>' +
    '<div class="stats-summary">' +
      '<div class="stats-item"><div class="stats-num">' + totalCount + '</div><div class="stats-label">总决策</div></div>' +
      '<div class="stats-item"><div class="stats-num">' + dishList.length + '</div><div class="stats-label">尝过菜品</div></div>' +
      '<div class="stats-item"><div class="stats-num">' + goodRate + '%</div><div class="stats-label">好评率</div></div>' +
    '</div>' +
    '<canvas id="statsChart" width="280" height="130" style="display:block;margin:10px auto;"></canvas>' +
    '<div class="stats-dishes-title">最常吃 TOP5</div>' +
    '<div class="stats-dishes-list">' +
      topDishes.map(function(d, i) {
        return '<div class="stats-dish-row"><span class="stats-dish-rank">' + (i+1) + '</span>' +
          '<span class="stats-dish-name">' + d.name + '</span>' +
          '<span class="stats-dish-count">' + d.count + '次</span></div>';
      }).join('') +
    '</div>' +
    '<button class="menu-btn" id="backToBookBtn" style="margin-top:12px;">返回图鉴</button>';

  /* 绘制评价分布柱状图 */
  var canvas = document.getElementById('statsChart');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var bars = [
      { label: '好吃', count: goodCount, color: '#F5A623' },
      { label: '一般', count: okCount, color: '#C4A574' },
      { label: '踩雷', count: badCount, color: '#8B7355' }
    ];
    var maxVal = Math.max.apply(null, bars.map(function(b) { return b.count; }).concat([1]));
    var barWidth = 50;
    var gap = 30;
    var startX = 40;
    var chartHeight = 80;
    var baseY = 105;

    /* 基线 */
    ctx.strokeStyle = '#D4A574';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, baseY); ctx.lineTo(270, baseY);
    ctx.stroke();

    bars.forEach(function(bar, i) {
      var x = startX + i * (barWidth + gap);
      var h = maxVal > 0 ? (bar.count / maxVal) * chartHeight : 0;
      var y = baseY - h;

      /* 柱子 */
      ctx.fillStyle = bar.color;
      ctx.fillRect(x, y, barWidth, h);

      /* 数值 */
      ctx.fillStyle = '#2C1810';
      ctx.font = 'bold 14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(bar.count, x + barWidth / 2, y - 6);

      /* 标签 */
      ctx.fillStyle = '#8B7355';
      ctx.font = '11px Georgia, serif';
      ctx.fillText(bar.label, x + barWidth / 2, baseY + 16);
    });
  }

  document.getElementById('backToBookBtn').onclick = function() {
    SoundManager.buttonClick();
    bookNav.style.display = 'flex';
    renderBookPage(state.currentPage);
  };
}

document.getElementById('statsBtn').onclick = function() {
  SoundManager.buttonClick();
  showStatistics();
};

function showDressUp() {
  var bookPage = document.getElementById('bookPage');
  var bookNav = document.getElementById('bookNav');
  bookNav.style.display = 'none';

  var apronColors = [
    { hue: 0, label: '原色' },
    { hue: 300, label: '粉色' },
    { hue: 200, label: '蓝色' },
    { hue: 120, label: '绿色' },
    { hue: 270, label: '紫色' }
  ];
  var glassesOpts = [
    { val: 'none', label: '不戴' },
    { val: '👓', label: '圆框' },
    { val: '🕶️', label: '墨镜' }
  ];
  var hatOpts = [
    { val: 'none', label: '不戴' },
    { val: '👨‍🍳', label: '厨师帽' },
    { val: '🌺', label: '花环' },
    { val: '🎩', label: '礼帽' }
  ];

  bookPage.innerHTML =
    '<div class="dressup-panel">' +
      '<div class="stats-header">有米换装间</div>' +
      '<div class="dressup-section"><div class="dressup-label">围裙颜色</div><div class="dressup-options" id="apronOpts">' +
        apronColors.map(function(c) {
          return '<button class="dressup-opt' + (state.outfit.apronHue === c.hue ? ' selected' : '') + '" data-hue="' + c.hue + '">' + c.label + '</button>';
        }).join('') +
      '</div></div>' +
      '<div class="dressup-section"><div class="dressup-label">眼镜</div><div class="dressup-options" id="glassesOpts">' +
        glassesOpts.map(function(g) {
          return '<button class="dressup-opt' + (state.outfit.glasses === g.val ? ' selected' : '') + '" data-val="' + g.val + '">' + g.label + '</button>';
        }).join('') +
      '</div></div>' +
      '<div class="dressup-section"><div class="dressup-label">帽子</div><div class="dressup-options" id="hatOpts">' +
        hatOpts.map(function(h) {
          return '<button class="dressup-opt' + (state.outfit.hat === h.val ? ' selected' : '') + '" data-val="' + h.val + '">' + h.label + '</button>';
        }).join('') +
      '</div></div>' +
      '<button class="menu-btn" id="backToBookBtn2" style="margin-top:12px;">返回图鉴</button>' +
    '</div>';

  /* 绑定围裙颜色 */
  document.querySelectorAll('#apronOpts .dressup-opt').forEach(function(btn) {
    btn.onclick = function() {
      state.outfit.apronHue = parseInt(this.dataset.hue);
      saveData();
      SoundManager.buttonClick();
      document.querySelectorAll('#apronOpts .dressup-opt').forEach(function(b) { b.classList.remove('selected'); });
      this.classList.add('selected');
      applyOutfit('youniStage5');
    };
  });
  /* 绑定眼镜 */
  document.querySelectorAll('#glassesOpts .dressup-opt').forEach(function(btn) {
    btn.onclick = function() {
      state.outfit.glasses = this.dataset.val;
      saveData();
      SoundManager.buttonClick();
      document.querySelectorAll('#glassesOpts .dressup-opt').forEach(function(b) { b.classList.remove('selected'); });
      this.classList.add('selected');
      applyOutfit('youniStage5');
    };
  });
  /* 绑定帽子 */
  document.querySelectorAll('#hatOpts .dressup-opt').forEach(function(btn) {
    btn.onclick = function() {
      state.outfit.hat = this.dataset.val;
      saveData();
      SoundManager.buttonClick();
      document.querySelectorAll('#hatOpts .dressup-opt').forEach(function(b) { b.classList.remove('selected'); });
      this.classList.add('selected');
      applyOutfit('youniStage5');
    };
  });
  /* 返回 */
  document.getElementById('backToBookBtn2').onclick = function() {
    SoundManager.buttonClick();
    bookNav.style.display = 'flex';
    renderBookPage(state.currentPage);
  };
}

document.getElementById('dressUpBtn').onclick = function() {
  SoundManager.buttonClick();
  showDressUp();
};

var calCurrentMonth = new Date();

function showCalendar() {
  var bookPage = document.getElementById('bookPage');
  var bookNav = document.getElementById('bookNav');
  bookNav.style.display = 'none';

  var year = calCurrentMonth.getFullYear();
  var month = calCurrentMonth.getMonth();
  var monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  var weekdays = ['日','一','二','三','四','五','六'];

  /* 按日期分组历史记录 */
  var mealsByDate = {};
  state.history.forEach(function(h) {
    if (h.date) {
      if (!mealsByDate[h.date]) mealsByDate[h.date] = [];
      mealsByDate[h.date].push(h);
    }
  });

  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var today = new Date();
  var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  var html = '<div class="cal-header">' +
    '<button class="cal-nav-btn" id="calPrev">‹</button>' +
    '<span class="cal-title">' + year + '年 ' + monthNames[month] + '</span>' +
    '<button class="cal-nav-btn" id="calNext">›</button>' +
    '</div>' +
    '<div class="cal-grid">';
  weekdays.forEach(function(w) { html += '<div class="cal-weekday">' + w + '</div>'; });
  for (var i = 0; i < firstDay; i++) { html += '<div class="cal-day empty"></div>'; }
  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    var hasMeal = mealsByDate[dateStr];
    var classes = 'cal-day';
    if (hasMeal) classes += ' has-meal';
    if (dateStr === todayStr) classes += ' today';
    html += '<div class="' + classes + '" data-date="' + dateStr + '">' + d + '</div>';
  }
  html += '</div>';
  html += '<div class="cal-detail" id="calDetail">点击有标记的日期查看详情</div>';
  html += '<button class="menu-btn" id="backToBookBtn3" style="margin-top:8px;">返回图鉴</button>';

  bookPage.innerHTML = html;

  /* 月份导航 */
  document.getElementById('calPrev').onclick = function() {
    SoundManager.buttonClick();
    calCurrentMonth.setMonth(calCurrentMonth.getMonth() - 1);
    showCalendar();
  };
  document.getElementById('calNext').onclick = function() {
    SoundManager.buttonClick();
    calCurrentMonth.setMonth(calCurrentMonth.getMonth() + 1);
    showCalendar();
  };

  /* 点击日期 */
  document.querySelectorAll('.cal-day.has-meal').forEach(function(el) {
    el.onclick = function() {
      var date = this.dataset.date;
      var meals = mealsByDate[date];
      var detail = document.getElementById('calDetail');
      if (detail && meals) {
        detail.innerHTML = '<b>' + date + '</b><br>' + meals.map(function(m) {
          return m.result + ' (' + (m.rating === 'good' ? '好吃' : m.rating === 'ok' ? '一般' : '踩雷') + ')';
        }).join('、');
      }
    };
  });

  document.getElementById('backToBookBtn3').onclick = function() {
    SoundManager.buttonClick();
    bookNav.style.display = 'flex';
    renderBookPage(state.currentPage);
  };
}

document.getElementById('calendarBtn').onclick = function() {
  SoundManager.buttonClick();
  showCalendar();
};

function resetStage1() {
  stage1Clicked = false;
  eggContainer.style.display = 'block';
  eggContainer.classList.remove('egg-cracked', 'egg-hatched');
  egg.style.animation = '';
  hatchedYouni.classList.remove('show', 'shrink');
  hatchedYouni.innerHTML = '';
  stage1Bubble.classList.add('hidden');
  startFirstBtn.classList.add('hidden');
  lightBurst.innerHTML = '';
  goldenParticles.innerHTML = '';
  goldenGlow.classList.remove('active');
  goldenGlow.style.animation = '';
  stage1.classList.remove('hatched-bg');
  stage1.style.background = '';
  /* 恢复开场元素 */
  document.getElementById('eggHint').classList.remove('hidden');
  document.getElementById('eggWarmth').classList.remove('hidden');
  document.getElementById('openingOverlay').classList.remove('fade-out');
}

document.getElementById('resetBtn').onclick = function() {
  if (confirm('要清空所有记录重新开始吗？')) {
    localStorage.removeItem(STORAGE_KEY);
    state.preferences = { spicy: null, soup: null, taboo: '' };
    state.history = []; state.unlocked = 0; state.achievements = []; state.outfit = { apronHue: 0, glasses: 'none', hat: 'none' };
    state.currentResult = null; state.currentOptions = []; state.currentWeights = [];
    transitioning = false;
    /* 清除浏览器历史栈，防止回退到已清空的阶段 */
    isPopstateNav = true;
    history.pushState({ stageId: 'stage1' }, '', '#stage1');
    isPopstateNav = false;
    resetStage1();
    document.querySelectorAll('.stage').forEach(function(s) {
      s.classList.remove('active', 'slide-out', 'slide-in');
      s.style.display = 'none';
    });
    stage1.style.display = 'flex';
    stage1.classList.add('active');
  }
};

/* ==================== 初始化 ==================== */
function preloadYouniPoses() {
  /* 只预加载开场必需的图，其余按需加载 */
  var essential = ['19-hatch-cowering', '20-hatch-standing-shake', '21-hatch-confident-ready', '01-default-stand'];
  essential.forEach(function(pose) {
    var img = new Image();
    img.src = 'youni/' + pose + '.png';
  });
}
preloadYouniPoses();

/* 按需预加载后续阶段图片 */
function preloadStageImages(stageId) {
  var stagePoses = {
    'stage2': ['01-default-stand', '11-idle-blink', '12-notice-curious'],
    'stage3': ['14-expecting-anticipation', '24-wheel-tense', '15-recommend-proud'],
    'stage4': ['02-happy-stars', '06-sad', '09-tea-time'],
    'stage5': ['17-reading-menu', '18-thumbs-up-approve', '13-listening-nod']
  };
  var poses = stagePoses[stageId] || [];
  poses.forEach(function(pose) {
    var img = new Image();
    img.src = 'youni/' + pose + '.png';
  });
}
loadData();
fetchWeather();

/* ==================== 浏览器回退支持 ==================== */
/* 初始阶段：有偏好则 stage3，否则 stage1 */
var initialStage = (state.preferences.spicy !== null) ? 'stage3' : 'stage1';
history.replaceState({ stageId: initialStage }, '', '#' + initialStage);

/* popstate：浏览器回退/前进时切回对应阶段，保留所有数据 */
window.addEventListener('popstate', function(e) {
  var stageId = (e.state && e.state.stageId) ? e.state.stageId : initialStage;
  var stepId = (e.state && e.state.step) ? e.state.step : null;
  /* 重置过渡锁，确保回退能立即执行 */
  transitioning = false;

  /* 子步骤回退：同一 stage2 内的问题间回退 */
  if (stageId === 'stage2' && stepId) {
    isPopstateNav = true;
    showStage('stage2');
    isPopstateNav = false;
    restoreQuestionStep(stepId);
    return;
  }

  /* 跨阶段回退 */
  isPopstateNav = true;
  showStage(stageId);
  isPopstateNav = false;

  /* 回退到 stage3 时重新初始化转盘，但保留选项数据 */
  if (stageId === 'stage3' && state.currentOptions.length > 0) {
    /* 恢复转盘显示 */
    var wheelArea = document.getElementById('wheelArea');
    if (wheelArea) wheelArea.style.display = 'block';
    drawWheel();
  }
  /* 回退到 stage5 时刷新图鉴 */
  if (stageId === 'stage5') {
    initStage5();
  }
  /* 回退到 stage2 但没有 step 信息时，重新开始问答 */
  if (stageId === 'stage2' && !stepId) {
    initStage2();
  }
});

if (state.preferences.spicy !== null) {
  document.querySelectorAll('.stage').forEach(function(s) {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  var stage3El = document.getElementById('stage3');
  stage3El.style.display = 'flex';
  stage3El.classList.add('active');
  initStage3();
}

var soundToggle = document.getElementById('soundToggle');
var soundPanel = document.getElementById('soundPanel');
var bgmOnBtn = document.getElementById('bgmOnBtn');
var bgmOffBtn = document.getElementById('bgmOffBtn');
var sfxOnBtn = document.getElementById('sfxOnBtn');
var sfxOffBtn = document.getElementById('sfxOffBtn');
var bgmSlider = document.getElementById('bgmSlider');
var sfxSlider = document.getElementById('sfxSlider');

function updateSoundPanelState() {
  if (SoundManager.getBgmEnabled()) {
    bgmOnBtn.classList.add('active');
    bgmOffBtn.classList.remove('active');
  } else {
    bgmOnBtn.classList.remove('active');
    bgmOffBtn.classList.add('active');
  }
  if (SoundManager.getSfxEnabled()) {
    sfxOnBtn.classList.add('active');
    sfxOffBtn.classList.remove('active');
  } else {
    sfxOnBtn.classList.remove('active');
    sfxOffBtn.classList.add('active');
  }
  bgmSlider.value = Math.round(SoundManager.getBgmVolume() * 100);
  sfxSlider.value = Math.round(SoundManager.getSfxVolume() * 100);
}

function updateSoundToggleIcon() {
  var sfxOn = SoundManager.getSfxEnabled();
  var bgmOn = SoundManager.getBgmEnabled();
  if (sfxOn && bgmOn) {
    soundToggle.textContent = '🔊';
    soundToggle.classList.remove('muted');
  } else if (!sfxOn && !bgmOn) {
    soundToggle.textContent = '🔇';
    soundToggle.classList.add('muted');
  } else {
    soundToggle.textContent = '🔉';
    soundToggle.classList.remove('muted');
  }
}

if (soundToggle && soundPanel) {
  updateSoundPanelState();
  updateSoundToggleIcon();

  soundToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    soundPanel.classList.toggle('show');
  });

  document.addEventListener('click', function(e) {
    SoundManager.init();
    if (!soundPanel.contains(e.target) && e.target !== soundToggle) {
      soundPanel.classList.remove('show');
    }
  });

  bgmOnBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    SoundManager.setBgmEnabled(true);
    updateSoundPanelState();
    updateSoundToggleIcon();
  });
  bgmOffBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    SoundManager.setBgmEnabled(false);
    updateSoundPanelState();
    updateSoundToggleIcon();
  });
  sfxOnBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    SoundManager.setSfxEnabled(true);
    updateSoundPanelState();
    updateSoundToggleIcon();
    SoundManager.buttonClick();
  });
  sfxOffBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    SoundManager.setSfxEnabled(false);
    updateSoundPanelState();
    updateSoundToggleIcon();
  });

  bgmSlider.addEventListener('input', function(e) {
    e.stopPropagation();
    SoundManager.setBgmVolume(parseInt(bgmSlider.value) / 100);
  });
  sfxSlider.addEventListener('input', function(e) {
    e.stopPropagation();
    SoundManager.setSfxVolume(parseInt(sfxSlider.value) / 100);
  });
}
