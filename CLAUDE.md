@AGENTS.md

# Reki - Flashcard App

## Convenciones

- Conventional Commits: feat:, fix:, chore:, docs:, refactor:, test:
- Branch naming: feat/F{fase}.{num}-descripcion
- Codigo en ingles, documentacion en español
- NO agregar comentarios innecesarios al codigo
- Respuestas cortas y directas
- Preferir editar archivos existentes sobre crear nuevos

## Estructura

- Screens en app/ (Expo Router)
- Logica de negocio en src/features/
- Componentes reutilizables en src/components/
- Database, FSRS, APKG parser en src/lib/
- State management en src/stores/ (Zustand)
- Types globales en src/types/

## Comandos

- `npx expo start` - dev server
- `npx expo lint` - lint
- `npx tsc --noEmit` - typecheck
- `npm run lint:fix` - autofix lint
- `npm run format` - format con prettier
