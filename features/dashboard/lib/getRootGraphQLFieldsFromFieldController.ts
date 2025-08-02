// Extract GraphQL fields from a field controller
export function getRootGraphQLFieldsFromFieldController(controller: any): string[] {
  if (!controller) return [];
  
  // If the controller has a graphqlSelection, parse it
  if (controller.graphqlSelection) {
    const selection = controller.graphqlSelection;
    
    // Handle simple field selections like "fieldName" 
    if (typeof selection === 'string' && !selection.includes('{')) {
      return [selection];
    }
    
    // Handle complex selections with nested fields
    // This is a simplified parser - KeystoneJS uses more sophisticated parsing
    const matches = selection.match(/(\w+)\s*(?:\{|$)/g);
    if (matches) {
      return matches.map((match: string) => match.replace(/\s*\{.*/, '').trim());
    }
  }
  
  // Fallback to the field path/key
  return [controller.path || controller.key || 'id'];
}