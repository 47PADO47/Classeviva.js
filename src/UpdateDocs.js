const Classeviva = require('./Classeviva');
const { readFileSync, writeFileSync } = require('fs');

(async () => {
    const dir = require('path').parse(__dirname).dir;
    const readme = await readFileSync(`${dir}/README.md`, 'utf8');

    const DocsMethods = readme.split('## Methods').pop();
    
    const Methods = Object.getOwnPropertyNames(Classeviva.prototype).filter(method => method !== 'constructor').map(m => `> ${m}\n`);
    const text = `\n\n- **Note:** All methods return a Promise.\n`
    
    const newDocs = readme.replace(DocsMethods, `${text}\n${Methods.join('\n')}`);
    await writeFileSync(`${dir}/README.md`, newDocs);

    return console.log(`\x1b[31m[CLASSEVIVA]\x1b[0m`, 'Updated docs 📃');
})();