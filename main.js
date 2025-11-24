// ===== 基本設定 =====

// C4〜C6 までの白鍵だけをサポート（まずは最小セット）
const PITCHES = [
  { label: "C4", step: "C", alter: 0, octave: 4 },
  { label: "D4", step: "D", alter: 0, octave: 4 },
  { label: "E4", step: "E", alter: 0, octave: 4 },
  { label: "F4", step: "F", alter: 0, octave: 4 },
  { label: "G4", step: "G", alter: 0, octave: 4 },
  { label: "A4", step: "A", alter: 0, octave: 4 },
  { label: "B4", step: "B", alter: 0, octave: 4 },
  { label: "C5", step: "C", alter: 0, octave: 5 },
  { label: "D5", step: "D", alter: 0, octave: 5 },
  { label: "E5", step: "E", alter: 0, octave: 5 },
  { label: "F5", step: "F", alter: 0, octave: 5 },
  { label: "G5", step: "G", alter: 0, octave: 5 },
  { label: "A5", step: "A", alter: 0, octave: 5 },
  { label: "B5", step: "B", alter: 0, octave: 5 },
  { label: "C6", step: "C", alter: 0, octave: 6 },
];

// MusicXML の <divisions> （4なら 4分音符 = 4, 2分 = 8, 全音符 = 16）
const DIVISIONS = 4;

// 数字キー → 音価
const DURATION_MAP = {
  "1": { name: "whole", display: "whole (全音符)", divisions: 16 },
  "2": { name: "half", display: "half (2分音符)", divisions: 8 },
  "3": { name: "quarter", display: "quarter (4分音符)", divisions: 4 },
  "4": { name: "eighth", display: "eighth (8分音符)", divisions: 2 },
  "5": { name: "16th", display: "16th (16分音符)", divisions: 1 },
};

// ===== 状態 =====

let currentPitchIndex = 0;    // PITCHES の添字
let currentDurationKey = "3"; // デフォルト：4分音符

/**
 * ノート配列（入力された順）
 * 要素例:
 * {
 *   isRest: false,
 *   step: "C",
 *   alter: 0,
 *   octave: 4,
 *   durationName: "quarter",
 *   durationDivs: 4
 * }
 */
let notes = [];

// ===== DOM 取得 =====

const currentPitchEl = document.getElementById("currentPitch");
const currentDurationEl = document.getElementById("currentDuration");
const noteCountEl = document.getElementById("noteCount");
const noteListEl = document.getElementById("noteList");
const downloadXmlBtn = document.getElementById("downloadXmlBtn");
const clearBtn = document.getElementById("clearBtn");

// ===== 表示更新 =====

function updateStatus() {
  const pitch = PITCHES[currentPitchIndex];
  currentPitchEl.textContent = pitch.label;

  const durInfo = DURATION_MAP[currentDurationKey];
  currentDurationEl.textContent = `${durInfo.name} (${durInfo.display.split(" ")[1] || ""})`;

  noteCountEl.textContent = notes.length.toString();
}

function renderNoteList() {
  noteListEl.innerHTML = "";

  notes.forEach((note, index) => {
    const li = document.createElement("li");
    if (note.isRest) {
      li.textContent = `Rest`;
    } else {
      li.textContent = `${note.step}${note.octave}`;
    }
    const tag = document.createElement("span");
    tag.className = "note-tag";
    tag.textContent = note.durationName;
    li.appendChild(tag);

    // 軽く「何番目か」の情報も出しておく
    li.title = `index: ${index}`;

    noteListEl.appendChild(li);
  });

  noteCountEl.textContent = notes.length.toString();
}

// ===== ノート追加・削除 =====

function addNote(isRest) {
  const durInfo = DURATION_MAP[currentDurationKey];
  if (!durInfo) return;

  const base = PITCHES[currentPitchIndex];

  const note = {
    isRest: isRest,
    step: isRest ? null : base.step,
    alter: isRest ? 0 : base.alter,
    octave: isRest ? null : base.octave,
    durationName: durInfo.name,
    durationDivs: durInfo.divisions,
  };

  notes.push(note);
  renderNoteList();
}

function deleteLastNote() {
  if (notes.length === 0) return;
  notes.pop();
  renderNoteList();
}

// ===== MusicXML 生成 =====

function generateMusicXML() {
  // ヘッダ
  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
  "-//Recordare//DTD MusicXML 3.1 Partwise//EN"
  "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Keyboard Notation Export</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>${DIVISIONS}</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
`;

  // ノート列
  notes.forEach((note) => {
    if (note.isRest) {
      xml += `      <note>
        <rest/>
        <duration>${note.durationDivs}</duration>
        <type>${note.durationName}</type>
      </note>
`;
    } else {
      xml += `      <note>
        <pitch>
          <step>${note.step}</step>
`;
      if (note.alter && note.alter !== 0) {
        xml += `          <alter>${note.alter}</alter>
`;
      }
      xml += `          <octave>${note.octave}</octave>
        </pitch>
        <duration>${note.durationDivs}</duration>
        <type>${note.durationName}</type>
      </note>
`;
    }
  });

  // フッタ
  xml += `    </measure>
  </part>
</score-partwise>
`;

  return xml;
}

// ===== ダウンロード処理 =====

function downloadMusicXML() {
  if (notes.length === 0) {
    alert("ノートが 1 つもありません。N / R でノートを追加してから書き出してください。");
    return;
  }

  const xml = generateMusicXML();
  const blob = new Blob([xml], {
    type: "application/vnd.recordare.musicxml+xml",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "score.musicxml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== キーボード入力 =====

function handleKeyDown(event) {
  // 何かテキスト入力中の場合は邪魔しない
  const tag = event.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  const key = event.key;

  switch (key) {
    case "ArrowUp":
      event.preventDefault();
      if (currentPitchIndex < PITCHES.length - 1) {
        currentPitchIndex++;
        updateStatus();
      }
      break;
    case "ArrowDown":
      event.preventDefault();
      if (currentPitchIndex > 0) {
        currentPitchIndex--;
        updateStatus();
      }
      break;

    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
      currentDurationKey = key;
      updateStatus();
      break;

    case "n":
    case "N":
      addNote(false);
      break;

    case "r":
    case "R":
      addNote(true);
      break;

    case "d":
    case "D":
      deleteLastNote();
      break;

    default:
      // それ以外のキーは今は無視
      break;
  }
}

// ===== クリア =====

function clearAll() {
  if (notes.length === 0) return;
  if (!confirm("すべてのノートを削除しますか？")) return;
  notes = [];
  renderNoteList();
}

// ===== 初期化 =====

function init() {
  updateStatus();
  renderNoteList();
  document.addEventListener("keydown", handleKeyDown);
  downloadXmlBtn.addEventListener("click", downloadMusicXML);
  clearBtn.addEventListener("click", clearAll);
}

init();
