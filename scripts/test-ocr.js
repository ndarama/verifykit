(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'test.jpg',
        fileType: 'image/jpeg',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAm0B9qVQ0tUAAAAASUVORK5CYII='
      })
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (e) {
    console.error('Request failed:', e);
  }
})();
