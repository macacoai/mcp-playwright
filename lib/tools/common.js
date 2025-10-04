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
const close = defineTool({
    capability: 'core',
    schema: {
        name: 'browser_close',
        title: 'Close browser',
        description: 'Close the browser context, terminating all associated tabs and pages',
        inputSchema: z.object({}),
        type: 'readOnly',
    },
    handle: async (context, params, response) => {
        await context.closeBrowserContext();
        response.setIncludeTabs();
        response.addCode(`await page.close()`);
    },
});
const resize = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_resize',
        title: 'Resize browser window',
        description: 'Resize the browser window to simulate different device viewports. Available options: mobile (375x667px - iPhone), tablet (768x1024px - iPad), desktop (1280x720px - HD)',
        inputSchema: z.object({
            device: z.enum(['mobile', 'tablet', 'desktop']).describe('Device type to resize to'),
        }),
        type: 'readOnly',
    },
    handle: async (tab, params, response) => {
        const deviceSizes = {
            mobile: { width: 375, height: 667 },      // iPhone standard
            tablet: { width: 768, height: 1024 },     // iPad standard  
            desktop: { width: 1280, height: 720 }    // Desktop standard
        };
        
        const size = deviceSizes[params.device];
        response.addCode(`await page.setViewportSize({ width: ${size.width}, height: ${size.height} });`);
        await tab.waitForCompletion(async () => {
            await tab.page.setViewportSize(size);
        });
    },
});
export default [
    close,
    resize
];
