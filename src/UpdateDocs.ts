import { join } from 'path';
import fs from 'fs';
import { Class, FScheckOptions } from './typings/Docs';

const tab = '   ';
const data = {
    Methods: (cls: any) => Object.getOwnPropertyNames(Object.getPrototypeOf(new cls)).filter(method => method !== "constructor").map((m: string) => `> ${m}\n`),
    Properties: (cls: any) => Object.getOwnPropertyNames(new cls).map((prop: string) => `> ${prop}\n`),
} as { [key: string]: (cls: Class) => string[]};

(async () => {
    console.log('[📄] Updating docs...');

    const dir: string = join(process.cwd(), `docs`);
    const classesPath: string = join(__dirname, 'classes');

    if (!await existsOrCreate({ path: dir }) || !await existsOrCreate({ path: classesPath })) return console.log('[❌] Missing paths');

    const classes: string[] = fs.readdirSync(classesPath).filter(file => file.endsWith('.js'));
    const files: string[] = Object.keys(data);

    let readmeString = '';
    for (const cls of classes) {
        console.log(`[🧱] Updating class "${cls}"...`);

        const clsPath: string = join(classesPath, cls);
        const { default: clsFile } = await import(clsPath) as { default: Class };
        const clsName = removeExtension(cls);

        const docClass = join(dir, clsName);
        await existsOrCreate({
            path: docClass,
            type: 'dir'
        })
        
        readmeString+=`\n• ${clsName}\n\n`
        for (const file of files) {
            console.log(`${tab}- Updating file "${file}"...`);

            const filePath: string = join(docClass, `${file}.md`);
            await existsOrCreate({
                path: filePath,
                type: 'file'
            });
            const content: string = fs.readFileSync(filePath, 'utf8');

            const split: string[] = content.split(`# ${file}`);
            const toReplace: string = split.length > 0 ? (split.pop() ?? '' ): '';

            const newContent: string = data[file](clsFile).join('\n');

            if (!toReplace.length) {
                console.log(`${tab}- "${file}" is empty ⚠️`);
                fs.writeFileSync(filePath, `# ${file}\n\n${newContent}`);
            } else fs.writeFileSync(filePath, content.replace(toReplace, `\n\n${newContent}`));

            readmeString += `${tab}- [${file}](${clsName}/${file}.md)\n`;
            console.log(`${tab}- Updated "${file}" 🆗`);
        }
        console.log(`[✅] Updated class "${cls}"`);
    };
    await console.log('[🌐] Updated all classes');

    await readme(dir, readmeString);

    return console.log('[📃] Updated all files');
})();

async function readme(docsDir: string, newContent: string) {
    const path = join(docsDir, 'README.md');
    await existsOrCreate({
        path,
        type: 'file'
    })
    
    let content = await fs.readFileSync(path, 'utf-8');
    if (!content) content = '# Docs\nHere you can find infos about the classes contained in this package. Choose a document from the list below:\n\n## Documents';

    const split: string[] = content.split(`## Documents`);
    const toReplace: string = split.length > 0 ? (split.pop() ?? '' ): '';
    
    if (!toReplace.length) {
        console.log(`${tab}- "README.md" is empty ⚠️`);
        fs.writeFileSync(path, `${content}\n${newContent}`);
    } else {
        console.log(`${tab}- Updating "README.md"`);
        fs.writeFileSync(path, content.replace(toReplace, `\n${newContent}`));
    };

    console.log(`${tab}- Updated "README.md" ✅`);
};

async function existsOrCreate({ path, type = 'dir' }: FScheckOptions): Promise<boolean> {
    if (await fs.existsSync(path)) return true;

    try {
        type === 'dir' ? await fs.mkdirSync(path, {
            recursive: true
        }) : await fs.writeFileSync(path, '');
        return true;
    } catch (e: unknown) {
        console.log(`[❌] Couldn't create "${path}" path\n`);
        return false;
    };
};

function removeExtension(str: string) {
    return str.split('.')[0];
};