const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
	mode: 'development',

	entry: path.resolve(__dirname, 'src', 'App.tsx'),

	context: path.resolve(__dirname, 'src'),

	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.json'],
	},

	module: {
		rules: [
			{
				test: /\.(ts|tsx?)$/,
				loaders: ['babel-loader'],
				exclude: /node_modules/,
			},
		],
	},

	plugins: [
		new HtmlWebpackPlugin(),
	],

	devServer: {
		// contentBase: 'src-docs/build',
		host: '0.0.0.0',
		allowedHosts: ['*'],
		port: 8000,
		disableHostCheck: true,
	},
};
