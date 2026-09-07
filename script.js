const modal = document.getElementById('creator');
function openCreator(){ modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
function closeCreator(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
modal.addEventListener('click', e => { if(e.target === modal) closeCreator(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeCreator(); });
const photos = document.getElementById('photos'); const dropzone = document.getElementById('dropzone');
photos.addEventListener('change', () => { const n=photos.files.length; document.getElementById('file-count').textContent=n ? `${n} ${n===1?'foto selezionata':'foto selezionate'}` : ''; dropzone.classList.toggle('has-files',!!n); });
document.getElementById('filmForm').addEventListener('submit', e => { e.preventDefault(); document.getElementById('filmForm').classList.add('done'); document.querySelector('.modal-head').classList.add('done'); document.getElementById('success').classList.add('show'); });
