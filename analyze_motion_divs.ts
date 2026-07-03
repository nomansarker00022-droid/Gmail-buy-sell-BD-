import fs from 'fs';

const filePath = './src/App.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const startLine = 11000;
const endLine = 13268;

const stack: { tag: string; line: number; text: string }[] = [];

for (let i = startLine - 1; i < endLine; i++) {
  const lineNum = i + 1;
  const line = lines[i];
  
  if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
    continue;
  }
  
  const tagRegex = /<\/?([a-zA-Z0-9.-]+)(?:\s+[^>]*)?\/?>/g;
  let match;
  
  while ((match = tagRegex.exec(line)) !== null) {
    const rawTag = match[0];
    const tagName = match[1];
    
    if (rawTag.endsWith('/>')) {
      continue;
    }
    
    // We only care about AnimatePresence and fragment/div/motion.div
    if (!['AnimatePresence', 'div', 'motion.div'].includes(tagName)) {
      if (rawTag === '<>' || rawTag === '</>') {
        // fragment
      } else {
        continue;
      }
    }
    
    const isClosing = rawTag.startsWith('</');
    const displayTag = rawTag === '<>' ? 'fragment' : (rawTag === '</>' ? '/fragment' : (isClosing ? '/' + tagName : tagName));
    
    if (displayTag.startsWith('/')) {
      const closingName = displayTag.substring(1);
      if (stack.length > 0) {
        const top = stack.pop()!;
        if (top.tag !== closingName) {
          console.log(`[Line ${lineNum}] MISMATCH: Closed </${closingName}> but top of stack is <${top.tag}> (opened on line ${top.line})`);
          // Push back to recover
          stack.push(top);
        }
      } else {
        console.log(`[Line ${lineNum}] Extra closing: </${closingName}>`);
      }
    } else {
      stack.push({ tag: displayTag, line: lineNum, text: line.trim() });
    }
  }
}

console.log("\nRemaining Stack of Open Tags:");
for (const item of stack) {
  console.log(`- <${item.tag}> opened on line ${item.line}: ${item.text}`);
}
