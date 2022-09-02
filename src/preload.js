const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  addConfig: (data) => ipcRenderer.send('addConfig', data),
  startWfrpc: () => ipcRenderer.invoke('startWfrpc'),
  stopWfrpc: () => ipcRenderer.invoke('stopWfrpc'),
  editWfrpc: () => ipcRenderer.invoke('editWfrpc'),
  clearWfrpc: () => ipcRenderer.invoke('clearWfrpc'),
  showAddChildWindow: () => ipcRenderer.invoke('showAddChildWindow'),
  closeAddChildWindow: () => ipcRenderer.invoke('closeAddChildWindow'),
  // configData: () => ipcRenderer.invoke('configData')
});

window.addEventListener('DOMContentLoaded', async () => {
  ipcRenderer.on('wfrpc:config', (_event, config) => {
    const tbody = document.getElementById('table').getElementsByTagName('tbody')[0];

    let index = 1;
    let serverAddr = 'nb33.3322.org';

    tbody.innerHTML = '';

    Object.keys(config).forEach((i) => {
      if (i === 'common') {
        serverAddr = config[i].server_addr;
      } else {
        tbody.insertRow().innerHTML = `
        <th scope="row">${index}</th>
        <td>${config[i].local_ip}:${config[i].local_port}</td>
        <td>${serverAddr}:${config[i].remote_port} <a href="#" onclick="navigator.clipboard.writeText(this.parentNode.textContent?.trim())"><svg viewBox="64 64 896 896" focusable="false" data-icon="copy" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path></svg></a></td>
        <td><span id="${config[i].local_ip}_${config[i].local_port}" class="text-danger">False<span/></td>
        `;

        index += 1;
      }
    });

    if (tbody.children.length === 0 && Object.keys(config).length !== 0) {
      tbody.innerHTML = '<tr id="tip"><td colspan="4">请添加转发</td></tr>';
    }
  });

  ipcRenderer.on('wfrpc:log', (_event, log) => {
    const re = /(?<=\[)\S*(?=] start proxy success)/g;
    const logTextarea = document.getElementById('log');
    logTextarea.value += log.replace(/\033\[[0-9;]*m/g, '');
    log.match(re)?.forEach((i) => {
      const statusSpan = document.getElementById(i);
      if (statusSpan) {
        statusSpan.className = 'text-success';
        statusSpan.innerHTML = 'True';
      }
    });
  });

  ipcRenderer.on('wfrpc:loadconfig', (_event, config) => {
    document.getElementById('server_addr').value = config.server_addr || '';
    document.getElementById('server_port').value = config.server_port || '';
    document.getElementById('token').value = config.token || '';
  });
});
