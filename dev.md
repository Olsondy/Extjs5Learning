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
>##pom.xml的配置
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
>## wro.xml压缩文件配置
* wro.xml添加js加载地址
	```xml
	<?xml version="1.0" encoding="UTF-8"?>
	<groups xmlns="http://www.isdc.ro/wro"
	        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	        xsi:schemaLocation="http://www.isdc.ro/wro wro.xsd">
	    <!--模块加载名称-->
	    <group name="table">
	        <js>classpath:com/hoau/framework/module/common/server/META-INF/scripts/ext-hoau.js</js>
	        <js>classpath:com/hoau/framework/module/common/server/META-INF/scripts/ty-util.js</js>
	        <js>classpath:com/hoau/framework/module/common/server/META-INF/scripts/commonSelector.js</js>
	        <js>classpath:com/hoau/framework/module/common/server/META-INF/scripts/common.js</js>
	        <js>classpath:com/hoau/framework/module/table/server/META-INF/scripts/table/tableApp.js</js>
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
>## jsp中配置ext标签
* 在页面文件的head块中添加`<ext:module/>`标签
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
		</head>
		<body></body>
		</html>
	```

>## js中的定义
	```javascript
	
	```
* 原理介绍:`<ext:module>` 标签,在`framework-server.jar`自定义的`taglib(ext.tld)`中配置了`<name>module</name>`的标签,servlet容器初始化时,初始化每个jsp的taglib,会调用指向的`tag-class`ModuleForJsTag.java中的实现方法,在相应的jsp页面生成权限,国际化的javascript代码
