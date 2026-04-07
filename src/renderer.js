// src/renderer.js
let config;
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

async function init() {
  config = await window.electronAPI.getConfig();
  console.log('App initialized with config:', config);
  
  // Set up hotkey listeners
  window.electronAPI.onRecordingStatus((shouldRecord) => {
    if (shouldRecord && !isRecording) {
      startRecording();
    } else if (!shouldRecord && isRecording) {
      stopRecording();
    }
  });

  // Fetch balances on load
  updateBalances();
}

async function startRecording() {
  isRecording = true;
  document.getElementById('status').innerText = 'Recording...';
  document.body.classList.add('recording');
  
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    processAudio(audioBlob);
  };

  mediaRecorder.start();
}

function stopRecording() {
  isRecording = false;
  document.getElementById('status').innerText = 'Processing...';
  document.body.classList.remove('recording');
  mediaRecorder.stop();
}

async function processAudio(blob) {
  try {
    // 1. STT with Deepgram
    const transcript = await transcribeWithDeepgram(blob);
    if (!transcript) return;
    
    // 2. Refine with Groq (Optional)
    let finalResult = transcript;
    if (config.refine_with_groq) {
      finalResult = await refineWithGroq(transcript);
    }

    // 3. Inject text
    window.electronAPI.injectText(finalResult);
    document.getElementById('status').innerText = 'Injected!';
  } catch (err) {
    console.error('Processing error:', err);
    document.getElementById('status').innerText = 'Error: ' + err.message;
  }
}

async function transcribeWithDeepgram(blob) {
  const url = 'https://api.deepgram.com/v1/listen?model=' + (config.model || 'nova-2') + '&language=' + (config.language || 'en-US');
  const formData = new FormData();
  formData.append('audio', blob);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Token ' + config.DEEPGRAM_API_KEY
    },
    body: blob
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Deepgram API Error:', data);
    throw new Error(data.err_msg || data.message || 'Deepgram error');
  }
  const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;
  return transcript || '';
}

async function refineWithGroq(text) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + config.GROQ_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        { role: 'system', content: 'You are a professional assistant. Punctuate and grammar-correct the user input, but keep their original style. No chatting, only output the corrected text.' },
        { role: 'user', content: text }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Groq API Error:', data);
    // If Groq fails, we should still return the original text so the user doesn't lose it
    return text;
  }
  return data.choices?.[0]?.message?.content || text;
}

async function updateBalances() {
  // Deepgram Balance
  try {
    if (config.DEEPGRAM_PROJECT_ID && config.DEEPGRAM_API_KEY && config.DEEPGRAM_API_KEY !== 'YOUR_DEEPGRAM_API_KEY_HERE') {
      const dgBalance = await fetchDeepgramBalance();
      document.getElementById('dg-balance').innerText = '$' + dgBalance;
    } else {
      document.getElementById('dg-balance').innerText = 'Provisioning...';
    }
  } catch (err) {
    document.getElementById('dg-balance').innerText = 'N/A';
  }

  // Groq Balance (Mocked as Groq has no public balance API)
  document.getElementById('groq-balance').innerText = 'Free Tier';
}

async function fetchDeepgramBalance() {
  if (!config.DEEPGRAM_PROJECT_ID || !config.DEEPGRAM_API_KEY) return '0.00';
  const url = `https://api.deepgram.com/v1/projects/${config.DEEPGRAM_PROJECT_ID}/balances`;
  const response = await fetch(url, {
    headers: { 'Authorization': 'Token ' + config.DEEPGRAM_API_KEY }
  });
  const data = await response.json();
  return data.balances[0]?.amount.toFixed(2) || '0.00';
}

init();
