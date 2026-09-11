// URL del backend su Vercel.
const BACKEND_URL = 'https://nuova-api.vercel.app';

const photos = document.getElementById('photos');
const dropzone = document.getElementById('dropzone');
const result = document.getElementById('result');
const resultText = document.getElementById('result-text');

photos.addEventListener('change', () => {
  const n = photos.files.length;
  document.getElementById('file-count').textContent = n ? `${n} ${n === 1 ? 'foto selezionata' : 'foto selezionate'}` : '';
  dropzone.classList.toggle('has-files', !!n);
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showResult(text) {
  result.classList.add('show');
  resultText.textContent = text;
}

async function pollStatus(id) {
  let data;
  try {
    const res = await fetch(`${BACKEND_URL}/api/status?id=${id}`);
    data = await res.json();
  } catch (err) {
    showResult('Connessione persa. Riprova tra poco.');
    return;
  }

  if (data.status === 'succeeded') {
    const url = Array.isArray(data.output) ? data.output[0] : data.output;
    showResult('Ecco la tua prima visione.');
    const existingVideo = result.querySelector('video');
    if (existingVideo) existingVideo.remove();
    const video = document.createElement('video');
    video.src = url; video.controls = true; video.autoplay = true;
    result.appendChild(video);
    return;
  }
  if (data.status === 'failed') {
    showResult('La generazione non è riuscita. Riprova con un\'altra foto o descrizione.');
    return;
  }
  setTimeout(() => pollStatus(id), 4000);
}

document.getElementById('filmForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const prompt = document.getElementById('prompt').value;
  const file = photos.files[0];
  if (!file) { alert('Carica una foto.'); return; }

  const existingVideo = result.querySelector('video');
  if (existingVideo) existingVideo.remove();

  // Primo passo: confermiamo l'account prima di spendere una generazione.
  showResult('Un attimo, verifichiamo il tuo account…');
  let account;
  try {
    const accountRes = await fetch(`${BACKEND_URL}/api/account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    account = await accountRes.json();
    if (!accountRes.ok) { showResult(account.error || 'Riprova tra poco.'); return; }
  } catch (err) {
    showResult('Non siamo riusciti a verificare il tuo account. Riprova tra poco.');
    return;
  }

  if (account.freeVideoUsed) {
    showResult('Hai già usato il tuo film gratuito con questo account. I piani a pagamento arrivano presto.');
    return;
  }

  showResult(account.isNew ? 'Account creato ✓ Iniziamo.' : 'Bentornato ✓ Iniziamo.');

  try {
    const imageBase64 = await fileToBase64(file);
    const res = await fetch(`${BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, imageBase64, prompt }),
    });
    const data = await res.json();
    if (!res.ok) { showResult(data.error || 'Riprova tra poco.'); return; }
    showResult('Un attimo, stiamo componendo la tua prima visione…');
    pollStatus(data.id);
  } catch (err) {
    showResult('Non siamo riusciti ad avviare la generazione. Riprova tra poco.');
  }
});
