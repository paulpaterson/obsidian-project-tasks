import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';

// Remember to rename these classes and interfaces!!

interface MyPluginSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    mySetting: 'default'
}

export default class HelloWorldPaul extends Plugin {
    settings: MyPluginSettings;

    async onload() {
        console.log('Project Tasks starting');

        await this.loadSettings();

        this.addCommand({
            id: "set-ids",
            name: "Set project ids",
            editorCallback: (editor, view) => {
                const sel = editor.getSelection();
                const regex = /^(-\s\[ \]\s)?(.*?)(\s🆔\s\w+)?(\s⛔\s\w+)?(.*)$/mg;
                const matches = sel.matchAll(regex);

                let lines = "";
                let idx = 0;
                for (const match of matches) {
                    console.log("Matches:", match);
                    if (idx > 0) {
                        lines += "\n";
                    }
                    if (match[1]) {
                        lines += `- [ ] ${match[2]} 🆔 prj${idx}${match[5]}`;
                        if (idx > 0) {
                            lines += ` ⛔ prj${idx - 1}`;
                        }
                    } else {
                        lines += `${match[2]}`;
                    }
                    idx += 1;
                }
                new Notice(`Project tasks created from: ${sel}`);
                editor.replaceSelection(
                    `${lines}`
                );
            }
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SampleSettingTab(this.app, this));

        // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
        // Using this function will automatically remove the event listener when this plugin is disabled.
        this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
            console.log('click', evt);
        });

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));


    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SampleModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.setText('Woah!');
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

class SampleSettingTab extends PluginSettingTab {
    plugin: HelloWorldPaul;

    constructor(app: App, plugin: HelloWorldPaul) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Setting #1')
            .setDesc('It\'s a secret')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue(this.plugin.settings.mySetting)
                .onChange(async (value) => {
                    this.plugin.settings.mySetting = value;
                    await this.plugin.saveSettings();
                }));
    }
}
