import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
	{
		ignores: ['**/build/**', '**/dist/**', '**/node_modules/**', '**/ios/**', '**/android/**'],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		plugins: {
			'react-hooks': reactHooks,
		},
		rules: {
			'array-bracket-spacing': 'warn',
			'arrow-spacing': 'warn',
			'block-spacing': 'warn',
			'brace-style': 'warn',
			'comma-dangle': ['warn', 'always-multiline'],
			'comma-spacing': 'warn',
			'computed-property-spacing': 'warn',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-member-accessibility': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-use-before-define': ['error', 'nofunc'],
			'@typescript-eslint/no-require-imports': 'off',
			'key-spacing': 'warn',
			'keyword-spacing': 'warn',
			'no-multi-spaces': 'warn',
			'no-whitespace-before-property': 'warn',
			'object-curly-spacing': ['warn', 'always'],
			'react-hooks/exhaustive-deps': ['warn', { 'additionalHooks': '^use[a-zA-Z0-9]+Effect$' }],
			'react-hooks/rules-of-hooks': 'error',
			'rest-spread-spacing': 'warn',
			'semi': ['warn', 'never'],
			'semi-spacing': 'warn',
			'space-before-blocks': 'warn',
			'space-before-function-paren': ['warn', 'never'],
			'space-in-parens': 'warn',
			'space-infix-ops': 'warn',
			'space-unary-ops': 'warn',
			'switch-colon-spacing': 'warn',
			'template-curly-spacing': 'warn',
			'quotes': ['warn', 'single'],
			'yield-star-spacing': 'warn',
		},
	},
)
