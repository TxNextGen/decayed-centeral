const frame = document.getElementById('frame');
const urlInput = document.getElementById('url');
const backBtn = document.getElementById('back');
const nextBtn = document.getElementById('next');
const redoBtn = document.getElementById('redo');
const openBtn = document.getElementById('open');
const newtabBtn = document.getElementById('newtab');


await new Promise(resolve => {
  if (window.ScramjetServiceWorker) {
    resolve();
  } else {
    window.addEventListener('load', resolve);
  }
});

function isValidURL(str) {
  try {
    const url = new URL(str.startsWith('http') ? str : 'https://' + str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function processURL(input) {
  input = input.trim();
  
  if (isValidURL(input)) {
    return input.startsWith('http') ? input : 'https://' + input;
  }
  
  const searchEngine = 'https://duckduckgo.com/?q=';
  return searchEngine + encodeURIComponent(input);
}

function navigate(url) {
  const processedURL = processURL(url);
  const encodedURL = '/scram/' + processedURL;
  
  frame.src = encodedURL;
  urlInput.value = processedURL;
}

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const input = urlInput.value;
    if (input) {
      navigate(input);
    }
  }
});

backBtn.addEventListener('click', () => {
  try {
    frame.contentWindow.history.back();
  } catch (e) {
    console.log('Cannot go back');
  }
});

nextBtn.addEventListener('click', () => {
  try {
    frame.contentWindow.history.forward();
  } catch (e) {
    console.log('Cannot go forward');
  }
});

redoBtn.addEventListener('click', () => {
  if (frame.src) {
    frame.src = frame.src;
  }
});

openBtn.addEventListener('click', () => {
  if (frame.src) {
    try {
      const decodedURL = frame.src.replace(window.location.origin + '/scram/', '');
      window.open(decodedURL, '_blank');
    } catch (e) {
      window.open(frame.src, '_blank');
    }
  }
});

newtabBtn.addEventListener('click', () => {
  frame.src = '';
  urlInput.value = '';
  urlInput.focus();
});

frame.addEventListener('load', () => {
  try {
    if (frame.src && frame.src !== 'about:blank') {
      const decodedURL = frame.src.replace(window.location.origin + '/scram/', '');
      urlInput.value = decodedURL;
    }
  } catch (e) {
 
  }
});

urlInput.focus();