// --- GOOGLE DRIVE ---

let tokenClient=null, driveToken=null;

function connectDrive() {
  const clientId = document.getElementById('drive-client-id').value.trim();
  if(!clientId)return alert('Enter your OAuth Client ID first (in Global Settings).');
  if(typeof google==='undefined')return alert('Google Identity Services not loaded. Check your internet connection.');
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id:clientId,
    scope:'https://www.googleapis.com/auth/drive.file',
    callback:(resp)=>{
      if(resp.error){alert('Drive auth failed: '+resp.error);return;}
      driveToken = resp.access_token;
      document.getElementById('drive-status').textContent='Drive: Connected ✓';
      document.getElementById('drive-status').classList.add('connected');
      document.getElementById('drive-btn-label').textContent='✓ Drive Connected';
    }
  });
  tokenClient.requestAccessToken();
}

async function uploadToDrive(file) {
  const folderId = (globalConfig.drive?.folderId||'').trim();
  const meta = {name:file.name,mimeType:file.type};
  if(folderId) meta.parents=[folderId];
  const form = new FormData();
  form.append('metadata',new Blob([JSON.stringify(meta)],{type:'application/json'}));
  form.append('file',file);
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{
    method:'POST',headers:{Authorization:`Bearer ${driveToken}`},body:form
  });
  const data = await res.json();
  if(!data.id)throw new Error('No file ID returned');
  // Make public
  await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`,{
    method:'POST',headers:{Authorization:`Bearer ${driveToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({role:'reader',type:'anyone'})
  });
  return `https://drive.google.com/thumbnail?id=${data.id}&sz=w1000`;
}
