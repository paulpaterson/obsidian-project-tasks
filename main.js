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
var RANDOM_LENGTH = 6;
var DEFAULT_SETTINGS = {
  idPrefixMethod: "1" /* UsePrefix */,
  projectPrefix: "prj"
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
    while (blockEnd < editor.lineCount() - 1 && !BLOCK_BOUNDARY.test(editor.getLine(blockEnd + 1))) {
      blockEnd++;
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
    text = text.replaceAll(" ", "");
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
          this_id = this.generateRandomDigits(RANDOM_LENGTH);
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
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgICBBcHAsXG4gICAgRWRpdG9yLFxuICAgIEVkaXRvclBvc2l0aW9uLCBNYXJrZG93bkZpbGVJbmZvLFxuICAgIE1hcmtkb3duVmlldyxcbiAgICBNb2RhbCxcbiAgICBOb3RpY2UsXG4gICAgUGx1Z2luLFxuICAgIFBsdWdpblNldHRpbmdUYWIsXG4gICAgU2V0dGluZyxcbiAgICBWaWV3XG59IGZyb20gJ29ic2lkaWFuJztcblxuLy8gVHVybiBvbiB0byBhbGxvdyBkZWJ1Z2dpbmcgaW4gdGhlIGNvbnNvbGVcbmNvbnN0IERFQlVHID0gdHJ1ZTtcbi8vIFJlZ2V4IGZvciBibG9jayBib3VuZGFyeVxuY29uc3QgQkxPQ0tfQk9VTkRBUlkgPSAvXiMrXFxzLztcbi8vIE51bWJlciBvZiBkaWdpdHMgdG8gdXNlIGZvciBhIHJhbmRvbSBwcmVmaXhcbmNvbnN0IFJBTkRPTV9MRU5HVEggPSA2O1xuXG5cbmVudW0gUHJlZml4TWV0aG9kIHtcbiAgICBVc2VQcmVmaXg9ICcxJyxcbiAgICBTZWN0aW9uTmFtZSA9ICcyJyxcbiAgICBGaWxlTmFtZSA9ICczJ1xufVxuXG5pbnRlcmZhY2UgTXlQbHVnaW5TZXR0aW5ncyB7XG4gICAgaWRQcmVmaXhNZXRob2Q6IFByZWZpeE1ldGhvZDtcbiAgICBwcm9qZWN0UHJlZml4OiBzdHJpbmc7XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IE15UGx1Z2luU2V0dGluZ3MgPSB7XG4gICAgaWRQcmVmaXhNZXRob2Q6IFByZWZpeE1ldGhvZC5Vc2VQcmVmaXgsXG4gICAgcHJvamVjdFByZWZpeDogJ3Byaidcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJvamVjdFRhc2tzIGV4dGVuZHMgUGx1Z2luIHtcbiAgICBzZXR0aW5nczogTXlQbHVnaW5TZXR0aW5ncztcblxuICAgIGFzeW5jIG9ubG9hZCgpIHtcbiAgICAgICAgaWYgKERFQlVHKSBjb25zb2xlLmxvZygnUHJvamVjdCBUYXNrcyBzdGFydGluZycpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICAgICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgICAgICAgIGlkOiBcInNldC1pZHNcIixcbiAgICAgICAgICAgIG5hbWU6IFwiU2V0IHByb2plY3QgaWRzIG9uIFNlbGVjdGlvblwiLFxuICAgICAgICAgICAgZWRpdG9yQ2FsbGJhY2s6IChlZGl0b3IsIHZpZXcpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgc2VsID0gZWRpdG9yLmdldFNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgIGxldCBsaW5lcyA9IHRoaXMuYWRkVGFza0lEcyhzZWwsIHRoaXMuZ2V0UHJlZml4KGVkaXRvciwgdmlldykpO1xuICAgICAgICAgICAgICAgIGVkaXRvci5yZXBsYWNlU2VsZWN0aW9uKFxuICAgICAgICAgICAgICAgICAgICBgJHtsaW5lc31gXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgICAgICAgIGlkOiBcImNsZWFyLWlkc1wiLFxuICAgICAgICAgICAgbmFtZTogXCJDbGVhciBwcm9qZWN0IGlkcyBvbiBTZWxlY3Rpb25cIixcbiAgICAgICAgICAgIGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yLCB2aWV3KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHNlbCA9IGVkaXRvci5nZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICBsZXQgbGluZXMgPSB0aGlzLmNsZWFyQmxvY2tJRHMoc2VsKTtcbiAgICAgICAgICAgICAgICBlZGl0b3IucmVwbGFjZVNlbGVjdGlvbihcbiAgICAgICAgICAgICAgICAgICAgYCR7bGluZXN9YFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICAgICAgICBpZDogXCJzZXQtaWRzLWJsb2NrXCIsXG4gICAgICAgICAgICBuYW1lOiBcIlNldCBwcm9qZWN0IGlkcyBvbiBCbG9ja1wiLFxuICAgICAgICAgICAgZWRpdG9yQ2FsbGJhY2s6IChlZGl0b3IsIHZpZXcpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2NrVXBkYXRlKGVkaXRvciwgdGhpcy5nZXRQcmVmaXgoZWRpdG9yLCB2aWV3KSwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgICAgICAgIGlkOiBcImNsZWFyLWlkcy1ibG9ja1wiLFxuICAgICAgICAgICAgbmFtZTogXCJDbGVhciBwcm9qZWN0IGlkcyBvbiBCbG9ja1wiLFxuICAgICAgICAgICAgZWRpdG9yQ2FsbGJhY2s6IChlZGl0b3IsIHZpZXcpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2NrVXBkYXRlKGVkaXRvciwgdGhpcy5nZXRQcmVmaXgoZWRpdG9yLCB2aWV3KSwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIFRoaXMgYWRkcyBhIHNldHRpbmdzIHRhYiBzbyB0aGUgdXNlciBjYW4gY29uZmlndXJlIHZhcmlvdXMgYXNwZWN0cyBvZiB0aGUgcGx1Z2luXG4gICAgICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgU2FtcGxlU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuXG4gICAgICAgIC8vIFdoZW4gcmVnaXN0ZXJpbmcgaW50ZXJ2YWxzLCB0aGlzIGZ1bmN0aW9uIHdpbGwgYXV0b21hdGljYWxseSBjbGVhciB0aGUgaW50ZXJ2YWwgd2hlbiB0aGUgcGx1Z2luIGlzIGRpc2FibGVkLlxuICAgICAgICB0aGlzLnJlZ2lzdGVySW50ZXJ2YWwod2luZG93LnNldEludGVydmFsKCgpID0+IGNvbnNvbGUubG9nKCdzZXRJbnRlcnZhbCcpLCA1ICogNjAgKiAxMDAwKSk7XG4gICAgfVxuXG4gICAgYmxvY2tVcGRhdGUoZWRpdG9yOiBFZGl0b3IsIHByZWZpeDogc3RyaW5nLCBhZGRfaWRzOiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3IoKTtcbiAgICAgICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRMaW5lKGN1cnNvci5saW5lKTtcblxuICAgICAgICAvLyBHZXQgdGhlIGJsb2NrIGJvdW5kYXJpZXNcbiAgICAgICAgbGV0IGJsb2NrU3RhcnQgPSB0aGlzLmdldEJsb2NrU3RhcnQoZWRpdG9yKTtcbiAgICAgICAgbGV0IGJsb2NrRW5kID0gdGhpcy5nZXRCbG9ja0VuZChlZGl0b3IpO1xuICAgICAgICBsZXQgbGFzdF9saW5lX2xlbmd0aCA9IGVkaXRvci5nZXRMaW5lKGJsb2NrRW5kICsgMSkubGVuZ3RoO1xuXG4gICAgICAgIGNvbnN0IGJsb2NrQ29udGVudCA9IGVkaXRvci5nZXRSYW5nZSh7IGxpbmU6IGJsb2NrU3RhcnQsIGNoOiAwIH0sIHsgbGluZTogYmxvY2tFbmQsIGNoOiBsYXN0X2xpbmVfbGVuZ3RoIH0pO1xuXG4gICAgICAgIGxldCBsaW5lcztcbiAgICAgICAgaWYgKGFkZF9pZHMpIHtcbiAgICAgICAgICAgIGxpbmVzID0gdGhpcy5hZGRUYXNrSURzKGJsb2NrQ29udGVudCwgcHJlZml4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxpbmVzID0gdGhpcy5jbGVhckJsb2NrSURzKGJsb2NrQ29udGVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoREVCVUcpIGNvbnNvbGUubG9nKGBTdGFydCAke2Jsb2NrU3RhcnR9LCBFbmQgJHtibG9ja0VuZH0sIGxhc3QgbGVuZ3RoICR7bGFzdF9saW5lX2xlbmd0aH1cXG5PcmlnOiAke2Jsb2NrQ29udGVudH1cXG5OZXc6ICR7bGluZXN9YCk7XG4gICAgICAgIGVkaXRvci5yZXBsYWNlUmFuZ2UobGluZXMsIHsgbGluZTogYmxvY2tTdGFydCwgY2g6IDAgfSwgeyBsaW5lOiBibG9ja0VuZCwgY2g6IGxhc3RfbGluZV9sZW5ndGggfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRCbG9ja0VuZChlZGl0b3I6IEVkaXRvcikge1xuICAgICAgICAvLyBGaW5kIHRoZSBlbmQgb2YgdGhlIGJsb2NrXG4gICAgICAgIGxldCBibG9ja0VuZCA9IGVkaXRvci5nZXRDdXJzb3IoKS5saW5lO1xuICAgICAgICB3aGlsZSAoYmxvY2tFbmQgPCBlZGl0b3IubGluZUNvdW50KCkgLSAxICYmICFCTE9DS19CT1VOREFSWS50ZXN0KGVkaXRvci5nZXRMaW5lKGJsb2NrRW5kICsgMSkpKSB7XG4gICAgICAgICAgICBibG9ja0VuZCsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBibG9ja0VuZDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEJsb2NrU3RhcnQoZWRpdG9yOiBFZGl0b3IpIHtcbiAgICAgICAgLy8gRmluZCB0aGUgc3RhcnQgb2YgdGhlIGJsb2NrXG4gICAgICAgIGxldCBibG9ja1N0YXJ0ID0gZWRpdG9yLmdldEN1cnNvcigpLmxpbmU7XG4gICAgICAgIHdoaWxlIChibG9ja1N0YXJ0ID4gMCAmJiAhQkxPQ0tfQk9VTkRBUlkudGVzdChlZGl0b3IuZ2V0TGluZShibG9ja1N0YXJ0IC0gMSkpKSB7XG4gICAgICAgICAgICBibG9ja1N0YXJ0LS07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJsb2NrU3RhcnQ7XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVSYW5kb21EaWdpdHMobGVuZ3RoOiBudW1iZXIpOiBzdHJpbmcge1xuICAgICAgY29uc3QgZGlnaXRzID0gJzAxMjM0NTY3ODknO1xuICAgICAgbGV0IHJhbmRvbVN0cmluZyA9ICcnO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZGlnaXRzLmxlbmd0aCk7XG4gICAgICAgIHJhbmRvbVN0cmluZyArPSBkaWdpdHNbcmFuZG9tSW5kZXhdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmFuZG9tU3RyaW5nO1xuICAgIH1cblxuICAgIGNsZWFyQmxvY2tJRHMoc2VsOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gUmVtb3ZlIGV4aXN0aW5nIElEJ3NcbiAgICAgICAgbGV0IHJlbW92ZV9pZCA9IC9cXGg/XHVEODNDXHVERDk0XFxzXFx3K1xcaCovZztcbiAgICAgICAgc2VsID0gc2VsLnJlcGxhY2VBbGwocmVtb3ZlX2lkLCAnJyk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIGV4aXN0aW5nIEJsb2Nrc1xuICAgICAgICBsZXQgcmVtb3ZlX2Jsb2NrID0gL1xcaD9cdTI2RDRcXHNcXHcrXFxoKi9nO1xuICAgICAgICBzZWwgPSBzZWwucmVwbGFjZUFsbChyZW1vdmVfYmxvY2ssICcnKTtcblxuICAgICAgICByZXR1cm4gc2VsO1xuICAgIH1cblxuICAgIGdldFByZWZpeChlZGl0b3I6IEVkaXRvciwgdmlldzogTWFya2Rvd25GaWxlSW5mbykge1xuICAgICAgICBsZXQgcmF3X3ByZWZpeDtcbiAgICAgICAgc3dpdGNoICh0aGlzLnNldHRpbmdzLmlkUHJlZml4TWV0aG9kKSB7XG4gICAgICAgICAgICBjYXNlIFByZWZpeE1ldGhvZC5Vc2VQcmVmaXg6IHtcbiAgICAgICAgICAgICAgICByYXdfcHJlZml4ID0gdGhpcy5zZXR0aW5ncy5wcm9qZWN0UHJlZml4O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBQcmVmaXhNZXRob2QuRmlsZU5hbWU6IHtcbiAgICAgICAgICAgICAgICByYXdfcHJlZml4ID0gdGhpcy5nZXRGaWxlbmFtZSh2aWV3KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgUHJlZml4TWV0aG9kLlNlY3Rpb25OYW1lOiB7XG4gICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGZpbmQgdGhlIG5hbWUgb2YgdGhlIGJsb2NrIHRoYXQgY29udGFpbnMgdGhlIGN1cnNvciBvciB0aGUgc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgbGV0IHNlY3Rpb25fc3RhcnQgPSB0aGlzLmdldEJsb2NrU3RhcnQoZWRpdG9yKTtcbiAgICAgICAgICAgICAgICBsZXQgc2VjdGlvbl9saW5lO1xuICAgICAgICAgICAgICAgIGlmIChzZWN0aW9uX3N0YXJ0ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VjdGlvbl9saW5lID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWN0aW9uX2xpbmUgPSBlZGl0b3IuZ2V0TGluZShzZWN0aW9uX3N0YXJ0LTEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoREVCVUcpIGNvbnNvbGUubG9nKCdQcmVmaXggY2hlY2sgLi4gRm91bmQgc2VjdGlvbjogJywgc2VjdGlvbl9zdGFydCwgc2VjdGlvbl9saW5lKTtcblxuICAgICAgICAgICAgICAgIC8vIElzIHRoZXJlIGEgYmxvY2sgYXQgYWxsIG9yIGFyZSB3ZSBqdXN0IGluIGEgZmlsZSB3aXRoIG5vIGJsb2Nrc1xuICAgICAgICAgICAgICAgIGlmIChCTE9DS19CT1VOREFSWS50ZXN0KHNlY3Rpb25fbGluZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmF3X3ByZWZpeCA9IHNlY3Rpb25fbGluZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gdGhlIGZpbGVuYW1lIGFueXdheVxuICAgICAgICAgICAgICAgICAgICByYXdfcHJlZml4ID0gdGhpcy5nZXRGaWxlbmFtZSh2aWV3KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJlZml4RnJvbVN0cmluZyhyYXdfcHJlZml4KTtcbiAgICB9XG5cbiAgICBnZXRGaWxlbmFtZSh2aWV3OiBNYXJrZG93bkZpbGVJbmZvKSB7XG4gICAgICAgaWYgKCF2aWV3LmZpbGU/Lm5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLnByb2plY3RQcmVmaXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdmlldy5maWxlLm5hbWUuc3BsaXQoJy4nKVswXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFByZWZpeEZyb21TdHJpbmcodGV4dDogc3RyaW5nKSB7XG4gICAgICAgIC8vIFJlbW92ZSBhbnkgIyBzaWduc1xuICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlQWxsKFwiI1wiLCAnJyk7XG4gICAgICAgIC8vIFJlbW92ZSBzcGFjZXNcbiAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZUFsbCgnICcsICcnKTtcblxuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG5cbiAgICBhZGRUYXNrSURzKHNlbDogc3RyaW5nLCBwcmVmaXg6IHN0cmluZykge1xuICAgICAgICBjb25zdCByZWdleCA9IC9eKC1cXHNcXFtbIHhcXC1cXC9dXFxdXFxzKT8oLiopJC9tZztcblxuICAgICAgICAvLyBDbGVhciBhbGwgdGhlIGV4aXN0aW5nIGJsb2NrIGFuZCBwcm9qZWN0IElEJ3NcbiAgICAgICAgc2VsID0gdGhpcy5jbGVhckJsb2NrSURzKHNlbCk7XG5cbiAgICAgICAgaWYgKERFQlVHKSBjb25zb2xlLmxvZyhgUmVwbGFjZWQgaWRzIGFuZCBibG9ja3MgdG8gZ2l2ZTogJHtzZWx9YCk7XG5cbiAgICAgICAgY29uc3QgbWF0Y2hlcyA9IHNlbC5tYXRjaEFsbChyZWdleCk7XG4gICAgICAgIGxldCBsaW5lcyA9IFwiXCI7XG4gICAgICAgIGxldCBmaXJzdCA9IHRydWU7XG4gICAgICAgIGxldCBpZHggPSAwO1xuICAgICAgICBsZXQgdGhpc19pZDtcbiAgICAgICAgbGV0IGxhc3RfaWQ7XG5cbiAgICAgICAgLy8gR28gdGhyb3VnaCBhbGwgdGhlIGxpbmVzIGFuZCBhZGQgYXBwcm9wcmlhdGUgSUQgYW5kIGJsb2NrIHRhZ3NcbiAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBtYXRjaGVzKSB7XG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7XG4gICAgICAgICAgICAgICAgbGluZXMgKz0gXCJcXG5cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIElzIHRoaXMgYSB0YXNrIGxpbmUgYXQgYWxsP1xuICAgICAgICAgICAgaWYgKG1hdGNoWzFdKSB7XG4gICAgICAgICAgICAgICAgLy8gR2V0IGFuIGlkIHRvIHVzZVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmlkUHJlZml4TWV0aG9kID09IFByZWZpeE1ldGhvZC5Vc2VQcmVmaXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc19pZCA9IHRoaXMuZ2VuZXJhdGVSYW5kb21EaWdpdHMoUkFORE9NX0xFTkdUSCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc19pZCA9IGAke2lkeH1gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGlkIGludG8gdGhlcmVcbiAgICAgICAgICAgICAgICBsaW5lcyArPSBgJHttYXRjaFsxXX0ke21hdGNoWzJdLnRyaW0oKX0gXHVEODNDXHVERDk0ICR7cHJlZml4fSR7dGhpc19pZH1gO1xuICAgICAgICAgICAgICAgIGlmIChpZHggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgYmxvY2tzIGFmdGVyIHRoZSB2ZXJ5IGZpcnN0IHRhc2tcbiAgICAgICAgICAgICAgICAgICAgbGluZXMgKz0gYCBcdTI2RDQgJHtwcmVmaXh9JHtsYXN0X2lkfWA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgICAgICAgIGxhc3RfaWQgPSB0aGlzX2lkO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBOb3QgYSB0YXNrIGxpbmUgc28ganVzdCBrZWVwIGl0IGFzIGlzXG4gICAgICAgICAgICAgICAgbGluZXMgKz0gYCR7bWF0Y2hbMl0udHJpbSgpfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaW5lcztcbiAgICB9XG5cbiAgICBvbnVubG9hZCgpIHtcblxuICAgIH1cblxuICAgIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gICAgfVxuXG4gICAgYXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuICAgICAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgIH1cbn1cblxuY2xhc3MgU2FtcGxlTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gICAgY29uc3RydWN0b3IoYXBwOiBBcHApIHtcbiAgICAgICAgc3VwZXIoYXBwKTtcbiAgICB9XG5cbiAgICBvbk9wZW4oKSB7XG4gICAgICAgIGNvbnN0IHtjb250ZW50RWx9ID0gdGhpcztcbiAgICAgICAgY29udGVudEVsLnNldFRleHQoJ1dvYWghJyk7XG4gICAgfVxuXG4gICAgb25DbG9zZSgpIHtcbiAgICAgICAgY29uc3Qge2NvbnRlbnRFbH0gPSB0aGlzO1xuICAgICAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICB9XG59XG5cbmNsYXNzIFNhbXBsZVNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgICBwbHVnaW46IFByb2plY3RUYXNrcztcblxuICAgIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IFByb2plY3RUYXNrcykge1xuICAgICAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgIH1cblxuICAgIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHtjb250YWluZXJFbH0gPSB0aGlzO1xuXG4gICAgICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG5cbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgICAuc2V0TmFtZSgnUHJvamVjdCBJRCBtZXRob2QnKVxuICAgICAgICAgICAgLnNldERlc2MoJ0Nob29zZSBob3cgdGhlIElEIHdpbGwgYmUgZGV0ZXJtaW5lZCcpXG4gICAgICAgICAgICAuYWRkRHJvcGRvd24oZHJvcERvd24gPT4ge1xuICAgICAgICAgICAgICAgIGRyb3BEb3duLmFkZE9wdGlvbignMScsICdVc2UgcHJlZml4Jyk7XG4gICAgICAgICAgICAgICAgZHJvcERvd24uYWRkT3B0aW9uKCcyJywgJ1VzZSBTZWN0aW9uIG5hbWUnKTtcbiAgICAgICAgICAgICAgICBkcm9wRG93bi5hZGRPcHRpb24oJzMnLCAnVXNlIGZpbGVuYW1lJylcbiAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaWRQcmVmaXhNZXRob2QpXG4gICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pZFByZWZpeE1ldGhvZCA9IHZhbHVlIGFzIFByZWZpeE1ldGhvZDtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgfSl9KTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKCdQcm9qZWN0IElEIHByZWZpeCcpXG4gICAgICAgICAgICAuc2V0RGVzYygnUHJlZml4IHRvIHVzZSB3aGVuIGNyZWF0aW5nIGFuIElEIGZvciBhIHRhc2snKVxuICAgICAgICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XG4gICAgICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCdJRCBwcmVmaXgnKVxuICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wcm9qZWN0UHJlZml4KVxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucHJvamVjdFByZWZpeCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHNCQVdPO0FBR1AsSUFBTSxRQUFRO0FBRWQsSUFBTSxpQkFBaUI7QUFFdkIsSUFBTSxnQkFBZ0I7QUFjdEIsSUFBTSxtQkFBcUM7QUFBQSxFQUN2QyxnQkFBZ0I7QUFBQSxFQUNoQixlQUFlO0FBQ25CO0FBRUEsSUFBcUIsZUFBckIsY0FBMEMsdUJBQU87QUFBQSxFQUc3QyxNQUFNLFNBQVM7QUFDWCxRQUFJO0FBQU8sY0FBUSxJQUFJLHdCQUF3QjtBQUUvQyxVQUFNLEtBQUssYUFBYTtBQUV4QixTQUFLLFdBQVc7QUFBQSxNQUNaLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLGdCQUFnQixDQUFDLFFBQVEsU0FBUztBQUM5QixZQUFJLE1BQU0sT0FBTyxhQUFhO0FBQzlCLFlBQUksUUFBUSxLQUFLLFdBQVcsS0FBSyxLQUFLLFVBQVUsUUFBUSxJQUFJLENBQUM7QUFDN0QsZUFBTztBQUFBLFVBQ0gsR0FBRztBQUFBLFFB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
