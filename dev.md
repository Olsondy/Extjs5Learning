# ExtJs5.x Example 学习文档

## Catalog

[TOC]

项目使用springMvc + Extjs5x,主要介绍前后端交互以及界面组件的mvc模式简单搭建使用,
开发同事可以通过阅读本文档来帮助开发。更多`examples`请参考 [Extjs 5.0 examples](http://examples.sencha.com/extjs/5.0.0/examples/kitchensink/)

## Introduction
>* package 创建规则
>* wro4j & extjs 压缩、合并js
>* ext 处理国际化、权限控制等使用介绍
>* Extjs5.x Mvc模式及组件介绍

# package 创建规则及原理
## 结构如下图

<div align = 'center' style='width:500px;'>
  <img src='https://github.com/javady/Extjs5Learning/blob/master/images/package.png?raw=true'/>
</div>

  >* 原理请查看基础平台filter的实现原理文档

# wro4j & ExtJs 压缩、合并js
##pom.xml的配置
* 只需在当前模块的pom.xml中配置如下代码
```xml
	<build>
        <plugins>
            <plugin>
                <groupId>ro.isdc.wro4j</groupId>
                <artifactId>wro4j-maven-plugin</artifactId>
            </plugin>
        </plugins>
	</build>
```

## 使用wro.xml压缩文件配置
* 压缩当前scripts文件夹下的相关jsß
```xml
<?xml version="1.0" encoding="UTF-8"?>
<groups xmlns="http://www.isdc.ro/wro"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.isdc.ro/wro wro.xsd">

    <group name="table">
        <js>classpath:com/hoau/framework/module/common/server/META-INF/scripts/ext-hoau.js</js>
        <js>classpath:com/hoau/framework/module/common/server/META-INF/scripts/ty-util.js</js>
        <js>classpath:com/hoau/framework/module/common/server/META-INF/scripts/commonSelector.js</js>
        <js>classpath:com/hoau/framework/module/common/server/META-INF/scripts/common.js</js>
        <js>classpath:com/hoau/framework/module/table/server/META-INF/scripts/tableDemo/tableApp.js</js>
        <js>classpath:com/hoau/framework/module/table/server/META-INF/scripts/tableDemo/controller/tableController.js</js>
        <js>classpath:com/hoau/framework/module/table/server/META-INF/scripts/tableDemo/model/tableModel.js</js>
        <js>classpath:com/hoau/framework/module/table/server/META-INF/scripts/tableDemo/store/tableStore.js</js>
        <js>classpath:com/hoau/framework/module/table/server/META-INF/scripts/tableDemo/view/Viewport.js</js>
        <js>classpath:com/hoau/framework/module/table/server/META-INF/scripts/tableDemo/view/tableDemoView/tableSearchForm.js</js>
        <js>classpath:com/hoau/framework/module/table/server/META-INF/scripts/tableDemo/view/tableDemoView/tableGrid.js</js>
        <js>classpath:com/hoau/framework/module/table/server/META-INF/scripts/tableDemo/view/tableDemoView/tableAddWindow.js</js>
    </group>
</groups>
```

* 配置wro4j相关属性，新建wro.properties，属性含义参见[Java Web程序使用wro4j合并、压缩js、css等静态资源](http://everycoding.com/coding/68.html)
	```java
		managerFactoryClassName=ro.isdc.wro.manager.factory.ConfigurableWroManagerFactory
		preProcessors=semicolonAppender,cssMinJawr
		gzipResources=true
		encoding=UTF-8
		postProcessors=cssVariables,jsMin
		uriLocators=servletContext,uri,classpath
		hashStrategy=MD5
		namingStrategy=hashEncoder-CRC32
	```

* *更多参考[Maven插件wro4j-maven-plugin压缩、合并js、css详解](http://www.everycoding.com/coding/67.html)*

# ext 处理国际化、权限控制等使用介绍
## jsp中ext标签库
* 标签库的定义,如下图

<div align = 'center' style='width:900px;'>
  <img src='https://github.com/javady/Extjs5Learning/blob/master/images/extjs-02.png?raw=true'/>
</div>

* 在页面文件的head块中添加`<ext:module/>`,` <ext:permission/>`标签
```javascript
	<%@ page language="java"  pageEncoding="UTF-8" contentType="text/html; charset=UTF-8"%>
	<%@taglib uri="/ext" prefix="ext" %>
	<!DOCTYPE HTML>
	<html>
	<head>
	    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	    <META HTTP-EQUIV="CACHE-CONTROL" CONTENT="NO-CACHE">
	    <%@include file="common.jsp"%>
	    <ext:module groups="table" subModule="table"/>
	    <%--权限url配置集合--%>
	    <ext:permission urls="/table/addButton,
	    /table/updateButton,
	    /table/deleteButton"/>
	</head>
	<body></body>
	</html>
```

	* `<ext:module/>`标签用来生成加载压缩后的js代码引用
	* `<ext:permission/>`标签用来加载相应权限url集合,在每次操作界面请求时会请求到拦截器校验是否包含当前url的权限
## js中使用权限,国际化函数

<div align = 'center' style='width:900px;'>
  <img src='https://github.com/javady/Extjs5Learning/blob/master/images/extjs-03.png?raw=true'/>
</div>

* 注意:如果未使用压缩js代码,则ext taglib相关函数不会生效,原因是因为js代码被压缩到了`<ext:module/>`标签生成的javascrip中

##原理介绍
* 配置了ext taglib标签后在jsp中生成的结果如图

<div align = 'center' style='width:900px;'>
  <img src='https://github.com/javady/Extjs5Learning/blob/master/images/extjs-04.png?raw=true'/>
</div>

* 在`framework-server.jar`自定义的`taglib(ext.tld)`中配置了`<name>module</name>`的标签,servlet容器初始化时,会调用指向的`tag-class`标签对应的tag处理类,isPermission()函数和i18n()函数实现方法请参考`ext.tld`中相关的实现如下图

<div align = 'center' style='width:900px;'>
  <img src='https://github.com/javady/Extjs5Learning/blob/master/images/extjs-05.png?raw=true'/>
</div>

# Extjs5.x Mvc开发模式及组件介绍
## Mvc开发模式文件结构

<div align = 'center' style='width:600px;'>
  <img src='https://github.com/javady/Extjs5Learning/blob/master/images/extjs-06.png?raw=true'/>
</div>

* application,controller,model,store,view结构介绍(以demo为例),
	* `application`  创建tableApp.js 作为我们程序的入口文件
	<div align = 'center' style='width:900px;'>
	  <img src='https://github.com/javady/Extjs5Learning/blob/master/images/extjs-07.png?raw=true'/>
	</div>
	* 创建`controller` 存放作为我们的处理请求的控制器的js文件
	<div align = 'center' style='width:900px;'>
	  <img src='https://github.com/javady/Extjs5Learning/blob/master/images/extjs-08.png?raw=true'/>
	</div>
	* 创建`store` 存放作为数据源的绑定的js文件
	<div align = 'center' style='width:900px;'>
	  <img src='https://github.com/javady/Extjs5Learning/blob/master/images/extjs-09.png?raw=true'/>
	</div>
	* 创建`model` 存放作为数据模型映射的js文件
	<div align = 'center' style='width:900px;'>
	  <img src='https://github.com/javady/Extjs5Learning/blob/master/images/extjs-10.png?raw=true'/>
	</div>
	* 创建`view` 存放展示界面的视图js文件
	<div align = 'center' style='width:900px;'>
	  <img src='https://github.com/javady/Extjs5Learning/blob/master/images/extjs-11.png?raw=true'/>
	</div>

## 组件介绍
### `tableApp.js`应用程序主入口
```javascript
Ext.application({
    name: "tableDemo",  //设定应用程序的命名空间(它将是controller,view.model和store的命名空间)
    appFolder: '../scripts/table/tableDemo',//设定应用程序的路径
    controllers: ["tableController"], //加载应用程序所用到的所有controller ---文件名
    autoCreateViewport: true,  //开启自动创建Viewport,它将自动去view目录下查找Viewport文件并实例化
    launch: function () {}
})
```

* appFolder属性是用于加载当前javascript应用的路径,js在次文件路径下声明可实现相互引用

### `tableController.js` 控制器
```javascript
Ext.define('tableDemo.controller.tableController', {
    extend: 'Ext.app.Controller',
    stores: ['tableStore'],  //加载store模块  ->文件名
    models: ['tableModel'],  //加载model模块  ->文件名
    views: ['Viewport','tableDemoView.tableSearchForm', 'tableDemoView.tableGrid','tableDemoView.tableAddWindow'], 
    init: function () {
        this.control({
            'tableGrid button[action=add]': {   //ext的 dom 属性查询方法找到相应按钮
                click: this.addCustomerInfoWin
            },
        });
}
```

* `stores`属性可以声明引用`appFolder`定义的路径下store文件夹的js文件
* `models`则类似,也是引用定义路径下的model文件夹的js文件
* `views` 属性,加载所需的视图组件, 写法规则为view路径下的 文件夹/文件名
* `init` 一个初始化方法,初始化当前所有定义的钩子方法

### `tableStore.js` 数据源
```javascript
Ext.define("tableDemo.store.tableStore", {
    extend: "Ext.data.Store",
    model: "tableDemo.model.tableModel",
    pageSize : 15,
    proxy: {
        type: 'ajax',
        url: 'queryCustomerByPaging',
        reader: {
            type: 'json',
            rootProperty: 'result.customerDtoList',
            totalProperty: 'result.totalCount'
        }
    },
    listeners : {
        'beforeload' : function(store, operation, eOpts) {
            var queryForm = Ext.getCmp('tableViewId').getSearchForm().getForm();
            if (!Ext.isEmpty(queryForm)) {
                var params = {   //封装请求参数
                    'customerDto.accountCode' : queryForm.findField('accountCode').getValue(),
                    'customerDto.industryCode' : queryForm.findField('industryCode').getValue(),
                    'customerDto.enterpriseType' : queryForm.findField('enterpriseType').getValue(),
                    'customerDto.enterpriseName' : queryForm.findField('enterpriseName').getValue(),
                    'startDate' : queryForm.findField('startDate').getValue(),
                    'endDate' : queryForm.findField('endDate').getValue()
                };
                Ext.apply(store.proxy.extraParams, params);
            }
        }
    },
    autoLoad: false
})
```

* 参考Extjs store类属性介绍[Store](http://docs.sencha.com/extjs/5.0.1/api/Ext.data.Store.html)
* `rootProperty`是后端返回的数组对象,
* `totalProperty`是后端返回的数据总数

### `tableModel.js`模型
```javascript
Ext.define('tableDemo.model.tableModel', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'id'},
        { name: 'enterpriseName'},//客户企业全称
        { name: 'accountCode'},//客户账号
        { name: 'enterpriseType'},//企业性质
        { name: 'detailAddress'},//详细地址
        { name: 'industryCode'},//所属行业
        { name: 'createDate', type : 'date', dateFormat:'time'},//创建时间
        { name: 'createUser'},//创建人
        { name: 'modifyDate', type : 'date', dateFormat:'time'},//创建时间
        { name: 'modifyUser'}//修改人

    ]
})
```

* fields 定义映射的数据模型,和后台的实体字段对应,
	* 在field数组对象属性中,每个对象相关name对象实体的字段,也可声明`mapping`属性,进行复杂的关联映射
		```javascript
			Ext.define('crm.model.Customer', {
		    extend: 'Ext.data.Model',
		    fields: [
		        { name: 'id'},
		        { name: 'enterpriseName'},//客户企业全称
		        { name: 'contactName', mapping: 'contactDto.contactName'}//主联系人姓名
		    ]
		})
		```
	* 对应的java类映射
		```java
		public class CustomerDto {

			private ContactDto contactDto;

		}
		```
	* json结果
		```
		{
			customerDto : {
				contactDto : {
					"contactName":'联系人名称'
				}
			}
		}
		```
### `Viewport.js` 视图容器
```javascript
Ext.define("tableDemo.view.Viewport", {
	id : 'tableViewId',
	extend: "Ext.container.Viewport",
	layout: "border",   //extjs的boder布局
	items: [{
	    xtype:"tableSearchForm"
	},{
	    xtype:"tableGrid"
	}],
	getSearchForm : function(){
	    return this.items.get(0);    //获取当前view面板的 第一个item -> 查询表单
	},
	getTableGrid : function(){
	    return this.items.get(1);   //获取当前view面板的 第二个item -> 表格
	}
})
```

* 定义视图类,在`tableApp.js`中的autoCreateViewport属性会自动创建当前item属性的视图组件,组件的类型已组件别名引用

### 界面视图组件:FormPanel,GridPanel
* `FormPanel`介绍
```javascript
Ext.define("tableDemo.view.tableDemoView.tableSearchForm", {
    extend : "Ext.form.Panel",
    alias : 'widget.tableSearchForm',
    width : '100%',
    height : 120,
    layout : 'column',
    region : 'north', //基于border布局的使用
    defaults : {
        msgTarget : 'qtip',
        margin: '15 10 5 0',
        labelWidth : 100,
        columnWidth : 0.25,
        labelAlign : 'right'
    },
    defaultType : 'textfield',
    items : []
})
```
	* defaults 属性对象中设置 form表单子组件的宽度,对齐方式,以及间距等布局设计
	* 更多 formPanel 属性方法 参考[Panel](http://docs.sencha.com/extjs/5.0.1/api/Ext.form.Panel.html)


* `GridPanel`和`Store`配合的分页组件
```javascript
Ext.define("tableDemo.view.tableDemoView.tableGrid", {
    extend: "Ext.grid.Panel",
    alias: 'widget.tableGrid',
    store: "tableStore",
    region: 'center',
    width: '100%',
    emptyText: '查询结果为空',
    viewConfig: {
        enableTextSelection: true
    },
    columns: {
        defaults: {
            align: 'left'
        },
        items: []            
    },
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
    },
    constructor: function (config) {
        var me = this, cfg = Ext.apply({}, config);
        me.bbar = me.getPagingToolbar();
        me.callParent([cfg]);
    }
})
```

	* store属性加载store文件夹中相应的Store类名称
	* pagingToolbar对象是分页工具栏组件,属性详解参考[Paging](http://docs.sencha.com/extjs/5.0.1/api/Ext.toolbar.Paging.html)
	* 获取数据时.可以获得当前grid面板的分页组件的方法直接获取数据 `getTableGrid().getPagingToolbar().moveFirst()`或者执行store的刷新`getTableGrid().getStore().reload()`

* 更多参考 [Extjs MVC开发模式详解](http://www.qeefee.com/article/extjs-mvc-in-detail)

#注意事项
* 在view视图定义是,根据情况需定义view类的别名,在每个类的`alias`属性上设置别名即可,
* 每个声明的类名称需要和js文件名一致,否则有可能会导致,引用的js加载失败js或者js加载成功但是界面组件生成不了




	
