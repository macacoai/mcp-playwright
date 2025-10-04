/**
 * Copyright (c) Microsoft Corpo  handle: async (tab, params, response) => {
    const { ref, element, attribute } = params;
    
    try {
      const locator = await tab.refLocator(params);
      
      let result: string;
      if (attribute) {
        result = await locator.getAttribute(attribute) || '';
        response.addCode(`const attributeValue = await page.${await generateLocator(locator)}.getAttribute('${attribute}');`);
      } else {
        result = await locator.textContent() || '';
        response.addCode(`const textContent = await page.${await generateLocator(locator)}.textContent();`);
      }
      
      response.addResult(`${attribute ? `Attribute "${attribute}"` : 'Text content'}: ${result}`);
    } catch (error) {
      response.addError(`Failed to get ${attribute ? `attribute "${attribute}"` : 'text content'} from element: ${error}`);
    }
  },ed under the Apache License, Version 2.0 (the "License");
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

// Schema for comprehensive element information
const getElementSchema = elementSchema.extend({
    includeAttributes: z.array(z.string()).optional().describe('Optional array of specific attributes to include (e.g., ["id", "class", "href"])'),
    includeMetadata: z.boolean().optional().default(true).describe('Whether to include element metadata (tag, type, state, etc.)'),
});

const getElement = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_get_element',
        title: 'Get comprehensive element information',
        description: 'Get complete information from an element including text content, input value, attributes, and metadata',
        inputSchema: getElementSchema,
        type: 'readOnly',
    },
    handle: async (tab, params, response) => {
        const { ref, element, includeAttributes, includeMetadata } = params;
        
        try {
            const locator = await tab.refLocator(params);
            const elementInfo = {};
            
            // Get basic element information
            const tagName = await locator.evaluate(el => el.tagName.toLowerCase());
            const elementType = await locator.evaluate(el => el.type || null);
            
            // Get text content
            const textContent = await locator.textContent() || '';
            if (textContent.trim()) {
                elementInfo.textContent = textContent.trim();
            }
            
            // Get input value if it's an input element
            const isInputElement = ['input', 'textarea', 'select'].includes(tagName);
            if (isInputElement) {
                try {
                    const inputValue = await locator.inputValue();
                    if (inputValue !== null && inputValue !== undefined) {
                        elementInfo.inputValue = inputValue;
                    }
                } catch (e) {
                    // Some elements might not support inputValue, that's ok
                }
            }
            
            // Get common attributes
            const commonAttributes = ['id', 'class', 'name', 'href', 'src', 'alt', 'title', 'placeholder', 'value'];
            const attributes = {};
            
            for (const attr of commonAttributes) {
                const value = await locator.getAttribute(attr);
                if (value !== null) {
                    attributes[attr] = value;
                }
            }
            
            // Get additional requested attributes
            if (includeAttributes && includeAttributes.length > 0) {
                for (const attr of includeAttributes) {
                    if (!attributes[attr]) {
                        const value = await locator.getAttribute(attr);
                        if (value !== null) {
                            attributes[attr] = value;
                        }
                    }
                }
            }
            
            if (Object.keys(attributes).length > 0) {
                elementInfo.attributes = attributes;
            }
            
            // Get metadata if requested
            if (includeMetadata) {
                const metadata = {
                    tagName: tagName,
                };
                
                if (elementType) {
                    metadata.type = elementType;
                }
                
                // Get element state
                const isEnabled = await locator.isEnabled();
                const isVisible = await locator.isVisible();
                const isEditable = await locator.isEditable();
                
                metadata.state = {
                    enabled: isEnabled,
                    visible: isVisible,
                    editable: isEditable,
                };
                
                // Get accessibility information
                try {
                    const ariaLabel = await locator.getAttribute('aria-label');
                    const ariaRole = await locator.getAttribute('role');
                    if (ariaLabel || ariaRole) {
                        metadata.accessibility = {};
                        if (ariaLabel) metadata.accessibility.label = ariaLabel;
                        if (ariaRole) metadata.accessibility.role = ariaRole;
                    }
                } catch (e) {
                    // Accessibility info is optional
                }
                
                elementInfo.metadata = metadata;
            }
            
            // Generate appropriate code based on what was retrieved
            const codeLines = [];
            codeLines.push(`const locator = page.${await generateLocator(locator)};`);
            
            if (elementInfo.textContent) {
                codeLines.push(`const textContent = await locator.textContent();`);
            }
            
            if (elementInfo.inputValue !== undefined) {
                codeLines.push(`const inputValue = await locator.inputValue();`);
            }
            
            if (elementInfo.attributes) {
                const attrNames = Object.keys(elementInfo.attributes);
                if (attrNames.length === 1) {
                    codeLines.push(`const ${attrNames[0]}Attr = await locator.getAttribute('${attrNames[0]}');`);
                } else if (attrNames.length > 1) {
                    codeLines.push(`// Get multiple attributes`);
                    attrNames.forEach(attr => {
                        codeLines.push(`const ${attr}Attr = await locator.getAttribute('${attr}');`);
                    });
                }
            }
            
            if (elementInfo.metadata) {
                codeLines.push(`const tagName = await locator.evaluate(el => el.tagName.toLowerCase());`);
                codeLines.push(`const isEnabled = await locator.isEnabled();`);
                codeLines.push(`const isVisible = await locator.isVisible();`);
            }
            
            response.addCode(codeLines.join('\n'));
            
            // Format the result
            const resultLines = [`Element Information:`];
            
            if (elementInfo.textContent) {
                resultLines.push(`- Text Content: "${elementInfo.textContent}"`);
            }
            
            if (elementInfo.inputValue !== undefined) {
                resultLines.push(`- Input Value: "${elementInfo.inputValue}"`);
            }
            
            if (elementInfo.attributes && Object.keys(elementInfo.attributes).length > 0) {
                resultLines.push(`- Attributes:`);
                Object.entries(elementInfo.attributes).forEach(([key, value]) => {
                    resultLines.push(`  - ${key}: "${value}"`);
                });
            }
            
            if (elementInfo.metadata) {
                const { metadata } = elementInfo;
                resultLines.push(`- Metadata:`);
                resultLines.push(`  - Tag: ${metadata.tagName}`);
                if (metadata.type) {
                    resultLines.push(`  - Type: ${metadata.type}`);
                }
                resultLines.push(`  - State: enabled=${metadata.state.enabled}, visible=${metadata.state.visible}, editable=${metadata.state.editable}`);
                
                if (metadata.accessibility) {
                    resultLines.push(`  - Accessibility:`);
                    if (metadata.accessibility.label) {
                        resultLines.push(`    - Label: "${metadata.accessibility.label}"`);
                    }
                    if (metadata.accessibility.role) {
                        resultLines.push(`    - Role: "${metadata.accessibility.role}"`);
                    }
                }
            }
            
            response.addResult(resultLines.join('\n'));
            
        } catch (error) {
            response.addError(`Failed to get element information: ${error}`);
        }
    },
});

const getPageInfo = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_get_page_info',
        title: 'Get page information',
        description: 'Get basic information about the current page (title, URL, etc.)',
        inputSchema: z.object({}),
        type: 'readOnly',
    },
    handle: async (tab, params, response) => {
        try {
            const title = await tab.page.title();
            const url = tab.page.url();
            const viewport = tab.page.viewportSize();
            response.addCode(`const title = await page.title();
const url = page.url();
const viewport = page.viewportSize();`);
            response.addResult(`Page Information:
- Title: ${title}
- URL: ${url}
- Viewport: ${viewport ? `${viewport.width}x${viewport.height}` : 'Not set'}`);
        }
        catch (error) {
            response.addError(`Failed to get page information: ${error}`);
        }
    },
});
export default [
    getElement,
    getPageInfo
];
