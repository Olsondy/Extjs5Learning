# 前端javascript开发规范文档

[TOC]

## 目录
>* 命名
>* 实践
>* 配置
>* 错误 & 调试

## 介绍
* 此文档适用 Extjs5.x MVC 开发模式,开发人员通过此文档来规范开发[example文档](https://javady.gitbooks.io/extjs5-mvc-learning/content/dev.html)

### 特点
* 简单易学。
* 快速开发、效率高。
* 良好的结构、可扩展性和可维护性。

## 命名
*以下所有命名只能包含字母,不要使用下划线，连字符等任何非字母数字符号。*
### Variable
* <font color='purple'>【强制】</font>&nbsp;小驼峰式命名法。

* <font color='purple'>【强制】</font>&nbsp;前缀应当是名词。(函数的名字前缀为动词，以此区分变量和函数)

* <font color='green'>【正例】</font>
		```javascript
			var maxCount = 10;
			var tableTitle = 'LoginTable';
		```
* <font color='red'>【反例】</font>
		```javascript
			var setCount = 10;
			var getTitle = 'LoginTable';

		```
### Function
* <font color='purple'>【强制】</font>&nbsp;小驼峰式命名法。

* <font color='purple'>【强制】</font>&nbsp;前缀应当为动词。

|动词　　|	含义	|返回值 |
| --------   | :-----:  | :----:  |
|can | 判断是否可执行某个动作(权限)|	函数返回一个布尔值。true：可执行；false：不可执行
|has | 判断是否含有某个值 |	函数返回一个布尔值。true：含有此值；false：不含有此值
|is	 | 判断是否为某个值 |	函数返回一个布尔值。true：为某个值；false：不为某个值
|get	| 获取某个值  |	函数返回一个非布尔值
|set	| 设置某个值  |	无返回值、返回是否设置成功或者返回链式对象
|load	| 加载某些数据 |无返回值或者返回是否加载完成的结果

### MVC模式的目录及文件名命名规约
* <font color='green'>【正例】</font>
	```javascript
		- - pages
		- - scripts
			- - pageDir  //页面一
				- - controller 
					- - prefixController.js
						...
				- - store
					- - prefixStore.js
						...
				- - model
					- - prefixModel.js
						...
				- - view  
					- - viewFloder
						- - prefix...Window
						- - prefix...Form
						- - prefix...Grid
							...
					- - ViewPort    
				- - application.js   //mvc 程序入口
			- - twoModule    //页面二
					...
			- - threeModule  //页面三
					...
		- - styles
	```
* <font color='purple'>【强制】</font>&nbsp;当前模块有不同页面都要在`scripts`下新增不同页面的目录.

* <font color='purple'>【强制】</font>&nbsp;在当前页面模块目录下创建`controller`、`store`、`model`、`view`目录,是mvc模式的规范.

* <font color='purple'>【强制】</font>&nbsp;mvc程序入口文件`application.js`,建议为当前领域模块名称为前缀,如`prefixApp.js`,name属性值声明为当前页面名称以作为一个应用名.

* <font color='purple'>【强制】</font>&nbsp;view目录下,需要新增视图文件`Viewport.js`,名字只允许为Viewport,目录按照不同页面模块存放视图使用js,不与`ViewPort.js`在同一层目录.

* <font color='purple'>【强制】</font>&nbsp;在`controller`、`model`、`store`文件夹中,新增的js文件名前缀须加上与当前模块相关名称,方便查找和维护.

	* <font color='green'>【正例】</font>`prefixController.js`、`prefixModel.js`、`prefixStore.js`、`prefix...Window.js`、`prefix...SearchForm.js`、`prefix...Grid.js`

	* <font color='red'>【反例】</font>`controller.js`、`model.js`、`store.js`、`list.js`、`search.js`、`grid.js`

###Component、Property、Method 规约

* <font color='purple'>【强制】</font>&nbsp;声明自定义组件类名称规约,`<appName>.<pageDir>.<pageDir>.<fileName>`,目录级别按路径层级为准.
	* <font color='green'>【正例】</font>
		```javascript
			Ext.define('appName.pageDir.controller.demoController',{
				...
				property,
				constructor: function() { ... }
			});
		```
	* <font color='red'>【反例】</font>
		```javascript
			Ext.define('fileName',{
				...
				property,
				constructor: function() { ... }
			});
		```
* <font color='purple'>【强制】</font>&nbsp;自定义组件类`componment`中必须声明`constructor`函数,并且在底部调用,否则无法加载.

## 实践
### Development
* <font color='purple'>【强制】</font>&nbsp;代码中不允许留有`console.log()`、`console.info()`、`console.error()`console家族的代码以及类似调试代码的函数

* <font color='purple'>【强制】</font>&nbsp;jsp中不允许引入js或者是调试注释的js

* <font color='purple'>【强制】</font>&nbsp;和后端做异步交互请求时,每个请求都需要添加遮罩层,防止多次请求,或者给按钮设置不可用,获得响应后再设置为可用

* <font color='purple'>【强制】</font>&nbsp;不要在js中添加全局变量,可以添加静态方法.
	* <font color='green'>【正例】</font>
		```javascript
			Ext.define('appName.pageDir.controller.demoController', {
			     statics: {
			         DEMOCONSTANT:'test'
			     },
			     constructor: function() { ... }
			});
			console.log(appName.pageDir.controller.demoController.DEMOCONSTANT);
		```

* <font color='orange'>【推荐】</font>&nbsp;除mvc之外的类,建议养成始终用Ext.create来创建类示例的习惯,因为它允许你利用动态加载的优势.
	* <font color='green'>【正例】</font>
		```javascript
			var myWindow = Ext.create('My.own.Window', {
 			     title: 'Hello World',
 			     bottomBar: {
 			         height: 60
 			     }
 			 });
 			  
 			 alert(myWindow.getTitle()); // alerts "Hello World"
 			  
 			 myWindow.setTitle('Something New');
 			  
 			 alert(myWindow.getTitle()); // alerts "Something New"
 			  
 			 myWindow.setTitle(null); // alerts "Error: Title must be a valid non-empty string"
 			  
 			 myWindow.setBottomBar({ height: 100 }); // Bottom bar's height is changed to 100
		```
* <font color='purple'>【强制】</font>&nbsp;`common.js`和`util.js`封装了大量的扩展组件和方法,可复用组件统一定义在`common.js`中,工具类的公用函数定义在`util.js`中

#### Form Panel 、Grid Panel
* <font color='purple'>【强制】</font>&nbsp;界面查询表单中的按钮使用`buttons`属性组件,只做重置和提供查询条件的功能,`curd` 操作按钮统一在`grid`上设定tbar组件.

* <font color='purple'>【强制】</font>&nbsp;`formPanel` 中`textfield`组件的宽度只允许设定`columnWidth`,支持基本响应式功能.

* <font color='purple'>【强制】</font>&nbsp;`formPanel` 统一要设置`defaults`属性对象的值,比如对齐方式,label是否带有冒号,全局的lable文字宽度,组件宽度

* <font color='purple'>【强制】</font>&nbsp;`gridPanel`组件首列统一设置`rownumberer`类型的列,设置`default`的`align`属性为`center`.

* <font color='purple'>【强制】</font>&nbsp;`gridPanel`组件的分页插件,都需要设置`displayInfo`的属性值为`true`,用于在右下角显示条数和总数
	* <font color='green'>【正例】</font>
		```javascript
			pagingToolbar: null,
		    getPagingToolbar: function () {
		        if (this.pagingToolbar == null) {
		            this.pagingToolbar = Ext.create('Ext.toolbar.Paging', {
		                store: this.store,
		                dock: 'bottom',
		                displayInfo: true
		            });
		        }
		        return this.pagingToolbar;
		    }
		```
* <font color='purple'>【强制】</font>&nbsp;tbar上的按钮组`css3 font`图标一定要在图标库找到符合的图标,不能随意使用(css3图标库已经更新到最新).

* <font color='purple'>【强制】</font>&nbsp;tbar上的按钮组,需要设置成响应式按钮组.

#### Window
* <font color='purple'>【强制】</font>&nbsp;`window'的关闭模式,都统一使用`destory`模式(默认)

* <font color='purple'>【强制】</font>&nbsp;`window`中的按钮设置要符合`windows`操作系统中的习惯操作位置来放置,[保存]在左,[取消]在右,并且在底部垂直居中.

* <font color='purple'>【强制】</font>&nbsp;提示类型的`window`,要使用封装好的弹出提示框`warning`、`error` 、`msg`、`confirm`

### Api的使用建议
* <font color='orange'>【推荐】</font>&nbsp;尽量使用Extjs方言
	* <font color='blue'>【说明】</font>&nbsp;ExtJS提供了很多有用的方法，解决客户端JavaScript常见的开发任务，常见的有查询HTMLDom，创建HTML元素，为HTML元素注册事件响应函数等，这些大可以全部使用ExtJS提供的方法，使自己代码构建与ExtJS之上.
	* <font color='green'>【正例】</font>

		>* 减少使用getCmp(id)或者get(id)方法来达到减少内存消耗的目的,可以使用`up()`,`down()`,`widget()`.
		>* 查询ID为container的DIV下所有的checkbox，可以使用`Ext.fly(‘container’).select(‘input【type=checkbox】’)`
		>* 在ID为container的DIV内创建一个按钮，可以使用`Ext.fly(‘container’).createChild({ tag: ‘input’, type: ‘button’})`
		>* 为ID为container的DIV的click事件注册处理函数，可以使用`Ext.fly(‘container’).on(‘click’, handlerFn, scope)`
		>* 操作dom可以使用,`Ext.query`,`Ext.DomHelper`,`Ext.DomQuery`

### 注释
*js支持两种不同类型的注释：单行注释和多行注释。*
#### 单行注释
* <font color='blue'>【说明】</font>&nbsp;单行注释以两个斜线开始，以行尾结束.
	* <font color='purple'>【强制】</font>&nbsp;单独一行：`//`(双斜线)与注释文字之间保留一个空格。

	* <font color='purple'>【强制】</font>&nbsp;在代码后面添加注释：`//`(双斜线)与代码之间保留一个空格，并且`//`(双斜线)与注释文字之间保留一个空格。

	* <font color='purple'>【强制】</font>&nbsp;注释代码：`//`(双斜线)与代码之间保留一个空格。

* <font color='green'>【正例】</font>
	```javascript
		// 调用了一个函数； 1)单独在一行
		setTitle();
		 
		var maxCount = 10; // 设置最大量； 2)在代码后面注释
		 
		// setName(); //  3)注释代码
	```
#### 多行注释
* <font color='blue'>【说明】</font>&nbsp;以`/*`开头，`*/`结尾.
	* <font color='purple'>【强制】</font>&nbsp;若开始`(/*)`和结束`(*/)`都在一行，采用单行注释。

	* <font color='purple'>【强制】</font>&nbsp;若至少三行注释时，第一行为`/*`，最后行为`*/`，其他行以*开始，并且注释文字与`*`保留一个空格。
	
* <font color='green'>【正例】</font>
	```javascript
		/*
		 * 代码执行到这里后会调用setTitle()函数
		 * setTitle()：设置title的值
		 */
		setTitle();
	```

## 配置
### Dev Tool
* <font color='purple'>【强制】</font>&nbsp;所有的js文件都必须添加文件注释头
	* IDEA模板:打开Setting->Editor->File And Code Templates->Files,选择JavaScript File,修改文件注释头
	* <font color='green'>【正例】</font>
		```javascript
			/**
			 * @description:
			 * @author: ${USER}
			 * @date: ${DATE} ${TIME}
			 */
		```
* <font color='purple'>【强制】</font>&nbsp;代码格式化
	* 提交代码前检验代码中是否多余空白行造成代码不规整,可读性差的问题
		* javascript代码都使用idea默认代码格式主题,或者在提交前,选择局部代码快捷键格式化后提交,保持代码的可读性高(不要全局格式化)
		* Mac os  快捷键  `cmd` + `option` + `l`  (kemaps[Mac ox 10.5+])
		* win  快捷键 `ctrl` + `shift` + `f`   (kemaps[Eclipse])

### 压缩 
* <font color='purple'>【强制】</font>&nbsp;所有带有js的文件须使用压缩插件.
	* <font color='blue'>【说明】</font>
		* `pom.xml` 必须要配置插件依赖`wro4j-maven-plugin`,
		* `pom.xml`必须声明`<properties><moduleContext>moduleName</moduleContext></properties>`声明模块的名称,否则`maven install` 会失败
		* `wro.xml`配置了需要使用的js文件引入,jsp中使用`<ext:module/>`标签定义压缩后的js文件前缀名称.在`wro.properties`文件中配置压缩的属性
		* `wor.xml`不允许引入已经被压缩过或者混淆过的mini.js文件,否则压缩后的该文件不生效
		* `wor.xml`不允许引入不被使用js提交到git上
	
## 错误&调试
* <font color='orange'>【推荐】</font>&nbsp;你可以使用Ext.getDisplayName()来显示任意方法的名字.这对显示抛出异常的类和方法非常有用.
	```javascript
		throw new Error('['+ Ext.getDisplayName(arguments.callee) +'] Some message here');
	```

* <font color='orange'>【推荐】</font>&nbsp;使用ant.xml实现静态资源打包来进行js更新调试功能
	* <font color='blue'>【说明】</font>&nbsp;
		* 在当前的module根目录下新建ant.xml,添加导入资源的配置信息,将ant.xml导入idea中的右侧ant build面板中,运行run build即可(如没有则点击左下角的面板图标,选择ant build)
		* jsp中要引入需要调试的js,`wro.xml`中相应的js不能再引入(修改后的文件切勿提交到git)
		
* <font color='green'>【正例】</font>&nbsp;`ant.xml`配置example
	```xml
		<?xml version="1.0"?>
		<project basedir="." name="table" default="deploy">  <!-- name 需要修改为自己的工程名称 -->
			<!-- 静态资源paste目录地址,webapp下的资源访问目录 -->
			<property name="webapp" value="${basedir}/../demo-login/src/main/webapp" />   <!--  -->
			<property name="todir-scripts" value="${webapp}/scripts/${ant.project.name}/" />
			<property name="todir-pages" value="${webapp}/WEB-INF/pages/${ant.project.name}/" />
			<property name="todir-images" value="${webapp}/images/${ant.project.name}/" />
			<property name="todir-styles" value="${webapp}/styles/${ant.project.name}/" />
			<!-- 静态资源copy目录地址 -->
			<property name="fromdir" value="${basedir}/src/main/resources/com/hoau/framework/module/table/server/META-INF" />
			<property name="scripts" value="${fromdir}/scripts"/>
		    <property name="pages" value="${fromdir}/pages"/>
		    <property name="images" value="${fromdir}/images"/>
		    <property name="styles" value="${fromdir}/styles"/>
			<target name="deploy">
		        <copy todir="${todir-scripts}" overwrite="true" verbose="true">
		            <fileset dir="${scripts}">
		                <include name="**" />
		            </fileset>
		        </copy>
		        <copy todir="${todir-pages}" overwrite="true" verbose="true">
		            <fileset dir="${pages}">
		                <include name="**" />
		            </fileset>
		        </copy>
		        <copy todir="${todir-images}" overwrite="true" verbose="true">
		            <fileset dir="${images}" >
		                <include name="**"/>
		            </fileset>
		        </copy>
		        <copy todir="${todir-styles}" overwrite="true" verbose="true">
		            <fileset dir="${styles}">
		                <include name="**" />
		            </fileset>
		        </copy>
		        <echo>
		            ${webapp}
		        </echo>
		    </target>
		</project> 
	```

