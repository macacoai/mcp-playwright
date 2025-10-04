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

const requests = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_network_requests',
        title: 'List network requests',
        description: 'Returns all network requests since loading the page with optional filtering by HTTP method, status code, content type, and URL pattern',
        inputSchema: z.object({
            method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional()
                .describe('Filter by HTTP method'),
            status: z.number().min(100).max(599).optional()
                .describe('Filter by HTTP status code'),
            contentType: z.string().optional()
                .describe('Filter by content type (partial match, e.g., "json", "html", "image")'),
            urlPattern: z.string().optional()
                .describe('Filter by URL pattern (partial match, e.g., "api", "/users/", ".js")'),
            limit: z.number().min(1).max(100).default(50).optional()
                .describe('Maximum number of requests to return (default: 50)')
        }),
        type: 'readOnly',
    },
    handle: async (tab, params, response) => {
        const requests = tab.requests();
        const requestEntries = [...requests.entries()];
        
        // Apply filters
        let filteredRequests = requestEntries.filter(([req, res]) => {
            // Filter by HTTP method
            if (params.method && req.method().toUpperCase() !== params.method.toUpperCase()) {
                return false;
            }
            
            // Filter by status code
            if (params.status && (!res || res.status() !== params.status)) {
                return false;
            }
            
            // Filter by content type
            if (params.contentType && res) {
                const contentType = res.headers()['content-type'] || '';
                if (!contentType.toLowerCase().includes(params.contentType.toLowerCase())) {
                    return false;
                }
            }
            
            // Filter by URL pattern
            if (params.urlPattern) {
                if (!req.url().toLowerCase().includes(params.urlPattern.toLowerCase())) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Apply limit
        if (params.limit) {
            filteredRequests = filteredRequests.slice(0, params.limit);
        }
        
        // Render results
        filteredRequests.forEach(([req, res]) => {
            response.addResult(renderRequest(req, res));
        });
        
        if (filteredRequests.length === 0) {
            response.addResult('No requests found matching the specified filters.');
        } else {
            response.addResult(`\nShowing ${filteredRequests.length} request(s). Use browser_network_request_details with the full URL to see details.`);
        }
    },
});

const requestDetails = defineTabTool({
    capability: 'core',
    schema: {
        name: 'browser_network_request_details',
        title: 'Get network request details',
        description: 'Get detailed information about a specific network request using its URL and optionally HTTP method',
        inputSchema: z.object({
            url: z.string()
                .describe('Full URL of the request (copy from browser_network_requests output)'),
            method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional()
                .describe('HTTP method (optional, helps when same URL has multiple methods)')
        }),
        type: 'readOnly',
    },
    handle: async (tab, params, response) => {
        const requests = tab.requests();
        const requestEntries = [...requests.entries()];
        
        // Find matching request(s)
        const matchingRequests = requestEntries.filter(([req, res]) => {
            const urlMatches = req.url() === params.url;
            const methodMatches = !params.method || req.method().toUpperCase() === params.method.toUpperCase();
            return urlMatches && methodMatches;
        });
        
        if (matchingRequests.length === 0) {
            response.addError(`No request found for URL: ${params.url}${params.method ? ` with method ${params.method}` : ''}`);
            return;
        }
        
        if (matchingRequests.length > 1 && !params.method) {
            response.addResult(`Found ${matchingRequests.length} requests for this URL with different methods:`);
            matchingRequests.forEach(([req, res]) => {
                response.addResult(`- ${req.method().toUpperCase()} ${req.url()}`);
            });
            response.addResult(`\nPlease specify the 'method' parameter to get details for a specific request.`);
            return;
        }
        
        // Show details for the request (use first match if method specified or only one match)
        const [request, responseObj] = matchingRequests[0];
        
        // Request details
        response.addResult(`## Request Details`);
        response.addResult(`**URL:** ${request.url()}`);
        response.addResult(`**Method:** ${request.method().toUpperCase()}`);
        response.addResult(`**Resource Type:** ${request.resourceType()}`);
        
        // Request headers
        const requestHeaders = request.headers();
        response.addResult(`\n**Request Headers:**`);
        Object.entries(requestHeaders).forEach(([key, value]) => {
            response.addResult(`  ${key}: ${value}`);
        });
        
        // Request body (if available)
        const postData = request.postData();
        if (postData) {
            response.addResult(`\n**Request Body:**`);
            response.addResult(postData);
        }
        
        // Response details
        if (responseObj) {
            response.addResult(`\n## Response Details`);
            response.addResult(`**Status:** ${responseObj.status()} ${responseObj.statusText()}`);
            
            // Response headers
            const responseHeaders = responseObj.headers();
            response.addResult(`\n**Response Headers:**`);
            Object.entries(responseHeaders).forEach(([key, value]) => {
                response.addResult(`  ${key}: ${value}`);
            });
            
            // Response body (if text-based)
            try {
                const contentType = responseHeaders['content-type'] || '';
                if (contentType.includes('text/') || contentType.includes('application/json') || contentType.includes('application/xml')) {
                    const body = await responseObj.text();
                    if (body && body.length > 0) {
                        response.addResult(`\n**Response Body:**`);
                        // Limit body size for readability
                        if (body.length > 1000) {
                            response.addResult(body.substring(0, 1000) + '\n... (truncated)');
                        } else {
                            response.addResult(body);
                        }
                    }
                }
            } catch (error) {
                response.addResult(`\n**Response Body:** Unable to read response body: ${error.message}`);
            }
        } else {
            response.addResult(`\n## Response Details`);
            response.addResult('**Status:** No response received (request may have failed or is still pending)');
        }
    },
});

function renderRequest(request, response) {
    const result = [];
    result.push(`[${request.method().toUpperCase()}] ${request.url()}`);
    if (response) {
        result.push(`=> [${response.status()}] ${response.statusText()}`);
        
        // Add content type if available
        const contentType = response.headers()['content-type'];
        if (contentType) {
            const shortContentType = contentType.split(';')[0]; // Remove charset info
            result.push(`(${shortContentType})`);
        }
    } else {
        result.push('=> [PENDING/FAILED]');
    }
    return result.join(' ');
}

export default [
    requests,
    requestDetails,
];
