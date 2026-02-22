const fs = require('fs-extra');

async function build() {
  await fs.ensureDir('chrome');
  
}

build();
