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
import { defineTabTool, defineTool } from './tool.js';
import { generateLocator } from './utils.js';
const snapshot = defineTool({
    capability: 'core',
    schema: {
        name: 'browser_snapshot',
        title: 'Page snapshot',
        description: 'Capture accessibility snapshot of the current page to analyze the DOM structure, element roles, attributes, and semantic relationships for accessibility testing and debugging.',
        inputSchema: z.object({}),
        type: 'readOnly',
    },
    handle: async (context, params, response) => {
        await context.ensureTab();
        response.setIncludeSnapshot();
    },
});
export const elementSchema = z.object({
    element: z.string().describe('Human-readable element description used to obtain permission to interact with the element'),
    ref: z.string().describe('Exact target element reference from the page snapshot'),
});
const clickSchema = elementSchema.extend({
    doubleClick: z.boolean().optional().describe('Whether to perform a double click instead of a single click'),
    button: z.enum(['left', 'right', 'middle']).optional().describe('Button to click, defaults to left'),
});
const click = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_click',
        title: 'Click',
        description: 'Perform click actions on a web page, including single clicks, double clicks, and right clicks. Supports different mouse buttons (left, right, middle) and can be used for checking checkboxes, selecting radio buttons, submitting forms, opening context menus, and double-clicking elements',
        inputSchema: clickSchema,
        type: 'destructive',
    },
    handle: async (tab, params, response) => {
        response.setIncludeSnapshot();
        const locator = await tab.refLocator(params);
        const button = params.button;
        const buttonAttr = button ? `{ button: '${button}' }` : '';
        if (params.doubleClick)
            response.addCode(`await page.${await generateLocator(locator)}.dblclick(${buttonAttr});`);
        else
            response.addCode(`await page.${await generateLocator(locator)}.click(${buttonAttr});`);
        await tab.waitForCompletion(async () => {
            if (params.doubleClick)
                await locator.dblclick({ button });
            else
                await locator.click({ button });
        });
    },
});
const drag = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_drag',
        title: 'Drag mouse',
        description: 'Perform drag and drop operations between two elements on a web page. Supports reordering items in sortable lists, moving cards in kanban boards, dragging files to upload zones, rearranging table rows, and other interactive drag and drop scenarios. Automatically handles mouse events (mousedown, mousemove, mouseup) required for complete drag operations.',
        inputSchema: z.object({
            startElement: z.string().describe('Human-readable source element description used to obtain the permission to interact with the element'),
            startRef: z.string().describe('Exact source element reference from the page snapshot'),
            endElement: z.string().describe('Human-readable target element description used to obtain the permission to interact with the element'),
            endRef: z.string().describe('Exact target element reference from the page snapshot'),
        }),
        type: 'destructive',
    },
    handle: async (tab, params, response) => {
        response.setIncludeSnapshot();
        const [startLocator, endLocator] = await tab.refLocators([
            { ref: params.startRef, element: params.startElement },
            { ref: params.endRef, element: params.endElement },
        ]);
        await tab.waitForCompletion(async () => {
            await startLocator.dragTo(endLocator);
        });
        response.addCode(`await page.${await generateLocator(startLocator)}.dragTo(page.${await generateLocator(endLocator)});`);
    },
});


export default [
    snapshot,
    click,
    drag,
];
