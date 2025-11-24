// グローバル状態
let osmd = null;
let allGraphicalNotes = [];   // GraphicalNote の配列
let noteToIndex = new Map();  // Note オブジェクト → インデックス
let selectedIndex = -1;

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("osmd-container");
  const fileInput = document.getElementById("musicxmlInput");
  const info = document.getElementById("noteCountInfo");

  osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container, {
    autoResize: true,
    backend: "svg",
    drawTitle: false,
  });

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    await osmd.load(text);
    await osmd.render();

    buildNoteIndexMap();
    info.textContent = `音符数: ${allGraphicalNotes.length}`;
    if (allGraphicalNotes.length > 0) {
      selectedIndex = 0;
      highlightSelectedNote();
    }
  });

  // 楽譜クリックで最寄りの音符を選択
  const scrollView = document.getElementById("scoreScroll");
  scrollView.addEventListener("click", handleScoreClick);

  // 矢印キーで前後の音符に移動
  document.addEventListener("keydown", (e) => {
    if (!osmd || allGraphicalNotes.length === 0) return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (selectedIndex < allGraphicalNotes.length - 1) {
        selectedIndex++;
        highlightSelectedNote();
        scrollNoteIntoView();
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (selectedIndex > 0) {
        selectedIndex--;
        highlightSelectedNote();
        scrollNoteIntoView();
      }
    }
  });
});

/**
 * OSMD のカーソルを使って、譜面上のすべての GraphicalNote を列挙し、
 * Note → index のマップを作る
 */
function buildNoteIndexMap() {
  allGraphicalNotes = [];
  noteToIndex = new Map();
  selectedIndex = -1;

  const cursor = osmd.cursor;
  cursor.show();
  cursor.resetIterator();

  let idx = 0;
  while (!cursor.Iterator.EndReached) {
    const gNotesHere = cursor.GNotesUnderCursor(); // GraphicalNote[]
    for (const gNote of gNotesHere) {
      allGraphicalNotes.push(gNote);
      const note = gNote.sourceNote;
      if (note && !noteToIndex.has(note)) {
        noteToIndex.set(note, idx);
      }
      idx++;
    }
    cursor.next();
  }

  cursor.hide();
}

/**
 * クリック位置から最寄りの GraphicalNote を取得し、selectedIndex を更新
 */
function handleScoreClick(event) {
  if (!osmd || !osmd.GraphicSheet) return;
  if (allGraphicalNotes.length === 0) return;

  const scrollView = document.getElementById("scoreScroll");
  const rect = scrollView.getBoundingClientRect();

  // DOM座標（スクロールビュー左上基準）
  const domX = event.clientX;
  const domY = event.clientY;

  const PointF2D = opensheetmusicdisplay.PointF2D;

  // DOM → SVG → OSMD 座標に変換
  const domPoint = new PointF2D(domX, domY);
  const svgPoint = osmd.GraphicSheet.domToSvg(domPoint);
  const osmdPoint = osmd.GraphicSheet.svgToOsmd(svgPoint);

  // クリック有効範囲（単位は OSMD 座標系）
  const maxDist = new PointF2D(2.0, 5.0);

  const gNote = osmd.GraphicSheet.GetNearestNote(osmdPoint, maxDist);
  if (!gNote) return;

  const note = gNote.sourceNote;
  const idx = noteToIndex.get(note);
  if (idx == null) return;

  selectedIndex = idx;
  highlightSelectedNote();
  scrollNoteIntoView();
}

/**
 * 選択されている音符だけ赤くする
 */
function highlightSelectedNote() {
  if (!osmd || allGraphicalNotes.length === 0) return;
  if (selectedIndex < 0 || selectedIndex >= allGraphicalNotes.length) return;

  // いったん全部黒に戻す
  for (const gNote of allGraphicalNotes) {
    gNote.setColor("#000000"); // Notehead, stem 等まとめて
  }

  // 選択中だけ赤
  const sel = allGraphicalNotes[selectedIndex];
  if (sel) {
    sel.setColor("#ff0000");
  }

  // 色変更は再レンダリング不要
}

/**
 * 選択中の音符が見切れていたら、スクロールして見える位置まで持ってくる
 */
function scrollNoteIntoView() {
  const scrollView = document.getElementById("scoreScroll");
  const sel = allGraphicalNotes[selectedIndex];
  if (!sel) return;

  const pos = sel.PositionAndShape.absolutePosition; // OSMD座標
  const PointF2D = opensheetmusicdisplay.PointF2D;

  // OSMD座標 → SVG → DOM と変換して、Y位置だけ使ってスクロール調整しても良いが、
  // ここでは簡易的に SVG の boundingBox を参照するやり方でもOK。
  // （必要ならここを後で詰めましょう）
}
