import { join } from 'path';
import fs from 'fs';
import { FScheckOptions } from '../types/docs';
import BaseApiClient from './client';

const tab = '   ';

class DocsUpdater {
    private readmeString: string = "";

    async updateDocs() {
        this.log('📄', 'Updating docs...');

        const dir: string = join(process.cwd(), `docs`);
        if (!await this.existsOrCreate({ path: dir })) this.error('Missing docs dir');

        await this.classes(dir);
        await this.readme(dir, this.readmeString);
        await this.examples(dir);

        this.log('📃', 'Updated all files');
        this.readmeString = '';

        return this;
    }

    private async classes(docsDir: string) {
        const distPath: string = join(process.cwd(), 'dist');
        if (!await this.existsOrCreate({ path: distPath, create: false })) return this.error('Missing dist folder, please compile');

        const classesPath: string = join(distPath, 'src', 'classes');
        if (!await this.existsOrCreate({ path: classesPath })) return this.error('Missing classes dir');

        const classes: string[] = fs
            .readdirSync(classesPath)
            .filter(file => file.endsWith('.js'));
        for (const cls of classes) {
            this.log(`🧱`, `Updating class "${cls}"...`);

            const clsPath: string = join(classesPath, cls);
            const clsModule = await import(clsPath);
            const clsInstance = new clsModule.default() as BaseApiClient;

            const data = this.getData(clsInstance);
            const files: string[] = Object.keys(data);

            const clsName = this.removeExtension(cls);

            const docClass = join(docsDir, clsName);
            await this.existsOrCreate({
                path: docClass,
                dir: true
            });

            this.readmeString += `\n• ${clsName}\n\n`;
            for (const file of files) {
                this.log('-', `Updating file "${file}"...`, true);

                const filePath: string = join(docClass, `${file}.md`);
                await this.existsOrCreate({
                    path: filePath,
                    dir: false
                });
                const content: string = fs.readFileSync(filePath, 'utf8');

                const split: string[] = content.split(`# ${file}`);
                const toReplace: string = split.length > 0 ? (split.pop() ?? '') : '';

                const newContent: string = data[file].join('\n');

                if (!toReplace.length) {
                    this.log('⚠️', `"${file}" is empty`, true);
                    fs.writeFileSync(filePath, `# ${file}\n\n${newContent}`);
                } else fs.writeFileSync(filePath, content.replace(toReplace, `\n\n${newContent}`));

                this.readmeString += `${tab}- [${file}](${clsName}/${file}.md)\n`;
                this.log('🆗', `Updated "${file}"`, true);
            }
            this.log('✅', `Updated class "${cls}"`);
        }
        this.log('🌐', 'Updated all classes');
    }

    private async readme(docsDir: string, newContent: string) {
        const path = join(docsDir, 'README.md');
        await this.existsOrCreate({
            path,
            dir: false,
        });

        let content = await fs.readFileSync(path, 'utf-8');
        if (!content) content = '# Docs\nHere you can find infos about the classes contained in this package. Choose a document from the list below:\n\n## Documents';

        const split: string[] = content.split(`## Documents`);
        const toReplace: string = split.length > 0 ? (split.pop() ?? '') : '';

        if (!toReplace.length) {
            this.log('⚠️', '"README.md" is empty');
            fs.writeFileSync(path, `${content}\n${newContent}`);
        } else {
            this.log('-', 'Updating "README.md"');
            fs.writeFileSync(path, content.replace(toReplace, `\n${newContent}`));
        }

        this.log('✅', 'Updated "README.md"', true);
    }

    private async examples(docsDir: string) {
        this.log('📦', 'Updating examples...');
        const path = join(docsDir, 'Examples');
        await this.existsOrCreate({
            path,
            dir: true
        });

        let string = "";
        const examples = fs.readdirSync(path);
        examples.forEach(async (example: string) => {
            string += `\n• [${this.removeExtension(example)}](docs/Examples/${example})\n`;
            this.log(`🆗`, `Added example "${example}"`, true);
        });

        if (!string.length) {
            string = '\nThere are no examples yet.\n';
            this.log('⚠️', '"Examples" folder is empty', true);
        }

        const readmePath = join(process.cwd(), 'README.md');
        const readmeContent = await fs.readFileSync(readmePath, 'utf-8');
        const split: string[] = readmeContent.split(`## Examples`);

        if (split.length === 0) return this.error('Couldn\'t find "Examples" section in README.md');
        const toReplace = split.pop()?.split('##')[0] ?? '';
        fs.writeFileSync(readmePath, readmeContent.replace(toReplace, `\n${string}\n`));

        this.log('✅', 'Updated examples');
        return;
    }

    private async existsOrCreate({ create = true, dir = true, ...options}: FScheckOptions): Promise<boolean> {
        const exists = await fs.existsSync(options.path);
        if (exists) return true;

        if (!create) return false;

        try {
            dir ? await fs.mkdirSync(options.path, {
                recursive: true
            }) : await fs.writeFileSync(options.path, '');
            return true;
        } catch (e: unknown) {
            this.error(`Couldn't create "${options.path}" path\n`);
        }
    }

    private removeExtension(str: string): string {
        return str.split('.')[0];
    }

    private error(msg: string): never {
        this.log('❌', msg);
        process.exit(1);
    }

    private log(emoji: string, message: string, space: boolean = false) {
        console.log((space ? tab : '') + `[${emoji}]`, message);
        return this;
    }

    private getData(cls: BaseApiClient): Record<string, string[]> {
        return {
            Methods: cls
                .getMethods()
                .map((m: string) => `> ${m}\n`),
            Properties: Object
                .getOwnPropertyNames(cls)
                .map((prop: string) => `> ${prop}\n`),
        }
    }
};

export default DocsUpdater;