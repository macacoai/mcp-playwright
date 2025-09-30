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
// Schema for CSS selector operations
const selectorSchema = z.object({
    selector: z.string().describe('CSS selector to target the element'),
    index: z.number().optional().describe('Index of element if multiple elements match (0-based)'),
});
// Check/uncheck checkbox
const checkCheckbox = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_check_checkbox',
        title: 'Check or uncheck checkbox',
        description: 'Check or uncheck a checkbox element',
        inputSchema: elementSchema.extend({
            checked: z.boolean().describe('Whether to check (true) or uncheck (false) the checkbox'),
        }),
        type: 'destructive',
    },
    handle: async (tab, params, response) => {
        try {
            const locator = await tab.refLocator(params);
            if (params.checked) {
                await locator.check();
                response.addCode(`await page.${await generateLocator(locator)}.check();`);
                response.addResult('Checkbox checked successfully');
            }
            else {
                await locator.uncheck();
                response.addCode(`await page.${await generateLocator(locator)}.uncheck();`);
                response.addResult('Checkbox unchecked successfully');
            }
            response.setIncludeSnapshot();
        }
        catch (error) {
            response.addError(`Failed to ${params.checked ? 'check' : 'uncheck'} checkbox: ${error}`);
        }
    },
});
// Select radio button
const selectRadio = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_select_radio',
        title: 'Select radio button',
        description: 'Select a radio button',
        inputSchema: elementSchema,
        type: 'destructive',
    },
    handle: async (tab, params, response) => {
        try {
            const locator = await tab.refLocator(params);
            await locator.check();
            response.addCode(`await page.${await generateLocator(locator)}.check();`);
            response.addResult('Radio button selected successfully');
            response.setIncludeSnapshot();
        }
        catch (error) {
            response.addError(`Failed to select radio button: ${error}`);
        }
    },
});
// Clear input field
const clearInput = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_clear_input',
        title: 'Clear input field',
        description: 'Clear the content of an input field',
        inputSchema: elementSchema,
        type: 'destructive',
    },
    handle: async (tab, params, response) => {
        try {
            const locator = await tab.refLocator(params);
            await locator.clear();
            response.addCode(`await page.${await generateLocator(locator)}.clear();`);
            response.addResult('Input field cleared successfully');
            response.setIncludeSnapshot();
        }
        catch (error) {
            response.addError(`Failed to clear input field: ${error}`);
        }
    },
});
// Get input value
const getInputValue = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_get_input_value',
        title: 'Get input field value',
        description: 'Get the current value of an input field',
        inputSchema: elementSchema,
        type: 'readOnly',
    },
    handle: async (tab, params, response) => {
        try {
            const locator = await tab.refLocator(params);
            const value = await locator.inputValue();
            response.addCode(`const value = await page.${await generateLocator(locator)}.inputValue();`);
            response.addResult(`Input value: ${value}`);
        }
        catch (error) {
            response.addError(`Failed to get input value: ${error}`);
        }
    },
});
// Submit form
const submitForm = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_submit_form',
        title: 'Submit form',
        description: 'Submit a form element',
        inputSchema: elementSchema,
        type: 'destructive',
    },
    handle: async (tab, params, response) => {
        try {
            const locator = await tab.refLocator(params);
            await tab.waitForCompletion(async () => {
                await locator.evaluate((form) => form.submit());
            });
            response.addCode(`await page.${await generateLocator(locator)}.evaluate(form => form.submit());`);
            response.addResult('Form submitted successfully');
            response.setIncludeSnapshot();
        }
        catch (error) {
            response.addError(`Failed to submit form: ${error}`);
        }
    },
});
export default [
    checkCheckbox,
    selectRadio,
    clearInput,
    getInputValue,
    submitForm,
];
