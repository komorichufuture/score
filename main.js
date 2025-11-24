// 内部的な音符データ構造を格納する配列
let composition = [];

// MusicXMLの音価と音符長の対応マップ
const durationMap = {
    '7': 16, // 全音符
    '6': 8,  // 2分音符
    '5': 4,  // 4分音符 (最も使用頻度が高い)
    '4': 2,  // 8分音符
    '3': 1,  // 16分音符
};

// 変化記号のMusicXML表記
const alterationMap = {
    '+': 1, // シャープ
    '-': -1, // フラット
    '#': 1, // シャープ
};

/**
 * テキストエリアの入力を処理し、内部データに追加する関数
 * このデモでは、入力された文字列をスペース区切りで解釈します。
 */
function processInput() {
    const input = document.getElementById('inputArea').value.trim();
    // 入力例: "5c4 5d4+ 6e4"
    const notes = input.split(/\s+/);

    composition = []; // データをリセット

    notes.forEach(noteString => {
        if (!noteString) return;

        // 正規表現で、[音長][音高][オクターブ][変化記号] を抽出
        // 例: 5c4+ => 5(length), c(pitch), 4(octave), +(accidental)
        const match = noteString.match(/^(\d)([a-g])(\d)([\+\-\#]?)$/i);

        if (match) {
            const [_, length, pitch, octave, accidental] = match;

            const noteData = {
                length: length, // 提案キー: 5 (4分音符)
                pitch: pitch.toUpperCase(),
                octave: parseInt(octave),
                accidental: accidental || null // +, - など
            };
            composition.push(noteData);
        } else {
            console.warn(`無効な入力フォーマット: ${noteString}`);
        }
    });

    displayInternalData();
}

/**
 * 内部データ構造をHTMLに表示する関数
 */
function displayInternalData() {
    document.getElementById('internalData').textContent = JSON.stringify(composition, null, 2);
}

/**
 * 内部データからMusicXMLの断片を生成し、表示する関数
 */
function generateMusicXML() {
    let partContent = '';

    composition.forEach(note => {
        // MusicXMLの<duration>は、通常4分音符を4とした場合の相対値
        const durationValue = durationMap[note.length] || 4; 
        const accidentalElement = note.accidental 
            ? `<accidental>${note.accidental === '+' || note.accidental === '#' ? 'sharp' : 'flat'}</accidental>` 
            : '';
        
        // 1つの音符のMusicXML構造を生成
        const noteXml = `
    <note>
        <pitch>
            <step>${note.pitch}</step>
            ${note.accidental ? `<alter>${alterationMap[note.accidental]}</alter>` : ''}
            <octave>${note.octave}</octave>
        </pitch>
        <duration>${durationValue}</duration>
        <type>${note.length === '6' ? 'half' : note.length === '5' ? 'quarter' : 'eighth'}</type>
        ${accidentalElement}
    </note>`;
        
        partContent += noteXml;
    });

    // 最小限のMusicXML全体構造
    const musicXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
    <part-list>
        <score-part id="P1">
            <part-name>Piano</part-name>
        </score-part>
    </part-list>
    <part id="P1">
        <measure number="1">
            ${partContent}
        </measure>
    </part>
</score-partwise>`;

    document.getElementById('output').textContent = musicXml;
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // リアルタイム処理ではなく、ボタンクリックで処理するデモのため、キーボードイベントは未使用
});
