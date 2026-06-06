(async () => {
  try {
    const t = await import('tesseract.js');
    console.log('module keys:', Object.keys(t));
    console.log('createWorker type:', typeof t.createWorker);
    if (t.createWorker) {
      const maybe = t.createWorker();
      console.log('maybe is promise-like:', maybe && typeof maybe.then === 'function');
      const worker = (maybe && typeof maybe.then === 'function') ? await maybe : maybe;
      console.log('worker keys:', Object.keys(worker));
      console.log('worker.load exists:', typeof worker.load === 'function');
      console.log('worker.loadLanguage exists:', typeof worker.loadLanguage === 'function');
      console.log('worker.initialize exists:', typeof worker.initialize === 'function');
    }
  } catch (e) {
    console.error('failed inspect:', e);
  }
})();
