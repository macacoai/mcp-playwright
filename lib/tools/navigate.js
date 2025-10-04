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
import { defineTool, defineTabTool } from './tool.js';
const navigate = defineTool({
    capability: 'core',
    schema: {
        name: 'browser_navigate_url',
        title: 'Navigate the browser to a specified URL. This action will load the new page and wait for it to be ready, replacing the current page content.',
        description: 'Navigate to a URL',
        inputSchema: z.object({
            url: z.string().describe('The URL to navigate to'),
        }),
        type: 'destructive',
    },
    handle: async (context, params, response) => {
        const tab = await context.ensureTab();
        await tab.navigate(params.url);
        response.setIncludeSnapshot();
        response.addCode(`await page.goto('${params.url}');`);
    },
});
const navigateAction = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_navigate_action',
        title: 'Navigate browser action',
        description: 'Perform navigation actions using exact values: "back" (go to previous page), "forward" (go to next page), or "reload" (refresh current page)',
        inputSchema: z.object({
            action: z.enum(['back', 'forward', 'reload']).describe('The navigation action to perform: back (go to previous page), forward (go to next page), or reload (refresh current page)'),
        }),
        type: 'readOnly',
    },
    handle: async (tab, params, response) => {
        switch (params.action) {
            case 'back':
                await tab.page.goBack();
                response.addCode(`await page.goBack();`);
                break;
            case 'forward':
                await tab.page.goForward();
                response.addCode(`await page.goForward();`);
                break;
            case 'reload':
                await tab.page.reload();
                response.addCode(`await page.reload();`);
                break;
        }
        response.setIncludeSnapshot();
    },
});
export default [
    navigate,
    navigateAction,
];
