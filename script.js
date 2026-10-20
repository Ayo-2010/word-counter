var inputEl = document.getElementById('input');
var wordsEl = document.getElementById('words');
var charsEl = document.getElementById('chars');
var charsNoSpacesEl = document.getElementById('charsNoSpaces');
var sentencesEl = document.getElementById('sentences');
var paragraphsEl = document.getElementById('paragraphs');
var uniqueEl = document.getElementById('unique');
var longestEl = document.getElementById('longest');
var avgLengthEl = document.getElementById('avgLength');
var readingEl = document.getElementById('reading');
var frequencyEl = document.getElementById('frequency');
var clearBtn = document.getElementById('clearBtn');
var copyBtn = document.getElementById('copyBtn');
var sampleBtn = document.getElementById('sampleBtn');
var limitEl = document.getElementById('limit');
var meterEl = document.getElementById('meter');
var limitNoteEl = document.getElementById('limitNote');
var flashEl = document.getElementById('flash');

var STOP_WORDS = ['the', 'and', 'of', 'to', 'a', 'in', 'is', 'it', 'that', 'for', 'on', 'with', 'as', 'was', 'are', 'be', 'been', 'this', 'but', 'at', 'by', 'from', 'or', 'an', 'were', 'has', 'have', 'had', 'not', 'you', 'your', 'i', 'we', 'they', 'he', 'she', 'his', 'her', 'its', 'our', 'their', 'them', 'then', 'than', 'too', 'very', 'can', 'will', 'would', 'just', 'into', 'out', 'up', 'down', 'about', 'over', 'after', 'also', 'do', 'does', 'did', 'no', 'yes', 'there', 'here', 'when', 'what', 'which', 'who', 'how', 'all', 'any', 'each', 'more', 'most', 'some', 'such', 'only', 'own', 'same', 'so', 'if', 'my', 'me', 'him', 'us', 'am', 's', 't'];

var SAMPLE_TEXT = 'The morning train pulled out of the station exactly as the clock struck seven, and the passengers settled into their seats with the quiet patience of people who had made this journey a thousand times before. Outside the window the city gave way to hedgerows and low stone walls, then to open fields where sheep stood still beneath a pale sky. Someone near the front of the carriage was reading a newspaper; someone else was asleep. A woman in a green coat opened a notebook and began to write, pausing now and then to watch the light change across the hills. It was, she decided, the sort of morning that makes a person believe the day will be generous. The train slowed, gathered speed again, and carried its cargo of strangers onward toward the coast.';

var flashTimer = null;

function tokenize(text) {
  var found = text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'\u2019-]*/gu);
  return found ? found : [];
}

function countSentences(text) {
  var parts = text.split(/[.!?\u2026]+/);
  var total = 0;
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].trim().length > 0) {
      total++;
    }
  }
  return total;
}

function countParagraphs(text) {
  var parts = text.split(/\n\s*\n+/);
  var total = 0;
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].trim().length > 0) {
      total++;
    }
  }
  return total;
}

function readingTime(wordCount) {
  if (wordCount <= 0) {
    return '0:00';
  }
  var seconds = Math.round((wordCount / 200) * 60);
  var minutes = Math.floor(seconds / 60);
  var rest = seconds % 60;
  return minutes + ':' + (rest < 10 ? '0' + rest : String(rest));
}

function getLimit() {
  var value = parseInt(limitEl.value, 10);
  if (isNaN(value) || value < 0) {
    return 0;
  }
  return value;
}

function updateMeter(charCount) {
  var limit = getLimit();
  var percent = limit > 0 ? Math.min(100, (charCount / limit) * 100) : 0;
  var over = limit > 0 && charCount > limit;
  meterEl.style.width = percent + '%';
  if (over) {
    meterEl.classList.add('over');
    limitNoteEl.classList.add('over');
  } else {
    meterEl.classList.remove('over');
    limitNoteEl.classList.remove('over');
  }
  limitNoteEl.textContent = charCount + ' / ' + (limit > 0 ? limit : '\u221e');
}

function renderFrequency(tokens) {
  var counts = {};
  for (var i = 0; i < tokens.length; i++) {
    var word = tokens[i];
    if (STOP_WORDS.indexOf(word) !== -1 || word.length < 2) {
      continue;
    }
    counts[word] = (counts[word] || 0) + 1;
  }
  var entries = Object.keys(counts).map(function (key) {
    return { word: key, count: counts[key] };
  });
  entries.sort(function (a, b) {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.word < b.word ? -1 : 1;
  });
  var top = entries.slice(0, 5);
  frequencyEl.textContent = '';
  if (top.length === 0) {
    var empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No words to rank yet.';
    frequencyEl.appendChild(empty);
    return;
  }
  var best = top[0].count;
  top.forEach(function (item) {
    var row = document.createElement('div');
    row.className = 'freq-row';

    var word = document.createElement('span');
    word.className = 'freq-word';
    word.textContent = item.word;
    word.title = item.word;

    var track = document.createElement('div');
    track.className = 'freq-track';
    var bar = document.createElement('div');
    bar.className = 'freq-bar';
    bar.style.width = Math.max(6, Math.round((item.count / best) * 100)) + '%';
    track.appendChild(bar);

    var count = document.createElement('span');
    count.className = 'freq-count';
    count.textContent = String(item.count);

    row.appendChild(word);
    row.appendChild(track);
    row.appendChild(count);
    frequencyEl.appendChild(row);
  });
}

function update() {
  var text = inputEl.value;
  var tokens = tokenize(text);
  var wordCount = tokens.length;
  var charCount = text.length;
  var noSpaces = text.replace(/\s/g, '').length;
  var uniqueSet = {};
  var longest = '';
  var lengthSum = 0;
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    uniqueSet[token] = true;
    lengthSum += token.length;
    if (token.length > longest.length) {
      longest = token;
    }
  }

  wordsEl.textContent = String(wordCount);
  charsEl.textContent = String(charCount);
  charsNoSpacesEl.textContent = String(noSpaces);
  sentencesEl.textContent = String(countSentences(text));
  paragraphsEl.textContent = String(countParagraphs(text));
  uniqueEl.textContent = String(Object.keys(uniqueSet).length);
  longestEl.textContent = longest === '' ? '\u2014' : longest;
  avgLengthEl.textContent = wordCount === 0 ? '0' : (lengthSum / wordCount).toFixed(1);
  readingEl.textContent = readingTime(wordCount);

  updateMeter(charCount);
  renderFrequency(tokens);

  try {
    window.localStorage.setItem('wc.text', text);
    window.localStorage.setItem('wc.limit', String(getLimit()));
  } catch (err) {
    flash('Local storage is unavailable.');
    return;
  }
}

function flash(message) {
  flashEl.textContent = message;
  if (flashTimer) {
    window.clearTimeout(flashTimer);
  }
  flashTimer = window.setTimeout(function () {
    flashEl.textContent = '';
  }, 2200);
}

function copyText() {
  var text = inputEl.value;
  if (text.length === 0) {
    flash('Nothing to copy.');
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      flash('Copied to clipboard.');
    }).catch(function () {
      legacyCopy(text);
    });
  } else {
    legacyCopy(text);
  }
}

function legacyCopy(text) {
  try {
    var helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', 'readonly');
    helper.style.position = 'fixed';
    helper.style.top = '-1000px';
    document.body.appendChild(helper);
    helper.select();
    var ok = document.execCommand('copy');
    document.body.removeChild(helper);
    flash(ok ? 'Copied to clipboard.' : 'Copy failed.');
  } catch (err) {
    flash('Copy failed.');
  }
}

inputEl.addEventListener('input', update);

limitEl.addEventListener('input', function () {
  updateMeter(inputEl.value.length);
  try {
    window.localStorage.setItem('wc.limit', String(getLimit()));
  } catch (err) {
    return;
  }
});

clearBtn.addEventListener('click', function () {
  inputEl.value = '';
  inputEl.focus();
  update();
  flash('Cleared.');
});

copyBtn.addEventListener('click', copyText);

sampleBtn.addEventListener('click', function () {
  inputEl.value = SAMPLE_TEXT;
  inputEl.focus();
  update();
});

document.addEventListener('keydown', function (event) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    copyText();
  }
});

(function init() {
  try {
    var savedText = window.localStorage.getItem('wc.text');
    var savedLimit = window.localStorage.getItem('wc.limit');
    if (savedText !== null) {
      inputEl.value = savedText;
    }
    if (savedLimit !== null && savedLimit !== '') {
      limitEl.value = savedLimit;
    }
  } catch (err) {
    inputEl.value = '';
  }
  update();
})();
