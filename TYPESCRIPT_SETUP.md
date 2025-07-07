# Server Architecture Notes

## Current Clean Setup ✅

Your project now has a clean, working server architecture:

### **Working Server: ES Module JavaScript (.mjs)**
```bash
npm run server  # Uses src/server/index.mjs
```

**Benefits:**
- ✅ No TypeScript configuration issues
- ✅ Full ES module support  
- ✅ All modern JavaScript features
- ✅ Ready for production
- ✅ Clean codebase without errors

## Previous TypeScript Issues (Now Resolved)

The TypeScript files were removed because they had ES module import issues. Your project uses `"type": "module"` which requires specific TypeScript configuration.

## TypeScript Solutions

### 🔧 **Option 3: Fix TypeScript Imports**

For ES modules with TypeScript, you need:

1. **Use .js extensions in imports** (even for .ts files):
```typescript
// ❌ Wrong
import { AcademicSearchService } from './services/academicAPIs';

// ✅ Correct  
import { AcademicSearchService } from './services/academicAPIs.js';
```

2. **Proper tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext", 
    "moduleResolution": "Node",
    "allowImportingTsExtensions": false,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "ts-node": {
    "esm": true
  }
}
```

3. **Proper package.json script**:
```json
{
  "scripts": {
    "server:ts": "node --loader ts-node/esm src/server/index.ts"
  }
}
```

### 🔧 **Option 4: Use tsx (Recommended)**

Install tsx (modern TypeScript runner):
```bash
npm install --save-dev tsx
```

Update package.json:
```json
{
  "scripts": {
    "server:ts": "tsx src/server/index.ts"
  }
}
```

## Import Patterns for ES Modules + TypeScript

```typescript
// External packages - no extension needed
import express from 'express';
import cors from 'cors';

// Local files - MUST use .js extension
import { AcademicSearchService } from './services/academicAPIs.js';
import { helpers } from '../utils/helpers.js';

// Type-only imports
import type { Request, Response } from 'express';
import type { Source } from './services/academicAPIs.js';
```

## Common Errors and Solutions

### Error: "Cannot find module './academicAPIs'"
**Solution**: Add `.js` extension to import

### Error: "Unknown file extension .ts"
**Solution**: Use proper ts-node flags or tsx

### Error: "Could not find declaration file for module 'express'"
**Solution**: Install @types packages and configure tsconfig properly

## Recommended Approach

1. **For now**: Use the working .mjs server (`npm run server`)
2. **For production**: Migrate to tsx for clean TypeScript support
3. **For development**: Keep both options available

## Next Steps

1. Test current .mjs server: `npm run server`
2. When ready for TypeScript: Install tsx and update imports
3. Gradually migrate from .mjs to .ts with proper extensions

The .mjs server gives you all the functionality you need while avoiding TypeScript configuration complexity. 