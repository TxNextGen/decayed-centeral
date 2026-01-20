import * as BareMux from "https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux/dist/index.mjs";

const frame = document.getElementById("frame");
const input = document.getElementById("url");
const back = document.getElementById("back");
const next = document.getElementById("next");
const redo = document.getElementById("redo");
const openBtn = document.getElementById("open");

const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
  files: {
    wasm: "https://cdn.jsdelivr.net/gh/soap-phia/tinyjet@latest/tinyjet/wasm.wasm",
    all: "https://cdn.jsdelivr.net/gh/soap-phia/tinyjet@latest/tinyjet/scramjet.all.js",
    sync: "https://cdn.jsdelivr.net/gh/soap-phia/tinyjet@latest/tinyjet/scramjet.sync.js"
  }
});

await scramjet.init();
navigator.serviceWorker.register("/sw.js");
const connection = new BareMux.BareMuxConnection("/bareworker.js");
await connection.setTransport("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport/dist/index.mjs", [{ wisp: "wss://gointospace.app/wisp/" }]);

function normalize(val) {
  try { return new URL(val).toString(); } catch { }
  try { let url = new URL("https://" + val); if (url.hostname.includes(".")) return url.toString(); } catch { }
  return `https://search.brave.com/search?q=${encodeURIComponent(val)}`;
}

function navigate(url) {
  const fixed = normalize(url);
  frame.src = scramjet.encodeUrl(fixed);
  input.value = fixed;
}

input.addEventListener("keydown", e => {
  if (e.key === "Enter") navigate(input.value);
});

redo.onclick = () => { frame.src = frame.src; };
openBtn.onclick = () => {
  // Attempt to decode current URL to open in new tab
  try {
    const raw = frame.src.split('/').pop();
    window.open(scramjet.decodeUrl(raw), "_blank");
  } catch(e) {
    window.open(input.value, "_blank");
  }
};

back.onclick = () => frame.contentWindow.history.back();
next.onclick = () => frame.contentWindow.history.forward();

// Initial load
navigate("https://google.com");