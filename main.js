/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ProjectTasks
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEBUG = true;
var BLOCK_BOUNDARY = /^#+\s/;
var DEFAULT_SETTINGS = {
  idPrefixMethod: "1" /* UsePrefix */,
  projectPrefix: "prj",
  randomIDLength: 6,
  removeVowels: false,
  firstLettersOfWords: false
};
var ProjectTasks = class extends import_obsidian.Plugin {
  async onload() {
    if (DEBUG)
      console.log("Project Tasks starting");
    await this.loadSettings();
    this.addCommand({
      id: "set-ids",
      name: "Set project ids on Selection",
      editorCallback: (editor, view) => {
        let sel = editor.getSelection();
        let lines = this.addTaskIDs(sel, this.getPrefix(editor, view));
        editor.replaceSelection(
          `${lines}`
        );
      }
    });
    this.addCommand({
      id: "clear-ids",
      name: "Clear project ids on Selection",
      editorCallback: (editor, view) => {
        let sel = editor.getSelection();
        let lines = this.clearBlockIDs(sel);
        editor.replaceSelection(
          `${lines}`
        );
      }
    });
    this.addCommand({
      id: "set-ids-block",
      name: "Set project ids on Block",
      editorCallback: (editor, view) => {
        this.blockUpdate(editor, this.getPrefix(editor, view), true);
      }
    });
    this.addCommand({
      id: "clear-ids-block",
      name: "Clear project ids on Block",
      editorCallback: (editor, view) => {
        this.blockUpdate(editor, this.getPrefix(editor, view), false);
      }
    });
    this.addSettingTab(new SampleSettingTab(this.app, this));
    this.registerInterval(window.setInterval(() => console.log("setInterval"), 5 * 60 * 1e3));
  }
  blockUpdate(editor, prefix, add_ids) {
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    let blockStart = this.getBlockStart(editor);
    let blockEnd = this.getBlockEnd(editor);
    let last_line_length = editor.getLine(blockEnd + 1).length;
    const blockContent = editor.getRange({ line: blockStart, ch: 0 }, { line: blockEnd, ch: last_line_length });
    if (DEBUG)
      console.log(`Start ${blockStart}, End ${blockEnd}, last length ${last_line_length}
Orig: ${blockContent}`);
    let lines;
    if (add_ids) {
      lines = this.addTaskIDs(blockContent, prefix);
    } else {
      lines = this.clearBlockIDs(blockContent);
    }
    if (DEBUG)
      console.log(`Start ${blockStart}, End ${blockEnd}, last length ${last_line_length}
Orig: ${blockContent}
New: ${lines}`);
    editor.replaceRange(lines, { line: blockStart, ch: 0 }, { line: blockEnd, ch: last_line_length });
  }
  getBlockEnd(editor) {
    let blockEnd = editor.getCursor().line;
    while (!BLOCK_BOUNDARY.test(editor.getLine(blockEnd))) {
      blockEnd++;
      if (blockEnd > editor.lineCount() - 1)
        return blockEnd;
    }
    return blockEnd;
  }
  getBlockStart(editor) {
    let blockStart = editor.getCursor().line;
    while (blockStart > 0 && !BLOCK_BOUNDARY.test(editor.getLine(blockStart - 1))) {
      blockStart--;
    }
    return blockStart;
  }
  generateRandomDigits(length) {
    const digits = "0123456789";
    let randomString = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      randomString += digits[randomIndex];
    }
    return randomString;
  }
  clearBlockIDs(sel) {
    let remove_id = /\h?🆔\s\w+\h*/g;
    sel = sel.replaceAll(remove_id, "");
    let remove_block = /\h?⛔\s\w+\h*/g;
    sel = sel.replaceAll(remove_block, "");
    return sel;
  }
  getPrefix(editor, view) {
    let raw_prefix;
    switch (this.settings.idPrefixMethod) {
      case "1" /* UsePrefix */: {
        raw_prefix = this.settings.projectPrefix;
        break;
      }
      case "3" /* FileName */: {
        raw_prefix = this.getFilename(view);
        break;
      }
      case "2" /* SectionName */: {
        let section_start = this.getBlockStart(editor);
        let section_line;
        if (section_start == 0) {
          section_line = "";
        } else {
          section_line = editor.getLine(section_start - 1);
        }
        if (DEBUG)
          console.log("Prefix check .. Found section: ", section_start, section_line);
        if (BLOCK_BOUNDARY.test(section_line)) {
          raw_prefix = section_line;
        } else {
          raw_prefix = this.getFilename(view);
        }
        break;
      }
    }
    return this.getPrefixFromString(raw_prefix);
  }
  getFilename(view) {
    var _a;
    if (!((_a = view.file) == null ? void 0 : _a.name)) {
      return this.settings.projectPrefix;
    } else {
      return view.file.name.split(".")[0];
    }
  }
  getPrefixFromString(text) {
    text = text.replaceAll("#", "");
    if (this.settings.firstLettersOfWords) {
      let words = text.split(/\s+/);
      if (DEBUG)
        console.log("found words", words);
      text = "";
      for (let word of words) {
        if (word) {
          text = `${text}${word[0].toUpperCase()}`;
        }
      }
    }
    text = text.replaceAll(" ", "");
    if (this.settings.removeVowels) {
      text = text.replaceAll(/[aeiou]/g, "");
    }
    return text;
  }
  addTaskIDs(sel, prefix) {
    const regex = /^(-\s\[[ x\-\/]\]\s)?(.*)$/mg;
    sel = this.clearBlockIDs(sel);
    if (DEBUG)
      console.log(`Replaced ids and blocks to give: ${sel}`);
    const matches = sel.matchAll(regex);
    let lines = "";
    let first = true;
    let idx = 0;
    let this_id;
    let last_id;
    for (const match of matches) {
      if (!first) {
        lines += "\n";
      }
      if (match[1]) {
        if (this.settings.idPrefixMethod == "1" /* UsePrefix */) {
          this_id = this.generateRandomDigits(this.settings.randomIDLength);
        } else {
          this_id = `${idx}`;
        }
        lines += `${match[1]}${match[2].trim()} \u{1F194} ${prefix}${this_id}`;
        if (idx > 0) {
          lines += ` \u26D4 ${prefix}${last_id}`;
        }
        idx += 1;
        last_id = this_id;
      } else {
        lines += `${match[2].trim()}`;
      }
      first = false;
    }
    return lines;
  }
  onunload() {
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var SampleSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Project ID method").setDesc("Choose how the ID will be determined").addDropdown((dropDown) => {
      dropDown.addOption("1", "Use prefix");
      dropDown.addOption("2", "Use Section name");
      dropDown.addOption("3", "Use filename").setValue(this.plugin.settings.idPrefixMethod).onChange(async (value) => {
        this.plugin.settings.idPrefixMethod = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Project ID prefix").setDesc("Prefix to use when creating an ID for a task").addText((text) => text.setPlaceholder("ID prefix").setValue(this.plugin.settings.projectPrefix).onChange(async (value) => {
      this.plugin.settings.projectPrefix = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Length of random ID number").setDesc("How many digits to use for random ID when using a fixed prefix").addSlider((text) => text.setValue(this.plugin.settings.randomIDLength).setLimits(3, 6, 1).setDynamicTooltip().onChange(async (value) => {
      this.plugin.settings.randomIDLength = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Remove vowels").setDesc("Remove vowels from the prefix when getting from the filename or block name").addToggle((text) => text.setValue(this.plugin.settings.removeVowels).onChange(async (value) => {
      this.plugin.settings.removeVowels = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("First letter of words").setDesc("Only use the first letter of words to form the prefix").addToggle((text) => text.setValue(this.plugin.settings.firstLettersOfWords).onChange(async (value) => {
      this.plugin.settings.firstLettersOfWords = value;
      await this.plugin.saveSettings();
    }));
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgICBBcHAsXG4gICAgRWRpdG9yLFxuICAgIEVkaXRvclBvc2l0aW9uLCBNYXJrZG93bkZpbGVJbmZvLFxuICAgIE1hcmtkb3duVmlldyxcbiAgICBNb2RhbCxcbiAgICBOb3RpY2UsXG4gICAgUGx1Z2luLFxuICAgIFBsdWdpblNldHRpbmdUYWIsXG4gICAgU2V0dGluZyxcbiAgICBWaWV3XG59IGZyb20gJ29ic2lkaWFuJztcblxuLy8gVHVybiBvbiB0byBhbGxvdyBkZWJ1Z2dpbmcgaW4gdGhlIGNvbnNvbGVcbmNvbnN0IERFQlVHID0gdHJ1ZTtcbi8vIFJlZ2V4IGZvciBibG9jayBib3VuZGFyeVxuY29uc3QgQkxPQ0tfQk9VTkRBUlkgPSAvXiMrXFxzLztcblxuXG5cbmVudW0gUHJlZml4TWV0aG9kIHtcbiAgICBVc2VQcmVmaXg9ICcxJyxcbiAgICBTZWN0aW9uTmFtZSA9ICcyJyxcbiAgICBGaWxlTmFtZSA9ICczJ1xufVxuXG5pbnRlcmZhY2UgTXlQbHVnaW5TZXR0aW5ncyB7XG4gICAgaWRQcmVmaXhNZXRob2Q6IFByZWZpeE1ldGhvZDtcbiAgICBwcm9qZWN0UHJlZml4OiBzdHJpbmc7XG4gICAgcmFuZG9tSURMZW5ndGg6IG51bWJlcjtcbiAgICByZW1vdmVWb3dlbHM6IGJvb2xlYW47XG4gICAgZmlyc3RMZXR0ZXJzT2ZXb3JkczogYm9vbGVhbjtcbn1cblxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogTXlQbHVnaW5TZXR0aW5ncyA9IHtcbiAgICBpZFByZWZpeE1ldGhvZDogUHJlZml4TWV0aG9kLlVzZVByZWZpeCxcbiAgICBwcm9qZWN0UHJlZml4OiAncHJqJyxcbiAgICByYW5kb21JRExlbmd0aDogNixcbiAgICByZW1vdmVWb3dlbHM6IGZhbHNlLFxuICAgIGZpcnN0TGV0dGVyc09mV29yZHM6IGZhbHNlXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb2plY3RUYXNrcyBleHRlbmRzIFBsdWdpbiB7XG4gICAgc2V0dGluZ3M6IE15UGx1Z2luU2V0dGluZ3M7XG5cbiAgICBhc3luYyBvbmxvYWQoKSB7XG4gICAgICAgIGlmIChERUJVRykgY29uc29sZS5sb2coJ1Byb2plY3QgVGFza3Mgc3RhcnRpbmcnKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICAgICAgICBpZDogXCJzZXQtaWRzXCIsXG4gICAgICAgICAgICBuYW1lOiBcIlNldCBwcm9qZWN0IGlkcyBvbiBTZWxlY3Rpb25cIixcbiAgICAgICAgICAgIGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yLCB2aWV3KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHNlbCA9IGVkaXRvci5nZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICBsZXQgbGluZXMgPSB0aGlzLmFkZFRhc2tJRHMoc2VsLCB0aGlzLmdldFByZWZpeChlZGl0b3IsIHZpZXcpKTtcbiAgICAgICAgICAgICAgICBlZGl0b3IucmVwbGFjZVNlbGVjdGlvbihcbiAgICAgICAgICAgICAgICAgICAgYCR7bGluZXN9YFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICAgICAgICBpZDogXCJjbGVhci1pZHNcIixcbiAgICAgICAgICAgIG5hbWU6IFwiQ2xlYXIgcHJvamVjdCBpZHMgb24gU2VsZWN0aW9uXCIsXG4gICAgICAgICAgICBlZGl0b3JDYWxsYmFjazogKGVkaXRvciwgdmlldykgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBzZWwgPSBlZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgbGV0IGxpbmVzID0gdGhpcy5jbGVhckJsb2NrSURzKHNlbCk7XG4gICAgICAgICAgICAgICAgZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24oXG4gICAgICAgICAgICAgICAgICAgIGAke2xpbmVzfWBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgICAgICAgaWQ6IFwic2V0LWlkcy1ibG9ja1wiLFxuICAgICAgICAgICAgbmFtZTogXCJTZXQgcHJvamVjdCBpZHMgb24gQmxvY2tcIixcbiAgICAgICAgICAgIGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yLCB2aWV3KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5ibG9ja1VwZGF0ZShlZGl0b3IsIHRoaXMuZ2V0UHJlZml4KGVkaXRvciwgdmlldyksIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICAgICAgICBpZDogXCJjbGVhci1pZHMtYmxvY2tcIixcbiAgICAgICAgICAgIG5hbWU6IFwiQ2xlYXIgcHJvamVjdCBpZHMgb24gQmxvY2tcIixcbiAgICAgICAgICAgIGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yLCB2aWV3KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5ibG9ja1VwZGF0ZShlZGl0b3IsIHRoaXMuZ2V0UHJlZml4KGVkaXRvciwgdmlldyksIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICAvLyBUaGlzIGFkZHMgYSBzZXR0aW5ncyB0YWIgc28gdGhlIHVzZXIgY2FuIGNvbmZpZ3VyZSB2YXJpb3VzIGFzcGVjdHMgb2YgdGhlIHBsdWdpblxuICAgICAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IFNhbXBsZVNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgICAgICAvLyBXaGVuIHJlZ2lzdGVyaW5nIGludGVydmFscywgdGhpcyBmdW5jdGlvbiB3aWxsIGF1dG9tYXRpY2FsbHkgY2xlYXIgdGhlIGludGVydmFsIHdoZW4gdGhlIHBsdWdpbiBpcyBkaXNhYmxlZC5cbiAgICAgICAgdGhpcy5yZWdpc3RlckludGVydmFsKHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiBjb25zb2xlLmxvZygnc2V0SW50ZXJ2YWwnKSwgNSAqIDYwICogMTAwMCkpO1xuICAgIH1cblxuICAgIGJsb2NrVXBkYXRlKGVkaXRvcjogRWRpdG9yLCBwcmVmaXg6IHN0cmluZywgYWRkX2lkczogYm9vbGVhbikge1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yKCk7XG4gICAgICAgIGNvbnN0IGxpbmUgPSBlZGl0b3IuZ2V0TGluZShjdXJzb3IubGluZSk7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBibG9jayBib3VuZGFyaWVzXG4gICAgICAgIGxldCBibG9ja1N0YXJ0ID0gdGhpcy5nZXRCbG9ja1N0YXJ0KGVkaXRvcik7XG4gICAgICAgIGxldCBibG9ja0VuZCA9IHRoaXMuZ2V0QmxvY2tFbmQoZWRpdG9yKTtcbiAgICAgICAgbGV0IGxhc3RfbGluZV9sZW5ndGggPSBlZGl0b3IuZ2V0TGluZShibG9ja0VuZCArIDEpLmxlbmd0aDtcblxuICAgICAgICBjb25zdCBibG9ja0NvbnRlbnQgPSBlZGl0b3IuZ2V0UmFuZ2UoeyBsaW5lOiBibG9ja1N0YXJ0LCBjaDogMCB9LCB7IGxpbmU6IGJsb2NrRW5kLCBjaDogbGFzdF9saW5lX2xlbmd0aCB9KTtcbiAgICAgICAgaWYgKERFQlVHKSBjb25zb2xlLmxvZyhgU3RhcnQgJHtibG9ja1N0YXJ0fSwgRW5kICR7YmxvY2tFbmR9LCBsYXN0IGxlbmd0aCAke2xhc3RfbGluZV9sZW5ndGh9XFxuT3JpZzogJHtibG9ja0NvbnRlbnR9YCk7XG5cbiAgICAgICAgbGV0IGxpbmVzO1xuICAgICAgICBpZiAoYWRkX2lkcykge1xuICAgICAgICAgICAgbGluZXMgPSB0aGlzLmFkZFRhc2tJRHMoYmxvY2tDb250ZW50LCBwcmVmaXgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGluZXMgPSB0aGlzLmNsZWFyQmxvY2tJRHMoYmxvY2tDb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChERUJVRykgY29uc29sZS5sb2coYFN0YXJ0ICR7YmxvY2tTdGFydH0sIEVuZCAke2Jsb2NrRW5kfSwgbGFzdCBsZW5ndGggJHtsYXN0X2xpbmVfbGVuZ3RofVxcbk9yaWc6ICR7YmxvY2tDb250ZW50fVxcbk5ldzogJHtsaW5lc31gKTtcbiAgICAgICAgZWRpdG9yLnJlcGxhY2VSYW5nZShsaW5lcywgeyBsaW5lOiBibG9ja1N0YXJ0LCBjaDogMCB9LCB7IGxpbmU6IGJsb2NrRW5kLCBjaDogbGFzdF9saW5lX2xlbmd0aCB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEJsb2NrRW5kKGVkaXRvcjogRWRpdG9yKSB7XG4gICAgICAgIC8vIEZpbmQgdGhlIGVuZCBvZiB0aGUgYmxvY2tcbiAgICAgICAgbGV0IGJsb2NrRW5kID0gZWRpdG9yLmdldEN1cnNvcigpLmxpbmU7XG4gICAgICAgIHdoaWxlICghQkxPQ0tfQk9VTkRBUlkudGVzdChlZGl0b3IuZ2V0TGluZShibG9ja0VuZCkpKSB7XG4gICAgICAgICAgICBibG9ja0VuZCsrO1xuICAgICAgICAgICAgaWYgKGJsb2NrRW5kID4gZWRpdG9yLmxpbmVDb3VudCgpIC0gMSkgcmV0dXJuIGJsb2NrRW5kO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBibG9ja0VuZDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEJsb2NrU3RhcnQoZWRpdG9yOiBFZGl0b3IpIHtcbiAgICAgICAgLy8gRmluZCB0aGUgc3RhcnQgb2YgdGhlIGJsb2NrXG4gICAgICAgIGxldCBibG9ja1N0YXJ0ID0gZWRpdG9yLmdldEN1cnNvcigpLmxpbmU7XG4gICAgICAgIHdoaWxlIChibG9ja1N0YXJ0ID4gMCAmJiAhQkxPQ0tfQk9VTkRBUlkudGVzdChlZGl0b3IuZ2V0TGluZShibG9ja1N0YXJ0IC0gMSkpKSB7XG4gICAgICAgICAgICBibG9ja1N0YXJ0LS07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJsb2NrU3RhcnQ7XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVSYW5kb21EaWdpdHMobGVuZ3RoOiBudW1iZXIpOiBzdHJpbmcge1xuICAgICAgY29uc3QgZGlnaXRzID0gJzAxMjM0NTY3ODknO1xuICAgICAgbGV0IHJhbmRvbVN0cmluZyA9ICcnO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZGlnaXRzLmxlbmd0aCk7XG4gICAgICAgIHJhbmRvbVN0cmluZyArPSBkaWdpdHNbcmFuZG9tSW5kZXhdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmFuZG9tU3RyaW5nO1xuICAgIH1cblxuICAgIGNsZWFyQmxvY2tJRHMoc2VsOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gUmVtb3ZlIGV4aXN0aW5nIElEJ3NcbiAgICAgICAgbGV0IHJlbW92ZV9pZCA9IC9cXGg/XHVEODNDXHVERDk0XFxzXFx3K1xcaCovZztcbiAgICAgICAgc2VsID0gc2VsLnJlcGxhY2VBbGwocmVtb3ZlX2lkLCAnJyk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIGV4aXN0aW5nIEJsb2Nrc1xuICAgICAgICBsZXQgcmVtb3ZlX2Jsb2NrID0gL1xcaD9cdTI2RDRcXHNcXHcrXFxoKi9nO1xuICAgICAgICBzZWwgPSBzZWwucmVwbGFjZUFsbChyZW1vdmVfYmxvY2ssICcnKTtcblxuICAgICAgICByZXR1cm4gc2VsO1xuICAgIH1cblxuICAgIGdldFByZWZpeChlZGl0b3I6IEVkaXRvciwgdmlldzogTWFya2Rvd25GaWxlSW5mbykge1xuICAgICAgICBsZXQgcmF3X3ByZWZpeDtcbiAgICAgICAgc3dpdGNoICh0aGlzLnNldHRpbmdzLmlkUHJlZml4TWV0aG9kKSB7XG4gICAgICAgICAgICBjYXNlIFByZWZpeE1ldGhvZC5Vc2VQcmVmaXg6IHtcbiAgICAgICAgICAgICAgICByYXdfcHJlZml4ID0gdGhpcy5zZXR0aW5ncy5wcm9qZWN0UHJlZml4O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBQcmVmaXhNZXRob2QuRmlsZU5hbWU6IHtcbiAgICAgICAgICAgICAgICByYXdfcHJlZml4ID0gdGhpcy5nZXRGaWxlbmFtZSh2aWV3KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgUHJlZml4TWV0aG9kLlNlY3Rpb25OYW1lOiB7XG4gICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGZpbmQgdGhlIG5hbWUgb2YgdGhlIGJsb2NrIHRoYXQgY29udGFpbnMgdGhlIGN1cnNvciBvciB0aGUgc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgbGV0IHNlY3Rpb25fc3RhcnQgPSB0aGlzLmdldEJsb2NrU3RhcnQoZWRpdG9yKTtcbiAgICAgICAgICAgICAgICBsZXQgc2VjdGlvbl9saW5lO1xuICAgICAgICAgICAgICAgIGlmIChzZWN0aW9uX3N0YXJ0ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VjdGlvbl9saW5lID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWN0aW9uX2xpbmUgPSBlZGl0b3IuZ2V0TGluZShzZWN0aW9uX3N0YXJ0LTEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoREVCVUcpIGNvbnNvbGUubG9nKCdQcmVmaXggY2hlY2sgLi4gRm91bmQgc2VjdGlvbjogJywgc2VjdGlvbl9zdGFydCwgc2VjdGlvbl9saW5lKTtcblxuICAgICAgICAgICAgICAgIC8vIElzIHRoZXJlIGEgYmxvY2sgYXQgYWxsIG9yIGFyZSB3ZSBqdXN0IGluIGEgZmlsZSB3aXRoIG5vIGJsb2Nrc1xuICAgICAgICAgICAgICAgIGlmIChCTE9DS19CT1VOREFSWS50ZXN0KHNlY3Rpb25fbGluZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmF3X3ByZWZpeCA9IHNlY3Rpb25fbGluZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gdGhlIGZpbGVuYW1lIGFueXdheVxuICAgICAgICAgICAgICAgICAgICByYXdfcHJlZml4ID0gdGhpcy5nZXRGaWxlbmFtZSh2aWV3KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJlZml4RnJvbVN0cmluZyhyYXdfcHJlZml4KTtcbiAgICB9XG5cbiAgICBnZXRGaWxlbmFtZSh2aWV3OiBNYXJrZG93bkZpbGVJbmZvKSB7XG4gICAgICAgaWYgKCF2aWV3LmZpbGU/Lm5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLnByb2plY3RQcmVmaXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdmlldy5maWxlLm5hbWUuc3BsaXQoJy4nKVswXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFByZWZpeEZyb21TdHJpbmcodGV4dDogc3RyaW5nKSB7XG4gICAgICAgIC8vIFJlbW92ZSBhbnkgIyBzaWduc1xuICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlQWxsKFwiI1wiLCAnJyk7XG4gICAgICAgIC8vIE9ubHkgdXNlIHRoZSBmaXJzdCBsZXR0ZXJzIG9mIHdvcmRzIGlmIG5lZWRlZFxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5maXJzdExldHRlcnNPZldvcmRzKSB7XG4gICAgICAgICAgICBsZXQgd29yZHMgPSB0ZXh0LnNwbGl0KC9cXHMrLyk7XG4gICAgICAgICAgICBpZiAoREVCVUcpIGNvbnNvbGUubG9nKFwiZm91bmQgd29yZHNcIiwgd29yZHMpO1xuICAgICAgICAgICAgdGV4dCA9IFwiXCI7XG4gICAgICAgICAgICBmb3IgKGxldCB3b3JkIG9mIHdvcmRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGAke3RleHR9JHt3b3JkWzBdLnRvVXBwZXJDYXNlKCl9YDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gUmVtb3ZlIHNwYWNlc1xuICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlQWxsKCcgJywgJycpO1xuICAgICAgICAvLyBSZW1vdmUgdm93ZWxzIGlmIG5lZWRlZFxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5yZW1vdmVWb3dlbHMpIHtcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2VBbGwoL1thZWlvdV0vZywgJycpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZXh0O1xuICAgIH1cblxuICAgIGFkZFRhc2tJRHMoc2VsOiBzdHJpbmcsIHByZWZpeDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gL14oLVxcc1xcW1sgeFxcLVxcL11cXF1cXHMpPyguKikkL21nO1xuXG4gICAgICAgIC8vIENsZWFyIGFsbCB0aGUgZXhpc3RpbmcgYmxvY2sgYW5kIHByb2plY3QgSUQnc1xuICAgICAgICBzZWwgPSB0aGlzLmNsZWFyQmxvY2tJRHMoc2VsKTtcblxuICAgICAgICBpZiAoREVCVUcpIGNvbnNvbGUubG9nKGBSZXBsYWNlZCBpZHMgYW5kIGJsb2NrcyB0byBnaXZlOiAke3NlbH1gKTtcblxuICAgICAgICBjb25zdCBtYXRjaGVzID0gc2VsLm1hdGNoQWxsKHJlZ2V4KTtcbiAgICAgICAgbGV0IGxpbmVzID0gXCJcIjtcbiAgICAgICAgbGV0IGZpcnN0ID0gdHJ1ZTtcbiAgICAgICAgbGV0IGlkeCA9IDA7XG4gICAgICAgIGxldCB0aGlzX2lkO1xuICAgICAgICBsZXQgbGFzdF9pZDtcblxuICAgICAgICAvLyBHbyB0aHJvdWdoIGFsbCB0aGUgbGluZXMgYW5kIGFkZCBhcHByb3ByaWF0ZSBJRCBhbmQgYmxvY2sgdGFnc1xuICAgICAgICBmb3IgKGNvbnN0IG1hdGNoIG9mIG1hdGNoZXMpIHtcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHtcbiAgICAgICAgICAgICAgICBsaW5lcyArPSBcIlxcblwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gSXMgdGhpcyBhIHRhc2sgbGluZSBhdCBhbGw/XG4gICAgICAgICAgICBpZiAobWF0Y2hbMV0pIHtcbiAgICAgICAgICAgICAgICAvLyBHZXQgYW4gaWQgdG8gdXNlXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuaWRQcmVmaXhNZXRob2QgPT0gUHJlZml4TWV0aG9kLlVzZVByZWZpeCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzX2lkID0gdGhpcy5nZW5lcmF0ZVJhbmRvbURpZ2l0cyh0aGlzLnNldHRpbmdzLnJhbmRvbUlETGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzX2lkID0gYCR7aWR4fWA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgaWQgaW50byB0aGVyZVxuICAgICAgICAgICAgICAgIGxpbmVzICs9IGAke21hdGNoWzFdfSR7bWF0Y2hbMl0udHJpbSgpfSBcdUQ4M0NcdUREOTQgJHtwcmVmaXh9JHt0aGlzX2lkfWA7XG4gICAgICAgICAgICAgICAgaWYgKGlkeCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBibG9ja3MgYWZ0ZXIgdGhlIHZlcnkgZmlyc3QgdGFza1xuICAgICAgICAgICAgICAgICAgICBsaW5lcyArPSBgIFx1MjZENCAke3ByZWZpeH0ke2xhc3RfaWR9YDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICAgICAgbGFzdF9pZCA9IHRoaXNfaWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIE5vdCBhIHRhc2sgbGluZSBzbyBqdXN0IGtlZXAgaXQgYXMgaXNcbiAgICAgICAgICAgICAgICBsaW5lcyArPSBgJHttYXRjaFsyXS50cmltKCl9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpbmVzO1xuICAgIH1cblxuICAgIG9udW5sb2FkKCkge1xuXG4gICAgfVxuXG4gICAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgICB9XG5cbiAgICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gICAgfVxufVxuXG5jbGFzcyBTYW1wbGVNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgICBjb25zdHJ1Y3RvcihhcHA6IEFwcCkge1xuICAgICAgICBzdXBlcihhcHApO1xuICAgIH1cblxuICAgIG9uT3BlbigpIHtcbiAgICAgICAgY29uc3Qge2NvbnRlbnRFbH0gPSB0aGlzO1xuICAgICAgICBjb250ZW50RWwuc2V0VGV4dCgnV29haCEnKTtcbiAgICB9XG5cbiAgICBvbkNsb3NlKCkge1xuICAgICAgICBjb25zdCB7Y29udGVudEVsfSA9IHRoaXM7XG4gICAgICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIH1cbn1cblxuY2xhc3MgU2FtcGxlU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICAgIHBsdWdpbjogUHJvamVjdFRhc2tzO1xuXG4gICAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogUHJvamVjdFRhc2tzKSB7XG4gICAgICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgfVxuXG4gICAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qge2NvbnRhaW5lckVsfSA9IHRoaXM7XG5cbiAgICAgICAgY29udGFpbmVyRWwuZW1wdHkoKTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKCdQcm9qZWN0IElEIG1ldGhvZCcpXG4gICAgICAgICAgICAuc2V0RGVzYygnQ2hvb3NlIGhvdyB0aGUgSUQgd2lsbCBiZSBkZXRlcm1pbmVkJylcbiAgICAgICAgICAgIC5hZGREcm9wZG93bihkcm9wRG93biA9PiB7XG4gICAgICAgICAgICAgICAgZHJvcERvd24uYWRkT3B0aW9uKCcxJywgJ1VzZSBwcmVmaXgnKTtcbiAgICAgICAgICAgICAgICBkcm9wRG93bi5hZGRPcHRpb24oJzInLCAnVXNlIFNlY3Rpb24gbmFtZScpO1xuICAgICAgICAgICAgICAgIGRyb3BEb3duLmFkZE9wdGlvbignMycsICdVc2UgZmlsZW5hbWUnKVxuICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pZFByZWZpeE1ldGhvZClcbiAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmlkUHJlZml4TWV0aG9kID0gdmFsdWUgYXMgUHJlZml4TWV0aG9kO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICB9KX0pO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoJ1Byb2plY3QgSUQgcHJlZml4JylcbiAgICAgICAgICAgIC5zZXREZXNjKCdQcmVmaXggdG8gdXNlIHdoZW4gY3JlYXRpbmcgYW4gSUQgZm9yIGEgdGFzaycpXG4gICAgICAgICAgICAuYWRkVGV4dCh0ZXh0ID0+IHRleHRcbiAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ0lEIHByZWZpeCcpXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnByb2plY3RQcmVmaXgpXG4gICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wcm9qZWN0UHJlZml4ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKCdMZW5ndGggb2YgcmFuZG9tIElEIG51bWJlcicpXG4gICAgICAgICAgICAuc2V0RGVzYygnSG93IG1hbnkgZGlnaXRzIHRvIHVzZSBmb3IgcmFuZG9tIElEIHdoZW4gdXNpbmcgYSBmaXhlZCBwcmVmaXgnKVxuICAgICAgICAgICAgLmFkZFNsaWRlcih0ZXh0ID0+IHRleHRcbiAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmFuZG9tSURMZW5ndGgpXG4gICAgICAgICAgICAgICAgLnNldExpbWl0cygzLCA2LCAxKVxuICAgICAgICAgICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yYW5kb21JRExlbmd0aCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgICAuc2V0TmFtZSgnUmVtb3ZlIHZvd2VscycpXG4gICAgICAgICAgICAuc2V0RGVzYygnUmVtb3ZlIHZvd2VscyBmcm9tIHRoZSBwcmVmaXggd2hlbiBnZXR0aW5nIGZyb20gdGhlIGZpbGVuYW1lIG9yIGJsb2NrIG5hbWUnKVxuICAgICAgICAgICAgLmFkZFRvZ2dsZSh0ZXh0ID0+IHRleHRcbiAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVtb3ZlVm93ZWxzKVxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVtb3ZlVm93ZWxzID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKCdGaXJzdCBsZXR0ZXIgb2Ygd29yZHMnKVxuICAgICAgICAgICAgLnNldERlc2MoJ09ubHkgdXNlIHRoZSBmaXJzdCBsZXR0ZXIgb2Ygd29yZHMgdG8gZm9ybSB0aGUgcHJlZml4JylcbiAgICAgICAgICAgIC5hZGRUb2dnbGUodGV4dCA9PiB0ZXh0XG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmZpcnN0TGV0dGVyc09mV29yZHMpXG4gICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5maXJzdExldHRlcnNPZldvcmRzID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgIH0p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
