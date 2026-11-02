import fs from 'fs';

const html = fs.readFileSync('/tmp/page.html', 'utf-8');

console.log('--- Body tag preview ---');
const bodyIdx = html.indexOf('<body');
console.log(html.substring(bodyIdx, bodyIdx + 500));

// Let's check if there are checkout URLs like kiwify, hotmart, kirvano, perfectpay, etc.
const allUrls = html.match(/https?:\/\/[^\s"'\<\>]+/g) || [];
const uniqueUrls = [...new Set(allUrls)];
console.log('--- All URLs in HTML ---');
uniqueUrls.forEach(u => console.log(u));

// Check for pixel scripts (fbq, fbevents, etc.)
console.log('--- Pixel occurrences ---');
const pixelMatches = html.match(/(fbq|fbevents|124024574287414|tr\?id=)/g);
console.log('Pixel terms:', pixelMatches);
