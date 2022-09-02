const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const addBtn = document.getElementById('add');
const editBtn = document.getElementById('edit');
const clearBtn = document.getElementById('clear');
const showlogBtn = document.getElementById('showlog');
const showTextSpan = document.getElementById('showtext');
const tokenInput = document.getElementById('token');
// eslint-disable-next-line no-undef
const addModal = new bootstrap.Modal('#addModal');
// eslint-disable-next-line no-undef
const logModal = new bootstrap.Modal('#logModal');

startBtn.addEventListener('click', async () => {
  const serverAddrInput = document.getElementById('server_addr');
  const serverPortInput = document.getElementById('server_port');

  const data = {
    serverConfig: {
      server_addr: serverAddrInput.value,
      server_port: serverPortInput.value,
      token: tokenInput.value,
    },
  };

  window.electronAPI.addConfig(data);
  window.electronAPI.startWfrpc();

  // startBtn.classList.remove('active')
});

stopBtn.addEventListener('click', async () => {
  await window.electronAPI.stopWfrpc();
  document.getElementById('log').value = '';
});

editBtn.addEventListener('click', () => {
  window.electronAPI.editWfrpc();
});

clearBtn.addEventListener('click', () => {
  window.electronAPI.clearWfrpc();
});

addBtn.addEventListener('click', async () => {
  // window.electronAPI.showAddChildWindow()
  addModal.show();
});

showlogBtn.addEventListener('click', () => {
  logModal.show();
});

const textArr = [
  '树叶的一生难道只是为了归根吗？',
  '吾所成之事，不可逆也！',
  '即使一无所有，也要未雨绸缪！',
  '命运已做出了它的选择！',
  '荣耀存于心，而非留于形。',
  '世界既不黑也不白，而是一道精致的灰。',
  '世间万物，表里如一者，又有几何？',
  '自负会让每个人都屈膝下跪。',
  '不要被骄傲，遮蔽了双眼。',
  '万事都有选择，哪怕是真相也不例外。',
  '时光就像潮水，它送来了一切，也会带走一切。',
  '大海原本平静，我们的欲望却会兴风作浪。',
  '攀登的过程也许漫长，但巅峰的风景是值得的。',
];

showTextSpan.innerHTML = textArr[Math.floor(Math.random() * textArr.length)];

document.querySelector('form').onsubmit = () => {
  const data = { forwardConfig: {} };
  const localIp = document.getElementById('local_ip').value;
  const localPort = document.getElementById('local_port').value;
  const remotePort = document.getElementById('remote_port').value || Math.floor(Math.random() * (30000 - 20000) + 20000);
  const type = document.getElementById('type').value;

  const config = {
    local_ip: localIp,
    local_port: localPort,
    remote_port: remotePort,
    type,
  };

  data.forwardConfig[`${localIp}_${localPort}`] = config;

  window.electronAPI.addConfig(data);
  document.querySelector('form').reset();
  addModal.hide();
  return false;
};
