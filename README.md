# MCP Macaco Playwright

Enhanced Playwright Tools for Model Context Protocol (MCP) with Chrome DevTools Protocol (CDP) Support

## Overview

MCP Macaco Playwright is a comprehensive browser automation server that provides AI agents with powerful web interaction capabilities through the Model Context Protocol. It combines Playwright's robust browser automation with CDP integration for advanced debugging and control scenarios.

## Features

- **Complete Browser Automation**: Navigate, interact, and extract data from web pages
- **Chrome DevTools Protocol (CDP) Support**: Connect to existing browser instances
- **AI-Optimized**: Designed specifically for AI agents and automated workflows  
- **Comprehensive Tool Set**: 50+ specialized functions for web automation
- **Multi-Browser Support**: Chrome, Firefox, Safari, and Edge
- **Screenshot & Snapshot Capabilities**: Visual and accessibility-based page capture
- **Form Automation**: Complete form filling and submission workflows
- **Network Monitoring**: Track requests, responses, and console messages

## Installation

```bash
npm install mcp-macaco-playwright
```

## Quick Start

```javascript
import { createConnection } from 'mcp-macaco-playwright';

// Create MCP server connection
const server = await createConnection();

// Use with MCP client
await client.callTool({
  name: 'browser_navigate',
  arguments: { url: 'https://example.com' }
});
```

## Function Reference

### Navigation Functions

#### `browser_navigate`
Navigate to a specific URL.

**Parameters:**
- `url` (string, required): The URL to navigate to

**Example:**
```javascript
await client.callTool({
  name: 'browser_navigate',
  arguments: { url: 'https://github.com' }
});
```

#### `browser_navigate_back`
Go back to the previous page in browser history.

**Parameters:** None

**Example:**
```javascript
await client.callTool({
  name: 'browser_navigate_back',
  arguments: {}
});
```

#### `browser_navigate_forward`
Go forward to the next page in browser history.

**Parameters:** None

**Example:**
```javascript
await client.callTool({
  name: 'browser_navigate_forward',
  arguments: {}
});
```

### Page Analysis Functions

#### `browser_snapshot`
Capture an accessibility snapshot of the current page for analysis and interaction.

**Parameters:** None

**Example:**
```javascript
await client.callTool({
  name: 'browser_snapshot',
  arguments: {}
});
```

#### `browser_take_screenshot`
Take a visual screenshot of the page or specific element.

**Parameters:**
- `type` (string, optional): Image format ('png' or 'jpeg', default: 'png')
- `filename` (string, optional): Custom filename for the screenshot
- `element` (string, optional): Human-readable element description
- `ref` (string, optional): Element reference from snapshot
- `fullPage` (boolean, optional): Capture full scrollable page

**Example:**
```javascript
await client.callTool({
  name: 'browser_take_screenshot',
  arguments: { 
    type: 'png',
    fullPage: true,
    filename: 'homepage.png'
  }
});
```

### Element Interaction Functions

#### `browser_click`
Click on a specific element on the page.

**Parameters:**
- `element` (string, required): Human-readable element description
- `ref` (string, required): Element reference from page snapshot

**Example:**
```javascript
await client.callTool({
  name: 'browser_click',
  arguments: {
    element: 'Sign in button',
    ref: 'button-signin-123'
  }
});
```

#### `browser_double_click`
Perform a double-click on an element.

**Parameters:**
- `element` (string, required): Human-readable element description
- `ref` (string, required): Element reference from page snapshot

**Example:**
```javascript
await client.callTool({
  name: 'browser_double_click',
  arguments: {
    element: 'File icon',
    ref: 'file-icon-456'
  }
});
```

#### `browser_right_click`
Perform a right-click to open context menu.

**Parameters:**
- `element` (string, required): Human-readable element description
- `ref` (string, required): Element reference from page snapshot

**Example:**
```javascript
await client.callTool({
  name: 'browser_right_click',
  arguments: {
    element: 'Image thumbnail',
    ref: 'img-thumb-789'
  }
});
```

### Text Input Functions

#### `browser_type`
Type text into an editable element.

**Parameters:**
- `element` (string, required): Human-readable element description
- `ref` (string, required): Element reference from page snapshot
- `text` (string, required): Text to type
- `submit` (boolean, optional): Press Enter after typing
- `slowly` (boolean, optional): Type character by character

**Example:**
```javascript
await client.callTool({
  name: 'browser_type',
  arguments: {
    element: 'Search input field',
    ref: 'search-input-123',
    text: 'playwright automation',
    submit: true
  }
});
```

#### `browser_press_key`
Press a specific key on the keyboard.

**Parameters:**
- `key` (string, required): Key name (e.g., 'Enter', 'ArrowLeft', 'a')

**Example:**
```javascript
await client.callTool({
  name: 'browser_press_key',
  arguments: { key: 'Escape' }
});
```

### Form Functions

#### `browser_select_option`
Select options in a dropdown menu.

**Parameters:**
- `element` (string, required): Human-readable element description
- `ref` (string, required): Element reference from page snapshot
- `values` (array, required): Array of values to select

**Example:**
```javascript
await client.callTool({
  name: 'browser_select_option',
  arguments: {
    element: 'Country dropdown',
    ref: 'country-select-456',
    values: ['United States']
  }
});
```

#### `browser_check_checkbox`
Check or uncheck a checkbox element.

**Parameters:**
- `element` (string, required): Human-readable element description
- `ref` (string, required): Element reference from page snapshot
- `checked` (boolean, required): Whether to check (true) or uncheck (false)

**Example:**
```javascript
await client.callTool({
  name: 'browser_check_checkbox',
  arguments: {
    element: 'Terms and conditions checkbox',
    ref: 'terms-checkbox-789',
    checked: true
  }
});
```

#### `browser_select_radio`
Select a radio button.

**Parameters:**
- `element` (string, required): Human-readable element description
- `ref` (string, required): Element reference from page snapshot

**Example:**
```javascript
await client.callTool({
  name: 'browser_select_radio',
  arguments: {
    element: 'Payment method: Credit Card',
    ref: 'payment-radio-cc'
  }
});
```

#### `browser_clear_input`
Clear the content of an input field.

**Parameters:**
- `element` (string, required): Human-readable element description
- `ref` (string, required): Element reference from page snapshot

**Example:**
```javascript
await client.callTool({
  name: 'browser_clear_input',
  arguments: {
    element: 'Email input field',
    ref: 'email-input-123'
  }
});
```

### Data Extraction Functions

#### `browser_get_text`
Extract text content or attribute values from elements.

**Parameters:**
- `element` (string, required): Human-readable element description
- `ref` (string, required): Element reference from page snapshot
- `attribute` (string, optional): Specific attribute to extract (e.g., 'href', 'src')

**Example:**
```javascript
await client.callTool({
  name: 'browser_get_text',
  arguments: {
    element: 'Product price',
    ref: 'price-display-456'
  }
});
```

#### `browser_get_elements`
Get multiple elements matching a selector.

**Parameters:**
- `selector` (string, required): CSS selector to find elements
- `attribute` (string, optional): Attribute to extract from each element

**Example:**
```javascript
await client.callTool({
  name: 'browser_get_elements',
  arguments: {
    selector: '.product-card h3',
    attribute: 'textContent'
  }
});
```

### Scrolling and Focus Functions

#### `browser_scroll_to`
Scroll to a specific element or coordinate position.

**Parameters:**
- `element` (string, optional): Human-readable element description
- `ref` (string, optional): Element reference from page snapshot
- `x` (number, optional): X coordinate to scroll to
- `y` (number, optional): Y coordinate to scroll to
- `behavior` (string, optional): Scroll behavior ('auto' or 'smooth')

**Example:**
```javascript
await client.callTool({
  name: 'browser_scroll_to',
  arguments: {
    element: 'Footer section',
    ref: 'footer-section-123',
    behavior: 'smooth'
  }
});
```

#### `browser_get_scroll_position`
Get the current scroll position of the page.

**Parameters:** None

**Example:**
```javascript
await client.callTool({
  name: 'browser_get_scroll_position',
  arguments: {}
});
```

#### `browser_focus_element`
Set focus on a specific element.

**Parameters:**
- `element` (string, required): Human-readable element description
- `ref` (string, required): Element reference from page snapshot

**Example:**
```javascript
await client.callTool({
  name: 'browser_focus_element',
  arguments: {
    element: 'Search input',
    ref: 'search-input-456'
  }
});
```

#### `browser_blur_element`
Remove focus from a specific element.

**Parameters:**
- `element` (string, required): Human-readable element description
- `ref` (string, required): Element reference from page snapshot

**Example:**
```javascript
await client.callTool({
  name: 'browser_blur_element',
  arguments: {
    element: 'Email input',
    ref: 'email-input-789'
  }
});
```

### Wait Functions

#### `browser_wait_for`
Wait for specific conditions to be met.

**Parameters:**
- `time` (number, optional): Time to wait in seconds
- `text` (string, optional): Text to wait for to appear
- `textGone` (string, optional): Text to wait for to disappear

**Example:**
```javascript
await client.callTool({
  name: 'browser_wait_for',
  arguments: {
    text: 'Loading complete',
    time: 5
  }
});
```

### Tab Management Functions

#### `browser_tab_list`
List all open browser tabs.

**Parameters:** None

**Example:**
```javascript
await client.callTool({
  name: 'browser_tab_list',
  arguments: {}
});
```

#### `browser_tab_new`
Open a new browser tab.

**Parameters:**
- `url` (string, optional): URL to navigate to in the new tab

**Example:**
```javascript
await client.callTool({
  name: 'browser_tab_new',
  arguments: { url: 'https://example.com' }
});
```

#### `browser_tab_close`
Close a browser tab.

**Parameters:**
- `index` (number, optional): Index of tab to close (closes current if not specified)

**Example:**
```javascript
await client.callTool({
  name: 'browser_tab_close',
  arguments: { index: 1 }
});
```

#### `browser_tab_select`
Switch to a specific tab by index.

**Parameters:**
- `index` (number, required): Index of the tab to select

**Example:**
```javascript
await client.callTool({
  name: 'browser_tab_select',
  arguments: { index: 0 }
});
```

### Network and Console Functions

#### `browser_network_requests`
Get all network requests made since page load.

**Parameters:** None

**Example:**
```javascript
await client.callTool({
  name: 'browser_network_requests',
  arguments: {}
});
```

#### `browser_console_messages`
Get all console messages from the page.

**Parameters:** None

**Example:**
```javascript
await client.callTool({
  name: 'browser_console_messages',
  arguments: {}
});
```

### Chrome DevTools Protocol (CDP) Functions

#### `browser_connect_cdp`
Connect to an existing browser instance via CDP.

**Parameters:**
- `endpoint` (string, required): CDP endpoint URL
- `timeout` (number, optional): Connection timeout in milliseconds (default: 30000)

**Example:**
```javascript
await client.callTool({
  name: 'browser_connect_cdp',
  arguments: {
    endpoint: 'ws://localhost:9222',
    timeout: 30000
  }
});
```

#### `browser_get_cdp_endpoints`
Discover available CDP endpoints from running browsers.

**Parameters:**
- `port` (number, optional): CDP port to check (default: 9222)
- `host` (string, optional): Host to check (default: 'localhost')

**Example:**
```javascript
await client.callTool({
  name: 'browser_get_cdp_endpoints',
  arguments: {
    port: 9222,
    host: 'localhost'
  }
});
```

#### `browser_disconnect_cdp`
Disconnect from the current CDP connection.

**Parameters:** None

**Example:**
```javascript
await client.callTool({
  name: 'browser_disconnect_cdp',
  arguments: {}
});
```

### JavaScript Evaluation Functions

#### `browser_evaluate`
Execute JavaScript code in the browser context.

**Parameters:**
- `script` (string, required): JavaScript code to execute

**Example:**
```javascript
await client.callTool({
  name: 'browser_evaluate',
  arguments: {
    script: 'document.title'
  }
});
```

### Dialog Handling Functions

#### `browser_handle_dialog`
Handle browser dialogs (alert, confirm, prompt).

**Parameters:**
- `action` (string, required): Action to take ('accept' or 'dismiss')
- `text` (string, optional): Text to enter for prompt dialogs

**Example:**
```javascript
await client.callTool({
  name: 'browser_handle_dialog',
  arguments: {
    action: 'accept',
    text: 'User input'
  }
});
```

### File Functions

#### `browser_upload_file`
Upload files to file input elements.

**Parameters:**
- `element` (string, required): Human-readable element description
- `ref` (string, required): Element reference from page snapshot
- `files` (array, required): Array of file paths to upload

**Example:**
```javascript
await client.callTool({
  name: 'browser_upload_file',
  arguments: {
    element: 'File upload input',
    ref: 'file-input-123',
    files: ['/path/to/document.pdf']
  }
});
```

### PDF Functions

#### `browser_save_pdf`
Save the current page as a PDF.

**Parameters:**
- `filename` (string, optional): Custom filename for the PDF
- `format` (string, optional): Page format (e.g., 'A4', 'Letter')
- `landscape` (boolean, optional): Use landscape orientation

**Example:**
```javascript
await client.callTool({
  name: 'browser_save_pdf',
  arguments: {
    filename: 'report.pdf',
    format: 'A4',
    landscape: false
  }
});
```

## Configuration

The MCP server can be configured with various options:

```javascript
const config = {
  browser: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    cdpEndpoint: 'ws://localhost:9222' // Optional CDP connection
  },
  capabilities: ['core', 'vision'] // Enable specific tool capabilities
};

const server = await createConnection(config);
```

## Common Usage Patterns

### Web Scraping Workflow
```javascript
// Navigate to page
await client.callTool({
  name: 'browser_navigate',
  arguments: { url: 'https://example.com' }
});

// Take snapshot to analyze page structure
await client.callTool({
  name: 'browser_snapshot',
  arguments: {}
});

// Extract data from elements
await client.callTool({
  name: 'browser_get_text',
  arguments: {
    element: 'Product title',
    ref: 'product-title-123'
  }
});
```

### Form Automation Workflow
```javascript
// Navigate to form page
await client.callTool({
  name: 'browser_navigate',
  arguments: { url: 'https://example.com/contact' }
});

// Fill form fields
await client.callTool({
  name: 'browser_type',
  arguments: {
    element: 'Name input',
    ref: 'name-input-123',
    text: 'John Doe'
  }
});

// Submit form
await client.callTool({
  name: 'browser_click',
  arguments: {
    element: 'Submit button',
    ref: 'submit-btn-456'
  }
});
```

### CDP Integration Workflow
```javascript
// Connect to existing browser
await client.callTool({
  name: 'browser_connect_cdp',
  arguments: { endpoint: 'ws://localhost:9222' }
});

// Work with existing tabs
await client.callTool({
  name: 'browser_tab_list',
  arguments: {}
});

// Disconnect when done
await client.callTool({
  name: 'browser_disconnect_cdp',
  arguments: {}
});
```

## Troubleshooting

### CDP Connection Issues
If you encounter CDP connection problems:

1. Start Chrome with debugging enabled:
   ```bash
   google-chrome --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0
   ```

2. Verify the endpoint is accessible:
   ```bash
   curl http://localhost:9222/json/version
   ```

3. Check for firewall or network restrictions

### Browser Launch Issues
- Ensure Playwright browsers are installed: `npx playwright install`
- Check system dependencies: `npx playwright install-deps`
- Verify sufficient system resources for browser instances

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please see the contributing guidelines for more information.

## Support

For issues and questions:
- GitHub Issues: https://github.com/macacoai/mcp-playwright/issues
- Email: gaston@macaco.ai