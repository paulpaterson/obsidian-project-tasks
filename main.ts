import {App, Editor, MarkdownFileInfo, Plugin, PluginSettingTab, Setting} from 'obsidian';
import Helper, {DEFAULT_SETTINGS, Nestingbehavior, PrefixMethod, ProjectTasksSettings} from "./helpers";
import {editor} from "./test/basic_tests";

// Turn on to allow debugging in the console
const DEBUG = false;


export default class ProjectTasks extends Plugin {
    settings: ProjectTasksSettings;

    async onload() {
        if (DEBUG) console.log('Project Tasks starting');

        await this.loadSettings();

        this.addCommand({
            id: "set-ids",
            name: "Set project ids on Selection",
            editorCallback: (editor, view) => {
                let sel = editor.getSelection();
                let lines = Helper.addTaskIDs(sel, Helper.getPrefix(editor, this.getFilename(editor, view), this.getFileSettings(editor)), this.getFileSettings(editor).automaticTagNames, this.getFileSettings(editor).nestedTaskBehavior == Nestingbehavior.ParallelExecution, this.getFileSettings(editor).idPrefixMethod == PrefixMethod.UsePrefix, this.getFileSettings(editor).randomIDLength, this.getFileSettings(editor).sequentialStartNumber);
                editor.replaceSelection(
                    `${lines}`
                );
            }
        });

        this.addCommand({
            id: "set-ids-block",
            name: "Set project ids on Block",
            editorCallback: (editor, view) => {
                Helper.blockUpdate(editor, this.getFilename(editor, view), true, this.getFileSettings(editor));
            }
        })

        this.addCommand({
            id: "set-ids-file",
            name: "Set project ids on entire file",
            editorCallback: (editor, view) => {
                Helper.addIDsToFile(editor, this.getFilename(editor, view), this.getFileSettings(editor));
            }
        })


        this.addCommand({
            id: "add-project-task-list",
            name: "Add active project task list",
            editorCallback: (editor, view) => {
                Helper.addActiveProjectList(editor, this.getFileSettings(editor));
            }
        })

        this.addCommand({
            id: "clear-ids",
            name: "Clear project ids on Selection",
            editorCallback: (editor, view) => {
                let sel = editor.getSelection();
                let lines = Helper.clearBlockIDs(sel, this.getFileSettings(editor).automaticTagNames, this.getFileSettings(editor).clearAllTags);
                editor.replaceSelection(
                    `${lines}`
                );
            }
        });

        this.addCommand({
            id: "clear-ids-block",
            name: "Clear project ids on Block",
            editorCallback: (editor, view) => {
                Helper.blockUpdate(editor, this.getFilename(editor, view), false, this.getFileSettings(editor));
            }
        })

        this.addCommand({
            id: "clear-ids-file",
            name: "Clear project ids in entire file",
            editorCallback: (editor, view) => {
                let sel = editor.getValue();
                let lines = Helper.clearBlockIDs(sel, this.getFileSettings(editor).automaticTagNames, this.getFileSettings(editor).clearAllTags);
                editor.setValue(lines);
            }
        })

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new ProjectTasksSettingsTab(this.app, this));

    }

    getFileSettings(editor: Editor) {
        // Returns the local settings for the file
        // This is the main settings for the plug in plus any override from the 
        // file front matter
        if (this.settings.overrideSettings) {
            return Helper.getSettingsFromFrontMatter(editor, this.settings);
        } else {
            return this.settings;
        }
    }

    getFilename(editor: Editor, view: MarkdownFileInfo) {
        if (!view.file?.name) {
            return this.getFileSettings(editor).projectPrefix;
        } else {
            return view.file.name.split('.')[0];
        }
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


class ProjectTasksSettingsTab extends PluginSettingTab {
    plugin: ProjectTasks;

    constructor(app: App, plugin: ProjectTasks) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Project ID method')
            .setDesc('Choose how the ID will be determined')
            .addDropdown(dropDown => {
                dropDown.addOption('1', 'Use prefix');
                dropDown.addOption('2', 'Use Section name');
                dropDown.addOption('3', 'Use filename')
                    .setValue(this.plugin.settings.idPrefixMethod.toString())
                    .onChange(async (value) => {
                        this.plugin.settings.idPrefixMethod = parseInt(value) as PrefixMethod;
                        await this.plugin.saveSettings();
                    })
            });

        new Setting(containerEl)
            .setName('Project ID prefix')
            .setDesc('Prefix to use when creating an ID for a task')
            .addText(text => text
                .setPlaceholder('ID prefix')
                .setValue(this.plugin.settings.projectPrefix)
                .onChange(async (value) => {
                    this.plugin.settings.projectPrefix = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Length of random ID number')
            .setDesc('How many digits to use for random ID when using a fixed prefix')
            .addSlider(text => text
                .setValue(this.plugin.settings.randomIDLength)
                .setLimits(3, 6, 1)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.randomIDLength = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Initial sequential ID number')
            .setDesc('Start number for sequential ID\'s')
            .addSlider(text => text
                .setValue(this.plugin.settings.sequentialStartNumber)
                .setLimits(0, 1, 1)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.sequentialStartNumber = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Remove vowels')
            .setDesc('Remove vowels from the prefix when getting from the filename or block name')
            .addToggle(text => text
                .setValue(this.plugin.settings.removeVowels)
                .onChange(async (value) => {
                    this.plugin.settings.removeVowels = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('First letter of words')
            .setDesc('Only use the first letter of words to form the prefix')
            .addToggle(text => text
                .setValue(this.plugin.settings.firstLettersOfWords)
                .onChange(async (value) => {
                    this.plugin.settings.firstLettersOfWords = value;
                    await this.plugin.saveSettings();
                }));


        new Setting(containerEl)
            .setName('Automatically add tags')
            .setDesc('A list of tags (one per line) to add to each task - do not include the # symbol')
            .addTextArea((text) => {
                text.setValue(this.plugin.settings.automaticTagNames.join('\n'))
                    .onChange((value) => {
                        this.plugin.settings.automaticTagNames = value.replaceAll('#', '').split('\n').filter(line => line.trim() !== '');
                        this.plugin.saveSettings();
                    }).then(textArea => {
                    textArea.inputEl.style.width = "100%";
                    textArea.inputEl.rows = 5;
                });
            });

        new Setting(containerEl)
            .setName('Clear all tags from project tasks')
            .setDesc('When clearing tags from project tasks clear all existing tags not just the automatically added ones')
            .addToggle(text => text
                .setValue(this.plugin.settings.clearAllTags)
                .onChange(async (value) => {
                    this.plugin.settings.clearAllTags = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Nested tags behavior')
            .setDesc('Determines whether nested tags will create parallel execution tags or sequential')
            .addDropdown(dropDown => {
                dropDown.addOption('1', 'Parallel Execution');
                dropDown.addOption('2', 'Sequential Execution')
                    .setValue(this.plugin.settings.nestedTaskBehavior.toString())
                    .onChange(async (value) => {
                        this.plugin.settings.nestedTaskBehavior = parseInt(value) as Nestingbehavior;
                        await this.plugin.saveSettings();
                    })
            });

        new Setting(containerEl)
            .setName('Override settings from file front matter')
            .setDesc('Allow overriding the plugin main settings by reading values from the front matter')
            .addToggle(text => text
                .setValue(this.plugin.settings.overrideSettings)
                .onChange(async (value) => {
                    this.plugin.settings.overrideSettings = value;
                    await this.plugin.saveSettings();
                }));

    }
}

