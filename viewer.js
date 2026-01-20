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

try {
  await scramjet.init();
  await navigator.serviceWorker.register("/tinyjet/sw.js");
} catch (e) {
  console.error("Scramjet failed to initialize:", e);
}

const connection = new BareMux.BareMuxConnection("/bareworker.js");

async function setTransport() {
  const wisp = "wss://gointospace.app/wisp/";
  await connection.setTransport(
    "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport/dist/index.mjs",
    [{ wisp }]
  );
}

await setTransport();

function normalize(inputValue) {
  try {
    return new URL(inputValue).toString();
  } catch {}

  try {
    const url = new URL(`http://${inputValue}`);
    if (url.hostname.includes(".")) return url.toString();
  } catch {}

  return `https://search.brave.com/search?q=${encodeURIComponent(inputValue)}`;
}

function navigate(url) {
  const fixed = normalize(url);
  frame.src = scramjet.encodeUrl(fixed);
  input.value = fixed;
}

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    navigate(input.value);
  }
});

redo.onclick = () => {
  frame.src = frame.src;
};

back.onclick = () => {
  try {
    frame.contentWindow.history.back();
  } catch {}
};

next.onclick = () => {
  try {
    frame.contentWindow.history.forward();
  } catch {}
};

openBtn.onclick = () => {
  try {
    const encoded = frame.src.split("/").pop();
    const decoded = scramjet.decodeUrl(encoded);
    window.open(decoded, "_blank");
  } catch {
    window.open(input.value, "_blank");
  }
};

navigate("https://google.com");
