function escapeMarkdownV2Safe(text) {
  // regex untuk mendeteksi >bold< atau [link](url)
  const pattern = /(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;

  let parts = [];
  let lastIndex = 0;

  text.replace(pattern, (match, bold, link, offset) => {
    // escape bagian teks sebelum match
    const before = text.slice(lastIndex, offset);
    parts.push(escapeAllSpecialChars(before));

    // push match utuh (bold atau link)
    parts.push(match);
    lastIndex = offset + match.length;
  });

  // escape sisa teks
  parts.push(escapeAllSpecialChars(text.slice(lastIndex)));

  return parts.join('');
}

function escapeAllSpecialChars(txt) {
  return txt.replace(/[_*[\]()~`>#+\-=|{}\.!\\]/g, '\\$&');
}

function generateUID(chart) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let uid = '';
  for (let i = 0; i < chart; i++) {
    uid += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return uid;
}

const pickRandom = (list) => {
    return list[Math.floor(list.length * Math.random())];
};

module.exports = { escapeMarkdownV2Safe, generateUID, pickRandom };
