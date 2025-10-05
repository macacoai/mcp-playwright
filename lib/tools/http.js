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

const httpRequest = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_http_request',
        title: 'Make HTTP Request',
        description: 'Make HTTP requests (GET, POST, PUT, DELETE, PATCH) with custom headers and body',
        inputSchema: z.object({
            url: z.string().url()
                .describe('The URL to make the request to'),
            method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET')
                .describe('HTTP method to use'),
            headers: z.record(z.string()).optional()
                .describe('Custom headers to include in the request (e.g., {"Authorization": "Bearer token", "Content-Type": "application/json"})'),
            body: z.string().optional()
                .describe('Request body (for POST, PUT, PATCH methods). Can be JSON string, form data, or plain text'),
            timeout: z.number().min(1000).max(60000).default(10000).optional()
                .describe('Request timeout in milliseconds (default: 10000, max: 60000)'),
            followRedirects: z.boolean().default(true).optional()
                .describe('Whether to follow HTTP redirects (default: true)')
        }),
        type: 'destructive',
    },
    handle: async (tab, params, response) => {
        try {
            // Prepare request options
            const requestOptions = {
                method: params.method,
                headers: {
                    'User-Agent': 'MCP-Playwright-Browser/1.0',
                    ...(params.headers || {})
                },
                redirect: params.followRedirects ? 'follow' : 'manual'
            };

            // Add body for methods that support it
            if (params.body && ['POST', 'PUT', 'PATCH'].includes(params.method)) {
                requestOptions.body = params.body;
                
                // Set default Content-Type if not provided
                if (!requestOptions.headers['Content-Type'] && !requestOptions.headers['content-type']) {
                    // Try to detect if it's JSON
                    try {
                        JSON.parse(params.body);
                        requestOptions.headers['Content-Type'] = 'application/json';
                    } catch {
                        requestOptions.headers['Content-Type'] = 'text/plain';
                    }
                }
            }

            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), params.timeout);
            requestOptions.signal = controller.signal;

            response.addCode(`Making ${params.method} request to: ${params.url}`);
            
            const startTime = Date.now();
            
            // Make the HTTP request
            const fetchResponse = await fetch(params.url, requestOptions);
            
            clearTimeout(timeoutId);
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Get response headers
            const responseHeaders = {};
            fetchResponse.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            // Get response body
            let responseBody;
            const contentType = fetchResponse.headers.get('content-type') || '';
            
            try {
                if (contentType.includes('application/json')) {
                    responseBody = await fetchResponse.json();
                } else if (contentType.includes('text/') || contentType.includes('application/xml')) {
                    responseBody = await fetchResponse.text();
                } else {
                    // For binary content, get as text but indicate it might be binary
                    const text = await fetchResponse.text();
                    responseBody = text.length > 1000 ? 
                        `[Binary/Large content - ${text.length} characters]` : 
                        text;
                }
            } catch (error) {
                responseBody = `[Error reading response body: ${error.message}]`;
            }

            // Prepare the result
            const result = {
                status: fetchResponse.status,
                statusText: fetchResponse.statusText,
                ok: fetchResponse.ok,
                url: fetchResponse.url,
                headers: responseHeaders,
                body: responseBody,
                duration: `${duration}ms`,
                redirected: fetchResponse.redirected
            };

            response.addResult(JSON.stringify(result, null, 2));
            
            // Add summary
            const summary = `HTTP ${params.method} ${fetchResponse.status} ${fetchResponse.statusText} (${duration}ms)`;
            response.addCode(summary);

        } catch (error) {
            if (error.name === 'AbortError') {
                response.addError(`Request timeout after ${params.timeout}ms`);
            } else if (error.code === 'ENOTFOUND') {
                response.addError(`DNS resolution failed for URL: ${params.url}`);
            } else if (error.code === 'ECONNREFUSED') {
                response.addError(`Connection refused to: ${params.url}`);
            } else {
                response.addError(`HTTP request failed: ${error.message}`);
            }
        }
    },
});

export default [
    httpRequest,
];