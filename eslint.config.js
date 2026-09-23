import eslint from '@eslint/js';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores: ['dist/**', '.astro/**', '.wrangler/**', 'node_modules/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  { rules: { '@typescript-eslint/no-explicit-any': 'off' } },
);
