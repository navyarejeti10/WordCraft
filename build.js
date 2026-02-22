const fs = require('fs-extra');

async function build() {
  await fs.ensureDir('dist/chrome');
  
}

build();
