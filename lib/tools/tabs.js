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
import { z } from 'zod';
import { defineTool } from './tool.js';
const listTabs = defineTool({
    capability: 'core-tabs',
    schema: {
        name: 'browser_tab_list',
        title: 'List browser tabs',
        description: 'Retrieve information about all currently open browser tabs, including their URLs, titles, and active status. This tool provides a comprehensive overview of the browser session state.',
        inputSchema: z.object({}),
        type: 'readOnly',
    },
    handle: async (context, params, response) => {
        await context.ensureTab();
        response.setIncludeTabs();
    },
});
const selectTab = defineTool({
    capability: 'core-tabs',
    schema: {
        name: 'browser_tab_select',
        title: 'Select browser tab',
        description: 'Switch to a specific browser tab by its index position. After selecting the tab, automatically captures a page snapshot to provide the current state of the selected tab.',
        inputSchema: z.object({
            index: z.number().describe('The zero-based index of the tab to select (0 for first tab, 1 for second tab, etc.)'),
        }),
        type: 'readOnly',
    },
    handle: async (context, params, response) => {
        await context.selectTab(params.index);
        response.setIncludeSnapshot();
    },
});
const newTab = defineTool({
    capability: 'core-tabs',
    schema: {
        name: 'browser_tab_new',
        title: 'Create new browser tab',
        description: 'Create a new browser tab and optionally navigate to a specific URL. If no URL is provided, the new tab will remain blank. After creation, automatically captures a page snapshot of the new tab.',
        inputSchema: z.object({
            url: z.string().optional().describe('The URL to navigate to in the new tab. If not provided, the new tab will be blank and ready for navigation.'),
        }),
        type: 'readOnly',
    },
    handle: async (context, params, response) => {
        const tab = await context.newTab();
        if (params.url)
            await tab.navigate(params.url);
        response.setIncludeSnapshot();
    },
});
const closeTab = defineTool({
    capability: 'core-tabs',
    schema: {
        name: 'browser_tab_close',
        title: 'Close browser tab',
        description: 'Close a browser tab by its index position, or close the currently active tab if no index is specified. After closing, automatically captures a page snapshot of the remaining active tab.',
        inputSchema: z.object({
            index: z.number().optional().describe('The zero-based index of the tab to close (0 for first tab, 1 for second tab, etc.). If not provided, closes the currently active tab.'),
        }),
        type: 'destructive',
    },
    handle: async (context, params, response) => {
        await context.closeTab(params.index);
        response.setIncludeSnapshot();
    },
});
export default [
    listTabs,
    newTab,
    selectTab,
    closeTab,
];
