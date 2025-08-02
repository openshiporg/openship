# Multi-Claude Pair Programming Setup

## Communication Strategy: File-Based Handoffs

Use `ARCHITECT-PLAN.md` as the communication hub between the two Claude instances, following Claude Code best practices for multi-instance coordination.

## Startup Commands

### Terminal 1 (Architect)
```bash
cd /Users/junaid/dashboard-refactor/next-keystone-starter
claude-code
```

**Initial Prompt for Architect:**
```
Please read CLAUDE.md and begin analyzing the refactoring requirements for [specific component/feature]. Follow the instructions in ARCHITECT-PROMPT.md for your role as the strategic architect.
```

### Terminal 2 (Editor)
```bash
cd /Users/junaid/dashboard-refactor/next-keystone-starter
claude-code
```

**Initial Prompt for Editor:**
```
Please read ARCHITECT-PLAN.md and confirm if you're ready to begin implementation. Follow the instructions in EDITOR-PROMPT.md for your role as the implementation specialist.
```

## File Structure for Communication

- `CLAUDE.md` - Project guidance and patterns (existing)
- `ARCHITECT-PROMPT.md` - Architect role instructions
- `EDITOR-PROMPT.md` - Editor role instructions  
- `ARCHITECT-PLAN.md` - Living communication document (created by Architect)

## Workflow

1. **Architect** reads CLAUDE.md and creates initial analysis in ARCHITECT-PLAN.md
2. **Architect** develops complete refactoring strategy and marks "READY_FOR_EDITOR"
3. **Editor** reads ARCHITECT-PLAN.md and begins implementation
4. **Editor** updates progress in ARCHITECT-PLAN.md after each step
5. **Architect** monitors progress and provides course corrections as needed

## Benefits

- **Separation of Concerns**: Strategy vs Implementation
- **Component Extraction Focus**: Specialized for breaking down monolithic components
- **Quality Assurance**: Each Claude reviews the other's work
- **File-Based Communication**: Clear handoffs and progress tracking
- **CLAUDE.md Integration**: Follows project-specific patterns and commands