module.exports = {
	'extends': ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'react-app'],
	'env': {
		'node': true,
		'es6': true,
	},
	'rules': {
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
		'func-call-spacing': 'warn',
		'generator-star-spacing': ['warn', 'after'],
		// https://github.com/typescript-eslint/typescript-eslint/blob/v1.6.0/packages/eslint-plugin/docs/rules/indent.md
		'indent': 'off',
		'@typescript-eslint/indent': ['warn', 'tab'],
		'jsx-a11y/alt-text': 'off',
		'jsx-a11y/anchor-is-valid': 'off',
		'key-spacing': 'warn',
		'keyword-spacing': 'warn',
		'@typescript-eslint/member-delimiter-style': ['warn', { 'multiline': { 'delimiter': 'none' } }],
		'@typescript-eslint/member-ordering': 'off',
		'@typescript-eslint/no-empty-interface': 'off',
		'no-multi-spaces': 'warn',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/no-use-before-define': ['error', 'nofunc'],
		'@typescript-eslint/no-var-requires': 'off',
		'no-whitespace-before-property': 'warn',
		'object-curly-spacing': ['warn', 'always'],
		// Will be replaced by https://github.com/facebook/react/pull/18580
		// Inspired by https://github.com/facebook/react/pull/16912#issuecomment-611724673
		'react-hooks/exhaustive-deps': ['warn', { 'additionalHooks': '^use[a-zA-Z0-9]+Effect$' }],
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
}
