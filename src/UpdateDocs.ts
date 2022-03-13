import Classeviva from './Classeviva';
import { readdirSync, readFileSync, writeFileSync } from 'fs';

(async () => {
    console.log('[📄] Updating docs...');

    const dir: string = `${process.cwd()}/docs/`;
    const filesObj: { [key: string]: string } = {};
    const files: string[] = readdirSync(dir);
    files.forEach((file: string)=> filesObj[file] = `${dir}/${file}`);

    const data = {
        Methods: Object.getOwnPropertyNames(Classeviva.prototype).filter((method: string) => method !== 'constructor').map((m: string) => `> ${m}\n`),
        Properties: Object.getOwnPropertyNames(new Classeviva).map((prop: string) => `> ${prop}\n`),
        Readme: files.filter((file: string) => file !== "Readme.md").map((file: string) => `- [${file}](${file})\n`),
    } as { [key: string]: string[] };

    for (const file in filesObj) {
        console.log(`[🔁] Loading ${file}...`);
        
        const location: string = filesObj[file];
        const content: string = readFileSync(location, 'utf8');

        const split: string[] = file == 'Readme.md' ? content.split('## Documents') : content.split(`# ${file.replace(".md", "")}`);;
        const toReplace: string = split.length > 0 ? split[split.length-1] : '';

        const newContent: string = data[file.replace('.md', '')].join('\n');

        if (!toReplace.length) {
            console.log(`   - "${file}" is empty ⚠️`);
            writeFileSync(location, `# ${file == 'Readme.md' ? 'Docs\nHere you can find infos about the `Classeviva` class. Choose a document from the list below:\n\n## Documents\n\n' : `${file}\n\n`}${newContent}`);
        } else {
            console.log(`   - Updating "${file}"`);
            writeFileSync(location, content.replace(toReplace, `\n\n${newContent}`));
        };
        console.log(`   - Updated "${file}" ✅`);
    };

    return console.log('[📃] Updated all files ✅');
})();