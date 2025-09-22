const $ = (id) => document.getElementById(id);
const env = $("env"), statusEl = $("status"), out = $("out"), inp = $("inp");
let engine = null, loaded = false;
let history = [];

// 環境チェック（HTTPS & WebGPU）
(function(){
  let msgs = [];
  if (!window.isSecureContext) msgs.push("このページはHTTPSで開いてください（GitHub PagesならOK）。");
  if (!navigator.gpu) msgs.push("このブラウザ/端末では WebGPU が使えません。Chrome/Edge/新しいSafari/Firefoxの最新版でお試しください。");
  if (msgs.length) { env.style.display="block"; env.innerHTML = msgs.join("<br>"); }
})();

function setStatus(msg, cls=""){ statusEl.className = "small " + cls; statusEl.textContent = msg; }

// モデル読み込み
$("loadBtn").addEventListener("click", async () => {
  try {
    setStatus("モデル読み込み開始…", "warn");
    engine = await webllm.CreateMLCEngine({
      model: $("model").value,
      temperature: 0.8,
      top_p: 0.9
    });
    history = [{
      role: "system",
      content: [
        "あなたはTRPGのゲームマスターです。回答は日本語。",
        "本文は200～300字程度。最後に候補行動を3つ（各行頭に「- 」）。",
        "過激表現やR-18は不可。"
      ].join("\n")
    }];
    loaded = true;
    setStatus("準備完了", "ok");
    out.textContent = "モデル読み込み完了。入力→『実行』で物語が進みます。";
  } catch (e) {
    console.error(e);
    setStatus("読み込み失敗（詳細はConsole）", "err");
    out.textContent = "読み込みに失敗しました。対応ブラウザ/HTTPS/回線や拡張機能の影響を確認してください。";
  }
});

// 実行
$("runBtn").addEventListener("click", async () => {
  if (!loaded || !engine) { out.textContent = "モデルがまだ読み込まれていません。『モデルを読み込む』を押してください。"; return; }
  const userText = inp.value.trim();
  if (!userText) { out.textContent = "入力してください。"; return; }

  history.push({ role: "user", content: userText });
  setStatus("応答生成中…", "warn");
  try {
    const res = await engine.chat.completions.create({
      messages: history,
      temperature: 0.8,
      top_p: 0.9,
      max_tokens: 280
    });
    const text = res?.choices?.[0]?.message?.content ?? "(no output)";
    history.push({ role: "assistant", content: text });
    out.textContent = text;
  } catch (e) {
    console.error(e);
    out.textContent = "生成に失敗しました。タブを減らす/モデルを小さくする/再読み込みを試してください。";
  } finally {
    setStatus("", "");
  }
});
