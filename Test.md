#后台开发说明文档
--------------------------------
目录

[TOC]

##1. 创建项目(packaging->pom)
###1.1 创建新项目  

> * File -> New -> Project...
* 左侧选择创建`Maven`项目，右侧选择或配置SDK版本为`1.7`  
* 配置项目GroupId、ArtifactId及Version
* 后续按照默认设置即可完成创建 

###1.2 从代码仓库检出项目

>* File -> New ->Project From Version Controll -> Git
* 填写Git仓库地址，配置代码检出位置,clone

###1.3 pom编写
- 添加开发平台相关依赖
```xml
<dependency>
    <groupId>com.hoau.hbdp</groupId>
    <artifactId>framework-server</artifactId>
    <version>2.0</version>
</dependency>
<dependency>
    <groupId>com.hoau.hbdp</groupId>
    <artifactId>framework-shared</artifactId>
    <version>2.0</version>
</dependency>
<dependency>
    <groupId>com.hoau.hbdp</groupId>
    <artifactId>framework-sso</artifactId>
    <version>2.0</version>
</dependency>
<dependency>
    <groupId>com.hoau.hbdp</groupId>
    <artifactId>hbdp-webservice</artifactId>
    <version>2.0</version>
</dependency>
```
- 打包插件管理
```xml
<build>
    <pluginManagement>
        <plugins>
            <plugin>
                <groupId>ro.isdc.wro4j</groupId>
                <artifactId>wro4j-maven-plugin</artifactId>
                <version>${wro4j-version}</version>
                <executions>
                    <execution>
                        <phase>process-resources</phase>
                        <goals>
                            <goal>run</goal>
                        </goals>
                    </execution>
                </executions>
                <configuration>
                    <minimize>${minimize}</minimize>
                    <extraConfigFile>${basedir}/src/main/resources/com/hoau/framework/module/${moduleContext}/server/META-INF/wro.properties</extraConfigFile>
                    <wroManagerFactory>ro.isdc.wro.maven.plugin.manager.factory.ConfigurableWroManagerFactory</wroManagerFactory>
                    <cssDestinationFolder>${project.build.directory}/classes/com/hoau/framework/module/${moduleContext}/server/META-INF/styles/wro/</cssDestinationFolder>
                    <jsDestinationFolder>${project.build.directory}/classes/com/hoau/framework/module/${moduleContext}/server/META-INF/scripts/wro/</jsDestinationFolder>
                    <wroFile>${basedir}/src/main/resources/com/hoau/framework/module/${moduleContext}/server/META-INF/wro.xml</wroFile>
                    <groupNameMappingFile>${project.build.directory}/classes/com/hoau/framework/module/${moduleContext}/server/META-INF/wromapping.properties</groupNameMappingFile>
                </configuration>
            </plugin>
        </plugins>
    </pluginManagement>
</build>
```
- 多环境环境变量参数配置
```xml
<profiles>
    <profile>
        <!-- 开发环境 -->
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <minimize>false</minimize>
            <environment>dev</environment>
            <environment.scope>compile</environment.scope>
            <warOutputDirectory>../deploy/framework/${project.version}</warOutputDirectory>
        </properties>
    </profile>
    <profile>
        <!-- 测试环境 -->
        <id>test</id>
        <properties>
            <environment>test</environment>
            <environment.scope>provided</environment.scope>
            <staticServer>http://10.39.251.210:8088/static</staticServer>
            <warOutputDirectory>framework-test/${project.version}</warOutputDirectory>
        </properties>
    </profile>
    <profile>
        <!-- 生产环境 -->
        <id>product</id>
        <properties>
            <environment>product</environment>
            <environment.scope>provided</environment.scope>
            <staticServer>http://ty.hoau.net:82/static</staticServer>
            <warOutputDirectory>framework-product/${project.version}</warOutputDirectory>
        </properties>
    </profile>
    <profile>
        <!-- 性能测试环境 -->
        <id>performance</id>
        <properties>
            <environment>performance</environment>
            <environment.scope>provided</environment.scope>
            <staticServer>http://10.39.251.210:8088/static</staticServer>
            <warOutputDirectory>framework-performance/${project.version}</warOutputDirectory>
        </properties>
    </profile>
</profiles>
```
##2. 创建war包(packaging->war)
###2.1 包结构  
- 包结构如下图所示

<div  align="center" style = "width:500px;"> 
<img src = 'http://10.39.251.124/hbdp2.0/image/war_structure.png' />
</div>

- 部分文件用途说明
> - context.xml 配置tomcat插件使用的参数
> - log4j.xml 配置日志输出规则
> - applicationContext.xml spring框架主配置文件
> - jboss-web.xml jboss容器特性配置，如获取数据源等
> - mybatis.xml mybatis框架配置文件
> - springMvc.xml springMvc框架配置文件

###2.2 pom配置  
- 修改打包方式为war  
` <packaging>war</packaging> `
- 添加tomcat插件  
```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.tomcat.maven</groupId>
            <artifactId>tomcat6-maven-plugin</artifactId>
            <configuration>
                <url>http://localhost:8080/manager/html</url>
                <server>tomcat-local</server>
                <!--context path-->
                <path>/demo</path> 
                <uriEncoding>UTF-8</uriEncoding>
                <!--端口修改-->
                <port>8077</port>
            </configuration>
        </plugin>
    </plugins>
    <!--最终打包名称-->
    <finalName>ty-report-web</finalName>
</build>
```
- 此war包需要包含的模块依赖配置，此配置在创建完成模块后添加
```xml
<dependencies>
    <dependency>
        <groupId>com.hoau.ty</groupId>
        <artifactId>demo-login</artifactId>
        <version>0.0.1-SNAPSHOT</version>
    </dependency>
</dependencies>
```
###2.3web.xml配置
- spring框架相关配置
```xml
<!-- spring框架配置文件位置设置，包含主配置文件及各个模块在散落的配置 -->
<context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>classpath*:com/hoau/**/server/META-INF/spring.xml,/WEB-INF/applicationContext.xml</param-value>
</context-param>
<!-- spring容器加载监听，读取applicationContext配置初始化容器 -->
<listener>
    <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
</listener>
<!-- 请求编码过滤器 -->
<filter>
    <filter-name>encoding</filter-name>
    <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
    <init-param>
        <param-name>encoding</param-name>
        <param-value>UTF-8</param-value>
    </init-param>
    <init-param>
        <param-name>forceRequestEncoding</param-name>
        <param-value>true</param-value>
    </init-param>
</filter>
```
- 开发平台相关配置
```xml
<!-- 静态资源服务器地址配置，用于获取通用的资源文件(ext、首页图片等)，服务器地址通过profile进行指定 -->
<context-param>
	<param-name>staticServerAddress</param-name>
	<param-value>${staticServer}</param-value>
</context-param>
<!-- 应用程序上下文监听，用于启动时获取并保存静态资源服务器地址、项目名称、上下文名称等信息 -->
<listener>
	<listener-class>com.hoau.hbdp.framework.server.deploy.AppContextListener</listener-class>
</listener>
<!-- 开发平台框架过滤器，初始化时(服务启动时)将依次将jsp、js、css、image释放到指定的位置，并在每次请求时初始化SessionContext中数据 -->
<filter>
    <filter-name>frameworkFilter</filter-name>
    <filter-class>com.hoau.hbdp.framework.server.web.filter.FrameworkFilter</filter-class>
</filter>
<!-- 日志记录过滤器 -->
<filter>
    <filter-name>logFilter</filter-name>
    <filter-class>com.hoau.hbdp.framework.server.web.filter.LogFilter</filter-class>
</filter>
```

- springMvc框架相关配置
```xml
<!-- springMvc请求处理主servlet，手动指定其配置文件路径 -->
<servlet>
	<servlet-name>springMvc</servlet-name>
	<servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
	<init-param>
		<param-name>contextConfigLocation</param-name>
		<param-value>/WEB-INF/springMvc.xml</param-value>
	</init-param>
	<load-on-startup>1</load-on-startup>
</servlet>
```
- 其他配置
```xml
<!-- jndi数据源配置，由web容器提供 -->
<resource-ref>
    <res-ref-name>jdbc/crmds</res-ref-name>
    <res-type>javax.sql.DataSource</res-type>
    <res-auth>Container</res-auth>
</resource-ref>
<!-- 欢迎页配置 -->
<welcome-file-list>
    <welcome-file>index.jsp</welcome-file>
</welcome-file-list>
```

###2.4 applicationContext.xml配置
- 注解扫描配置
```xml
<!-- 指定注解扫描的包路径，配置此参数默认开启注解扫描，不需要配置<context:annotation-config /> -->
<context:component-scan base-package="com.hoau" />
```
- 数据源配置  
可指定多个数据源，配置读写分离库，多个数据源都要在web.xml中进行配置
```xml
<!-- 写库数据源 jndi方式 -->
<bean id="dataSourceSpied" class="org.springframework.jndi.JndiObjectFactoryBean">
    <property name="jndiName">
        <value>jdbc/butterflyds</value>
    </property>
    <property name="resourceRef" value="true" />
</bean>
<!-- 配置可以记录脚本执行日志的数据源代理 -->
<bean id="dataSource" class="net.sf.log4jdbc.Log4jdbcProxyDataSource">
    <constructor-arg ref="dataSourceSpied" />
</bean>
<!-- 读库数据源 -->
<bean id="slaveDataSourceSpied" class="org.springframework.jndi.JndiObjectFactoryBean">
    <property name="jndiName">
        <value>jdbc/slaveds</value>
    </property>
    <property name="resourceRef" value="true" />
</bean>
```
- 事务管理配置
```xml
<!-- 事务管理器配置，使用spring进行事务管理 -->
<bean id="transactionManager"
      class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
    <property name="dataSource" ref="dataSource" />
</bean>
<!-- 开启注解声明式事务 -->
<tx:annotation-driven transaction-manager="transactionManager" />
```
- mybatis相关配置
```xml
<!-- 配置mybatis对应的数据源及配置文件位置 -->
<bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
    <property name="configLocation" value="/WEB-INF/mybatis.xml" />
    <property name="dataSource" ref="dataSource"/>
</bean>
<!-- 开启mapper文件自动扫描，并定义扫描包范围，为mapper指定SqlSession的生成方式 -->
<bean class="org.mybatis.spring.mapper.MapperScannerConfigurer">
    <property name="basePackage" value="com.hoau.**.dao" />
    <property name="sqlSessionFactoryBeanName" value="sqlSessionFactory" />
</bean>
```
- Redis缓存服务器配置
```xml
<!-- 连接池配置 -->
<bean id="poolConfig" class="redis.clients.jedis.JedisPoolConfig">
    <property name="maxActive" value="${redis.pool.maxActive}"></property>
    <property name="maxIdle" value="${redis.pool.maxIdle}"></property>
    <property name="maxWait" value="${redis.pool.maxWait}"></property>
    <property name="testOnBorrow" value="${redis.pool.testOnBorrow}"></property>
    <property name="testOnReturn" value="${redis.pool.testOnReturn}"></property>
</bean>
<!-- 开发平台的Client配置 -->
<bean id="client" class="com.hoau.hbdp.framework.cache.redis.RedisClient">
    <property name="host1" value="${redis.host1}"></property>
    <property name="port1" value="${redis.port1}"></property>
    <property name="host2" value="${redis.host2}"></property>
    <property name="port2" value="${redis.port2}"></property>
    <property name="poolConfig" ref="poolConfig"></property>
</bean>
<!-- 开发平台缓存存取实现类 -->
<bean id="storage"
      class="com.hoau.hbdp.framework.cache.storage.RedisCacheStorage">
    <property name="client" ref="client"></property>
</bean>
```
- quartz Job配置
```xml
<!-- quartz配置文件加载工场类 -->
<bean id="config" class="com.hoau.hbdp.framework.server.components.jobgrid.SimpleConfigFactory">
    <!-- 数据库类型配置，涉及到操作quartz相关表时的数据库代理类不同 -->
    <property name="dbType" value="mysql"/>
    <!-- 此应用服务器执行job的实例名，用于多台应用进行集群时进行组区分 -->
    <property name="instanceId" value="TEST-JOB"/>
    <!-- quartz配置表所在的数据源 -->
    <property name="jndiURL" value="java:comp/env/jdbc/crmds"/>
</bean>
<!-- quartz调度配置工场类 -->
<bean id="scheduler" class="org.springframework.scheduling.quartz.SchedulerFactoryBean">
    <property name="quartzProperties" ref="config"/>
</bean>
<!-- 声明当前应用为quartz集群中的一个节点 -->
<bean id="node" class="com.hoau.hbdp.framework.server.components.jobgrid.JobGridNode">
    <property name="scheduler" ref="scheduler"/>
</bean>
```
###2.5 springMvc.xml配置

- @Controller注解扫描
```xml
<!--开启注解扫描，对@Controller注解进行处理，不添加的话不会处理请求-->
<mvc:annotation-driven>
    <mvc:message-converters>
        <ref bean="fastJsonHttpMethodMessageConverter"/>
    </mvc:message-converters>
</mvc:annotation-driven>
<!--扫描@Controller注解的包范围，此范围和applicationContext配置文件中的范围不同，且必须配置-->
<context:component-scan base-package="com.hoau.**.controller" />
```
- fastjson出入参转换器
```xml
<!--fastjson转换器-->
<bean name="fastJsonHttpMethodMessageConverter" class="com.alibaba.fastjson.support.spring.FastJsonHttpMessageConverter4">
    <!--需要进行转换的消息类型配置-->
    <property name="supportedMediaTypes">
        <list>
            <value>text/html;charset=UTF-8</value>
            <value>application/json;charset=UTF-8</value>
        </list>
    </property>
    <property name="fastJsonConfig">
        <bean class="com.alibaba.fastjson.support.config.FastJsonConfig">
            <property name="features">
                <list>
                    <!--单引号-->
                    <value>AllowSingleQuotes</value>
                    <!--属性名不加引号-->
                    <value>AllowUnQuotedFieldNames</value>
                    <!--任意逗号{"a":1,,,"b":2}-->
                    <value>AllowArbitraryCommas</value>
                    <!--关闭循环引用检测-->
                    <value>DisableCircularReferenceDetect</value>
                </list>
            </property>
        </bean>
    </property>
</bean>
```
- 默认视图处理器返回的jsp文件路径配置
```xml
<bean class="org.springframework.web.servlet.view.InternalResourceViewResolver">
    <property name="prefix">
        <value>/WEB-INF/pages/</value>
    </property>
    <property name="suffix">
        <value>.jsp</value>
    </property>
</bean>
```
- 静态资源处理
```xml
<!--静态资源不走DispatchServlet进行处理-->
<mvc:resources mapping="/images/**" location="/images/"/>
<mvc:resources mapping="/scripts/**" location="/scripts/"/>
<mvc:resources mapping="/styles/**" location="/styles/"/>
```
- 拦截器配置
```xml
<mvc:interceptors>
    <!-- cookie校验拦截器(登陆校验) -->
    <mvc:interceptor>
        <mvc:mapping path="/**"/>
        <mvc:exclude-mapping path="/**/images/**"/>
        <mvc:exclude-mapping path="/**/scripts/**"/>
        <mvc:exclude-mapping path="/**/styles/**"/>
        <bean class="com.hoau.hbdp.framework.server.sso.interceptor.ValidateCookieInterceptor">
            <constructor-arg name="userCacheId" value="com.hoau.hbdp.framework.entity.IUser"/>
        </bean>
    </mvc:interceptor>
    <!-- 模块拦截器，设置模块界面使用的el表达式中的值 -->
    <mvc:interceptor>
        <mvc:mapping path="/**"/>
        <mvc:exclude-mapping path="/**/images/**"/>
        <mvc:exclude-mapping path="/**/scripts/**"/>
        <mvc:exclude-mapping path="/**/styles/**"/>
        <bean class="com.hoau.hbdp.framework.server.web.interceptor.ModuleInterceptor"/>
    </mvc:interceptor>
    <!-- 访问权限控制拦截器 -->
    <mvc:interceptor>
        <mvc:mapping path="/**"/>
        <mvc:exclude-mapping path="/**/images/**"/>
        <mvc:exclude-mapping path="/**/scripts/**"/>
        <mvc:exclude-mapping path="/**/styles/**"/>
        <bean class="com.hoau.hbdp.framework.server.web.interceptor.SecurityInterceptor"/>
    </mvc:interceptor>
</mvc:interceptors>
```

##3.创建模块(packaging->jar)
###3.1 包结构
- 包结构如下图所示

<div align="center" style = "width:500px"> 
<img src = 'http://10.39.251.124/hbdp2.0/image/jar_structure.png' />
</div>

- 包命名规则说明

`com.hoau.framework.module.configreport`

    >* com.hoau 公司项目统一包名前缀
* framework 此项目工程名称
* module 模块分割标识
* configreport 当前模块的模块名称，可以为多层目录，如report.base、report.fin、report.transfer等

###3.2 pom配置
- 模块名称配置
此配置用于wro压缩生成压缩文件路径配置中
```xml
<properties>
    <moduleContext>configreport</moduleContext>
</properties>
```
- 启用wro压缩插件
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

###3.3 Controller
- Controller定义
```java
@Controller
@RequestMapping("/configreport/config")
public class QueryConfigController extends BasicController
```

    >* 开发平台的BasicController类做了一些通用功能处理，如国际化、请求异常、json返回格式化等
* RequestMapping注解指定的路径按照  `模块名` + `当前Controller处理的页面名` 的规则进行定义

- 界面跳转方法
```java
@RequestMapping(value = "/index", method = RequestMethod.GET)
public String index() {
    return "queryConfig";
}
```

- GET请求查询数据 

    - queryString模式
```java
@RequestMapping(value = "/queryList", method = RequestMethod.GET)
@ResponseBody
public PageResponse queryList(@ModelAttribute QueryConfigQueryParamVo queryParam) {
    List<QuerySql> sqls = queryConfigService.showPageQuerySql(queryParam.getQueryParams(), queryParam.getStart(), queryParam.getLimit());
    long totalCount = queryConfigService.totalQuerySqlCount(queryParam.getQueryParams());
    return returnSuccess(sqls, totalCount);
}
```

        >* 此处使用GET请求处理数据查询的原因，是Extjs的Store默认使用GET方式进行loadData。如果使用POST方式需要前端修改，后端改动很小。
* 请求参数使用@ModelAttribute进行获取
* PageResponse返回参数包含了查询结果列表以及用于分页的总记录条数，前台Store从`result`属性中读取列表数据， 从`totalCount`属性中读取总行数。也可以将这些数据都封装到一个对象中返回到前台，使用`result`读取详细内容

    - Restful模式
```java
@RequestMapping(value = "/init/{reportNum}", method = RequestMethod.GET)
@ResponseBody
public Response init(@PathVariable String reportNum) {
    return returnSuccess(queryReportService.showQuerySql(reportNum));
}
```
    
        >* 使用@PathVariable获取请求路径上的参数

    - 以流的方式下载文件
```java
@RequestMapping(value = "/exportExcel")
public void exportExcel(HttpServletResponse response,
                        @RequestParam String id,
                        @RequestParam String queryParam) throws IOException {
    ExcelReturn excelReturn = queryReportService.exportExcel(id, queryParam);
    InputStream inputStream = excelReturn.getInputStream();
    //激活下载操作
    OutputStream os = response.getOutputStream();
    //循环写入输出流
    byte[] b = new byte[2048];
    int length;
    while ((length = inputStream.read(b)) > 0) {
        os.write(b, 0, length);
    }
    String mimeType= URLConnection.guessContentTypeFromName(excelReturn.getFileName());
    if(mimeType==null){
        System.out.println("mimetype is not detectable, will take default");
        mimeType = "application/octet-stream";
    }
    response.setContentType(mimeType);
    response.setHeader("Content-Disposition", String.format("inline; filename=\"" + excelReturn.getFileName() +"\""));
    os.close();
    inputStream.close();
}
```

        >* Ajax无法处理数据流，所以无法使用Ajax进行下载文件。Extjs提供了一种方式：创建一个隐藏表单，提交隐藏的表单进行下载
* 使用@RequestParam获取表单中提交的数据
* 需要手动设置浏览器接收的Content-Type

    - 以springMVC特有的方式下载文件
```java
@RequestMapping("download")    
public ResponseEntity<byte[]> download() throws IOException {    
    String path="";  
    File file=new File(path);  
    HttpHeaders headers = new HttpHeaders();    
    String fileName=new String("你好.xlsx".getBytes("UTF-8"),"iso-8859-1");
    headers.setContentDispositionFormData("attachment", fileName);   
    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);   
    return new ResponseEntity<byte[]>(FileUtils.readFileToByteArray(file),    
                                      headers, HttpStatus.CREATED);    
}  
```

        >* 此代码是网上搜索的，`没有实际测试是否可用`
* 此方式是将文件全部写到byte[]数组中返回到客户端，如果下载文件过大过多，会导致服务器`内存溢出`，故demo中未提供此示例


- POST方式提交数据
```java
@RequestMapping(value = "/add", method = RequestMethod.POST)
@ResponseBody
public Response add(@RequestBody QuerySql param) throws UnsupportedEncodingException {
    queryConfigService.saveQuerySql(param);
    return returnSuccess("configreport.config.add.success");
}
```

    >* 使用@RequestBody获取请求参数。与Struts2不同，请求的JSON字符串中，只需要将`QuerySql`对象中的属性直接放在JSON串的第一层即可，不需要再包一层`param`
* 此处返回新增成功的提示消息，BasicController中进行了国际化处理

###3.4 Service
- 数据校验  
    永远不要信赖前台，一定要对数据进行校验
- 事务处理

    >* 使用@Transaction注解声明事务
* try-catch不能保证不会报错

###3.5 Dao

- 序列号生成需要注意中间件缓存的影响
```xml
<select id="getSquence" resultType="string" flushCache="true" useCache="false">
    SELECT SEQUENCE_NAME.NEXTVAL FROM DUAL
</select>
```

###3.6 异常处理
- 开发平台中的BasicController中对异常进行了统一处理，除非是刻意选择需要忽略的异常，其他所有异常都不需要进行catch！
- 需要进行提示的业务层的异常，直接抛出BusinessException
```java
@ExceptionHandler(Exception.class)
@ResponseBody
public Response handlerException(Exception exception) {
    log.error(exception.getMessage(), exception);
    Response response = new Response();
    response.setSuccess(false);

    if (exception instanceof AccessNotAllowException) { //无权访问
        response.setHasBusinessException(true);
        response.setErrorCode(Response.ERROR_CODE_VALIDATE);
        response.setErrorMsg(messageBundle.getMessage(Response.NO_RIGHT_TO_ACCESS_MSG_BUNDLE_KEY));
    } else if (exception instanceof BusinessException) {    //业务异常
        response.setHasBusinessException(true);
        response.setErrorCode(Response.ERROR_CODE_BUSINESS_EXCEPTION);
        response.setErrorMsg(messageBundle.getMessage(((BusinessException)exception).getErrorCode(), ((BusinessException)exception).getErrorArguments()));
    } else { //未捕获异常
        response.setRequestId(RequestContext.getCurrentContext().getRequestId());
        response.setHasBusinessException(false);
        response.setMessage(exception.getMessage());
        response.setErrorCode(Response.ERROR_CODE_UNHANDLED_EXCEPTION);
        response.setErrorMsg(ExceptionUtil.getStack(exception));
    }
    return response;
}
```

###3.7 缓存
####3.7.1 缓存定义
- 定时失效缓存

    - 通过实现`DefaultTTLRedisCache`接口，定义一个定时失效缓存， `IUser`为此缓存存储的值类型
    ```java
    public class UserCache extends DefaultTTLRedisCache<IUser>
    ```
    - 通过实现`ITTLCacheProvider`接口，定义缓存数据的提供者，在的`get`方法中实现数据获取逻辑
    ```java
    @Component
    public class UserCacheProvider implements ITTLCacheProvider<UserEntity> {
        @Resource
        private BodyUserDao bodyUserDao;

        @Override
        public UserEntity get(String key) {
            return bodyUserDao.queryUserEntity(key);
        }
    }
    ```
    - spring.xml中增加缓存bean实例化
    ```xml
    <bean name="userCache" class="com.hoau.framework.module.login.server.cache.UserCache">
        <!-- 数据提供者 -->
        <property name="cacheProvider" ref="userCacheProvider"></property>
        <!-- 缓存存储 -->
        <property name="cacheStorage" ref="storage"></property>
        <!-- 失效时间 -->
        <property name="timeOut" value="60"></property>
    </bean>
    ```

- 基于最后修改时间的定时刷新缓存

    - 通过实现`DefaultStrongRedisCache`接口，定义一个定时刷新缓存，此缓存允许key为任意对象
    ```java
    public class DataDictionaryCache extends DefaultStrongRedisCache<String, DataDictionaryEntity>
    ```
    - 通过实现`IBatchCacheProvider`接口，定义定时刷新缓存的数据提供者,需要实现`getLastModifyTime`和`get`两个方法。 `getLastModifyTime`方法获取数据的最新修改时间，如果最近修改时间大于上次刷新的时间，则将刷新时间之后的数据添加到缓存中
    ```java
    @Component
    public class DataDictionaryCacheProvider implements IBatchCacheProvider<String, DataDictionaryEntity> {
        @Resource
        private BseDataDictionaryValueDao bseDataDictionaryValueDao;
        @Override
        public Date getLastModifyTime() {
            Long version = bseDataDictionaryValueDao.queryLastVersionNo();
            if(version == null){
                version = 0l;
            }
            return new Date(version);
        }

        @Override
        public Map<String, DataDictionaryEntity> get() {
            return new HashMap<String, DataDictionaryEntity>();
        }
    }
    ```
    - spring.xml中增加缓存bean实例化
    ```java
    <bean id="dataDictionaryCache" class="com.hoau.ty.module.bse.baseinfo.server.cache.DataDictionaryCache"
        lazy-init="false">
        <property name="cacheProvider" ref="dataDictionaryCacheProvider"></property>
        <property name="cacheStorage" ref="storage"></property>
        <!-- 一刷新频率 -->
        <property name="interval" value="60"></property>
    </bean>     
    ```

    - 此缓存的策略
        此缓存在后台启动了一个定时调用`refresh`方法的线程，`refresh`方法中调用了`getLastModifyTime`方法判断是否需要刷新，如需要则调用`get`方法获取数据

####3.7.2 缓存使用
- 通过`CacheManager`获取缓存
```java
ICache<String, IUser> cache = CacheManager.getInstance().getCache(IUser.class.getName());
User cacheUser = (User)cache.get(user.getUserName());
```
###3.8 国际化
- 定义国际化文件
    在`resource`目录下的`message_zh_CN.properties`、`message_en_US.properties`等文件中，定义国际化消息

    ```java
    demo.login.UserNullException=用户不存在
    demo.login.UserPasswordErrorException=密码错误
    ```

    ```java
    demo.login.UserNullException=User Not Exists
    demo.login.UserPasswordErrorException=Incorrect Password
    ```
- 返回国际化后的消息
    - 异常信息国际化
    ```java
    LoginException.USER_PASSWORD_ERROR = "demo.login.UserPasswordErrorException";
    throw new LoginException(LoginException.USER_PASSWORD_ERROR);
    ```
    - 返回提示消息国际化
    ```java
    return returnSuccess("configreport.config.add.success");
    ```

###3.9 Job

- 定义job
```java
public class TestJob extends GridJob {

    @Override
    protected void doExecute(JobExecutionContext context) throws JobExecutionException {
        ITestJobService testJobService = getBean("testJobService", ITestJobService.class);
        testJobService.testJob();
    }
}
```

    >* 继承GridJob实现一个可集群的job，重写doExecute方法执行调度任务
* job是通过Quartz反射创建的实例，所以不需要spring进行创建实例
* 由于不是spring创建的实例，实现调度任务的service不能自动注入，需要手动从spring容器取

- 配置job组
    ```sql
    INSERT INTO qrtz_job_plannings (INSTANCE_ID, SCOPE_TYPE, SCOPE_NAME, ACCESS_RULE) VALUES ('TEST-JOB',  1, 'TESTJOB', 1);
    ```

    `INSTANCE_ID`需要和`applicationContext.xml`中配置的相同

- 配置执行周期
```sql
INSERT INTO qrtz_job_schedules (ID, TRIGGER_GROUP, TRIGGER_NAME, JOB_GROUP, JOB_NAME, DESCRIPTION, TRIGGER_TYPE, TRIGGER_EXPRESSION, JOB_CLASS)
VALUES (UUID(), 'TG30', 'TN30', 'TESTJOB', 'TestJob', '测试job',  1, '0 0/1 * * * ?', 'com.hoau.framework.module.login.server.job.TestJob');
```
`JOB_GROUP`需要和`qrtz_job_plannings`表中的`SCOPE_NAME`字段相同



































