module.exports = {
    entry: './src/main.js',
    output: {
        path: "./build",
        filename: 'build.js'
    },
    module: {
        loaders: [{
            test: /\.vue$/,
            exclude: /node_modules/,
            loader: 'vue'
        }, {
            test: /\.css$/,
            loader: 'style!css'
        }, {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            query: {
                cacheDirectory: true,
                presets: ['es2015']
            }
        }]
    },
    vue: {
        autoprefixer: {
            browsers: ['last 2 versions']
        }
    }
};
