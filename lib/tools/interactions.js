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
import { defineTabTool } from './tool.js';
import { elementSchema } from './snapshot.js';
import { generateLocator } from './utils.js';

// Scroll to top or bottom of page
const scrollPage = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_scroll_page',
        title: 'Scroll to top or bottom of page',
        description: 'Scroll the page to the very top or bottom. This is useful for quickly navigating to the beginning or end of long pages without needing to specify a particular element.',
        inputSchema: z.object({
            position: z.enum(['top', 'bottom']).describe('Position to scroll to: "top" for the beginning of the page, "bottom" for the end of the page'),
            behavior: z.enum(['auto', 'smooth']).optional().default('auto').describe('Scroll behavior - "auto" for instant scrolling or "smooth" for animated scrolling'),
        }),
        type: 'destructive',
    },
    handle: async (tab, params, response) => {
        try {
            const scrollOptions = {
                behavior: params.behavior
            };

            if (params.position === 'top') {
                // Scroll to top of page
                await tab.page.evaluate((options) => {
                    window.scrollTo({ top: 0, left: 0, ...options });
                }, scrollOptions);
                response.addCode(`await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: '${params.behavior}' }));`);
                response.addResult('Successfully scrolled to top of page');
            } else {
                // Scroll to bottom of page
                await tab.page.evaluate((options) => {
                    window.scrollTo({ top: document.body.scrollHeight, left: 0, ...options });
                }, scrollOptions);
                response.addCode(`await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, left: 0, behavior: '${params.behavior}' }));`);
                response.addResult('Successfully scrolled to bottom of page');
            }
            
            response.setIncludeSnapshot();
        }
        catch (error) {
            response.addError(`Failed to scroll to ${params.position} of page: ${error}`);
        }
    },
});

// Control element focus (focus or blur)
const elementFocusControl = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_element_focus',
        title: 'Control element focus',
        description: 'Control the focus state of a specific element. You can either set focus on an element (useful for keyboard navigation and form interactions) or remove focus from an element (useful for clearing active states and form validation).',
        inputSchema: elementSchema.extend({
            action: z.enum(['focus', 'blur']).describe('Action to perform: "focus" to set focus on the element, "blur" to remove focus from the element'),
        }),
        type: 'destructive',
    },
    handle: async (tab, params, response) => {
        try {
            const locator = await tab.refLocator(params);
            
            if (params.action === 'focus') {
                await locator.focus();
                response.addCode(`await page.${await generateLocator(locator)}.focus();`);
                response.addResult('Element focused successfully');
            } else {
                await locator.blur();
                response.addCode(`await page.${await generateLocator(locator)}.blur();`);
                response.addResult('Element blurred successfully');
            }
            
            response.setIncludeSnapshot();
        }
        catch (error) {
            response.addError(`Failed to ${params.action} element: ${error}`);
        }
    },
});
export default [
    scrollPage,
    elementFocusControl,
];
