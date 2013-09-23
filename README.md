## 基于Node.JS构建的轻博客系统

博客地址：http://www.dmfeel.com

### 简介

* 前端基于Grunt构建项目，采用Requirejs模式开发，再配合jQuery操作DOM，基本上都是些普通的Web pages开发。

* 后端基于NodeJS Web框架Expressjs，在公司也采用express做过几个小型OA系统供用于监控、活动运营等等，express简单容易上手，也有丰富的文档和教程。view采用[swig](https://github.com/paularmstrong/swig)作为模板引擎，swig提供了强大的过滤器功能以及类Jinja的语法。

* 数据库用的是MongoDB，原生的mongddb驱动不太好控制，故选用了封装ODM风格的mongoose，这样schema看起来清晰，同时mongoose操作db的接口也足够简单。

* 部署选用[digitalocean](https://www.digitalocean.com/)提供的VPS，我选择的是CentOS 6.0 bit-64，使用nginx做node进程的反向代理，再使用Redis做session持久化存储。

### 特点

* **markdown格式存储文章内容以及评论内容**：markdown的优点相信已经有很多文章来说了，这里不赘述。markdown作为原始数据存储到db，相对于html字符大大缩小，而且对于最终展示的格式是无倾入的，采用任意的的markdown解析器转换成html，再配合相应的css，可以有多种风格的输出。

* **专注阅读体验**：整站UI趋于简约化，无论是排版还是配色，都专注增强阅读体验。得益于[marked](https://github.com/chjj/marked)和[highlight.js](https://github.com/isagalaev/highlight.js)项目，代码块支持多种语言的高亮和格式化，并全兼容[GFM](https://help.github.com/articles/github-flavored-markdown)语法。

* **基本功能完整**：作为小型博客系统，拥有基本的注册（暂未开放）、登陆（目前社会化登陆暂未开放）、发表文章、发表评论、回复评论、标签归类、归档、搜索等模块，后续可能会增加社会化评论（如多说）、分享、赞等功能。

* **灵活构建**：因为使用Grunt构建项目，静态文件的压缩、合并、图片的压缩等工作实现自动化。后台模板吐页面片结合前台Ajax动态拉取、更新数据的方式作前端展现，基于Express提供REST风格的API作数据交换。

### 主要依赖开源项目s

* **[NodeJS](http://nodejs.org/)**

* **[MongoDB](http://www.mongodb.org/)**

* **[Mongoose](https://github.com/LearnBoost/mongoose)**

* **[Expressjs](http://expressjs.com/)**

* **[EventProxy](https://github.com/JacksonTian/eventproxy)**

* **[Async](https://github.com/caolan/async)**

* **[Underscore](https://github.com/jashkenas/underscore)**

* **[Grunt](https://github.com/gruntjs/grunt)**

* **[Requirejs](https://github.com/jrburke/requirejs)**

* **[Marked](https://github.com/chjj/marked)**

* **[Swig](https://github.com/paularmstrong/swig)**

* **[jQuery](http://jquery.com/)**

* **[Ace](https://github.com/ajaxorg/ace)**

* **[IcoMoon](http://icomoon.io/app/)**
