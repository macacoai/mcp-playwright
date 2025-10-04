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
import { generateLocator } from './utils.js';
const wait = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_wait_for',
        title: 'Wait for',
        description: 'Wait for text to appear/disappear, element state changes, or a specified time to pass',
        inputSchema: z.object({
            time: z.number().optional().describe('The time to wait in seconds'),
            text: z.string().optional().describe('The text to wait for'),
            textGone: z.string().optional().describe('The text to wait for to disappear'),
            // Element waiting parameters
            element: z.string().optional().describe('Human-readable element description used to obtain permission to interact with the element'),
            ref: z.string().optional().describe('Exact target element reference from the page snapshot'),
            state: z.enum(['visible', 'hidden', 'attached', 'detached']).optional().default('visible').describe('Element state to wait for'),
            timeout: z.number().optional().default(5000).describe('Timeout in milliseconds for element waiting'),
        }),
        type: 'readOnly',
    },
    handle: async (tab, params, response) => {
        // Validation: at least one parameter must be provided
        if (!params.text && !params.textGone && !params.time && !params.element)
            throw new Error('Either time, text, textGone, or element must be provided');
        
        // Additional validation for element parameters
        if (params.element && !params.ref)
            throw new Error('ref parameter is required when element is provided');
        if (params.ref && !params.element)
            throw new Error('element parameter is required when ref is provided');
        const code = [];
        
        // Handle time waiting
        if (params.time) {
            code.push(`await new Promise(f => setTimeout(f, ${params.time} * 1000));`);
            await new Promise(f => setTimeout(f, Math.min(30000, params.time * 1000)));
        }
        
        // Handle text-based waiting
        const locator = params.text ? tab.page.getByText(params.text).first() : undefined;
        const goneLocator = params.textGone ? tab.page.getByText(params.textGone).first() : undefined;
        if (goneLocator) {
            code.push(`await page.getByText(${JSON.stringify(params.textGone)}).first().waitFor({ state: 'hidden' });`);
            await goneLocator.waitFor({ state: 'hidden' });
        }
        if (locator) {
            code.push(`await page.getByText(${JSON.stringify(params.text)}).first().waitFor({ state: 'visible' });`);
            await locator.waitFor({ state: 'visible' });
        }
        
        // Handle element waiting
        if (params.element && params.ref) {
            try {
                const elementLocator = await tab.refLocator({ element: params.element, ref: params.ref });
                const elementState = params.state || 'visible';
                const elementTimeout = params.timeout || 5000;
                
                await elementLocator.waitFor({ 
                    state: elementState, 
                    timeout: elementTimeout 
                });
                
                response.addCode(`await page.${await generateLocator(elementLocator)}.waitFor({ state: '${elementState}', timeout: ${elementTimeout} });`);
                
                if (elementState === 'visible' || elementState === 'attached') {
                    response.setIncludeSnapshot();
                }
            } catch (error) {
                response.addError(`Failed to wait for element to be ${params.state || 'visible'}: ${error}`);
                return;
            }
        }
        
        // Generate result message
        const waitedFor = [];
        if (params.time) waitedFor.push(`${params.time} seconds`);
        if (params.text) waitedFor.push(`text "${params.text}"`);
        if (params.textGone) waitedFor.push(`text "${params.textGone}" to disappear`);
        if (params.element) waitedFor.push(`element "${params.element}" to be ${params.state || 'visible'}`);
        
        response.addResult(`Waited for ${waitedFor.join(', ')}`);
        
        // Set snapshot if not already set by element waiting
        if (!params.element || (params.state !== 'visible' && params.state !== 'attached')) {
            response.setIncludeSnapshot();
        }
    },
});
export default [
    wait,
];
