// Test para la función filterEmptyGenericElementsIntelligent

/**
 * Filters out empty generic elements from aria snapshot to improve readability
 * @param {string} ariaSnapshot - The original aria snapshot string
 * @returns {string} - Filtered aria snapshot with empty generic elements removed
 */
function filterEmptyGenericElementsIntelligent(ariaSnapshot) {
    const lines = ariaSnapshot.split('\n');
    
    // Function to check if a line has useful content recursively
    function hasUsefulContent(lineIndex) {
        const line = lines[lineIndex];
        const trimmedLine = line.trim();
        
        // If it's not a generic element, it's useful
        if (!trimmedLine.startsWith('- generic [ref=')) {
            return trimmedLine.length > 0;
        }
        
        // If it's a generic with text after the colon, it's useful
        const match = trimmedLine.match(/^- generic \[ref=\w+\]:\s*(.+)$/);
        if (match && match[1].trim().length > 0) {
            return true;
        }
        
        // If it's an empty generic, check if any descendant is useful
        const currentIndent = line.length - line.trimStart().length;
        
        for (let i = lineIndex + 1; i < lines.length; i++) {
            const nextLine = lines[i];
            const nextIndent = nextLine.length - nextLine.trimStart().length;
            
            // If we've gone back to same or less indentation, stop looking
            if (nextIndent <= currentIndent && nextLine.trim()) {
                break;
            }
            
            // If this descendant is useful, then the parent is useful too
            if (nextIndent > currentIndent && hasUsefulContent(i)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Filter lines keeping only useful ones
    const result = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '' || hasUsefulContent(i)) {
            result.push(lines[i]);
        }
    }
    
    return result.join('\n');
}

// Datos de prueba que simulan un snapshot con muchos generic vacíos
const testSnapshot = `- generic [ref=e1]: 
  - generic [ref=e2]: 
    - generic [ref=e3]: Sign in to Open WebUI
    - generic [ref=e4]: 
      - generic [ref=e5]: 
        - generic [ref=e6]: 
          - generic [ref=e7]: Email
          - textbox "Email" [ref=e8]
          - generic [ref=e9]: 
            - generic [ref=e10]: 
        - generic [ref=e11]: Password
        - textbox "Password" [ref=e12]
  - generic [ref=e13]: 
    - generic [ref=e14]: 
      - generic [ref=e15]: 
  - button "Sign In" [ref=e16]
- generic [ref=e17]: 
  - generic [ref=e18]: 
- footer [ref=e19]: Copyright 2024`;

console.log("=== SNAPSHOT ORIGINAL ===");
console.log(testSnapshot);

console.log("\n=== SNAPSHOT FILTRADO ===");
const filteredSnapshot = filterEmptyGenericElementsIntelligent(testSnapshot);
console.log(filteredSnapshot);

console.log("\n=== ANÁLISIS ===");
const originalLines = testSnapshot.split('\n').length;
const filteredLines = filteredSnapshot.split('\n').length;
console.log(`Líneas originales: ${originalLines}`);
console.log(`Líneas filtradas: ${filteredLines}`);
console.log(`Líneas eliminadas: ${originalLines - filteredLines}`);

// Test adicional con un caso más simple
const simpleTest = `- generic [ref=e1]: 
  - generic [ref=e2]: 
    - generic [ref=e3]: 
- button "Click me" [ref=e4]`;

console.log("\n=== TEST SIMPLE ORIGINAL ===");
console.log(simpleTest);

console.log("\n=== TEST SIMPLE FILTRADO ===");
const simpleFiltered = filterEmptyGenericElementsIntelligent(simpleTest);
console.log(simpleFiltered);