## 基于Node.js构建的轻博客 [![Build Status](https://api.travis-ci.org/chemdemo/nodeblog.png)](http://travis-ci.org/chemdemo/nodeblog)

博客地址：http://www.dmfeel.com

### 简介

* 前端基于Grunt构建项目，采用Requirejs作为模块loader，再配合jQuery操作DOM，基本上都是些普通的Web pages开发。

* 后端基于Node.js Web框架Expressjs，在公司也采用express做过几个小型OA系统供用于监控、活动运营等等，express简单容易上手，也有丰富的文档和教程。view采用[swig](https://github.com/paularmstrong/swig)作为模板引擎，swig提供了强大的过滤器功能以及类Jinja的语法。

* 数据库用的是MongoDB，原生的mongddb驱动不太好控制，故选用了封装ODM风格的mongoose，这样schema看起来清晰，同时mongoose操作db的接口也足够简单。

* 部署选用[digitalocean](https://www.digitalocean.com/)提供的VPS，我选择的是CentOS 6.0 bit-64，使用nginx做node进程的反向代理，再使用Redis做session持久化存储，采用pm2作node进程管理。

### 特点

* markdown格式存储文章内容以及评论内容：markdown的优点相信已经有很多文章来说了，这里不赘述。markdown作为原始数据存储到db，相对于html字符大大缩小，而且对于最终展示的格式是无倾入的，采用任意的的markdown解析器转换成html，再配合相应的css，可以有多种风格的输出。

* 专注阅读体验：整站UI趋于简约化，无论是排版还是配色，都专注增强阅读体验。得益于[marked](https://github.com/chjj/marked)和[highlight.js](https://github.com/isagalaev/highlight.js)项目，代码块支持多种语言的高亮和格式化，并全兼容[GFM](https://help.github.com/articles/github-flavored-markdown)语法。

* 基本功能完整：作为小型博客系统，拥有基本的注册（暂未开放）、登陆（目前社会化登陆暂未开放）、发表文章、发表评论、回复评论、标签归类、归档、搜索等模块，后续可能会增加社会化评论（如多说）、分享、赞等功能。

* 灵活构建：因为使用Grunt构建项目，静态文件的压缩、合并、图片的压缩等工作实现自动化。后台模板吐页面片结合前台Ajax动态拉取、更新数据的方式作前端展现，基于Express提供REST风格的API作数据交换。

### 部署（deploy）

这个项目于2013年9月份写成，当时纯粹是个人练手，也算是nodejs项目的处女作，当时的思路现在看起来有些那啥，假如果有空，考虑重构下（显然，在吹牛）。

下面简单说下怎么部署：

1. `git checkout https://github.com/chemdemo/nodeblog.git`

2. `cd nodeblog && npm i`

3. `cp settings.demo.js settings.js && vim settings.js` 根据需要自己配置

4. 启动redis（确保已经安装配置好了redis），启动命令可参考`bin/redis_restart.sh`，这里推荐将redis注册成开机启动的服务项，否则需要另开终端（或cmd），保持处于redis启动状态

5. 安装配置好mongodb并启动，这个不赘述

6. 命令行启动：`node app`，生产环境部署请移步8

7. 浏览器运行`http://localhost:[YOUR_PORT]`查看效果，注册页面：`/sign`，目前不开放注册，可在`server/controller/routes/index.js`里边打开sign那条路由看效果，其他路由可参看路由配置

8. 生产环境部署（以nginx为例）：

增加nginx配置：
``` bash
upstream blog_svr {
	server 127.0.0.1:[YOUR_PORT];
}

server {
	listen 80;
	server_name www.dmfeel.com dmfeel.com;
	error_log /data/logs/dmfeel.com.error.log error;
	charset utf-8;

	location / {
		proxy_pass http://blog_svr;
	}

	location ~* .*\.(gif|png|jpg|bmp|svg|zip|swf|md|txt|html|htm)$ {
		root /data/sites/www.dmfeel.com/web;
		expires 30d;
	}

	location ~* .*\.(js|css)$ {
		root /data/sites/www.dmfeel.com/web;
		expires 10d;
	}

	location = /favicon.ico {
		root /data/sites/www.dmfeel.com/web;
		access_log    off;
		log_not_found off;
	}
}
```

pm2启动node（推荐）：`pm2 start app.js -i 2` 

forever启动：`sh ./bin/restart.sh`

### 未完成项（TODO list）

* 图片上传，打算直接使用七牛云存储，国内的云存储算是很不错的了，而且文档完善（其实关键还是当家的是个Geek，第一印象是靠谱不会坑人）

* 评论，纠结了很久要不要打开多说评论系统，多说做的不错，不足的是发布内容不能定制，比如不支持markdown，技术博客怎么能够不支持md呢

* SNS登陆，其实打通国内SNS登陆的nodejs模块已经写完了，详见[everyautn-cn](https://github.com/chemdemo/everyauth-cn)，只是考虑到这就一个小小的个人站点demo，整那么多好像没有必要

* UI改版，每次打开blog主页都觉得好丑（完全没设计感的程序猿伤不起），总想着能改的好看点，但下次打开又接着改了，所以一直在微调。。

* 移动端支持，这个不用说了，为了装X，得支持。

### 主要依赖开源项目

* [Bower](http://sindresorhus.com/bower-components/)

* [MongoDB](http://www.mongodb.org/)

* [Mongoose](https://github.com/LearnBoost/mongoose)

* [ExpressJS](http://expressjs.com/)

* [EventProxy](https://github.com/JacksonTian/eventproxy)

* [Async](https://github.com/caolan/async)

* [Underscore](https://github.com/jashkenas/underscore)

* [Grunt](https://github.com/gruntjs/grunt)

* [Requirejs](https://github.com/jrburke/requirejs)

* [Marked](https://github.com/chjj/marked)

* [Swig](https://github.com/paularmstrong/swig)

* [jQuery](http://jquery.com/)

* [Ace](https://github.com/ajaxorg/ace)

* [IcoMoon](http://icomoon.io/app/)
