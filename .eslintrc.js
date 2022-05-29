module.exports = {
	env: {
		es6: true,
		node: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		sourceType: 'module',
		allowImportExportEverywhere: false,
	},
	plugins: ['@typescript-eslint'],
	rules: {
		// 禁止不必要的括号
		'@typescript-eslint/no-extra-parens': 'error',
		// 驼峰法命名
		'camelcase': 'error',
		// 单引号
		'@typescript-eslint/quotes': ['error', 'single'],
		// 行尾部分号
		'@typescript-eslint/semi':['error', 'always'],
		// tab 缩进
		'@typescript-eslint/indent': ['error', 'tab'],
		// 禁止 if 语句中有 return 之后有 else
		'no-else-return':'error',
		// 禁止或强制在单行代码块中使用空格
		'block-spacing': ['error', 'always'],
		// 数组和对象键值对最后一个逗号， never参数：不能带末尾的逗号, always参数：必须带末尾的逗,always-multiline：多行模式必须带逗号，单行模式不能带逗号号
		'comma-dangle': ['error', 'always-multiline'],
		// 控制逗号前后的空格
		'comma-spacing': ['error', { 'before': false, 'after': true }],
		// 控制逗号在行尾出现还是在行首出现 (默认行尾)
		'comma-style': ['error', 'last'],
		// 构造函数首字母大写
		'new-cap': ['error', { 'newIsCap': true, 'capIsNew': false}],
		// 空行不能够超过2行
		'no-multiple-empty-lines': ['error', {'max': 2}],
		// 换行风格
		'linebreak-style': [ 'error', 'unix' ],
		// 禁止对一些关键字或者保留字进行赋值操作，比如NaN、Infinity、undefined、eval、arguments等
		'no-shadow-restricted-names': 'error',
		// 禁止使用 console
		'no-console': 'off',
		// getter 必须有返回值
		'getter-return': 'error',
		// 不能与 -0 比较
		'no-compare-neg-zero': 'error',
		// 箭头函数函数体简写
		'arrow-body-style': ['error', 'as-needed'],
		// 箭头函数参数简写
		'arrow-parens': ['error', 'as-needed'],
		// constructor 中的 super
		'constructor-super': 'error',
		// 将类的声明视为常量
		'no-class-assign': 'error',
		// 禁止给常量赋值
		'no-const-assign': 'error',
		// 禁止在比较中赋值
		'no-cond-assign': 'warn',
		// 禁止条件表达式部分使用常量表达式
		'no-constant-condition': 'error',
		// 禁止在正则表达式中使用控制字符
		'no-control-regex': 'error',
		// 禁止使用 debugger
		'no-debugger': 'off',
		// 禁止重复的参数名称
		'no-dupe-args': 'error',
		// 禁止重复的键名称
		'no-dupe-keys': 'error',
		// 禁止 case 中存在相同的值
		'no-duplicate-case': 'error',
		// 禁止空的块存在
		'no-empty': ['error', { allowEmptyCatch: true }],
		// 禁止正则表达式中使用空的字符串组
		'no-empty-character-class': 'error',
		// 禁止为 catch 中的错误参数赋值
		'no-ex-assign': 'error',
		// 禁止不必要的布尔强制转换
		'no-extra-boolean-cast': 'error',
		// 禁止不必要的分号
		'no-extra-semi': 'error',
		// 禁止为函数赋值
		'no-func-assign': 'error',
		// 禁止块内存在函数定义语句
		'no-inner-declarations': 'off',
		// 禁止使用稀疏数组
		'no-sparse-arrays': 'error',
		// 禁止在普通字符串中使用 ${} 的写法
		'no-template-curly-in-string': 'error',
		// 禁止易混淆的多行表达式写法
		'no-unexpected-multiline': 'error',
		// 禁止不可达代码
		'no-unreachable': 'warn',
		// 禁止 finally 中存在于流控制相关的语句
		'no-unsafe-finally': 'error',
		// 强制使用 isNaN 判断是否为 NaN
		'use-isnan': 'error',
		// 必须使用有效的 typeof 值
		'valid-typeof': 'error',
		// 禁止使用 var
		'no-var': 'error',
		// if、for、while 等中总是使用块
		'curly': 'error',
		// 多行拆分. 运算符是，. 的位置
		'dot-location': ['error', 'property'],
		// 强制使用 === 及 !==
		'eqeqeq': 'error',
		// 禁止使用 alert, confirm 和 prompt
		'no-alert': 'error',
		// 禁止使用 arguments.caller 和 arguments.callee
		'no-caller': 'error',
		// switch-case: 中定义变量时，必须使用 块
		'no-case-declarations': 'error',
		// 禁止使用 eval
		'no-eval': 'error',
		// 禁止隐式使用 eval
		'no-implied-eval':　'error',
		// 禁止扩展原生对象
		'no-extend-native': 'error',
		// 禁止使用无意义的 bind
		'no-extra-bind': 'error',
		// 禁止使用标签
		'no-labels': 'error',
		// 禁止使用跨越多个代码段的 case
		'no-fallthrough': 'warn',
		// 禁止使用省略的小数格式
		'no-floating-decimal': 'error',
		// 禁止为全局常量赋值
		'no-global-assign': 'error',
		// 禁止使用较短的符号进行类型转换
		'no-implicit-coercion': 'error',
		// 禁止使用 __iterator__ 属性
		'no-iterator': 'error',
		// 禁止使用无意义的嵌套
		'no-lone-blocks': 'error',
		// 禁止创建原始类型对应类的实例
		'no-new-wrappers': 'error',
		// 禁止 es5 中的八进制数字格式
		'no-octal': 'error',
		// 禁止 es5 中的八进制数字格式的字符编码
		'no-octal-escape': 'error',
		// 禁止使用 __proto__ 属性
		'no-proto': 'error',
		// 禁止一般的返回语句中使用 await
		'no-return-await': 'error',
		// 禁止使用 JavaScript: url
		'no-script-url': 'error',
		// 禁止直接给变量自身赋值
		'no-self-assign': 'error',
		// 禁止直接与自身比较
		'no-self-compare': 'error',
		// 限制 throw 的值
		'no-throw-literal': 'error',
		// 限制 Promise 的 reject 的值
		'prefer-promise-reject-errors': 'error',
		// 禁止绝对的死循环
		'no-unmodified-loop-condition': 'error',
		// 禁止无用的表达式
		'no-unused-expressions': 'error',
		// 禁止不必要的 call 及 apply
		'no-useless-call': 'error',
		// 禁止不必要的 catch
		'no-useless-catch': 'error',
		// 禁止不必要的字符串连接
		'no-useless-concat': 'error',
		// 禁止不必要的转义字符
		'no-useless-escape': 'error',
		// 禁止不必要的 return
		'no-useless-return': 'error',
		// 禁止不必要的计算属性
		'no-useless-computed-key': 'error',
		// 禁止不必要的 constructor
		'no-useless-constructor': 'error',
		// 禁止不必要的重命名
		'no-useless-rename': 'error',
		// 禁止使用 void
		'no-void': 'error',
		// 禁止使用 with
		'no-with': 'error',
		// 禁止使用 delete 删除变量
		'no-delete-var': 'error',
		// 生成器的 * 的前后空格
		'generator-star-spacing': ['error', 'before'],
		// 禁止对 Symbol 使用 new
		'no-new-symbol': 'error',
		// 对于继承的类的构造函数，必须在使用 this 前调用 super()
		'no-this-before-super': 'error',
		// 创建对象的简写格式
		'object-shorthand': ['error', 'always'],
		// 使用解构写法，而不是传统的赋值
		'prefer-destructuring': 'error',
		// 使用扩展语法，而不是 apply
		'prefer-spread': 'error',
		// 使用字符串模板，而不是字符串拼接
		'prefer-template': 'error',
		// 生成器函数应当使用 yield 关键字
		'require-yield': 'error',
		// rest、spread运算符与其表达式之间禁止留有空格
		'rest-spread-spacing': ['error', 'never'],
		// 模板字符串括号前后保留空格
		'template-curly-spacing': ['error', 'always'],
		// yield 后 * 前后的空格
		'yield-star-spacing': ['error', 'before'],
		// 计算键名的空格
		'computed-property-spacing': ['error', 'never'],
		// 文件尾部空行
		'eol-last': ['error', 'always'],
		// JSX 中的引号
		'jsx-quotes': ['error', 'prefer-double'],
		// 调用函数时，括号前的空格
		'func-call-spacing': ['error', 'never'],
		// 调用函数时的参数间的换行
		'function-call-argument-newline': ['error', 'consistent'],
		// 定义函数时的参数间的换行
		'function-paren-newline': ['error', 'consistent'],
		// 关键字前后的空格
		'keyword-spacing': ['error'],
		// 注释的位置
		'line-comment-position': ['error', { position: 'above' }],
		// 嵌套深度
		'max-depth': ['error', {max: 5 }],
		// 文件的最大行数
		'max-lines': ['error', {max: 200, skipBlankLines: true, skipComments: true}],
		// 最大回调嵌套
		'max-nested-callbacks': ['error', { max: 3 }],
		// new 时的括号
		'new-parens': ['error', 'always'],
		// 链式调用时，每行的最大调用数量
		'newline-per-chained-call': ['error', {ignoreChainWithDepth: 3}],
		// 禁止将if语句作为else块中的唯一语句
		'no-lonely-if': 'error',
		// 禁止行尾空格
		'no-trailing-spaces': 'error',
		// 禁止属性名前的空格
		'no-whitespace-before-property': 'error',
		// 强制赋值运算符简写
		'operator-assignment': ['error', 'always'],
		// 分号前后的空格
		'semi-spacing': ['error', {'before': false, 'after': true}],
		// 中缀运算符前后的空格
		'space-infix-ops': 'error',
		// 一元运算符前后的空格
		'space-unary-ops': [ 'error', { 'words': true, 'nonwords': false }],
		// 禁用 BOM
		'unicode-bom': ['error', 'never'],
		// 禁用模板标签与其文字之间的间距
		'template-tag-spacing': ['error', 'never'],
	},
};
