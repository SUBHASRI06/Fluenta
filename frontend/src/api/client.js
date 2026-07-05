export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('fluenta_token');
  if (token) {
    return { ...extraHeaders, 'Authorization': `Bearer ${token}` };
  }
  return extraHeaders;
}

export async function assessText(text, framework, sessionName, sessionEmail) {
  const response = await fetch(`${API_BASE}/api/assess/text`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      text,
      framework,
      session_name: sessionName || null,
      session_email: sessionEmail || null,
    }),
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to analyze text');
  }
  
  return await response.json();
}

export async function assessAudio(audioBlob, framework, sessionName, sessionEmail) {
  const formData = new FormData();
  let filename = audioBlob.name;
  if (!filename) {
    let ext = '.wav';
    if (audioBlob.type) {
      if (audioBlob.type.includes('webm')) ext = '.webm';
      else if (audioBlob.type.includes('mp4')) ext = '.m4a';
      else if (audioBlob.type.includes('ogg')) ext = '.ogg';
      else if (audioBlob.type.includes('mp3')) ext = '.mp3';
    }
    filename = `recording${ext}`;
  }
  formData.append('file', audioBlob, filename);
  formData.append('framework', framework);
  if (sessionName) formData.append('session_name', sessionName);
  if (sessionEmail) formData.append('session_email', sessionEmail);

  const response = await fetch(`${API_BASE}/api/assess/audio`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to analyze audio');
  }

  return await response.json();
}

export async function getHistory() {
  const response = await fetch(`${API_BASE}/api/history`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to retrieve assessment history');
  }
  return await response.json();
}
