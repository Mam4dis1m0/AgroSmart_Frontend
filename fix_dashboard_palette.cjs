const fs = require('fs');
const path = require('path');
const updates = [
  {
    file: path.join('vite','src','shared','styles','Dashboard.css'),
    replaces: [
      [/#0f3800/g, '#0b2443'],
      [/rgba\(106, 170, 0, 0\.(\d+)\)/g, 'rgba(63, 163, 255, 0.$1)'],
      [/rgba\(13, 46, 0, 0\.(\d+)\)/g, 'rgba(22, 54, 105, 0.$1)'],
      [/rgba\(13, 46, 0, 0\)/g, 'rgba(22, 54, 105, 0)']
    ]
  },
  {
    file: path.join('vite','src','shared','styles','DashboardEmpleado.css'),
    replaces: [
      [/linear-gradient\(90deg, #3d7a00, #90cc00\)/g, 'linear-gradient(90deg, #1a5a9b, #63a3ff)'],
      [/rgba\(106, 170, 0, 0\.(\d+)\)/g, 'rgba(63, 163, 255, 0.$1)'],
      [/rgba\(13, 46, 0, 0\.(\d+)\)/g, 'rgba(22, 54, 105, 0.$1)'],
      [/rgba\(13, 46, 0, 0\)/g, 'rgba(22, 54, 105, 0)']
    ]
  }
];
for (const item of updates) {
  const filePath = path.resolve(item.file);
  let content = fs.readFileSync(filePath, 'utf8');
  item.replaces.forEach(([from, to]) => { content = content.replace(from, to); });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('updated', item.file);
}
