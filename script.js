// URL del backend su Vercel — aggiorna questa riga con l'URL reale dopo il deploy (vedi DEPLOY.md nel repo nuova-api)
const BACKEND_URL = 'https://nuova-api.vercel.app';

const modal = document.getElementById('creator');
function openCreator(){ modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
function closeCreator(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
modal.addEventListener('click', e => { if(e.target === modal) closeCreator(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeCreator(); });

const photos = document.getElementById('photos'); const dropzone = document.getElementById('dropzone');
photos.addEventListener('change', () => { const n=photos.files.length; document.getElementById('file-count').textContent=n ? `${n} ${n===1?'foto selezionata':'foto selezionate'}` : ''; dropzone.classList.toggle('has-files',!!n); });

function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setSuccessMessage(title, text){
  const success = document.getElementById('success');
  success.querySelector('h2').textContent = title;
  success.querySelector('p').textContent = text;
}

async function pollStatus(id){
  let data;
  try {
    const res = await fetch(`${BACKEND_URL}/api/status?id=${id}`);
    data = await res.json();
  } catch (err) {
    setSuccessMessage('Connessione persa', 'Non riusciamo a controllare lo stato del film. Riprova tra poco.');
    return;
  }

  if (data.status === 'succeeded') {
    const url = Array.isArray(data.output) ? data.output[0] : data.output;
    setSuccessMessage('È pronto.', 'Ecco la tua prima visione.');
    const success = document.getElementById('success');
    const existingVideo = success.querySelector('video');
    if (existingVideo) existingVideo.remove();
    const video = document.createElement('video');
    video.src = url; video.controls = true; video.autoplay = true;
    video.style.width = '100%'; video.style.marginBottom = '20px';
    success.insertBefore(video, success.querySelector('.button'));
    return;
  }
  if (data.status === 'failed') {
    setSuccessMessage('Qualcosa non ha funzionato', 'La generazione non è riuscita. Riprova con un\'altra foto o descrizione.');
    return;
  }
  setTimeout(() => pollStatus(id), 4000);
}

document.getElementById('filmForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = document.getElementById('filmForm');
  const prompt = document.getElementById('prompt').value;
  const file = photos.files[0];
  if (!file) { alert('Carica almeno una foto.'); return; }

  form.classList.add('done');
  document.querySelector('.modal-head').classList.add('done');
  document.getElementById('success').classList.add('show');
  setSuccessMessage('Un attimo.', 'Stiamo componendo la tua prima visione…');

  try {
    const imageBase64 = await fileToBase64(file);
    const res = await fetch(`${BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, prompt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Errore');
    pollStatus(data.id);
  } catch (err) {
    setSuccessMessage('Non siamo partiti', 'Non siamo riusciti ad avviare la generazione. Riprova tra poco.');
  }
});
