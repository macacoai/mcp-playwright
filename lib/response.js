/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { renderModalStates } from './tab.js';
export class Response {
    _result = [];
    _code = [];
    _images = [];
    _context;
    _includeSnapshot = false;
    _includeTabs = false;
    _tabSnapshot;
    toolName;
    toolArgs;
    _isError;
    constructor(context, toolName, toolArgs) {
        this._context = context;
        this.toolName = toolName;
        this.toolArgs = toolArgs;
    }
    addResult(result) {
        this._result.push(result);
    }
    addError(error) {
        this._result.push(error);
        this._isError = true;
    }
    isError() {
        return this._isError;
    }
    result() {
        return this._result.join('\n');
    }
    addCode(code) {
        this._code.push(code);
    }
    code() {
        return this._code.join('\n');
    }
    addImage(image) {
        this._images.push(image);
    }
    images() {
        return this._images;
    }
    setIncludeSnapshot() {
        this._includeSnapshot = true;
    }
    setIncludeTabs() {
        this._includeTabs = true;
    }
    async finish() {
        // All the async snapshotting post-action is happening here.
        // Everything below should race against modal states.
        if (this._includeSnapshot && this._context.currentTab())
            this._tabSnapshot = await this._context.currentTabOrDie().captureSnapshot();
        for (const tab of this._context.tabs())
            await tab.updateTitle();
    }
    tabSnapshot() {
        return this._tabSnapshot;
    }
    serialize() {
        const jsonResponse = {
            toolName: this.toolName,
            toolArgs: this.toolArgs,
            isError: this._isError,
            result: this._result.length ? this._result : null,
            code: this._code.length ? this._code : null,
            tabs: null,
            pageState: null,
            modalStates: null,
            images: []
        };

        // Add tabs information
        if (this._includeSnapshot || this._includeTabs) {
            const tabsData = renderTabsJson(this._context.tabs(), this._includeTabs);
            if (tabsData) {
                jsonResponse.tabs = tabsData;
            }
        }

        // Add snapshot and modal states information
        if (this._tabSnapshot?.modalStates.length) {
            jsonResponse.modalStates = this._tabSnapshot.modalStates;
        } else if (this._tabSnapshot) {
            jsonResponse.pageState = renderTabSnapshotJson(this._tabSnapshot);
        }

        // Add image attachments
        if (this._context.config.imageResponses !== 'omit') {
            for (const image of this._images) {
                jsonResponse.images.push({
                    type: 'image',
                    data: image.data.toString('base64'),
                    mimeType: image.contentType
                });
            }
        }

        return {
            content: jsonResponse,
            isError: this._isError
        };
    }
}

/**
 * Filters out empty generic elements from aria snapshot to improve readability
 * @param {string} ariaSnapshot - The original aria snapshot string
 * @returns {string} - Filtered aria snapshot with empty generic elements removed
 */
function filterEmptyGenericElementsIntelligent(ariaSnapshot) {
    const lines = ariaSnapshot.split('\n');
    
    // Function to check if a line has useful content recursively
    function hasUsefulContent(lineIndex) {
        const line = lines[lineIndex];
        const trimmedLine = line.trim();
        
        // If it's not a generic element, it's useful
        if (!trimmedLine.startsWith('- generic [ref=')) {
            return trimmedLine.length > 0;
        }
        
        // If it's a generic with text after the colon, it's useful
        const match = trimmedLine.match(/^- generic \[ref=\w+\]:\s*(.+)$/);
        if (match && match[1].trim().length > 0) {
            return true;
        }
        
        // If it's an empty generic, check if any descendant is useful
        const currentIndent = line.length - line.trimStart().length;
        
        for (let i = lineIndex + 1; i < lines.length; i++) {
            const nextLine = lines[i];
            const nextIndent = nextLine.length - nextLine.trimStart().length;
            
            // If we've gone back to same or less indentation, stop looking
            if (nextIndent <= currentIndent && nextLine.trim()) {
                break;
            }
            
            // If this descendant is useful, then the parent is useful too
            if (nextIndent > currentIndent && hasUsefulContent(i)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Filter lines keeping only useful ones
    const result = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '' || hasUsefulContent(i)) {
            result.push(lines[i]);
        }
    }
    
    return result.join('\n');
}

function renderTabSnapshotJson(tabSnapshot) {
    const snapshotData = {
        url: tabSnapshot.url,
        title: tabSnapshot.title,
        ariaSnapshot: filterEmptyGenericElementsIntelligent(tabSnapshot.ariaSnapshot)
    };

    if (tabSnapshot.consoleMessages.length) {
        snapshotData.consoleMessages = tabSnapshot.consoleMessages.map(message => 
            trim(message.toString(), 100)
        );
    }

    if (tabSnapshot.downloads.length) {
        snapshotData.downloads = tabSnapshot.downloads.map(entry => ({
            filename: entry.download.suggestedFilename(),
            outputFile: entry.outputFile,
            finished: entry.finished
        }));
    }

    return snapshotData;
}

function renderTabsJson(tabs, force = false) {
    if (tabs.length === 1 && !force)
        return null;
    
    if (!tabs.length) {
        return {
            message: 'No open tabs. Use the "browser_navigate" tool to navigate to a page first.',
            tabs: []
        };
    }

    return {
        tabs: tabs.map((tab, index) => ({
            index,
            title: tab.lastTitle(),
            url: tab.page.url(),
            isCurrent: tab.isCurrentTab()
        }))
    };
}

// Legacy functions kept for backward compatibility if needed elsewhere
function renderTabSnapshot(tabSnapshot) {
    const lines = [];
    if (tabSnapshot.consoleMessages.length) {
        lines.push(`### New console messages`);
        for (const message of tabSnapshot.consoleMessages)
            lines.push(`- ${trim(message.toString(), 100)}`);
        lines.push('');
    }
    if (tabSnapshot.downloads.length) {
        lines.push(`### Downloads`);
        for (const entry of tabSnapshot.downloads) {
            if (entry.finished)
                lines.push(`- Downloaded file ${entry.download.suggestedFilename()} to ${entry.outputFile}`);
            else
                lines.push(`- Downloading file ${entry.download.suggestedFilename()} ...`);
        }
        lines.push('');
    }
    lines.push(`### Page state`);
    lines.push(`- Page URL: ${tabSnapshot.url}`);
    lines.push(`- Page Title: ${tabSnapshot.title}`);
    lines.push(`- Page Snapshot:`);
    lines.push('```yaml');
    lines.push(tabSnapshot.ariaSnapshot);
    lines.push('```');
    return lines.join('\n');
}
function renderTabsMarkdown(tabs, force = false) {
    if (tabs.length === 1 && !force)
        return [];
    if (!tabs.length) {
        return [
            '### Open tabs',
            'No open tabs. Use the "browser_navigate" tool to navigate to a page first.',
            '',
        ];
    }
    const lines = ['### Open tabs'];
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const current = tab.isCurrentTab() ? ' (current)' : '';
        lines.push(`- ${i}:${current} [${tab.lastTitle()}] (${tab.page.url()})`);
    }
    lines.push('');
    return lines;
}
function trim(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength) + '...';
}
