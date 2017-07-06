# ExtJs5.x Example 学习文档

## Catalog

[TOC]

项目使用springMvc + Extjs5x,主要介绍前后端交互以及界面组件的mvc模式简单搭建使用,
开发同事可以通过阅读本文档来帮助开发。更多`examples`请参考 [Extjs 5.0 examples](http://examples.sencha.com/extjs/5.0.0/examples/kitchensink/)

## Introduction
>* package 创建规则及原理
* wro4j & extjs 压缩、合并js
* ext 处理国际化、权限控制等使用介绍
* Extjs5.x Mvc模式及组件介绍
* 分页插件集成
* 开发中的一些补充说明

# package 创建规则及原理
### 结构如下图

<div align = 'center' style='width:500px;'>
  <img src='images/package.png'/>
</div>

  >* PS : 原理请查看基础平台filter的实现原理文档

# wro4j & ExtJs 压缩、合并js
>* pom.xml的配置
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
* jsp中ext的配置
	* 在页面文件的head块中添加`<ext:module/>`标签,来进行extjs压缩
	```javascript
		<head>
		    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		    <META HTTP-EQUIV="CACHE-CONTROL" CONTENT="NO-CACHE">
		    <ext:module groups="table" subModule="table"/>
		</head>
	```
	* `<ext:module>` 标签
* wro.xml压缩文件配置
	* wro.xml添加js引用地址
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
	        <js>classpath:com/hoau/framework/module/table/server/META-INF/scripts/table/tableApp.js</js>
	    </group>
	</groups>
	```
