'use strict';

module.exports = appInfo => {
  return {
    db: {
      dir: '/home/admin/db', // 生产环境 json 数据目录
    },
    // 日志文件配置
    logger: {
      dir: '/logs/magicBuild/',
      consoleLevel: 'DEBUG',
      appLogName: `${appInfo.name}-web.log`,
      agentLogName: 'egg-agent.log',
      errorLogName: 'common-error.log',
    },
  }
};
